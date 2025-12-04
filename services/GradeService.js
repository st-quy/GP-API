const { Op, where } = require('sequelize');
const {
  Session,
  SessionParticipant,
  StudentAnswer,
  User,
  Topic,
  Question,
  Part,
  Section,
  Skill,
} = require('../models'); // Ensure models are imported
const {
  skillMapping,
  pointsPerQuestion,
  level,
  skillMappingLevel,
} = require('../helpers/constants');

async function getParticipantExamBySession(req) {
  try {
    const { sessionParticipantId, skillName } = req.query;
    const formattedSkillName = skillMapping[skillName.toUpperCase()] || null;

    if (!sessionParticipantId || !skillName) {
      return {
        status: 400,
        message: 'Missing required fields: sessionParticipantId or skillName',
      };
    }

    const sessionParticipant = await SessionParticipant.findByPk(
      sessionParticipantId,
      {
        include: [
          { model: User },
          { model: Session, include: [{ model: Topic }] },
        ],
      }
    );

    if (!sessionParticipant) {
      return {
        status: 404,
        message: 'Session participant not found',
      };
    }

    const topic = await Topic.findByPk(sessionParticipant.Session.examSet, {
      include: [
        {
          model: Part,
          as: 'Parts',
          required: true,
          order: [['Sequence', 'ASC']],
          include: [
            {
              model: Question,
              as: 'Questions',
              required: true,
              order: [['Sequence', 'ASC']],
            },
            {
              model: Skill,
              as: 'Skill',
              where: {
                Name: skillName.toUpperCase(),
              },
              required: true,
            },
          ],
        },
      ],
    });

    if (!topic) {
      return {
        status: 404,
        message: 'Topic not found',
      };
    }

    // Filter parts that have non-empty Questions array
    topic.Parts = topic.Parts.filter(
      (part) => part.Questions && part.Questions.length > 0
    );

    const studentAnswers = await StudentAnswer.findAll({
      where: {
        StudentID: sessionParticipant.UserID,
        TopicID: sessionParticipant.Session.examSet,
        SessionID: sessionParticipant.SessionID,
      },
      include: [
        {
          model: Question,
          as: 'Question',
          include: [
            {
              model: Part,
              as: 'Part',
              include: [{ model: Skill, as: 'Skill' }],
            },
          ],
        },
      ],
    });

    const answerMap = new Map();
    studentAnswers.forEach((answer) => {
      answerMap.set(answer.QuestionID, answer);
    });

    topic.Parts = topic.Parts.map((part) => {
      part.Questions = part.Questions.map((question) => {
        const studentAnswer = answerMap.get(question.ID);
        if (studentAnswer) {
          question.dataValues.studentAnswer = studentAnswer;
        }
        return question;
      });
      return part;
    });

    return {
      status: 200,
      data: {
        topic,
        scoreBySkill: sessionParticipant[formattedSkillName],
      },
    };
  } catch (error) {
    throw new Error(`Error fetching participant exams: ${error.message}`);
  }
}

async function suggestLevels(score, skillName) {
  try {
    if (skillName === 'LISTENING') {
      if (score < 8) return level.X;
      else if (score < 16) return level.A1;
      else if (score < 24) return level.A2;
      else if (score < 34) return level.B1;
      else if (score < 42) return level.B2;
      else return level.C;
    }

    if (skillName === 'READING') {
      if (score < 8) return level.X;
      else if (score < 16) return level.A1;
      else if (score < 26) return level.A2;
      else if (score < 38) return level.B1;
      else if (score < 46) return level.B2;
      else return level.C;
    }

    if (skillName === 'WRITING') {
      if (score < 6) return level.X;
      else if (score < 18) return level.A1;
      else if (score < 26) return level.A2;
      else if (score < 40) return level.B1;
      else if (score < 48) return level.B2;
      else return level.C;
    }

    if (skillName === 'SPEAKING') {
      if (score < 4) return level.X;
      else if (score < 16) return level.A1;
      else if (score < 26) return level.A2;
      else if (score < 41) return level.B1;
      else if (score < 48) return level.B2;
      else return level.C;
    }
  } catch (error) {
    throw new Error(error.message);
  }
}

async function calculateTotalPoints(
  sessionParticipantId,
  skillName,
  skillScore
) {
  try {
    const participant = await SessionParticipant.findOne({
      where: { ID: sessionParticipantId },
    });

    if (!participant) {
      return {
        status: 404,
        message: 'Session participant not found',
      };
    }

    const listening =
      skillName === skillMapping.LISTENING
        ? skillScore
        : participant.Listening || 0;
    const reading =
      skillName === skillMapping.READING
        ? skillScore
        : participant.Reading || 0;
    const writing =
      skillName === skillMapping.WRITING
        ? skillScore
        : participant.Writing || 0;
    const speaking =
      skillName === skillMapping.SPEAKING
        ? skillScore
        : participant.Speaking || 0;

    const totalPoints = listening + reading + writing + speaking;

    const levelSkill = await suggestLevels(skillScore, skillName.toUpperCase());

    if (skillName === skillMapping['GRAMMAR AND VOCABULARY']) {
      await SessionParticipant.update(
        { [skillName]: skillScore },
        { where: { ID: sessionParticipantId } }
      );
    } else {
      await SessionParticipant.update(
        {
          [skillName]: skillScore,
          [skillMappingLevel[skillName.toUpperCase()]]: levelSkill,
          Total: totalPoints,
        },
        { where: { ID: sessionParticipantId } }
      );
    }

    return {
      totalPoints,
      levelSkill,
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

async function calculatePoints(req) {
  try {
    const { sessionParticipantId, skillName } = req.body;

    if (!sessionParticipantId || !skillName) {
      return {
        status: 400,
        message: 'Missing required fields: sessionParticipantId or skillName',
      };
    }

    const formattedSkillName = skillMapping[skillName.toUpperCase()] || null;

    if (!formattedSkillName) {
      return {
        status: 400,
        message: `Invalid skill name: ${skillName}`,
      };
    }

    const pointPerQuestion =
      pointsPerQuestion[formattedSkillName.toLowerCase()] || 1;

    const sessionParticipant = await SessionParticipant.findByPk(
      sessionParticipantId,
      {
        include: [{ model: Session }],
      }
    );

    const answers = await StudentAnswer.findAll({
      where: {
        StudentID: sessionParticipant.UserID,
        TopicID: sessionParticipant.Session.examSet,
        SessionID: sessionParticipant.SessionID,
      },
      include: [
        {
          model: Question,
          as: 'Question',
          include: [
            {
              model: Part,
              as: 'Part',
              include: [{ model: Skill, as: 'Skill' }],
            },
          ],
        },
      ],
    });

    if (answers.length === 0) {
      return { status: 404, message: 'No answers found for the student' };
    }

    let totalPoints = 0;
    const logs = [];

    answers.forEach((answer) => {
      if (!answer.AnswerText) return;

      const questionId = answer.QuestionID;
      const type = answer.Question.Type;
      const skillType = answer.Question.Part.Skill.Name;

      if (skillType !== skillName) return;

      const correctContent = answer.Question.AnswerContent;
      const rawStudentAnswer = answer.AnswerText;
      let isCorrect = false;

      const logItem = {
        questionId,
        type,
        studentAnswer: null,
        correctAnswer: null,
        result: 'incorrect',
        pointAdded: 0,
      };

      // ================================
      // MULTIPLE CHOICE
      // ================================
      if (type === 'multiple-choice') {
        const stu = rawStudentAnswer.trim();
        const cor = correctContent.correctAnswer.trim();

        logItem.studentAnswer = stu;
        logItem.correctAnswer = cor;

        if (stu === cor) {
          isCorrect = true;
          totalPoints += pointPerQuestion;
        }
      }

      // ================================
      // MATCHING
      // ================================
      else if (type === 'matching') {
        const studentAnswers = JSON.parse(rawStudentAnswer);
        const correctAnswers = correctContent.correctAnswer;

        logItem.studentAnswer = studentAnswers;
        logItem.correctAnswer = correctAnswers;

        correctAnswers.forEach((correct) => {
          const matched = studentAnswers.find(
            (s) =>
              s.left.trim() === correct.left.trim() &&
              s.right.trim() === correct.right.trim()
          );
          if (matched) {
            isCorrect = true;
            totalPoints += pointPerQuestion;
          }
        });
      }

      // ================================
      // ORDERING
      // ================================
      else if (type === 'ordering') {
        const studentAnswers = JSON.parse(rawStudentAnswer).sort(
          (a, b) => a.value - b.value
        );
        const correctAnswers = correctContent.correctAnswer;

        logItem.studentAnswer = studentAnswers;
        logItem.correctAnswer = correctAnswers;

        const minLength = Math.min(
          studentAnswers.length,
          correctAnswers.length
        );

        for (let i = 0; i < minLength; i++) {
          if (studentAnswers[i].key.trim() === correctAnswers[i].key.trim()) {
            isCorrect = true;
            totalPoints += pointPerQuestion;
          }
        }
      } else if (type === "dropdown-list") {
        let studentAnswers = [];
        try {
          studentAnswers = JSON.parse(answer.AnswerText);
        } catch (e) {
          console.error("Error parsing dropdown answer:", e);
        }
        const correctAnswers = correctContent.correctAnswer.filter(
          (item) => item.key !== "0"
        );
        const normalizeKey = (k) => String(k).trim().replace(/\.$/, "");
        correctAnswers.forEach((correct) => {
          const correctKey = normalizeKey(correct.key);
          const match = studentAnswers.find((sa) => normalizeKey(sa.key) === correctKey);
          if (
            match && String(match.value).trim() === String(correct.value).trim())
             {
            totalPoints += pointPerQuestion;
          }
        });
      } else if (type === "listening-questions-group") {
        const studentAnswers = JSON.parse(answer.AnswerText);
        const correctList = correctContent.groupContent.listContent;

        correctList.forEach((question) => {
          const studentAnswer = studentAnswers.find(
            (ans) => ans.ID === question.ID
          );
          if (
            studentAnswer &&
            studentAnswer.answer === question.correctAnswer
          ) {
            isCorrect = true;
            totalPoints += pointPerQuestion;
          }
        });
      }

      // ================================
      // LISTENING GROUP
      // ================================
      else if (type === 'listening-questions-group') {
        const studentAnswers = JSON.parse(rawStudentAnswer);
        const correctList = correctContent.groupContent.listContent;

        logItem.studentAnswer = studentAnswers;
        logItem.correctAnswer = correctList;

        correctList.forEach((q) => {
          const stu = studentAnswers.find((x) => x.ID === q.ID);

          if (stu && stu.answer.trim() === q.correctAnswer.trim()) {
            isCorrect = true;
            totalPoints += pointPerQuestion;
          }
        });
      }

      // ================================
      // Finalize tracking
      // ================================
      logItem.result = isCorrect ? 'correct' : 'incorrect';
      logItem.pointAdded = isCorrect ? pointPerQuestion : 0;

      logs.push(logItem);
    });

    totalPoints = parseFloat(totalPoints.toFixed(1));

    await calculateTotalPoints(
      sessionParticipantId,
      formattedSkillName,
      totalPoints
    );

    const updatedSessionParticipant = await SessionParticipant.findByPk(
      sessionParticipantId
    );

    return {
      message: 'Points calculated successfully',
      points: totalPoints,
      tracking: logs,
      sessionParticipant: updatedSessionParticipant,
    };
  } catch (error) {
    throw new Error(`Error calculating points: ${error.message}`);
  }
}

async function calculatePointForWritingAndSpeaking(req) {
  const {
    sessionParticipantID,
    teacherGradedScore,
    skillName,
    studentAnswers,
  } = req.body;
  try {
    if (
      !sessionParticipantID ||
      typeof teacherGradedScore !== 'number' ||
      teacherGradedScore < 0 ||
      !skillName
    ) {
      return {
        status: 400,
        message:
          'Missing or invalid required fields: sessionParticipantID, teacherGradedScore or skillName',
      };
    }

    if (skillName !== 'WRITING' && skillName !== 'SPEAKING') {
      return {
        status: 400,
        message: `Invalid skill name: ${skillName}`,
      };
    }

    if (
      typeof teacherGradedScore !== 'number' ||
      teacherGradedScore < 0 ||
      teacherGradedScore > 50
    ) {
      return {
        status: 400,
        message: 'Invalid teacher graded score',
      };
    }

    if (studentAnswers) {
      studentAnswers.forEach(({ studentAnswerId }, index) => {
        if (!studentAnswerId) {
          throw new Error(`Missing studentAnswerId at index ${index}`);
        }
      });

      await Promise.all(
        studentAnswers.map(({ studentAnswerId, messageContent }) =>
          StudentAnswer.update(
            { Comment: messageContent ?? '' },
            { where: { ID: studentAnswerId } }
          )
        )
      );
    }

    const totalPoints = teacherGradedScore;
    const formattedSkillName = skillMapping[skillName.toUpperCase()] || null;
    await calculateTotalPoints(
      sessionParticipantID,
      formattedSkillName,
      totalPoints
    );

    const updatedSessionParticipant = await SessionParticipant.findOne({
      where: { ID: sessionParticipantID },
    });
    return {
      status: 200,
      message: 'Writing points calculated successfully',
      data: {
        sessionParticipant: updatedSessionParticipant[formattedSkillName],
      },
    };
  } catch (error) {
    return {
      status: 500,
      message: `Internal server error: ${error.message}`,
    };
  }
}
async function getFullExamReview(sessionParticipantId) {
  try {
    // 1. Lấy thông tin Participant
    const sessionParticipant = await SessionParticipant.findByPk(
      sessionParticipantId,
      {
        include: [
          {
            model: User,
            attributes: ["ID", "firstName", "lastName", "email", "studentCode"],
          },
          {
            model: Session,
            attributes: ["ID", "sessionName", "startTime", "endTime", "examSet"],
            include: [{ model: Topic, attributes: ["ID", "Name"] }],
          },
        ],
      }
    );

    if (!sessionParticipant) {
      return { status: 404, message: "Session participant not found" };
    }

    // 2. Lấy Topic kèm theo Sections và Parts
    // [FIX] Thêm include Section để lấy dữ liệu đúng cấu trúc
    const topic = await Topic.findByPk(sessionParticipant.Session.examSet, {
      include: [
        {
          model: Section,
          as: 'Sections',
          required: false,
          include: [
            {
              model: Part,
              as: 'Parts',
              required: false,
              include: [
                {
                  model: Question,
                  as: 'Questions',
                  required: false,
                },
                 {
                  model: Skill,
                  as: 'Skill',
                  required: false,
                  attributes: ["Name"]
                },
              ],
            }
          ]
        },
      
      ],
    });

    if (!topic) {
      return { status: 404, message: "Topic data not found" };
    }

    // 3. Lấy câu trả lời
    const studentAnswers = await StudentAnswer.findAll({
      where: {
        StudentID: sessionParticipant.UserID,
        SessionID: sessionParticipant.SessionID,
      },
    });

    const answerMap = new Map();
    studentAnswers.forEach((ans) => {
      answerMap.set(ans.QuestionID, ans);
    });

    // 4. Chuẩn bị object reviewData
    const reviewData = {
      speaking: { score: sessionParticipant.Speaking, level: sessionParticipant.SpeakingLevel, questions: [] },
      listening: { score: sessionParticipant.Listening, level: sessionParticipant.ListeningLevel, questions: [] },
      reading: { score: sessionParticipant.Reading, level: sessionParticipant.ReadingLevel, questions: [] },
      writing: { score: sessionParticipant.Writing, level: sessionParticipant.WritingLevel, questions: [] },
      grammar: { score: sessionParticipant.GrammarVocab, level: sessionParticipant.GrammarVocabLevel, questions: [] },
    };

    const getSkillKey = (dbName) => {
      if (!dbName) return "grammar";
      const upper = dbName.toUpperCase();
      if (upper === "GRAMMAR AND VOCABULARY") return "grammar";
      return upper.toLowerCase();
    };

    // [FIX] Hàm parse JSON an toàn (Chống crash server)
    const safeParse = (str) => {
        if (typeof str === 'object' && str !== null) return str;
        try { return JSON.parse(str); } catch { return null; }
    };

    // [FIX] Hàm kiểm tra đúng sai an toàn
    const checkCorrectness = (questionType, userAnswerText, correctAnswerContent) => {
      if (!userAnswerText) return false;
      
      // Parse user answer an toàn
      let userAnsObj = userAnswerText;
      if (typeof userAnswerText === 'string') {
          userAnsObj = safeParse(userAnswerText);
      }

      try {
        if (questionType === "multiple-choice") {
          const correctVal = typeof correctAnswerContent?.correctAnswer === 'string' 
            ? correctAnswerContent.correctAnswer 
            : correctAnswerContent?.correctAnswer?.value;
          return String(userAnswerText).trim().toLowerCase() === String(correctVal).trim().toLowerCase();
        }

        if (["dropdown-list", "matching", "ordering"].includes(questionType)) {
          if (!Array.isArray(userAnsObj) || !Array.isArray(correctAnswerContent?.correctAnswer)) return false;
          
          return correctAnswerContent.correctAnswer.every(correctItem => {
            const match = userAnsObj.find(u => 
              (String(u.key) === String(correctItem.key) || String(u.left) === String(correctItem.left))
            );
            if (!match) return false;
            return (String(match.value).trim().toLowerCase() === String(correctItem.value).trim().toLowerCase() || 
                    String(match.right).trim().toLowerCase() === String(correctItem.right).trim().toLowerCase());
          });
        }

        if (questionType === "listening-questions-group") {
           const correctList = correctAnswerContent?.groupContent?.listContent || [];
           if (!Array.isArray(userAnsObj)) return false;
           return correctList.every(subQ => {
             const userSubAns = userAnsObj.find(u => String(u.ID || u.id) === String(subQ.ID));
             return userSubAns && String(userSubAns.answer).trim().toLowerCase() === String(subQ.correctAnswer).trim().toLowerCase();
           });
        }
        return false;
      } catch (e) { return false; }
    };

    // [FIX] Helper xử lý danh sách parts để tái sử dụng
    const processParts = (partsList) => {
        if (!partsList || !Array.isArray(partsList)) return;
        
        partsList.forEach((part) => {
            if (part.Questions && part.Questions.length > 0) {
                part.Questions.forEach((question) => {
                    // Skip nếu question lỗi hoặc không có skill
                    if (!part.Skill || !part.Skill.Name) return;

                    const skillKey = getSkillKey(part.Skill.Name);
                    if (!reviewData[skillKey]) return;

                    const studentAnswer = answerMap.get(question.ID);
                    const answerContent = safeParse(question.AnswerContent);

                    const questionDetail = {
                        id: question.ID,
                        type: question.Type,
                        questionContent: question.Content,
                        partContent: part.Content,
                        subContent: question.SubContent || part.SubContent,
                        resources: {
                            audio: question.AudioKeys,
                            images: question.ImageKeys,
                            groupContent: question.GroupContent,
                            answerContent: answerContent 
                        },
                        userResponse: studentAnswer ? {
                            text: studentAnswer.AnswerText,
                            audio: studentAnswer.AnswerAudio,
                            comment: studentAnswer.Comment
                        } : null,
                        correctAnswer: answerContent ? answerContent.correctAnswer : null,
                        isCorrect: false,
                    };

                    if (studentAnswer) {
                        if (["speaking", "writing"].includes(skillKey)) {
                            questionDetail.isCorrect = true; 
                        } else {
                            questionDetail.isCorrect = checkCorrectness(question.Type, studentAnswer.AnswerText, answerContent);
                        }
                    }
                    
                    reviewData[skillKey].questions.push(questionDetail);
                });
            }
        });
    };

    // 5. Duyệt dữ liệu (Ưu tiên Sections trước)
    let hasData = false;
    
    
    // Case 1: Cấu trúc mới (Topic -> Sections -> Parts)
    if (topic.Sections && topic.Sections.length > 0) {
        topic.Sections.forEach(section => {
            if (section.Parts && section.Parts.length > 0) {
                processParts(section.Parts);
            }
        });
    } 
    
    // Case 2: Cấu trúc cũ (Topic -> Parts trực tiếp)
    // Chỉ chạy nếu Case 1 không có dữ liệu
    // if (topic.Sections && topic.Sections.length > 0) {
      
    //     processParts(topic.Sections?.[0]?.Parts);
    // }

    const startTime = new Date(sessionParticipant.createdAt);
    const endTime = new Date(sessionParticipant.updatedAt);
    let durationMs = endTime - startTime;

    // Đảm bảo không bị số âm (trong trường hợp edge case)
    if (durationMs < 0) durationMs = 0;
    const durationMinutes = Math.floor(durationMs / 60000);

    return {
      status: 200,
      data: {
        participantInfo: {
          studentName: `${sessionParticipant.User.firstName} ${sessionParticipant.User.lastName}`,
          studentId: sessionParticipant.User.studentCode,
          sessionName: sessionParticipant.Session.sessionName,
          totalScore: sessionParticipant.Total,
          finalLevel: sessionParticipant.Level,
          timeSpent: `${durationMinutes > 0 ? durationMinutes : 0}m`,
          date: sessionParticipant.Session.startTime,
        },
        skills: reviewData,
      },
    };
  } catch (error) {
    console.error("Error in getFullExamReview:", error);
    // Trả về lỗi 500 kèm message để dễ debug, thay vì crash server
    return { status: 500, message: `Server Error: ${error.message}` };
  }
}

module.exports = {
  getParticipantExamBySession,
  calculatePoints,
  calculatePointForWritingAndSpeaking,
  getFullExamReview,
};

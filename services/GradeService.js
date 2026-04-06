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
  sequelize,
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

    // =============================
    // 1) FIND SESSION PARTICIPANT
    // =============================
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

    // =========================================
    // 2) LOAD TOPIC → SECTIONS → PARTS → QUESTIONS
    // =========================================
    const topic = await Topic.findByPk(sessionParticipant.Session.examSet, {
      include: [
        {
          model: Section,
          as: 'Sections',
          required: true,
          include: [
            {
              model: Part,
              as: 'Parts',
              required: true,
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
                  where: { Name: skillName.toUpperCase() },
                  required: true,
                },
              ],
              order: [['Sequence', 'ASC']],
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

    // =============================
    // 3) FLATTEN Sections.Parts → topic.Parts
    // =============================
    let flatParts = [];

    topic.Sections.forEach((section) => {
      section.Parts.forEach((p) => flatParts.push(p));
    });

    // Remove parts without questions
    flatParts = flatParts.filter((part) => part.Questions?.length > 0);

    // Gắn vào topic để FE dễ dùng
    topic.dataValues.Parts = flatParts;

    // =============================
    // 4) LOAD STUDENT ANSWERS
    // =============================
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
    studentAnswers.forEach((a) => answerMap.set(a.QuestionID, a));

    // =============================
    // 5) MERGE STUDENT ANSWERS → QUESTIONS
    // =============================
    topic.dataValues.Parts = topic.dataValues.Parts.map((part) => {
      part.Questions = part.Questions.map((question) => {
        const stdAnswer = answerMap.get(question.ID);
        if (stdAnswer) {
          question.dataValues.studentAnswer = stdAnswer;
        }
        return question;
      });

      return part;
    });

    // =========================================
    // RETURN
    // =========================================
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

    if (skillName === 'GRAMMAR AND VOCABULARY') {
      if (score < 8) return level.X;
      else if (score < 16) return level.A1;
      else if (score < 26) return level.A2;
      else if (score < 38) return level.B1;
      else if (score < 46) return level.B2;
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

    const lookupName = (skillName === 'GrammarVocab') ? 'GRAMMAR AND VOCABULARY' : skillName.toUpperCase();
    const levelSkill = await suggestLevels(skillScore, lookupName);

    if (skillName === 'GrammarVocab' || skillName === skillMapping['GRAMMAR AND VOCABULARY']) {
      await SessionParticipant.update(
        { 
          [skillName]: skillScore,
          GrammarVocabLevel: levelSkill
        },
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

        // Check if ALL pairs match (All-or-Nothing logic to match checkCorrectness)
        const allMatched = correctAnswers.every((correct) => {
          return studentAnswers.some(
            (s) =>
              s.left.trim() === correct.left.trim() &&
              s.right.trim() === correct.right.trim()
          );
        });

        if (allMatched && correctAnswers.length > 0) {
          isCorrect = true;
          totalPoints += pointPerQuestion;
        }
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

        // Check if ALL items are in correct order (All-or-Nothing)
        let allCorrect = studentAnswers.length === correctAnswers.length;
        if (allCorrect) {
          for (let i = 0; i < correctAnswers.length; i++) {
            if (studentAnswers[i].key.trim() !== correctAnswers[i].key.trim()) {
              allCorrect = false;
              break;
            }
          }
        }

        if (allCorrect && correctAnswers.length > 0) {
          isCorrect = true;
          totalPoints += pointPerQuestion;
        }
      } else if (type === 'dropdown-list') {
        let studentAnswers = [];
        try {
          studentAnswers = JSON.parse(answer.AnswerText);
        } catch (e) {
          console.error('Error parsing dropdown answer:', e);
        }
        const correctAnswers = correctContent.correctAnswer.filter(
          (item) => item.key !== '0'
        );

        const normalizeKey = (k) => {
          return String(k).trim().split('.')[0];
        };
        correctAnswers.forEach((correct) => {
          const correctKey = normalizeKey(correct.key);

          const match = studentAnswers.find(
            (sa) => normalizeKey(sa.key) === correctKey
          );

          if (
            match &&
            String(match.value).trim() === String(correct.value).trim()
          ) {
            totalPoints += pointPerQuestion;
          }
        });
      } else if (type === 'listening-questions-group') {
        const studentAnswers = JSON.parse(rawStudentAnswer);
        const correctList = correctContent.groupContent.listContent;

        logItem.studentAnswer = studentAnswers;
        logItem.correctAnswer = correctList;

        correctList.forEach((q) => {
          const stu = studentAnswers.find((x) => x.ID === q.ID);

          if (stu && stu.answer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
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

    totalPoints = Math.min(50, parseFloat(totalPoints.toFixed(1)));

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
async function getFullExamReview(sessionParticipantId, user) {
  try {
    // 1. Lấy thông tin Participant
    const sessionParticipant = await SessionParticipant.findByPk(
      sessionParticipantId,
      {
        include: [
          {
            model: User,
            attributes: ['ID', 'firstName', 'lastName', 'email', 'studentCode'],
          },
          {
            model: Session,
            attributes: [
              'ID',
              'sessionName',
              'startTime',
              'endTime',
              'examSet',
              'status',
              'isPublished'
            ],
            include: [{ model: Topic, attributes: ['ID', 'Name'] }],
          },
        ],
      }
    );

    if (!sessionParticipant) {
      return { status: 404, message: 'Session participant not found' };
    }

    if (user && user.role === 'student') {
      const session = sessionParticipant.Session;
      const now = new Date();
      
      if (sessionParticipant.UserID !== user.id) {
        return { status: 403, message: 'Unauthorized access to this review.' };
      }

      if (
        session.status !== 'COMPLETE' || 
        !sessionParticipant.IsPublished || 
        new Date(session.endTime) >= now
      ) {
        return { 
          status: 403, 
          message: 'Chưa thể xem lại bài làm lúc này. Kỳ thi chưa kết thúc hoặc điểm chưa được công bố.' 
        };
      }
    }

    // 2. Lấy Topic kèm theo Sections và Parts
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
                  attributes: ['Name'],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!topic) {
      return { status: 404, message: 'Topic data not found' };
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
      speaking: {
        score: sessionParticipant.Speaking,
        level: sessionParticipant.SpeakingLevel,
        questions: [],
      },
      listening: {
        score: sessionParticipant.Listening,
        level: sessionParticipant.ListeningLevel,
        questions: [],
      },
      reading: {
        score: sessionParticipant.Reading,
        level: sessionParticipant.ReadingLevel,
        questions: [],
      },
      writing: {
        score: sessionParticipant.Writing,
        level: sessionParticipant.WritingLevel,
        questions: [],
      },
      grammar: {
        score: sessionParticipant.GrammarVocab,
        level: sessionParticipant.GrammarVocabLevel,
        questions: [],
      },
    };

    const getSkillKey = (dbName) => {
      if (!dbName) return 'grammar';
      const upper = dbName.toUpperCase();
      if (upper === 'GRAMMAR AND VOCABULARY') return 'grammar';
      return upper.toLowerCase();
    };

    const safeParse = (str) => {
      if (typeof str === 'object' && str !== null) return str;
      try {
        return JSON.parse(str);
      } catch {
        return null;
      }
    };

    const checkCorrectness = (
      questionType,
      userAnswerText,
      correctAnswerContent
    ) => {
      if (!userAnswerText) return false;

      let userAnsObj = userAnswerText;
      if (typeof userAnswerText === 'string') {
        userAnsObj = safeParse(userAnswerText);
      }

      try {
        if (questionType === 'multiple-choice') {
          const correctVal =
            typeof correctAnswerContent?.correctAnswer === 'string'
              ? correctAnswerContent.correctAnswer
              : correctAnswerContent?.correctAnswer?.value;
          return (
            String(userAnswerText).trim().toLowerCase() ===
            String(correctVal).trim().toLowerCase()
          );
        }

        if (['dropdown-list', 'matching', 'ordering'].includes(questionType)) {
          if (
            !Array.isArray(userAnsObj) ||
            !Array.isArray(correctAnswerContent?.correctAnswer)
          )
            return false;

          return correctAnswerContent.correctAnswer.every((correctItem) => {
            const match = userAnsObj.find(
              (u) =>
                String(u.key) === String(correctItem.key) ||
                String(u.left) === String(correctItem.left)
            );
            if (!match) return false;
            return (
              String(match.value).trim().toLowerCase() ===
                String(correctItem.value).trim().toLowerCase() ||
              String(match.right).trim().toLowerCase() ===
                String(correctItem.right).trim().toLowerCase()
            );
          });
        }

        if (questionType === 'listening-questions-group') {
          const correctList =
            correctAnswerContent?.groupContent?.listContent || [];
          if (!Array.isArray(userAnsObj)) return false;
          return correctList.every((subQ) => {
            const userSubAns = userAnsObj.find(
              (u) => String(u.ID || u.id) === String(subQ.ID)
            );
            return (
              userSubAns &&
              String(userSubAns.answer).trim().toLowerCase() ===
                String(subQ.correctAnswer).trim().toLowerCase()
            );
          });
        }
        return false;
      } catch (e) {
        return false;
      }
    };

    const toSequenceNumber = (value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
    };

    const sortBySequence = (items = []) =>
      [...items].sort((a, b) => {
        const seqDiff = toSequenceNumber(a?.Sequence) - toSequenceNumber(b?.Sequence);
        if (seqDiff !== 0) return seqDiff;
        return String(a?.ID || '').localeCompare(String(b?.ID || ''));
      });

    const processParts = (partsList, section) => {
      if (!partsList || !Array.isArray(partsList)) return;

      sortBySequence(partsList).forEach((part) => {
        if (part.Questions && part.Questions.length > 0) {
          sortBySequence(part.Questions).forEach((question) => {
            if (!part.Skill || !part.Skill.Name) return;

            const skillKey = getSkillKey(part.Skill.Name);
            if (!reviewData[skillKey]) return;

            const studentAnswer = answerMap.get(question.ID);
            const answerContent = safeParse(question.AnswerContent);

            const questionDetail = {
              id: question.ID,
              type: question.Type,
              sectionId: section?.ID || null,
              sectionName: section?.Name || null,
              sectionSequence: toSequenceNumber(section?.Sequence),
              partId: part.ID,
              partSequence: toSequenceNumber(part.Sequence),
              questionSequence: toSequenceNumber(question.Sequence),
              questionContent: question.Content,
              partContent: part.Content,
              subContent: question.SubContent || part.SubContent,
              resources: {
                audio: question.AudioKeys,
                images: question.ImageKeys,
                groupContent: question.GroupContent,
                answerContent: answerContent,
              },
              userResponse: studentAnswer
                ? {
                    text: studentAnswer.AnswerText,
                    audio: studentAnswer.AnswerAudio,
                    comment: studentAnswer.Comment,
                  }
                : null,
              correctAnswer: answerContent ? answerContent.correctAnswer : null,
              isCorrect: false,
            };

            if (studentAnswer) {
              if (['speaking', 'writing'].includes(skillKey)) {
                questionDetail.isCorrect = true;
              } else {
                questionDetail.isCorrect = checkCorrectness(
                  question.Type,
                  studentAnswer.AnswerText,
                  answerContent
                );
              }
            }

            reviewData[skillKey].questions.push(questionDetail);
          });
        }
      });
    };

    if (topic.Sections && topic.Sections.length > 0) {
      sortBySequence(topic.Sections).forEach((section) => {
        if (section.Parts && section.Parts.length > 0) {
          processParts(section.Parts, section);
        }
      });
    }

    Object.values(reviewData).forEach((skillReview) => {
      skillReview.questions = sortBySequence(skillReview.questions).sort((a, b) => {
        const sectionDiff = a.sectionSequence - b.sectionSequence;
        if (sectionDiff !== 0) return sectionDiff;

        const partDiff = a.partSequence - b.partSequence;
        if (partDiff !== 0) return partDiff;

        const questionDiff = a.questionSequence - b.questionSequence;
        if (questionDiff !== 0) return questionDiff;

        return String(a.id || '').localeCompare(String(b.id || ''));
      });
    });

    const startTime = new Date(sessionParticipant.createdAt);
    const endTime = new Date(sessionParticipant.updatedAt);
    let durationMs = endTime - startTime;

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
    console.error('Error in getFullExamReview:', error);
    return { status: 500, message: `Server Error: ${error.message}` };
  }
}

module.exports = {
  getParticipantExamBySession,
  calculatePoints,
  calculatePointForWritingAndSpeaking,
  getFullExamReview,
};

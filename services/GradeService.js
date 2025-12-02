const { Op, where } = require("sequelize");
const {
  Session,
  SessionParticipant,
  StudentAnswer,
  User,
  Topic,
  Question,
  Part,
  Skill,
} = require("../models"); // Ensure models are imported
const {
  skillMapping,
  pointsPerQuestion,
  level,
  skillMappingLevel,
} = require("../helpers/constants");

async function getParticipantExamBySession(req) {
  try {
    const { sessionParticipantId, skillName } = req.query;
    const formattedSkillName = skillMapping[skillName.toUpperCase()] || null;

    if (!sessionParticipantId || !skillName) {
      return {
        status: 400,
        message: "Missing required fields: sessionParticipantId or skillName",
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
        message: "Session participant not found",
      };
    }

    const topic = await Topic.findByPk(sessionParticipant.Session.examSet, {
      include: [
        {
          model: Part,
          required: true,
          order: [["Sequence", "ASC"]],
          include: [
            {
              model: Question,
              required: true,
              order: [["Sequence", "ASC"]],
              include: [
                {
                  model: Skill,
                  where: {
                    Name: skillName.toUpperCase(),
                  },
                  required: true,
                },
              ],
            },
          ],
        },
      ],
    });

    if (!topic) {
      return {
        status: 404,
        message: "Topic not found",
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
          include: [
            {
              model: Skill,
              where: {
                Name: skillName.toUpperCase(),
              },
              required: true,
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
    if (skillName === "LISTENING") {
      if (score < 8) return level.X;
      else if (score < 16) return level.A1;
      else if (score < 24) return level.A2;
      else if (score < 34) return level.B1;
      else if (score < 42) return level.B2;
      else return level.C;
    }

    if (skillName === "READING") {
      if (score < 8) return level.X;
      else if (score < 16) return level.A1;
      else if (score < 26) return level.A2;
      else if (score < 38) return level.B1;
      else if (score < 46) return level.B2;
      else return level.C;
    }

    if (skillName === "WRITING") {
      if (score < 6) return level.X;
      else if (score < 18) return level.A1;
      else if (score < 26) return level.A2;
      else if (score < 40) return level.B1;
      else if (score < 48) return level.B2;
      else return level.C;
    }

    if (skillName === "SPEAKING") {
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
        message: "Session participant not found",
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

    if (skillName === skillMapping["GRAMMAR AND VOCABULARY"]) {
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
        message: "Missing required fields: sessionParticipantId or skillName",
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
      include: [{ model: Question, include: [Skill] }],
    });

    if (answers.length === 0) {
      return {
        status: 404,
        message: "No answers found for the student",
      };
    }

    let totalPoints = 0;

    answers.forEach((answer) => {
      if (!answer.AnswerText) {
        return;
      }

      const typeOfQuestion = answer.Question.Type;

      const skillType = answer.Question.Skill.Name;

      if (skillType !== skillName) {
        return;
      }

      const correctContent = answer.Question.AnswerContent;

      if (typeOfQuestion === "multiple-choice") {
        if (correctContent.correctAnswer === answer.AnswerText) {
          totalPoints += pointPerQuestion;
        }
      } else if (typeOfQuestion === "matching") {
        const studentAnswers = JSON.parse(answer.AnswerText);
        const correctAnswers = correctContent.correctAnswer;

        correctAnswers.forEach((correct) => {
          const matched = studentAnswers.find(
            (student) =>
              student.left === correct.left && student.right === correct.right
          );
          if (matched) {
            totalPoints += pointPerQuestion;
          }
        });
      } else if (typeOfQuestion === "ordering") {
        const studentAnswers = JSON.parse(answer.AnswerText).sort(
          (a, b) => a.value - b.value
        );

        const correctAnswers = correctContent.correctAnswer;

        const minLength = Math.min(
          studentAnswers.length,
          correctAnswers.length
        );

        for (let i = 0; i < minLength; i++) {
          if (studentAnswers[i].key === correctAnswers[i].key) {
            totalPoints += pointPerQuestion;
          }
        }
      } else if (typeOfQuestion === "dropdown-list") {
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
      } else if (typeOfQuestion === "listening-questions-group") {
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
            totalPoints += pointPerQuestion;
          }
        });
      }
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
      message: "Points calculated successfully",
      points: totalPoints,
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
      typeof teacherGradedScore !== "number" ||
      teacherGradedScore < 0 ||
      !skillName
    ) {
      return {
        status: 400,
        message:
          "Missing or invalid required fields: sessionParticipantID, teacherGradedScore or skillName",
      };
    }

    if (skillName !== "WRITING" && skillName !== "SPEAKING") {
      return {
        status: 400,
        message: `Invalid skill name: ${skillName}`,
      };
    }

    if (
      typeof teacherGradedScore !== "number" ||
      teacherGradedScore < 0 ||
      teacherGradedScore > 50
    ) {
      return {
        status: 400,
        message: "Invalid teacher graded score",
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
            { Comment: messageContent ?? "" },
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
      message: "Writing points calculated successfully",
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
    // 1. Lấy thông tin Participant, Session và TopicID
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

    // 2. Lấy toàn bộ cấu trúc đề thi (Topic -> Part -> Question)
    const topic = await Topic.findByPk(sessionParticipant.Session.examSet, {
      include: [
        {
          model: Part,
          required: true,
          order: [["Sequence", "ASC"]],
          include: [
            {
              model: Question,
              required: true,
              order: [["Sequence", "ASC"]],
              include: [{ model: Skill, attributes: ["Name"] }],
            },
          ],
        },
      ],
    });

    if (!topic) {
      return { status: 404, message: "Topic data not found" };
    }

    // 3. Lấy toàn bộ câu trả lời của học sinh
    const studentAnswers = await StudentAnswer.findAll({
      where: {
        StudentID: sessionParticipant.UserID,
        SessionID: sessionParticipant.SessionID,
      },
    });

    // Map câu trả lời theo QuestionID để truy xuất nhanh (O(1))
    const answerMap = new Map();
    studentAnswers.forEach((ans) => {
      answerMap.set(ans.QuestionID, ans);
    });

    // 4. Cấu trúc dữ liệu trả về
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

    // Helper: Map tên skill từ DB sang key của object reviewData
    const getSkillKey = (dbName) => {
      const upper = dbName.toUpperCase();
      if (upper === "GRAMMAR AND VOCABULARY") return "grammar";
      return upper.toLowerCase();
    };

    // Helper: Kiểm tra đúng sai (Logic tương tự calculatePoints nhưng trả về boolean/detail)
    const checkCorrectness = (questionType, userAnswerText, correctAnswerContent) => {
      if (!userAnswerText) return false;

      try {
        // 1. Multiple Choice
        if (questionType === "multiple-choice") {
          // Lưu ý: correctAnswer trong DB có thể là string hoặc object tùy seed
          const correctVal = typeof correctAnswerContent.correctAnswer === 'string' 
            ? correctAnswerContent.correctAnswer 
            : correctAnswerContent.correctAnswer?.value; // Fallback nếu cấu trúc lạ
            
          return userAnswerText === correctVal;
        }

        // 2. Dropdown List / Matching / Ordering (Logic tương đồng: so sánh Key-Value)
        if (["dropdown-list", "matching", "ordering"].includes(questionType)) {
          const userAnsObj = JSON.parse(userAnswerText); // Parse JSON câu trả lời
          const correctAnsObj = correctAnswerContent.correctAnswer; // Mảng đáp án đúng

          if (!Array.isArray(userAnsObj) || !Array.isArray(correctAnsObj)) return false;

          // Kiểm tra từng cặp. Nếu sai bất kỳ cặp nào => sai cả câu (hoặc tùy logic chấm điểm)
          // Ở đây ta làm logic: Phải đúng tất cả mới tính là True
          const isAllCorrect = correctAnsObj.every(correctItem => {
            // Tìm item tương ứng trong bài làm của học sinh
            // Matching/Dropdown thường dùng key 'left'/'right' hoặc 'key'/'value'
            const match = userAnsObj.find(u => 
              (u.key === correctItem.key || u.left === correctItem.left)
            );
            
            if (!match) return false;
            return (match.value === correctItem.value || match.right === correctItem.right);
          });

          return isAllCorrect;
        }

        // 3. Listening Group (Câu hỏi chùm)
        if (questionType === "listening-questions-group") {
           // Loại này phức tạp, thường FE sẽ tự render dựa trên listContent. 
           // Backend trả về true nếu tất cả câu con đều đúng.
           const userAnsList = JSON.parse(userAnswerText);
           const correctList = correctAnswerContent.groupContent?.listContent || [];
           
           const isAllCorrect = correctList.every(subQ => {
             const userSubAns = userAnsList.find(u => u.ID === subQ.ID);
             return userSubAns && userSubAns.answer === subQ.correctAnswer;
           });
           return isAllCorrect;
        }

        return false; // Mặc định false cho các loại khác (Writing/Speaking)
      } catch (e) {
        console.error("Error parsing answer for check:", e);
        return false;
      }
    };

    // 5. Duyệt qua từng câu hỏi để xử lý
    topic.Parts.forEach((part) => {
      if (part.Questions && part.Questions.length > 0) {
        part.Questions.forEach((question) => {
          const skillKey = getSkillKey(question.Skill.Name);
          
          // Nếu skill không nằm trong danh sách hỗ trợ thì bỏ qua
          if (!reviewData[skillKey]) return;

          const studentAnswer = answerMap.get(question.ID);
          const answerContent = question.AnswerContent; // Sequelize đã tự parse JSON này

          // Tạo object chi tiết cho câu hỏi
          const questionDetail = {
            id: question.ID,
            type: question.Type,
            questionContent: question.Content, // Nội dung câu hỏi
            partContent: part.Content,         // Tên Part (VD: Part 1)
            subContent: question.SubContent || part.SubContent,
            
            // Dữ liệu cần thiết để render UI câu hỏi (options, audio, image)
            resources: {
              audio: question.AudioKeys,
              images: question.ImageKeys,
              groupContent: question.GroupContent, // Cho bài đọc/nghe chùm
              answerContent: answerContent // Chứa options, leftItems, rightItems...
            },

            // Dữ liệu bài làm của học sinh
            userResponse: studentAnswer ? {
              text: studentAnswer.AnswerText,   // Dạng text hoặc JSON string
              audio: studentAnswer.AnswerAudio, // Link file ghi âm (Speaking)
              comment: studentAnswer.Comment    // Nhận xét của giáo viên (Writing/Speaking)
            } : null,

            // Đáp án đúng (để FE hiển thị so sánh)
            correctAnswer: answerContent ? answerContent.correctAnswer : null,
            
            // Trạng thái đúng sai
            isCorrect: false,
          };

          // Xử lý logic đúng sai
          if (studentAnswer) {
            // Với Speaking/Writing: "Đúng" nghĩa là đã có điểm chấm > 0 hoặc giáo viên đã chấm
            if (["speaking", "writing"].includes(skillKey)) {
               // Logic tùy chỉnh: coi là completed nếu có bài làm
               questionDetail.isCorrect = true; // Hoặc null, vì writing không có đúng/sai tuyệt đối
            } else {
               // Với trắc nghiệm, nối, điền từ: Dùng hàm checkCorrectness
               questionDetail.isCorrect = checkCorrectness(
                 question.Type, 
                 studentAnswer.AnswerText, 
                 answerContent
               );
            }
          }

          // Push vào mảng tương ứng
          reviewData[skillKey].questions.push(questionDetail);
        });
      }
    });

    // 6. Tính toán thời gian làm bài (Mock hoặc tính từ Session nếu có log)
    // Hiện tại DB Session chỉ có startTime/endTime dự kiến, không có real-time log.
    // Ta có thể trả về khoảng thời gian giữa Session startTime và endTime.
    const durationMs = new Date(sessionParticipant.Session.endTime) - new Date(sessionParticipant.Session.startTime);
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
          timeSpent: `${durationMinutes}m`, // Tạm tính
          date: sessionParticipant.Session.startTime,
        },
        skills: reviewData,
      },
    };
  } catch (error) {
    console.error("Error in getFullExamReview:", error);
    throw new Error(`Error fetching full exam review: ${error.message}`);
  }
}

module.exports = {
  getParticipantExamBySession,
  calculatePoints,
  calculatePointForWritingAndSpeaking,
  getFullExamReview,
};

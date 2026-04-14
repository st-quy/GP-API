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
const { sanitizeQuestion } = require('../utils/security');

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
    // 5) MERGE STUDENT ANSWERS → QUESTIONS & SANITIZE
    // =============================
    const userRoles = req.user?.role ? (Array.isArray(req.user.role) ? req.user.role : [req.user.role]) : [];
    const isStudent = userRoles.some(r => r.toLowerCase() === 'student');

    topic.dataValues.Parts = topic.dataValues.Parts.map((part) => {
      part.Questions = part.Questions.map((question) => {
        const stdAnswer = answerMap.get(question.ID);
        if (stdAnswer) {
          question.dataValues.studentAnswer = stdAnswer;
        }

        return sanitizeQuestion(question, isStudent);
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

    // Define normalizeKey function for consistent key normalization
    const normalizeKey = (k) => {
      return String(k || '').trim().split('.')[0];
    };

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

      let pointsForThisQuestion = 0;

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
          pointsForThisQuestion += pointPerQuestion;
        }
      }

        // ================================
        // MATCHING
        // ================================
        else if (type === 'matching') {
          let studentAnswers = [];
          try {
            studentAnswers = JSON.parse(rawStudentAnswer);
          } catch (e) {
            console.error('Error parsing matching answer:', e);
          }
          const correctAnswers = correctContent.correctAnswer;

          logItem.studentAnswer = studentAnswers;
          logItem.correctAnswer = correctAnswers;

          // Build student answers map for direct lookup
          const studentAnswersMap = {};
          studentAnswers.forEach(sa => {
            const key = normalizeKey(sa.left || sa.key || sa.id);
            if (key) {
              studentAnswersMap[key] = sa.right || sa.value || sa.answerText || String(sa);
            }
          });
          
          // Count points for each correct pair (APTIS-180 Partial Credit)
          correctAnswers.forEach((correct) => {
            const correctKey = normalizeKey(correct.left || correct.key || correct.id);
            const correctVal = correct.right || correct.value;
            const userVal = studentAnswersMap[correctKey];
            
            if (String(userVal || '').trim().toLowerCase() === String(correctVal || '').trim().toLowerCase()) {
              isCorrect = true;
              pointsForThisQuestion += pointPerQuestion;
            }
          });
        }

        // ================================
        // ORDERING
        // ================================
        else if (type === 'ordering') {
          let studentAnswers = [];
          try {
            studentAnswers = JSON.parse(rawStudentAnswer);
          } catch (e) {
            console.error('Error parsing ordering answer:', e);
          }
          const correctAnswers = correctContent.correctAnswer;

          logItem.studentAnswer = studentAnswers;
          logItem.correctAnswer = correctAnswers;

          // Build student answers map for direct lookup
          const studentAnswersMap = {};
          studentAnswers.forEach(sa => {
            const key = normalizeKey(sa.key || sa.left || sa.id);
            if (key) {
              studentAnswersMap[key] = sa.key || sa.left || sa.id || String(sa);
            }
          });
          
          // Count points for each correct position (APTIS-180 Partial Credit)
          correctAnswers.forEach((correct, index) => {
            const correctKey = normalizeKey(correct.key || correct.left || correct.id);
            const userVal = studentAnswersMap[correctKey];
            
            if (String(userVal || '').trim() === String(correctKey || '').trim()) {
              isCorrect = true;
              pointsForThisQuestion += pointPerQuestion;
            }
          });
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
           
           // Build student answers map for direct lookup
           const studentAnswersMap = {};
           studentAnswers.forEach(sa => {
             const key = normalizeKey(sa.key || sa.left || sa.id || sa.questionId);
             if (key) {
               studentAnswersMap[key] = sa.value || sa.right || sa.answerText || String(sa);
             }
           });
           
           // Count points for each correct choice (APTIS-180 Partial Credit)
           correctAnswers.forEach((correct) => {
             const correctKey = normalizeKey(correct.key || correct.left || correct.id || correct.questionId);
             const correctVal = correct.value || correct.right;
             const userVal = studentAnswersMap[correctKey];
             
             if (String(userVal || '').trim().toLowerCase() === String(correctVal || '').trim().toLowerCase()) {
               isCorrect = true;
               pointsForThisQuestion += pointPerQuestion;
             }
           });
       } else if (type === 'listening-questions-group') {
        const studentAnswers = JSON.parse(rawStudentAnswer);
        const correctList = correctContent.groupContent.listContent;

        logItem.studentAnswer = studentAnswers;
        logItem.correctAnswer = correctList;

        correctList.forEach((q) => {
          const stu = studentAnswers.find((x) => x.ID === q.ID);

          if (
            stu &&
            stu.answer.trim().toLowerCase() ===
              q.correctAnswer.trim().toLowerCase()
          ) {
            isCorrect = true;
            pointsForThisQuestion += pointPerQuestion;
          }
        });
      }

      // ================================
      // Finalize tracking
      // ================================
      totalPoints += pointsForThisQuestion;
      logItem.result = isCorrect ? 'correct' : 'incorrect';
      logItem.pointAdded = pointsForThisQuestion;

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

    const userRoles = Array.isArray(user?.role) ? user.role : [user?.role];
    if (user && userRoles.includes('student')) {
      const session = sessionParticipant.Session;
      
      if (sessionParticipant.UserID !== user.userId) {
        return { status: 403, message: 'Unauthorized access to this review.' };
      }

      if (
        !sessionParticipant.IsPublished 
      ) {
        return { 
          status: 403, 
          message: 'Chưa thể xem lại bài làm lúc này. Điểm chưa được công bố cho bạn.' 
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

    const getCorrectnessMap = (
      questionType,
      userAnswerText,
      correctAnswerContent
    ) => {
      if (!userAnswerText || !correctAnswerContent) return null;

      const normalizeKey = (k) => String(k || '').trim().split('.')[0];
      const safeParse = (str) => {
        if (typeof str === 'object' && str !== null) return str;
        try { return JSON.parse(str); } catch { return null; }
      };

      let userAnsObj = userAnswerText;
      if (typeof userAnswerText === 'string') {
        userAnsObj = safeParse(userAnswerText);
      }

      try {
        const type = (questionType || '').toLowerCase();
        const map = {};

        // 1) MULTIPLE CHOICE
        if (type === 'multiple-choice') {
          const correctVal = typeof correctAnswerContent.correctAnswer === 'string'
            ? correctAnswerContent.correctAnswer
            : correctAnswerContent.correctAnswer?.value || '';
          
          const isCorrect = String(userAnswerText).trim().toLowerCase() === String(correctVal).trim().toLowerCase();
          map['default'] = isCorrect;
          return map;
        }

        // 2) DROPDOWN / MATCHING / ORDERING
        if (['dropdown-list', 'matching', 'ordering', 'dropdown-matching', 'full-matching'].includes(type)) {
          const correctAnswers = Array.isArray(correctAnswerContent.correctAnswer)
            ? correctAnswerContent.correctAnswer
            : [];
          
          if (!Array.isArray(userAnsObj)) return null;

          const studentAnswersMap = {};
          userAnsObj.forEach(sa => {
            const key = normalizeKey(sa.left || sa.key || sa.id || sa.questionId);
            if (key) {
              studentAnswersMap[key] = sa.right || sa.value || sa.answerText || String(sa);
            }
          });

          correctAnswers.forEach((correct) => {
            const correctKey = normalizeKey(correct.left || correct.key || correct.id || correct.questionId);
            if (correctKey === '0') return;

            const correctVal = correct.right || correct.value;
            const userVal = studentAnswersMap[correctKey];
            
            map[correctKey] = String(userVal || '').trim().toLowerCase() === String(correctVal || '').trim().toLowerCase();
          });
          return map;
        }

        // 3) LISTENING GROUP
        if (type === 'listening-questions-group') {
          const correctList = correctAnswerContent.groupContent?.listContent || [];
          if (!Array.isArray(userAnsObj)) return null;

          correctList.forEach((subQ) => {
            const subID = String(subQ.ID || subQ.id);
            const userSubAns = userAnsObj.find(
              (u) => String(u.ID || u.id) === subID
            );
            const userVal = userSubAns ? (userSubAns.answer || userSubAns.value) : null;
            map[subID] = String(userVal || '').trim().toLowerCase() === String(subQ.correctAnswer || '').trim().toLowerCase();
          });
          return map;
        }

        return null;
      } catch (e) {
        console.error('Error in getCorrectnessMap:', e);
        return null;
      }
    };

    const checkCorrectness = (
      questionType,
      userAnswerText,
      correctAnswerContent
    ) => {
      if (!userAnswerText || !correctAnswerContent) return false;

      const normalizeKey = (k) => {
        return String(k || '').trim().split('.')[0];
      };

      const safeParse = (str) => {
        if (typeof str === 'object' && str !== null) return str;
        try {
          return JSON.parse(str);
        } catch {
          return null;
        }
      };

      let userAnsObj = userAnswerText;
      if (typeof userAnswerText === 'string') {
        userAnsObj = safeParse(userAnswerText);
      }

      try {
        const type = (questionType || '').toLowerCase();

        // 1) MULTIPLE CHOICE
        if (type === 'multiple-choice') {
          const correctVal = typeof correctAnswerContent.correctAnswer === 'string'
            ? correctAnswerContent.correctAnswer
            : correctAnswerContent.correctAnswer?.value || '';
          
          return String(userAnswerText).trim().toLowerCase() === String(correctVal).trim().toLowerCase();
        }

        // 2) DROPDOWN / MATCHING / ORDERING (All-or-Nothing)
        if (['dropdown-list', 'matching', 'ordering', 'dropdown-matching', 'full-matching'].includes(type)) {
          const correctAnswers = Array.isArray(correctAnswerContent.correctAnswer)
            ? correctAnswerContent.correctAnswer
            : [];
          
          if (correctAnswers.length === 0) return false;
          if (!Array.isArray(userAnsObj)) return false;

          const studentAnswersMap = {};
          userAnsObj.forEach(sa => {
            const key = normalizeKey(sa.left || sa.key || sa.id || sa.questionId);
            if (key) {
              studentAnswersMap[key] = sa.right || sa.value || sa.answerText || String(sa);
            }
          });

          return correctAnswers.every((correct) => {
            const correctKey = normalizeKey(correct.left || correct.key || correct.id || correct.questionId);
            if (correctKey === '0') return true; // Skip "done for you" items if any

            const correctVal = correct.right || correct.value;
            const userVal = studentAnswersMap[correctKey];
            
            return String(userVal || '').trim().toLowerCase() === String(correctVal || '').trim().toLowerCase();
          });
        }

        // 3) LISTENING GROUP (All-or-Nothing for the group)
        if (type === 'listening-questions-group') {
          const correctList = correctAnswerContent.groupContent?.listContent || [];
          if (correctList.length === 0) return false;
          if (!Array.isArray(userAnsObj)) return false;

          return correctList.every((subQ) => {
            const userSubAns = userAnsObj.find(
              (u) => String(u.ID || u.id) === String(subQ.ID)
            );
            return (
              userSubAns &&
              String(userSubAns.answer || userSubAns.value).trim().toLowerCase() ===
                String(subQ.correctAnswer).trim().toLowerCase()
            );
          });
        }

        return false;
      } catch (e) {
        console.error('Error in checkCorrectness review:', e);
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
            
            // Security logic: Students NEVER see ground-truth correct answers, even after publication.
            // Publication only controls whether they can access the review page itself.
            const userRoles = user?.role ? (Array.isArray(user.role) ? user.role : [user.role]) : [];
            const isStudent = userRoles.some(r => r.toLowerCase() === 'student');
            const canSeeAnswers = !isStudent; // Strict: Only non-students (Teachers/Admins) see answers.

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
              correctAnswer: null,
              correctnessMap: null,
              isCorrect: false,
            };

            // Sanitize question data if user is a student
            if (isStudent) {
              sanitizeQuestion(questionDetail.resources, true);
            }
            
            // Set top-level correctAnswer only if authorized (Teachers/Admins)
            if (canSeeAnswers) {
              questionDetail.correctAnswer = answerContent ? answerContent.correctAnswer : null;
            } else if (isStudent) {
              questionDetail.correctAnswer = "hidden";
            }

            if (studentAnswer) {
              if (['speaking', 'writing'].includes(skillKey)) {
                questionDetail.isCorrect = true;
              } else {
                questionDetail.isCorrect = checkCorrectness(
                  question.Type,
                  studentAnswer.AnswerText,
                  answerContent
                );
                
                // Provide granular correctness map for multi-part questions
                questionDetail.correctnessMap = getCorrectnessMap(
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

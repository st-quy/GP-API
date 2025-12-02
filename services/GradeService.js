const { Op, where } = require('sequelize');
const {
  Session,
  SessionParticipant,
  StudentAnswer,
  User,
  Topic,
  Question,
  Part,
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
      }

      // ================================
      // DROPDOWN LIST
      // ================================
      else if (type === 'dropdown-list') {
        const studentAnswers = JSON.parse(rawStudentAnswer).map((item) => ({
          key: item.key.split('.')[0].trim(),
          value: item.value.trim(),
        }));

        const correctAnswersInclude0 = correctContent.correctAnswer.map(
          (item) => ({
            key: item.key.trim(),
            value: item.value.trim(),
          })
        );

        const correctAnswers = correctAnswersInclude0.filter(
          (item) => item.key !== '0'
        );

        logItem.studentAnswer = studentAnswers;
        logItem.correctAnswer = correctAnswers;

        correctAnswers.forEach((correct, index) => {
          const student = studentAnswers[index];
          if (
            student &&
            student.key === correct.key &&
            student.value === correct.value
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

module.exports = {
  getParticipantExamBySession,
  calculatePoints,
  calculatePointForWritingAndSpeaking,
};

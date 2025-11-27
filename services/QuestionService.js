const {
  Question,
  TopicPart,
  QuestionSet,
  QuestionSetQuestion,
  Skill,
  Part,
  User,
} = require('../models');
const {
  buildSpeakingAnswerContent,
  buildReadingAnswerContent,
} = require('../utils/question-create.util');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

async function getAllQuestions(req) {
  try {
    const {
      page = 1,
      pageSize = 10,
      search,
      skillName,
      partId,
      type,
    } = req.query;

    const limit = Number(pageSize) > 0 ? Number(pageSize) : 10;
    const offset = (Number(page) - 1) * limit;

    const whereQuestion = {};
    const include = [
      {
        model: User,
        as: 'creator',
        attributes: ['ID', 'lastName', 'firstName', 'email'],
      },
      {
        model: User,
        as: 'updater',
        attributes: ['ID', 'lastName', 'firstName', 'email'],
      },
    ];

    if (search) {
      const s = search.trim();
      if (s) {
        whereQuestion.Content = { [Op.iLike]: `%${s}%` };
      }
    }

    // 🔍 Filter by question type
    if (type) {
      whereQuestion.Type = type;
    }

    // --------------------------------------------------
    // PART + SKILL (Skill belongsTo Part)
    // --------------------------------------------------
    const partInclude = {
      model: Part,
      required: !!(partId || skillName),
      include: [
        {
          model: Skill,
          as: 'Skill',
          attributes: ['ID', 'Name'],
          ...(skillName && {
            where: {
              Name: { [Op.iLike]: skillName },
              // hoặc:
              // [Op.and]: [
              //   where(fn('LOWER', col('"Part->Skill"."Name"')), skillName.toLowerCase()),
              // ],
            },
            required: true,
          }),
        },
      ],
    };

    if (partId) {
      partInclude.where = { ID: partId };
      partInclude.required = true;
    }

    include.push(partInclude);

    // --------------------------------------------------
    // Execute query
    // --------------------------------------------------
    const { rows, count } = await Question.findAndCountAll({
      where: whereQuestion,
      include,
      limit,
      offset,
      order: [['updatedAt', 'DESC']],
      distinct: true,
    });

    return {
      status: 200,
      message: 'Questions fetched successfully',
      data: {
        items: rows,
        pagination: {
          page: Number(page),
          pageSize: limit,
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      },
    };
  } catch (error) {
    throw new Error(`Error fetching questions: ${error.message}`);
  }
}

async function createQuestion(req) {
  try {
    const {
      Type,
      AudioKeys,
      ImageKeys,
      SkillID,
      PartID,
      Sequence,
      Content,
      SubContent,
      GroupContent,
      AnswerContent,
      GroupID,
    } = req.body;

    if (!Type || !SkillID || !PartID || !Sequence || !Content || !GroupID) {
      return {
        status: 400,
        message:
          'Type, SkillID, PartID, Sequence, Content, and GroupID are required fields',
      };
    }

    const newQuestion = await Question.create({
      Type,
      AudioKeys,
      ImageKeys,
      SkillID,
      PartID,
      Sequence,
      Content,
      SubContent,
      GroupContent,
      AnswerContent,
      GroupID,
      GroupID,
    });

    return {
      status: 201,
      message: 'Question created successfully',
      data: newQuestion,
    };
  } catch (error) {
    throw new Error(`Error creating question: ${error.message}`);
  }
}

async function createQuestionGroup(req) {
  try {
    const { PartID, SkillName, questions } = req.body;

    if (
      !PartID ||
      !SkillName ||
      !questions ||
      !Array.isArray(questions) ||
      questions.length === 0
    ) {
      return {
        status: 400,
        message: 'PartID, SkillId and questions[] are required',
      };
    }

    const skill = await Skill.findOne({ where: { Name: SkillName } });
    if (!skill) {
      return { status: 400, message: `Skill "${SkillName}" không tồn tại` };
    }

    const GroupID = uuidv4();
    const skillNameLower = String(SkillName).toLowerCase();

    for (const q of questions) {
      if (!q.Type || !q.Content) {
        return {
          status: 400,
          message: 'Mỗi question phải có Type và Content',
        };
      }
    }

    const payload = questions.map((q, index) => {
      const imageKeys = q.ImageKeys || [];

      let answerContent = q.AnswerContent || null;

      // Nếu FE không gửi AnswerContent thì BE tự build theo skill + type
      if (!answerContent) {
        if (skillNameLower === 'speaking') {
          // speaking
          answerContent = buildSpeakingAnswerContent(
            { ...q, ImageKeys: imageKeys },
            PartID
          );
        } else if (skillNameLower === 'reading') {
          // reading: dropdown-list / matching / ordering
          answerContent = buildReadingAnswerContent(q, PartID);
        }
      }

      return {
        Type: q.Type, // 'dropdown-list' / 'matching' / 'ordering' / 'speaking'...
        AudioKeys: q.AudioKeys || null,
        ImageKeys: imageKeys,
        SkillID: skill.ID,
        PartID,
        Sequence: q.Sequence ?? index + 1,
        Content: q.Content,
        SubContent: q.SubContent || null,
        GroupContent: q.GroupContent || null,
        AnswerContent: answerContent,
        GroupID,
      };
    });

    const created = await Question.bulkCreate(payload, { returning: true });

    return {
      status: 201,
      message: 'Question group created successfully',
      data: created,
    };
  } catch (error) {
    throw new Error(`Error creating question group: ${error.message}`);
  }
}

async function getQuestionsByPartID(req) {
  try {
    const { partId } = req.params;

    if (!partId) {
      return { status: 400, message: 'PartID is required' };
    }

    const questions = await Question.findAll({
      where: { PartID: partId },
      order: [['createdAt', 'DESC']],
      order: [['createdAt', 'DESC']],
      raw: true,
    });

    if (!questions || questions.length === 0) {
      return {
        status: 404,
        message: 'No questions found for this part',
      };
    }

    return {
      status: 200,
      message: `Found questions for PartID: ${partId}`,
      data: questions,
    };
  } catch (error) {
    throw new Error(`Error fetching questions: ${error.message}`);
  }
}

async function getQuestionByID(req) {
  try {
    const { questionId } = req.params;

    const question = await Question.findByPk(questionId, {
      include: [
        {
          model: Part,
          include: [
            {
              model: Skill,
              as: 'Skill',
              attributes: ['ID', 'Name'],
            },
          ],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['ID', 'firstName', 'lastName', 'email'],
        },
        {
          model: User,
          as: 'updater',
          attributes: ['ID', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    if (!question) {
      return {
        status: 404,
        message: 'Question not found',
      };
    }

    return {
      status: 200,
      message: 'Question retrieved successfully',
      data: question,
    };
  } catch (error) {
    throw new Error(`Error fetching question: ${error.message}`);
  }
}

async function getQuestionsByQuestionSetID(req) {
  try {
    const { questionSetId } = req.params;
    const { questionType, skillName } = req.query;

    const questionFilter = {};
    if (questionType) questionFilter.Type = questionType;

    const skillFilter = {};
    if (skillName) skillFilter.Name = skillName;

    const questionSet = await QuestionSet.findOne({
      where: { ID: questionSetId },
      include: [
        {
          model: QuestionSetQuestion,
          as: 'Questions',
          include: [
            {
              model: Question,
              as: 'Question',
              where: questionFilter,
              include: [
                { model: Skill, as: 'Skill', where: skillFilter },
                { model: Part, as: 'Part' },
              ],
            },
          ],
          order: [['Sequence', 'ASC']],
        },
      ],
      order: [
        [{ model: QuestionSetQuestion, as: 'Questions' }, 'Sequence', 'ASC'],
      ],
    });

    if (!questionSet) {
      return {
        status: 404,
        message: `QuestionSet with id ${questionSetId} not found`,
      };
    }

    const questions = questionSet.Questions.map((item) => ({
      ...item.Question.dataValues,
      Sequence: item.Sequence,
    }));

    const orderedQuestions = _.sortBy(questions, ['Sequence']);

    return {
      status: 200,
      message: 'Questions fetched successfully',
      data: {
        questionSetId,
        shuffleQuestions: questionSet.ShuffleQuestions,
        shuffleAnswers: questionSet.ShuffleAnswers,
        questions: orderedQuestions,
      },
    };
  } catch (error) {
    throw new Error(
      `Error fetching questions for QuestionSet: ${error.message}`
    );
  }
}

async function getQuestionsByTopicID(req) {
  try {
    const { TopicPartId, PartID } = req.params;
    const { TopicID } = req.query;

    const questions = await Question.findAll({
      include: [
        {
          model: TopicPart,
          where: {
            ID: TopicPartId,
            TopicID: TopicID,
          },
        },
      ],
      where: { PartID: PartID },
      order: [['createdAt', 'DESC']],
      raw: true,
    });
    if (!questions || questions.length === 0) {
      return {
        status: 404,
        message: 'No questions found for this topic part',
      };
    } else {
      return {
        status: 200,
        message: `Found questions for TopicPartID: ${TopicPartId} and PartID: ${PartID}`,
        data: questions,
      };
    }
  } catch (error) {
    throw new Error(`Error fetching questions: ${error.message}`);
  }
}

async function updateQuestion(req) {
  try {
    const { questionId } = req.params;
    const updatedData = req.body;

    const question = await Question.findByPk(questionId);
    if (!question) {
      return {
        status: 404,
        message: 'Question not found',
      };
    }

    await question.update(updatedData);

    return {
      status: 200,
      message: 'Question updated successfully',
      data: question,
    };
  } catch (error) {
    throw new Error(`Error updating question: ${error.message}`);
  }
}

async function deleteQuestion(req) {
  try {
    const { questionId } = req.params;

    const deletedRows = await Question.destroy({
      where: { ID: questionId },
    });

    if (deletedRows === 0) {
      return {
        status: 404,
        message: 'Question not found',
      };
    }

    return {
      status: 200,
      message: `Question with ID ${questionId} deleted successfully`,
    };
  } catch (error) {
    throw new Error(`Error deleting question: ${error.message}`);
  }
}

module.exports = {
  getAllQuestions,
  createQuestion,
  createQuestionGroup,
  getQuestionByID,
  updateQuestion,
  deleteQuestion,
  getQuestionsByPartID,
  getQuestionsByTopicID,
  getQuestionsByQuestionSetID,
};

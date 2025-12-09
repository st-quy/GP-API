const {
  QuestionSet,
  QuestionSetQuestion,
  Question,
  Skill,
  Part,
  Topic,
  Section,
} = require('../models');
const { Op } = require('sequelize');
const { TOPIC_STATUS } = require('../helpers/constants');

const getQuestionsByQuestionSetId = async (req) => {
  try {
    const { questionSetId } = req.params;

    const questionSet = await QuestionSet.findByPk(questionSetId, {
      include: [
        {
          model: QuestionSetQuestion,
          as: 'Questions',
          include: [
            {
              model: Question,
              as: 'Question',
              include: [
                { model: Skill, as: 'Skill' },
                { model: Part, as: 'Part' },
              ],
            },
          ],
        },
      ],
    });

    if (!questionSet) {
      return res.status(404).json({ message: 'QuestionSet not found' });
    }

    let questions = questionSet.Questions.map((item) => ({
      ...item.Question.dataValues,
      Sequence: item.Sequence,
    }));

    // if (questionSet.ShuffleQuestions) {
    //   questions = shuffleByGroup(questions);
    // } else {
    //   questions = _.sortBy(questions, ["Sequence"]);
    // }

    // if (questionSet.ShuffleAnswers) {
    //   questions = questions.map((q) => ({
    //     ...q,
    //     AnswerContent: {
    //       ...q.AnswerContent,
    //       options: _.shuffle(q.AnswerContent?.options || []),
    //     },
    //   }));
    // }

    return {
      questionSetId,
      shuffleQuestions: questionSet.ShuffleQuestions,
      shuffleAnswers: questionSet.ShuffleAnswers,
      questions,
    };
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const createTopic = async (req) => {
  try {
    const { Name, Status } = req.body;
    if (!Name) {
      return {
        status: 400,
        message: 'Name is required',
      };
    }

    const validStatuses = Object.values(TOPIC_STATUS);

    let finalStatus = TOPIC_STATUS.DRAFT;

    const newTopic = await Topic.create({
      Name,
      Status: validStatuses.includes(Status) ? Status : finalStatus,
    });
    return {
      status: 201,
      message: 'Topic created successfully',
      data: newTopic,
    };
  } catch (error) {
    throw new Error(`Error creating topic: ${error.message}`);
  }
};

const getAllTopics = async (req) => {
  try {
    const { status, searchName } = req.query;

    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 5;
    const offset = (page - 1) * pageSize;

    const whereClause = {};

    if (searchName) {
      whereClause.Name = {
        [Op.iLike]: `%${searchName}%`,
      };
    }

    if (status && status !== "all") {
      whereClause.Status = status;
    }

     const allTopics = await Topic.findAll({ attributes: ["Status"] });

    const statusCounts = {
      submited: allTopics.filter(t => t.Status === "submited").length,
      approved: allTopics.filter(t => t.Status === "approved").length,
      draft: allTopics.filter(t => t.Status === "draft").length,
      rejected: allTopics.filter(t => t.Status === "rejected").length,
    };

    const { rows, count } = await Topic.findAndCountAll({
      where: whereClause,
      offset,
      limit: pageSize,
      order: [['Name', 'ASC']],
    });

    return {
      status: 200,
      message: 'Get all topics successfully',
      page,
      pageSize,
      totalItems: count,
      totalPages: Math.ceil(count / pageSize),
      data: rows,
      statusCounts,
    };
  } catch (error) {
    throw new Error(`Error get all topic: ${error.message}`);
  }
};


const getTopicWithRelations = async (req, res) => {
  try {
    const topicId = req.params.id;
    const { questionType, skillName } = req.query;

    const questionWhere = questionType ? { Type: questionType } : undefined;
    const skillWhere = skillName ? { Name: skillName } : undefined;

    const topic = await Topic.findOne({
      where: { ID: topicId },

      include: [
        {
          model: Section,
          as: 'Sections',
          through: { attributes: [] },

          include: [
            {
              model: Skill,
              as: 'Skill',
              ...(skillWhere && { where: skillWhere, required: true }),
            },

            {
              model: Part,
              as: 'Parts',
              through: { attributes: [] },

              include: [
                {
                  model: Skill,
                  as: 'Skill',
                },
                {
                  model: Question,
                  ...(questionWhere && {
                    where: questionWhere,
                    required: true,
                  }),
                },
              ],
            },
          ],
        },
      ],

      order: [
        [{ model: Section, as: 'Sections' }, 'SkillID', 'ASC'],
        [
          { model: Section, as: 'Sections' },
          { model: Part, as: 'Parts' },
          'Sequence',
          'ASC',
        ],
        [
          { model: Section, as: 'Sections' },
          { model: Part, as: 'Parts' },
          { model: Question },
          'Sequence',
          'ASC',
        ],
      ],

      distinct: true,
    });

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    return topic.get({ plain: true });
  } catch (error) {
    console.error('Error fetching topic with relations:', error);

    // Nếu error xảy ra sau khi response đã gửi → headers sent
    if (res.headersSent) {
      return;
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getTopicByName = async (req, res) => {
  const { name } = req.query;
  try {
    const topic = await Topic.findOne({
      where: {
        Name: {
          [Op.iLike]: `%${name}%`,
        },
      },
    });

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    return res.status(200).json({
      message: 'Get topic by name successfully',
      data: topic,
    });
  } catch (error) {
    console.error('Error fetching topic by name:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

async function addPartToTopic(req, res) {
  try {
    const { topicId, partId } = req.body;

    const topic = await Topic.findByPk(topicId);
    const part = await Part.findByPk(partId);

    if (!topic || !part) {
      return res.status(404).json({ message: 'Topic or Part not found' });
    }

    await topic.addPart(part);

    return res.status(200).json({
      message: 'Part added to Topic successfully',
    });
  } catch (error) {
    console.error('Error adding Part to Topic:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function removePartFromTopic(req, res) {
  try {
    const { topicId, partId } = req.body;

    const topic = await Topic.findByPk(topicId);
    const part = await Part.findByPk(partId);

    if (!topic || !part) {
      return res.status(404).json({ message: 'Topic or Part not found' });
    }

    await topic.removePart(part);

    return res.status(200).json({
      message: 'Part removed from Topic successfully',
    });
  } catch (error) {
    console.error('Error removing Part from Topic:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function deleteTopic(req) {
  try {
    const { id } = req.params;
    const topic = await Topic.findByPk(id);
    if (!topic) {
      return {
        status: 404,
        message: `Topic with id ${id} not found`,
      };
    }
    if (topic.Status !== 'draft' && topic.Status !== 'rejected') {
      return {
        status: 400,
        message: `Cannot delete topic with status '${topic.Status}'`,
      };
    }
    await topic.destroy();
    return {
      status: 200,
      message: 'Topic deleted successfully',
    };
  } catch (error) {
    throw new Error(`Error deleting topic: ${error.message}`);
  }
};

async function updateTopic(req, res) {
  try {
    const { id } = req.params;
    const updatedTopicData = req.body;
    const topic = await Topic.findByPk(id);
    if (!topic) {
      return { 
        status: 404,
        message: 'Topic not found' 
      };
    }
    
    await topic.update(updatedTopicData);

    return {
      status: 200,
      message: 'Topic updated successfully',
      data: topic,
    };
  } catch (error) {

    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  getAllTopics,
  createTopic,
  addPartToTopic,
  removePartFromTopic,
  getTopicWithRelations,
  getTopicByName,
  getQuestionsByQuestionSetId,
  deleteTopic,
  updateTopic,
};

const {
  QuestionSet,
  QuestionSetQuestion,
  Question,
  Skill,
  Part,
  Topic,
  Section,
  User,
  sequelize,
} = require('../models');
const { Op } = require('sequelize');
const { TOPIC_STATUS } = require('../helpers/constants');
const { logActivity } = require('./ActivityLogService');

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
    const { Name, Status, ShuffleQuestions, ShuffleAnswers, Duration } = req.body;
    if (!Name) {
      return {
        status: 400,
        message: 'Name is required',
      };
    }

    const existingTopic = await Topic.findOne({
      where: {
        Name: { [Op.iLike]: Name.trim() }
      }
    });

    if (existingTopic) {
      return {
        status: 400,
        message: `An exam set with the name "${Name}" already exists.`,
      };
    }

    const validStatuses = Object.values(TOPIC_STATUS);

    let finalStatus = TOPIC_STATUS.DRAFT;

    const userId = req.user?.userId || null;

    const newTopic = await Topic.create({
      Name,
      Status: validStatuses.includes(Status) ? Status : finalStatus,
      Duration: Duration || null,
      CreatedBy: userId,
      UpdatedBy: userId,
      ShuffleQuestions: ShuffleQuestions || false,
      ShuffleAnswers: ShuffleAnswers || false,
    });

    logActivity({
      userId: userId,
      action: 'create',
      entityType: 'topic',
      entityID: newTopic.ID,
      entityName: Name,
      details: `Exam Set "${Name}" created`,
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
      archived: allTopics.filter(t => t.Status === "archived").length,
    };

    const { rows, count } = await Topic.findAndCountAll({
      where: whereClause,
      offset,
      limit: pageSize,
      order: [['Name', 'ASC']],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['ID', 'firstName', 'lastName'],
        },
        {
          model: User,
          as: 'updater',
          attributes: ['ID', 'firstName', 'lastName'],
        },
      ],
    });

    const data = rows.map((topic) => {
      const plain = topic.get({ plain: true });
      return {
        ...plain,
        createdBy: plain.creator
          ? `${plain.creator.firstName} ${plain.creator.lastName}`
          : null,
        updatedBy: plain.updater
          ? `${plain.updater.firstName} ${plain.updater.lastName}`
          : null,
      };
    });

    return {
      status: 200,
      message: 'Get all topics successfully',
      page,
      pageSize,
      totalItems: count,
      totalPages: Math.ceil(count / pageSize),
      data,
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
          model: User,
          as: 'creator',
          attributes: ['ID', 'firstName', 'lastName'],
        },
        {
          model: User,
          as: 'updater',
          attributes: ['ID', 'firstName', 'lastName'],
        },
        {
          model: Section,
          as: 'Sections',
          through: { attributes: ['ScoreConfig'] },

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
    if (topic.Status !== 'draft' && topic.Status !== 'rejected' && topic.Status !== 'archived') {
      return {
        status: 400,
        message: `Cannot delete topic with status '${topic.Status}'`,
      };
    }
    const topicName = topic.Name;
    const userId = req.user?.userId || null;
    await topic.destroy();

    logActivity({
      userId,
      action: 'delete',
      entityType: 'topic',
      entityID: id,
      entityName: topicName,
      details: `Exam Set "${topicName}" deleted`,
    });

    return {
      status: 200,
      message: 'Topic deleted successfully',
    };
  } catch (error) {
    throw new Error(`Error deleting topic: ${error.message}`);
  }
};

async function updateTopic(req) {
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

    const userId = req.user?.userId || null;
    if (userId) {
      updatedTopicData.UpdatedBy = userId;
    }

    if (updatedTopicData.Name) {
      const existingTopic = await Topic.findOne({
        where: {
          Name: { [Op.iLike]: updatedTopicData.Name.trim() },
          ID: { [Op.ne]: id }
        }
      });

      if (existingTopic) {
        return {
          status: 400,
          message: `An exam set with the name "${updatedTopicData.Name}" already exists.`,
        };
      }
    }

    const oldName = topic.Name;
    const oldStatus = topic.Status;
    const newName = updatedTopicData.Name || oldName;
    const newStatus = updatedTopicData.Status || oldStatus;

    await topic.update(updatedTopicData);

    let details;
    if (oldStatus !== newStatus) {
      const statusLabels = {
        draft: 'Draft',
        submited: 'Submitted',
        approved: 'Approved',
        rejected: 'Rejected',
        archived: 'Archived',
      };
      details = `Exam Set "${oldName}" status changed from ${statusLabels[oldStatus] || oldStatus} to ${statusLabels[newStatus] || newStatus}`;
    } else if (oldName !== newName) {
      details = `Exam Set "${oldName}" renamed to "${newName}"`;
    } else {
      details = `Exam Set "${oldName}" updated`;
    }

    logActivity({
      userId,
      action: 'update',
      entityType: 'topic',
      entityID: topic.ID,
      entityName: newName,
      details,
    });

    return {
      status: 200,
      message: 'Topic updated successfully',
      data: topic,
    };
  } catch (error) {
    return {
      status: 500,
      message: `Internal server error: ${error.message}`,
    };
  }
}

async function duplicateTopic(req) {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || null;

    const originalTopic = await Topic.findByPk(id, {
      include: [
        {
          model: Section,
          as: 'Sections',
          through: { attributes: ['ScoreConfig'] },
        },
      ],
    });

    if (!originalTopic) {
      return {
        status: 404,
        message: 'Original topic not found',
      };
    }

    let newName = `${originalTopic.Name} (Copy)`;
    let counter = 1;

    // Ensure unique name for the copy
    let nameExists = true;
    while (nameExists) {
      const existing = await Topic.findOne({
        where: { Name: { [Op.iLike]: newName } }
      });
      if (!existing) {
        nameExists = false;
      } else {
        newName = `${originalTopic.Name} (Copy ${counter++})`;
      }
    }

    const newTopic = await Topic.create({
      Name: newName,
      Status: TOPIC_STATUS.DRAFT,
      Duration: originalTopic.Duration,
      ShuffleQuestions: originalTopic.ShuffleQuestions,
      ShuffleAnswers: originalTopic.ShuffleAnswers,
      CreatedBy: userId,
      UpdatedBy: userId,
    });

    // Copy sections
    if (originalTopic.Sections && originalTopic.Sections.length > 0) {
      for (const section of originalTopic.Sections) {
        const { TopicSection: tsData } = section;
        await sequelize.models.TopicSection.create({
          TopicID: newTopic.ID,
          SectionID: section.ID,
          ScoreConfig: tsData ? tsData.ScoreConfig : null,
        });
      }
    }

    logActivity({
      userId,
      action: 'create',
      entityType: 'topic',
      entityID: newTopic.ID,
      entityName: newName,
      details: `Exam Set "${newName}" created by duplicating "${originalTopic.Name}"`,
    });

    return {
      status: 201,
      message: `Exam set "${originalTopic.Name}" duplicated successfully as "${newName}"`,
      data: newTopic,
    };
  } catch (error) {
    return {
      status: 500,
      message: `Error duplicating topic: ${error.message}`,
    };
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
  duplicateTopic,
};

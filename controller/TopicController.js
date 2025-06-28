const { Topic, Part, Question, Skill } = require("../models");
const topicService = require("../services/topicService");
const { Op } = require("sequelize");

const getTopicWithRelations = async (req, res) => {
  try {
    const topicId = req.params.id;
    const { questionType, skillName } = req.query;

    const questionFilter = {};
    if (questionType) {
      questionFilter.Type = questionType;
    }

    const skillFilter = {};
    if (skillName) {
      skillFilter.Name = skillName;
    }

    const topic = await Topic.findOne({
      where: { ID: topicId },
      include: [
        {
          model: Part,
          order: [["Sequence", "ASC"]],
          include: [
            {
              model: Question,
              where: questionFilter,
              order: [["Sequence", "ASC"]],
              include: [
                {
                  model: Skill,
                  where: skillFilter,
                },
                {
                  model: Part,
                },
              ],
            },
          ],
        },
      ],
      order: [
        [Part, Question, "Sequence", "ASC"],
        [Part, "Sequence", "ASC"],
      ],
    });

    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    return res.status(200).json(topic);
  } catch (error) {
    console.error("Error fetching topic with relations:", error);
    return res.status(500).json({ message: "Internal server error" });
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
      return res.status(404).json({ message: "Topic not found" });
    }

    return res.status(200).json({
      message: "Get topic by name successfully",
      data: topic,
    });
  } catch (error) {
    console.error("Error fetching topic by name:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getAllTopics = async (req, res) => {
  try {
    const topics = await topicService.getAllTopics();
    return res.status(topics.status).json(topics);
  } catch (error) {
    console.error("Error fetching all topics:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { getTopicWithRelations, getTopicByName, getAllTopics };

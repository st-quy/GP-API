const {
  QuestionSet,
  QuestionSetQuestion,
  Question,
  Skill,
  Part,
  Topic,
} = require("../models");
const { Op } = require("sequelize");

const getQuestionsByQuestionSetId = async (req) => {
  try {
    const { questionSetId } = req.params;

    const questionSet = await QuestionSet.findByPk(questionSetId, {
      include: [
        {
          model: QuestionSetQuestion,
          as: "Questions",
          include: [
            {
              model: Question,
              as: "Question",
              include: [
                { model: Skill, as: "Skill" },
                { model: Part, as: "Part" },
              ],
            },
          ],
        },
      ],
    });

    if (!questionSet) {
      return res.status(404).json({ message: "QuestionSet not found" });
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
    res.status(500).json({ message: "Server error" });
  }
};

const createTopic = async (req) => {
  try {
    const { Name } = req.body;
    if (!Name) {
      throw new Error("Topic Name is required");
    }
    const newTopic = await Topic.create({
      Name,
    });
    return {
      status: 201,
      message: "Topic created successfully",
      data: newTopic,
    };
  } catch (error) {
    throw new Error(`Error creating topic: ${error.message}`);
  }
};

const getAllTopics = async () => {
  try {
    const topics = await Topic.findAll();
    return {
      status: 200,
      message: "Get all topic successfully",
      data: topics,
    };
  } catch (error) {
    throw new Error(`Error get all topic: ${error.message}`);
  }
};

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

async function addPartToTopic(req, res) {
  try {
    const { topicId, partId } = req.body;

    const topic = await Topic.findByPk(topicId);
    const part = await Part.findByPk(partId);

    if (!topic || !part) {
      return res.status(404).json({ message: "Topic or Part not found" });
    }

    await topic.addPart(part);

    return res.status(200).json({
      message: "Part added to Topic successfully",
    });
  } catch (error) {
    console.error("Error adding Part to Topic:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function removePartFromTopic(req, res) {
  try {
    const { topicId, partId } = req.body;

    const topic = await Topic.findByPk(topicId);
    const part = await Part.findByPk(partId);

    if (!topic || !part) {
      return res.status(404).json({ message: "Topic or Part not found" });
    }

    await topic.removePart(part);

    return res.status(200).json({
      message: "Part removed from Topic successfully",
    });
  } catch (error) {
    console.error("Error removing Part from Topic:", error);
    return res.status(500).json({ message: "Internal server error" });
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
};

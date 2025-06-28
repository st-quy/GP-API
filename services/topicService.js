const { Topic, Part, Question } = require("../models");

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

module.exports = {
  getAllTopics,
};

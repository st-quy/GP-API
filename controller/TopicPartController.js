const TopicPartService = require("../services/TopicPartService");

async function createTopicPart(req, res) {
  try {
    const result = await TopicPartService.createTopicPart(req);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Error creating TopicPart:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}

async function deleteTopicPart(req, res) {
  try {
    const result = await TopicPartService.deleteTopicPart(req);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Error deleting TopicPart:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}

module.exports = {
  createTopicPart,
  deleteTopicPart,
};

const TopicSectionService = require("../services/TopicSectionService");

async function createTopicSection(req, res) {
  try {
    const result = await TopicSectionService.createTopicSection(req);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Error creating TopicSection:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}

async function deleteTopicSection(req, res) {
  try {
    const result = await TopicSectionService.deleteTopicSection(req);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Error deleting TopicSection:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}

async function deleteTopicSectionbyTopicID(req, res) {
  try {
    const { topicId } = req.params;
    const result = await TopicSectionService.deleteTopicSectionbyTopicID(topicId);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Error deleting TopicSections by TopicID:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}


module.exports = {
  createTopicSection,
  deleteTopicSection,
  deleteTopicSectionbyTopicID,
};

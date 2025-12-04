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

async function updateTopicSectionByTopicID(req, res) {
  try {
    const { topicId } = req.params;
    const { sectionIds } = req.body; // mảng SectionID mới

    if (!sectionIds || !Array.isArray(sectionIds)) {
      return res.status(400).json({ message: "sectionIds must be an array" });
    }

    const result = await TopicSectionService.updateTopicSectionByTopicID(topicId, sectionIds);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Error updating TopicSections by TopicID:", error);
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
  updateTopicSectionByTopicID,
};

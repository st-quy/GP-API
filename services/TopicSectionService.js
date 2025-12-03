const { Topic, Section, TopicSection } = require("../models");

const createTopicSection = async (req) => {
  try {
    const { TopicID, SectionID } = req.body;
    if (!TopicID || !SectionID ) {
      return {
        status: 400,
        message: "TopicID and SectionID are required",
      };
    }

    const topic = await Topic.findByPk(TopicID);
    if (!topic) {
      return {
        status: 404,
        message: `Topic with ID ${TopicID} not found`,
      };
    }

    const section = await Section.findByPk(SectionID);
    if (!section) {
      return {
        status: 404,
        message: `Section with ID ${SectionID} not found`,
      };
    }

    const existedRelationship = await TopicSection.findOne({
      where: { TopicID, SectionID },
    });

    if (existedRelationship) {
      return {
        status: 409,
        message: "This TopicSection relationship already exists",
      };
    }

    const newTopicSection = await TopicSection.create({
      TopicID,
      SectionID,
    });
    return {
      status: 201,
      message: "TopicSection created successfully",
      data: newTopicSection,
    };
  } catch (error) {
    throw new Error(`Error creating TopicSection: ${error.message}`);
  }
};

const deleteTopicSection = async (req) => {
  try {
    const { id } = req.params;
    const topicSection = await TopicSection.findByPk(id);
    if (!topicSection) {
      return {
        status: 404,
        message: `TopicSection with id ${id} not found`,
      };
    }
    await topicSection.destroy();
    return {
      status: 200,
      message: "TopicSection deleted successfully",
    };
  } catch (error) {
    throw new Error(`Error deleting TopicSection: ${error.message}`);
  }
};

const deleteTopicSectionbyTopicID = async (topicId) => {
  try {
    const deletedCount = await TopicSection.destroy({  
      where: { TopicID: topicId }
    });
    return {
      status: 200,
      message: `Deleted ${deletedCount} TopicSection(s) associated with TopicID ${topicId}`,
    };
  } catch (error) {
    throw new Error(`Error deleting TopicSections by TopicID: ${error.message}`);
  } 
};

module.exports = {
  createTopicSection,
  deleteTopicSection,
  deleteTopicSectionbyTopicID,
};

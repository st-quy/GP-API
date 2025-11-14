const {Topic, Part, TopicPart} = require("../models");

const createTopicPart = async (req) => {
  try {
    const { TopicID, PartID } = req.body;
    if (!TopicID || !PartID) {
      return {
        status: 400,
        message: "TopicID and PartID are required",
        };
    }

    const topic = await Topic.findByPk(TopicID);
    if (!topic) {
      return {
        status: 404,
        message: `Topic with ID ${TopicID} not found`,
      };
    }

    const part = await Part.findByPk(PartID);
    if (!part) {
      return {
        status: 404,
        message: `Part with ID ${PartID} not found`,
      };
    }

    const existedRelationship = await TopicPart.findOne({
      where: { TopicID, PartID },
    });

    if (existedRelationship) {
        return {
            status: 409,
            message: "This TopicPart relationship already exists",
        };
    }
    const newTopicPart = await TopicPart.create({
      TopicID,
      PartID,
    });
    return {
      status: 201,
        message: "TopicPart created successfully",
        data: newTopicPart,
    };
  } catch (error) {
    throw new Error(`Error creating TopicPart: ${error.message}`);
  }
};

const deleteTopicPart = async (req) => {
    try {
        const { id } = req.params;
        const topicPart = await TopicPart.findByPk(id);
        if (!topicPart) {
            return { status: 404, message: `TopicPart with id ${id} not found` };
        }
        await topicPart.destroy();
        return { status: 200, message: "TopicPart deleted successfully" };
    } catch (error) {
        throw new Error(`Error deleting TopicPart: ${error.message}`);
    }   
};

module.exports = {
  createTopicPart,
  deleteTopicPart,
};

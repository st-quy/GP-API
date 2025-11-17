const { Question, TopicPart } = require("../models");
const { Op } = require("sequelize");

async function createQuestion(req) {
  try {
    const {
      Type,
      AudioKeys,
      ImageKeys,
      SkillID,
      PartID,
      Sequence,
      Content,
      SubContent,
      GroupContent,
      AnswerContent,
      GroupID,
    } = req.body;

    if (!Type || !SkillID || !PartID || !Sequence || !Content || !GroupID) {
      return {
        status: 400,
        message:
          "Type, SkillID, PartID, Sequence, Content, and GroupID are required fields",
      };
    }

    const newQuestion = await Question.create({
      Type,
      AudioKeys,
      ImageKeys,
      SkillID,
      PartID,
      Sequence,
      Content,
      SubContent,
      GroupContent,
      AnswerContent,
      GroupID,
    });

    return {
      status: 201,
      message: "Question created successfully",
      data: newQuestion,
    };
  } catch (error) {
    throw new Error(`Error creating question: ${error.message}`);
  }
}

async function createQuestionGroup(req) {
  try {
    const { PartID, Skill, questions } = req.body;

    if (
      !PartID ||
      !SkillCode ||
      !questions ||
      !Array.isArray(questions) ||
      questions.length === 0
    ) {
      return {
        status: 400,
        message: "PartID, SkillId and questions[] are required",
      };
    }

    const GroupID = uuidv4();

    // This is a placeholder mapping, replace with actual logic as needed
    // Can map Question Type to Questions here base on which types the skill uses
    // Should be mapping skills and types as constants in /helper/constants.js file for better maintainability
    
    let SkillID;
    switch (Skill.toLowerCase()) {
      case "speaking":
        SkillID = "";
        break;
      case "listening":
        SkillID = "";
        break;
      case "reading":
        SkillID = "";
        break;
      case "writing":
        SkillID = "";
        break;
      case "grammarVocab":
        SkillID = "";
        break;
      default:
        return {
          status: 400,
          message: "",
        };
    }

    const payload = questions.map((q) => ({
      Type: item.Type,
      AudioKeys: item.AudioKeys || null,
      ImageKeys: item.ImageKeys || null,
      SkillID,
      PartID,
      Sequence: item.Sequence ?? null,
      Content: item.Content,
      SubContent: item.SubContent || null,
      GroupContent: item.GroupContent || null,
      AnswerContent: item.AnswerContent || null,
      GroupID,
    }));

    const created = await Question.bulkCreate(payload, { returning: true });

    return {
      status: 201,
      message: "Question group created successfully",
      data: created,
    };
  } catch (error) {
    throw new Error(`Error creating question group: ${error.message}`);
  }
}

async function getQuestionsByPartID(req) {
  try {
    const { partId } = req.params;

    if (!partId) {
      return { status: 400, message: "PartID is required" };
    }

    const questions = await Question.findAll({
      where: { PartID: partId },
      order: [["createdAt", "DESC"]],
      raw: true,
    });

    if (!questions || questions.length === 0) {
      return {
        status: 404,
        message: "No questions found for this part",
      };
    }

    return {
      status: 200,
      message: `Found questions for PartID: ${partId}`,
      data: questions,
    };
  } catch (error) {
    throw new Error(`Error fetching questions: ${error.message}`);
  }
}

async function getQuestionByID(req) {
  try {
    const { questionId } = req.params;

    const question = await Question.findByPk(questionId);
    if (!question) {
      return {
        status: 404,
        message: "Question not found",
      };
    }

    return {
      status: 200,
      message: "Question retrieved successfully",
      data: question,
    };
  } catch (error) {
    throw new Error(`Error fetching question: ${error.message}`);
  }
}

async function getQuestionsByTopicID(req) {
  try {
    const { TopicPartId, PartID } = req.params;
    const { TopicID } = req.query;

    const questions = await Question.findAll({
      include: [
        {
          model: TopicPart,
          where: {
            ID: TopicPartId,
            TopicID: TopicID,
          },
        },
      ],
      where: { PartID: PartID },
      order: [["createdAt", "DESC"]],
      raw: true,
    });
    if (!questions || questions.length === 0) {
      return {
        status: 404,
        message: "No questions found for this topic part",
      };
    } else {
      return {
        status: 200,
        message: `Found questions for TopicPartID: ${TopicPartId} and PartID: ${PartID}`,
        data: questions,
      };
    }
  } catch (error) {
    throw new Error(`Error fetching questions: ${error.message}`);
  }
}

async function updateQuestion(req) {
  try {
    const { questionId } = req.params;
    const updatedData = req.body;

    const question = await Question.findByPk(questionId);
    if (!question) {
      return {
        status: 404,
        message: "Question not found",
      };
    }

    await question.update(updatedData);

    return {
      status: 200,
      message: "Question updated successfully",
      data: question,
    };
  } catch (error) {
    throw new Error(`Error updating question: ${error.message}`);
  }
}

async function deleteQuestion(req) {
  try {
    const { questionId } = req.params;

    const deletedRows = await Question.destroy({
      where: { ID: questionId },
    });

    if (deletedRows === 0) {
      return {
        status: 404,
        message: "Question not found",
      };
    }

    return {
      status: 200,
      message: `Question with ID ${questionId} deleted successfully`,
    };
  } catch (error) {
    throw new Error(`Error deleting question: ${error.message}`);
  }
}

module.exports = {
  createQuestion,
  createQuestionGroup,
  getQuestionByID,
  updateQuestion,
  deleteQuestion,
  getQuestionsByPartID,
  getQuestionsByTopicID,
};

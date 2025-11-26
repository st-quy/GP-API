const { QuestionSet } = require("../models");
const { Op } = require("sequelize");

async function createQuestionSet(req) {
  try {
    const { name, description, shuffleQuestions, shuffleAnswers } = req.body;

    if (!name) {
      return { status: 400, message: "Name is required" };
    }

    const existing = await QuestionSet.findOne({
      where: { name: { [Op.iLike]: name } },
    });

    if (existing) {
      return {
        status: 409,
        message: "QuestionSet with this name already exists",
      };
    }

    const newSet = await QuestionSet.create({
      name,
      description: description || null,
      ShuffleQuestions: shuffleQuestions || false,
      ShuffleAnswers: shuffleAnswers || false,
    });

    return { 
      status: 201, 
      message: "QuestionSet created", 
      data: newSet 
    };
  } catch (err) {
    throw new Error(`Error creating QuestionSet: ${err.message}`);
  }
}

async function getQuestionSetById(req) {
  try {
    const { id } = req.params;

    const set = await QuestionSet.findByPk(id);

    if (!set) {
      return { 
        status: 404, 
        message: "QuestionSet not found" };
    }

    return { 
      status: 200, 
      message: "QuestionSet fetched successfully",
      data: set };
  } catch (err) {
    throw new Error(`Error fetching QuestionSet: ${err.message}`);
  }
}

async function getAllQuestionSets() {
  try {
    const sets = await QuestionSet.findAll({
      order: [["createdAt", "DESC"]],
    });

    return { 
      status: 200, 
      message: "QuestionSets fetched successfully",
      data: sets };
  } catch (err) {
    throw new Error(`Error fetching QuestionSets: ${err.message}`);
  }
}

async function updateQuestionSet(req) {
  try {
    const { id } = req.params;
    const { name, description, shuffleQuestions, shuffleAnswers } = req.body;

    const set = await QuestionSet.findByPk(id);
    if (!set) {
      return { 
        status: 404,
        message: "QuestionSet not found" };
    }

    await set.update({
      name: name ?? set.name,
      description: description ?? set.description,
      ShuffleQuestions: shuffleQuestions ?? set.ShuffleQuestions,
      ShuffleAnswers: shuffleAnswers ?? set.ShuffleAnswers,
    });

    return { 
      status: 200, 
      message: "QuestionSet updated", 
      data: set };
  } catch (err) {
    throw new Error(`Error updating QuestionSet: ${err.message}`);
  }
}

async function deleteQuestionSet(req) {
  try {
    const { id } = req.params;

    const set = await QuestionSet.findByPk(id);
    if (!set) {
      return { 
        status: 404, 
        message: "QuestionSet not found" };
    }

    await set.destroy();

    return { 
      status: 200, 
      message: "QuestionSet deleted" };
  } catch (err) {
    throw new Error(`Error deleting QuestionSet: ${err.message}`);
  }
}

module.exports = {
  createQuestionSet,
  getQuestionSetById,
  getAllQuestionSets,
  updateQuestionSet,
  deleteQuestionSet,
};

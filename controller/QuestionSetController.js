const QuestionSetService = require("../services/QuestionSetService");

async function createQuestionSet(req, res) {
  try {
    const result = await QuestionSetService.createQuestionSet(req);
    res.status(result.status).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getQuestionSetById(req, res) {
  try {
    const result = await QuestionSetService.getQuestionSetById(req);
    res.status(result.status).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getAllQuestionSets(req, res) {
  try {
    const result = await QuestionSetService.getAllQuestionSets();
    res.status(result.status).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateQuestionSet(req, res) {
  try {
    const result = await QuestionSetService.updateQuestionSet(req);
    res.status(result.status).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteQuestionSet(req, res) {
  try {
    const result = await QuestionSetService.deleteQuestionSet(req);
    res.status(result.status).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createQuestionSet,
  getQuestionSetById,
  getAllQuestionSets,
  updateQuestionSet,
  deleteQuestionSet,
};

const QuestionService = require('../services/QuestionService');

async function getAllQuestions(req, res) {
  try {
    const result = await QuestionService.getAllQuestions(req);
    res.status(result.status).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function createQuestion(req, res) {
  try {
    const result = await QuestionService.createQuestion(req);
    res.status(result.status).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getQuestionsByPartID(req, res) {
  try {
    const result = await QuestionService.getQuestionsByPartID(req);
    res.status(result.status).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getQuestionsByTopicID(req, res) {
  try {
    const result = await QuestionService.getQuestionsByTopicID(req);
    res.status(result.status).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getQuestionsByQuestionSetID(req, res) {
  try {
    const result = await QuestionService.getQuestionsByQuestionSetID(req);
    res.status(result.status).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createQuestionGroup(req, res) {
  try {
    const result = await QuestionService.createQuestionGroup(req);
    res.status(result.status).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getQuestionByID(req, res) {
  try {
    const result = await QuestionService.getQuestionByID(req);
    return res.status(result.status).json(result);
  } catch (err) {
    console.error('getQuestionByID error:', err);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}

async function updateQuestion(req, res) {
  try {
    const result = await QuestionService.updateQuestion(req);
    res.status(result.status).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function deleteQuestion(req, res) {
  try {
    const result = await QuestionService.deleteQuestion(req);
    res.status(result.status).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  createQuestion,
  createQuestionGroup,
  getQuestionsByPartID,
  getQuestionsByTopicID,
  getQuestionsByQuestionSetID,
  getQuestionByID,
  updateQuestion,
  deleteQuestion,
  getAllQuestions,
};

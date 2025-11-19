const {
  QuestionSetQuestionService,
} = require('../services/QuestionSetQuestionService');

const addQuestionToQuestionSet = async (req, res) => {
  try {
    const result = await QuestionSetQuestionService.addQuestionToQuestionSet(
      req
    );
    return res.status(result.status).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getQuestionSetQuestionById = async (req, res) => {
  try {
    const result = await QuestionSetQuestionService.getQuestionSetQuestionById(
      req
    );
    return res.status(result.status).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const removeQuestionFromQuestionSet = async (req, res) => {
  try {
    const result =
      await QuestionSetQuestionService.removeQuestionFromQuestionSet(req);
    return res.status(result.status).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  addQuestionToQuestionSet,
  removeQuestionFromQuestionSet,
  getQuestionSetQuestionById,
};

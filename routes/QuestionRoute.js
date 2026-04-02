const express = require('express');
const router = express.Router();
const { authorize } = require('../middleware/AuthMiddleware');

const {
  createQuestionGroup,
  getQuestionsByPartID,
  getQuestionsByTopicID,
  getQuestionByID,
  updateQuestion,
  deleteQuestion,
  getAllQuestions,
  createQuestionReading,
  getQuestionGroupDetail,
  updateQuestionGroup,
} = require('../controller/QuestionController');

router.get('/', getAllQuestions);
router.get('/part/:partId', getQuestionsByPartID);
router.get('/topic/:topicId', getQuestionsByTopicID);
// router.get('/:questionId', getQuestionByID);
router.post('/', authorize(['teacher', 'admin']), createQuestionGroup);
router.get('/detail', getQuestionGroupDetail);
router.put('/update/:sectionId', authorize(['teacher', 'admin']), updateQuestionGroup);
router.put('/:questionId', authorize(['teacher', 'admin']), updateQuestion);
router.delete('/:questionId', authorize(['teacher', 'admin']), deleteQuestion);

module.exports = router;

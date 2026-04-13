const express = require('express');
const router = express.Router();
const { authorize } = require('../middleware/AuthMiddleware');

const {
  createQuestionGroup,
  createSpeakingGroup,
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

router.get('/', authorize(['teacher', 'admin']), getAllQuestions);
router.get('/part/:partId', authorize(['teacher', 'admin']), getQuestionsByPartID);
router.get('/topic/:topicId', authorize(['teacher', 'admin']), getQuestionsByTopicID);
// router.get('/:questionId', getQuestionByID);
router.post('/', authorize(['teacher', 'admin']), createQuestionGroup);
router.post('/speaking', authorize(['teacher', 'admin']), createSpeakingGroup);
router.get('/detail', authorize(['teacher', 'admin']), getQuestionGroupDetail);
router.put('/update/:sectionId', authorize(['teacher', 'admin']), updateQuestionGroup);
router.put('/:questionId', authorize(['teacher', 'admin']), updateQuestion);
router.delete('/:questionId', authorize(['teacher', 'admin']), deleteQuestion);

module.exports = router;

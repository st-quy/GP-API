const express = require('express');
const router = express.Router();

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

/**
 * @swagger
 * components:
 *   schemas:
 *     Question:
 *       type: object
 *       required:
 *         - Type
 *         - PartID
 *         - Content
 *         - SkillID
 *       properties:
 *         ID:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the question
 *         Type:
 *           type: string
 *           description: Question type (e.g., MCQ, True/False)
 *         AudioKeys:
 *           type: string
 *           description: Reference key for audio file
 *         ImageKeys:
 *           type: array
 *           items:
 *             type: string
 *           description: List of image keys associated with the question
 *         SkillID:
 *           type: string
 *           format: uuid
 *           description: Associated skill ID
 *         PartID:
 *           type: string
 *           format: uuid
 *           description: Associated part ID
 *         Sequence:
 *           type: integer
 *           description: The question order in the part
 *         Content:
 *           type: string
 *           description: The question content or text
 *         SubContent:
 *           type: string
 *           description: Additional sub-content or text
 *         GroupID:
 *           type: string
 *           format: uuid
 *           description: Group ID to group related questions
 *       example:
 *         ID: "a6e8d0f5-cc52-4a5c-b1c8-5d4d3c821e2b"
 *         Type: "MCQ"
 *         AudioKeys: "audio/question1.mp3"
 *         ImageKeys: ["img1.png", "img2.png"]
 *         SkillID: "b1d8f3a4-6b6a-4b34-bce8-3e4c3a918e5f"
 *         PartID: "d7a6a67f-3a51-4a7b-92f1-9d8a8f23b812"
 *         Sequence: 1
 *         Content: "What is the capital of France?"
 *         SubContent: "Choose the correct answer."
 *         GroupID: "f2a9b7c5-9e34-4b1d-b83d-2b4a1e38d6e1"
 */

/**
 * @swagger
 * /questions/part/{partId}:
 *   get:
 *     summary: Get all questions by Part ID
 *     tags: [Question]
 *     parameters:
 *       - in: path
 *         name: partId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the part to fetch questions for
 *     responses:
 *       200:
 *         description: List of questions for the given part
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Question'
 *       404:
 *         description: No questions found for this part
 *       500:
 *         description: Internal server error
 */
router.get('/part/:partId', getQuestionsByPartID);

/**
 * @swagger
 * /questions/topic/{topicId}:
 *   get:
 *     summary: Get all questions by Topic ID
 *     tags: [Question]
 *     parameters:
 *       - in: path
 *         name: topicId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the topic to fetch questions for
 *       - in: query
 *         name: questionType
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter by question type (MCQ, True/False, etc.)
 *       - in: query
 *         name: skillName
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter by skill name (Listening, Reading, etc.)
 *     responses:
 *       200:
 *         description: List of questions for the given topic
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Questions fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Question'
 *       404:
 *         description: Topic or questions not found
 *       500:
 *         description: Internal server error
 */
router.get('/topic/:topicId', getQuestionsByTopicID);

/**
 * @swagger
 * /questions/{questionId}:
 *   get:
 *     summary: Get a question by ID
 *     tags: [Question]
 *     parameters:
 *       - in: path
 *         name: questionId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the question to retrieve
 *     responses:
 *       200:
 *         description: Question retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Question'
 *       404:
 *         description: Question not found
 *       500:
 *         description: Internal server error
 */
// router.get('/:questionId', getQuestionByID);

/**
 * @swagger
 * /questions:
 *   post:
 *     summary: Create a new question
 *     tags: [Question]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Question'
 *     responses:
 *       201:
 *         description: Question created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Question'
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Internal server error
 */
router.post('/', createQuestionGroup);

router.get('/detail', getQuestionGroupDetail);

router.put('/update/:sectionId', updateQuestionGroup);

/**
 * @swagger
 * /questions/{questionId}:
 *   put:
 *     summary: Update a question by ID
 *     tags: [Question]
 *     parameters:
 *       - in: path
 *         name: questionId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the question to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Question'
 *     responses:
 *       200:
 *         description: Question updated successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Question not found
 *       500:
 *         description: Internal server error
 */
router.put('/:questionId', updateQuestion);
/**
 * @swagger
 * /questions/{questionId}:
 *   delete:
 *     summary: Delete a question by ID
 *     tags: [Question]
 *     parameters:
 *       - in: path
 *         name: questionId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the question to delete
 *     responses:
 *       200:
 *         description: Question deleted successfully
 *       404:
 *         description: Question not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:questionId', deleteQuestion);

module.exports = router;

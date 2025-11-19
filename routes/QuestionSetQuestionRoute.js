const express = require('express');
const router = express.Router();

const {
  addQuestionToQuestionSet,
  removeQuestionFromQuestionSet,
  getQuestionSetQuestionById,
} = require('../controller/QuestionSetQuestionController');

/**
 * @swagger
 * tags:
 *   name: QuestionSetQuestion
 *   description: APIs for linking questions to question sets
 */

/**
 * @swagger
 * /question-set-question:
 *   post:
 *     summary: Add a question to a question set
 *     tags: [QuestionSetQuestion]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - questionSetId
 *               - questionId
 *             properties:
 *               questionSetId:
 *                 type: string
 *                 description: ID of the question set
 *               questionId:
 *                 type: string
 *                 description: ID of the question
 *     responses:
 *       201:
 *         description: Question added to QuestionSet successfully
 *       400:
 *         description: Missing required fields
 *       409:
 *         description: Question already in QuestionSet
 *       500:
 *         description: Internal server error
 */
router.post('/', addQuestionToQuestionSet);

/**
 * @swagger
 * /question-set-question/{id}:
 *   get:
 *     summary: Retrieve a QuestionSetQuestion record by ID
 *     tags: [QuestionSetQuestion]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The QuestionSetQuestion record ID
 *     responses:
 *       200:
 *         description: Record fetched successfully
 *       404:
 *         description: Record not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', getQuestionSetQuestionById);

/**
 * @swagger
 * /question-set-question:
 *   delete:
 *     summary: Remove a question from a question set
 *     tags: [QuestionSetQuestion]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - questionSetId
 *               - questionId
 *             properties:
 *               questionSetId:
 *                 type: string
 *               questionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Question removed successfully
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Not found in QuestionSet
 *       500:
 *         description: Internal server error
 */
router.delete('/', removeQuestionFromQuestionSet);

module.exports = router;

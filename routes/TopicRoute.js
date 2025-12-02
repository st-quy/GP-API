const express = require('express');
const router = express.Router();
const {
  getTopicWithRelations,
  getTopicByName,
  getAllTopics,
  createTopic,
  addPartToTopic,
  getQuestionsByQuestionSetId,
  removePartFromTopic,
} = require('../controller/TopicController');
/**
 * @swagger
 * components:
 *   schemas:
 *     Topic:
 *       type: object
 *       properties:
 *         ID:
 *           type: string
 *           format: uuid
 *           example: ef6b69aa-2ec2-4c65-bf48-294fd12e13fc
 *         Name:
 *           type: string
 *           example: Practice Test 2
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2025-04-10T04:00:53.200Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2025-04-10T04:00:53.200Z
 */

/**
 * @swagger
 * /topics:
 *   post:
 *     summary: Create a new topic
 *     tags: [Topic]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Topic created successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
router.post('', createTopic);

/**
 * @swagger
 * /topics:
 *   get:
 *     summary: Get all topics with their parts and questions
 *     tags:
 *       - Topics
 *     responses:
 *       200:
 *         description: A list of all topics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Get all topic successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Topic'
 */

router.get('', getAllTopics);

/**
 * @swagger
 * /topics/add-part:
 *   post:
 *     summary: Add a part to a topic
 *     tags: [Topic]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               topicId:
 *                 type: string
 *               partId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Part added to topic successfully
 *       404:
 *         description: Topic or Part not found
 */
router.post('/add-part', addPartToTopic);

/**
 * @swagger
 * /topics/remove-part:
 *   post:
 *     summary: Remove a part from a topic
 *     tags: [Topic]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               topicId:
 *                 type: string
 *               partId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Part removed successfully
 *       404:
 *         description: Topic or Part not found
 */
router.post('/remove-part', removePartFromTopic);

/**
 * @swagger
 * /topics/questionset/{questionSetId}:
 *   get:
 *     summary: Get all questions in a questionSet (no shuffle)
 *     tags: [Topic]
 *     parameters:
 *       - in: path
 *         name: questionSetId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the QuestionSet
 *     responses:
 *       200:
 *         description: Questions retrieved successfully
 *       404:
 *         description: QuestionSet not found
 *       500:
 *         description: Internal server error
 */
// router.get('/', getQuestionsByQuestionSetId);

router.get('/detail', getTopicByName);
router.get('/:id', getTopicWithRelations);

module.exports = router;

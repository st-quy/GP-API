const express = require("express");
const router = express.Router();
const {
  getTopicWithRelations,
  getTopicByName,
  getAllTopics,
} = require("../controller/TopicController");
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

router.get("/", getAllTopics);

router.get("/detail", getTopicByName);
router.get("/:id", getTopicWithRelations);

module.exports = router;

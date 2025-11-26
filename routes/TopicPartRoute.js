const express = require("express");
const router = express.Router();
const { allowAnonymous, authorize } = require("../middleware/AuthMiddleware");
const {
  createTopicPart,
  deleteTopicPart,
} = require("../controller/TopicPartController");

/**
 * @swagger
 * components:
 *   schemas:
 *     TopicPart:
 *       type: object
 *       required:
 *         - TopicID
 *         - PartID
 *       properties:
 *         ID:
 *           type: string
 *           format: uuid
 *           description: The unique identifier for the TopicPart relationship
 *         TopicID:
 *           type: string
 *           format: uuid
 *           description: The related Topic ID
 *         PartID:
 *           type: string
 *           format: uuid
 *           description: The related Part ID
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         ID: "2f3c1a7e-52c4-41f7-987e-b8b2a42d92f3"
 *         TopicID: "4e3c7e7a-56b4-4d7c-9c7a-22e9b0f7d123"
 *         PartID: "7d8f3b6a-9b4c-4e3c-91f7-1f2e3d4a5b6c"
 *         createdAt: "2025-11-10T10:00:00.000Z"
 *         updatedAt: "2025-11-10T10:05:00.000Z"
 */

/**
 * @swagger
 * /topicparts:
 *   post:
 *     summary: Create a new Topic-Part relationship
 *     tags: [TopicPart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - TopicID
 *               - PartID
 *             properties:
 *               TopicID:
 *                 type: string
 *               PartID:
 *                 type: string
 *     responses:
 *       201:
 *         description: TopicPart created successfully
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Topic or Part not found
 *       409:
 *         description: Relationship already exists
 *       500:
 *         description: Internal server error
 */
router.post("/", createTopicPart);

/**
 * @swagger
 * /topicparts/{id}:
 *   delete:
 *     summary: Delete a Topic-Part relationship
 *     tags: [TopicPart]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the TopicPart to delete
 *     responses:
 *       200:
 *         description: TopicPart deleted successfully
 *       404:
 *         description: TopicPart not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", deleteTopicPart);

module.exports = router;

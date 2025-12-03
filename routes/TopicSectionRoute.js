const express = require("express");
const router = express.Router();
const { allowAnonymous, authorize } = require("../middleware/AuthMiddleware");
const {
  createTopicSection,
  deleteTopicSection,
  deleteTopicSectionbyTopicID
} = require("../controller/TopicSectionController");

/**
 * @swagger
 * components:
 *   schemas:
 *     TopicSection:
 *       type: object
 *       required:
 *         - TopicID
 *         - SectionID
 *       properties:
 *         ID:
 *           type: string
 *           format: uuid
 *           description: The unique identifier for the TopicSection relationship
 *         TopicID:
 *           type: string
 *           format: uuid
 *           description: The related Topic ID
 *         SectionID:
 *           type: string
 *           format: uuid
 *           description: The related Section ID
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         ID: "2f3c1a7e-52c4-41f7-987e-b8b2a42d92f3"
 *         TopicID: "4e3c7e7a-56b4-4d7c-9c7a-22e9b0f7d123"
 *         SectionID: "7d8f3b6a-9b4c-4e3c-91f7-1f2e3d4a5b6c"
 *         createdAt: "2025-11-10T10:00:00.000Z"
 *         updatedAt: "2025-11-10T10:05:00.000Z"
 */

/**
 * @swagger
 * /topicSections:
 *   post:
 *     summary: Create a new Topic-Section relationship
 *     tags: [TopicSection]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - TopicID
 *               - SectionID
 *             properties:
 *               TopicID:
 *                 type: string
 *               SectionID:
 *                 type: string
 *     responses:
 *       201:
 *         description: TopicSection created successfully
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Topic or Section not found
 *       409:
 *         description: Relationship already exists
 *       500:
 *         description: Internal server error
 */
router.post("/", createTopicSection);

/**
 * @swagger
 * /topicSections/{id}:
 *   delete:
 *     summary: Delete a Topic-Section relationship
 *     tags: [TopicSection]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the TopicSection to delete
 *     responses:
 *       200:
 *         description: TopicSection deleted successfully
 *       404:
 *         description: TopicSection not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", deleteTopicSection);

/**
 * @swagger
 * /topicSections/topic/{topicId}:
 *   delete:
 *     summary: Delete all Topic-Section relationships by TopicID
 *     tags: [TopicSection]
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the Topic whose TopicSection relationships should be deleted
 *     responses:
 *       200:
 *         description: All TopicSection relationships deleted successfully
 *       404:
 *         description: No TopicSection found for the given TopicID
 *       500:
 *         description: Internal server error
 */
router.delete("/topic/:topicId", deleteTopicSectionbyTopicID);

module.exports = router;

const express = require("express");
const router = express.Router();
const { allowAnonymous, authorize } = require("../middleware/AuthMiddleware");
const {
  createPart,
  updatePart,
  getPartByID,
  getAllPart,
} = require("../controller/PartController");

/**
 * @swagger
 * components:
 *   schemas:
 *     Part:
 *       type: object
 *       required:
 *         - Content
 *       properties:
 *         ID:
 *           type: string
 *           format: uuid
 *           description: The unique identifier for the Part
 *         Content:
 *           type: string
 *           description: The main content of the part
 *         SubContent:
 *           type: string
 *           description: Optional additional information
 *         Sequence:
 *           type: integer
 *           description: Order of the part
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         ID: "9f2c3e7a-6f4b-4b1f-8d7f-3a2e9c0b5d88"
 *         Content: "Reading Section 1"
 *         SubContent: "Answer all questions in this part"
 *         Sequence: 1
 *         createdAt: "2025-11-10T10:00:00.000Z"
 *         updatedAt: "2025-11-10T10:10:00.000Z"
 */

/**
 * @swagger
 * /parts:
 *   get:
 *     summary: Get all parts
 *     tags: [Part]
 *     responses:
 *       200:
 *         description: List of all parts
 *       500:
 *         description: Internal server error
 */
router.get("/", getAllPart);

/**
 * @swagger
 * /parts/{partId}:
 *   get:
 *     summary: Get part by ID
 *     tags: [Part]
 *     parameters:
 *       - in: path
 *         name: partId
 *         required: true
 *         description: The ID of the part to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Part retrieved successfully
 *       404:
 *         description: Part not found
 *       500:
 *         description: Internal server error
 */
router.get("/:partId", getPartByID);

/**
 * @swagger
 * /parts:
 *   post:
 *     summary: Create a new part
 *     tags: [Part]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *               subContent:
 *                 type: string
 *               sequence:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Part created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.post("/", createPart);

/**
 * @swagger
 * /parts/{partId}:
 *   put:
 *     summary: Update an existing part
 *     tags: [Part]
 *     parameters:
 *       - in: path
 *         name: partId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the part to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               subContent:
 *                 type: string
 *               sequence:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Part updated successfully
 *       404:
 *         description: Part not found
 *       500:
 *         description: Internal server error
 */
router.put("/:partId", updatePart);

module.exports = router;

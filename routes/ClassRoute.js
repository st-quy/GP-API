const express = require("express");
const router = express.Router();
const { allowAnonymous, authorize } = require("../middleware/AuthMiddleware");

const {
  getAllClasses,
  createClass,
  updateClass,
  getClassById,
  deleteClass,
} = require("../controller/ClassController");

/**
 * @swagger
 * components:
 *   schemas:
 *     Class:
 *       type: object
 *       required:
 *         - className
 *       properties:
 *         ID:
 *           type: string
 *           format: uuid
 *           description: The unique identifier for the class
 *         className:
 *           type: string
 *           description: The name of the class
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the class was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the class was last updated
 *       example:
 *         ID: "123e4567-e89b-12d3-a456-426614174000"
 *         className: "Math 101"
 *         createdAt: "2023-01-01T00:00:00.000Z"
 *         updatedAt: "2023-01-02T00:00:00.000Z"
 */

/**
 * @swagger
 * /classes:
 *   get:
 *     summary: Get all classes
 *     tags: [Class]
 *     responses:
 *       200:
 *         description: List of all classes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Class'
 *       500:
 *         description: Internal server error
 */
router.get("/", getAllClasses);

/**
 * @swagger
 * /classes:
 *   post:
 *     summary: Create a new class
 *     tags: [Class]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - className
 *               - userId
 *             properties:
 *               className:
 *                 type: string
 *                 description: The name of the class
 *               userId:
 *                 type: string
 *                 description: The ID of the user who created the class
 *     responses:
 *       201:
 *         description: Class created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Class'
 *       500:
 *         description: Internal server error
 */
router.post("/", createClass);

/**
 * @swagger
 * /classes/{classId}:
 *   put:
 *     summary: Update a class by ID
 *     tags: [Class]
 *     parameters:
 *       - in: path
 *         name: classId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the class to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Class'
 *     responses:
 *       200:
 *         description: Class updated successfully
 *       404:
 *         description: Class not found
 *       500:
 *         description: Internal server error
 */
router.put("/:classId", updateClass);

/**
 * @swagger
 * /classes/{classId}:
 *   get:
 *     summary: Get a class by ID
 *     tags: [Class]
 *     parameters:
 *       - in: path
 *         name: classId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the class to retrieve
 *     responses:
 *       200:
 *         description: Class retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Class'
 *       404:
 *         description: Class not found
 *       500:
 *         description: Internal server error
 */
router.get("/:classId", getClassById);

/**
 * @swagger
 * /classes/{classId}:
 *   delete:
 *     summary: Delete a class by ID
 *     tags: [Class]
 *     parameters:
 *       - in: path
 *         name: classId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the class to delete
 *     responses:
 *       200:
 *         description: Class deleted successfully
 *       404:
 *         description: Class not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:classId", deleteClass);

module.exports = router;

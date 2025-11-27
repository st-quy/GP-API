const express = require("express");
const router = express.Router();

const {
  createQuestionSet,
  getQuestionSetById,
  getAllQuestionSets,
  updateQuestionSet,
  deleteQuestionSet,
} = require("../controller/QuestionSetController");

/**
 * @swagger
 * tags:
 *   name: QuestionSet
 *   description: APIs for managing QuestionSets
 */

/**
 * @swagger
 * /question-set:
 *   post:
 *     summary: Create a new QuestionSet
 *     tags: [QuestionSet]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               shuffleQuestions:
 *                 type: boolean
 *               shuffleAnswers:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: QuestionSet created
 */
router.post("/", createQuestionSet);

/**
 * @swagger
 * /question-set/{id}:
 *   get:
 *     summary: Get a QuestionSet by ID
 *     tags: [QuestionSet]
 */
router.get("/:id", getQuestionSetById);

/**
 * @swagger
 * /question-set:
 *   get:
 *     summary: Get all QuestionSets
 *     tags: [QuestionSet]
 */
router.get("/", getAllQuestionSets);

/**
 * @swagger
 * /question-set/{id}:
 *   put:
 *     summary: Update a QuestionSet
 *     tags: [QuestionSet]
 */
router.put("/:id", updateQuestionSet);

/**
 * @swagger
 * /question-set/{id}:
 *   delete:
 *     summary: Delete a QuestionSet
 *     tags: [QuestionSet]
 */
router.delete("/:id", deleteQuestionSet);

module.exports = router;

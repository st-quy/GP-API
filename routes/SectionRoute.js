const express = require('express');
const router = express.Router();

const {
  getAllSection,
  updateSection,
  deleteSection,
  createSection,
  getSectionDetail,
} = require('../controller/SectionController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Section:
 *       type: object
 *       properties:
 *         ID:
 *           type: string
 *           format: uuid
 *         Name:
 *           type: string
 *           description: Section name
 *         Description:
 *           type: string
 *           description: Section description
 *         Difficulty:
 *           type: string
 *           description: Difficulty level
 *         SkillName:
 *           type: string
 *           enum: [SPEAKING, LISTENING, READING, GRAMMAR AND VOCABULARY, WRITING]
 *           description: The skill this section belongs to
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /sections:
 *   get:
 *     summary: Get all sections
 *     tags: [Section]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: skillName
 *         schema:
 *           type: string
 *         description: Filter by skill name
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by section name
 *     responses:
 *       200:
 *         description: List of sections
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Section'
 *       500:
 *         description: Internal server error
 */
router.get('/', getAllSection);

/**
 * @swagger
 * /sections/{id}:
 *   get:
 *     summary: Get section detail by ID
 *     tags: [Section]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Section ID
 *     responses:
 *       200:
 *         description: Section detail with questions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Section'
 *       404:
 *         description: Section not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', getSectionDetail);

/**
 * @swagger
 * /sections:
 *   post:
 *     summary: Create a new section
 *     tags: [Section]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Name:
 *                 type: string
 *               Description:
 *                 type: string
 *               Difficulty:
 *                 type: string
 *               SkillName:
 *                 type: string
 *                 enum: [SPEAKING, LISTENING, READING, GRAMMAR AND VOCABULARY, WRITING]
 *     responses:
 *       201:
 *         description: Section created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
router.post('/', createSection);

/**
 * @swagger
 * /sections/{id}:
 *   put:
 *     summary: Update a section
 *     tags: [Section]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Section ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Name:
 *                 type: string
 *               Description:
 *                 type: string
 *               Difficulty:
 *                 type: string
 *               SkillName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Section updated successfully
 *       404:
 *         description: Section not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', updateSection);

/**
 * @swagger
 * /sections/{id}:
 *   delete:
 *     summary: Delete a section
 *     tags: [Section]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Section ID
 *     responses:
 *       200:
 *         description: Section deleted successfully
 *       404:
 *         description: Section not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', deleteSection);

module.exports = router;

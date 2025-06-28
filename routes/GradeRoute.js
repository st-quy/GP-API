const express = require("express");
const router = express.Router();
const { allowAnonymous, authorize } = require("../middleware/AuthMiddleware");

const {
  getExamOfParticipantBySession,
  calculatePointForWritingAndSpeaking,
} = require("../controller/GradeController");

/**
 * @swagger
 * /grades/participants:
 *   get:
 *     summary: Get participant exams by session
 *     tags: [Grade]
 *     parameters:
 *       - in: query
 *         name: sessionParticipantId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the session participant
 *       - in: query
 *         name: skillName
 *         schema:
 *           type: string
 *         required: true
 *         description: The Skill name (writing, speaking)
 *     responses:
 *       200:
 *         description: List of participant exams for the session
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   participantId:
 *                     type: string
 *                     description: The ID of the participant
 *                   examId:
 *                     type: string
 *                     description: The ID of the exam
 *                   score:
 *                     type: number
 *                     description: The score of the participant in the exam
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal server error
 */
router.get("/participants", getExamOfParticipantBySession);

/**
 * @swagger
 * /grades/teacher-grade:
 *   post:
 *     summary: Save score for writing or speaking skill
 *     tags: [Grade]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionParticipantID:
 *                 type: string
 *                 description: ID of the session participant
 *                 example: "2dad9cef-2ba8-4fff-85c7-579d8310e2b9"
 *               teacherGradedScore:
 *                 type: number
 *                 description: Score graded by teacher (can be 0 or greater)
 *                 example: 75.5
 *               skillName:
 *                 type: string
 *                 description: Skill being graded (WRITING or SPEAKING)
 *                 enum: [WRITING, SPEAKING]
 *                 example: WRITING
 *               studentAnswers:
 *                 type: array
 *                 description: Array of student answers with optional comments
 *                 items:
 *                   type: object
 *                   properties:
 *                     studentAnswerId:
 *                       type: string
 *                       description: ID of the student answer
 *                       example: "c1234567-89ab-4cde-f012-3456789abcde"
 *                     messageContent:
 *                       type: string
 *                       description: Comment or feedback for the answer
 *                       example: "Good vocabulary but needs better grammar."
 *             required:
 *               - sessionParticipantID
 *               - teacherGradedScore
 *               - skillName
 *               - studentAnswers
 *     responses:
 *       200:
 *         description: Writing or speaking points calculated successfully
 *       400:
 *         description: Invalid request body or missing fields
 *       500:
 *         description: Internal server error
 */

router.post("/teacher-grade", calculatePointForWritingAndSpeaking);

module.exports = router;

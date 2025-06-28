const express = require("express");
const router = express.Router();
const SessionParticipantController = require("../controller/SessionParticipantController");

/**
 * @swagger
 * components:
 *   schemas:
 *     SessionParticipant:
 *       type: object
 *       properties:
 *         ID:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the session participant
 *         GrammarVocab:
 *           type: integer
 *           nullable: true
 *           description: Score for grammar and vocabulary
 *         GrammarVocabLevel:
 *           type: string
 *         Reading:
 *           type: integer
 *           nullable: true
 *           description: Score for reading
 *         ReadingLevel:
 *           type: string
 *         Listening:
 *           type: integer
 *           nullable: true
 *           description: Score for listening
 *         ListeningLevel:
 *           type: string
 *         Speaking:
 *           type: integer
 *           nullable: true
 *           description: Score for speaking
 *         SpeakingLevel:
 *           type: string
 *         Writing:
 *           type: integer
 *           nullable: true
 *           description: Score for writing
 *         WritingLevel:
 *           type: string
 *         Total:
 *           type: integer
 *           nullable: true
 *           description: Total score
 *         Level:
 *           type: string
 *           enum: [A1, A2, B1, B2, C1, C2]
 *           nullable: true
 *           description: Proficiency level
 *         SessionID:
 *           type: string
 *           format: uuid
 *           description: Identifier of the associated session
 *         approvedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Date and time when the participant was approved
 *         UserID:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: Identifier of the associated user (optional)
 *
 *     ApiResponseForSessionParticipantArray:
 *       allOf:
 *         - $ref: '#/components/schemas/ApiResponseBase'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SessionParticipant'
 *               description: Array of session participants
 */

/**
 * @swagger
 * /session-participants/user/{userId}:
 *   get:
 *     summary: Get all exam history by participant
 *     tags: [SessionParticipants]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the user to retrieve participants for
 *     responses:
 *       200:
 *         description: Participants retrieved successfully
 *       404:
 *         description: No participants found for the given user
 *       500:
 *         description: Internal server error
 */
router.get(
  "/user/:userId",
  SessionParticipantController.getParticipantsByUserId
);

/**
 * @swagger
 * /session-participants/{sessionId}:
 *   get:
 *     summary: Get all participants for a session
 *     tags: [SessionParticipants]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the session to retrieve participants for
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: A list of session participants
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   $ref: '#/components/schemas/ApiResponseForSessionParticipantArray'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     pageSize:
 *                       type: integer
 *                       example: 10
 *                     pageCount:
 *                       type: integer
 *                       example: 5
 *                     totalItemPage:
 *                       type: integer
 *                       example: 10
 *                     totalItems:
 *                       type: integer
 *                       example: 50
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */

router.get("/:sessionId", SessionParticipantController.getAllParticipants);

/**
 * @swagger
 * /session-participants/group-by-user:
 *   get:
 *     summary: Get all session participants grouped by user
 *     tags: [SessionParticipants]
 *     responses:
 *       200:
 *         description: Session participants grouped by user retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/SessionParticipant'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.get(
  "/group-by-user",
  SessionParticipantController.getAllSessionParticipantsGroupedByUser
);
/**
 * @swagger
 * /session-participants/publish-scores:
 *   put:
 *     summary: Publish scores for specified participants in a session
 *     description: Marks the specified SessionParticipants as published. Returns 404 if no records were updated.
 *     tags:
 *       - SessionParticipants
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionId:
 *                 type: string
 *                 format: uuid
 *                 description: The ID of the session to publish scores for
 *                 example: "12bd21ef-b6d8-4991-b9ee-69160ce8fd09"
 *     responses:
 *       200:
 *         description: Scores published successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Scores published successfully.
 *       404:
 *         description: No records updated - Possibly invalid SessionID or StudentIDs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: No records updated. Possibly invalid SessionID or StudentIDs.
 *                 data:
 *                   type: integer
 *                   example: 0
 *       400:
 *         description: Bad Request - Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: sessionId are required
 *       500:
 *         description: Internal Server Error while updating scores
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error while updating scores.
 */

router.put(
  "/publish-scores",
  SessionParticipantController.publishScoresBySessionId
);

/**
 * @swagger
 * /api/session-participants/{id}/level:
 *   put:
 *     summary: Update CEFR level of a session participant
 *     tags:
 *       - SessionParticipants
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the session participant
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newLevel
 *             properties:
 *               newLevel:
 *                 type: string
 *                 enum: [A1, A2, B1, B2, C1, C2]  # Adjust to match your CEFR_LEVELS
 *                 description: New CEFR level to assign
 *     responses:
 *       200:
 *         description: Level updated successfully
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
 *                   example: Successfully updated level to "A1".
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: "Invalid level: B9"
 *       404:
 *         description: Participant not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 404
 *                 message:
 *                   type: string
 *                   example: No participant found with ID abc-123.
 *       500:
 *         description: Internal server error
 */

router.put(
  "/:id/level",
  SessionParticipantController.updateParticipantLevelById
);

module.exports = router;

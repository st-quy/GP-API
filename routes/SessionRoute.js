const express = require("express");
const router = express.Router();

const {
  getAllSessionsByClass,
  createSession,
  updateSession,
  getSessionDetailById,
  removeSession,
  generateSessionKey,
  getAllSessions,
} = require("../controller/SessionController");
/**
 * @swagger
 * components:
 *   schemas:
 *     Session:
 *       type: object
 *       required:
 *         - sessionName
 *         - sessionKey
 *         - startTime
 *         - endTime
 *         - examSet
 *         - status
 *         - ClassID
 *       properties:
 *         sessionName:
 *           type: string
 *           description: The name of the session
 *         sessionKey:
 *           type: string
 *           description: The unique key for the session
 *         startTime:
 *           type: string
 *           format: date-time
 *           description: The start time of the session
 *         endTime:
 *           type: string
 *           format: date-time
 *           description: The end time of the session
 *         examSet:
 *           type: uuid
 *           description: The exam set associated with the session
 *         status:
 *           type: string
 *           enum: [NOT_STARTED, ON_GOING, COMPLETE]
 *           description: The status of the session
 *         ClassID:
 *           type: string
 *           format: uuid
 *           description: The ID of the class associated with the session
 *       example:
 *         sessionName: Math Session 1
 *         sessionKey: ABC123
 *         startTime: 2023-01-01T10:00:00Z
 *         endTime: 2023-01-01T12:00:00Z
 *         examSet: ef6b69aa-2ec2-4c65-bf48-294fd12e13fc
 *         status: NOT_STARTED
 *         ClassID: 123e4567-e89b-12d3-a456-426614174000
 */

/**
 * @swagger
 * /sessions/all:
 *   get:
 *     summary: Get all sessions
 *     tags: [Session]
 *     responses:
 *       200:
 *         description: List of all sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Session'
 *       500:
 *         description: Internal server error
 */
router.get("/all", getAllSessions);

/**
 * @swagger
 * /sessions/generate-key:
 *   get:
 *     summary: Generate a session key
 *     tags: [Session]
 *     responses:
 *       200:
 *         description: Session key generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionKey:
 *                   type: string
 *       500:
 *         description: Internal server error
 */
router.get("/generate-key", generateSessionKey);

/**
 * @swagger
 * /sessions:
 *   get:
 *     summary: Get all sessions by class
 *     tags: [Session]
 *     parameters:
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the class to filter sessions
 *       - in: query
 *         name: sessionName
 *         schema:
 *           type: string
 *         required: false
 *         description: Name of the session
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *         required: false
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         required: false
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         required: false
 *         description: Status of the session
 *     responses:
 *       200:
 *         description: List of sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Session'
 *       400:
 *         description: Missing or invalid classId
 *       500:
 *         description: Internal server error
 */
router.get("/", getAllSessionsByClass);

/**
 * @swagger
 * /sessions:
 *   post:
 *     summary: Create a new session
 *     tags: [Session]
 *     parameters:
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the class to filter sessions
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Session'
 *     responses:
 *       201:
 *         description: Session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Session'
 *       500:
 *         description: Internal server error
 */
router.post("/", createSession);

/**
 * @swagger
 * /sessions/{sessionId}:
 *   put:
 *     summary: Update a session by class ID
 *     tags: [Session]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the class
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Session'
 *     responses:
 *       200:
 *         description: Session updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Session'
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal server error
 */
router.put("/:sessionId", updateSession);

/**
 * @swagger
 * /sessions/{sessionId}:
 *   get:
 *     summary: Get session details by sessionId
 *     tags: [Session]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the class
 *     responses:
 *       200:
 *         description: Session details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Session'
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal server error
 */
router.get("/:sessionId", getSessionDetailById);

/**
 * @swagger
 * /sessions/{sessionId}:
 *   delete:
 *     summary: Remove a session by session ID
 *     tags: [Session]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the class
 *     responses:
 *       200:
 *         description: Session removed successfully
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:sessionId", removeSession);

module.exports = router;

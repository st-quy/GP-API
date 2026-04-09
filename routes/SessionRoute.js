const express = require("express");
const router = express.Router();
const { authorize } = require("../middleware/AuthMiddleware");

const {
  getAllSessionsByClass,
  createSession,
  updateSession,
  updateSessionStatus,
  getSessionDetailById,
  removeSession,
  archiveSession,
  generateSessionKey,
  getAllSessions,
  batchUpdateStatus,
  batchClone,
  batchExportReport,
  batchDelete,
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
 *           enum: [NOT_STARTED, ON_GOING, COMPLETE, DRAFT, PUBLISHED, ARCHIVED, DELETED]
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
       500:
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
router.post("/", authorize(['teacher', 'admin']), createSession);

/**
 * @swagger
 * /sessions/{sessionId}/status:
 *   patch:
 *     summary: Update session status with transition validation
 *     tags: [Session]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [NOT_STARTED, ON_GOING, COMPLETE, DRAFT, PUBLISHED, ARCHIVED, DELETED]
 *                 description: The new status to transition to
 *     responses:
 *       200:
 *         description: Session status updated successfully
 *       400:
 *         description: Invalid status transition
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal server error
 */
router.patch("/:sessionId/status", updateSessionStatus);

/**
 * @swagger
 * /sessions/{sessionId}:
 *   put:
 *     summary: Update a session (blocked if status is ON_GOING)
 *     tags: [Session]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the session to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionName:
 *                 type: string
 *               sessionKey:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               examSet:
 *                 type: string
 *                 format: uuid
 *                 description: Topic ID representing the question set
 *               ClassID:
 *                 type: string
 *                 format: uuid
 *               isPublished:
 *                 type: boolean
 *               minioAudioRemoved:
 *                 type: boolean
 *                 description: Indicates whether the session's MinIO audio assets have been removed
 *     responses:
 *       200:
 *         description: Session updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Session'
 *       400:
 *         description: Validation error (duplicate key/name, invalid examSet/ClassID, invalid time range)
 *       403:
 *         description: Cannot edit a session that is currently ON_GOING
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal server error
 */
router.put("/:sessionId", authorize(['teacher', 'admin']), updateSession);

/**
 * @swagger
 * /sessions/batch/status:
 *   patch:
 *     summary: Batch update status for multiple sessions
 *     tags: [Session]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionIds
 *               - status
 *             properties:
 *               sessionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               status:
 *                 type: string
 *                 enum: [NOT_STARTED, ON_GOING, COMPLETE]
 *     responses:
 *       200:
 *         description: All sessions updated successfully
 *       207:
 *         description: Partial success - some sessions failed to update
 *       400:
 *         description: All sessions failed to update or invalid input
 */
router.patch("/batch/status", batchUpdateStatus);

/**
 * @swagger
 * /sessions/batch/clone:
 *   post:
 *     summary: Batch clone multiple sessions
 *     tags: [Session]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionIds
 *             properties:
 *               sessionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       201:
 *         description: All sessions cloned successfully
 *       207:
 *         description: Partial success - some sessions failed to clone
 *       400:
 *         description: All sessions failed to clone or invalid input
 */
router.post("/batch/clone", batchClone);

/**
 * @swagger
 * /sessions/batch/export-report:
 *   post:
 *     summary: Batch export reports for multiple sessions
 *     tags: [Session]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionIds
 *             properties:
 *               sessionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: All reports generated successfully
 *       207:
 *         description: Partial success - some reports failed to generate
 *       400:
 *         description: All reports failed to generate or invalid input
 */
router.post("/batch/export-report", batchExportReport);

/**
 * @swagger
 * /sessions/batch/delete:
 *   post:
 *     summary: Batch delete multiple sessions (only sessions without participants)
 *     tags: [Session]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionIds
 *             properties:
 *               sessionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: All sessions deleted successfully
 *       207:
 *         description: Partial success - some sessions failed to delete (have participants)
 *       400:
 *         description: All sessions failed to delete or invalid input
 */
router.post("/batch/delete", authorize(['teacher', 'admin']), batchDelete);

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
router.delete("/:sessionId", authorize(['teacher', 'admin']), removeSession);

/**
 * @swagger
 * /sessions/{sessionId}/archive:
 *   patch:
 *     summary: Archive a session by session ID
 *     tags: [Session]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the session
 *     responses:
 *       200:
 *         description: Session archived or deleted successfully
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal server error
 */
router.patch("/:sessionId/archive", archiveSession);

module.exports = router;

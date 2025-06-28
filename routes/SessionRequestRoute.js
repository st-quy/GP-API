const express = require("express");
const router = express.Router();
const {
  getAllSessionRequests,
  getSessionRequestByStudentId,
  createSessionRequest,
  approveSessionRequest,
  rejectSessionRequest,
  approveAllSessionRequest,
  rejectAllSessionRequest
} = require("../controller/SessionRequestController");

/**
 * @swagger
 * tags:
 *   name: SessionRequests
 *   description: API for managing session requests
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SessionRequest:
 *       type: object
 *       properties:
 *         ID:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the session request
 *         status:
 *           type: string
 *           enum:
 *             - pending
 *             - approved
 *             - rejected
 *           description: Current status of the session request
 *         requestDate:
 *           type: string
 *           format: date-time
 *           description: Date and time when the session request was created
 *         SessionID:
 *           type: string
 *           format: uuid
 *           description: Identifier of the session associated with this request
 *         UserID:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: Identifier of the user making the request (optional)
 *
 *     ApiResponseBase:
 *       type: object
 *       properties:
 *         status:
 *           type: integer
 *           description: HTTP status code
 *         message:
 *           type: string
 *           description: Detailed response message
 *
 *     ApiResponseForSessionRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/ApiResponseBase'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/SessionRequest'
 *               description: A single SessionRequest object
 *
 *     ApiResponseForSessionRequestArray:
 *       allOf:
 *         - $ref: '#/components/schemas/ApiResponseBase'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SessionRequest'
 *               description: An array of SessionRequest objects
 */

/**
 * @swagger
 * /session-requests:
 *   post:
 *     summary: Create a session request
 *     tags: [SessionRequests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionKey:
 *                 type: string
 *               UserID:
 *                 type: string
 *     responses:
 *       201:
 *         description: Session request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponseForSessionRequest'
 *
 *       500:
 *         description: Server error
 */
router.post("/", createSessionRequest);

/**
 * @swagger
 * /session-requests/{sessionId}:
 *   get:
 *     summary: Get all session requests by session ID
 *     tags: [SessionRequests]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         schema:
 *           type: string
 *         required: true
 *         description: The session ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - pending
 *             - approved
 *             - rejected
 *         required: false
 *         description: Filter session requests by status
 *     responses:
 *       200:
 *         description: List of session requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponseForSessionRequestArray'
 *
 *       500:
 *         description: Server error
 */
router.get("/:sessionId", getAllSessionRequests);

/**
 * @swagger
 * /session-requests/{sessionId}/student/{studentId}:
 *   get:
 *     summary: Get a session request by student ID
 *     tags: [SessionRequests]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         schema:
 *           type: string
 *         required: true
 *         description: The session ID
 *       - in: path
 *         name: studentId
 *         schema:
 *           type: string
 *         required: true
 *         description: The student ID
 *       - in: query
 *         name: requestId
 *         schema:
 *           type: string
 *         required: false
 *         description: The request ID
 *     responses:
 *       200:
 *         description: Session request details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponseForSessionRequest'
 *       500:
 *         description: Server error
 */
router.get("/:sessionId/student/:studentId", getSessionRequestByStudentId);
/**
 * @swagger
 * /session-requests/{sessionId}/approve:
 *   patch:
 *     summary: Approve a session request
 *     tags: [SessionRequests]
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
 *             properties:
 *               requestId:
 *                 type: string
 *                 description: The ID of the session request to approve
 *     responses:
 *       200:
 *         description: Session request approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponseBase'
 *       500:
 *         description: Server error
 */
router.patch("/:sessionId/approve", approveSessionRequest);

/**
 * @swagger
 * /session-requests/{sessionId}/reject:
 *   patch:
 *     summary: Reject a session request
 *     tags: [SessionRequests]
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
 *             properties:
 *               requestId:
 *                 type: string
 *                 description: The ID of the session request to reject
 *     responses:
 *       200:
 *         description: Session request rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponseBase'
 *       500:
 *         description: Server error
 */
router.patch("/:sessionId/reject", rejectSessionRequest);

router.patch("/:sessionId/approveAll", approveAllSessionRequest);

router.patch("/:sessionId/rejectAll", rejectAllSessionRequest);

module.exports = router;

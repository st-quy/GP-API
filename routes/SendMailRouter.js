const express = require("express");
const { sendEmailSubmit } = require("../controller/SendMailController");
const router = express.Router();

/**
 * @swagger
 * /send-email/{userId}:
 *   post:
 *     summary: Send test confirmation email
 *     description: Send an email to the user confirming test submission.
 *     tags:
 *       - Email
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user receiving the email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionName
 *               - testDetails
 *               - contactInfo
 *             properties:
 *               sessionName:
 *                 type: string
 *                 example: "Math Test Session"
 *               testDetails:
 *                 type: string
 *                 example: "You scored 85/100 in the test."
 *               nextSteps:
 *                 type: string
 *                 example: "Please wait for the final results."
 *               contactInfo:
 *                 type: string
 *                 example: "support@example.com"
 *     responses:
 *       200:
 *         description: Email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Email sent successfully"
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal Server Error
 */
router.post("/:userId", sendEmailSubmit);

module.exports = router;

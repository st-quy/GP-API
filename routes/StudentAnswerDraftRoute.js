const express = require("express");
const router = express.Router();
const {
  storeStudentAnswerDraft,
} = require("../controller/StudentAnswerDraftController");

/**
 * @swagger
 * /student-answer-draft:
 *   post:
 *     summary: Store student's draft answer for a studenAnswer
 *     tags:
 *       - StudentAnswerDraft
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *               - topicId
 *               - studenAnswer
 *             properties:
 *               studentId:
 *                 type: string
 *                 format: uuid
 *                 example: "7a5cb071-5ba0-4ecf-a4cf-b1b62e5f9798"
 *               topicId:
 *                 type: string
 *                 format: uuid
 *                 example: "ef6b69aa-2ec2-4c65-bf48-294fd12e13fc"
 *               studenAnswer:
 *                 type: object
 *                 required:
 *                   - questionId
 *                 properties:
 *                   questionId:
 *                     type: string
 *                     format: uuid
 *                     example: "e6084105-7ceb-42b7-9548-887bcca5a24a"
 *                   answerText:
 *                     oneOf:
 *                       - type: string
 *                         example: null
 *                       - type: array
 *                         items:
 *                           oneOf:
 *                             - type: object
 *                               properties:
 *                                 left:
 *                                   type: string
 *                                   example: "The witness's testimony was ____ and helped to build the case."
 *                                 right:
 *                                   type: string
 *                                   example: "credible"
 *                             - type: object
 *                               properties:
 *                                 key:
 *                                   type: string
 *                                   example: "A. After he finishes, there will be time for studenAnswers."
 *                                 value:
 *                                   type: number
 *                                   example: 5
 *                   answerAudio:
 *                     type: string
 *                     format: uri
 *                     example: "https://res.cloudinary.com/dlhcg0tcz/image/upload/v1742958343/greenprep/SpeakingImg/3.png"
 *     responses:
 *       200:
 *         description: Student answer stored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Stored StudentAnswer successfully
 *       400:
 *         description: Bad request - invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid data format
 *       500:
 *         description: Server error
 */

router.post("/", storeStudentAnswerDraft);

module.exports = router;

const express = require("express");
const router = express.Router();
const {
  storeStudentAnswers,
} = require("../controller/StudentAnswerController");

/**
 * @swagger
 * components:
 *   schemas:
 *     StudentAnswer:
 *       type: object
 *       required:
 *         - studentId
 *         - topicId
 *         - questions
 *         - skillName
 *         - sessionParticipantId
 *         - sessionId
 *       properties:
 *         studentId:
 *           type: string
 *           format: uuid
 *           description: Student ID
 *         topicId:
 *           type: string
 *           format: uuid
 *           description: ID of the topic
 *         sessionId:
 *           type: string
 *           format: uuid
 *           description: ID of the session
 *         skillName:
 *           type: string
 *           description: Name of the skill
 *         sessionParticipantId:
 *           type: string
 *           format: uuid
 *           description: ID of the session participant
 *         questions:
 *           type: array
 *           description: List of answered questions
 *           items:
 *             type: object
 *             required:
 *               - questionId
 *             properties:
 *               questionId:
 *                 type: string
 *                 format: uuid
 *                 description: Question ID
 *               answerText:
 *                 description: Student's answer
 *                 oneOf:
 *                   - type: string
 *                   - type: array
 *                     items:
 *                       oneOf:
 *                         - type: object
 *                           properties:
 *                             left:
 *                               type: string
 *                             right:
 *                               type: string
 *                         - type: object
 *                           properties:
 *                             key:
 *                               type: string
 *                             value:
 *                               oneOf:
 *                                 - type: string
 *                                 - type: number
 *                         - type: object
 *                           properties:
 *                             ID:
 *                               type: number
 *                             answer:
 *                               type: string
 *                   - type: 'null'
 *               answerAudio:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *                 description: URL or path of audio answer
 *       example:
 *         studentId: 7a5cb071-5ba0-4ecf-a4cf-b1b62e5f9798
 *         topicId: ef6b69aa-2ec2-4c65-bf48-294fd12e13fc
 *         skillName: "GRAMMAR AND VOCABULARY"
 *         sessionParticipantId: a8e2b9e8-bb60-44f0-bd61-6bd524cdc87d
 *         sessionId: 12bd21ef-b6d8-4991-b9ee-69160ce8fd09
 *         questions:
 *           - questionId: 4fc5f0df-18e1-449d-a1b9-7ac10b50b3bf
 *             answerText: "Definitely"
 *             answerAudio: null
 *           - questionId: 4cf87f47-525b-4de5-8db2-36dd78890fe1
 *             answerText:
 *               - left: "The witness's testimony was ____ and helped to build the case."
 *                 right: "credible"
 *               - left: "The artist was known for her ____ and unique paintings."
 *                 right: "creative"
 *             answerAudio: null
 *           - questionId: e6084105-7ceb-42b7-9548-887bcca5a24a
 *             answerText: null
 *             answerAudio: "https://res.cloudinary.com/dlhcg0tcz/image/upload/v1742958343/greenprep/SpeakingImg/3.png"
 *           - questionId: 71a40dd5-6458-4f30-af72-fe2fb0758926
 *             answerText:
 *               - key: "A. After he finishes, there will be time for questions."
 *                 value: 5
 *               - key: "B. A staff member will note this down and give you a welcome pack"
 *                 value: 2
 *               - key: "C. If you would like to attend his talk, it will take place in the main hall at midday"
 *                 value: 4
 *               - key: "D. When you arrive at the conference hall, give your booking number."
 *                 value: 1
 *               - key: "E. Inside, you will find a schedule of events and the information of the key speaker"
 *                 value: 3
 *             answerAudio: null
 *           - questionId: 888913fa-3fc1-419f-afc2-8bae2e44a6cb
 *             answerText:
 *               - key: "1. Who needs to use technology for their job?"
 *                 value: "Lucy"
 *               - key: "2. Who mainly uses technology to communicate with their family?"
 *                 value: "Karl"
 *               - key: "3. Who has to have the latest technology products?"
 *                 value: "Beth"
 *               - key: "4. Who thinks children should not use technology?"
 *                 value: "Ken"
 *               - key: "5. Who thinks people rely too much on technology?"
 *                 value: "Karl"
 *               - key: "6. Who doesn't use technology before going to bed?"
 *                 value: "Lucy"
 *               - key: "7. Who likes to use technology for entertainment?"
 *                 value: "Beth"
 *             answerAudio: null
 *           - questionId: 4fc5f0df-18e1-449d-a1b9-7ac10b50b3bf
 *             answerText: "Hello my name is Dang Van Sinh"
 *             answerAudio: null
 *           - questionId: dbd5db28-702b-4f7c-abca-b48c86424835
 *             answerText:
 *               - ID: 1
 *                 answer: "Organizing their resources more effectively."
 *               - ID: 2
 *                 answer: "Get advice from people that have experience."
 *             answerAudio: null
 */

/**
 * @swagger
 * /student-answers:
 *   post:
 *     summary: Save student answers
 *     tags: [StudentAnswer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StudentAnswer'
 *     responses:
 *       200:
 *         description: Answer saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Create Student Answer Successfully
 *                 data:
 *                   type: object
 *                   nullable: true
 *       400:
 *         description: Invalid data
 *       500:
 *         description: Server error
 */

router.post("/", storeStudentAnswers);

module.exports = router;

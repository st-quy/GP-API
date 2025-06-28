const express = require("express");
const router = express.Router();

const { getFileURL } = require("../controller/MinIOController");

/**
 * @swagger
 * /presigned-url:
 *   get:
 *     summary: Get presigned URL for file download
 *     tags: [Files]
 *     parameters:
 *       - in: query
 *         name: filename
 *         schema:
 *           type: string
 *         required: true
 *         description: Name of the file to get presigned URL for
 *     responses:
 *       200:
 *         description: Presigned URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: The presigned URL for file download
 *       400:
 *         description: Invalid request - filename not provided
 *       500:
 *         description: Server error
 */
router.get("/", getFileURL);
module.exports = router;

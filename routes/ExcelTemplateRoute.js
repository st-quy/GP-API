const express = require("express");
const {
  handleExportTemplate,
  upload,
  handleImportExcel,
} = require("../controller/ExcelTemplateController");

const router = express.Router();
/**
 * @swagger
 * excel/import-excel:
 *   post:
 *     summary: Import questions from Excel file
 *     tags:
 *       - Excel
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The Excel file to upload
 *     responses:
 *       200:
 *         description: Successfully imported questions from Excel
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: Grouped question data
 *       400:
 *         description: No file uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: No file uploaded
 *       500:
 *         description: Failed to import Excel data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Failed to import Excel data
 *                 error:
 *                   type: string
 *                   description: Error message
 */
router.post("/import-excel", upload.single("file"), handleImportExcel);

/**
 * @swagger
 * excel/export-template:
 *   get:
 *     summary: "Export Test Template"
 *     tags:
 *       - Excel
 *     description: "Exports a test template in Excel format."
 *     responses:
 *       200:
 *         description: "Template exported successfully"
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *             encoding:
 *               contentType: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
 *       500:
 *         description: "Error exporting template"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: "Error message"
 */

router.get("/export-template", handleExportTemplate);

module.exports = router;

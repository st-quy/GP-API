const {
  generateTemplateFile,
  parseExcelBuffer,
} = require("../services/GenerateExcelTemplateService");
const multer = require("multer");
const upload = multer();

const handleExportTemplate = async (req, res) => {
  try {
    const filePath = await generateTemplateFile();
    res.download(filePath, "template.xlsx");
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to export test template", error: err.message });
  }
};

const handleImportExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    try {
      const groupedData = await parseExcelBuffer(req.file.buffer);
      res.status(groupedData.status).json(groupedData);
    } catch (error) {
      res.status(error.status).json({ message: error.message });
    }
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to import Excel data", error: err.message });
  }
};

module.exports = { handleExportTemplate, upload, handleImportExcel };

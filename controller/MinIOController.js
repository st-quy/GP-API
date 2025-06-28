const UploadFileService = require("../services/MinIOService");

async function getFileURL(req, res) {
  const { filename } = req.query;

  try {
    const result = await UploadFileService.uploadAudioToMinIO(filename);
    return res.status(result.status).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getFileURL,
};

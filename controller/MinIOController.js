const UploadFileService = require('../services/MinIOService');

async function getFileURL(req, res) {
  const { filename } = req.query;

  try {
    const result = await UploadFileService.uploadAudioToMinIO(filename);
    return res.status(result.status).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

const getUploadUrl = async (req, res) => {
  try {
    const { fileName, type } = req.body;

    if (!fileName) {
      return res.status(400).json({ message: 'fileName is required' });
    }

    const result = await UploadFileService.uploadToMinIO(type, fileName);
    return res.status(200).json(result.data);
  } catch (error) {
    console.error('getImageUploadUrl error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getFileURL,
  getUploadUrl,
};

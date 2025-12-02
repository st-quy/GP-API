const SectionService = require('../services/SectionService');

const getAllSection = async (req, res) => {
  try {
    const sections = await SectionService.getAllSection(req);
    return res.status(sections.status).json(sections);
  } catch (error) {
    console.error('Error fetching sections:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getAllSection,
};

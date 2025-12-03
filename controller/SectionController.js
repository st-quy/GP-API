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

const createSection = async (req, res) => {
  try {
    const result = await SectionService.createSection(req);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error('Error creating section:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  } 
};

/* ============================================
   UPDATE SECTION
============================================ */
const updateSection = async (req, res) => {
  try {
    const result = await SectionService.updateSection(req);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error('Error updating section:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/* ============================================
   DELETE SECTION
============================================ */
const deleteSection = async (req, res) => {
  try {
    const result = await SectionService.deleteSection(req);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error('Error deleting section:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getAllSection,
  createSection,
  updateSection,
  deleteSection,
};

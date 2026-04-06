const SectionService = require('../services/SectionService');
const QuestionService = require('../services/QuestionService');

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
   UPDATE SECTION STATUS
============================================ */
const updateSectionStatus = async (req, res) => {
  try {
    const result = await SectionService.updateSectionStatus(req);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error('Error updating section status:', error.message);
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

const getSectionDetail = async (req, res) => {
  try {
    const result = await SectionService.getSectionDetail(req);
    return res.status(result.status).json(result);
  } catch (err) {
    console.error('Error fetching section detail:', err);
    return res.status(500).json({
      message: 'Internal server error',
      error: err.message,
    });
  }
};

const createDraftSection = async (req, res) => {
  try {
    const result = await SectionService.createDraftSection(req);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error('Error creating draft section:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getDraftBySkill = async (req, res) => {
  try {
    const result = await SectionService.getDraftBySkill(req);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error('Error fetching draft:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const archiveSection = async (req, res) => {
  try {
    const result = await SectionService.archiveSection(req);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error('Error archiving section:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/* ============================================
   DUPLICATE SECTION
============================================ */
const duplicateSection = async (req, res) => {
  try {
    const result = await QuestionService.duplicateSection(req);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error('Error duplicating section:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getAllSection,
  createSection,
  updateSection,
  updateSectionStatus,
  archiveSection,
  deleteSection,
  getSectionDetail,
  createDraftSection,
  getDraftBySkill,
  duplicateSection,
};

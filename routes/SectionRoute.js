const express = require('express');
const router = express.Router();

const {
  getAllSection,
  updateSection,
  deleteSection,
} = require('../controller/SectionController');
const { getAllSection, createSection } = require('../controller/SectionController');

router.get('/', getAllSection);
router.put('/:id', updateSection);
router.delete('/:id', deleteSection);

router.post('/', createSection);

module.exports = router;

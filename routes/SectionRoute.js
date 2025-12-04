const express = require('express');
const router = express.Router();

const {
  getAllSection,
  updateSection,
  deleteSection,
  createSection,
  getSectionDetail,
} = require('../controller/SectionController');

router.get('/', getAllSection);
router.put('/:id', updateSection);
router.delete('/:id', deleteSection);
router.get('/:id', getSectionDetail);

router.post('/', createSection);

module.exports = router;

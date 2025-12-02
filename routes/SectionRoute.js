const express = require('express');
const router = express.Router();

const {
  getAllSection,
  updateSection,
  deleteSection,
} = require('../controller/SectionController');

router.get('/', getAllSection);
router.put('/:id', updateSection);
router.delete('/:id', deleteSection);

module.exports = router;

const express = require('express');
const router = express.Router();
const { authorize } = require('../middleware/AuthMiddleware');

const {
  getAllSection,
  updateSection,
  deleteSection,
  createSection,
  getSectionDetail,
} = require('../controller/SectionController');

router.get('/', getAllSection);
router.put('/:id', authorize(['teacher', 'admin']), updateSection);
router.delete('/:id', authorize(['teacher', 'admin']), deleteSection);
router.get('/:id', getSectionDetail);
router.post('/', authorize(['teacher', 'admin']), createSection);

module.exports = router;

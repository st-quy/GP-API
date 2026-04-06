const express = require('express');
const router = express.Router();
const { authorize } = require('../middleware/AuthMiddleware');

const {
  getAllSection,
  updateSection,
  updateSectionStatus,
  archiveSection,
  deleteSection,
  createSection,
  getSectionDetail,
  createDraftSection,
  getDraftBySkill,
} = require('../controller/SectionController');

router.get('/', getAllSection);
router.put('/:id', authorize(['teacher', 'admin']), updateSection);
router.put('/:id/status', authorize(['teacher', 'admin']), updateSectionStatus);
router.put('/:id/archive', authorize(['teacher', 'admin']), archiveSection);
router.delete('/:id', authorize(['teacher', 'admin']), deleteSection);
router.get('/:id', getSectionDetail);
router.post('/', authorize(['teacher', 'admin']), createSection);
router.post('/draft', authorize(['teacher', 'admin']), createDraftSection);
router.get('/draft/:skillName', authorize(['teacher', 'admin']), getDraftBySkill);

module.exports = router;

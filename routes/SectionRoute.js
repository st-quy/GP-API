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
  duplicateSection,
  bulkPublishSections,
  bulkDeleteSections,
  bulkDuplicateSections,
} = require('../controller/SectionController');

router.get('/', getAllSection);
router.post('/bulk-publish', authorize(['teacher', 'admin']), bulkPublishSections);
router.delete('/bulk', authorize(['teacher', 'admin']), bulkDeleteSections);
router.post('/bulk-duplicate', authorize(['teacher', 'admin']), bulkDuplicateSections);
router.put('/:id', authorize(['teacher', 'admin']), updateSection);
router.put('/:id/status', authorize(['teacher', 'admin']), updateSectionStatus);
router.put('/:id/archive', authorize(['teacher', 'admin']), archiveSection);
router.delete('/:id', authorize(['teacher', 'admin']), deleteSection);
router.get('/:id', getSectionDetail);
router.post('/', authorize(['teacher', 'admin']), createSection);
router.post('/draft', authorize(['teacher', 'admin']), createDraftSection);
router.get('/draft/:skillName', authorize(['teacher', 'admin']), getDraftBySkill);
router.post('/:id/duplicate', authorize(['teacher', 'admin']), duplicateSection);

module.exports = router;

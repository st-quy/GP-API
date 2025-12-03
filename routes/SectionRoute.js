const express = require('express');
const router = express.Router();

const { getAllSection, createSection } = require('../controller/SectionController');

router.get('/', getAllSection);

router.post('/', createSection);

module.exports = router;

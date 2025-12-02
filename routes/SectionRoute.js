const express = require('express');
const router = express.Router();

const { getAllSection } = require('../controller/SectionController');

router.get('/', getAllSection);

module.exports = router;

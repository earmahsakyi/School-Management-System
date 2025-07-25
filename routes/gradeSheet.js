const express = require('express');
const router = express.Router();
const { generateMasterGradeSheet } = require('../controllers/masterGradeSheetController');

router.get('/', generateMasterGradeSheet);

module.exports = router;

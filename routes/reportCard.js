const express = require('express');
const router = express.Router();
const { getReportCardData } = require('../controllers/reportCardController');
const auth = require('../middleware/auth');

// @desc    Get report card data for a student
// @route   GET /api/reportcard/:studentId/:academicYear
// @access  Private
router.get('/:studentId/:academicYear/:term', getReportCardData);

module.exports = router;
const express = require('express');
const router = express.Router();
const { getReportCardData } = require('../controllers/reportCardController');

// @desc    Get report card data for a student (Annual Report - term is optional)
// @route   GET /api/reportcard/:studentId/:academicYear
// @access  Private
router.get('/:studentId/:academicYear',  getReportCardData); // Added auth middleware

// @desc    Get report card data for a student (Specific Term Report - term is required)
// @route   GET /api/reportcard/:studentId/:academicYear/:term
// @access  Private
router.get('/:studentId/:academicYear/:term', getReportCardData); // Added auth middleware

module.exports = router;
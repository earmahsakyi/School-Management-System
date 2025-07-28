const express = require('express');
const router = express.Router();
const { generateFinancialReport, getFinancialReportData } = require('../controllers/financialReportController');

// Route to generate and download financial report PDF
router.get('/report', generateFinancialReport);

// Route to get financial report data (for preview/API)
router.get('/report-data', getFinancialReportData);

module.exports = router;
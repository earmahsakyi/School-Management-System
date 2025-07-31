const express = require('express');
const router = express.Router();
const { 
  generateTvetFinancialReport, 
  getTvetFinancialReportData,
  getTvetPaymentSummaryByStudent 
} = require('../controllers/tvetFinancialReportController');

// Route to generate and download TVET financial report PDF
router.get('/report', generateTvetFinancialReport);

// Route to get TVET financial report data (for preview/API)
router.get('/report-data', getTvetFinancialReportData);

// Route to get payment summary grouped by student
router.get('/student-summary', getTvetPaymentSummaryByStudent);

module.exports = router;
const express = require('express');
const router = express.Router();
const otherPaymentReportController = require('../controllers/otherPaymentReportController');

// Route to generate and download the PDF report for other payments
router.get('/report', otherPaymentReportController.generateOtherPaymentReport);

// Route to fetch report data for front-end preview
router.get('/report-data', otherPaymentReportController.getOtherPaymentsReportData);

module.exports = router;
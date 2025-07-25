const express = require('express');
const router = express.Router();
const transcriptController = require('../controllers/transcriptController');

// @route   GET /api/transcript/:studentId
// @desc    Generate and return academic transcript PDF
// @access  Private (you can add auth middleware if needed)
router.get('/:studentId', transcriptController.getTranscriptPdf);

module.exports = router;    

const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/generateRecommendationController');

// @route   POST /api/recommendation/:studentId
// @desc    Generate and download recommendation PDF with form data
// @access  Private (add auth middleware as needed)
router.post('/:studentId', recommendationController.getRecommendationPdf);

// @route   GET /api/recommendation/preview/:studentId
// @desc    Get student data for recommendation preview
// @access  Private
router.get('/preview/:studentId', recommendationController.previewRecommendation);

module.exports = router;
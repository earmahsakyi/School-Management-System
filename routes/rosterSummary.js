const express = require('express');
const router = express.Router();
const { generateRoosterSummary } = require('../controllers/rosterSummaryController');

router.get('/', generateRoosterSummary);

module.exports = router;
const express = require('express');
const router = express.Router();
const {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} = require('../controllers/announcementController');
const auth = require('../middleware/auth');

router.route('/').get(auth, getAnnouncements).post(auth, createAnnouncement);
router.route('/:id').delete(auth, deleteAnnouncement);

module.exports = router;

const Announcement = require('../models/Announcement');

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Private
exports.getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ date: -1 });
    res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements,
    });
  } catch (err) {
    console.error('Get announcements error:', err);
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
};

// @desc    Create new announcement
// @route   POST /api/announcements
// @access  Private
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, description, date, time, priority, category } = req.body;

    const announcement = await Announcement.create({
      title,
      description,
      date,
      time,
      priority,
      category,
    });

    res.status(201).json({
      success: true,
      data: announcement,
    });
  } catch (err) {
    console.error('Create announcement error:', err);
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
};  

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private
exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);

    if (!announcement) {
      return res.status(404).json({ success: false, msg: 'Announcement not found' });
    }

    res.status(200).json({ success: true, msg: 'Announcement deleted successfully' });
  } catch (err) {
    console.error('Delete announcement error:', err);
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
};

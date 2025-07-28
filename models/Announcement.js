const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    required: true,
  },
  category: {
    type: String,
    enum: ['Event', 'Schedule', 'News'],
    required: true,
  },
});

module.exports = mongoose.model('Announcement', announcementSchema);

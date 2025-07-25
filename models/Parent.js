const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema({
    name: {
    type: String,
    required: [true, "Parent name is required"],
    trim: true
  },
  phone: {
    type: String,
    required: [true, "Phone number is required"],
    trim: true
  },
  occupation:{  
    type: String,  
    required: [true, "Occupation  is required"],
    trim: true
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    default: '',
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('Parent', parentSchema);

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
  sparse: true,
  set: function(v) {
    // Convert null, empty string, or undefined to undefined
    return (v === null || v === '' || v === undefined) ? undefined : v;
  },
  validate: {
    validator: function(v) {
      return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    },
    message: 'Please enter a valid email address'
  }
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

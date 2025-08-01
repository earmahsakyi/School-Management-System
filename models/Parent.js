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

parentSchema.index(
  { email: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { 
      email: { $exists: true, $ne: null, $ne: "" } 
    } 
  }
);

module.exports = mongoose.model('Parent', parentSchema);

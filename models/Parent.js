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
  validate: [
    {
      validator: function(v) {
        return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email address'
    },
    {
      validator: async function(v) {
        if (!v) return true; // Allow empty/null values
        
        const count = await this.constructor.countDocuments({ 
          email: v, 
          _id: { $ne: this._id } 
        });
        return count === 0;
      },
      message: 'Email already exists'
    }
  ]
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

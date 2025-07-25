const mongoose = require('mongoose');

const AdminSchema =  new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  fullName: {
    type: String,
    required: true

  },
  phone: {
    type: String,
    required: true

  },
  staffId:{

  },
  department: {
     type: String,
    required : true
  },

  position: { 
    type: String,
    required : true
},
gender: { 
    type: String,
    enum: ['Male', 'Female', 'Other'] 
},
lastLogin: { type: Date },

 status: { type: String,
     enum: ['Active', 'Suspended'], 
     default: 'Active'
     },

  photo: {
    type: String,
    default: '', 
  },
  createdAt: { type: Date,
     default: Date.now 
    }

},{ timestamps: true });

module.exports = mongoose.model('Admin', AdminSchema);
          
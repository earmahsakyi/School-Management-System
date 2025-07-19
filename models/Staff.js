const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  middleName: {
    type: String,
    trim: true,
    default: ''
  },
  dob: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  placeOfBirth: {
    type: String,
    required: [true, "Place of birth is required"],
    trim: true
  },
  gender: {
    type: String,  
    enum: ['Male', 'Female', 'Other'],
    required: [true, 'Gender is required']
  },
  position: {
    type: String,
    required: [true, 'Position is required']
  },
  department: {
    type: String,
    enum: ['Arts', 'Science', 'Administration', 'Other'],
    required: [true, 'Department is required']
  },
  qualifications: {
    type: [String], // e.g. ["B.Ed Mathematics", "M.Sc Education"]
    default: []
  },
  staffId: {
    type: String,
    unique: true,
    required: [true, 'Staff ID is required']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  email: {
    type: String,
    lowercase: true,
    unique: true,
    required: [true, 'Email is required']
  },
  photo: {
    type: String,
    default: ''
  },
  // Optional uploads
  certificate: {
    type: String,
    default: ''  
  },
  leaveRecords: [
    {
      type: new mongoose.Schema({
        startDate: Date,
        endDate: Date,
        reason: String,
        status: {
          type: String,
          enum: ['Pending', 'Approved', 'Rejected'],
          default: 'Pending'
        }
      }, { _id: false })
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Staff', staffSchema);

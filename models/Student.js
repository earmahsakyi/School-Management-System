const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "First name is required"],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, "Last name is required"],
    trim: true
  },
  middleName: {
    type: String,
    trim: true,
    default: ''
  },
  dob: {
    type: Date,
    required: [true, "Date of birth is required"]
  },
  placeOfBirth: {
    type: String,
    required: [true, "Place of birth is required"],
    trim: true
  },
    currentAddress: {
    type: String,
    required: [true, "Current Address is required"],
    trim: true
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
    required: [true, "Gender is required"]
  },
  gradeLevel: {
    type: String,
    enum: ["7", "8", "9", "10", "11", "12"],
    required: [true, "Grade level is required"]
  },
  department: {
    type: String,
    enum: ["Arts", "Science", "JHS"],
    default: null
  },
  classSection: {
    type: String,
    trim: true
  },
  lastSchoolAttended: {
    type: String,
     required: [true, "Last school attended is required"],
    trim: true
  },
  admissionNumber: {
    type: String,
    unique: true,  
    required: [true, "Admission number is required"],
    trim: true
  },
  photo: {
    type: String,
    default: ''
  },

  // Optional uploads
  transcript: {
    type: String,
    default: ''  
  },
  reportCard: {
    type: String,
    default: ''  
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent'
  },
promotionStatus: {
  type: String,
  enum: ['Promoted', 'Not Promoted', 'Conditional Promotion', 'Asked Not to Enroll','Graduated'],
  default: 'Not Promoted'
},
promotedToGrade: {
  type: String, // example: "9"
  default: null
},
graduated: {
  type: Boolean,
  default: false
},
graduationDate: {
  type: Date,
  default: null
}

}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);

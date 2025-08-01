const mongoose = require('mongoose');

const paymentOtherSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: false, // Made optional to allow manual entries
  },
  amount: {
    type: Number,
    required: true,
  },
  dateOfPayment: {
    type: Date,
    default: Date.now,
  },
  receiptNumber: {
    type: String,
    unique: true,
    required: true,
    trim: true,
  },
  bankDepositNumber: {
    type: String,
    trim: true,
    default: ''
  },
  paymentOf: {
    type: String,
    trim: true,
    default: ''
  },
  description: {
    type: String,
    trim: true,
    default: 'Academic Payment'
  },
  academicYear: {
    type: String,
    required: true,
    trim: true
  },
  manualStudentDetails: {
    type: {
      firstName: { type: String, trim: true, default: '-' },
      lastName: { type: String, trim: true, default: '-' },
      middleName: { type: String, trim: true, default: '-' },
      admissionNumber: { type: String, trim: true, default: '-' },
      gradeLevel: { type: String, trim: true, default: '-' },
      department: { type: String, trim: true, default: '-' }
    },
    required: false // Only required if student field is null
  }
}, { timestamps: true });

// Ensure at least one of student or manualStudentDetails is provided
paymentOtherSchema.pre('save', function(next) {
  if (!this.student && !this.manualStudentDetails) {
    return next(new Error('Either student or manualStudentDetails must be provided'));
  }
  next();
});

module.exports = mongoose.model('OtherPayment', paymentOtherSchema);
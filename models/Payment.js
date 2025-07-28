const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
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
  moeRegistration: { 
    type: String,
    trim: true,
    default: 'MOE Registration' 
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
  }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
// models/Payment.js
const mongoose = require('mongoose');

const paymentOtherSchema = new mongoose.Schema({
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
  }
}, { timestamps: true });

module.exports = mongoose.model('OtherPayment', paymentOtherSchema);
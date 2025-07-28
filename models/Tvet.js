const mongoose = require("mongoose");

const TvetSchema = new mongoose.Schema({
  receiptNumber: {
    type: String,
    required: true,
    unique: true,
  },
  depositNumber: {
    type: String,
    required: true,
  },
  dateOfPayment: {
    type: Date,
    required: true,
  },
  studentID: {
    type: String, 
    required: true,
  },
  studentName: {
    type: String,
    required: true,
  },
  breakdown: [
    {
      description: { type: String, required: true },
      amount: { type: Number, required: true },
    }
  ],
  firstInstallment: {
    type: Number,
    default: 0,
  },
  secondInstallment: {
    type: Number,
    default: 0,
  },
  thirdInstallment: {
    type: Number,
    default: 0,
  },
  totalPaid: {
    type: Number,
    default: 0,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model("Tvet", TvetSchema);

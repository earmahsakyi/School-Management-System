const mongoose = require('mongoose');

const promotionRecordSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  previousGrade: {
    type: String,
    enum: ['7', '8', '9', '10', '11', '12'],
    required: true
  },
  newGrade: {
    type: String,
    enum: ['7', '8', '9', '10', '11', '12'],
    required: true
  },
  promotionStatus: {
    type: String,
    enum: ['Promoted', 'Not Promoted', 'Conditional Promotion', 'Asked Not to Enroll'],
    required: true
  },
  promotedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin', 
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  },
  graduated: {
  type: Boolean,
  default: false
}
}, { timestamps: true });

module.exports = mongoose.model('PromotionRecord', promotionRecordSchema);

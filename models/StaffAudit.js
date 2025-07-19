const mongoose = require('mongoose');

const staffAuditSchema = new mongoose.Schema({
  staff: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Staff',
    required: true 
  },
  action: {
    type: String,
    enum: ['created', 'updated', 'deleted'],
    required: true
  },
  fieldsChanged: [String],
  performedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Admin',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('StaffAudit', staffAuditSchema);

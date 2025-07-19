const Staff = require('../models/Staff');

async function generateStaffID () {
  const count = await Staff.countDocuments();
  const nextNumber = 25001 + count;
  return `VMHS${nextNumber}`;
}

module.exports = generateStaffID;

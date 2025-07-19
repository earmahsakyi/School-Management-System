const Student = require('../models/Student');

async function generateAdmissionNumber() {
  const count = await Student.countDocuments();
  const nextNumber = 25001 + count;
  return `A${nextNumber}`;
}

module.exports = generateAdmissionNumber;

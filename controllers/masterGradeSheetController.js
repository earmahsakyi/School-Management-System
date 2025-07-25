// controllers/generateMasterGradeSheet.js
const Student = require('../models/Student');
const generateMasterGradeSheetPdf  = require('../utils/masterGradeSheet');

exports.generateMasterGradeSheet = async (req, res) => {
  try {
    const { gradeLevel, classSection, subject, academicYear } = req.query;

    if (!gradeLevel || !classSection || !subject) {
      return res.status(400).json({ error: 'Missing required query parameters: gradeLevel, classSection, subject' });
    }

    const students = await Student.find({ gradeLevel, classSection })
      .sort({ lastName: 1, firstName: 1 }) // Optional for order
      .select('firstName lastName middleName gender admissionNumber');

    if (!students || students.length === 0) {
      return res.status(404).json({ error: 'No students found for specified criteria.' });
    }

    const pdfBuffer = await generateMasterGradeSheetPdf({
      students,
      gradeLevel,
      classSection,
      subject,
      academicYear: academicYear || new Date().getFullYear().toString()
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="master_grade_sheet.pdf"');
    res.send(pdfBuffer);

  } catch (err) {
    console.error('Error generating master grade sheet:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

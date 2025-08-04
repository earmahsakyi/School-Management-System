const Student = require('../models/Student');
const generateMasterGradeSheetPdf = require('../utils/masterGradeSheet');

exports.generateMasterGradeSheet = async (req, res) => {
  try {
    const { gradeLevel, classSection, subject, academicYear, department } = req.query;

    // Validate required query parameters
    if (!gradeLevel || !classSection || !subject) {
      return res.status(400).json({ error: 'Missing required query parameters: gradeLevel, classSection, subject' });
    }

    // Build query object
    const query = { gradeLevel, classSection };
    if (department) {
      query.department = department;
    }

    const students = await Student.find(query)
      .sort({ lastName: 1, firstName: 1 })
      .select('firstName lastName middleName gender admissionNumber department');

    if (!students || students.length === 0) {
      return res.status(404).json({ error: 'No students found for specified criteria.' });
    }

    const pdfBuffer = await generateMasterGradeSheetPdf({
      students,
      gradeLevel,
      classSection,
      subject,
      academicYear: academicYear || new Date().getFullYear().toString(),
      department: department || 'Not Specified'
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="master_grade_sheet_${gradeLevel}_${classSection}_${subject}_${academicYear}.pdf"`);
    res.send(pdfBuffer);

  } catch (err) {
    console.error('Error generating master grade sheet:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
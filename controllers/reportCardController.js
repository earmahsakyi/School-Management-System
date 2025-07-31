const Student = require('../models/Student');
const Grade = require('../models/Grade');
const generatePdf = require('../utils/generatePDF');

// @desc    Get report card data for a student
// @route   GET /api/reportcard/:studentId/:academicYear/:term?
// @access  Private
exports.getReportCardData = async (req, res) => {
  try {
    const { studentId, academicYear, term } = req.params;
    const decodedAcademicYear = decodeURIComponent(academicYear);

    // Find student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, msg: 'Student not found' });
    }

    // Build query based on whether term is specified
    const gradeQuery = {
      student: studentId,
      academicYear: decodedAcademicYear
    };

    if (term) {
      gradeQuery.term = term;
    }

    // Find grades with the query
    let grades = await Grade.find(gradeQuery).sort({ term: 1 });

    if (!grades || grades.length === 0) {
      return res.status(404).json({ 
        success: false, 
        msg: term 
          ? `No grades found for term ${term}`
          : 'No grades found for this academic year'
      });
    }

    // Prepare data for PDF generation
    const reportCardData = {
      success: true,
      data: grades.map(grade => ({
        ...grade.toObject(),
        student: {
          _id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          middleName: student.middleName || '',
          gender: student.gender,
          gradeLevel: student.gradeLevel,
          admissionNumber: student.admissionNumber,
          promotionStatus: student.promotionStatus,
          department: student.department,
          classSection: student.classSection,
          dob: student.dob,
          promotionStatus: student.promotionStatus,
          promotedToGrade: student.promotedToGrade,
        }
      })),
      pagination: {
        current: 1,
        pages: 1,
        total: grades.length
      },
      // Add metadata about the report type
      reportType: term ? `Term ${term} Report Card` : 'Annual Report Card'
    };

    // Generate PDF
    const pdfBuffer = await generatePdf(reportCardData);

    // Set filename based on term
    const filename = term
      ? `report-card-term-${term}-${student.admissionNumber}-${academicYear}.pdf`
      : `report-card-annual-${student.admissionNumber}-${academicYear}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length,
      'Content-Disposition': `attachment; filename="${filename}"`
    });

    res.send(pdfBuffer);

  } catch (err) {
    console.error('Get report card data error:', err);
    res.status(500).json({
      success: false,
      msg: 'Server Error',
      error: err.message,
    });
  }
};
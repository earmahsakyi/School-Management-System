const Payment = require('../models/Payment');
const generateFinancialReportPdf = require('../utils/financialReportGenerator');

exports.generateFinancialReport = async (req, res) => {
  try {
    const { academicYear, gradeLevel, classSection, department, startDate, endDate } = req.query;

    if (!academicYear) {
      return res.status(400).json({ message: 'Academic year is required for financial report.' });
    }

    let query = { academicYear };

    if (gradeLevel) {
      
    }
    if (classSection) {
      
    }
    if (department) {
      
    }
    if (startDate && endDate) {
      query.dateOfPayment = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (startDate) {
      query.dateOfPayment = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.dateOfPayment = { $lte: new Date(endDate) };
    }

    const payments = await Payment.find(query).populate('student', 'firstName lastName middleName gender gradeLevel classSection department').lean();

    // Filter payments based on student details if gradeLevel, classSection, or department are provided
    const filteredPayments = payments.filter(payment => {
      if (!payment.student) return false; // Skip if student data is missing

      let matches = true;
      if (gradeLevel && payment.student.gradeLevel !== gradeLevel) {
        matches = false;
      }
      if (classSection && payment.student.classSection !== classSection) {
        matches = false;
      }
      if (department && payment.student.department !== department) {
        matches = false;
      }
      return matches;
    });

    const pdfBuffer = await generateFinancialReportPdf({
      payments: filteredPayments,
      filters: { academicYear, gradeLevel, classSection, department, startDate, endDate },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=financial_report_${academicYear}.pdf`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating financial report:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
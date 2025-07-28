// controllers/financialReportController.js
const Student = require('../models/Student');
const Payment = require('../models/Payment');
const generateFinancialReportPdf = require('../utils/financialReport');

exports.generateFinancialReport = async (req, res) => {
  try {
    const { gradeLevel, classSection, academicYear, startDate, endDate } = req.query;

    if (!gradeLevel || !classSection || !academicYear) {
      return res.status(400).json({ 
        error: 'Missing required query parameters: gradeLevel, classSection, academicYear' 
      });
    }

    // Find students matching the criteria
    const students = await Student.find({ gradeLevel, classSection })
      .sort({ lastName: 1, firstName: 1 });

    if (!students || students.length === 0) {
      return res.status(404).json({ 
        error: 'No students found for specified criteria.' 
      });
    }

    // Extract student IDs
    const studentIds = students.map(student => student._id);

    // Build payment query
    let paymentQuery = {
      student: { $in: studentIds },
      academicYear: academicYear
    };

    // Add date range filter if provided
    if (startDate || endDate) {
      paymentQuery.dateOfPayment = {};
      if (startDate) {
        paymentQuery.dateOfPayment.$gte = new Date(startDate);
      }
      if (endDate) {
        paymentQuery.dateOfPayment.$lte = new Date(endDate);
      }
    }

    // Find payments and populate student data
    const payments = await Payment.find(paymentQuery)
      .populate('student', 'firstName lastName middleName gender admissionNumber')
      .sort({ dateOfPayment: -1 });

    if (!payments || payments.length === 0) {
      return res.status(404).json({ 
        error: 'No payments found for the specified criteria.' 
      });
    }

    // Transform payments data to include student info directly
    const paymentsWithStudentInfo = payments.map(payment => ({
      _id: payment._id,
      amount: payment.amount,
      dateOfPayment: payment.dateOfPayment,
      receiptNumber: payment.receiptNumber,
      bankDepositNumber: payment.bankDepositNumber,
      moeRegistration: payment.moeRegistration,
      description: payment.description,
      academicYear: payment.academicYear,
      student: {
        firstName: payment.student.firstName,
        lastName: payment.student.lastName,
        middleName: payment.student.middleName,
        gender: payment.student.gender,
        admissionNumber: payment.student.admissionNumber
      }
    }));

    const pdfBuffer = await generateFinancialReportPdf({
      payments: paymentsWithStudentInfo,
      gradeLevel,
      classSection,
      academicYear,
      filters: {
        gradeLevel,
        classSection,
        academicYear,
        startDate,
        endDate
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="financial_report.pdf"');
    res.send(pdfBuffer);

  } catch (err) {
    console.error('Error generating financial report:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getFinancialReportData = async (req, res) => {
  try {
    const { gradeLevel, classSection, academicYear, startDate, endDate } = req.query;

    if (!gradeLevel || !classSection || !academicYear) {
      return res.status(400).json({ 
        error: 'Missing required query parameters: gradeLevel, classSection, academicYear' 
      });
    }

    // Find students matching the criteria
    const students = await Student.find({ gradeLevel, classSection })
      .sort({ lastName: 1, firstName: 1 });

    if (!students || students.length === 0) {
      return res.status(404).json({ 
        error: 'No students found for specified criteria.' 
      });
    }

    // Extract student IDs
    const studentIds = students.map(student => student._id);

    // Build payment query
    let paymentQuery = {
      student: { $in: studentIds },
      academicYear: academicYear
    };

    // Add date range filter if provided
    if (startDate || endDate) {
      paymentQuery.dateOfPayment = {};
      if (startDate) {
        paymentQuery.dateOfPayment.$gte = new Date(startDate);
      }
      if (endDate) {
        paymentQuery.dateOfPayment.$lte = new Date(endDate);
      }
    }

    // Find payments and populate student data
    const payments = await Payment.find(paymentQuery)
      .populate('student', 'firstName lastName middleName gender admissionNumber')
      .sort({ dateOfPayment: -1 });

    // Calculate total amount
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);

    // Transform payments data
    const paymentsWithStudentInfo = payments.map(payment => ({
      _id: payment._id,
      amount: payment.amount,
      dateOfPayment: payment.dateOfPayment,
      receiptNumber: payment.receiptNumber,
      bankDepositNumber: payment.bankDepositNumber,
      moeRegistration: payment.moeRegistration,
      description: payment.description,
      academicYear: payment.academicYear,
      student: {
        firstName: payment.student.firstName,
        lastName: payment.student.lastName,
        middleName: payment.student.middleName,
        gender: payment.student.gender,
        admissionNumber: payment.student.admissionNumber
      }
    }));

    res.status(200).json({
      success: true,
      data: {
        payments: paymentsWithStudentInfo,
        totalAmount,
        totalCount: payments.length,
        filters: {
          gradeLevel,
          classSection,
          academicYear,
          startDate,
          endDate
        }
      }
    });

  } catch (err) {
    console.error('Error fetching financial report data:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
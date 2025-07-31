const Tvet = require('../models/Tvet');
const generateTvetFinancialReportPdf = require('../utils/tvetFinancialReport');

exports.generateTvetFinancialReport = async (req, res) => {
  try {
    const { academicYear, startDate, endDate, studentID, studentName } = req.query;

    // Build query object
    let query = {};

    // Add date range filter if provided
    if (startDate || endDate) {
      query.dateOfPayment = {};
      if (startDate) {
        query.dateOfPayment.$gte = new Date(startDate);
      }
      if (endDate) {
        query.dateOfPayment.$lte = new Date(endDate);
      }
    }

    // Add student filters if provided
    if (studentID) {
      query.studentID = { $regex: studentID, $options: 'i' };
    }

    if (studentName) {
      query.studentName = { $regex: studentName, $options: 'i' };
    }

    // Find TVET payments matching the criteria
    const tvetPayments = await Tvet.find(query)
      .sort({ dateOfPayment: -1 });

    if (!tvetPayments || tvetPayments.length === 0) {
      return res.status(404).json({ 
        error: 'No TVET payments found for the specified criteria.' 
      });
    }

    const pdfBuffer = await generateTvetFinancialReportPdf({
      payments: tvetPayments,
      filters: {
        academicYear,
        startDate,
        endDate,
        studentID,
        studentName
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="tvet_financial_report.pdf"');
    res.send(pdfBuffer);

  } catch (err) {
    console.error('Error generating TVET financial report:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getTvetFinancialReportData = async (req, res) => {
  try {
    const { academicYear, startDate, endDate, studentID, studentName } = req.query;

    // Build query object
    let query = {};

    // Add date range filter if provided
    if (startDate || endDate) {
      query.dateOfPayment = {};
      if (startDate) {
        query.dateOfPayment.$gte = new Date(startDate);
      }
      if (endDate) {
        query.dateOfPayment.$lte = new Date(endDate);
      }
    }

    // Add student filters if provided
    if (studentID) {
      query.studentID = { $regex: studentID, $options: 'i' };
    }

    if (studentName) {
      query.studentName = { $regex: studentName, $options: 'i' };
    }

    // Find TVET payments matching the criteria
    const tvetPayments = await Tvet.find(query)
      .sort({ dateOfPayment: -1 });

    // Calculate totals
    const totalAmount = tvetPayments.reduce((sum, payment) => sum + payment.totalPaid, 0);
    const totalFirstInstallment = tvetPayments.reduce((sum, payment) => sum + payment.firstInstallment, 0);
    const totalSecondInstallment = tvetPayments.reduce((sum, payment) => sum + payment.secondInstallment, 0);
    const totalThirdInstallment = tvetPayments.reduce((sum, payment) => sum + payment.thirdInstallment, 0);

    // Get unique students count
    const uniqueStudents = [...new Set(tvetPayments.map(payment => payment.studentID))].length;

    res.status(200).json({
      success: true,
      data: {
        payments: tvetPayments,
        summary: {
          totalAmount,
          totalFirstInstallment,
          totalSecondInstallment,
          totalThirdInstallment,
          totalPayments: tvetPayments.length,
          uniqueStudents
        },
        filters: {
          academicYear,
          startDate,
          endDate,
          studentID,
          studentName
        }
      }
    });

  } catch (err) {
    console.error('Error fetching TVET financial report data:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getTvetPaymentSummaryByStudent = async (req, res) => {
  try {
    const { academicYear, startDate, endDate } = req.query;

    // Build query object
    let query = {};

    // Add date range filter if provided
    if (startDate || endDate) {
      query.dateOfPayment = {};
      if (startDate) {
        query.dateOfPayment.$gte = new Date(startDate);
      }
      if (endDate) {
        query.dateOfPayment.$lte = new Date(endDate);
      }
    }

    // Aggregate payments by student
    const paymentSummary = await Tvet.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$studentID",
          studentName: { $first: "$studentName" },
          totalPaid: { $sum: "$totalPaid" },
          firstInstallmentTotal: { $sum: "$firstInstallment" },
          secondInstallmentTotal: { $sum: "$secondInstallment" },
          thirdInstallmentTotal: { $sum: "$thirdInstallment" },
          paymentCount: { $sum: 1 },
          latestPayment: { $max: "$dateOfPayment" },
          receipts: { $push: "$receiptNumber" }
        }
      },
      { $sort: { studentName: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: paymentSummary,
        totalStudents: paymentSummary.length,
        filters: {
          academicYear,
          startDate,
          endDate
        }
      }
    });

  } catch (err) {
    console.error('Error fetching TVET payment summary:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
// controllers/paymentController.js
const Payment = require('../models/Payment');
const Student = require('../models/Student'); 
const generateReceiptsPdf = require('../utils/receiptGenerator');

// Create payment and generate receipt
// Create a new payment without generating a PDF
exports.createPayment = async (req, res) => {
  try {
    const { studentId, amount, bankDepositNumber, academicYear, description, dateOfPayment } = req.body;

    // Validation
    if (!studentId || !amount || !academicYear) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required payment fields: studentId, amount, academicYear' 
      });
    }
    if (amount <= 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Amount must be greater than 0' 
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found.' 
      });
    }

    // Generate a unique receipt number
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const receiptNumber = `REC-${timestamp}-${randomNum}`;

    // Create payment
    const newPayment = new Payment({
      student: studentId,
      amount: parseFloat(amount),
      dateOfPayment: dateOfPayment || Date.now(),
      receiptNumber,
      bankDepositNumber: bankDepositNumber || '',
      moeRegistration: 'MOE Registration',
      description: description || 'Academic Payment',
      academicYear: academicYear.trim()
    });

    await newPayment.save();

    // Return success response without PDF
    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      payment: {
        _id: newPayment._id,
        student: {
          _id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          middleName: student.middleName || '',
          admissionNumber: student.admissionNumber
        },
        receiptNumber: newPayment.receiptNumber,
        amount: newPayment.amount,
        dateOfPayment: newPayment.dateOfPayment,
        academicYear: newPayment.academicYear,
        description: newPayment.description,
        bankDepositNumber: newPayment.bankDepositNumber
      }
    });

  } catch (error) {
    console.error('Error creating payment:', error);
    if (error.code === 11000 && error.keyPattern?.receiptNumber) {
      return res.status(400).json({ 
        success: false,
        message: 'Receipt number already exists. Please try again.' 
      });
    }
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Generate batch receipts for multiple payments
exports.generateBatchReceipts = async (req, res) => {
  try {
    const {
      academicYear,
      studentId,
      admissionNumber,
      startDate,
      endDate,
      minAmount,
      maxAmount
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (academicYear) filter.academicYear = academicYear;
    if (studentId) filter.student = studentId;
    
    // Date range filter
    if (startDate || endDate) {
      filter.dateOfPayment = {};
      if (startDate) filter.dateOfPayment.$gte = new Date(startDate);
      if (endDate) filter.dateOfPayment.$lte = new Date(endDate);
    }
    
    // Amount range filter
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = parseFloat(minAmount);
      if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
    }

    // If searching by admission number, find student first
    if (admissionNumber) {
      const student = await Student.findOne({ 
        admissionNumber: { $regex: admissionNumber, $options: 'i' } 
      });
      if (student) {
        filter.student = student._id;
      } else {
        return res.status(404).json({
          success: false,
          message: 'No students found with the specified admission number.'
        });
      }
    }

    // Fetch payments
    const payments = await Payment.find(filter)
      .populate('student', 'firstName lastName middleName admissionNumber gradeLevel department')
      .sort({ dateOfPayment: -1 });

    if (!payments || payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No payments found for the specified criteria.'
      });
    }

    // Prepare receipts data for PDF generation
    const receipts = payments.map(payment => ({
      student: {
        firstName: payment.student.firstName,
        lastName: payment.student.lastName,
        middleName: payment.student.middleName || '',
        admissionNumber: payment.student.admissionNumber,
        gradeLevel: payment.student.gradeLevel,
        department: payment.student.department
      },
      payment: {
        receiptNumber: payment.receiptNumber,
        bankDepositNumber: payment.bankDepositNumber,
        moeRegistration: payment.moeRegistration,
        amount: payment.amount,
        dateOfPayment: payment.dateOfPayment.toLocaleDateString(),
        description: payment.description,
        academicYear: payment.academicYear
      }
    }));

    // Generate the PDF
    const pdfBuffer = await generateReceiptsPdf({ receipts });

    // Set response headers
    const filename = `Batch_Receipts_${academicYear || 'All'}_${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating batch receipts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
// Get all payments with pagination and filtering
exports.getAllPayments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      academicYear,
      studentId,
      admissionNumber,
      startDate,
      endDate,
      minAmount,
      maxAmount
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    const filter = {};
    
    if (academicYear) filter.academicYear = academicYear;
    if (studentId) filter.student = studentId;
    
    // Date range filter
    if (startDate || endDate) {
      filter.dateOfPayment = {};
      if (startDate) filter.dateOfPayment.$gte = new Date(startDate);
      if (endDate) filter.dateOfPayment.$lte = new Date(endDate);
    }
    
    // Amount range filter
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = parseFloat(minAmount);
      if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
    }

    // If searching by admission number, find student first
    if (admissionNumber) {
      const student = await Student.findOne({ 
        admissionNumber: { $regex: admissionNumber, $options: 'i' } 
      });
      if (student) {
        filter.student = student._id;
      } else {
        // No student found with that admission number
        return res.json({
          success: true,
          payments: [],
          pagination: {
            current: pageNum,
            pages: 0,
            total: 0,
            hasNext: false,
            hasPrev: false
          }
        });
      }
    }

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('student', 'firstName lastName middleName classSection admissionNumber gradeLevel department')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Payment.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      payments,
      pagination: {
        current: pageNum,
        pages: totalPages,
        total,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });

  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get payment by ID
exports.getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await Payment.findById(id)
      .populate('student', 'firstName lastName middleName classSection admissionNumber gradeLevel department');
    
    if (!payment) {
      return res.status(404).json({ 
        success: false,
        message: 'Payment not found' 
      });
    }

    res.json({
      success: true,
      payment
    });

  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Update payment
exports.updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, bankDepositNumber, description, academicYear } = req.body;

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ 
        success: false,
        message: 'Payment not found' 
      });
    }

    // Update fields
    if (amount !== undefined) {
      if (amount <= 0) {
        return res.status(400).json({ 
          success: false,
          message: 'Amount must be greater than 0' 
        });
      }
      payment.amount = parseFloat(amount);
    }
    
    if (bankDepositNumber !== undefined) {
      payment.bankDepositNumber = bankDepositNumber.trim();
    }
    
    if (description !== undefined) {
      payment.description = description.trim();
    }
    
    if (academicYear !== undefined) {
      payment.academicYear = academicYear.trim();
    }

    await payment.save();

    const updatedPayment = await Payment.findById(id)
      .populate('student', 'firstName lastName middleName classSection admissionNumber gradeLevel department');

    res.json({
      success: true,
      message: 'Payment updated successfully',
      payment: updatedPayment
    });

  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Delete payment
exports.deletePayment = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ 
        success: false,
        message: 'Payment not found' 
      });
    }

    await Payment.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Payment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get payment statistics
exports.getPaymentStats = async (req, res) => {
  try {
    const { academicYear } = req.query;
    
    const filter = academicYear ? { academicYear } : {};
    
    const [
      totalPayments,
      totalAmount,
      avgAmount,
      recentPayments
    ] = await Promise.all([
      Payment.countDocuments(filter),
      Payment.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.aggregate([
        { $match: filter },
        { $group: { _id: null, avg: { $avg: '$amount' } } }
      ]),
      Payment.find(filter)
        .populate('student', 'firstName lastName middleName classSection admissionNumber')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    res.json({
      success: true,
      stats: {
        totalPayments,
        totalAmount: totalAmount[0]?.total || 0,
        averageAmount: avgAmount[0]?.avg || 0,
        recentPayments
      }
    });

  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};


const OtherPayment = require('../models/OtherPayment');
const Student = require('../models/Student'); 
const { generateReceiptPdf, generateBatchReceiptsPdf } = require('../utils/OtherPayment');

// Create payment (no PDF generation)
exports.createPayment = async (req, res) => {
  try {
    const { studentId, amount, bankDepositNumber, academicYear, description, paymentOf, dateOfPayment } = req.body;

    // Enhanced validation
    if (!studentId || !amount || !academicYear || !paymentOf) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required payment fields: studentId, amount, academicYear, paymentOf' 
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

    const newPayment = new OtherPayment({
      student: studentId,
      amount: parseFloat(amount),
      dateOfPayment: dateOfPayment ? new Date(dateOfPayment) : new Date(),
      receiptNumber,
      bankDepositNumber: bankDepositNumber || '',
      paymentOf: paymentOf.trim(),
      description: description || 'Other Payment',
      academicYear: academicYear.trim()
    });

    await newPayment.save();

    res.json({
      success: true,
      message: 'Payment created successfully',
      payment: newPayment
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

// Generate batch receipts (four per page)
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
    
    if (startDate || endDate) {
      filter.dateOfPayment = {};
      if (startDate) filter.dateOfPayment.$gte = new Date(startDate);
      if (endDate) filter.dateOfPayment.$lte = new Date(endDate);
    }
    
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = parseFloat(minAmount);
      if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
    }

    if (admissionNumber) {
      const student = await Student.findOne({ 
        admissionNumber: { $regex: admissionNumber, $options: 'i' } 
      });
      if (student) {
        filter.student = student._id;
      } else {
        return res.status(404).json({
          success: false,
          message: 'No student found with the provided admission number'
        });
      }
    }

    const payments = await OtherPayment.find(filter)
      .populate('student', 'firstName lastName middleName admissionNumber gradeLevel classSection department')
      .sort({ createdAt: -1 });

    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No payments found for the specified filters'
      });
    }

    const pdfBuffer = await generateBatchReceiptsPdf(payments);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=batch-receipts-${new Date().getTime()}.pdf`);
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
    
    if (startDate || endDate) {
      filter.dateOfPayment = {};
      if (startDate) filter.dateOfPayment.$gte = new Date(startDate);
      if (endDate) filter.dateOfPayment.$lte = new Date(endDate);
    }
    
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = parseFloat(minAmount);
      if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
    }

    if (admissionNumber) {
      const student = await Student.findOne({ 
        admissionNumber: { $regex: admissionNumber, $options: 'i' } 
      });
      if (student) {
        filter.student = student._id;
      } else {
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
      OtherPayment.find(filter)
        .populate('student', 'firstName lastName middleName admissionNumber gradeLevel classSection department')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      OtherPayment.countDocuments(filter)
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
    
    const payment = await OtherPayment.findById(id)
      .populate('student', 'firstName lastName middleName admissionNumber gradeLevel classSection department');
    
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
    const { amount, bankDepositNumber, description, academicYear, paymentOf } = req.body;

    const payment = await OtherPayment.findById(id);
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
    
    if (paymentOf !== undefined) {
      payment.paymentOf = paymentOf.trim();
    }

    await payment.save();

    const updatedPayment = await OtherPayment.findById(id)
      .populate('student', 'firstName lastName middleName admissionNumber gradeLevel classSection department');

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

    const payment = await OtherPayment.findById(id);
    if (!payment) {
      return res.status(404).json({ 
        success: false,
        message: 'Payment not found' 
      });
    }

    await OtherPayment.findByIdAndDelete(id);

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
      OtherPayment.countDocuments(filter),
      OtherPayment.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      OtherPayment.aggregate([
        { $match: filter },
        { $group: { _id: null, avg: { $avg: '$amount' } } }
      ]),
      OtherPayment.find(filter)
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
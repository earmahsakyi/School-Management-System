const Tvet = require('../models/Tvet');
const generateTvetReceiptsPdf = require('../utils/tvetReceipt'); // Renamed for clarity

// Create TVET payment 
exports.createTvetPayment = async (req, res) => {
  try {
    const {
      depositNumber,
      dateOfPayment,
      studentID,
      studentName,
      breakdown,
      firstInstallment,
      secondInstallment,
      thirdInstallment
    } = req.body;

    // Enhanced validation
    if (!depositNumber || !studentID || !studentName || !breakdown || !Array.isArray(breakdown)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: depositNumber, studentID, studentName, breakdown'
      });
    }

    // Validate breakdown array
    if (breakdown.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Breakdown array cannot be empty'
      });
    }

    // Validate each breakdown item
    for (const item of breakdown) {
      if (!item.description || typeof item.amount !== 'number' || item.amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Each breakdown item must have a description and a positive amount'
        });
      }
    }

    // Calculate total from breakdown (though not strictly used for totalPaid here, good for validation/info)
    const breakdownTotal = breakdown.reduce((sum, item) => sum + item.amount, 0);

    // Calculate total paid from installments
    const installments = [
      parseFloat(firstInstallment) || 0,
      parseFloat(secondInstallment) || 0,
      parseFloat(thirdInstallment) || 0
    ];
    const totalPaid = installments.reduce((sum, amount) => sum + amount, 0);

    // Generate a unique receipt number
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const receiptNumber = `TVET-${timestamp}-${randomNum}`;

    const newTvetPayment = new Tvet({
      receiptNumber,
      depositNumber: depositNumber.trim(),
      dateOfPayment: dateOfPayment || new Date(),
      studentID: studentID.trim(),
      studentName: studentName.trim(),
      breakdown,
      firstInstallment: installments[0],
      secondInstallment: installments[1],
      thirdInstallment: installments[2],
      totalPaid
    });

    await newTvetPayment.save();

    // Return success response without PDF
    res.status(201).json({
      success: true,
      message: 'TVET payment recorded successfully',
      payment: newTvetPayment
    });

  } catch (error) {
    console.error('Error creating TVET payment:', error);

    // Handle duplicate receipt number error
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

// Generate batch receipts for multiple TVET payments
exports.generateBatchTvetReceipts = async (req, res) => {
  try {
    const {
      studentID,
      studentName,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      depositNumber
    } = req.query;

    // Build filter object
    const filter = {};

    if (studentID) {
      filter.studentID = { $regex: studentID, $options: 'i' };
    }

    if (studentName) {
      filter.studentName = { $regex: studentName, $options: 'i' };
    }

    if (depositNumber) {
      filter.depositNumber = { $regex: depositNumber, $options: 'i' };
    }

    // Date range filter
    if (startDate || endDate) {
      filter.dateOfPayment = {};
      if (startDate) filter.dateOfPayment.$gte = new Date(startDate);
      if (endDate) filter.dateOfPayment.$lte = new Date(endDate);
    }

    // Total paid amount range filter
    if (minAmount || maxAmount) {
      filter.totalPaid = {};
      if (minAmount) filter.totalPaid.$gte = parseFloat(minAmount);
      if (maxAmount) filter.totalPaid.$lte = parseFloat(maxAmount);
    }

    // Fetch payments
    const tvetPayments = await Tvet.find(filter).sort({ dateOfPayment: -1 });

    if (!tvetPayments || tvetPayments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No TVET payments found for the specified criteria.'
      });
    }

    // Generate the PDF
    const pdfBuffer = await generateTvetReceiptsPdf({ receipts: tvetPayments }); // Pass an object with 'receipts' key

    // Set response headers
    const filename = `TVET_Batch_Receipts_${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating batch TVET receipts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};


// Get all TVET payments with pagination and filtering
exports.getAllTvetPayments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      studentID,
      studentName,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      depositNumber
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    const filter = {};

    if (studentID) {
      filter.studentID = { $regex: studentID, $options: 'i' };
    }

    if (studentName) {
      filter.studentName = { $regex: studentName, $options: 'i' };
    }

    if (depositNumber) {
      filter.depositNumber = { $regex: depositNumber, $options: 'i' };
    }

    // Date range filter
    if (startDate || endDate) {
      filter.dateOfPayment = {};
      if (startDate) filter.dateOfPayment.$gte = new Date(startDate);
      if (endDate) filter.dateOfPayment.$lte = new Date(endDate);
    }

    // Total paid amount range filter
    if (minAmount || maxAmount) {
      filter.totalPaid = {};
      if (minAmount) filter.totalPaid.$gte = parseFloat(minAmount);
      if (maxAmount) filter.totalPaid.$lte = parseFloat(maxAmount);
    }

    const [tvetPayments, total] = await Promise.all([
      Tvet.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Tvet.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      tvetPayments,
      pagination: {
        current: pageNum,
        pages: totalPages,
        total,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });

  } catch (error) {
    console.error('Error fetching TVET payments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get TVET payment by ID
exports.getTvetPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const tvetPayment = await Tvet.findById(id);

    if (!tvetPayment) {
      return res.status(404).json({
        success: false,
        message: 'TVET payment not found'
      });
    }

    res.json({
      success: true,
      tvetPayment
    });

  } catch (error) {
    console.error('Error fetching TVET payment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update TVET payment
exports.updateTvetPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      depositNumber,
      studentName,
      breakdown,
      firstInstallment,
      secondInstallment,
      thirdInstallment
    } = req.body;

    const tvetPayment = await Tvet.findById(id);
    if (!tvetPayment) {
      return res.status(404).json({
        success: false,
        message: 'TVET payment not found'
      });
    }

    // Update fields
    if (depositNumber !== undefined) {
      tvetPayment.depositNumber = depositNumber.trim();
    }

    if (studentName !== undefined) {
      tvetPayment.studentName = studentName.trim();
    }

    if (breakdown !== undefined) {
      if (!Array.isArray(breakdown) || breakdown.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Breakdown must be a non-empty array'
        });
      }

      // Validate breakdown items
      for (const item of breakdown) {
        if (!item.description || typeof item.amount !== 'number' || item.amount <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Each breakdown item must have a description and a positive amount'
          });
        }
      }

      tvetPayment.breakdown = breakdown;
    }

    // Update installments and recalculate total
    if (firstInstallment !== undefined) {
      tvetPayment.firstInstallment = parseFloat(firstInstallment) || 0;
    }

    if (secondInstallment !== undefined) {
      tvetPayment.secondInstallment = parseFloat(secondInstallment) || 0;
    }

    if (thirdInstallment !== undefined) {
      tvetPayment.thirdInstallment = parseFloat(thirdInstallment) || 0;
    }

    // Recalculate total paid
    tvetPayment.totalPaid = tvetPayment.firstInstallment +
                            tvetPayment.secondInstallment +
                            tvetPayment.thirdInstallment;

    await tvetPayment.save();

    res.json({
      success: true,
      message: 'TVET payment updated successfully',
      tvetPayment
    });

  } catch (error) {
    console.error('Error updating TVET payment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete TVET payment
exports.deleteTvetPayment = async (req, res) => {
  try {
    const { id } = req.params;

    const tvetPayment = await Tvet.findById(id);
    if (!tvetPayment) {
      return res.status(404).json({
        success: false,
        message: 'TVET payment not found'
      });
    }

    await Tvet.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'TVET payment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting TVET payment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get TVET payment statistics
exports.getTvetPaymentStats = async (req, res) => {
  try {
    const { studentID } = req.query;

    const filter = studentID ? { studentID: { $regex: studentID, $options: 'i' } } : {};

    const [
      totalPayments,
      totalAmount,
      avgAmount,
      totalFirstInstallments,
      totalSecondInstallments,
      totalThirdInstallments,
      recentPayments
    ] = await Promise.all([
      Tvet.countDocuments(filter),
      Tvet.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$totalPaid' } } }
      ]),
      Tvet.aggregate([
        { $match: filter },
        { $group: { _id: null, avg: { $avg: '$totalPaid' } } }
      ]),
      Tvet.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$firstInstallment' } } }
      ]),
      Tvet.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$secondInstallment' } } }
      ]),
      Tvet.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$thirdInstallment' } } }
      ]),
      Tvet.find(filter)
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    res.json({
      success: true,
      stats: {
        totalPayments,
        totalAmount: totalAmount[0]?.total || 0,
        averageAmount: avgAmount[0]?.avg || 0,
        installmentBreakdown: {
          firstInstallment: totalFirstInstallments[0]?.total || 0,
          secondInstallment: totalSecondInstallments[0]?.total || 0,
          thirdInstallment: totalThirdInstallments[0]?.total || 0
        },
        recentPayments
      }
    });

  } catch (error) {
    console.error('Error fetching TVET payment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Regenerate receipt for existing TVET payment (now uses batch function internally for single item)
exports.regenerateTvetReceipt = async (req, res) => {
  try {
    const { id } = req.params;

    const tvetPayment = await Tvet.findById(id);

    if (!tvetPayment) {
      return res.status(404).json({
        success: false,
        message: 'TVET payment not found'
      });
    }

    // Generate the PDF receipt by passing a single-item array
    const pdfBuffer = await generateTvetReceiptsPdf({ receipts: [tvetPayment] });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=tvet-receipt-${tvetPayment.receiptNumber}.pdf`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error regenerating TVET receipt:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
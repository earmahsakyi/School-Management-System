const OtherPayment = require('../models/OtherPayment');
const generateOtherPaymentReportPdf = require('../utils/otherPaymentPdfGenerator.js');

exports.generateOtherPaymentReport = async (req, res) => {
  try {
    const { academicYear, startDate, endDate, department, gradeLevel, classSection, studentType } = req.query;

    if (!academicYear) {
      return res.status(400).json({
        error: 'Missing required query parameter: academicYear'
      });
    }

    // Build the base query
    let paymentQuery = { academicYear };

    // Apply student type filter
    if (studentType === 'manual') {
      paymentQuery['manualStudentDetails.firstName'] = { $ne: null };
      paymentQuery.student = { $eq: null };
    } else if (studentType === 'referenced') {
      paymentQuery.student = { $ne: null };
    }

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


    // Find payments first, then populate and filter
    let payments = await OtherPayment.find(paymentQuery)
      .populate('student', 'firstName lastName middleName admissionNumber gradeLevel classSection department')
      .sort({ dateOfPayment: -1 });



    // Apply filters after population
    if (department || gradeLevel || classSection) {
      payments = payments.filter(payment => {
        const student = payment.student || payment.manualStudentDetails;
        
        // Check department filter
        if (department) {
          const studentDept = student?.department?.toString().trim().toLowerCase();
          const filterDept = department.toString().trim().toLowerCase();
          if (studentDept !== filterDept) {
            return false;
          }
        }

        // Check grade level filter
        if (gradeLevel) {
          const studentGrade = student?.gradeLevel?.toString().trim().toLowerCase();
          const filterGrade = gradeLevel.toString().trim().toLowerCase();
          if (studentGrade !== filterGrade) {
            return false;
          }
        }

        // Check class section filter
        if (classSection) {
          const studentSection = student?.classSection?.toString().trim().toLowerCase();
          const filterSection = classSection.toString().trim().toLowerCase();
          if (studentSection !== filterSection) {
            return false;
          }
        }

        return true;
      });
    }



    if (!payments || payments.length === 0) {

      
      // Fetch unique filter values for feedback
      const allPayments = await OtherPayment.find({ academicYear })
        .populate('student', 'firstName lastName middleName admissionNumber gradeLevel classSection department');
      
      const departments = new Set();
      const gradeLevels = new Set();
      const classSections = new Set();

      allPayments.forEach(payment => {
        const student = payment.student || payment.manualStudentDetails;
        if (student?.department) departments.add(student.department);
        if (student?.gradeLevel) gradeLevels.add(student.gradeLevel);
        if (student?.classSection) classSections.add(student.classSection);
      });

      return res.status(404).json({
        error: 'No other payments found for the specified criteria.',
        suggestions: {
          departments: Array.from(departments).filter(Boolean),
          gradeLevels: Array.from(gradeLevels).filter(Boolean),
          classSections: Array.from(classSections).filter(Boolean)
        }
      });
    }

    // Transform payments data to use consistent student structure
    const paymentsWithStudentInfo = payments.map(payment => ({
      ...payment.toObject(),
      student: payment.student || payment.manualStudentDetails
    }));

    const pdfBuffer = await generateOtherPaymentReportPdf({
      payments: paymentsWithStudentInfo,
      academicYear,
      filters: {
        academicYear,
        startDate,
        endDate,
        department,
        gradeLevel,
        classSection,
        studentType
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="other_payments_report_${academicYear}_${studentType || 'all'}.pdf"`);
    res.send(pdfBuffer);

  } catch (err) {
    console.error('Error generating other payments report:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getOtherPaymentsReportData = async (req, res) => {
  try {
    const { academicYear, startDate, endDate, department, gradeLevel, classSection, studentType } = req.query;

    if (!academicYear) {
      return res.status(400).json({
        error: 'Missing required query parameter: academicYear'
      });
    }

    // Build the base query
    let paymentQuery = { academicYear };

    // Apply student type filter
    if (studentType === 'manual') {
      paymentQuery['manualStudentDetails.firstName'] = { $ne: null };
      paymentQuery.student = { $eq: null };
    } else if (studentType === 'referenced') {
      paymentQuery.student = { $ne: null };
    }

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

    

    // Find payments first, then populate and filter
    let payments = await OtherPayment.find(paymentQuery)
      .populate('student', 'firstName lastName middleName admissionNumber gradeLevel classSection department')
      .sort({ dateOfPayment: -1 });

   
   

    // Apply filters after population
    if (department || gradeLevel || classSection) {
      payments = payments.filter(payment => {
        const student = payment.student || payment.manualStudentDetails;
        
        // Debug current payment being filtered
        const debugInfo = {
          receiptNumber: payment.receiptNumber,
          studentDept: student?.department,
          studentGrade: student?.gradeLevel,
          studentSection: student?.classSection,
          filterDept: department,
          filterGrade: gradeLevel,
          filterSection: classSection
        };
        
        // Check department filter
        if (department) {
          const studentDept = student?.department?.toString().trim().toLowerCase();
          const filterDept = department.toString().trim().toLowerCase();
          if (studentDept !== filterDept) {
           
            return false;
          }
        }

        // Check grade level filter
        if (gradeLevel) {
          const studentGrade = student?.gradeLevel?.toString().trim().toLowerCase();
          const filterGrade = gradeLevel.toString().trim().toLowerCase();
          if (studentGrade !== filterGrade) {
            console.log('Grade level filter failed:', debugInfo);
            return false;
          }
        }

        // Check class section filter
        if (classSection) {
          const studentSection = student?.classSection?.toString().trim().toLowerCase();
          const filterSection = classSection.toString().trim().toLowerCase();
          if (studentSection !== filterSection) {
            console.log('Class section filter failed:', debugInfo);
            return false;
          }
        }

     
        return true;
      });
    }

   

    // Get all payments for suggestions
    const allPayments = await OtherPayment.find({ academicYear })
      .populate('student', 'firstName lastName middleName admissionNumber gradeLevel classSection department');
    
    const departments = new Set();
    const gradeLevels = new Set();
    const classSections = new Set();

    allPayments.forEach(payment => {
      const student = payment.student || payment.manualStudentDetails;
      if (student?.department) departments.add(student.department);
      if (student?.gradeLevel) gradeLevels.add(student.gradeLevel);
      if (student?.classSection) classSections.add(student.classSection);
    });

    if (!payments || payments.length === 0) {
      
      return res.status(404).json({
        error: 'No other payments found for the specified criteria.',
        suggestions: {
          departments: Array.from(departments).filter(Boolean),
          gradeLevels: Array.from(gradeLevels).filter(Boolean),
          classSections: Array.from(classSections).filter(Boolean)
        }
      });
    }

    // Calculate total amount
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);

    // Transform payments data
    const paymentsWithStudentInfo = payments.map(payment => ({
      ...payment.toObject(),
      student: payment.student || payment.manualStudentDetails
    }));

    res.status(200).json({
      success: true,
      data: {
        payments: paymentsWithStudentInfo,
        totalAmount,
        totalCount: payments.length,
        filters: {
          academicYear,
          startDate,
          endDate,
          department,
          gradeLevel,
          classSection,
          studentType
        }
      },
      suggestions: {
        departments: Array.from(departments).filter(Boolean),
        gradeLevels: Array.from(gradeLevels).filter(Boolean),
        classSections: Array.from(classSections).filter(Boolean)
      }
    });

  } catch (err) {
    console.error('Error fetching other payments report data:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const Student = require('../models/Student');
const { getStudentYearlyAverages,
  determinePromotionStatus,
  processAutomaticPromotion,
  processBatchPromotions,
  getPromotionPreview,
  calculateYearlySubjectAverage} =require('../utils/promotionService')
/**
 * @desc    Get promotion preview for a student
 * @route   GET /api/students/:id/promotion/preview
 * @access  Private
 */
const getStudentPromotionPreview = async (req, res) => {
  try {
    const { academicYear } = req.query;
    
    if (!academicYear) {
      return res.status(400).json({
        success: false,
        message: 'Academic year is required'
      });
    }

    const result = await getPromotionPreview(req.params.id, academicYear);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json({
      success: true,
      message: 'Promotion preview generated successfully',
      data: result.data
    });

  } catch (error) {
    console.error('Error in getStudentPromotionPreview:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/**
 * @desc    Process automatic promotion for a student
 * @route   POST /api/students/:id/promotion/process
 * @access  Private
 */
const processStudentPromotion = async (req, res) => {
  try {
    const { academicYear } = req.body;
    
    if (!academicYear) {
      return res.status(400).json({
        success: false,
        message: 'Academic year is required'
      });
    }

    const result = await processAutomaticPromotion(
      req.params.id, 
      academicYear, 
      req.user.id // Assuming user ID is available from auth middleware
    );
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data
    });

  } catch (error) {
    console.error('Error in processStudentPromotion:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/**
 * @desc    Process promotions for multiple students
 * @route   POST /api/students/promotion/batch
 * @access  Private
 */
const processBatchStudentPromotions = async (req, res) => {
  try {
    const { studentIds, academicYear } = req.body;
    
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Student IDs array is required'
      });
    }

    if (!academicYear) {
      return res.status(400).json({
        success: false,
        message: 'Academic year is required'
      });
    }

    const result = await processBatchPromotions(
      studentIds, 
      academicYear, 
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data
    });

  } catch (error) {
    console.error('Error in processBatchStudentPromotions:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/**
 * @desc    Get yearly averages for a student
 * @route   GET /api/students/:id/yearly-averages
 * @access  Private
 */
const getStudentYearlyAveragesController = async (req, res) => {
  try {
    const { academicYear } = req.query;
    
    if (!academicYear) {
      return res.status(400).json({
        success: false,
        message: 'Academic year is required'
      });
    }

    const result = await getStudentYearlyAverages(req.params.id, academicYear);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json({
      success: true,
      message: 'Yearly averages retrieved successfully',
      data: result.data
    });

  } catch (error) {
    console.error('Error in getStudentYearlyAverages:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/**
 * @desc    Get all students eligible for promotion in a specific grade and academic year
 * @route   GET /api/students/promotion/eligible
 * @access  Private
 */
const getEligibleStudentsForPromotion = async (req, res) => {
  try {
    const { gradeLevel, academicYear, department } = req.query;
    
    if (!gradeLevel || !academicYear) {
      return res.status(400).json({
        success: false,
        message: 'Grade level and academic year are required'
      });
    }

    // Build filter for students
    const studentFilter = { gradeLevel };
    if (department && department !== 'all') {
      studentFilter.department = department;
    }

    // Get all students in the specified grade
    const students = await Student.find(studentFilter)
      .select('firstName lastName admissionNumber gradeLevel department classSection promotionStatus promotedToGrade')
      .sort({ lastName: 1, firstName: 1 });

    // Get promotion previews for all students
    const eligibilityResults = await Promise.all(
      students.map(async (student) => {
        const preview = await getPromotionPreview(student._id, academicYear);
        return {
          student: {
            id: student._id,
            name: `${student.firstName} ${student.lastName}`,
            admissionNumber: student.admissionNumber,
            gradeLevel: student.gradeLevel,
            department: student.department,
            classSection: student.classSection,
            currentPromotionStatus: student.promotionStatus,
            currentPromotedToGrade: student.promotedToGrade
          },
          eligibility: preview.success ? preview.data : { error: preview.message }
        };
      })
    );

    // Categorize results
    const summary = {
      total: students.length,
      readyForPromotion: 0,
      conditionalPromotion: 0,
      notEligible: 0,
      incomplete: 0
    };

    const categorized = {
      promoted: [],
      conditional: [],
      notPromoted: [],
      incomplete: []
    };

    eligibilityResults.forEach(result => {
      if (result.eligibility.error) {
        summary.incomplete++;
        categorized.incomplete.push(result);
      } else if (!result.eligibility.hasBothSemesters) {
        summary.incomplete++;
        categorized.incomplete.push(result);
      } else {
        switch (result.eligibility.promotionDecision.promotionStatus) {
          case 'Promoted':
            summary.readyForPromotion++;
            categorized.promoted.push(result);
            break;
          case 'Conditional Promotion':
            summary.conditionalPromotion++;
            categorized.conditional.push(result);
            break;
          case 'Not Promoted':
            summary.notEligible++;
            categorized.notPromoted.push(result);
            break;
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Promotion eligibility data retrieved successfully',
      data: {
        summary,
        students: categorized,
        filter: {
          gradeLevel,
          academicYear,
          department: department || 'all'
        }
      }
    });

  } catch (error) {
    console.error('Error in getEligibleStudentsForPromotion:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Export all controller methods
module.exports = {
  getStudentPromotionPreview,
  processStudentPromotion,
  processBatchStudentPromotions,
  getStudentYearlyAveragesController,
  getEligibleStudentsForPromotion
}
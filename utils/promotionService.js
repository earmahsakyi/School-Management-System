// promotionService.js - Service for handling automatic promotions

const Grade = require('../models/Grade');
const Student = require('../models/Student');
const PromotionRecord = require('../models/PromotionRecord');

/**
 * Define core subjects for each department
 */
const CORE_SUBJECTS = {
  JHS: [
    "General Science",
    "Mathematics", 
    "English",
    "Social Studies"
  ],
  Science: [
    "Mathematics",
    "English",
    "Chemistry",
    "Biology", 
    "Geography",
    "Physics",
    "Economics"
  ],
  Arts: [
    "Mathematics",
    "English", 
    "Literature",
    "Biology",
    "Economics",
    "Geography",
    "History"
  ]
};

/**
 * Calculate yearly average for a subject across both semesters
 * @param {Object} semester1Subject - Subject data from semester 1
 * @param {Object} semester2Subject - Subject data from semester 2
 * @returns {number} - Yearly average for the subject
 */
const calculateYearlySubjectAverage = (semester1Subject, semester2Subject) => {
  const sem1Average = semester1Subject?.semesterAverage || 0;
  const sem2Average = semester2Subject?.semesterAverage || 0;
  
  // If only one semester has data, use that semester's average
  if (sem1Average === 0 && sem2Average > 0) return sem2Average;
  if (sem2Average === 0 && sem1Average > 0) return sem1Average;
  if (sem1Average === 0 && sem2Average === 0) return 0;
  
  return (sem1Average + sem2Average) / 2;
};

/**
 * Get student's yearly subject averages
 * @param {string} studentId - Student ID
 * @param {string} academicYear - Academic year (e.g., "2024/2025")
 * @returns {Object} - Subject averages and metadata
 */
const getStudentYearlyAverages = async (studentId, academicYear) => {
  try {
    // Get both semester grades for the student
    const grades = await Grade.find({
      student: studentId,
      academicYear: academicYear
    }).sort({ term: 1 });

    if (grades.length === 0) {
      return {
        success: false,
        message: 'No grade records found for this student in the specified academic year'
      };
    }

    const semester1 = grades.find(g => g.term === '1');
    const semester2 = grades.find(g => g.term === '2');

    // Get all unique subjects from both semesters
    const allSubjects = new Set();
    if (semester1) semester1.subjects.forEach(s => allSubjects.add(s.subject));
    if (semester2) semester2.subjects.forEach(s => allSubjects.add(s.subject));

    const subjectAverages = [];
    let totalYearlyAverage = 0;
    let validSubjects = 0;

    // Calculate yearly average for each subject
    allSubjects.forEach(subjectName => {
      const sem1Subject = semester1?.subjects.find(s => s.subject === subjectName);
      const sem2Subject = semester2?.subjects.find(s => s.subject === subjectName);
      
      const yearlyAverage = calculateYearlySubjectAverage(sem1Subject, sem2Subject);
      
      if (yearlyAverage > 0) {
        subjectAverages.push({
          subject: subjectName,
          semester1Average: sem1Subject?.semesterAverage || 0,
          semester2Average: sem2Subject?.semesterAverage || 0,
          yearlyAverage: Math.round(yearlyAverage * 10) / 10, // Round to 1 decimal
          status: yearlyAverage >= 70 ? 'Pass' : 'Fail'
        });
        
        totalYearlyAverage += yearlyAverage;
        validSubjects++;
      }
    });

    const overallYearlyAverage = validSubjects > 0 
      ? Math.round((totalYearlyAverage / validSubjects) * 10) / 10 
      : 0;
    
    return {
      success: true,
      data: {
        studentId,
        academicYear,
        totalSubjects: subjectAverages.length,
        validSubjects,
        subjectAverages,
        overallYearlyAverage,
        hasBothSemesters: semester1 && semester2,
        semester1Exists: !!semester1,
        semester2Exists: !!semester2
      }
    };

  } catch (error) {
    console.error('Error calculating yearly averages:', error);
    return {
      success: false,
      message: `Error calculating yearly averages: ${error.message}`
    };
  }
};

/**
 * Determine promotion status based on yearly averages and core subject requirements
 * @param {Array} subjectAverages - Array of subject yearly averages
 * @param {string} department - Student's department (JHS, Science, Arts)
 * @returns {Object} - Promotion decision and details
 */
const determinePromotionStatus = (subjectAverages, department) => {
  const totalSubjects = subjectAverages.length;
  const failingSubjects = subjectAverages.filter(subject => subject.yearlyAverage < 70);
  const failingCount = failingSubjects.length;

  // Check if student has the minimum required subjects
  const minimumSubjects = department === 'JHS' ? 8 : 8; // Keeping the original requirement
  if (totalSubjects < minimumSubjects) {
    return {
      promotionStatus: 'Not Promoted',
      reason: `Student must offer at least ${minimumSubjects} subjects. Currently has ${totalSubjects} subjects.`,
      failingSubjects: failingSubjects.map(s => s.subject),
      failingCount,
      canPromote: false,
      recommendations: [`Ensure student is enrolled in at least ${minimumSubjects} subjects`]
    };
  }

  // Get core subjects for the department
  const coreSubjects = CORE_SUBJECTS[department] || [];
  
  // Identify core subjects that the student is taking
  const studentCoreSubjects = subjectAverages.filter(subject => 
    coreSubjects.some(coreSubject => 
      // Handle variations in subject names (e.g., "General Science" vs "Science")
      subject.subject === coreSubject || 
      (coreSubject === "General Science" && subject.subject === "Science") ||
      (coreSubject === "Science" && subject.subject === "General Science")
    )
  );

  // Find failing core subjects
  const failingCoreSubjects = studentCoreSubjects.filter(subject => subject.yearlyAverage < 70);
  const failingCoreCount = failingCoreSubjects.length;

  // Find failing non-core subjects
  const nonCoreSubjects = subjectAverages.filter(subject => 
    !coreSubjects.some(coreSubject => 
      subject.subject === coreSubject || 
      (coreSubject === "General Science" && subject.subject === "Science") ||
      (coreSubject === "Science" && subject.subject === "General Science")
    )
  );
  const failingNonCoreSubjects = nonCoreSubjects.filter(subject => subject.yearlyAverage < 70);
  const failingNonCoreCount = failingNonCoreSubjects.length;

  let promotionStatus;
  let reason;
  let canPromote = false;
  let recommendations = [];

  // Core subject promotion logic
  if (failingCoreCount >= 2) {
    // Two or more core subjects failing - NOT PROMOTED
    promotionStatus = 'Not Promoted';
    reason = `${failingCoreCount} core subjects have yearly average < 70: ${failingCoreSubjects.map(s => s.subject).join(', ')}`;
    canPromote = false;
    recommendations.push(
      'Student failed 2 or more core subjects and must repeat the grade',
      'Focus on intensive remediation in core subjects',
      `Core subjects requiring improvement: ${failingCoreSubjects.map(s => `${s.subject} (${s.yearlyAverage}%)`).join(', ')}`
    );
    
    if (failingNonCoreCount > 0) {
      recommendations.push(`Additional non-core subjects also need improvement: ${failingNonCoreSubjects.map(s => `${s.subject} (${s.yearlyAverage}%)`).join(', ')}`);
    }
  } else if (failingCoreCount === 1) {
    // One core subject failing
    if (failingNonCoreCount === 0) {
      // Only one core subject failing, all non-core subjects passing
      promotionStatus = 'Conditional Promotion';
      reason = `Only 1 core subject (${failingCoreSubjects[0].subject}) has yearly average < 70, all non-core subjects passing`;
      canPromote = true;
      recommendations.push(
        `Student needs improvement in core subject: ${failingCoreSubjects[0].subject} (${failingCoreSubjects[0].yearlyAverage}%)`,
        'Provide intensive support and monitoring for the failing core subject',
        'Consider remedial classes or tutoring for the core subject',
        'Student may be promoted with conditions'
      );
    } else {
      // One core subject failing AND some non-core subjects failing
      promotionStatus = 'Conditional Promotion';
      reason = `1 core subject (${failingCoreSubjects[0].subject}) and ${failingNonCoreCount} non-core subjects have yearly average < 70`;
      canPromote = true;
      recommendations.push(
        `Core subject requiring improvement: ${failingCoreSubjects[0].subject} (${failingCoreSubjects[0].yearlyAverage}%)`,
        `Non-core subjects requiring improvement: ${failingNonCoreSubjects.map(s => `${s.subject} (${s.yearlyAverage}%)`).join(', ')}`,
        'Provide comprehensive academic support plan',
        'Priority focus on the failing core subject',
        'Student may be promoted with conditions'
      );
    }
  } else {
    // No core subjects failing
    if (failingNonCoreCount === 0) {
      // All subjects passing
      promotionStatus = 'Promoted';
      reason = 'All subjects have yearly average >= 70';
      canPromote = true;
      recommendations.push('Student meets all promotion requirements');
    } else {
      // Only non-core subjects failing
      promotionStatus = 'Promoted';
      reason = `All core subjects passing. ${failingNonCoreCount} non-core subjects have yearly average < 70`;
      canPromote = true;
      recommendations.push(
        'Student promoted as all core subjects are passing',
        `Non-core subjects needing improvement: ${failingNonCoreSubjects.map(s => `${s.subject} (${s.yearlyAverage}%)`).join(', ')}`,
        'Consider additional support for non-core subjects'
      );
    }
  }

  return {
    promotionStatus,
    reason,
    failingSubjects: failingSubjects.map(s => s.subject),
    failingCoreSubjects: failingCoreSubjects.map(s => s.subject),
    failingNonCoreSubjects: failingNonCoreSubjects.map(s => s.subject),
    failingCount,
    failingCoreCount,
    failingNonCoreCount,
    canPromote,
    recommendations,
    promotionDetails: {
      totalSubjects,
      totalCoreSubjects: studentCoreSubjects.length,
      totalNonCoreSubjects: nonCoreSubjects.length,
      passingSubjects: totalSubjects - failingCount,
      passingCoreSubjects: studentCoreSubjects.length - failingCoreCount,
      passingNonCoreSubjects: nonCoreSubjects.length - failingNonCoreCount,
      failingSubjects: failingCount,
      failingCoreSubjects: failingCoreCount,
      failingNonCoreSubjects: failingNonCoreCount,
      averageThreshold: 70,
      coreSubjectsRequired: coreSubjects,
      department
    }
  };
};

/**
 * Process automatic promotion for a student
 * @param {string} studentId - Student ID
 * @param {string} academicYear - Academic year
 * @param {string} promotedById - ID of the user processing the promotion
 * @returns {Object} - Promotion result
 */
const processAutomaticPromotion = async (studentId, academicYear, promotedById) => {
  try {
    // Get student details
    const student = await Student.findById(studentId);
    if (!student) {
      return {
        success: false,
        message: 'Student not found'
      };
    }

    // Calculate yearly averages
    const yearlyData = await getStudentYearlyAverages(studentId, academicYear);
    if (!yearlyData.success) {
      return yearlyData;
    }

    const { subjectAverages, overallYearlyAverage, hasBothSemesters } = yearlyData.data;

    // Check if both semesters are complete
    if (!hasBothSemesters) {
      return {
        success: false,
        message: 'Both semesters must be completed before processing promotion',
        data: yearlyData.data
      };
    }

    // Determine student's department
    let department = student.department || 'JHS';
    const gradeLevel = parseInt(student.gradeLevel);
    
    // Auto-determine department based on grade level if not set
    if (gradeLevel >= 7 && gradeLevel <= 9) {
      department = 'JHS';
    } else if (gradeLevel >= 10 && gradeLevel <= 12) {
      // Keep existing department for SHS students, default to Arts if not specified
      department = student.department || 'Arts';
    }

    // Determine promotion status using new core subject logic
    const promotionDecision = determinePromotionStatus(subjectAverages, department);

    // Calculate next grade level
    const currentGrade = parseInt(student.gradeLevel);
    let promotedToGrade = null;
    let graduated = false;

    if (currentGrade === 12 && promotionDecision.canPromote) {
      // Graduation logic
      student.graduated = true;
      student.graduationDate = new Date();
      student.promotedToGrade = null;
      student.promotionStatus = 'Graduated';
      graduated = true;
    } else {
      promotedToGrade = promotionDecision.canPromote ? (currentGrade + 1).toString() : null;
      student.promotedToGrade = promotedToGrade;
      student.promotionStatus = promotionDecision.promotionStatus;

      if (promotionDecision.canPromote && promotedToGrade) {
        student.gradeLevel = promotedToGrade;
      }
    }

    // Prepare promotion data
    const promotionData = {
      studentId,
      academicYear,
      currentGrade: student.gradeLevel,
      promotedToGrade: promotionDecision.canPromote ? promotedToGrade : null,
      promotionStatus: promotionDecision.promotionStatus,
      overallYearlyAverage,
      subjectAverages,
      promotionDecision,
      department,
      processedAt: new Date()
    };

    // Update student's promotion status
    student.promotionStatus = promotionDecision.promotionStatus;
    student.promotedToGrade = promotionDecision.canPromote ? promotedToGrade : null;

    // If promoted or conditionally promoted, update grade level
    if (promotionDecision.canPromote && promotedToGrade) {
      student.gradeLevel = promotedToGrade;
    }

    await student.save();

    // Create detailed promotion notes
    let promotionNotes = '';
    if (graduated) {
      promotionNotes = `Student graduated from Grade 12 (${department} Department). Overall average: ${overallYearlyAverage}%. All core subjects requirement met.`;
    } else {
      promotionNotes = `Automatic promotion based on core subject performance in ${department} Department. ${promotionDecision.reason}. Overall yearly average: ${overallYearlyAverage}%.`;
      
      if (promotionDecision.failingCoreCount > 0) {
        promotionNotes += ` Failing core subjects: ${promotionDecision.failingCoreSubjects.join(', ')}.`;
      }
      
      if (promotionDecision.failingNonCoreCount > 0) {
        promotionNotes += ` Failing non-core subjects: ${promotionDecision.failingNonCoreSubjects.join(', ')}.`;
      }
    }

    // Create promotion record
    const promotionRecord = await PromotionRecord.create({
      student: studentId,
      previousGrade: promotionData.currentGrade,
      newGrade: promotedToGrade,
      promotionStatus: promotionDecision.promotionStatus,
      promotedBy: promotedById,
      graduated: student.graduated,
      notes: promotionNotes
    });

    return {
      success: true,
      message: graduated
        ? 'Student has graduated from Grade 12.'
        : `Student promotion processed successfully: ${promotionDecision.promotionStatus}`,
      data: {
        ...promotionData,
        promotionRecordId: promotionRecord._id,
        updatedStudent: {
          id: student._id,
          firstName: `${student.firstName}`,
          lastName: `${student.lastName}`,
          middleName: `${student.middleName || ''}`,
          admissionNumber: student.admissionNumber,
          currentGrade: student.gradeLevel,
          promotionStatus: student.promotionStatus,
          promotedToGrade: student.promotedToGrade,
          graduated: student.graduated,
          graduationDate: student.graduationDate,
          department: department
        }
      }
    };

  } catch (error) {
    console.error('Error processing automatic promotion:', error);
    return {
      success: false,
      message: `Error processing promotion: ${error.message}`
    };
  }
};

/**
 * Process promotions for multiple students (batch processing)
 * @param {Array} studentIds - Array of student IDs
 * @param {string} academicYear - Academic year
 * @param {string} promotedById - ID of the user processing promotions
 * @returns {Object} - Batch promotion results
 */
const processBatchPromotions = async (studentIds, academicYear, promotedById) => {
  const results = {
    successful: [],
    failed: [],
    summary: {
      total: studentIds.length,
      promoted: 0,
      conditionallyPromoted: 0,
      notPromoted: 0,
      graduated: 0,
      errors: 0
    }
  };

  for (const studentId of studentIds) {
    try {
      const result = await processAutomaticPromotion(studentId, academicYear, promotedById);
      
      if (result.success) {
        results.successful.push(result);
        
        // Update summary counts
        switch (result.data.promotionStatus) {
          case 'Promoted':
            results.summary.promoted++;
            break;
          case 'Conditional Promotion':
            results.summary.conditionallyPromoted++;
            break;
          case 'Not Promoted':
            results.summary.notPromoted++;
            break;
          case 'Graduated':
            results.summary.graduated++;
            break;
        }
      } else {
        results.failed.push({
          studentId,
          error: result.message
        });
        results.summary.errors++;
      }
    } catch (error) {
      results.failed.push({
        studentId,
        error: error.message
      });
      results.summary.errors++;
    }
  }

  return {
    success: true,
    message: `Batch promotion completed. ${results.summary.promoted} promoted, ${results.summary.conditionallyPromoted} conditionally promoted, ${results.summary.notPromoted} not promoted, ${results.summary.graduated} graduated, ${results.summary.errors} errors.`,
    data: results
  };
};

/**
 * Get promotion preview without updating records
 * @param {string} studentId - Student ID
 * @param {string} academicYear - Academic year
 * @returns {Object} - Promotion preview
 */
const getPromotionPreview = async (studentId, academicYear) => {
  try {
    const student = await Student.findById(studentId);
    if (!student) {
      return {
        success: false,
        message: 'Student not found'
      };
    }

    const yearlyData = await getStudentYearlyAverages(studentId, academicYear);
    if (!yearlyData.success) {
      return yearlyData;
    }

    const { subjectAverages, overallYearlyAverage, hasBothSemesters } = yearlyData.data;
    
    // Determine student's department
    let department = student.department || 'JHS';
    const gradeLevel = parseInt(student.gradeLevel);
    
    if (gradeLevel >= 7 && gradeLevel <= 9) {
      department = 'JHS';
    } else if (gradeLevel >= 10 && gradeLevel <= 12) {
      department = student.department || 'Arts';
    }
    
    const promotionDecision = determinePromotionStatus(subjectAverages, department);

    let nextGrade = null;
    if (promotionDecision.canPromote) {
      if (gradeLevel === 12) {
        nextGrade = 'Graduation';
      } else {
        nextGrade = (gradeLevel + 1).toString();
      }
    }

    return {
      success: true,
      data: {
        student: {
          id: student._id,
          firstName: `${student.firstName}`,
          lastName: `${student.lastName}`,
          middleName: `${student.middleName || ''}`,
          admissionNumber: student.admissionNumber,
          currentGrade: student.gradeLevel,
          department: department
        },
        academicYear,
        hasBothSemesters,
        overallYearlyAverage,
        subjectAverages,
        promotionDecision,
        nextGrade,
        coreSubjects: CORE_SUBJECTS[department] || []
      }
    };

  } catch (error) {
    console.error('Error generating promotion preview:', error);
    return {
      success: false,
      message: `Error generating preview: ${error.message}`
    };
  }
};

module.exports = {
  getStudentYearlyAverages,
  determinePromotionStatus,
  processAutomaticPromotion,
  processBatchPromotions,
  getPromotionPreview,
  calculateYearlySubjectAverage,
  CORE_SUBJECTS
};
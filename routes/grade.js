const express = require('express');
const router = express.Router();
const {
  createGrade,
  getAllGrades,
  getGradeById,
  getStudentGrades,
  updateGrade,
  deleteGrade,
  getClassPerformance,
  getStudentPerformance,
  searchStudents
} = require('../controllers/gradeController');
const auth = require('../middleware/auth')

// Middleware for validation (you can add your own validation middleware)
// This middleware is causing the issue because it expects 'subject.score' directly,
// but your subjects have a nested 'scores' object.
// The validation logic in gradeController.js is more appropriate.
const validateGrade = (req, res, next) => {
  const { student, academicYear, term, gradeLevel, subjects } = req.body;
  
  if (!student || !academicYear || !term || !gradeLevel || !subjects) {
    return res.status(400).json({
      success: false,
      message: 'Required fields: student, academicYear, term, classLevel, subjects'
    });
  }

  if (!Array.isArray(subjects) || subjects.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Subjects must be a non-empty array'
    });
  }

  // The original problem: This loop expects a direct 'subject.score' which doesn't exist
  // in your current data structure (it's nested under 'scores').
  // The validation in gradeController.js handles the nested 'scores' correctly.
  for (const subject of subjects) {
    // This condition was the culprit:
    // if (!subject.subject || typeof subject.score !== 'number') {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Each subject must have a subject name and numeric score'
    //   });
    // }

    // Re-adding a basic check to ensure subject name exists,
    // but leaving score validation to the controller.
    if (!subject.subject || typeof subject.subject !== 'string' || subject.subject.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Each subject must have a valid subject name.'
      });
    }
    
    // If you want to enforce that 'scores' object exists at this middleware level:
    if (!subject.scores || typeof subject.scores !== 'object') {
        return res.status(400).json({
            success: false,
            message: 'Each subject must have a scores object.'
        });
    }
  }

  next();
};

// Basic CRUD routes
router.post('/', auth, createGrade);
router.get('/', auth, getAllGrades);

//Search route must come before parameterized routes
router.get('/students/search',  searchStudents);

router.get('/:id', auth, getGradeById);
router.put('/:id', auth, updateGrade);
router.delete('/:id', auth, deleteGrade);

// Student-specific routes  
router.get('/student/:studentId', auth, getStudentGrades);
router.get('/performance/student/:studentId', auth, getStudentPerformance);

// Analytics routes
router.get('/analytics/class-performance', auth, getClassPerformance);

module.exports = router;
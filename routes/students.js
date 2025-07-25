const express = require('express');
const router = express.Router();
const multer = require('multer'); // Import multer directly
const { imageFileFilter, pdfFileFilter } = require('../middleware/studentStaffUploads');
const createError = require('http-errors'); 
const auth = require('../middleware/auth');
const Student = require('../models/Student');
const fs = require('fs');
const path = require('path');

const {
  createStudentAndParent,
  getAllStudents,
  getStudentById,
  updateStudentAndParent,
  deleteStudentAndParent,
  searchStudents,
  getSchoolStats,
  updatePromotionStatus
} = require('../controllers/studentController');

// Custom Multer setup for handling multiple file fields for update/create
const uploadMultipleFiles = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      let folder;
      if (file.fieldname === 'photo') {
        folder = 'students';
      } else if (file.fieldname === 'transcript') {
        folder = 'transcripts';
      } else if (file.fieldname === 'reportCard') {
        folder = 'reportcards';
      } else {
        return cb(createError(400, 'Invalid field name for file upload'), false);
      }
      
      const uploadDir = path.join(__dirname, `../uploads/${folder}/`);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      if (!req.user?.id) {
        return cb(createError(401, 'User not authenticated'), false);
      }
      const ext = path.extname(file.originalname).toLowerCase();
      const filename = `${req.user.id}-${Date.now()}${ext}`;
      cb(null, filename);
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'photo') {
      imageFileFilter(req, file, cb);
    } else if (file.fieldname === 'transcript' || file.fieldname === 'reportCard') {
      pdfFileFilter(req, file, cb);
    } else {
      cb(createError(400, 'Invalid file type or field for upload'), false);
    }
  },
  limits: {
    fileSize: 2 * 1024 * 1024 // 5 MB per file
  }
}).fields([
  { name: 'photo', maxCount: 1 },
  { name: 'transcript', maxCount: 1 },
  { name: 'reportCard', maxCount: 1 },
]);


// Main student routes with consolidated file upload
router.post('/', auth, uploadMultipleFiles, createStudentAndParent); 
router.put('/:id', auth, uploadMultipleFiles, updateStudentAndParent); 


// Remove individual files
router.delete('/remove-transcript/:id', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (student.transcript && fs.existsSync(student.transcript)) {
      fs.unlinkSync(student.transcript);
    }

    student.transcript = '';
    await student.save();

    return res.status(200).json({
      success: true,
      message: 'Transcript removed successfully'
    });

  } catch (error) {
    console.error('Remove transcript error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during transcript removal',
      error: error.message
    });
  }
});

router.delete('/remove-reportcard/:id', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (student.reportCard && fs.existsSync(student.reportCard)) {
      fs.unlinkSync(student.reportCard);
    }

    student.reportCard = '';
    await student.save();

    return res.status(200).json({
      success: true,
      message: 'Report card removed successfully'
    });

  } catch (error) {
    console.error('Remove report card error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during report card removal',
      error: error.message
    });
  }
});

// Main CRUD routes (unchanged)
router.get('/search', auth, searchStudents);
router.get('/', auth, getAllStudents);
router.get('/stats', auth, getSchoolStats);
router.get('/:id', auth, getStudentById);
router.delete('/:id', auth, deleteStudentAndParent);
router.put('/:id/promotion', auth,updatePromotionStatus);

module.exports = router;
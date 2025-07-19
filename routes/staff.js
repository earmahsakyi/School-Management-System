const express = require('express');
const router = express.Router();
const multer = require('multer'); // Import multer directly
const { imageFileFilter, pdfFileFilter } = require('../middleware/studentStaffUploads'); // Import individual components
const createError = require('http-errors'); // Also needed for custom fileFilter error handling
const auth = require('../middleware/auth');
const Staff = require('../models/Student');
const fs = require('fs');
const path = require('path');
const { createStaff, getAllStaff, getStaffById, searchStaff, deleteStaff, updateStaff, getStaffAuditTrail } = require('../controllers/staffController');


const uploadMultipleFiles = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      let folder;
      if (file.fieldname === 'photo') {
        folder = 'staff';
      } else if (file.fieldname === 'certificate') {
        folder = 'certificate';
      } 
      else {
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
    } else if (file.fieldname === 'certificate') {
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
  { name: 'certificate', maxCount: 1 },
]);

router.delete('/remove-certificate/:id', auth, async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff not found' });
    }

    if (staff.certificate && fs.existsSync(staff.certificate)) {
      fs.unlinkSync(staff.certificate);
    }

    staff.certificate = '';
    await staff.save();

    return res.status(200).json({
      success: true,
      message: 'Certificate removed successfully'
    });

  } catch (error) {
    console.error('Remove certificate error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during certificate removal',
      error: error.message
    });
  }
});



router.post('/', auth, uploadMultipleFiles, createStaff);
router.get('/', auth, getAllStaff);
router.get('/search', auth, searchStaff);
router.get('/:id/audit', auth, getStaffAuditTrail);
router.get('/:id', auth, getStaffById);
router.put('/:id', auth, uploadMultipleFiles, updateStaff);
router.delete('/:id', auth, deleteStaff);

module.exports = router;
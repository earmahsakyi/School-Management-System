const express = require('express');
const router = express.Router();
const { upload, uploadToS3 } = require('../middleware/s3Uploader'); 
const auth = require('../middleware/auth');
const Student = require('../models/Student');
const { DeleteObjectCommand,S3Client } = require('@aws-sdk/client-s3');
const config = require('../config/default.json');

const s3 = new S3Client({
  region: config.AWS_REGION,
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY,
    secretAccessKey: config.AWS_SECRET_KEY,
  },
});


const {
  createStudentAndParent,
  getAllStudents,
  getStudentById,
  updateStudentAndParent,
  deleteStudentAndParent,
  searchStudents,
  getSchoolStats,
  updatePromotionStatus,
  getStudentPromotionPreview,
  processStudentPromotion,
  getStudentYearlyAveragesController,
  processBatchStudentPromotions,
  getEligibleStudentsForPromotion,
  getStudentDocuments,
  downloadStudentDocument
} = require('../controllers/studentController');



// Main student routes with consolidated file upload
router.post('/', auth, upload,
    async (req, res, next) => {
    try {
      const files = req.files;
      const uploadedUrls = {};
       const role = 'student';

      for (const field in files) {
        const file = files[field][0];
        const url = await uploadToS3(file, role); // Upload to S3
        uploadedUrls[field] = url;
      }

      req.body.uploadedUrls = uploadedUrls; // inject into req.body for controller
      next();
    } catch (err) {
      console.error(err.message || "server error");
    }
  },
  
  createStudentAndParent); 
router.put('/:id', auth, upload,
  async (req, res, next) => {
    try {
      const files = req.files;
      const uploadedUrls = {};
       const role = 'student';

      for (const field in files) {
        const file = files[field][0];
        const url = await uploadToS3(file, role); // Upload to S3
        uploadedUrls[field] = url;
      }

      req.body.uploadedUrls = uploadedUrls; // inject into req.body for controller
      next();
    } catch (err) {
      console.error(err.message || "server error");
    }
  }, updateStudentAndParent); 

// Remove individual files
router.delete('/remove-transcript/:id', auth, async (req, res) => {
try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (student.transcript) {
      const key = getKeyFromUrl(student.transcript);
      if (key) {
        await s3.send(new DeleteObjectCommand({ Bucket: config.AWS_BUCKET_NAME, Key: key }));
      }
      student.transcript = '';
      await student.save();
    }

    res.status(200).json({ success: true, message: 'Transcript removed from S3 and DB' });

  } catch (error) {
    console.error('Transcript deletion failed:', error);
    res.status(500).json({ success: false, message: 'Error removing transcript', error: error.message });
  }
});

router.delete('/remove-reportcard/:id', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (student.reportCard) {
      const key = getKeyFromUrl(student.reportCard);
      if (key) {
        await s3.send(new DeleteObjectCommand({ Bucket: config.AWS_BUCKET_NAME, Key: key }));
      }
      student.reportCard = '';
      await student.save();
    }

    res.status(200).json({ success: true, message: 'Report card removed from S3 and DB' });

  } catch (error) {
    console.error('Report card deletion failed:', error);
    res.status(500).json({ success: false, message: 'Error removing report card', error: error.message });
  }
});  

// Promotion-related routes
router.get('/promotion/eligible', auth, getEligibleStudentsForPromotion);
router.post('/promotion/batch', auth, processBatchStudentPromotions);
router.get('/:id/promotion/preview', auth, getStudentPromotionPreview);
router.post('/:id/promotion/process', auth, processStudentPromotion);
router.get('/:id/yearly-averages', auth, getStudentYearlyAveragesController);
router.put('/:id/promotion', auth, updatePromotionStatus);

// Main CRUD routes
router.get('/student-documents/:id',auth,getStudentDocuments)
router.get('/download-document', auth, downloadStudentDocument);
router.get('/search', auth, searchStudents);
router.get('/', auth, getAllStudents);
router.get('/stats', auth, getSchoolStats);
router.get('/:id', auth, getStudentById);
router.delete('/:id', auth, deleteStudentAndParent);

module.exports = router;
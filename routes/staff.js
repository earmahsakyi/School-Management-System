const express = require('express');
const router = express.Router();
const { upload, uploadToS3 } = require('../middleware/s3Uploader'); 
const auth = require('../middleware/auth');
const Staff = require('../models/Staff'); 
const { DeleteObjectCommand,S3Client } = require('@aws-sdk/client-s3');
// const config = require('../config/default.json');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

const { createStaff, getAllStaff, getStaffById, searchStaff, deleteStaff, updateStaff, getStaffDocuments,downloadStaffDocument } = require('../controllers/staffController');


// Handle multiple certificates removal
router.delete('/remove-certificates/:id', auth, async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff not found' });
    }

    if (Array.isArray(staff.certificates) && staff.certificates.length > 0) {
      for (const certUrl of staff.certificates) {
        const key = getKeyFromUrl(certUrl);
        if (key) {
          await s3.send(new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
          }));
        }
      }

      staff.certificates = [];
      await staff.save();

      return res.status(200).json({
        success: true,
        message: 'Certificates removed from S3 and database',
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'No certificates found to remove',
      });
    }

  } catch (error) {
    console.error('Certificates deletion failed:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing certificates',
      error: error.message,
    });
  }
});
//  Remove specific certificate by index
router.delete('/remove-certificate/:id/:index', auth, async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff not found' });
    }

    const certIndex = parseInt(req.params.index);
    if (
      isNaN(certIndex) ||
      certIndex < 0 ||
      !Array.isArray(staff.certificates) ||
      certIndex >= staff.certificates.length
    ) {
      return res.status(400).json({ success: false, message: 'Invalid certificate index' });
    }

    const certUrl = staff.certificates[certIndex];

    // Extract S3 key from the URL
    const key = getKeyFromUrl(certUrl);
    if (key) {
      await s3.send(new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
      }));
    }

    // Remove the certificate from the array
    staff.certificates.splice(certIndex, 1);
    await staff.save();

    return res.status(200).json({
      success: true,
      message: 'Certificate removed from S3 and database successfully',
    });

  } catch (error) {
    console.error('Remove certificate error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during certificate removal',
      error: error.message,
    });
  }
});


router.post('/', auth, upload,
  async (req, res, next) => {
  try {
    const files = req.files;
    const uploadedUrls = {};
    const role = 'staff';

    for (const field in files) {
      if (field === 'certificates') {
        // Handle multiple certificates
        const certificateUrls = [];
        for (const file of files[field]) {
          const url = await uploadToS3(file, role);
          certificateUrls.push(url);
        }
         
        uploadedUrls[field] = certificateUrls; // Array of URLs
      } else {
        // Handle single files (photo, transcript, etc.)
        const file = files[field][0];
        const url = await uploadToS3(file, role);
        uploadedUrls[field] = url; // Single URL
      }
    }

    req.body.uploadedUrls = uploadedUrls;
    next();
  } catch (err) {
    console.error('File upload error:', err.message || "server error");
    res.status(500).json({ 
      success: false, 
      msg: 'File upload failed', 
      error: err.message 
    });
  }
},
  createStaff);
router.get('/staff-documents/:id',auth,getStaffDocuments)
router.get('/download-document', auth, downloadStaffDocument);
router.get('/', auth, getAllStaff);
router.get('/search', auth, searchStaff);
// router.get('/:id/audit', auth, getStaffAuditTrail);
router.get('/:id', auth, getStaffById);
router.put('/:id', auth,
   upload,
 async (req, res, next) => {
  try {
    const files = req.files;
    const uploadedUrls = {};
    const role = 'staff';

    for (const field in files) {
      if (field === 'certificates') {
        // Handle multiple certificates
        const certificateUrls = [];
        for (const file of files[field]) {
          const url = await uploadToS3(file, role);
          certificateUrls.push(url);
        }
        uploadedUrls[field] = certificateUrls; // Array of URLs
      } else {
        // Handle single files (photo, transcript, etc.)
        const file = files[field][0];
        const url = await uploadToS3(file, role);
        uploadedUrls[field] = url; // Single URL
      }
    }

    req.body.uploadedUrls = uploadedUrls;
    next();
  } catch (err) {
    console.error('File upload error:', err.message || "server error");
    res.status(500).json({ 
      success: false, 
      msg: 'File upload failed', 
      error: err.message 
    });
  }
}, 
   updateStaff);

router.delete('/:id', auth, deleteStaff);

module.exports = router;
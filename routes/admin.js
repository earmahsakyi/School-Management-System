
const express = require('express');
const router = express.Router();
const { upload, uploadToS3 } = require('../middleware/s3Uploader'); 
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const { validateAdminProfile, validateAdminSearch } = require('../validators/adminValidators');

// Protected Routes
router.get('/profile', auth, adminController.getMyAdminProfile);

// Admin create/update with image upload
router.post('/',
  auth,                   // 1. Authenticate
  upload,                 // 2. Upload locally
  async (req, res, next) => {
    try {
      const files = req.files;
      const uploadedUrls = {};
       const role = 'admin';

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
  validateAdminProfile,   // 3. Validate input
  adminController.createOrUpdateAdminProfile // 4. Save to DB
);

// Search
router.get('/search', auth, validateAdminSearch, adminController.searchAdmins);
router.get('/', auth, adminController.getAllAdmins);
router.get('/:id', auth, adminController.getAdminById);
router.delete('/', auth, adminController.deleteAdminProfile);

module.exports = router;

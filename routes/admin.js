const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploads'); 
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const { validateAdminProfile, validateAdminSearch } = require('../validators/adminValidators');

// Protected Routes
router.get('/profile', auth, adminController.getMyAdminProfile);



// Updated route with proper middleware order
router.post('/',  
  auth,                       // 1. Authenticate first
  upload.single('photo'),                     // 2. Then handle file upload
  validateAdminProfile,    // 3. Then validate 
  adminController.createOrUpdateAdminProfile
);

// Public Search & Browse
router.get('/search',auth, validateAdminSearch, adminController.searchAdmins);
router.get('/',auth, adminController.getAllAdmins);
router.get('/:id',auth, adminController.getAdminById);
router.delete('/', auth, adminController.deleteAdminProfile);


module.exports = router;
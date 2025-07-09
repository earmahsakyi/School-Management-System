const Admin = require('../models/Admin');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');


// @desc    Create or update admin profile
// @route   POST /api/admin
// @access  Private
exports.createOrUpdateAdminProfile = async (req, res) => {
  try {
    let { fullName, position, phone, staffId, department, gender, status } = req.body;

    // Validate required fields
    const requiredFields = { fullName, position, phone, department };
    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
        console.log('Deleted uploaded file due to validation failure');
      }
      return res.status(400).json({
        success: false,
        msg: 'Missing required fields',
        missingFields
      });
    }

    // Build profile data
    const profileData = {
      user: req.user.id,
      fullName,
      position,
      phone,
      staffId,
      department,
      gender,
      status
    };

    // Handle photo upload
    if (req.file) {
      console.log('Processing uploaded file:', req.file);
      const photoName = path.basename(req.file.path);
      profileData.photo = `uploads/${photoName}`;

      // Clean up old photo if exists
      const existingAdmin = await Admin.findOne({ user: req.user.id });
      if (existingAdmin?.photo) {
        const oldPath = path.join(__dirname, '..', existingAdmin.photo);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
          console.log('Deleted old photo:', oldPath);
        }
      }
    }

    // Upsert admin profile
    const admin = await Admin.findOneAndUpdate(
      { user: req.user.id },
      { $set: profileData },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    await User.findByIdAndUpdate(req.user.id, { profileUpdated: true });

    // Normalize slashes
    const adminObj = admin.toObject();
    if (adminObj.photo) {
      adminObj.photo = adminObj.photo.replace(/\\/g, '/');
    }

    res.status(200).json({
      success: true,
      data: adminObj
    });

  } catch (err) {
    console.error('Admin profile error:', err);

    if (req?.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('Deleted uploaded file due to error');
      } catch (cleanupErr) {
        console.error('Failed cleanup:', cleanupErr);
      }
    }

    res.status(500).json({ 
  success: false,
  msg: 'Server Error',
  error: err.message
});
  }
};

// @desc    Get current admin profile
// @route   GET /api/admin/profile
// @access  Private
exports.getMyAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findOne({ user: req.user.id });

    if (!admin) {
      return res.status(404).json({ success: false, msg: 'Admin profile not found' });
    }

    
    res.status(200).json({
      success: true,
      data: admin
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ 
  success: false,
  msg: 'Server Error',
  error: err.message
});
  }
};



// @desc    Get all admins
// @route   GET /api/admins
// @access  Public
exports.getAllAdmins = async (req, res) => {
  try {
    // Add pagination, filtering, and sorting as needed
    const admins = await Admin.find()
      .populate('user', ['email']) // Include basic user info if needed
      .select('-__v'); // Exclude version key

    res.status(200).json({
      success: true,
      count: admins.length,
      data: admins
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ 
  success: false,
  msg: 'Server Error',
  error: err.message
});
  }
};

// @desc    Get Admin by ID
// @route   GET /api/admin/:id
// @access  Public
exports.getAdminById = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id)
      .populate('user', ['email']);

    if (!admin) {
      return res.status(404).json({
        success: false,
        msg: 'Admin not found'
      });
    }

    res.status(200).json({
      success: true,
      data: admin
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        msg: 'Admin not found'
      });
    }
    res.status(500).json({ 
  success: false,
  msg: 'Server Error',
  error: err.message
});
  }
};

// @desc    Delete admin profile
// @route   DELETE /api/admin
// @access  Private
exports.deleteAdminProfile = async (req, res) => {
  try {
    // Remove provider profile
    await Admin.findOneAndDelete({ user: req.user.id });

    // You might also want to remove the user account here
    await User.findByIdAndDelete(req.user.id);

    res.status(200).json({
      success: true,
      msg: 'Admin profile deleted'
    });
  } catch (err) {
    console.error(err.message);
 res.status(500).json({ 
  success: false,
  msg: 'Server Error',
  error: err.message
});
  }
};

// @desc    Search admins by staffId
// @route   GET /api/admin/search
// @access  Private
exports.searchAdmins = async (req, res) => {
  try {
    const { staffId } = req.query;

    const query = {};

    if (staffId) {
      query.staffId = { $regex: staffId, $options: 'i' }; // case-insensitive partial match
    }

    const admins = await Admin.find(query)
      .populate('user', ['email'])
      .select('-__v')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: admins.length,
      data: admins
    });

  } catch (err) {
    console.error('Search admins error:', err.message);
    res.status(500).json({ 
  success: false,
  msg: 'Server Error',
  error: err.message
});
  }
};



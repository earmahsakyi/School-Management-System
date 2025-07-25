const Staff = require('../models/Staff');
const fs = require('fs');
const path = require('path');
const generateStaffID = require('../utils/generateStaffID');
const StaffAudit = require('../models/StaffAudit');

// @desc    Create new staff
// @route   POST /api/staff
// @access  Private
exports.createStaff = async (req, res) => {
  try {
    const {
      firstName, lastName, dob, gender, middleName,
      placeOfBirth, position, department, qualifications,
      phone, email, currentAddress, nationalID,
      startYear, endYear, name,maritalStatus,nationality,ssn,payrollNumber,yearOfEmployment
    } = req.body;

    const cleanupFiles = (files) => {
      if (files) {
        Object.values(files).forEach(fileArray => {
          fileArray.forEach(file => {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
              console.log('Deleted uploaded file:', file.path);
            }
          });
        });
      }
    };

    const requiredFields = { firstName, lastName, dob, gender, position, department, phone, email,name, placeOfBirth,nationality,maritalStatus,ssn,payrollNumber,yearOfEmployment };
    const missingFields = Object.entries(requiredFields).filter(([_, v]) => !v).map(([k]) => k);
    if (missingFields.length > 0) {
      cleanupFiles(req.files);
      return res.status(400).json({ success: false, msg: 'Missing required fields', missingFields });
    }

    const existingStaff = await Staff.findOne({ email });
    if (existingStaff) {
      cleanupFiles(req.files);
      return res.status(409).json({ success: false, msg: 'Staff with this email already exists' });
    }

    let staffId;
    let staff;
    for (let i = 0; i < 5; i++) {
      staffId = await generateStaffID();
      try {
        const staffData = {
          firstName,
          lastName,
          middleName: middleName || '',
          dob,
          placeOfBirth,
          gender,
          position,
          department,
          qualifications: qualifications ? qualifications.split(',').map(q => q.trim()) : [],
          staffId,
          phone,
          email,
          nationality,
          maritalStatus: maritalStatus || '',
          currentAddress: currentAddress || '',
          nationalID: nationalID || '',
          institutionAttended: {
            name: name ? String(name) : undefined,
            startYear: startYear ? Number(startYear) : undefined,
            endYear: endYear ? Number(endYear) : undefined
          },
          ssn: ssn ||null,
          yearOfEmployment: yearOfEmployment || null,
          payrollNumber: payrollNumber || null
        };

        // Handle photo upload
        if (req.files?.photo?.length > 0) {
          const photoFile = req.files.photo[0];
          staffData.photo = `uploads/staff/${path.basename(photoFile.path)}`;
        }

        //  Handle multiple certificate file uploads
        if (req.files?.certificates?.length > 0) {
          staffData.certificates = req.files.certificates.map(file =>
            `uploads/certificate/${path.basename(file.path)}`
          );
        }

        staff = await Staff.create(staffData);
        break; // Success
      } catch (err) {
        if (err.code === 11000 && err.keyValue?.staffId) {
          console.log('Duplicate staffId, retrying...');
          continue;
        } else {
          throw err;
        }
      }
    }

    if (!staff) {
      cleanupFiles(req.files);
      throw new Error('Failed to generate unique Staff ID after multiple attempts');
    }

    await StaffAudit.create({
      staff: staff._id,
      action: 'created',
      fieldsChanged: Object.keys(staff.toObject()),
      performedBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: staff
    });

  } catch (err) {
    console.error('Create staff error:', err);
    cleanupFiles(req.files);
    res.status(500).json({ success: false, msg: 'Server Error', error: err.message });
  }
};

// @desc    Get all staff
// @route   GET /api/staff
// @access  Private
exports.getAllStaff = async (req, res) => {
  try {
    const staff = await Staff.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: staff.length,
      data: staff
    });
  } catch (err) {
    console.error('Get all staff error:', err);
    res.status(500).json({ success: false, msg: 'Server Error', error: err.message });
  }
};

// @desc    Get staff by ID
// @route   GET /api/staff/:id
// @access  Private
exports.getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, msg: 'Staff not found' });
    }
    res.status(200).json({ success: true, data: staff });
  } catch (err) {
    console.error('Get staff by ID error:', err);
    res.status(500).json({ success: false, msg: 'Server Error', error: err.message });
  }
};

// @desc    Search staff by various criteria
// @route   GET /api/staff/search
// @access  Private
exports.searchStaff = async (req, res) => {
  try {
    const { staffId, firstName, lastName, position, department, gender } = req.query;

    const query = {};
    if (staffId) {
      query.staffId = { $regex: staffId, $options: 'i' };
    }
    if (firstName) {
      query.firstName = { $regex: firstName, $options: 'i' };
    }
    if (lastName) {
      query.lastName = { $regex: lastName, $options: 'i' };
    }
    if (position) {
      query.position = { $regex: position, $options: 'i' };
    }
    if (department) {
      query.department = department; // Exact match for dropdown/enum
    }
    if (gender) {
      query.gender = gender; // Exact match for dropdown/enum
    }

    const staff = await Staff.find(query).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: staff.length,
      data: staff
    });
  } catch (err) {
    console.error('Search staff error:', err);
    res.status(500).json({ success: false, msg: 'Server Error', error: err.message });
  }
};

// @desc    Update staff
// @route   PUT /api/staff/:id
// @access  Private
exports.updateStaff = async (req, res) => {
  try {
    const {
      firstName, lastName, middleName, dob, placeOfBirth, gender,
      position, department, qualifications, phone, email,
      currentAddress, nationalID, startYear, endYear,name,nationality,maritalStatus,ssn,yearOfEmployment,payrollNumber
    } = req.body;

    const cleanupFiles = (files) => {
      if (files) {
        Object.values(files).forEach(fileArray => {
          fileArray.forEach(file => {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
              console.log('Deleted uploaded file:', file.path);
            }
          });
        });
      }
    };

    let staff = await Staff.findById(req.params.id);
    if (!staff) {
      cleanupFiles(req.files);
      return res.status(404).json({ success: false, msg: 'Staff not found' });
    }

    // Check for duplicate email
    if (email && email !== staff.email) {
      const existingStaffWithEmail = await Staff.findOne({ email });
      if (existingStaffWithEmail && String(existingStaffWithEmail._id) !== String(staff._id)) {
        cleanupFiles(req.files);
        return res.status(409).json({ success: false, msg: 'Staff with this email already exists' });
      }
    }

    const originalStaff = staff.toObject();

    // === Update core fields ===
    staff.firstName = firstName ?? staff.firstName;
    staff.lastName = lastName ?? staff.lastName;
    staff.middleName = middleName ?? staff.middleName;
    staff.dob = dob ?? staff.dob;
    staff.placeOfBirth = placeOfBirth ?? staff.placeOfBirth;
    staff.gender = gender ?? staff.gender;
    staff.position = position ?? staff.position;
    staff.department = department ?? staff.department;
    staff.phone = phone ?? staff.phone;
    staff.email = email ?? staff.email;
    staff.currentAddress = currentAddress ?? staff.currentAddress;
    staff.nationalID = nationalID ?? staff.nationalID;
    staff.maritalStatus = maritalStatus ?? staff.maritalStatus;
    staff.nationality = nationality ?? staff.nationality;
    staff.ssn = ssn ?? staff.ssn;
    staff.yearOfEmployment = yearOfEmployment ?? staff.yearOfEmployment;
    staff.payrollNumber = payrollNumber ?? staff.payrollNumber;

    // Qualifications (as comma-separated string)
    if (qualifications !== undefined) {
      staff.qualifications = qualifications ? qualifications.split(',').map(q => q.trim()) : [];
    }

    // Institution Attended
    if (!staff.institutionAttended) staff.institutionAttended = {};
    if (name !== undefined) staff.institutionAttended.name = String(name);
    if (startYear !== undefined) staff.institutionAttended.startYear = Number(startYear);
    if (endYear !== undefined) staff.institutionAttended.endYear = Number(endYear);
    

    // === Photo Upload ===
    if (req.files?.photo?.length > 0) {
      if (staff.photo && fs.existsSync(staff.photo)) {
        fs.unlinkSync(staff.photo);
      }
      staff.photo = `uploads/staff/${path.basename(req.files.photo[0].path)}`;
    }

    //  Certificates Upload - Handle multiple certificates properly
    if (req.files?.certificates?.length > 0) {
      // Delete old certificate files if they exist
      if (staff.certificates && Array.isArray(staff.certificates)) {
        staff.certificates.forEach(cert => {
          if (fs.existsSync(cert)) {
            fs.unlinkSync(cert);
          }
        });
      }
      // Add new certificates
      staff.certificates = req.files.certificates.map(file =>
        `uploads/certificate/${path.basename(file.path)}`
      );
    }

    await staff.save();

    // === Audit Trail ===
    const changedFields = [];
    for (const key in staff._doc) {
      if (['_id', 'staffId', 'createdAt', 'updatedAt', '__v'].includes(key)) continue;
      if (JSON.stringify(originalStaff[key]) !== JSON.stringify(staff[key])) {
        changedFields.push(key);
      }
    }  

    if (changedFields.length > 0 || req.files?.photo || req.files?.certificates) {
      await StaffAudit.create({
        staff: staff._id,
        action: 'updated',
        fieldsChanged: changedFields.length > 0 ? changedFields : ['file_upload'],
        performedBy: req.user.id
      });
    }

    res.status(200).json({
      success: true,
      msg: 'Staff updated successfully',
      data: staff
    });

  } catch (err) {
    console.error('Update staff error:', err);
    cleanupFiles(req.files);
    res.status(500).json({ success: false, msg: 'Server Error', error: err.message });
  }
};

// @desc    Delete staff
// @route   DELETE /api/staff/:id
// @access  Private
exports.deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, msg: 'Staff not found' });
    }

    // Remove photo
    if (staff.photo && fs.existsSync(staff.photo)) {
      fs.unlinkSync(staff.photo);
      console.log('Deleted staff photo:', staff.photo);
    }
    
    //  Remove all certificate files
    if (staff.certificates && Array.isArray(staff.certificates)) {
      staff.certificates.forEach(cert => {
        if (fs.existsSync(cert)) {
          fs.unlinkSync(cert);
          console.log('Deleted staff certificate:', cert);
        }
      });
    }
    
    // Audit trail for staff deletion
    await StaffAudit.create({
      staff: staff._id,
      action: 'deleted',
      fieldsChanged: [], // No specific fields changed, the record itself is deleted
      performedBy: req.user.id
    });

    await Staff.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, msg: 'Staff deleted successfully' });
  } catch (err) {
    console.error('Delete staff error:', err);
    res.status(500).json({ success: false, msg: 'Server Error', error: err.message });
  }
};

// @desc    get staffAudit
// @route   GET /api/staff/:id/audit
// @access  Private
exports.getStaffAuditTrail = async (req, res) => {
  try {
    const auditTrail = await StaffAudit.find({ staff: req.params.id })
      .populate('performedBy', 'email') // Populate with email of user who performed action
      .sort({ timestamp: -1 });

    if (!auditTrail) {
      return res.status(404).json({ success: false, msg: 'Audit trail not found for this staff member' });
    }

    res.status(200).json({ success: true, data: auditTrail });
     
  } catch (err) {
    console.error('Get staff audit trail error:', err);
    res.status(500).json({ success: false, msg: 'Server Error', error: err.message });
  }
};
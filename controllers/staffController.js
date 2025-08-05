const Staff = require('../models/Staff');
const generateStaffID = require('../utils/generateStaffID');
const StaffAudit = require('../models/StaffAudit');
const { DeleteObjectCommand, S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

exports.createStaff = async (req, res) => {
  try {
    const {
      firstName, lastName, dob, gender, middleName,
      placeOfBirth, position, department, qualifications,
      phone, email, currentAddress, nationalID,
      institutionAttended, nationality, maritalStatus,
      ssn, payrollNumber, yearOfEmployment
    } = req.body;

    const requiredFields = { firstName, lastName, dob, gender, position, department, phone, email, placeOfBirth, nationality, maritalStatus, ssn, payrollNumber, yearOfEmployment };
    const missingFields = Object.entries(requiredFields).filter(([_, v]) => !v).map(([k]) => k);
    if (missingFields.length > 0) {
      return res.status(400).json({ success: false, msg: 'Missing required fields', missingFields });
    }

    const existingStaff = await Staff.findOne({ email });
    if (existingStaff) {
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
          institutionAttended: institutionAttended ? JSON.parse(institutionAttended) : [],
          ssn: ssn || null,
          yearOfEmployment: yearOfEmployment || null,
          payrollNumber: payrollNumber || null
        };

        if (req.body.uploadedUrls?.photo) {
          staffData.photo = req.body.uploadedUrls.photo;
        }

        if (req.body.uploadedUrls?.certificates) {
          const s3CertificatesUrls = req.body.uploadedUrls.certificates;
          staffData.certificates = Array.isArray(s3CertificatesUrls) ? s3CertificatesUrls : [s3CertificatesUrls];
        }

        staff = await Staff.create(staffData);
        break;
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
      throw new Error('Failed to generate unique Staff ID after multiple attempts');
    }

    res.status(201).json({
      success: true,
      data: staff
    });

  } catch (err) {
    console.error('Create staff error:', err);
    res.status(500).json({ success: false, msg: 'Server Error', error: err.message });
  }
};

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

exports.searchStaff = async (req, res) => {
  try {
    const { staffId, firstName, lastName, middleName, position, department, gender } = req.query;

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
    if (middleName) {
      query.lastName = { $regex: lastName, $options: 'i' };
    }
    if (position) {
      query.position = { $regex: position, $options: 'i' };
    }
    if (department) {
      query.department = department;
    }
    if (gender) {
      query.gender = gender;
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

exports.updateStaff = async (req, res) => {
  try {
    const {
      firstName, lastName, middleName, dob, placeOfBirth, gender,
      position, department, qualifications, phone, email,
      currentAddress, nationalID, institutionAttended,
      nationality, maritalStatus, ssn, yearOfEmployment, payrollNumber
    } = req.body;

    let staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, msg: 'Staff not found' });
    }

    if (email && email !== staff.email) {
      const existingStaffWithEmail = await Staff.findOne({ email });
      if (existingStaffWithEmail && String(existingStaffWithEmail._id) !== String(staff._id)) {
        return res.status(409).json({ success: false, msg: 'Staff with this email already exists' });
      }
    }

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

    if (qualifications !== undefined) {
      staff.qualifications = qualifications ? qualifications.split(',').map(q => q.trim()) : [];
    }

    if (institutionAttended !== undefined) {
      staff.institutionAttended = institutionAttended ? JSON.parse(institutionAttended) : [];
    }

    if (req.body.uploadedUrls?.photo) {
      if (staff.photo) {
        const key = getS3KeyFromUrl(staff.photo);
        if (key) await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: key }));
      }
      staff.photo = req.body.uploadedUrls.photo;
    }

    if (req.body.uploadedUrls?.certificates) {
      const newCertificateUrls = Array.isArray(req.body.uploadedUrls.certificates)
        ? req.body.uploadedUrls.certificates
        : [req.body.uploadedUrls.certificates];
      staff.certificates = [...staff.certificates, ...newCertificateUrls];
    }

    await staff.save();

    res.status(200).json({
      success: true,
      msg: 'Staff updated successfully',
      data: staff
    });

  } catch (err) {
    console.error('Update staff error:', err);
    res.status(500).json({ success: false, msg: 'Server Error', error: err.message });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, msg: 'Staff not found' });
    }

    const getKeyFromUrl = (url) => {
      const parts = url.split('/');
      return parts.slice(3).join('/');
    };

    if (staff.photo) {
      const key = getKeyFromUrl(staff.photo);
      await s3.send(new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
      }));
    }

    if (Array.isArray(staff.certificates)) {
      for (const certUrl of staff.certificates) {
        const key = getKeyFromUrl(certUrl);
        if (key) {
          await s3.send(new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
          }));
        }
      }
    }

    await Staff.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, msg: 'Staff deleted successfully' });
  } catch (err) {
    console.error('Delete staff error:', err);
    res.status(500).json({ success: false, msg: 'Server Error', error: err.message });
  }
};

exports.getStaffDocuments = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff not found' });
    }

    const documents = {
      photo: staff.photo || null,
      certificates: staff.certificates || []
    };

    res.status(200).json({ success: true, documents });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching documents', error: err.message });
  }
};

exports.downloadStaffDocument = async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ success: false, msg: 'Document URL is required' });
    }

    const urlParts = new URL(url);
    const key = urlParts.pathname.substring(1);

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    });

    const response = await s3.send(command);
    
    const contentType = response.ContentType || 'application/octet-stream';
    const contentDisposition = `attachment; filename="${key.split('/').pop()}"`;
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', contentDisposition);
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    response.Body.pipe(res);
    
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({ 
      success: false, 
      msg: 'Failed to download document', 
      error: error.message 
    });
  }
};

// @desc    get staffAudit
// @route   GET /api/staff/:id/audit
// @access  Private
// exports.getStaffAuditTrail = async (req, res) => {
//   try {
//     const auditTrail = await StaffAudit.find({ staff: req.params.id })
//       .populate('performedBy', 'email') // Populate with email of user who performed action
//       .sort({ timestamp: -1 });

//     if (!auditTrail) {
//       return res.status(404).json({ success: false, msg: 'Audit trail not found for this staff member' });
//     }

//     res.status(200).json({ success: true, data: auditTrail });
     
//   } catch (err) {
//     console.error('Get staff audit trail error:', err);
//     res.status(500).json({ success: false, msg: 'Server Error', error: err.message });
//   } config
// };

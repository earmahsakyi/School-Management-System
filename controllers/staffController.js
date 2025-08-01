const Staff = require('../models/Staff');
const generateStaffID = require('../utils/generateStaffID');
const StaffAudit = require('../models/StaffAudit');
const { DeleteObjectCommand ,S3Client,GetObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

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

    

    const requiredFields = { firstName, lastName, dob, gender, position, department, phone, email,name, placeOfBirth,nationality,maritalStatus,ssn,payrollNumber,yearOfEmployment };
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
        if (req.body.uploadedUrls?.photo) {
          const s3PhotoUrl = req.body.uploadedUrls.photo;
          staffData.photo = s3PhotoUrl;
          }

        //  Handle multiple certificate file uploads
        if (req.body.uploadedUrls?.certificates) {
          const s3CertificatesUrls = req.body.uploadedUrls.certificates;
            console.log('📦 Certificates received in controller:', s3CertificatesUrls);
          // If it's an array, save as is
          if (Array.isArray(s3CertificatesUrls)) {
            staffData.certificates = s3CertificatesUrls;
          } else {
            // If it's a single URL, wrap it in an array
            staffData.certificates = [s3CertificatesUrls];
          }
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
    const { staffId, firstName, lastName,middleName, position, department, gender } = req.query;

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

 

    let staff = await Staff.findById(req.params.id);
    if (!staff) {
  
      return res.status(404).json({ success: false, msg: 'Staff not found' });
    }

    // Check for duplicate email
    if (email && email !== staff.email) {
      const existingStaffWithEmail = await Staff.findOne({ email });
      if (existingStaffWithEmail && String(existingStaffWithEmail._id) !== String(staff._id)) {
      
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
    if (req.body.uploadedUrls?.photo) {
      if (staff.photo) {
        const key = getS3KeyFromUrl(staff.photo);
        if (key) await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: key }));
      }
      staff.photo = req.body.uploadedUrls.photo;
    }
    
    //  Certificates Upload - Handle multiple certificates properly
if (req.body.uploadedUrls?.certificates) {
  const newCertificateUrls = Array.isArray(req.body.uploadedUrls.certificates)
    ? req.body.uploadedUrls.certificates
    : [req.body.uploadedUrls.certificates];

  //  Append new certs to existing ones
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
   const getKeyFromUrl = (url) => {
     const parts = url.split('/');
     return parts.slice(3).join('/'); // e.g., 'student/photo-abc123.jpg'
   };
   
   if (staff.photo) {
     const key = getKeyFromUrl(staff.photo);
     await s3.send(new DeleteObjectCommand({
       Bucket: process.env.AWS_BUCKET_NAME,
       Key: key,
     }));
   }
    
    //  Remove all certificate files
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


//Staff Documents
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

// @desc    Download staff document
// @route   GET /api/staff/download-document
// @access  Private
exports.downloadStaffDocument = async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ success: false, msg: 'Document URL is required' });
    }

    // Extract the S3 key from the URL
    const urlParts = new URL(url);
    const key = urlParts.pathname.substring(1); 

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    });

    const response = await s3.send(command);
    
    // Set appropriate headers
    const contentType = response.ContentType || 'application/octet-stream';
    const contentDisposition = `attachment; filename="${key.split('/').pop()}"`;
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', contentDisposition);
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Stream the file
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

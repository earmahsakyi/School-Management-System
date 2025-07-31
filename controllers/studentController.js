const Student = require('../models/Student');
const User = require('../models/User');
const Parent = require('../models/Parent')
const generatePassword = require('../utils/generatePassword');
const bcrypt = require('bcryptjs');
const Grade = require('../models/Grade')
const sendEmail = require('../utils/sendEmail')
const generateAdmissionNumber = require('../utils/generateAdmissionNumber');
const Staff = require('../models/Staff')
const PromotionRecord = require('../models/PromotionRecord');
const {
  getStudentYearlyAverages,
  processAutomaticPromotion,
  processBatchPromotions,
  getPromotionPreview
} = require('../utils/promotionService');
const { DeleteObjectCommand ,S3Client,GetObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// @desc    Create student and parent
// @route   POST /api/student
// @access  Private
exports.createStudentAndParent = async (req, res) => {
  try {
    let {
      firstName, lastName, middleName, dob, placeOfBirth, lastSchoolAttended, gender, gradeLevel, department, classSection,
      name, email, phone, occupation, currentAddress
    } = req.body;

    // Trim whitespace from email if provided
    if (email) {
      email = email.trim();
    }

    // Set email to null if not provided or empty after trim 
    const parentEmail = (email && email.length > 0) ? email : null;

    // Validate required fields (excluding email from this strict check)
    const requiredFields = { firstName, lastName, dob, placeOfBirth, lastSchoolAttended, occupation, gender, gradeLevel, name, phone, currentAddress };
    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        msg: 'Missing required fields',
        missingFields
      });
    }

    // --- Conditional Parent/User Creation based on email presence ---
    let user = null;
    let parent = null;
    let tempPassword = null;
    let hashedPassword = null;
    let existingUser = null;

    if (parentEmail !== null) { // Only attempt user/parent creation if an email is provided
      // Check if user already exists for parent email
      existingUser = await User.findOne({ email: parentEmail });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          msg: 'A parent account already exists with this email'
        });
      }

      // Generate temporary password and hash if creating a new user
      tempPassword = generatePassword(10);
      hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Create user for parent login
      user = await User.create({
        email: parentEmail,
        password: hashedPassword,
        role: 'parent',
        isVerified: true,
        profileUpdated: true,
        linkedParentId: null
      });
    }

    // Generate admission number with fallback for collisions
    let admissionNumber;
    let student;
    for (let attempt = 0; attempt < 3; attempt++) {
      admissionNumber = await generateAdmissionNumber();
      try {
        const studentData = {
          firstName,
          lastName,
          middleName: middleName || '',
          dob,
          placeOfBirth,
          gender,
          gradeLevel,
          lastSchoolAttended,
          department: department || null,
          admissionNumber,
          classSection: classSection || '',
          currentAddress,
          parent: null 
        };

        // Handle photo upload
          if (req.body.uploadedUrls?.photo) {
          const s3PhotoUrl = req.body.uploadedUrls.photo;
          studentData.photo = s3PhotoUrl;
          }

        // Handle transcript upload
          if (req.body.uploadedUrls?.transcript) {
          const s3TranscriptUrl = req.body.uploadedUrls.transcript;
           studentData.transcript = s3TranscriptUrl;
          }

        // Handle report card upload
        if(req.body.uploadedUrls?.reportCard){
          const s3ReportCardUrl = req.body.uploadedUrls.reportCard;
          studentData.reportCard =s3ReportCardUrl;


        }

        student = await Student.create(studentData);
        break; // success
      } catch (err) {
        if (err.code === 11000 && err.keyValue?.admissionNumber) {
          console.log('Admission number collision, regenerating...');
          continue;
        } else {
          throw err;
        }
      }
    }

    if (!student) {
      throw new Error('Failed to generate unique admission number after 3 attempts');
    }

    // --- Create Parent profile (conditionally linked to user) ---
    // The parent record is always created, but its 'user' field is only set if an email was provided.
    parent = await Parent.create({
      name,
      phone,
      email: parentEmail, // Store null if not provided, or the email (FIXED: was empty string)
      occupation,
      students: [student._id],
      user: user ? user._id : null // Link to user if user was created
    });

    // Update user and student with their respective IDs if a user was created
    if (user) {
      await User.findByIdAndUpdate(user._id, { linkedParentId: parent._id });
      console.log(`and parent user ${user._id}`);
    }
    await Student.findByIdAndUpdate(student._id, { parent: parent._id });

    // Normalize slashes for Windows / Linux
    const studentObj = student.toObject();
    if (studentObj.photo) {
      studentObj.photo = studentObj.photo.replace(/\\/g, '/');
    }
    if (studentObj.transcript) {
      studentObj.transcript = studentObj.transcript.replace(/\\/g, '/');
    }
    if (studentObj.reportCard) {
      studentObj.reportCard = studentObj.reportCard.replace(/\\/g, '/');
    }

    //  Send email only if parentEmail was provided 
    if (parentEmail !== null) {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2 style="color: #4a90e2;">VMHS Parent Portal Login</h2>
          <p>Dear ${name},</p>
          <p>Your login details are:</p>
          <p style="font-size: 18px;"><strong>Email:</strong> ${parentEmail}</p>
          <p style="font-size: 18px;"><strong>Password:</strong> ${tempPassword}</p>
          <p style="margin-top: 20px;">If you did not request this, please ignore this email.</p>
          <p>Thank you,<br>VMHS School Management</p>
        </div>
      `;

      await sendEmail({
        to: parentEmail,
        subject: 'Your Login details',
        html,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        student: studentObj,
        parent: {
          id: parent._id,
          name: parent.name,
          email: parent.email, 
          phone: parent.phone,
          occupation: parent.occupation
        },
        user: user ? {
          email: user.email,
          password: tempPassword
        } : null
      }
    });

  } catch (err) {
    console.error('Create student+parent robust error:', err);
    res.status(500).json({
      success: false,
      msg: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Update promotion status and promoted grade
// @route   PUT /api/students/:id/promotion
// @access  Private
exports.updatePromotionStatus = async (req, res) => {
  try {
    const { promotionStatus, promotedToGrade, notes, academicYear, automatic = false } = req.body;

    if (automatic) {
      // Use automatic promotion logic
      const result = await processAutomaticPromotion(req.params.id, academicYear, req.user.id);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          msg: result.message
        });
      }

      return res.status(200).json({
        success: true,
        msg: result.message,
        data: result.data,
        automatic: true
      });
    }

    // Original manual promotion logic
    const validStatuses = ['Promoted', 'Not Promoted', 'Conditional Promotion', 'Asked Not to Enroll'];
    const validGrades = ['7', '8', '9', '10', '11', '12'];

    if (!validStatuses.includes(promotionStatus)) {
      return res.status(400).json({ success: false, msg: 'Invalid promotion status' });
    }

    if (promotedToGrade && !validGrades.includes(promotedToGrade)) {
      return res.status(400).json({ success: false, msg: 'Invalid promoted grade level' });
    }

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, msg: 'Student not found' });
    }

    // Save previous grade before updating
    const previousGrade = student.gradeLevel;

    // Update promotion status and target grade
    student.promotionStatus = promotionStatus;
    student.promotedToGrade = promotedToGrade || null;

    // Only update actual grade level if the student is promoted or conditionally promoted
    if (
      (promotionStatus === 'Promoted' || promotionStatus === 'Conditional Promotion') &&
      promotedToGrade &&
      promotedToGrade !== previousGrade
    ) {
      student.gradeLevel = promotedToGrade;
    }

    await student.save();

    // Log promotion decision in PromotionRecord
    await PromotionRecord.create({
      student: student._id,
      previousGrade,
      newGrade: promotedToGrade || null,
      promotionStatus,
      promotedBy: req.user.id, 
      notes: notes || 'Manual promotion decision'
    });

    res.status(200).json({
      success: true,
      msg: 'Promotion status and record updated successfully',
      data: student,
      automatic: false
    });
  } catch (err) {
    console.error('Update promotion status error:', err);
    res.status(500).json({
      success: false,
      msg: 'Server Error',
      error: err.message
    });
  }
};

// @desc    get all students
// @route   GET /api/student
// @access  Private
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate('parent', 'name email phone occupation') 
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (err) {
    console.error('Get all students error:', err);
    res.status(500).json({
      success: false,
      msg: 'Server Error',
      error: err.message
    });
  }
};

// @desc    get student by id
// @route   GET /api/student/:id
// @access  Private
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate({
        path: 'parent',
        select: 'name email phone occupation'
      });

    if (!student) {
      return res.status(404).json({
        success: false,
        msg: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (err) {
    console.error('Get student by ID error:', err);
    res.status(500).json({
      success: false,
      msg: 'Server Error',
      error: err.message
    });
  }
};

// @desc    update student and parent
// @route   PUT /api/student/:id
// @access  Private
exports.updateStudentAndParent = async (req, res) => {
  try {
    let {
      firstName, lastName, middleName, dob, placeOfBirth,lastSchoolAttended,occupation, gender, gradeLevel, department, classSection,
      name, email, phone,currentAddress
    } = req.body;

    // Find student and parent
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, msg: 'Student not found' });
    }

    const parent = await Parent.findOne({ students: student._id }).populate('user');
    if (!parent) {
      return res.status(404).json({ success: false, msg: 'Parent not found' });
    }

    // Update student fields - including new fields
    student.firstName = firstName || student.firstName;
    student.lastName = lastName || student.lastName;
    student.middleName = middleName !== undefined ? middleName : student.middleName;
    student.dob = dob || student.dob;
    student.placeOfBirth = placeOfBirth || student.placeOfBirth;
    student.gender = gender || student.gender;
    student.currentAddress = currentAddress || student.currentAddress;
    student.lastSchoolAttended = lastSchoolAttended || student.lastSchoolAttended;
    student.gradeLevel = gradeLevel || student.gradeLevel;
    student.department = department !== undefined ? department : student.department;
    student.classSection = classSection !== undefined ? classSection : student.classSection;

    // Handle new photo 
    // Utility to extract S3 key from URL
const getS3KeyFromUrl = (url) => {
  const baseUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`;
  return url.startsWith(baseUrl) ? url.replace(baseUrl, '') : null;
};


if (req.body.uploadedUrls?.photo) {
  if (student.photo) {
    const key = getS3KeyFromUrl(student.photo);
    if (key) await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: key }));
  }
  student.photo = req.body.uploadedUrls.photo;
}

if (req.body.uploadedUrls?.transcript) {
  if (student.transcript) {
    const key = getS3KeyFromUrl(student.transcript);
    if (key) await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: key }));
  }
  student.transcript = req.body.uploadedUrls.transcript;
}

if (req.body.uploadedUrls?.reportCard) {
  if (student.reportCard) {
    const key = getS3KeyFromUrl(student.reportCard);
    if (key) await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: key }));
  }
  student.reportCard = req.body.uploadedUrls.reportCard;
}
    await student.save();

    // Store old email to compare
    const oldEmail = parent.email;

    // Handle email properly - convert empty strings to null 
    const newEmail = (email && email.trim().length > 0) ? email.trim() : null;

    // Update parent fields
    parent.name = name || parent.name;
    parent.email = newEmail; // Use processed email 
    parent.phone = phone || parent.phone;
    parent.occupation = occupation || parent.occupation;
    await parent.save();

    let sentNewLoginEmail = false;

    // If parent's email has changed, reset their User login and send new credentials
    if (oldEmail !== newEmail) {
      // Handle different scenarios for email changes
      if (newEmail === null) {
        // Email was removed - delete the user account if it exists
        if (parent.user) {
          await User.findByIdAndDelete(parent.user._id);
          parent.user = null;
          await parent.save();
        }
      } else {
        // Email was added or changed
        const tempPassword = generatePassword(10);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        if (parent.user) {
          // Update existing User account
          await User.findByIdAndUpdate(parent.user._id, {
            email: newEmail,
            password: hashedPassword,
            profileUpdated: true
          });
        } else {
          // Create new User account
          const newUser = await User.create({
            email: newEmail,
            password: hashedPassword,
            role: 'parent',
            isVerified: true,
            profileUpdated: true,
            linkedParentId: parent._id
          });
          parent.user = newUser._id;
          await parent.save();
        }

        // Send email with new credentials
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
            <h2 style="color: #4a90e2;">VMHS Parent Portal Login Updated</h2>
            <p>Dear ${name},</p>
            <p>Your login email was updated. Here are your new login details:</p>
            <p style="font-size: 18px;"><strong>Email:</strong> ${newEmail}</p>
            <p style="font-size: 18px;"><strong>Password:</strong> ${tempPassword}</p>
            <p style="margin-top: 20px;">If you did not request this, please contact the school immediately.</p>
            <p>Thank you,<br>VMHS School Management</p>
          </div>
        `;

        await sendEmail({
          to: newEmail,
          subject: 'Updated Login Details for VMHS Parent Portal',
          html
        });

        sentNewLoginEmail = true;
      }
    }

    res.status(200).json({
      success: true,
      msg: sentNewLoginEmail ? "Student and parent updated. New login details sent to parent." : "Student and parent updated.",
      data: { student, parent }
    });

  } catch (err) {
    console.error('Update student+parent error:', err);

    res.status(500).json({
      success: false,
      msg: 'Server Error',
      error: err.message
    });
  }
};

// @desc    delete student and parent
// @route   DELETE /api/student/:id
// @access  Private
exports.deleteStudentAndParent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, msg: 'Student not found' });
    }

    // Remove photo
    // Extract just the filename from the S3 URL
const getKeyFromUrl = (url) => {
  const parts = url.split('/');
  return parts.slice(3).join('/'); // e.g., 'student/photo-abc123.jpg'
};

if (student.photo) {
  const key = getKeyFromUrl(student.photo);
  await s3.send(new DeleteObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  }));
}

if (student.transcript) {
  const key = getKeyFromUrl(student.transcript);
  await s3.send(new DeleteObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  }));
}
if (student.reportCard) {
  const key = getKeyFromUrl(student.reportCard);
  await s3.send(new DeleteObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  }));
}

    // Find parent and check how many students they have
    const parent = await Parent.findOne({ students: student._id });
    if (parent) {
      // Check if this is the parent's only student BEFORE removing
      const isOnlyStudent = parent.students.length === 1;
      
      if (isOnlyStudent) {
        // If this is the only student, delete the entire parent and user account
        console.log('Deleting parent & user since last child removed:', {
          parentId: parent._id,
          userId: parent.user
        });
        await User.findByIdAndDelete(parent.user);
        await Parent.findByIdAndDelete(parent._id);
      } else {
        // If parent has other students, just remove this student from the array
        parent.students = parent.students.filter(id => id.toString() !== student._id.toString());
        await parent.save();
      }
    }

    // Delete student record
    await Student.findByIdAndDelete(student._id);
    await Grade.findByIdAndDelete(student._id);

    res.status(200).json({
      success: true,
      msg: 'Student and linked records deleted'
    });

  } catch (err) {
    console.error('Delete student+parent error:', err);
    res.status(500).json({
      success: false,
      msg: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Search students by various criteria
// @route   GET /api/students/search
// @access  Private
exports.searchStudents = async (req, res) => {
  try {
    const { 
      admissionNumber, firstName, lastName, middleName, gradeLevel, 
      department, classSection, placeOfBirth, gender 
    } = req.query;

    const query = {};

    if (admissionNumber) {
      query.admissionNumber = { $regex: admissionNumber, $options: 'i' };
    }
    if (firstName) {
      query.firstName = { $regex: firstName, $options: 'i' };
    }
    if (lastName) {
      query.lastName = { $regex: lastName, $options: 'i' };
    }
    if (middleName) {
      query.middleName = { $regex: middleName, $options: 'i' };
    }
    if (gradeLevel) {
      query.gradeLevel = gradeLevel; // exact match, dropdown filter
    }
    if (department) {
      query.department = department; // exact match, dropdown filter
    }
    if (classSection) {
      query.classSection = { $regex: classSection, $options: 'i' };
    }
    if (placeOfBirth) {
      query.placeOfBirth = { $regex: placeOfBirth, $options: 'i' };
    }
    if (gender) {
      query.gender = gender; // exact match, dropdown filter
    }

    const students = await Student.find(query)
      .populate({
        path: 'parent',
        select: 'name email phone occupation'
    
      })  
      .select('-__v')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });

  } catch (err) {
    console.error('Search students error:', err.message);
    res.status(500).json({ 
      success: false,
      msg: 'Server Error',
      error: err.message
    });
  }
};

// @desc    stats
// @route   GET /api/students/stats
// @access  Private
exports.getSchoolStats = async (req, res) => {
  try {
    // Validate models
    if (!Student || !Parent || !Staff) {
      throw new Error('One or more models (Student, Parent, Staff) are not defined');
    }

    // Current date calculations (use UTC for consistency)
    const now = new Date();
    const firstDayThisMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));

    // Aggregation for all counts
    const [studentStats, parentStats, staffStats] = await Promise.all([
      Student.aggregate([
        {
          $facet: {
            total: [{ $count: 'count' }],
            lastMonth: [
              { $match: { createdAt: { $lt: firstDayThisMonth }, isActive: true } },
              { $count: 'count' }
            ]
          }
        },
        {
          $project: {
            total: { $arrayElemAt: ['$total.count', 0] },
            lastMonth: { $arrayElemAt: ['$lastMonth.count', 0] }
          }
        }
      ]),
      Parent.aggregate([
        {
          $facet: {
            total: [{ $count: 'count' }],
            lastMonth: [
              { $match: { createdAt: { $lt: firstDayThisMonth }, isActive: true } },
              { $count: 'count' }
            ]
          }
        },
        {
          $project: {
            total: { $arrayElemAt: ['$total.count', 0] },
            lastMonth: { $arrayElemAt: ['$lastMonth.count', 0] }
          }
        }
      ]),
      Staff.aggregate([
        {
          $facet: {
            total: [{ $count: 'count' }],
            lastMonth: [
              { $match: { createdAt: { $lt: firstDayThisMonth }, isActive: true } },
              { $count: 'count' }
            ]
          }
        },
        {
          $project: {
            total: { $arrayElemAt: ['$total.count', 0] },
            lastMonth: { $arrayElemAt: ['$lastMonth.count', 0] }
          }
        }
      ])
    ]);

    const studentsCount = studentStats[0]?.total || 0;
    const studentsLastMonth = studentStats[0]?.lastMonth || 0;
    const parentsCount = parentStats[0]?.total || 0;
    const parentsLastMonth = parentStats[0]?.lastMonth || 0;
    const staffCount = staffStats[0]?.total || 0;
    const staffLastMonth = staffStats[0]?.lastMonth || 0;

    // Calculate percentage changes
    const calculatePercentageChange = (current, previous) => {
      if (previous === 0) return null;
      return Math.round(((current - previous) / previous) * 100);
    };

    const formatPercentage = (change) => {
      if (change === null) return 'N/A';
      const prefix = change > 0 ? '+' : '';
      return `${prefix}${change}%`;
    };

    const studentsChange = calculatePercentageChange(studentsCount, studentsLastMonth);
    const parentsChange = calculatePercentageChange(parentsCount, parentsLastMonth);
    const staffChange = calculatePercentageChange(staffCount, staffLastMonth);

    const stats = {
      studentsCount,
      parentsCount,
      staffCount,
      studentsChange: formatPercentage(studentsChange),
      parentsChange: formatPercentage(parentsChange),
      staffChange: formatPercentage(staffChange),
      studentsChangeType: studentsChange === null ? 'neutral' : studentsChange >= 0 ? 'positive' : 'negative',
      parentsChangeType: parentsChange === null ? 'neutral' : parentsChange >= 0 ? 'positive' : 'negative',
      staffChangeType: staffChange === null ? 'neutral' : staffChange >= 0 ? 'positive' : 'negative'
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (err) {
    console.error('Error in getSchoolStats:', {
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
    const statusCode = err.name === 'MongoServerError' ? 503 : 500;
    res.status(statusCode).json({
      success: false,
      msg: err.name === 'MongoServerError' ? 'Database Error' : 'Server Error',
      error: err.message
    });
  }
};

exports.getStudentPromotionPreview = async (req, res) => {
  try {
    const { academicYear } = req.query;
    
    if (!academicYear) {
      return res.status(400).json({
        success: false,
        msg: 'Academic year is required'
      });
    }

    const result = await getPromotionPreview(req.params.id, academicYear);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        msg: result.message
      });
    }

    res.status(200).json({
      success: true,
      msg: 'Promotion preview generated successfully',
      data: result.data
    });

  } catch (error) {
    console.error('Error in getStudentPromotionPreview:', error);
    res.status(500).json({
      success: false,
      msg: 'Server Error',
      error: error.message
    });
  }
};

// NEW: Process automatic promotion for a student
// @desc    Process automatic promotion for a student
// @route   POST /api/students/:id/promotion/process
// @access  Private
exports.processStudentPromotion = async (req, res) => {
  try {
    const { academicYear } = req.body;
    
    if (!academicYear) {
      return res.status(400).json({
        success: false,
        msg: 'Academic year is required'
      });
    }

    const result = await processAutomaticPromotion(
      req.params.id, 
      academicYear, 
      req.user.id
    );
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        msg: result.message
      });
    }

    res.status(200).json({
      success: true,
      msg: result.message,
      data: result.data
    });

  } catch (error) {
    console.error('Error in processStudentPromotion:', error);
    res.status(500).json({
      success: false,
      msg: 'Server Error',
      error: error.message
    });
  }
};

// NEW: Get student yearly averages
// @desc    Get yearly averages for a student
// @route   GET /api/students/:id/yearly-averages
// @access  Private
exports.getStudentYearlyAveragesController = async (req, res) => {
  try {
    const { academicYear } = req.query;
    
    if (!academicYear) {
      return res.status(400).json({
        success: false,
        msg: 'Academic year is required'
      });
    }

    const result = await getStudentYearlyAverages(req.params.id, academicYear);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        msg: result.message
      });
    }

    res.status(200).json({
      success: true,
      msg: 'Yearly averages retrieved successfully',
      data: result.data
    });

  } catch (error) {
    console.error('Error in getStudentYearlyAverages:', error);
    res.status(500).json({
      success: false,
      msg: 'Server Error',
      error: error.message
    });
  }
};

// NEW: Process batch promotions
// @desc    Process promotions for multiple students
// @route   POST /api/students/promotion/batch
// @access  Private
exports.processBatchStudentPromotions = async (req, res) => {
  try {
    const { studentIds, academicYear } = req.body;
    
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        msg: 'Student IDs array is required'
      });
    }

    if (!academicYear) {
      return res.status(400).json({
        success: false,
        msg: 'Academic year is required'
      });
    }

    const result = await processBatchPromotions(
      studentIds, 
      academicYear, 
      req.user.id
    );

    res.status(200).json({
      success: true,
      msg: result.message,
      data: result.data
    });

  } catch (error) {
    console.error('Error in processBatchStudentPromotions:', error);
    res.status(500).json({
      success: false,
      msg: 'Server Error',
      error: error.message
    });
  }
};

// NEW: Get eligible students for promotion
// @desc    Get all students eligible for promotion in a specific grade and academic year
// @route   GET /api/students/promotion/eligible
// @access  Private
exports.getEligibleStudentsForPromotion = async (req, res) => {
  try {
    const { gradeLevel, academicYear, department } = req.query;
    
    if (!gradeLevel || !academicYear) {
      return res.status(400).json({
        success: false,
        msg: 'Grade level and academic year are required'
      });
    }

    // Build filter for students
    const studentFilter = { gradeLevel };
    if (department && department !== 'all') {
      studentFilter.department = department;
    }

    // Get all students in the specified grade
    const students = await Student.find(studentFilter)
      .select('firstName lastName middleName admissionNumber gradeLevel gender dob department classSection promotionStatus promotedToGrade')
      .sort({ lastName: 1, firstName: 1 });

    // Get promotion previews for all students
    const eligibilityResults = await Promise.all(
      students.map(async (student) => {
        const preview = await getPromotionPreview(student._id, academicYear);
        return {
          student: {
            id: student._id,
            firstName: `${student.firstName} `,
            lastName:`${student.lastName} `,
            middleName: `${student.middleName || ''}`,
            admissionNumber: student.admissionNumber,
            gradeLevel: student.gradeLevel,
            dob: student.dob.toLocaleDateString(),
            gender: student.gender,
            department: student.department,
            classSection: student.classSection,
            currentPromotionStatus: student.promotionStatus,
            currentPromotedToGrade: student.promotedToGrade
          },
          eligibility: preview.success ? preview.data : { error: preview.message }
        };
      })
    );

    // Categorize results
    const summary = {
      total: students.length,
      readyForPromotion: 0,
      conditionalPromotion: 0,
      notEligible: 0,
      incomplete: 0
    };

    const categorized = {
      promoted: [],
      conditional: [],
      notPromoted: [],
      incomplete: []
    };

    eligibilityResults.forEach(result => {
      if (result.eligibility.error) {
        summary.incomplete++;
        categorized.incomplete.push(result);
      } else if (!result.eligibility.hasBothSemesters) {
        summary.incomplete++;
        categorized.incomplete.push(result);
      } else {
        switch (result.eligibility.promotionDecision.promotionStatus) {
          case 'Promoted':
            summary.readyForPromotion++;
            categorized.promoted.push(result);
            break;
          case 'Conditional Promotion':
            summary.conditionalPromotion++;
            categorized.conditional.push(result);
            break;
          case 'Not Promoted':
            summary.notEligible++;
            categorized.notPromoted.push(result);
            break;
        }
      }
    });

    res.status(200).json({
      success: true,
      msg: 'Promotion eligibility data retrieved successfully',
      data: {
        summary,
        students: categorized,
        filter: {
          gradeLevel,
          academicYear,
          department: department || 'all'
        }
      }
    });

  } catch (error) {
    console.error('Error in getEligibleStudentsForPromotion:', error);
    res.status(500).json({
      success: false,
      msg: 'Server Error',
      error: error.message
    });
  }
};

exports.getStudentDocuments = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const documents = {
      photo: student.photo || null,
      transcript: student.transcript || null,
      reportCard: student.reportCard || null,
    };

    res.status(200).json({ success: true, documents });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching documents', error: err.message });
  }
}

exports.downloadStudentDocument = async (req, res) => {
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
config
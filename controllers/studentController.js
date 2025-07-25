const Student = require('../models/Student');
const User = require('../models/User');
const Parent = require('../models/Parent')
const generatePassword = require('../utils/generatePassword');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const Grade = require('../models/Grade')
const path = require('path');
const sendEmail = require('../utils/sendEmail')
const generateAdmissionNumber = require('../utils/generateAdmissionNumber');
const Staff = require('../models/Staff')
const PromotionRecord = require('../models/PromotionRecord');

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
      // Clean up any uploaded files
      if (req.files) {
        Object.values(req.files).forEach(fileArray => {
          fileArray.forEach(file => {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          });
        });
      }
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
        // Clean up any uploaded files
        if (req.files) {
          Object.values(req.files).forEach(fileArray => {
            fileArray.forEach(file => {
              if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
              }
            });
          });
        }
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
        if (req.files && req.files.photo) {
          const photoFile = req.files.photo[0]; // Access the first photo file
          console.log('Processing uploaded photo:', photoFile);
          const photoName = path.basename(photoFile.path);
          studentData.photo = `uploads/students/${photoName}`;
        }

        // Handle transcript upload
        if (req.files && req.files.transcript) {
          const transcriptFile = req.files.transcript[0];
          console.log('Processing uploaded transcript:', transcriptFile);
          const transcriptName = path.basename(transcriptFile.path);
          studentData.transcript = `uploads/transcripts/${transcriptName}`;
        }

        // Handle report card upload
        if (req.files && req.files.reportCard) {
          const reportCardFile = req.files.reportCard[0];
          console.log('Processing uploaded report card:', reportCardFile);
          const reportCardName = path.basename(reportCardFile.path);
          studentData.reportCard = `uploads/reportcards/${reportCardName}`;
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
      // Clean up any uploaded files
      if (req.files) {
        Object.values(req.files).forEach(fileArray => {
          fileArray.forEach(file => {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          });
        });
      }
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

    // Clean up any uploaded files on error
    if (req.files) {
      Object.values(req.files).forEach(fileArray => {
        fileArray.forEach(file => {
          if (fs.existsSync(file.path)) {
            try {
              fs.unlinkSync(file.path);
              console.log('Deleted uploaded file due to error:', file.path);
            } catch (cleanupErr) {
              console.error('Failed cleanup:', cleanupErr);
            }
          }
        });
      });
    }

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
    const { promotionStatus, promotedToGrade, notes } = req.body;

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
      notes: notes || ''
    });

    res.status(200).json({
      success: true,
      msg: 'Promotion status and record updated successfully',
      data: student
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
      // Clean up uploaded files (UPDATED)
      if (req.files) {
        Object.values(req.files).forEach(fileArray => {
          fileArray.forEach(file => {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          });
        });
      }
      return res.status(404).json({ success: false, msg: 'Student not found' });
    }

    const parent = await Parent.findOne({ students: student._id }).populate('user');
    if (!parent) {
      // Clean up uploaded files (UPDATED)
      if (req.files) {
        Object.values(req.files).forEach(fileArray => {
          fileArray.forEach(file => {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          });
        });
      }
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
    if (req.files && req.files.photo) {
      const photoFile = req.files.photo[0];
      if (student.photo && fs.existsSync(student.photo)) {
        fs.unlinkSync(student.photo);
      }
      student.photo = `uploads/students/${path.basename(photoFile.path)}`;
    }

    // Handle new transcript 
    if (req.files && req.files.transcript) {
        const transcriptFile = req.files.transcript[0];
        if (student.transcript && fs.existsSync(student.transcript)) {
            fs.unlinkSync(student.transcript);
        }
        student.transcript = `uploads/transcripts/${path.basename(transcriptFile.path)}`;
    }

    // Handle new report card (ADDED for consistency)
    if (req.files && req.files.reportCard) {
        const reportCardFile = req.files.reportCard[0];
        if (student.reportCard && fs.existsSync(student.reportCard)) {
            fs.unlinkSync(student.reportCard);
        }
        student.reportCard = `uploads/reportcards/${path.basename(reportCardFile.path)}`;
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

    // Clean up uploaded files on error (UPDATED)
    if (req.files) {
      Object.values(req.files).forEach(fileArray => {
        fileArray.forEach(file => {
          if (fs.existsSync(file.path)) {
            try {
              fs.unlinkSync(file.path);
            } catch (cleanupErr) {
              console.error('Failed cleanup:', cleanupErr);
            }
          }
        });
      });
    }

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
    if (student.photo && fs.existsSync(student.photo)) {
      fs.unlinkSync(student.photo);
    }

    // Remove transcript if exists
    if (student.transcript && fs.existsSync(student.transcript)) {
      fs.unlinkSync(student.transcript);
    }

    // Remove report card if exists
    if (student.reportCard && fs.existsSync(student.reportCard)) {
      fs.unlinkSync(student.reportCard);
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
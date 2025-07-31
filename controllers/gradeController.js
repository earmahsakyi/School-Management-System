const Grade = require('../models/Grade');
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const mongoose = require('mongoose');

// Helper function to calculate semester average
const calculateSemesterAverage = (subject, term) => {
  try {
    const { scores } = subject;
    
    if (!scores || typeof scores !== 'object') {
      console.error('Invalid scores object for subject:', subject);
      return 0;
    }
    
    let relevantPeriods = [];
    if (term === "1") {
      relevantPeriods = ['period1', 'period2', 'period3'];
    } else if (term === "2") {
      relevantPeriods = ['period4', 'period5', 'period6'];
    } else {
      console.error('Invalid term:', term);
      return 0;
    }
    
    // Calculate average of relevant periods
    const validScores = relevantPeriods
      .map(period => parseFloat(scores[period]))
      .filter(score => !isNaN(score) && score >= 0 && score <= 100);
    
    if (validScores.length === 0) {
      console.warn('No valid period scores for subject:', subject.subject);
      return 0;
    }
    
    const periodsAverage = validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
    const semesterExam = parseFloat(scores.semesterExam) || 0;
    
    // Formula: (average of period scores + semester exam score) / 2
    const average = (periodsAverage + semesterExam) / 2;
    
    return Math.round(average * 10) / 10; // Round to 1 decimal place
  } catch (error) {
    console.error('Error calculating semester average:', error, 'Subject:', subject);
    return 0;
  }
};

// Helper function to calculate overall average for a grade record
const calculateOverallAverage = (subjects) => {
  if (!subjects || subjects.length === 0) {
    console.warn('No subjects provided for overall average calculation');
    return 0;
  }
  
  const totalAverage = subjects.reduce((sum, subject) => sum + (subject.semesterAverage || 0), 0);
  return Math.round((totalAverage / subjects.length) * 10) / 10; // Round to 1 decimal place
};

// Middleware to calculate averages before saving
const calculateAverages = (gradeData, term) => {
  if (gradeData.subjects && gradeData.subjects.length > 0) {
    gradeData.subjects.forEach(subject => {
      subject.semesterAverage = calculateSemesterAverage(subject, term);
    });
    
    gradeData.overallAverage = calculateOverallAverage(gradeData.subjects);
  } else {
    console.warn('No subjects in gradeData for average calculation');
    gradeData.overallAverage = 0;
  }
  
  return gradeData;
};

// Create a new grade record
const createGrade = async (req, res) => {
  try {
    // Add detailed debugging logs
  

    const { student, academicYear, term, gradeLevel, department, subjects, attendance, conduct } = req.body;


    // Enhanced validation with detailed error messages
    if (!student) {
      console.error('Validation failed: Student ID is missing');
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID is required' 
      });
    }

    if (!academicYear) {
      console.error('Validation failed: Academic year is missing');
      return res.status(400).json({ 
        success: false, 
        message: 'Academic year is required' 
      });
    }

    if (!term || !['1', '2'].includes(term)) {
      console.error('Validation failed: Invalid term value:', term);
      return res.status(400).json({ 
        success: false, 
        message: `Term must be either '1' or '2'. Received: ${term}` 
      });
    }

    if (!gradeLevel || !['7', '8', '9', '10', '11', '12'].includes(gradeLevel)) {
      console.error('Validation failed: Invalid grade level:', gradeLevel);
      return res.status(400).json({ 
        success: false, 
        message: `Grade level must be one of: 7, 8, 9, 10, 11, 12. Received: ${gradeLevel}` 
      });
    }

    if (department && !['Arts', 'Science', 'JHS'].includes(department)) {
      console.error('Validation failed: Invalid department:', department);
      return res.status(400).json({ 
        success: false, 
        message: `Department must be one of: Arts, Science, JHS. Received: ${department}` 
      });
    }

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      console.error('Validation failed: Subjects are missing or invalid');
      return res.status(400).json({ 
        success: false, 
        message: 'At least one subject is required' 
      });
    }

    // Validate subjects structure
    const validSubjects = [
      "English", "Mathematics", "General Science", "Social Studies", "Civics",
      "Literature", "Religious and Moral Education (RME)", "Physical Education (PE)",
      "Agriculture", "Computer Science", "History", "Biology", "Economics",
      "Geography", "R.O.T.C", "French", "Chemistry", "Physics"
    ];
    for (const [index, subject] of subjects.entries()) {
      if (!subject.subject || typeof subject.subject !== 'string' || !validSubjects.includes(subject.subject)) {
        console.error(`Validation failed: Invalid subject name at index ${index}`, subject);
        return res.status(400).json({ 
          success: false, 
          message: `Subject must be one of: ${validSubjects.join(', ')}. Invalid subject at index ${index}: ${subject.subject || 'undefined'}` 
        });
      }

      if (!subject.scores || typeof subject.scores !== 'object') {
        console.error(`Validation failed: Invalid scores object for subject at index ${index}`, subject);
        return res.status(400).json({ 
          success: false, 
          message: `Each subject must have a valid scores object. Invalid subject at index ${index}: ${JSON.stringify(subject)}` 
        });
      }

      // Validate score values
      const scoreFields = ['period1', 'period2', 'period3', 'period4', 'period5', 'period6', 'semesterExam'];
      for (const field of scoreFields) {
        const score = subject.scores[field];
        if (score !== null && score !== undefined) {
          const num = parseFloat(score);
          if (isNaN(num) || num < 0 || num > 100) {
            console.error(`Validation failed: Invalid score for ${subject.subject} - ${field}: ${score}`);
            return res.status(400).json({ 
              success: false, 
              message: `Invalid score for ${subject.subject} - ${field}: ${score}. Scores must be between 0 and 100` 
            });
          }
        }
      }
    }

    // Check if student exists
    const studentExists = await Student.findById(student);
    if (!studentExists) {
      console.error('Validation failed: Student not found for ID:', student);
      return res.status(404).json({ 
        success: false, 
        message: `Student not found for ID: ${student}` 
      });
    }

    // Check if grade record already exists for this student, year, and term
    const existingGrade = await Grade.findOne({ student, academicYear, term });
    if (existingGrade) {
      console.error('Validation failed: Duplicate grade record for student:', student, 'Year:', academicYear, 'Term:', term);
      return res.status(400).json({
        success: false,
        message: `Grade record already exists for student ${studentExists.firstName} ${studentExists.lastName} in ${academicYear}, term ${term}`
      });
    }

    // Calculate averages with improved error handling
    const gradeData = calculateAverages({
  student,
  academicYear,
  term,
  gradeLevel: gradeLevel || studentExists.gradeLevel,
  department: department || studentExists.department,
  attendance: attendance || { daysPresent: 0, daysAbsent: 0, timesTardy: 0 },
  conduct: conduct || 'Good',
  subjects: subjects.map(s => ({
    ...s,
    scores: {
      period1: s.scores.period1 !== undefined && s.scores.period1 !== '' ? parseFloat(s.scores.period1) || null : null,
      period2: s.scores.period2 !== undefined && s.scores.period2 !== '' ? parseFloat(s.scores.period2) || null : null,
      period3: s.scores.period3 !== undefined && s.scores.period3 !== '' ? parseFloat(s.scores.period3) || null : null,
      period4: s.scores.period4 !== undefined && s.scores.period4 !== '' ? parseFloat(s.scores.period4) || null : null,
      period5: s.scores.period5 !== undefined && s.scores.period5 !== '' ? parseFloat(s.scores.period5) || null : null,
      period6: s.scores.period6 !== undefined && s.scores.period6 !== '' ? parseFloat(s.scores.period6) || null : null,
      semesterExam: s.scores.semesterExam !== undefined && s.scores.semesterExam !== '' ? parseFloat(s.scores.semesterExam) || 0 : 0
    }
  }))
}, term);



    
if (attendance && typeof attendance !== 'object') {
  return res.status(400).json({
    success: false,
    message: 'Invalid attendance format'
  });
}

if (conduct && !["Excellent", "Good", "Satisfactory", "Needs Improvement"].includes(conduct)) {
  return res.status(400).json({
    success: false,
    message: 'Invalid conduct value'
  });
}

    const grade = new Grade(gradeData);
    await grade.save();
    await grade.populate('student', 'firstName lastName middleName admissionNumber gradeLevel department classSection');

    res.status(201).json({
      success: true,
      message: 'Grade record created successfully',
      data: grade
    });
  } catch (error) {
    console.error('Grade creation error:', error);
    
    // Handle specific MongoDB validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      console.error('MongoDB validation errors:', validationErrors);
      return res.status(400).json({
        success: false,
        message: 'MongoDB validation error',
        errors: validationErrors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      console.error('Duplicate key error:', error);
      return res.status(400).json({
        success: false,
        message: `Grade record already exists for student in ${academicYear}, term ${term}`
      });
    }

    res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`
    });
  }
};

// Get all grades with filtering and pagination
const getAllGrades = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      academicYear, 
      term, 
      gradeLevel, 
      department,
      student 
    } = req.query;

    const filter = {};
    if (academicYear) filter.academicYear = academicYear;
    if (term) filter.term = term;
    if (gradeLevel) filter.gradeLevel = gradeLevel;
    if (department) filter.department = department;
    if (student) filter.student = student;

    const skip = (page - 1) * limit;
    
    const grades = await Grade.find(filter)
      .populate('student', 'firstName lastName middleName admissionNumber gradeLevel department classSection')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Grade.countDocuments(filter);

    res.json({
      success: true,
      data: grades,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error in getAllGrades:', error);
    res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`
    });
  }
};

// Get a single grade by ID
const getGradeById = async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id)
      .populate('student', 'firstName lastName middleName admissionNumber gradeLevel department classSection');

    if (!grade) {
      return res.status(404).json({
        success: false,
        message: 'Grade record not found'
      });
    }

    res.json({
      success: true,
      data: grade
    });
  } catch (error) {
    console.error('Error in getGradeById:', error);
    res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`
    });
  }
};

// Get grades for a specific student
const getStudentGrades = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academicYear, term } = req.query;

    const filter = { student: studentId };
    if (academicYear) filter.academicYear = academicYear;
    if (term) filter.term = term;

    const grades = await Grade.find(filter)
      .populate('student', 'firstName lastName middleName admissionNumber gradeLevel department classSection')
      .sort({ academicYear: -1, term: 1 });

    res.json({
      success: true,
      data: grades
    });
  } catch (error) {
    console.error('Error in getStudentGrades:', error);
    res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`
    });  
  }
};

// Update a grade record
const updateGrade = async (req, res) => {
  try {
    const { subjects, department, attendance, conduct } = req.body;
    
    const grade = await Grade.findById(req.params.id);
    if (!grade) {
      return res.status(404).json({
        success: false,
        message: 'Grade record not found'
      });
    }

    // Update subjects if provided
    if (subjects) {
      // Merge new scores with existing scores to preserve existing period values
      const updatedSubjects = subjects.map(newSubject => {
        const existingSubject = grade.subjects.find(s => s.subject === newSubject.subject);
        
        if (existingSubject) {
          // Merge scores, keeping existing values and adding new ones
          const mergedScores = {
            period1: newSubject.scores.period1 !== undefined ? newSubject.scores.period1 : existingSubject.scores.period1,
            period2: newSubject.scores.period2 !== undefined ? newSubject.scores.period2 : existingSubject.scores.period2,
            period3: newSubject.scores.period3 !== undefined ? newSubject.scores.period3 : existingSubject.scores.period3,
            period4: newSubject.scores.period4 !== undefined ? newSubject.scores.period4 : existingSubject.scores.period4,
            period5: newSubject.scores.period5 !== undefined ? newSubject.scores.period5 : existingSubject.scores.period5,
            period6: newSubject.scores.period6 !== undefined ? newSubject.scores.period6 : existingSubject.scores.period6,
            semesterExam: newSubject.scores.semesterExam !== undefined ? newSubject.scores.semesterExam : existingSubject.scores.semesterExam
          };
          
          return {
            subject: newSubject.subject,
            scores: mergedScores
          };
        } else {
          // New subject, use as is
          return newSubject;
        }
      });
      
      // Add any existing subjects that weren't in the update
      const existingSubjectsNotUpdated = grade.subjects.filter(existing => 
        !subjects.find(newSub => newSub.subject === existing.subject)
      );
      
      grade.subjects = [...updatedSubjects, ...existingSubjectsNotUpdated];
    }

    // Update department if provided
    if (department !== undefined) {
      grade.department = department;
    }

    // Add attendance and conduct updates here
    if (attendance && typeof attendance === 'object') {
      grade.attendance.daysPresent = attendance.daysPresent ?? grade.attendance.daysPresent;
      grade.attendance.daysAbsent = attendance.daysAbsent ?? grade.attendance.daysAbsent;
      grade.attendance.timesTardy = attendance.timesTardy ?? grade.attendance.timesTardy;
    }

    if (conduct && ["Excellent", "Good", "Satisfactory", "Needs Improvement"].includes(conduct)) {
      grade.conduct = conduct;
    }

    // Recalculate averages
    const updatedData = calculateAverages(grade.toObject(), grade.term);
    grade.subjects = updatedData.subjects;
    grade.overallAverage = updatedData.overallAverage;

    await grade.save();
    await grade.populate('student', 'firstName lastName middleName admissionNumber gradeLevel department classSection');

    res.json({
      success: true,
      message: 'Grade record updated successfully',
      data: grade
    });
  } catch (error) {
    console.error('Error in updateGrade:', error);
    res.status(400).json({
      success: false,
      message: `Failed to update grade: ${error.message}`
    });
  }
};

// Delete a grade record
const deleteGrade = async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id);
    if (!grade) {
      return res.status(404).json({
        success: false,
        message: 'Grade record not found'
      });
    }

    await Grade.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Grade record deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteGrade:', error);
    res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`
    });
  }
};

// Get class performance statistics
const getClassPerformance = async (req, res) => {
  try {
    const { academicYear, term, gradeLevel, department } = req.query;

    const filter = {};
    if (academicYear) filter.academicYear = academicYear;
    if (term) filter.term = term;
    if (gradeLevel) filter.gradeLevel = gradeLevel;
    if (department) filter.department = department;

    const grades = await Grade.find(filter)
      .populate('student', 'firstName lastName middleName admissionNumber gradeLevel department classSection');

    const stats = {
      overallStats: {
        totalStudents: grades.length,
        averageScore: 0,
        passingRate: 0,
        topPerformer: 'N/A',
        lowestPerformer: 'N/A'
      },
      subjectAverages: [],
      gradeDistribution: [
        { grade: 'A (90-100)', count: 0, percentage: 0 },
        { grade: 'B (80-89)', count: 0, percentage: 0 },
        { grade: 'C (70-79)', count: 0, percentage: 0 },
        { grade: 'D (60-69)', count: 0, percentage: 0 },
        { grade: 'F (0-59)', count: 0, percentage: 0 }
      ]
    };

    if (grades.length > 0) {
      const subjectTotals = {};
      const subjectCounts = {};
      let totalScore = 0;
      const studentAverages = [];

      grades.forEach(grade => {
        const studentAvg = grade.overallAverage;
        studentAverages.push({ student: grade.student, avg: studentAvg });

        if (studentAvg >= 90) stats.gradeDistribution[0].count++;
        else if (studentAvg >= 80) stats.gradeDistribution[1].count++;
        else if (studentAvg >= 70) stats.gradeDistribution[2].count++;
        else if (studentAvg >= 60) stats.gradeDistribution[3].count++;
        else stats.gradeDistribution[4].count++;

        grade.subjects.forEach(subject => {
          if (!subjectTotals[subject.subject]) {
            subjectTotals[subject.subject] = 0;
            subjectCounts[subject.subject] = 0;
          }
          subjectTotals[subject.subject] += subject.semesterAverage;
          subjectCounts[subject.subject]++;
        });

        totalScore += studentAvg;
      });

      // Calculate subject averages
      stats.subjectAverages = Object.keys(subjectTotals).map(subject => ({
        subject,
        average: (subjectTotals[subject] / subjectCounts[subject]).toFixed(2),
        trend: Math.random() > 0.5 ? 'up' : 'down',
        studentCount: subjectCounts[subject]
      }));

      // Calculate overall stats
      stats.overallStats.averageScore = (totalScore / grades.length).toFixed(2);
      stats.overallStats.passingRate = ((studentAverages.filter(s => s.avg >= 60).length / grades.length) * 100).toFixed(1);
      
      const topStudent = studentAverages.reduce((top, s) => s.avg > (top.avg || 0) ? s : top, {});
      stats.overallStats.topPerformer = topStudent.student 
        ? `${topStudent.student.firstName} ${topStudent.student.lastName} ${topStudent.student.middleName || ''}` 
        : 'N/A';
      
      const lowestStudent = studentAverages.reduce((low, s) => s.avg < (low.avg || Infinity) ? s : low, { avg: Infinity });
      stats.overallStats.lowestPerformer = lowestStudent.student 
        ? `${lowestStudent.student.firstName} ${lowestStudent.student.lastName}  ${lowestStudent.student.middleName || ''}` 
        : 'N/A';

      // Calculate grade distribution percentages
      stats.gradeDistribution.forEach(grade => {
        grade.percentage = grades.length > 0 ? ((grade.count / grades.length) * 100).toFixed(1) : 0;
      });
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error in getClassPerformance:', error);
    res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`
    });
  }
};

// Get student performance summary with yearly average calculation
const getStudentPerformance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academicYear, term } = req.query;

    const filter = { student: studentId };
    if (academicYear) filter.academicYear = academicYear;
    if (term) filter.term = term;

    const grades = await Grade.find(filter)
      .populate('student', 'firstName lastName middleName admissionNumber gradeLevel department classSection')
      .sort({ academicYear: -1, term: 1 });

    if (grades.length === 0) {
      return res.json({
        success: true,
        data: {
          student: null,
          overallStats: {
            totalSubjects: 0,
            averageScore: '0',
            highestScore: '0',
            lowestScore: '0',
            passingSubjects: 0,
            failingSubjects: 0
          },
          subjectPerformance: [],
          termComparison: [],
          gradeHistory: [],
          yearlyAverages: []
        }
      });
    }

    const student = grades[0].student;
    const allSubjects = [];
    const termStats = {};
    const yearlyStats = {};

    // Collect all subject scores and organize by academic year
    grades.forEach(grade => {
      const termKey = `${grade.academicYear}-${grade.term}`;
      if (!termStats[termKey]) {
        termStats[termKey] = {
          academicYear: grade.academicYear,
          term: grade.term,
          subjects: [],
          average: grade.overallAverage
        };
      }

      // Initialize yearly stats
      if (!yearlyStats[grade.academicYear]) {
        yearlyStats[grade.academicYear] = {
          academicYear: grade.academicYear,
          semesters: {},
          yearlyAverage: 0
        };
      }

      yearlyStats[grade.academicYear].semesters[grade.term] = grade.overallAverage;

      if (grade.subjects && Array.isArray(grade.subjects)) {
        grade.subjects.forEach(subject => {
          if (subject && subject.subject && subject.semesterAverage !== undefined) {
            allSubjects.push({
              subject: subject.subject,
              score: subject.semesterAverage,
              academicYear: grade.academicYear,
              term: term
            });
            
            termStats[termKey].subjects.push({
              subject: subject.subject,
              score: subject.semesterAverage
            });
          }
        });
      }
    });

    // Calculate yearly averages
    const yearlyAverages = Object.values(yearlyStats).map(year => {
      const semesters = Object.values(year.semesters);
      const yearlyAverage = semesters.length > 0 
        ? (semesters.reduce((sum, avg) => sum + avg, 0) / semesters.length).toFixed(2)
        : '0';
      
      return {
        academicYear: year.academicYear,
        semester1Average: year.semesters['1'] ? year.semesters['1'].toFixed(2) : 'N/A',
        semester2Average: year.semesters['2'] ? year.semesters['2'].toFixed(2) : 'N/A',
        yearlyAverage
      };
    });

    if (allSubjects.length === 0) {
      return res.json({
        success: true,
        data: {
          student: {
            _id: student._id,
            firstName: student.firstName,
            lastName: student.lastName,
            middleName: student.middleName || '',
            admissionNumber: student.admissionNumber,
            gradeLevel: student.gradeLevel,
            department: student.department,
            classSection: student.classSection
          },
          overallStats: {
            totalSubjects: 0,
            averageScore: '0',
            highestScore: '0',
            lowestScore: '0',
            passingSubjects: 0,
            failingSubjects: 0
          },
          subjectPerformance: [],
          termComparison: [],
          gradeHistory: [],
          yearlyAverages
        }
      });
    }

    // Calculate overall statistics
    const scores = allSubjects.map(s => s.score).filter(score => !isNaN(score));
    const totalSubjects = scores.length;
    const averageScore = totalSubjects > 0 ? (scores.reduce((a, b) => a + b, 0) / totalSubjects).toFixed(2) : '0';
    const highestScore = totalSubjects > 0 ? Math.max(...scores).toFixed(2) : '0';
    const lowestScore = totalSubjects > 0 ? Math.min(...scores).toFixed(2) : '0';
    const passingSubjects = scores.filter(s => s >= 60).length;
    const failingSubjects = totalSubjects - passingSubjects;

    // Calculate subject performance
    const subjectGroups = {};
    allSubjects.forEach(subject => {
      if (subject.subject && !isNaN(subject.score)) {
        if (!subjectGroups[subject.subject]) {
          subjectGroups[subject.subject] = [];
        }
        subjectGroups[subject.subject].push(subject.score);
      }
    });

    const subjectPerformance = Object.keys(subjectGroups).map(subject => {
      const scores = subjectGroups[subject].filter(score => !isNaN(score));
      if (scores.length === 0) return null;
      
      const average = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
      return {
        subject,
        average,
        highest: Math.max(...scores).toFixed(2),
        lowest: Math.min(...scores).toFixed(2),
        attempts: scores.length,
        trend: scores.length > 1 ? (scores[scores.length - 1] > scores[0] ? 'up' : 'down') : 'stable'
      };
    }).filter(Boolean);

    // Calculate term comparison with ranking
    const termComparison = await Promise.all(Object.values(termStats).map(async term => {
      const classFilter = {
        academicYear: term.academicYear,
        term: term.term,
        gradeLevel: grades[0].gradeLevel,
        department: grades[0].department
      };
      
      const classGrades = await Grade.find(classFilter);
      const studentAverages = classGrades.map(g => ({
        studentId: g.student.toString(),
        average: g.overallAverage
      })).filter(s => s.average > 0);

      const sortedAverages = studentAverages.sort((a, b) => b.average - a.average);
      const rank = sortedAverages.findIndex(s => s.studentId === studentId) + 1;
      const totalStudents = studentAverages.length;

      return {
        academicYear: term.academicYear,
        term: term.term,
        average: term.average.toFixed(2),
        totalSubjects: term.subjects.length,
        passingSubjects: term.subjects.filter(s => s.score >= 60).length,
        rank: rank > 0 ? rank : 0,
        totalStudents
      };
    }));

    // Calculate grade history
    const gradeHistory = grades.map(grade => ({
      academicYear: grade.academicYear,
      term: grade.term,
      gradeLevel: grade.gradeLevel,
      department: grade.department,
      subjects: grade.subjects.map(subject => ({
        subject: subject.subject,
        periodScores: {
          period1: subject.scores.period1,
          period2: subject.scores.period2,
          period3: subject.scores.period3,
          period4: subject.scores.period4,
          period5: subject.scores.period5,
          period6: subject.scores.period6
        },
        semesterExam: subject.scores.semesterExam,
        semesterAverage: subject.semesterAverage.toFixed(2),
        grade: subject.semesterAverage >= 90 ? 'A' :
               subject.semesterAverage >= 80 ? 'B' :
               subject.semesterAverage >= 70 ? 'C' :
               subject.semesterAverage >= 60 ? 'D' : 'F'
      })),
      overallAverage: grade.overallAverage.toFixed(2)
    }));

    const performanceData = {
      student: {
        _id: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        middleName: student.middleName || '',
        admissionNumber: student.admissionNumber,
        gradeLevel: student.gradeLevel,
        department: student.department,
        classSection: student.classSection
      },
      overallStats: {
        totalSubjects,
        averageScore,
        highestScore,
        lowestScore,
        passingSubjects,
        failingSubjects
      },
      subjectPerformance,
      termComparison,
      gradeHistory,
      yearlyAverages
    };

    res.json({
      success: true,
      data: performanceData
    });
  } catch (error) {
    console.error('Error in getStudentPerformance:', error);
    res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`
    });
  }
};

// Search students
// Adjust based on your model imports
const searchStudents = async (req, res) => {
  try {
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated'
      });
    }
    const userId = new mongoose.Types.ObjectId(req.user.id); // Use req.user.id
    const parent = await Parent.findOne({ user: userId }).select('students');
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent account not found'
      });
    }
    const { query } = req.query;
    let studentsQuery = Student.find({ _id: { $in: parent.students } });
    if (query && query !== 'all') {
      studentsQuery = studentsQuery.or([
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { middleName: { $regex: query, $options: 'i' } },
        { admissionNumber: { $regex: query, $options: 'i' } }
      ]);
    }
    const students = await studentsQuery.select('firstName lastName middleName admissionNumber gradeLevel department classSection');
    res.status(200).json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Error in searchStudents:', error);
    res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`
    });
  }
};


module.exports = {
  createGrade,
  getAllGrades,
  getGradeById,
  getStudentGrades,
  updateGrade,
  deleteGrade,
  getClassPerformance,
  getStudentPerformance,
  searchStudents
};
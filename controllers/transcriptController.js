const Student = require('../models/Student');
const Grade = require('../models/Grade');
const generateTranscriptPdf = require('../utils/generateTranscript');

exports.getTranscriptPdf = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Get student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, msg: 'Student not found' });
    }

    // Get all grades for student
    const grades = await Grade.find({ student: studentId }).sort({ academicYear: 1, term: 1 });

    if (!grades.length) {
      return res.status(404).json({ success: false, msg: 'No grade records found for student' });
    }

    // Transform the grades data to match what generateTranscriptPdf expects
    // The PDF generator expects: grades array with { gradeLevel, subjects: [{ subject, semesterAverage }], academicYear, conduct }
    
    // Group grades by academic year and grade level to calculate averages
    const gradeMap = {}; // academicYear-gradeLevel -> subjects

    grades.forEach(grade => {
      const key = `${grade.academicYear}-${grade.gradeLevel}`;
      
      if (!gradeMap[key]) {
        gradeMap[key] = {
          gradeLevel: grade.gradeLevel,
          academicYear: grade.academicYear,
          conduct: grade.conduct || 'Good',
          subjectTotals: {},
          subjectCounts: {}
        };
      }

      // Aggregate subject scores across terms
      grade.subjects.forEach(subject => {
        const subjectName = subject.subject;
        const score = subject.semesterAverage || 0;

        if (!gradeMap[key].subjectTotals[subjectName]) {
          gradeMap[key].subjectTotals[subjectName] = 0;
          gradeMap[key].subjectCounts[subjectName] = 0;
        }

        gradeMap[key].subjectTotals[subjectName] += score;
        gradeMap[key].subjectCounts[subjectName] += 1;
      });
    });

    // Convert to the format expected by generateTranscriptPdf
    const formattedGrades = Object.values(gradeMap).map(gradeData => {
      const subjects = Object.keys(gradeData.subjectTotals).map(subjectName => ({
        subject: subjectName,
        semesterAverage: gradeData.subjectCounts[subjectName] > 0 
          ? Math.round((gradeData.subjectTotals[subjectName] / gradeData.subjectCounts[subjectName]) * 10) / 10
          : 0
      }));

      return {
        gradeLevel: gradeData.gradeLevel,
        academicYear: gradeData.academicYear,
        conduct: gradeData.conduct,
        subjects: subjects
      };
    });

    // Sort by grade level
    formattedGrades.sort((a, b) => parseInt(a.gradeLevel) - parseInt(b.gradeLevel));

    // Add promotedToGrade if not set
    if (!student.promotedToGrade) {
      const currentGrade = parseInt(student.gradeLevel);
      
      if (student.promotionStatus === 'Graduated') {
        student.promotedToGrade = 'Graduated';
      } else {
        student.promotedToGrade = currentGrade < 12 ? (currentGrade + 1).toString() : '12';
      }
    }

    // Generate PDF with the correctly formatted data
    const pdfBuffer = await generateTranscriptPdf(student, formattedGrades);

    // Send PDF response
    const filename = `transcript-${student.admissionNumber}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length
    });

    res.send(pdfBuffer);

  } catch (err) {
    console.error('Transcript generation failed:', err);
    res.status(500).json({
      success: false,
      msg: 'Failed to generate transcript',
      error: err.message
    });
  }
};
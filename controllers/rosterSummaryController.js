// controllers/roosterSummaryController.js
const Grade = require('../models/Grade');
const generateRoosterSummaryPdf = require('../utils/rosterSummary');

exports.generateRoosterSummary = async (req, res) => {
  try {
    const { academicYear } = req.query;

    if (!academicYear) {
      return res.status(400).json({ error: 'Missing required query parameter: academicYear' });
    }

    // Fetch grades for the academic year and populate student details
    const grades = await Grade.find({ academicYear })
      .populate('student', 'firstName lastName gradeLevel classSection gender department')
      .lean();

    if (!grades || grades.length === 0) {
      return res.status(404).json({ error: 'No grades found for the specified academic year.' });
    }

    // Extract unique students (since a student may have multiple grade records for terms 1 and 2)
    const uniqueStudents = [];
    const seenStudentIds = new Set();
    for (const grade of grades) {
      if (grade.student && !seenStudentIds.has(grade.student._id.toString())) {
        uniqueStudents.push(grade.student);
        seenStudentIds.add(grade.student._id.toString());
      }
    }

    if (uniqueStudents.length === 0) {
      return res.status(404).json({ error: 'No students found for the specified academic year.' });
    }

    

    // Define class structure based on actual data
    // First, let's analyze what departments actually exist for each grade
    const actualGrades = {};
    uniqueStudents.forEach(student => {
      const grade = student.gradeLevel;
      if (!actualGrades[grade]) {
        actualGrades[grade] = { departments: new Set(), sections: new Set() };
      }
      actualGrades[grade].departments.add(student.department);
      actualGrades[grade].sections.add(student.classSection);
    });

  

    // Define class structure based on actual data
    const classStructure = [
      { grade: '7', sections: ['A', 'B', 'C'], department: 'JHS' },
      { grade: '8', sections: ['A', 'B', 'C'], department: 'JHS' },
      { grade: '9', sections: ['A', 'B', 'C'], department: 'JHS' },
      { grade: '10', sections: ['A', 'B'], departments: ['Science', 'Arts'], allowJHS: true }, // Allow JHS for Grade 10
      { grade: '11', sections: ['A', 'B'], departments: ['Science', 'Arts'] },
      { grade: '12', sections: ['A', 'B'], departments: ['Science', 'Arts'] } // Changed from ['SCIENCE', 'ARTS'] to ['A', 'B']
    ];

    // Calculate counts for each class
    const gradeGroups = classStructure.map((group, index) => {
      const rows = group.sections.map(section => {
        const classStudents = uniqueStudents.filter(s => {
          const matchesGrade = s.gradeLevel === group.grade;
          let matchesSection = false;
          let matchesDepartment = false;

          if (group.grade === '12') {
            // For Grade 12, match section directly and check if department matches
            matchesSection = s.classSection === section;
            matchesDepartment = group.departments?.includes(s.department);
          } else if (['10', '11'].includes(group.grade)) {
            // For grades 10 and 11, check both section and department
            matchesSection = s.classSection === section;
            // Allow JHS department for Grade 10 if specified, otherwise check normal departments
            if (group.allowJHS && s.department === 'JHS') {
              matchesDepartment = true;
            } else {
              matchesDepartment = group.departments?.includes(s.department);
            }
          } else {
            // For grades 7, 8, 9 (JHS)
            matchesSection = s.classSection === section;
            matchesDepartment = s.department === group.department || s.department === null;
          }

          return matchesGrade && matchesSection && matchesDepartment;
        });

        const male = classStudents.filter(s => s.gender && s.gender.toLowerCase() === 'male').length;
        const female = classStudents.filter(s => s.gender && s.gender.toLowerCase() === 'female').length;
        const total = male + female;

        // Format class name
        let className;
        if (group.grade === '12') {
          // For Grade 12, determine department code based on actual department
          const deptCode = classStudents.length > 0 ? 
            (classStudents[0].department === 'Science' ? 'SC' : 'ARTS') : 
            (section === 'A' ? 'SC' : 'ARTS');
          className = `${group.grade}${section}-${deptCode}`;
        } else if (['10', '11'].includes(group.grade)) {
          // For grades 10 and 11, determine department from students in this class
          let deptCode = 'MIXED'; // Default if mixed or unknown
          if (classStudents.length > 0) {
            const firstStudentDept = classStudents[0].department;
            if (firstStudentDept === 'Science') deptCode = 'SC';
            else if (firstStudentDept === 'Arts') deptCode = 'ARTS';
            else if (firstStudentDept === 'JHS') deptCode = 'JHS';
          }
          className = `${group.grade}${section}-${deptCode}`;
        } else {
          className = `${group.grade}${section}`;
        }


        return {
          className,
          male,
          female,
          total
        };
      }).filter(row => row.total > 0); // Only include classes with students

      const subtotal = rows.reduce(
        (acc, row) => ({
          male: acc.male + row.male,
          female: acc.female + row.female,
          total: acc.total + row.total
        }),
        { male: 0, female: 0, total: 0 }
      );

      return {
        name: `Grade ${group.grade}`,
        rows,
        subtotal
      };
    }).filter(group => group.rows.length > 0); 

    // Calculate Junior High (Grades 7–9) and Senior High (Grades 10–12) totals
    const juniorHighTotal = gradeGroups
      .filter(group => ['Grade 7', 'Grade 8', 'Grade 9'].includes(group.name))
      .reduce(
        (acc, group) => ({
          male: acc.male + group.subtotal.male,
          female: acc.female + group.subtotal.female,
          total: acc.total + group.subtotal.total
        }),
        { male: 0, female: 0, total: 0 }
      );

    const seniorHighTotal = gradeGroups
      .filter(group => ['Grade 10', 'Grade 11', 'Grade 12'].includes(group.name))
      .reduce(
        (acc, group) => ({
          male: acc.male + group.subtotal.male,
          female: acc.female + group.subtotal.female,
          total: acc.total + group.subtotal.total
        }),
        { male: 0, female: 0, total: 0 }
      );

    const totalEnrollment = {
      male: juniorHighTotal.male + seniorHighTotal.male,
      female: juniorHighTotal.female + seniorHighTotal.female,
      total: juniorHighTotal.total + seniorHighTotal.total
    };

    const summaryData = {
      gradeGroups,
      juniorHighTotal,
      seniorHighTotal,
      totalEnrollment
    };


    const pdfBuffer = await generateRoosterSummaryPdf({
      summaryData,
      academicYear
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="rooster_summary_${academicYear}.pdf"`);
    res.send(pdfBuffer);

  } catch (err) {
    console.error('Error generating rooster summary:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
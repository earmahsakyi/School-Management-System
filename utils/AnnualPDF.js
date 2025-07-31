const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const generatePdf = async (reportCardData) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const logo1Base64 = fs.readFileSync(path.join(__dirname, '../logo1.png'), 'base64');
    const logo2Base64 = fs.readFileSync(path.join(__dirname, '../logo2.png'), 'base64');
    const page = await browser.newPage();

    // Extract student and grades
    const student = reportCardData.data[0].student;
    const grades = reportCardData.data;

    // Summary calculations
    const totalDaysPresent = grades.reduce((sum, g) => sum + (g.attendance?.daysPresent || 0), 0);
    const totalDaysAbsent = grades.reduce((sum, g) => sum + (g.attendance?.daysAbsent || 0), 0);
    const totalTimesTardy = grades.reduce((sum, g) => sum + (g.attendance?.timesTardy || 0), 0);
    const attendanceRate = totalDaysPresent + totalDaysAbsent > 0 ? 
      ((totalDaysPresent / (totalDaysPresent + totalDaysAbsent)) * 100).toFixed(1) : '0.0';
    
    const sortedGrades = [...grades].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const mostRecentConduct = sortedGrades[0]?.conduct || 'Good';
    const overallAverage = (
      grades.reduce((sum, g) => sum + (g.overallAverage || 0), 0) / grades.length
    ).toFixed(2);

    // Determine department and report title
    const gradeLevel = parseInt(student.gradeLevel);
    let department = student.department || 'JHS';
    let reportTitle = '';

    if (gradeLevel >= 7 && gradeLevel <= 9) {
      department = 'JHS';
      reportTitle = 'Junior High Report Card';
    } else if (gradeLevel >= 10 && gradeLevel <= 12) {
      reportTitle = 'Senior High Report Card';
    }

    // Define subjects per department
    let subjectOrder = [];
    if (department === 'JHS') {
      subjectOrder = [
        "English", "Mathematics", "General Science", "Social Studies", "Civics",
        "Literature", "Religious and Moral Education (RME)", "Physical Education (PE)",
        "Agriculture", "French", "Automotive", "Electricity"
      ];
    } else if (department === 'Arts') {
      subjectOrder = [
        "English", "Mathematics", "Literature", "History", "Economics",
        "Computer Science", "Geography", "Civics", "Biology", "R.O.T.C",
        "Agriculture"
      ];
    } else if (department === 'Science') {
      subjectOrder = [
        "English", "Mathematics", "Biology", "Chemistry", "Physics", "Economics", "R.O.T.C",
        "Computer Science", "Agriculture", "Civics"
      ];
    }

    // Organize grades by subject
    const gradesBySubject = {};
    grades.forEach(gradeEntry => {
      gradeEntry.subjects.forEach(subjectScore => {
        const subject = subjectScore.subject;
        if (!gradesBySubject[subject]) {
          gradesBySubject[subject] = {
            '1st': '', '2nd': '', '3rd': '',
            'Sem. Exam': '', 'Sem. Ave': ''
          };
        }

        const scores = subjectScore.scores;
        if (gradeEntry.term === '1') {
          gradesBySubject[subject]['1st'] = scores.period1 ?? '';
          gradesBySubject[subject]['2nd'] = scores.period2 ?? '';
          gradesBySubject[subject]['3rd'] = scores.period3 ?? '';
        } else if (gradeEntry.term === '2') {
          gradesBySubject[subject]['1st'] = scores.period4 ?? '';
          gradesBySubject[subject]['2nd'] = scores.period5 ?? '';
          gradesBySubject[subject]['3rd'] = scores.period6 ?? '';
        }

        gradesBySubject[subject]['Sem. Exam'] = scores.semesterExam ?? '';
        gradesBySubject[subject]['Sem. Ave'] = subjectScore.semesterAverage ?? '';
      });
    });

    // Generate promotion statement with checkboxes
    const getPromotionCheckboxes = () => {
      const status = student.promotionStatus;
      return {
        promoted: status === 'Promoted' ? 'checked' : '',
        conditional: status === 'Conditional Promotion' ? 'checked' : '',
        repeat: status === 'Not Promoted' ? 'checked' : '',
        notEnroll: status === 'Asked Not to Enroll' ? 'checked' : ''
      };
    };

    const checkboxes = getPromotionCheckboxes();

    // Helper function to get grade class
    const getGradeClass = (score) => {
      if (!score || score === '') return '';
      const num = parseFloat(score);
      if (num >= 90) return 'grade-a';
      if (num >= 80) return 'grade-b';
      if (num >= 70) return 'grade-c';
      if (num >= 60) return 'grade-d';
      return 'grade-f';
    };

    const getOverallGradeClass = (average) => {
      const num = parseFloat(average);
      if (num >= 90) return 'grade-a';
      if (num >= 80) return 'grade-b';
      if (num >= 70) return 'grade-c';
      if (num >= 60) return 'grade-d';
      return 'grade-f';
    };

    // Generate subject rows with grade classes
    const subjectRows = subjectOrder.map(subject => {
      const s = gradesBySubject[subject] || {};
      return `
        <tr>
          <td class="subject-cell">${subject}</td>
          <td class="grade-cell ${getGradeClass(s['1st'])}">${s['1st']}</td>
          <td class="grade-cell ${getGradeClass(s['2nd'])}">${s['2nd']}</td>
          <td class="grade-cell ${getGradeClass(s['3rd'])}">${s['3rd']}</td>
          <td class="grade-cell ${getGradeClass(s['Sem. Exam'])}">${s['Sem. Exam']}</td>
          <td class="grade-cell ${getGradeClass(s['Sem. Ave'])}">${s['Sem. Ave']}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Academic Performance</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 15mm;
    }

    body {
      font-family: Arial, sans-serif;
      font-size: 11px;
      margin: 0;
    }

    .container {
      width: 100%;
      display: flex;
      flex-direction: column;
    }

    h3 {
      text-align: center;
      color: chocolate;
      margin-bottom: 8mm;
    }

    .tables-wrapper {
      display: flex;
      justify-content: space-between;
      width: 100%;
      gap: 10mm;
    }

    table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 5mm;
      table-layout: fixed;
    }

    th, td {
      border: 1px solid #333;
      padding: 4px;
      text-align: center;
      word-wrap: break-word;
    }

    th {
      background-color: #f2f2f2;
      font-weight: bold;
    }

    .attendance-summary {
      display: flex;
      justify-content: space-between;
      gap: 20mm;
      margin-top: 10mm;
    }

    .attendance-box {
      border: 1px solid #ccc;
      padding: 10px;
      width: 48%;
      border-radius: 5px;
      background-color: #f9f9f9;
    }

    .footer {
      margin-top: 10mm;
      text-align: center;
    }

    .footer .motto {
      margin-top: 5mm;
      font-weight: bold;
      color: #555;
    }

    .small-text {
      font-size: 10px;
    }

    .grade-cell.pass {
      background-color: #d4edda;
      color: #155724;
    }

    .grade-cell.fail {
      background-color: #f8d7da;
      color: #721c24;
    }
  </style>
</head>
<body>
  <div class="container">
    <h3>ACADEMIC PERFORMANCE</h3>

    <div class="tables-wrapper">
      <!-- Left Semester Table -->
      <table>
        <thead>
          <tr>
            <th style="width: 25%;">SUBJECTS</th>
            <th style="width: 12%;">1st Period</th>
            <th style="width: 12%;">2nd Period</th>
            <th style="width: 12%;">3rd Period</th>
            <th style="width: 14%;">Semester Exam</th>
            <th style="width: 15%;">Semester Average</th>
          </tr>
        </thead>
        <tbody>
          ${subjectRowsSemester1}
        </tbody>
      </table>

      <!-- Right Semester Table -->
      <table>
        <thead>
          <tr>
            <th style="width: 25%;">SUBJECTS</th>
            <th style="width: 12%;">1st Period</th>
            <th style="width: 12%;">2nd Period</th>
            <th style="width: 12%;">3rd Period</th>
            <th style="width: 14%;">Semester Exam</th>
            <th style="width: 15%;">Semester Average</th>
          </tr>
        </thead>
        <tbody>
          ${subjectRowsSemester2}
          <tr>
            <td style="text-align: left;" colspan="5"><strong>Overall Average</strong></td>
            <td class="grade-cell ${getOverallGradeClass(overallAverage)}">${overallAverage}%</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Attendance & Behavior -->
    <div class="attendance-summary">
      <div class="attendance-box">
        <h4 style="color: #28a745;">ATTENDANCE</h4>
        <p><strong>Days Present:</strong> <span>${totalDaysPresent}</span></p>
        <p><strong>Days Absent:</strong> <span>${totalDaysAbsent}</span></p>
        <p><strong>Times Tardy:</strong> <span>${totalTimesTardy}</span></p>
        <p><strong>Attendance Rate:</strong> <span>${attendanceRate}%</span></p>
      </div>
      <div class="attendance-box">
        <h4 style="color: #17a2b8;">BEHAVIOR</h4>
        <p><strong>Conduct:</strong> <span>${mostRecentConduct}</span></p>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div style="background-color: #fff3cd; padding: 10px; border-radius: 5px; margin: 10mm 0;">
        <p class="small-text" style="color: #856404; font-weight: bold;">
          ANY GRADE BELOW 70% IS A FAILING GRADE
        </p>
      </div>
      <p class="motto">MOTTO: STRIVING FOR POSTERITY</p>
    </div>
  </div>
</body>
</html>

    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
    });

    await browser.close();
    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF:', error);
    if (browser) await browser.close();
    throw error;
  }
};

module.exports = generatePdf; 
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

    const student = reportCardData.data[0].student;
    const grades = reportCardData.data;

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

    const gradeLevel = parseInt(student.gradeLevel);
    let department = student.department || 'JHS';
    let reportTitle = '';

    if (gradeLevel >= 7 && gradeLevel <= 9) {
      department = 'JHS';
      reportTitle = 'Junior High Report Card';
    } else if (gradeLevel >= 10 && gradeLevel <= 12) {
      if (student.department === 'Arts' || student.department === 'Science') {
        department = student.department;
      } else {
        department = 'General';
      }
      reportTitle = 'Senior High Report Card';
    }

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
    } else {
      subjectOrder = [
        "English", "Mathematics", "General Science", "Social Studies", "Literature",
        "Religious and Moral Education (RME)", "Physical Education (PE)", "Computer Science",
        "History", "Economics", "Geography", "French", "Civics", "Agriculture"
      ];
    }

    const gradesBySubjectTerm1 = {};
    const gradesBySubjectTerm2 = {};

    grades.forEach(gradeEntry => {
      gradeEntry.subjects.forEach(subjectScore => {
        const subject = subjectScore.subject;

        if (gradeEntry.term === '1') {
          if (!gradesBySubjectTerm1[subject]) {
            gradesBySubjectTerm1[subject] = { 'p1': '', 'p2': '', 'p3': '', 'exam': '', 'average': '' };
          }
          const scores = subjectScore.scores;
          gradesBySubjectTerm1[subject]['p1'] = scores.period1 ?? '';
          gradesBySubjectTerm1[subject]['p2'] = scores.period2 ?? '';
          gradesBySubjectTerm1[subject]['p3'] = scores.period3 ?? '';
          gradesBySubjectTerm1[subject]['exam'] = scores.semesterExam ?? '';
          gradesBySubjectTerm1[subject]['average'] = subjectScore.semesterAverage !== undefined && subjectScore.semesterAverage !== null ? subjectScore.semesterAverage : '';
        } else if (gradeEntry.term === '2') {
          if (!gradesBySubjectTerm2[subject]) {
            gradesBySubjectTerm2[subject] = { 'p4': '', 'p5': '', 'p6': '', 'exam': '', 'average': '' };
          }
          const scores = subjectScore.scores;
          gradesBySubjectTerm2[subject]['p4'] = scores.period4 ?? '';
          gradesBySubjectTerm2[subject]['p5'] = scores.period5 ?? '';
          gradesBySubjectTerm2[subject]['p6'] = scores.period6 ?? '';
          gradesBySubjectTerm2[subject]['exam'] = scores.semesterExam ?? '';
          gradesBySubjectTerm2[subject]['average'] = subjectScore.semesterAverage !== undefined && subjectScore.semesterAverage !== null ? subjectScore.semesterAverage : '';
        }
      });
    });

    // Function to calculate yearly average
    const calculateYearlyAverage = (subject) => {
      const sem1Average = gradesBySubjectTerm1[subject]?.average;
      const sem2Average = gradesBySubjectTerm2[subject]?.average;
      
      // Only calculate if both semester averages exist and are not empty
      if (sem1Average !== '' && sem1Average !== null && sem1Average !== undefined &&
          sem2Average !== '' && sem2Average !== null && sem2Average !== undefined) {
        const avg1 = parseFloat(sem1Average);
        const avg2 = parseFloat(sem2Average);
        
        if (!isNaN(avg1) && !isNaN(avg2)) {
          return ((avg1 + avg2) / 2).toFixed(2);
        }
      }
      
      return ''; // Return empty string if conditions not met
    };

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

    const getGradeClass = (score) => {
      if (score === null || score === undefined || score === '') return '';
      const num = parseFloat(score);
      if (isNaN(num)) return '';
      if (num >= 90) return 'grade-a';
      if (num >= 80) return 'grade-b';
      if (num >= 70) return 'grade-c';
      if (num >= 60) return 'grade-d';
      return 'grade-f';
    };

    const getOverallGradeClass = (average) => {
      const num = parseFloat(average);
      if (isNaN(num)) return ''; // Handle NaN for overall average
      if (num >= 90) return 'grade-a';
      if (num >= 80) return 'grade-b';
      if (num >= 70) return 'grade-c';
      if (num >= 60) return 'grade-d';
      return 'grade-f';
    };

    // Filter subjectOrder to include only subjects present in gradesBySubjectTerm1
    const subjectsForSemester1 = subjectOrder.filter(subject => gradesBySubjectTerm1[subject]);

    // Generate subject rows for Semester 1 Table (Periods 1, 2, 3)
    const subjectRowsSemester1 = subjectsForSemester1.map(subject => {
      const s = gradesBySubjectTerm1[subject]; // 's' is guaranteed to exist due to filter
      return `
        <tr>
          <td class="subject-cell" style="text-align: left;">${subject}</td>
          <td class="grade-cell ${getGradeClass(s['p1'])}">${s['p1']}</td>
          <td class="grade-cell ${getGradeClass(s['p2'])}">${s['p2']}</td>
          <td class="grade-cell ${getGradeClass(s['p3'])}">${s['p3']}</td>
          <td class="grade-cell ${getGradeClass(s['exam'])}">${s['exam']}</td>
          <td class="grade-cell ${getGradeClass(s['average'])}">${s['average']}</td>
        </tr>
      `;
    }).join('');

    // Get all subjects that appear in either semester (for semester 2 table)
    const allSubjects = [...new Set([...Object.keys(gradesBySubjectTerm1), ...Object.keys(gradesBySubjectTerm2)])];
    const subjectsForSemester2 = subjectOrder.filter(subject => allSubjects.includes(subject));

    // Generate subject rows for Semester 2 Table (Periods 4, 5, 6) with yearly average
    const subjectRowsSemester2 = subjectsForSemester2.map(subject => {
      const s2 = gradesBySubjectTerm2[subject] || { 'p4': '', 'p5': '', 'p6': '', 'exam': '', 'average': '' };
      const yearlyAvg = calculateYearlyAverage(subject);
      
      return `
        <tr>
          <td class="subject-cell" style="text-align: left;">${subject}</td>
          <td class="grade-cell ${getGradeClass(s2['p4'])}">${s2['p4']}</td>
          <td class="grade-cell ${getGradeClass(s2['p5'])}">${s2['p5']}</td>
          <td class="grade-cell ${getGradeClass(s2['p6'])}">${s2['p6']}</td>
          <td class="grade-cell ${getGradeClass(s2['exam'])}">${s2['exam']}</td>
          <td class="grade-cell ${getGradeClass(s2['average'])}">${s2['average']}</td>
          <td class="grade-cell ${getGradeClass(yearlyAvg)}">${yearlyAvg}</td>
        </tr>
      `;
    }).join('');

    // Construct the combined HTML for both pages
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Student Report Card & Academic Performance</title>
  <style>
    /* Merged Styles from both files */
    @page {
      size: A4 landscape;
      margin: 10mm; /* Common margin for both pages */
    }

    body {
      font-family: Arial, sans-serif;
      font-size: 11pt; /* Adjusted for overall readability */
      margin: 0;
      padding: 0;
    }

    /* Styles primarily from original generatePDF.js for Page 1 layout */
    .landscape-container {
      display: flex;
      width: 100%;
      height: 100%; /* Ensures it takes full page height */
      box-sizing: border-box; /* Include padding/border in element's total width and height */
    }

    .left-half, .right-half {
      width: 50%;
      box-sizing: border-box;
      padding: 10mm;
      border: 1px solid #000;
    }

    .underline {
      border-bottom: 1px solid #000;
      padding: 0 10px;
    }

    .signatures-section {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
    }

    .signature-box {
      text-align: center;
    }

    .signature-line {
      border-bottom: 1px solid black;
      width: 100px;
      margin: 10px auto;
    }

    .seal-img {
      width: 50px;
      height: 50px;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      text-align: center;
    }

    .header-text {
      flex: 1;
      padding: 0 5px;
    }

    /* Table styles common to both, adjusted for merged use */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      table-layout: fixed; /* Important for fixed column widths */
    }

    th, td {
      border: 1px solid #000;
      text-align: center; /* Common alignment */
      padding: 4px;
      word-wrap: break-word; /* Ensure text wraps */
      font-size: 11px; /* Consistent font size for table content */
    }

    th {
      background-color: #f2f2f2;
      font-weight: bold;
    }

    .small-text {
      font-size: 10pt;
    }

    .checkbox {
      display: inline-block;
      width: 12px;
      height: 12px;
      margin-right: 6px;
      border: 1px solid #000;
      vertical-align: middle;
    }

    .checkbox.checked {
      background-color: black;
    }

    h3, h4 {
      margin: 5px 0;
    }

    /* Styles primarily from original AnnualPDF.js for Page 2 content */
    .container-annual { /* Renamed to avoid conflict with generatePDF.js's .container */
      width: 100%;
      display: flex;
      flex-direction: column;
      padding: 10mm; /* Apply margin as padding within the container */
      box-sizing: border-box;
      height: 100%; /* Ensures it takes full page height after break */
      font-size: 10pt; /* Adjusted for second page content to fit */
    }

    .container-annual h3,
    .container-annual h4,
    .container-annual p,
    .container-annual span {
      font-size: 10pt; /* Ensure all text within container-annual is smaller */
      line-height: 1.2; /* Slightly reduced line height for paragraphs */
    }

    .container-annual th,
    .container-annual td {
      font-size: 9.5px; /* Slightly smaller for table readability on condensed page */
      padding: 3px; /* Reduce padding in table cells */
    }


    h3.annual-header { /* Specific class for AnnualPDF's h3 */
      text-align: center;
      color: chocolate;
      margin-bottom: 4mm; /* Further reduced margin */
      margin-top: 0; /* Align to top of page */
    }

    .tables-wrapper {
      display: flex;
      justify-content: space-between;
      width: 100%;
      gap: 4mm; /* Further reduced gap between the two grade tables */
    }

    .tables-wrapper table {
      width: 49%; /* Each table takes roughly half the width */
    }

    .attendance-summary {
      display: flex;
      justify-content: space-between;
      gap: 5mm; /* Further reduced gap */
      margin-top: 5mm; /* Further reduced margin */
    }

    .attendance-box {
      border: 1px solid #ccc;
      padding: 6px; /* Reduced padding */
      width: 48%;
      border-radius: 5px;
      background-color: #f9f9f9;
    }

    .attendance-box p {
        margin: 1mm 0; /* Reduced margin for paragraphs inside attendance box */
    }

    .footer-annual { /* Renamed to avoid conflict */
      margin-top: 5mm; /* Further reduced margin */
      text-align: center;
    }

    .footer-annual .motto {
      margin-top: 1mm; /* Further reduced margin */
      font-weight: bold;
      color: #555;
    }

    .footer-annual > div { /* Target the yellow box */
        margin: 5mm 0; /* Reduced margin for the yellow box */
        padding: 5px; /* Reduced padding for the yellow box */
    }


    /* Grade specific colors - TEXT COLOR ONLY */
    .grade-cell.grade-a { color: #006600; font-weight: bold; }
    .grade-cell.grade-b { color: #0066cc; font-weight: bold; }
    .grade-cell.grade-c { color: #ff6600; font-weight: bold; }
    .grade-cell.grade-d { color: #cc0000; font-weight: bold; }
    .grade-cell.grade-f { color: #990000; font-weight: bold; background-color: #ffe6e6; }

    /* Page break to separate the two reports */
    .page-break {
      page-break-before: always;
      margin: 0;
      padding: 0;
      height: 0;
      border: none;
    }
  </style>
</head>
<body>
  <div class="landscape-container">
    <div class="left-half">
      <div class="promotion-statement">
        <h3 style="text-align:center; color:blue;">PROMOTION STATEMENT</h3>
        <p style="text-align: center; font-size: 12pt;">This certifies that:</p>
        <p style="text-align: center; font-size: 14pt; font-weight: bold;">
          <span class="underline"> ${student.lastName} ${student.firstName} ${student?.middleName || ''}</span>
        </p>

        <div>
          <span class="checkbox ${checkboxes.promoted ? 'checked' : ''}"></span>
          A. Eligible for Promotion to Grade
          <span class="underline">${checkboxes.promoted ? (student.promotedToGrade || parseInt(student.gradeLevel) + 1) : ''}</span>
        </div>

        <div>
          <span class="checkbox ${checkboxes.conditional ? 'checked' : ''}"></span>
          B. Conditional in Grade
          <span class="underline">${checkboxes.conditional ? student.gradeLevel : ''}</span>
          <div style="margin-left: 30px; font-size: 10pt; color: #666;">(And required to attend vacation enrichment program)</div>
        </div>

        <div><span class="checkbox ${checkboxes.repeat ? 'checked' : ''}"></span> C. Required to repeat the grade</div>
        <div><span class="checkbox ${checkboxes.notEnroll ? 'checked' : ''}"></span> D. Asked not to enroll next year</div>

        <div class="signatures-section">
          <div class="signature-box">
            <div class="signature-line"></div>
            <p><strong>REGISTRAR</strong></p>
            
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <p><strong>PRINCIPAL</strong></p>
         
          </div>
        </div>

        <p style="text-align: center; margin-top: 10mm;">
          Date: <span class="underline">________</span>
        </p>
        <p class="note"><strong>NOTE:</strong> Any erasure on this card makes it invalid</p>
      </div>
    </div>

    <div class="right-half" style="margin: 0; padding: 0; font-size: 11px; line-height: 1.2;">
      <div class="header" style="margin-bottom: 6px;">
        <div class="header-content" style="display: flex; justify-content: space-between; align-items: center;">
          <img src="data:image/png;base64,${logo1Base64}" class="seal-img" alt="Left Seal" style="height: 50px; width: 50px;">

          <div class="header-text" style="text-align: center; flex: 1; padding: 0 5px;">
            <h1 class="school-name" style="margin: 2px 0; font-size: 16px;">VOINJAMA MULTILATERAL HIGH SCHOOL</h1>
            <h4 class="ministry" style="margin: 2px 0;">VOINJAMA CITY, LOFA COUNTY</h4>
            <h4 class="ministry" style="margin: 2px 0;">REPUBLIC OF LIBERIA</h4>
            <p class="contact-info" style="margin: 2px 0;">📞 0776990187 / 0886962672</p>
            <h2 class="report-card-title" style="margin: 4px 0; font-size: 14px;">${reportTitle}</h2>
          </div>

          <img src="data:image/png;base64,${logo2Base64}" class="seal-img" alt="Right Seal" style="height: 50px; width: 50px;">
        </div>
      </div>

      <div class="semester-info" style="text-align: center; margin-bottom: 5px;">
        <h3 style="margin: 0; font-size: 12px;">
          Academic Year: <span>${grades[0]?.academicYear || '2024-2025'}</span> |
          
        </h3>
      </div>

      <div class="student-info" style="margin-bottom: 5px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div>
            <p style="margin: 2px 0;margin-left:10px;"><strong>Student:</strong> <span class="underline">${student.lastName} ${student.firstName} ${student?.middleName || ''}</span></p>
            <p style="margin: 2px 0;margin-left:10px;"><strong>Sex:</strong> <span class="underline">${student.gender || 'M'}</span></p>
            <p style="margin: 2px 0;margin-left:10px;"><strong>Date of Birth:</strong> <span class="underline">${student.dob ? new Date(student.dob).toLocaleDateString('en-US') : 'N/A'}</span></p>
          </div>
          <div>
            <p style="margin: 2px 0;margin-left:10px;"><strong>Grade:</strong> <span class="underline">${student.gradeLevel}</span></p>
            <p style="margin: 2px 0;margin-left:10px;"><strong>Registration #:</strong> <span class="underline">${student.admissionNumber}</span></p>
            <p style="margin: 2px 0;margin-left:10px;"><strong>Class:</strong> <span class="underline">${student.classSection || 'N/A'}</span></p>
          </div>
        </div>
      </div>

      <div class="parent-notice" style="margin-bottom: 5px;">
        <h3 style="margin-bottom: 2px; font-size: 12px;margin-left:10px;">PARENTS OR GUARDIANS NOTICE</h3>
        <p class="small-text" style="margin: 2px 0;margin-left:10px;"><strong>Grade Explanation:</strong> Grades shown on this report card represent the cumulative average of homework, classwork, participation, quizzes, projects, and tests for each academic subject.</p>
        <p class="small-text" style="margin: 2px 0;margin-left:10px;"><strong>Purpose:</strong> The grades are not meant for comparison with other children, but rather to encourage and help them strive for better performance.</p>
        <p class="small-text" style="margin: 2px 0;margin-left:10px;"><strong>Action Required:</strong> Parents and Guardians should give special attention to the grades and work with teachers to support their child's academic progress.</p>
      </div>

      <div>
        <h3 style="text-align: center; color: rgb(32, 32, 204); margin: 4mm 0 2mm; font-size: 13px;">The Ministry of Education</h3>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr>
              <th style="width: 20%; border: 1px solid #000; padding: 4px;">REPORTING PERIOD</th>
              <th style="width: 40%; border: 1px solid #000; padding: 4px;">PARENT/GUARDIAN SIGNATURE</th>
              <th style="width: 40%; border: 1px solid #000; padding: 4px;">CLASS SPONSOR SIGNATURE</th>
            </tr>
          </thead>
          <tbody>
            ${[1,2,3,4,5,6].map(period => `
              <tr>
                <td style="border: 1px solid #000; padding: 4px;"><strong>${period}st Period</strong></td>
                <td style="border: 1px solid #000; padding: 4px; height: 20px;"></td>
                <td style="border: 1px solid #000; padding: 4px;"></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h4 style="text-align: center; color: #28a745; font-style: italic; margin-top: 3mm;">
          "Accelerated Education for Accelerated Development"
        </h4>
      </div>
    </div>
  </div>


  <div class="page-break"></div>

  <div class="container-annual">
    <h3 class="annual-header" style="text-align:center;">ACADEMIC PERFORMANCE</h3>

    <div class="tables-wrapper">
      <table>
        <thead>
          <tr>
            <th style="width: 25%;">SUBJECTS</th>
            <th style="width: 12%;">1st Period</th>
            <th style="width: 12%;">2nd Period</th>
            <th style="12%;">3rd Period</th>
            <th style="width: 14%;">Semester Exam</th>
            <th style="width: 15%;">Semester Average</th>
           
          </tr>
        </thead>
        <tbody>
          ${subjectRowsSemester1}
        </tbody>
      </table>

      <table>
        <thead>
          <tr>
            <th style="width: 22%;">SUBJECTS</th>
            <th style="width: 11%;">4th Period</th>
            <th style="width: 11%;">5th Period</th>
            <th style="width: 11%;">6th Period</th>
            <th style="width: 12%;">Semester Exam</th>
            <th style="width: 13%;">Semester Average</th>
            <th style="width: 13%;">Yearly Average</th>
          </tr>
        </thead>
        <tbody>
          ${subjectRowsSemester2}
          <tr>
            <td style="text-align: left;" colspan="6"><strong>Overall Average</strong></td>
            <td class="grade-cell ${getOverallGradeClass(overallAverage)}">${overallAverage}%</td>
          </tr>
        </tbody>
      </table>
    </div>

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

    <div class="footer-annual">
      <div style="background-color: #fff3cd; padding: 5px; border-radius: 5px; margin: 5mm 0;">
        <p class="small-text" style="color: #856404; font-weight: bold;text-align:center; ">
          ANY GRADE BELOW 70% IS A FAILING GRADE
        </p>
      </div>
      <p class="motto" style="margin-top: 1mm;text-align:center;">MOTTO: STRIVING FOR POSTERITY</p>
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
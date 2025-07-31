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
<html>
<head>
  <title>VMHS Report Card</title>
  <style>
    body {
      font-family: 'Times New Roman', Times, serif;
      margin: 15mm;
      font-size: 11pt;
      line-height: 1.4;
      color: #333;
      position: relative;
    }

    /* Updated watermark styles to use logo1 image */
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-35deg);
      z-index: 0;
      pointer-events: none;
      user-select: none;
      opacity: 0.15;
    }

    .watermark img {
      width: 400px;
      height: auto;
      opacity: 0.3;
      filter: grayscale(50%);
    }

    /* Additional watermark images for better coverage */
    .watermark::before {
      content: '';
      position: absolute;
      top: -200px;
      left: -100px;
      width: 300px;
      height: 300px;
      background-image: url('data:image/png;base64,${logo1Base64}');
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      opacity: 0.2;
      transform: rotate(20deg);
    }

    .watermark::after {
      content: '';
      position: absolute;
      top: 200px;
      left: 100px;
      width: 300px;
      height: 300px;
      background-image: url('data:image/png;base64,${logo1Base64}');
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      opacity: 0.2;
      transform: rotate(-20deg);
    }

    .container {
      width: 100%;
      max-width: 210mm;
      margin: 0 auto;
      position: relative;
      z-index: 1;
      background: transparent;
    }

    .header, .footer {
      text-align: center;
      margin-bottom: 12mm;
    }

    .school-name {
      font-size: 20pt;
      font-weight: bold;
      color: chocolate;
      margin: 5px 0;
    }

    .ministry {
      font-size: 11pt;
      color: #555;
      margin: 2px 0;
    }

    .contact-info {
      font-size: 9pt;
      color: #666;
      margin: 3px 0;
    }

    .report-card-title {
      font-size: 16pt;
      font-weight: bold;
      margin: 8mm 0;
      color: rgb(18, 211, 147);
      text-align: center;
      text-decoration: underline;
      text-transform: uppercase;
    }

    .seal-img {
      max-width: 85px;
      height: auto;
    }

    .promotion-statement, .student-info, .parent-notice, 
    .grades-table, .summary-table, .signatures-table {
      margin-bottom: 12mm;
      clear: both;
      position: relative;
      background: rgba(255, 255, 255, 0.9);
    }

    .promotion-statement {
      background-color: rgba(249, 249, 249, 0.95);
      padding: 15px;
      border: 2px solid #ddd;
      border-radius: 8px;
    }

    .promotion-statement h3 {
      color: rgba(70, 119, 224, 0.918);
      text-align: center;
      margin-top: 0;
      font-size: 14pt;
    }

    .promotion-options {
      margin: 10mm 0;
    }

    .promotion-options div {
      margin: 5px 0;
      display: flex;
      align-items: center;
    }

    .student-info {
      background-color: rgba(245, 248, 255, 0.95);
      padding: 12px;
      border-left: 4px solid chocolate;
    }

    .student-info p {
      margin: 5px 0;
      font-weight: 500;
    }

    .parent-notice {
      background-color: rgba(255, 248, 240, 0.95);
      padding: 12px;
      border: 1px solid #e6d3b7;
      border-radius: 5px;
    }

    .parent-notice h3 {
      color: #8b4513;
      margin-top: 0;
    }

    .underline {
      border-bottom: 1.5px solid #000;
      display: inline-block;
      min-width: 120px;
      text-align: center;
      padding: 2px 8px;
      font-weight: 600;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8mm 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      position: relative;
      background: rgba(255, 255, 255, 0.95);
    }

    table, th, td {
      border: 1px solid #333;
    }

    th {
      background: linear-gradient(135deg, #4a90e2, #357abd);
      color: white;
      padding: 10px 8px;
      text-align: center;
      font-weight: bold;
      font-size: 10pt;
    }

    td {
      padding: 8px;
      text-align: center;
      background: rgba(255, 255, 255, 0.9);
    }

    .subject-cell {
      text-align: left !important;
      font-weight: bold;
      background-color: rgba(240, 244, 248, 0.95) !important;
      color: #2c3e50;
    }

    .grade-cell {
      font-weight: bold;
      font-size: 11pt;
    }

    .grade-a { background-color: rgba(212, 237, 218, 0.9) !important; color: #155724; }
    .grade-b { background-color: rgba(255, 243, 205, 0.9) !important; color: #856404; }
    .grade-c { background-color: rgba(255, 234, 167, 0.9) !important; color: #6c5ce7; }
    .grade-d { background-color: rgba(250, 177, 160, 0.9) !important; color: #e17055; }
    .grade-f { background-color: rgba(253, 203, 110, 0.9) !important; color: #e84393; }

    .summary-table {
      background-color: rgba(248, 249, 250, 0.95);
      border-radius: 5px;
      overflow: hidden;
    }

    .summary-table th {
      background: linear-gradient(135deg, #28a745, #20c997);
    }

    .small-text {
      font-size: 9pt;
      line-height: 1.3;
    }

    .motto {
      font-size: 12pt;
      font-weight: bold;
      margin-top: 15mm;
      color: #dc3545;
      text-transform: uppercase;
    }

    .note {
      font-size: 9pt;
      font-style: italic;
      margin-top: 8mm;
      color: #666;
      text-align: center;
    }

    .checkbox {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 2px solid #333;
      margin-right: 8px;
      vertical-align: middle;
      position: relative;
    }

    .checkbox.checked::after {
      content: '✓';
      position: absolute;
      top: -2px;
      left: 1px;
      font-size: 10pt;
      font-weight: bold;
      color: #28a745;
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 5mm;
    }

    .header-text {
      flex: 1;
      text-align: center;
    }

    .page-break {
      page-break-before: always;
    }

    .signatures-section {
      display: flex;
      justify-content: space-between;
      margin-top: 15mm;
    }

    .signature-box {
      text-align: center;
      flex: 1;
      margin: 0 10px;
    }

    .signature-line {
      border-bottom: 2px solid #333;
      width: 150px;
      margin: 0 auto 5px;
      height: 25px;
    }

    .grading-scale {
      background-color: rgba(232, 244, 253, 0.95);
      padding: 10px;
      margin: 8mm 0;
      border-radius: 5px;
      font-size: 9pt;
    }

    .attendance-summary {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin: 8mm 0;
    }

    .attendance-box {
      background-color: rgba(248, 249, 250, 0.95);
      padding: 10px;
      border-radius: 5px;
      text-align: center;
      border: 1px solid #dee2e6;
    }

    .semester-info {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 10px;
      text-align: center;
      border-radius: 5px;
      margin-bottom: 10mm;
    }

    @media print {
      body { margin: 10mm; }
      .watermark { 
        opacity: 0.1 !important;
      }
      .watermark img {
        opacity: 0.2 !important;
      }
      .watermark::before,
      .watermark::after {
        opacity: 0.15 !important;
      }
      .container { max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="watermark">
    <img src="data:image/png;base64,${logo1Base64}" alt="Watermark Logo">
  </div>
  
  <div class="container">
    <!-- Page 1: Promotion Statement -->
    <div class="promotion-statement">
      <h3>PROMOTION STATEMENT</h3>
      <p style="text-align: center; font-size: 12pt;">This certifies that:</p>
      <p style="text-align: center; font-size: 14pt; font-weight: bold;">
        <span class="underline">${student.firstName} ${student.lastName}</span>
      </p>
      
     <div>
  <span class="checkbox ${checkboxes.promoted}"></span> 
  A. Eligible for Promotion to Grade 
  <span class="underline">${checkboxes.promoted ? (student.promotedToGrade || parseInt(student.gradeLevel) + 1) : ''}</span>
</div>

<div>
  <span class="checkbox ${checkboxes.conditional}"></span> 
  B. Conditional in Grade 
  <span class="underline">${checkboxes.conditional ? student.gradeLevel : ''}</span>
  <div style="margin-left: 30px; font-size: 10pt; color: #666;">(And required to attend vacation enrichment program)</div>
</div>

<div><span class="checkbox ${checkboxes.repeat}"></span> C. Required to repeat the grade</div>
<div><span class="checkbox ${checkboxes.notEnroll}"></span> D. Asked not to enroll next year</div>


      <div class="signatures-section">
        <div class="signature-box">
          <div class="signature-line"></div>
          <p><strong>REGISTRAR</strong></p>
          <p class="small-text">Name & Signature</p>
        </div>
        <div class="signature-box">
          <div class="signature-line"></div>
          <p><strong>PRINCIPAL</strong></p>
          <p class="small-text">Name & Signature</p>
        </div>
      </div>
      
      <p style="text-align: center; margin-top: 10mm;">
        Date: <span class="underline">${new Date().toLocaleDateString()}</span>
      </p>
      <p class="note"><strong>NOTE:</strong> Any erasure on this card makes it invalid</p>
    </div>

    <!-- Page 2: Header, Student Info, Parent Notice -->
    <div class="page-break"></div>
    
    <div class="header">
      <div class="header-content">
        <img src="data:image/png;base64,${logo1Base64}" class="seal-img" alt="Left Seal">
        <div class="header-text">
          <h1 class="school-name">VOINJAMA MULTILATERAL HIGH SCHOOL</h1>
          <h4 class="ministry">VOINJAMA CITY, LOFA COUNTY</h4>
          <h4 class="ministry">REPUBLIC OF LIBERIA</h4>
          <p class="contact-info">📞 0776990187 / 0886962672</p>
          <h2 class="report-card-title">${reportTitle}</h2>
        </div>
        <img src="data:image/png;base64,${logo2Base64}" class="seal-img" alt="Right Seal">
      </div>
    </div>

    <div class="semester-info">
      <h3 style="margin: 0;">Academic Year: <span>${grades[0]?.academicYear || '2024-2025'}</span> | Semester: <span>${grades[0]?.term === '1' ? '1st' : '2nd'}</span></h3>
    </div>

    <div class="student-info">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div>
          <p><strong>Student:</strong> <span class="underline">${student.firstName} ${student.lastName}</span></p>
          <p><strong>Sex:</strong> <span class="underline">${student.gender || 'M'}</span></p>
         <p><strong>Date of Birth:</strong> <span class="underline">${student.dob ? new Date(student.dob).toLocaleDateString('en-US') : 'N/A'}</span></p>
        </div>
        <div>
          <p><strong>Grade:</strong> <span class="underline">${student.gradeLevel}</span></p>
          <p><strong>Registration #:</strong> <span class="underline">${student.admissionNumber}</span></p>
          <p><strong>Class:</strong> <span class="underline">${student.classSection || 'N/A'}</span></p>
        </div>
      </div>
    </div>

    <div class="parent-notice">
      <h3>PARENTS OR GUARDIANS NOTICE</h3>
      <p class="small-text"><strong>Grade Explanation:</strong> Grades shown on this report card represent the cumulative average of homework, classwork, participation, quizzes, projects, and tests for each academic subject.</p>
      <p class="small-text"><strong>Purpose:</strong> The grades are not meant for comparison with other children, but rather to encourage and help them strive for better performance.</p>
      <p class="small-text"><strong>Action Required:</strong> Parents and Guardians should give special attention to the grades and work with teachers to support their child's academic progress.</p>
    </div>

    <div class="grading-scale">
      <h4 style="margin: 0 0 8px 0; text-align: center; color: #2c3e50;">GRADING SCALE</h4>
      <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; text-align: center;">
        <div><strong>A:</strong> 90-100% (Excellent)</div>
        <div><strong>B:</strong> 80-89% (Good)</div>
        <div><strong>C:</strong> 70-79% (Satisfactory)</div>
        <div><strong>D:</strong> 60-69% (Below Average)</div>
        <div><strong>F:</strong> Below 60% (Failing)</div>
      </div>
    </div>
     <div class="page-break"></div>

      <div>
        <h3 style="text-align: center; color: rgb(32, 32, 204); margin: 8mm 0;">The Ministry of Education</h3>

        <table style="margin-bottom: 8mm;">
          <thead>
            <tr>
              <th style="width: 20%;">REPORTING PERIOD</th>
              <th style="width: 40%;">PARENT/GUARDIAN SIGNATURE</th>
              <th style="width: 40%;">CLASS SPONSOR SIGNATURE</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><strong>1st Period</strong></td><td style="height: 30px;"></td><td style="height: 30px;"></td></tr>
            <tr><td><strong>2nd Period</strong></td><td style="height: 30px;"></td><td style="height: 30px;"></td></tr>
            <tr><td><strong>3rd Period</strong></td><td style="height: 30px;"></td><td style="height: 30px;"></td></tr>
            <tr><td><strong>4th Period</strong></td><td style="height: 30px;"></td><td style="height: 30px;"></td></tr>
            <tr><td><strong>5th Period</strong></td><td style="height: 30px;"></td><td style="height: 30px;"></td></tr>
            <tr><td><strong>6th Period</strong></td><td style="height: 30px;"></td><td style="height: 30px;"></td></tr>
          </tbody>
        </table>

        <h4 style="text-align: center; color: #28a745; font-style: italic;">
          "Accelerated Education for Accelerated Development"
        </h4>
      </div>


    <!-- Page 3: Subject Grades & Summary -->
    <div class="page-break"></div>
    
    <h3 style="text-align: center; color: chocolate; margin-bottom: 8mm;">ACADEMIC PERFORMANCE</h3>
    
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
        ${subjectRows}
      </tbody>
    </table>

    <div class="summary-table">
      <table>
        <thead>
          <tr>
            <th colspan="2" style="background: linear-gradient(135deg, #28a745, #20c997);">ACADEMIC SUMMARY</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="subject-cell" style="width: 60%;">Overall Average</td>
            <td class="grade-cell ${getOverallGradeClass(overallAverage)}">${overallAverage}%</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="attendance-summary">
      <div class="attendance-box">
        <h4 style="margin: 0 0 8px 0; color: #28a745;">ATTENDANCE</h4>
        <p><strong>Days Present:</strong> <span>${totalDaysPresent}</span></p>
        <p><strong>Days Absent:</strong> <span>${totalDaysAbsent}</span></p>
        <p><strong>Times Tardy:</strong> <span>${totalTimesTardy}</span></p>
        <p><strong>Attendance Rate:</strong> <span>${attendanceRate}%</span></p>
      </div>
      <div class="attendance-box">
        <h4 style="margin: 0 0 8px 0; color: #17a2b8;">BEHAVIOR</h4>
        <p><strong>Conduct:</strong> <span>${mostRecentConduct}</span></p>
        
      </div>
    </div>

    <div class="footer">
      <div style="background-color: #fff3cd; padding: 10px; border-radius: 5px; margin: 10mm 0;">
        <p class="small-text" style="text-align: center; color: #856404; font-weight: bold; margin: 0;">
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
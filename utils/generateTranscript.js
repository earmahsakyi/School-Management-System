const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const generateTranscriptPdf = async (student, grades) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const logo1Base64 = fs.readFileSync(path.join(__dirname, '../logo1.png'), 'base64');
    const logo2Base64 = fs.readFileSync(path.join(__dirname, '../logo2.png'), 'base64');
    const page = await browser.newPage();

    // Grade classification function (copied from generatePDF.js)
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

    // Group grades by grade level and subject
    const gradeMap = {}; // gradeLevel -> subject -> semesterAverage
    const allSubjects = new Set();
    const gradeLevelsSet = new Set();

    grades.forEach(g => {
      const level = g.gradeLevel;
      gradeLevelsSet.add(level);
      if (!gradeMap[level]) gradeMap[level] = {};

      g.subjects.forEach(sub => {
        gradeMap[level][sub.subject] = sub.semesterAverage ?? '';
        allSubjects.add(sub.subject);
      });
    });

    const gradeLevels = Array.from(gradeLevelsSet).sort((a, b) => a - b);
    const subjectList = Array.from(allSubjects);

    // Build transcript table headers and rows with grade colors
    const headerCols = gradeLevels.map(lvl => `<th>${lvl}th Grade</th>`).join('');
    const subjectRows = subjectList.map(subject => {
      const scores = gradeLevels.map(lvl => {
        const val = gradeMap[lvl]?.[subject] ?? '';
        return `<td class="grade-cell ${getGradeClass(val)}">${val}</td>`;
      }).join('');
      return `<tr><td class="subject-cell">${subject}</td>${scores}</tr>`;
    }).join('');

    // Extract details
    const fromYear = grades[0].academicYear.split('-')[0];
    const toYear = grades[grades.length - 1].academicYear.split('-')[1] || grades[grades.length - 1].academicYear.split('-')[0];
    const mostRecentConduct = grades.at(-1).conduct ?? 'Good';
    const promotedToGrade = student.promotedToGrade || '';
    const repeatGrade = parseInt(student.gradeLevel) || '';

    const htmlContent = 
    `<!DOCTYPE html>
<html>
<head>
<style>
body {
      font-family: 'Times New Roman', Times, serif;
      margin: 20mm;
      font-size: 11pt;
      color: #333;
      position: relative;
      line-height: 1.4;
    }
    
    .watermark {
      position: fixed;
      top: 45%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 48pt;
      color: rgba(200, 200, 200, 0.3);
      z-index: 0;
      white-space: nowrap;
    }
    
    .container {
      position: relative;
      z-index: 1;
      max-width: 210mm;
      margin: 0 auto;
    }
    
    .header {
      text-align: center;
      margin-bottom: 15mm;
    }
    
    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10mm;
    }
    
    .header-text {
      text-align: center;
      flex: 1;
    }
    
    .school-name {
      font-size: 18pt;
      font-weight: bold;
      color: maroon;
      margin: 5px 0;
    }
    
    .school-location {
      font-size: 12pt;
      margin: 3px 0;
    }
    
    .country {
      font-size: 12pt;
      font-weight: bold;
      margin: 3px 0;
    }
    
    .contact {
      font-size: 10pt;
      color: #666;
      margin: 3px 0;
    }
    
    .document-title {
      font-size: 16pt;
      font-weight: bold;
      text-decoration: underline;
      color: teal;
      margin: 10mm 0 5mm 0;
    }
    
    .transcript-title {
      font-size: 14pt;
      font-weight: bold;
      color: rgb(18, 211, 147);
      margin: 5mm 0;
    }
    
    .seal-img {
      max-width: 80px;
      height: auto;
    }
    
    .student-info {
      margin: 15mm 0;
    }
    
    .student-info p {
      margin: 8px 0;
      font-size: 11pt;
    }
    
    .underline {
      border-bottom: 1px solid #000;
      display: inline-block;
      min-width: 150px;
      text-align: center;
      padding: 2px 5px;
    }
    
    .date-section {
      text-align: right;
      margin-bottom: 10mm;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10mm 0;
    }
    
    th, td {
      border: 1px solid #000;
      padding: 8px;
      text-align: center;
      font-size: 10pt;
    }
    
    .subject-cell {
      text-align: left;
      font-weight: bold;
      background-color: #f5f5f5;
    }
    
    th {
      background-color: #e0e0e0;
      font-weight: bold;
    }

    /* Grade specific colors - TEXT COLOR ONLY (copied from generatePDF.js) */
    .grade-cell.grade-a { color: #0066cc; font-weight: bold; }
    .grade-cell.grade-b { color: #0066cc; font-weight: bold; }
    .grade-cell.grade-c { color:#0066cc ; font-weight: bold; }
    .grade-cell.grade-d { color: #cc0000; font-weight: bold; }
    .grade-cell.grade-f { color: #990000; font-weight: bold; background-color: #ffe6e6; }
    
    .signatures {
      margin-top: 20mm;
      display: flex;
      justify-content: space-around;
    }
    
    .signatures p {
      text-align: center;
      margin: 0;
    }
    
    .signature-line {
      display: inline-block;
      border-bottom: 2px solid #000;
      width: 200px;
      margin-bottom: 5px;
    }
    
    .footer {
      text-align: center;
      margin-top: 15mm;
    }
    
    .motto {
      font-size: 12pt;
      font-weight: bold;
      color: red;
    }
    
    .transfer-section {
      background-color: #f9f9f9;
      padding: 10px;
      border: 1px solid #ddd;
      margin: 10mm 0;
    }
    
    .transfer-section h3 {
      color: teal;
      margin-top: 0;
    }
    
    @media print {
      body {
        margin: 15mm;
      }
      
      .container {
        max-width: 100%;
      }
      
      .watermark {
        opacity: 0.2;
      }
    }
</style>
</head>
<body>
  <div class="watermark">VMHS TRANSCRIPT</div>
  <div class="container">
    <div class="header">
      <div class="header-content">
        <img src="data:image/png;base64,${logo1Base64}" class="seal-img" alt="Left Seal" />
        <div class="header-text">
          <h1 class="school-name">VOINJAMA MULTILATERAL HIGH SCHOOL</h1>
          <p class="school-location">VOINJAMA CITY, LOFA COUNTY</p>
          <p class="country">REPUBLIC OF LIBERIA</p>
          <p class="contact">0776990187 / 0886962672</p>
        </div>
        <img src="data:image/png;base64,${logo2Base64}" class="seal-img" alt="Right Seal" />
      </div>
      <h2 class="document-title">
        ${student.promotionStatus === 'Graduated' ? 'GRADUATION CERTIFICATE AND TRANSCRIPT' : 'CERTIFICATION OF TRANSFER AND ACADEMIC TRANSCRIPT'}
      </h2>
    </div>

    <div class="date-section">
      <p>Date: <span class="underline">${new Date().toLocaleDateString()}</span></p>
    </div>

    <div class="student-info">
      <p><strong>Name of Student:</strong> <span class="underline"> ${student.lastName}, ${student.firstName} ${student?.middleName || ''}</span></p>
      <p><strong>Admission Number:</strong> <span class="underline">${student.admissionNumber}</span></p>
      <p><strong>Grade Last Attended:</strong> <span class="underline">${student.gradeLevel}</span></p>
      <p><strong>Year(s) Attended:</strong> <span class="underline">${fromYear} – ${toYear}</span></p>
    </div>

    <div class="transfer-section">
      <h3>Transfer Information</h3>
      <p><strong>Reason(s) for Transfer:</strong> <span class="underline" style="min-width: 300px;"></span></p>
      <p><strong>School Transferring To:</strong> <span class="underline" style="min-width: 300px;"></span></p>
      ${
        student.promotionStatus === 'Graduated' ? 
        `<p><strong>Status:</strong> <span class="underline">Graduated</span></p>` :
        student.promotionStatus === 'Promoted' || student.promotionStatus === 'Conditional Promotion' ?
        `<p><strong>Promoted to Grade:</strong> <span class="underline">${promotedToGrade}</span></p>` :
        student.promotionStatus === 'Not Promoted' ?
        `<p><strong>Required to Repeat Grade:</strong> <span class="underline">${repeatGrade}</span></p>` :
        `<p><strong>Status:</strong> <span class="underline">Asked Not to Enroll</span></p>`
      }
      <div style="margin-top: 10px;">
        <p><strong>Remarks:</strong></p>
        <p>1. <strong>Conduct:</strong> <span class="underline">${mostRecentConduct}</span></p>
        <p>2. <strong>Academic Performance:</strong> <span class="underline">See Academic Transcript Below</span></p>
      </div>
    </div>
    <div style="page-break-before: always;"></div>
    <h3 class="transcript-title" style="text-align: center;">ACADEMIC TRANSCRIPT</h3>
    <table>
      <thead>
        <tr>
          <th class="subject-cell">SUBJECTS</th>
          ${headerCols}
        </tr>
      </thead>
      <tbody>
        ${subjectRows}
      </tbody>
    </table>

    <div class="signatures">
      <div>
        <div class="signature-line"></div>
        <p><strong>REGISTRAR</strong></p>
        <p style="font-size: 9pt;">Name & Signature</p>
      </div>
      <div>
        <div class="signature-line"></div>
        <p><strong>PRINCIPAL</strong></p>
        <p style="font-size: 9pt;">Name & Signature</p>
      </div>
    </div>

    <div class="footer">
      <p class="motto">MOTTO: STRIVING FOR POSTERITY</p>
    </div>
    ${student.promotionStatus === 'Graduated' ? `
      <p style="font-size: 11pt; text-align: center; margin-top: 10mm;">
        This certifies that the student has fulfilled all academic requirements for graduation from Voinjama Multilateral High School.
      </p>
    ` : ''}
  </div>
</body>
</html>`;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
    });

    await browser.close();
    return pdfBuffer;
  } catch (error) {
    console.error('Transcript PDF generation failed:', error);
    await browser.close();
    throw error;
  }
};

module.exports = generateTranscriptPdf;
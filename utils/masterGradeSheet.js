const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const generateMasterGradeSheetPdf = async ({ students, gradeLevel, classSection, subject, academicYear, department }) => {
  const logo1Base64 = fs.readFileSync(path.join(__dirname, '../logo1.png')).toString('base64');
  const logo2Base64 = fs.readFileSync(path.join(__dirname, '../logo2.png')).toString('base64');

  const studentRows = students.map((student, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${student.lastName}</td>
      <td>${student.firstName}</td>
      <td>${student.middleName || ''}</td>
      <td>${student.gender}</td>
      <td>${student.admissionNumber}</td>
      <td>${student.department || 'N/A'}</td>
      <td></td><td></td><td></td><td></td><td></td>
      <td></td><td></td><td></td><td></td><td></td>
      <td></td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <title>Master Grade Sheet</title>
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
      .seal-img {
        max-width: 80px;
        height: auto;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 10mm 0;
      }
      th, td {
        border: 1px solid #000;
        padding: 5px;
        text-align: center;
        font-size: 10pt;
      }
      .underline {
        border-bottom: 1px solid #000;
        display: inline-block;
        min-width: 150px;
        text-align: center;
        padding: 2px 5px;
      }
    </style>
</head>
<body>
  <div class="watermark">VMHS GradeSheet</div>
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
      <h2 style="text-align: center;">MASTER GRADE SHEET</h2>
      <p style="text-align: center;"><strong>For Academic Year:</strong> <span class="underline">${academicYear || ''}</span></p>
      <p><strong>Grade:</strong> <span class="underline">${gradeLevel}</span> <strong>Class Section:</strong> <span class="underline">${classSection}</span> <strong>Department:</strong> <span class="underline">${department}</span></p>
      <p><strong>Subject:</strong> <span class="underline">${subject}</span> <strong>Instructor:</strong> <span class="underline"></span></p>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Last Name</th>
          <th>First Name</th>
          <th>Middle Name</th>
          <th>Sex</th>
          <th>ID#</th>
          <th>Department</th>
          <th>1st</th>
          <th>2nd</th>
          <th>3rd</th>
          <th>Exam</th>
          <th>Avg</th>
          <th>4th</th>
          <th>5th</th>
          <th>6th</th>
          <th>Exam</th>
          <th>Avg</th>
          <th>Yr Avg</th>
        </tr>
      </thead>
      <tbody>
        ${studentRows}
      </tbody>
    </table>
  </div>
</body>
</html>`;

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', bottom: '20mm', left: '10mm', right: '10mm' }
  });

  await browser.close();
  return pdfBuffer;
};

module.exports = generateMasterGradeSheetPdf;
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const generateRoosterSummaryPdf = async ({ summaryData, academicYear }) => {
  // Reading logo images
  const logo1Base64 = fs.readFileSync(path.join(__dirname, '../logo1.png')).toString('base64');
  const logo2Base64 = fs.readFileSync(path.join(__dirname, '../logo2.png')).toString('base64');

  // Generating table rows for each grade group
  const generateTable = (rows, subtotal, startIndex) => {
    let index = startIndex;
    const tableRows = rows.map(row => `
      <tr>
        <td>${index++}</td>
        <td>${row.className}</td>
        <td>${row.male}</td>
        <td>${row.female}</td>
        <td>${row.total}</td>
      </tr>
    `).join('');

    const subtotalRow = subtotal ? `
      <tr style="font-weight: bold;">
        <td></td>
        <td>SUB-TOTAL</td>
        <td>${subtotal.male}</td>
        <td>${subtotal.female}</td>
        <td>${subtotal.total}</td>
      </tr>
    ` : '';

    return { html: tableRows + subtotalRow, nextIndex: index };
  };

  let currentIndex = 1;
  const gradeTables = summaryData.gradeGroups.map(group => {
    const { html, nextIndex } = generateTable(group.rows, group.subtotal, currentIndex);
    currentIndex = nextIndex;
    return `
      <div class="section-title">${group.name}</div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Class</th>
            <th>Male</th>
            <th>Female</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${html}
        </tbody>
      </table>
    `;
  }).join('');

  // Generating HTML for the PDF
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <title>Student Rooster Summary Report</title>
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
        color: chocolate;
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
      .section-title {
        font-size: 12pt;
        font-weight: bold;
        margin: 10px 0;
      }
    </style>
</head>
<body>
  <div class="watermark">VMHS Rooster Summary</div>
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
      <h2 style="text-align: center;">STUDENT ROOSTER SUMMARY REPORT</h2>
      <p style="text-align: center;"><strong>For Academic Year:</strong> <span class="underline">${academicYear}</span></p>
    </div>

    ${gradeTables}

    <div class="section-title">Junior High Total</div>
    <table>
      <tbody>
        <tr style="font-weight: bold;">
          <td></td>
          <td>JUNIOR HIGH TOTAL</td>
          <td>${summaryData.juniorHighTotal.male}</td>
          <td>${summaryData.juniorHighTotal.female}</td>
          <td>${summaryData.juniorHighTotal.total}</td>
        </tr>
      </tbody>
    </table>

    <div class="section-title">Senior High Total</div>
    <table>
      <tbody>
        <tr style="font-weight: bold;">
          <td></td>
          <td>SENIOR HIGH TOTAL</td>
          <td>${summaryData.seniorHighTotal.male}</td>
          <td>${summaryData.seniorHighTotal.female}</td>
          <td>${summaryData.seniorHighTotal.total}</td>
        </tr>
      </tbody>
    </table>

    <div class="section-title">Total Enrollment</div>
    <table>
      <tbody>
        <tr style="font-weight: bold;">
          <td></td>
          <td>TOTAL ALL ENROLLMENT ${academicYear}</td>
          <td>${summaryData.totalEnrollment.male}</td>
          <td>${summaryData.totalEnrollment.female}</td>
          <td>${summaryData.totalEnrollment.total}</td>
        </tr>
      </tbody>
    </table>
  </div>
</body>
</html>`;

  // Launching Puppeteer and generating PDF
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

module.exports = generateRoosterSummaryPdf;
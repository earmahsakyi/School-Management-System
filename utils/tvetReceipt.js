const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const generateReceiptPdf = async (tvet) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const logo1Base64 = fs.readFileSync(path.join(__dirname, '../logo1.png')).toString('base64');
    const logo2Base64 = fs.readFileSync(path.join(__dirname, '../logo2.png')).toString('base64');
    const page = await browser.newPage();

    const breakdownRows = tvet.breakdown.map(item => `
      <tr>
        <td>${item.description}</td>
        <td>$${item.amount.toFixed(2)}</td>
      </tr>
    `).join('');

    const htmlContent = `
<!DOCTYPE html>
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

  .document-title {
    font-size: 16pt;
    font-weight: bold;
    text-decoration: underline;
    color: teal;
    margin: 10mm 0 5mm 0;
  }

  .seal-img {
    max-width: 80px;
    height: auto;
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
    margin-top: 10mm;
  }

  th, td {
    border: 1px solid #000;
    padding: 6px;
    text-align: left;
  }

  .installments {
    margin-top: 10mm;
  }

  .signatures {
    margin-top: 20mm;
    text-align: left;
  }

  @media print {
    .watermark { opacity: 0.2; }
  }
</style>
</head>
<body>
  <div class="watermark">VMHS Receipt</div>
  <div class="container">
    <div class="header">
      <div class="header-content">
        <img src="data:image/png;base64,${logo1Base64}" class="seal-img" />
        <div class="header-text">
          <h1 class="school-name">VOINJAMA MULTILATERAL HIGH SCHOOL</h1>
          <p class="school-location">VOINJAMA CITY, LOFA COUNTY</p>
          <p class="country">REPUBLIC OF LIBERIA</p>
          <p class="contact">0776990187 / 0886962672</p>
        </div>
        <img src="data:image/png;base64,${logo2Base64}" class="seal-img" />
      </div>
      <h2 class="document-title">Receipt of Payment</h2>
    </div>

    <div class="date-section">
      <p>Date: <span class="underline">${new Date(tvet.dateOfPayment).toLocaleDateString()}</span></p>
    </div>

    <div>
      <p><strong>Receipt No:</strong> <span class="underline">${tvet.receiptNumber}</span>
      <strong>Deposit No:</strong> <span class="underline">${tvet.depositNumber}</span>
      </p>
      <p><strong>Student ID:</strong> <span class="underline">${tvet.studentID}</span>
      <strong>Student Name:</strong> <span class="underline">${tvet.studentName}</span>
      </p>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Amount ($)</th>
        </tr>
      </thead>
      <tbody>
        ${breakdownRows}
      </tbody>
    </table>

    <div class="installments">
      <p><strong>1st Installment:</strong> $${tvet.firstInstallment.toFixed(2)}</p>
      <p><strong>2nd Installment:</strong> $${tvet.secondInstallment.toFixed(2)}</p>
      <p><strong>3rd Installment:</strong> $${tvet.thirdInstallment.toFixed(2)}</p>
      <p><strong>Total Paid:</strong> $${tvet.totalPaid.toFixed(2)}</p>
    </div>

    <div class="signatures">
      <p><strong>Signed:</strong> ___________________________</p>
      <p style="margin-left:100px"><strong>Business Manager</strong></p>
    </div>
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
    console.error('Receipt PDF generation failed:', error);
    await browser.close();
    throw error;
  }
};

module.exports = generateReceiptPdf;

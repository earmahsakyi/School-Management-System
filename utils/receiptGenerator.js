const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const generateReceiptPdf = async ({ student, payment }) => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    
      try{
  const logo1Base64 = fs.readFileSync(path.join(__dirname, '../logo1.png')).toString('base64');
  const logo2Base64 = fs.readFileSync(path.join(__dirname, '../logo2.png')).toString('base64');
  const page = await browser.newPage();


  const htmlContent = 
  `
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
  <div class="watermark">VMHS Academic Receipt</div>
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
      <h2 class="document-title">Academic Receipt</h2>
    </div>

    <div class="date-section">
      <p style="text-align: right;">Date: <span class="underline">${new Date().toLocaleDateString()}</span></p>
    </div>

    <div class="student-info">
    <p><strong>Receipt No:</strong> <span class="underline">${payment.receiptNumber}</span>
<strong> Deposit No:</strong><span class="underline">${payment.bankDepositNumber}</span></p>
<p><strong>MOE Registration:</strong> <span class="underline">${payment.moeRegistration}</span></p>
<p><strong>Student ID:</strong><span class="underline">${student.admissionNumber}</span>
<strong>Student Name:</strong><span class="underline">${student.firstName} ${student.middleName?.middleName || ''} ${student.lastName}</span>
</p>
<div style="display:inline-flex; gap: 150px;">
    <p><strong>Description</strong></p>
    <p><strong>Amount</strong></p>
</div>
<p>${payment.description} --------------- <span>$${payment.amount}</span></p>
<p><strong>Date of Payment:</strong> <span class="underline">${payment.dateOfPayment}</span></p>
      <div>
        <p><strong>Signed:</strong> <span>_____________________________________</span></p>
        <p style="text-align: center; margin-left:-20rem;"><strong>Business Manager</strong></p>
      </div>
    </div>
  </div>
</body>
</html>
  `
     await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
    });

    await browser.close();
    return pdfBuffer;

}catch(error){
    console.error('Recommendation PDF generation failed:', error);
    await browser.close();
    throw error;

      }

}
module.exports = generateReceiptPdf;
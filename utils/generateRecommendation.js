const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const generateRecommendationPdf = async (student, recommendationData = {}) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const logo1Base64 = fs.readFileSync(path.join(__dirname, '../logo1.png'), 'base64');
    const logo2Base64 = fs.readFileSync(path.join(__dirname, '../logo2.png'), 'base64');
    const page = await browser.newPage();

    // Extract recommendation data with defaults
    const {
      purpose = '',
      characteristics = {},
      extraCurricular = '',
      otherActivities = '',
      remarks = ''
    } = recommendationData;

    // Helper function to create checked/unchecked checkboxes
    const createCheckbox = (name, isChecked = false) => {
      return `<input type="checkbox" ${isChecked ? 'checked' : ''} disabled style="margin-right: 5px;"><label>${name}</label>`;
    };

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
<style>
body {
      font-family: 'Times New Roman', Times, serif;
      margin: 15mm;
      font-size: 11pt;
      color: #333;
      position: relative;
      line-height: 1.3;
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
      margin-bottom: 10mm;
    }
    
    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 5mm;
    }
    
    .header-text {
      text-align: center;
      flex: 1;
    }
    
    .school-name {
      font-size: 16pt;
      font-weight: bold;
      color: chocolate;
      margin: 3px 0;
    }
    
    .school-location {
      font-size: 11pt;
      margin: 2px 0;
    }
    
    .country {
      font-size: 11pt;
      font-weight: bold;
      margin: 2px 0;
    }
    
    .contact {
      font-size: 9pt;
      color: #666;
      margin: 2px 0;
    }
    
    .document-title {
      font-size: 14pt;
      font-weight: bold;
      text-decoration: underline;
      color: teal;
      margin: 5mm 0 3mm 0;
    }
    
    .seal-img {
      max-width: 70px;
      height: auto;
    }
    
    .student-info {
      margin: 10mm 0;
    }
    
    .student-info p {
      margin: 6px 0;
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
      margin-bottom: 8mm;
    }
    
    .characteristics-section {
      margin: 10px 0;
    }
    
    .characteristics-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5px;
      margin: 8px 0;
    }
    
    .checkbox-item {
      display: flex;
      align-items: center;
    }
    
    .filled-line {
      border-bottom: 1px solid #000;
      display: inline-block;
      min-width: 400px;
      padding: 2px 5px;
    }
    
    .signatures {
      margin-top: 15mm;
    }
    
    .signature-line {
      display: inline-block;
      border-bottom: 2px solid #000;
      width: 400px;
      margin-bottom: 3px;
      color: red;
    }
    
    @media print {
      body {
        margin: 10mm;
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
  <div class="watermark">VMHS Recommendation Letter</div>
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
      <h2 class="document-title">Recommendation Letter</h2>
      <h4 class="document-title" style="color: black;">TO WHOM IT MAY CONCERN</h4>
    </div>

    <div class="date-section">
      <p>Date: <span class="underline">${new Date().toLocaleDateString()}</span></p>
    </div>

    <div class="student-info">
      <p><strong>This is to introduce the bearer</strong> <span class="underline"> ${student.lastName} ${student.firstName} ${student?.middleName || ''}</span></p>
      <p>as a bona fide graduate of Voinjama Multilateral High School who now desires to</p>
      <p><span class="filled-line">${purpose}</span></p>
      
      <div class="characteristics-section">
        <p>During his/her sojourn here, he/she proved to be:</p>
        <div class="characteristics-grid">
          <div class="checkbox-item">${createCheckbox('respectful', characteristics.respectful)}</div>
          <div class="checkbox-item">${createCheckbox('honest', characteristics.honest)}</div>
          <div class="checkbox-item">${createCheckbox('law abiding', characteristics.lawAbiding)}</div>
          <div class="checkbox-item">${createCheckbox('hardworking', characteristics.hardworking)}</div>
          <div class="checkbox-item">${createCheckbox('problematic', characteristics.problematic)}</div>
          <div class="checkbox-item">${createCheckbox('disrespectful', characteristics.disrespectful)}</div>
          <div class="checkbox-item">${createCheckbox('argumentative', characteristics.argumentative)}</div>
          <div class="checkbox-item">${createCheckbox('weak', characteristics.weak)}</div>
        </div>
      </div>
      
      <div>
        <p>He/She also participated in the following extra-curricular activities during his/her stay here:</p>
        <p><span class="filled-line">${extraCurricular}</span></p>
        <p>Other activities: <span class="filled-line">${otherActivities}</span></p>
        <p>Remarks: <span class="filled-line">${remarks}</span></p>
        <p>Please accept my thanks for your assistance in the premise.</p>
      </div>
      
      <p style="margin-top: 15px;">Sincerely yours,</p>
      
      <div class="signatures">
        <p>Signed: <span class="signature-line"></span></p>
        <p style="text-align: center; margin-top: 5px;"><strong>Principal, VMHS</strong></p>
      </div>
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
    console.error('Recommendation PDF generation failed:', error);
    await browser.close();
    throw error;
  }
};

module.exports = generateRecommendationPdf;
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const generateReceiptsPdf = async ({ receipts }) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const logo1Base64 = fs.readFileSync(path.join(__dirname, '../logo1.png')).toString('base64');
    const logo2Base64 = fs.readFileSync(path.join(__dirname, '../logo2.png')).toString('base64');
    const page = await browser.newPage();

    // Group receipts into pages (4 per page)
    const receiptsPerPage = 4;
    const pages = [];
    for (let i = 0; i < receipts.length; i += receiptsPerPage) {
      pages.push(receipts.slice(i, i + receiptsPerPage));
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Times New Roman', Times, serif;
            margin: 10mm;
            font-size: 8pt;
            color: #333;
            position: relative;
            line-height: 1.2;
          }
          .page {
            width: 210mm;
            height: 297mm;
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr 1fr;
            gap: 5mm;
            position: relative;
          }
          .receipt {
            width: 100mm;
            height: 143mm;
            border: 1px solid #ccc;
            padding: 5mm;
            position: relative;
            box-sizing: border-box;
            overflow: hidden;
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 12pt;
            color: rgba(200, 200, 200, 0.3);
            z-index: 0;
            white-space: nowrap;
          }
          .container {
            position: relative;
            z-index: 1;
          }
          .header {
            text-align: center;
            margin-bottom: 3mm;
          }
          .header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 2mm;
          }
          .header-text {
            flex: 1;
            text-align: center;
          }
          .school-name {
            font-size: 10pt;
            font-weight: bold;
            color: chocolate;
            margin: 2px 0;
          }
          .school-location, .country, .contact {
            font-size: 6pt;
            margin: 1px 0;
          }
          .document-title {
            font-size: 8pt;
            font-weight: bold;
            text-decoration: underline;
            color: teal;
            margin: 2mm 0;
          }
          .seal-img {
            max-width: 15mm;
            height: auto;
          }
          .student-info {
            margin: 3mm 0;
          }
          .student-info p {
            margin: 2px 0;
            font-size: 7pt;
          }
          .underline {
            border-bottom: 1px solid #000;
            display: inline-block;
            min-width: 20mm;
            text-align: center;
            padding: 1px 2px;
          }
          .date-section {
            text-align: right;
            margin-bottom: 3mm;
          }
          .signature {
            margin-top: 5mm;
            text-align: center;
          }
          .signature-line {
            border-bottom: 1px solid #000;
            width: 30mm;
            margin: 2px auto;
          }
          @media print {
            body {
              margin: 0;
            }
            .page {
              margin: 0;
              break-after: page;
            }
            .receipt {
              border: none;
            }
            .watermark {
              opacity: 0.2;
            }
          }
        </style>
      </head>
      <body>
        ${pages.map(pageReceipts => `
          <div class="page">
            ${pageReceipts.map(({ student, payment }) => `
              <div class="receipt">
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
                    <p>Date: <span class="underline">${new Date().toLocaleDateString()}</span></p>
                  </div>
                  <div class="student-info">
                    <p>
                      <strong>Receipt No:</strong> <span class="underline">${payment.receiptNumber}</span>
                      <strong> Deposit No:</strong> <span class="underline">${payment.bankDepositNumber}</span>
                    </p>
                    <p><strong>MOE Registration:</strong> <span class="underline">${payment.moeRegistration}</span></p>
                    <p>
                      <strong>Student ID:</strong> <span class="underline">${student.admissionNumber}</span>
                      <strong> Name:</strong> <span class="underline">${student.lastName} ${student.firstName} ${student.middleName?.middleName || ''}</span>
                    </p>
                    <div style="display: flex; justify-content: space-between;">
                      <p><strong>Description</strong></p>
                      <p><strong>Amount</strong></p>
                    </div>
                    <p>${payment.description} <span style="float: right;">$${payment.amount}</span></p>
                    <p><strong>Date of Payment:</strong> <span class="underline">${payment.dateOfPayment}</span></p>
                    <div class="signature">
                      <p><strong>Signed:</strong><span class="underline"></span></p>
                      
                      <p><strong>Business Manager</strong></p>
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
            ${Array(receiptsPerPage - pageReceipts.length).fill(0).map(() => `
              <div class="receipt"></div>
            `).join('')}
          </div>
        `).join('')}
      </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
    });

    await browser.close();
    return pdfBuffer;

  } catch (error) {
    console.error('Receipts PDF generation failed:', error);
    await browser.close();
    throw error;
  }
};

module.exports = generateReceiptsPdf;
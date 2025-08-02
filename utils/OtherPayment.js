const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const generateReceiptPdf = async ({ student, payment }) => {
  // Validate required fields
  if (!student.firstName || !student.lastName) {
    throw new Error('Student firstName and lastName are required');
  }
  if (!payment.receiptNumber || !payment.amount || !payment.academicYear || !payment.paymentOf) {
    throw new Error('Payment receiptNumber, amount, academicYear, and paymentOf are required');
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const logo1Base64 = fs.readFileSync(path.join(__dirname, '../logo1.png')).toString('base64');
    const logo2Base64 = fs.readFileSync(path.join(__dirname, '../logo2.png')).toString('base64');
    const page = await browser.newPage();

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
          <h2 class="document-title">Other Payments</h2>
        </div>

        <div class="date-section">
          <p style="text-align: right;">Date: <span class="underline">${new Date().toLocaleDateString()}</span></p>
        </div>

        <div class="student-info">
          <p><strong>Receipt No:</strong> <span class="underline">${payment.receiptNumber}</span>
             <strong>Deposit No:</strong><span class="underline">${payment.bankDepositNumber || '-'}</span></p>
          <p><strong>Other Payments:</strong> <span class="underline">${payment.paymentOf}</span></p>
          <p><strong>Student ID:</strong><span class="underline">${student.admissionNumber}</span>
             <strong>Student Name:</strong><span class="underline">${student.lastName} ${student.firstName} ${student.middleName || ''}</span>
          </p>
          <p><strong>Grade Level:</strong> <span class="underline">${student.gradeLevel}</span>
             <strong>Department:</strong> <span class="underline">${student.department}</span>
          </p>
          <p><strong>Amount Paid:</strong> <span class="underline">${new Intl.NumberFormat('en-LR', {
            style: 'currency',
            currency: 'LRD',
            minimumFractionDigits: 2
          }).format(payment.amount)}</span></p>
          <p><strong>Academic Year:</strong> <span class="underline">${payment.academicYear}</span></p>
          <p><strong>Date of Payment:</strong> <span class="underline">${payment.dateOfPayment}</span></p>
          <p><strong>Description:</strong> <span class="underline">${payment.description}</span></p>
        </div>

        <div class="signatures">
          <div>
            <p>Signed:<span class="signature-line"></span></p>
            <p>Business Manager</p>
          </div>
          <div>
            <p>Received By:<span class="signature-line"></span></p>
            <p>Student/Guardian</p>
          </div>
        </div>

        <div class="footer">
          <p><em>Thank you for your payment!</em></p>
          <p><strong>VOINJAMA MULTILATERAL HIGH SCHOOL</strong></p>
        </div>
      </div>
    </body>
    </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
      printBackground: true
    });

    await browser.close();
    return pdfBuffer;

  } catch (error) {
    await browser.close();
    throw error;
  }
};

const generateBatchReceiptsPdf = async (payments) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const logo1Base64 = fs.readFileSync(path.join(__dirname, '../logo1.png')).toString('base64');
    const logo2Base64 = fs.readFileSync(path.join(__dirname, '../logo2.png')).toString('base64');
    const page = await browser.newPage();

    // Validate payments array
    if (!Array.isArray(payments) || payments.length === 0) {
      throw new Error('Payments array is empty or invalid');
    }

    // Filter valid payments with detailed logging
    const validPayments = payments.filter((item, index) => {
      const isValid = item &&
        item.student &&
        item.payment &&
        item.payment.receiptNumber &&
        typeof item.student.firstName === 'string' && item.student.firstName.trim() !== '' &&
        typeof item.student.lastName === 'string' && item.student.lastName.trim() !== '';
      if (!isValid) {
        console.warn(`Skipping invalid payment at index ${index}:`, {
          hasStudent: !!item?.student,
          hasPayment: !!item?.payment,
          hasReceiptNumber: !!item?.payment?.receiptNumber,
          hasFirstName: !!item?.student?.firstName,
          hasLastName: !!item?.student?.lastName,
          firstName: item?.student?.firstName,
          lastName: item?.student?.lastName
        });
        return false;
      }
      return true;
    });

    if (validPayments.length === 0) {
      throw new Error('No valid payments found to generate receipts');
    }

    // Group payments into pages (4 per page)
    const receiptsPerPage = 4;
    const pages = [];
    for (let i = 0; i < validPayments.length; i += receiptsPerPage) {
      pages.push(validPayments.slice(i, i + receiptsPerPage));
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
                    <h2 class="document-title">Other Payments</h2>
                  </div>
                  <div class="date-section">
                    <p>Date: <span class="underline">${new Date().toLocaleDateString()}</span></p>
                  </div>
                  <div class="student-info">
                    <p>
                      <strong>Receipt No:</strong> <span class="underline">${payment.receiptNumber}</span>
                      <strong>Deposit No:</strong> <span class="underline">${payment.bankDepositNumber || '-'}</span>
                    </p>
                    <p><strong>Other Payments:</strong> <span class="underline">${payment.paymentOf}</span></p>
                    <p>
                      <strong>Student ID:</strong> <span class="underline">${student.admissionNumber}</span>
                      <strong>Name:</strong> <span class="underline">${student.lastName} ${student.firstName} ${student.middleName || ''}</span>
                    </p>
                    <p>
                      <strong>Grade:</strong> <span class="underline">${student.gradeLevel}</span>
                      <strong>Dept:</strong> <span class="underline">${student.department}</span>
                    </p>
                    <p><strong>Amount:</strong> <span class="underline">${new Intl.NumberFormat('en-LR', {
                      style: 'currency',
                      currency: 'LRD',
                      minimumFractionDigits: 2
                    }).format(payment.amount)}</span></p>
                    <p><strong>Academic Year:</strong> <span class="underline">${payment.academicYear}</span></p>
                    <p><strong>Date of Payment:</strong> <span class="underline">${payment.dateOfPayment}</span></p>
                    <p><strong>Description:</strong> <span class="underline">${payment.description}</span></p>
                    
                     <p  style="margin-top:10px"><strong>Signed:</strong> <span>_____________________________________</span></p>
                     <p style="text-align: center; margin-left:10px;"><strong>Business Manager</strong></p>
                    
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
    console.error('Batch Receipts PDF generation failed:', error);
    await browser.close();
    throw error;
  }
};

module.exports = {
  generateReceiptPdf,
  generateBatchReceiptsPdf
};

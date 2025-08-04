const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Changed to accept an object with a 'receipts' array
const generateTvetReceiptsPdf = async ({ receipts }) => {
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
            margin: 10mm; /* A bit more margin for the A4 sheet */
            font-size: 8pt; /* Smaller font size for 4 receipts */
            color: #333;
            position: relative;
            line-height: 1.2;
          }
          .page {
            width: 210mm; /* A4 width */
            height: 297mm; /* A4 height */
            display: grid;
            grid-template-columns: 1fr 1fr; /* Two columns */
            grid-template-rows: 1fr 1fr; /* Two rows */
            gap: 5mm; /* Gap between receipts */
            position: relative;
            page-break-after: always; /* Ensure new page for each .page div */
            box-sizing: border-box; /* Include padding/border in element's total width and height */
          }
          .page:last-child {
              page-break-after: avoid; /* No break after the last page */
          }
          .receipt {
            width: 100mm; /* Approximately half of A4 width minus gap */
            height: 143mm; /* Approximately half of A4 height minus gap */
            border: 1px solid #ccc;
            padding: 3mm; /* Smaller padding for more content space */
            position: relative;
            box-sizing: border-box;
            overflow: hidden; /* Hide overflow if content is too large */
            display: flex; /* Use flexbox for content within receipt */
            flex-direction: column;
            justify-content: space-between; /* Distribute space vertically */
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 12pt; /* Adjusted for smaller receipt */
            color: rgba(200, 200, 200, 0.3);
            z-index: 0;
            white-space: nowrap;
          }
          .container {
            position: relative;
            z-index: 1;
            flex-grow: 1; /* Allow container to grow and take available space */
          }
          .header {
            text-align: center;
            margin-bottom: 2mm; /* Reduced margin */
          }
          .header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1mm; /* Reduced margin */
          }
          .header-text {
            flex: 1;
            text-align: center;
          }
          .school-name {
            font-size: 9pt; /* Adjusted font size */
            font-weight: bold;
            color: maroon;
            margin: 1px 0;
          }
          .school-location, .country, .contact {
            font-size: 5pt; /* Adjusted font size */
            margin: 0;
            line-height: 1;
          }
          .document-title {
            font-size: 7pt; /* Adjusted font size */
            font-weight: bold;
            text-decoration: underline;
            color: teal;
            margin: 1mm 0;
          }
          .seal-img {
            max-width: 12mm; /* Adjusted size */
            height: auto;
          }
          .underline {
            border-bottom: 1px solid #000;
            display: inline-block;
            min-width: 15mm; /* Adjusted for smaller width */
            text-align: center;
            padding: 0 1px;
          }
          .date-section {
            text-align: right;
            margin-bottom: 2mm;
            font-size: 7pt;
          }
          .receipt-info p {
            margin: 1px 0;
            font-size: 9pt;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 2mm;
            font-size: 7pt;
          }
          th, td {
            border: 1px solid #000;
            padding: 2px;
            text-align: left;
          }
          .installments {
            margin-top: 2mm;
            font-size: 7pt;
          }
          .installments p {
            margin: 1px 0;
          }
          .signatures {
            margin-top: 3mm;
            text-align: center;
            font-size: 7pt;
            padding-bottom: 1mm;
          }
          .signatures p {
            margin: 1px 0;
          }

          @media print {
            body {
              margin: 0; /* Reset body margin for printing */
            }
            .page {
              margin: 0;
              break-after: page;
            }
            .page:last-child {
              break-after: avoid;
            }
            .receipt {
              border: none; /* Remove border for cleaner print if desired */
              box-shadow: none;
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
            ${pageReceipts.map(tvet => {
              const breakdownRows = tvet.breakdown.map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td>$${item.amount.toFixed(2)}</td>
                </tr>
              `).join('');

              return `
                <div class="receipt">
                  <div class="watermark">VMHS TVET Receipt</div>
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
                      <h2 class="document-title">TVET Receipt of Payment</h2>
                    </div>

                    <div class="date-section">
                      <p>Date: <span class="underline">${new Date(tvet.dateOfPayment).toLocaleDateString()}</span></p>
                    </div>

                    <div class="receipt-info">
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
                      <p><strong>Business Manager</strong></p>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
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
    console.error('TVET Receipts PDF generation failed:', error);
    await browser.close();
    throw error;
  }
};

module.exports = generateTvetReceiptsPdf;
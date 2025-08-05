const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const generateFinancialReportPdf = async ({ payments, gradeLevel, classSection, academicYear, department, filters }) => {
  const logo1Base64 = fs.readFileSync(path.join(__dirname, '../logo1.png')).toString('base64');
  const logo2Base64 = fs.readFileSync(path.join(__dirname, '../logo2.png')).toString('base64');

  let tableRows = '';
  let totalAmount = 0;
  
  payments.forEach((payment, index) => {
    const student = payment.student;
    tableRows += `
      <tr>
        <td>${index + 1}</td>
        <td>${student.lastName}</td>
        <td>${student.firstName}</td>
        <td>${student.middleName || ''}</td>
        <td>${student.gender}</td>
        <td>${student.admissionNumber}</td>
        <td>${student.department || 'N/A'}</td>
        <td>${payment.receiptNumber}</td>
        <td>$${payment.amount.toFixed(2)} LRD</td>
        <td>${new Date(payment.dateOfPayment).toLocaleDateString()}</td>
        <td>${payment.bankDepositNumber || ''}</td>
      </tr>
    `;
    totalAmount += payment.amount;
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Financial Report</title>
      <style>
        body { font-family: 'Times New Roman', Times, serif; margin: 10mm; font-size: 10pt; color: #333; }
        .header { text-align: center; margin-bottom: 10mm; }
        .header-content { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .header-text { flex: 1; text-align: center; }
        .school-name { font-size: 14pt; font-weight: bold; margin-bottom: 3px; color:maroon; }
        .school-location { font-size: 11pt; margin-bottom: 2px; }
        .country { font-size: 11pt; margin-bottom: 2px; }
        .contact { font-size: 9pt; margin-bottom: 5px; }
        .document-title { font-size: 12pt; text-align: center; margin-bottom: 10px; font-weight: bold; }
        .academic-year { text-align: center; margin-bottom: 5px; font-size: 11pt; }
        .class-info { text-align: left; margin-bottom: 10px; font-size: 10pt; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 8pt; }
        th, td { border: 1px solid #333; padding: 4px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
        .total-row { font-weight: bold; background-color: #f9f9f9; }
        .filters { margin-bottom: 10px; font-size: 9pt; }
        .center { text-align: center; }
        .underline { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-content">
            <img src="data:image/png;base64,${logo1Base64}" style="height: 70px; width: auto;" />
            <div class="header-text">
                <h1 class="school-name">VOINJAMA MULTILATERAL HIGH SCHOOL</h1>
                <p class="school-location">VOINJAMA CITY, LOFA COUNTY</p>
                <p class="country">REPUBLIC OF LIBERIA</p>
                <p class="contact">0776990187 / 0886962672</p>
            </div>
            <img src="data:image/png;base64,${logo2Base64}" style="height: 70px; width: auto;" />
        </div>
        
        <h2 class="document-title">MOE STUDENTS REGISTRATION FINANCIAL REPORTS</h2>
        <p class="academic-year"><strong>For Academic Year:</strong> <span class="underline">${academicYear || ''}</span></p>
        <div class="class-info">
          <p><strong>Grade:</strong> <span class="underline">${gradeLevel}</span> &nbsp;&nbsp;&nbsp; 
             <strong>Class Section:</strong> <span class="underline">${classSection}</span> &nbsp;&nbsp;&nbsp;
             <strong>Department:</strong> <span class="underline">${department}</span></p>
        </div>
      </div>

      <div class="filters">
        <p><strong>Report Filters:</strong>
        Grade Level: ${filters.gradeLevel || 'All'}
        | Class Section: ${filters.classSection || 'All'}
        | Department: ${filters.department || 'All'}
        | Academic Year: ${filters.academicYear || 'All'}
        ${filters.startDate ? ` | From: ${new Date(filters.startDate).toLocaleDateString()}` : ''}
        ${filters.endDate ? ` | To: ${new Date(filters.endDate).toLocaleDateString()}` : ''}
        </p>
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
            <th>Receipt#</th>
            <th>Amount</th>
            <th>Date of Payment</th>
            <th>Bank Deposit #</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
          <tr class="total-row">
            <td colspan="8" class="center">Total Amount:</td>
            <td><strong>$${totalAmount.toFixed(2)} LRD</strong></td>
            <td colspan="2"></td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top: 20px; font-size: 9pt;">
        <p><strong>Report Summary:</strong></p>
        <p>Total Students with Payments: ${payments.length}</p>
        <p>Total Amount Collected: $${totalAmount.toFixed(2)} LRD</p>
        <p>Report Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
      </div>
    </body>
    </html>
  `;

  const browser = await puppeteer.launch({ 
    headless: true, 
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
  });
  await browser.close();
  return pdfBuffer;
};

module.exports = generateFinancialReportPdf;
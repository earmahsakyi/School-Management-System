const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const generateTvetFinancialReportPdf = async ({ payments, filters }) => {
  const logo1Base64 = fs.readFileSync(path.join(__dirname, '../logo1.png')).toString('base64');
  const logo2Base64 = fs.readFileSync(path.join(__dirname, '../logo2.png')).toString('base64');

  let tableRows = '';
  let totalAmount = 0;
  let totalFirstInstallment = 0;
  let totalSecondInstallment = 0;
  let totalThirdInstallment = 0;
  
  payments.forEach((payment, index) => {
    // Generate breakdown details
    let breakdownDetails = '';
    if (payment.breakdown && payment.breakdown.length > 0) {
      breakdownDetails = payment.breakdown.map(item => 
        `${item.description}: $${item.amount.toFixed(2)}`
      ).join(', ');
    }

    tableRows += `
      <tr>
        <td>${index + 1}</td>
        <td>${payment.studentID}</td>
        <td>${payment.studentName}</td>
        <td>${payment.receiptNumber}</td>
        <td>${payment.depositNumber || ''}</td>
        <td>$${payment.firstInstallment.toFixed(2)}</td>
        <td>$${payment.secondInstallment.toFixed(2)}</td>
        <td>$${payment.thirdInstallment.toFixed(2)}</td>
        <td>$${payment.totalPaid.toFixed(2)}</td>
        <td>${new Date(payment.dateOfPayment).toLocaleDateString()}</td>
        <td style="font-size: 8pt;">${breakdownDetails}</td>
      </tr>
    `;
    
    totalAmount += payment.totalPaid;
    totalFirstInstallment += payment.firstInstallment;
    totalSecondInstallment += payment.secondInstallment;
    totalThirdInstallment += payment.thirdInstallment;
  });

  // Get unique students count
  const uniqueStudentsCount = [...new Set(payments.map(payment => payment.studentID))].length;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>TVET Financial Report</title>
      <style>
        body { font-family: 'Times New Roman', Times, serif; margin: 15mm; font-size: 9pt; color: #333; }
        .header { text-align: center; margin-bottom: 15mm; }
        .header-content { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .header-text { flex: 1; text-align: center; }
        .school-name { font-size: 16pt; font-weight: bold; margin-bottom: 5px; }
        .school-location { font-size: 12pt; margin-bottom: 3px; }
        .country { font-size: 12pt; margin-bottom: 3px; }
        .contact { font-size: 10pt; margin-bottom: 10px; }
        .document-title { font-size: 14pt; text-align: center; margin-bottom: 15px; font-weight: bold; }
        .academic-year { text-align: center; margin-bottom: 10px; font-size: 12pt; }
        .filters { margin-bottom: 15px; font-size: 9pt; background-color: #f9f9f9; padding: 10px; border: 1px solid #ddd; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 8pt; }
        th, td { border: 1px solid #333; padding: 4px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; text-align: center; font-size: 8pt; }
        .total-row { font-weight: bold; background-color: #f9f9f9; }
        .center { text-align: center; }
        .underline { text-decoration: underline; }
        .summary-section { margin-top: 20px; font-size: 10pt; }
        .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px; }
        .summary-box { border: 1px solid #333; padding: 10px; background-color: #f9f9f9; }
        .amount-highlight { color: #2c5aa0; font-weight: bold; }
        @media print {
          body { margin: 10mm; }
          .header { margin-bottom: 10mm; }
        }
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
        
        <h2 class="document-title">TVET STUDENTS FINANCIAL REPORTS</h2>
        <p class="academic-year"><strong>Technical and Vocational Education Training</strong></p>
      </div>

      <div class="filters">
        <p><strong>Report Filters:</strong>
        ${filters.academicYear ? `Academic Year: ${filters.academicYear}` : ''}
        ${filters.studentID ? ` | Student ID: ${filters.studentID}` : ''}
        ${filters.studentName ? ` | Student Name: ${filters.studentName}` : ''}
        ${filters.startDate ? ` | From: ${new Date(filters.startDate).toLocaleDateString()}` : ''}
        ${filters.endDate ? ` | To: ${new Date(filters.endDate).toLocaleDateString()}` : ''}
        </p>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Student ID</th>
            <th>Student Name</th>
            <th>Receipt #</th>
            <th>Deposit #</th>
            <th>1st Install.</th>
            <th>2nd Install.</th>
            <th>3rd Install.</th>
            <th>Total Paid</th>
            <th>Payment Date</th>
            <th>Breakdown</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
          <tr class="total-row">
            <td colspan="5" class="center"><strong>TOTALS:</strong></td>
            <td><strong>$${totalFirstInstallment.toFixed(2)}</strong></td>
            <td><strong>$${totalSecondInstallment.toFixed(2)}</strong></td>
            <td><strong>$${totalThirdInstallment.toFixed(2)}</strong></td>
            <td><strong>$${totalAmount.toFixed(2)} LRD</strong></td>
            <td colspan="2"></td>
          </tr>
        </tbody>
      </table>

      <div class="summary-section">
        <h3 style="text-align: center; margin-bottom: 15px;">PAYMENT SUMMARY</h3>
        
        <div class="summary-grid">
          <div class="summary-box">
            <h4>Payment Statistics</h4>
            <p><strong>Total Payment Records:</strong> ${payments.length}</p>
            <p><strong>Unique Students:</strong> ${uniqueStudentsCount}</p>
            <p><strong>Average Payment per Student:</strong> $${uniqueStudentsCount > 0 ? (totalAmount / uniqueStudentsCount).toFixed(2) : '0.00'} LRD</p>
          </div>
          
          <div class="summary-box">
            <h4>Installment Breakdown</h4>
            <p><strong>1st Installment Total:</strong> <span class="amount-highlight">$${totalFirstInstallment.toFixed(2)} LRD</span></p>
            <p><strong>2nd Installment Total:</strong> <span class="amount-highlight">$${totalSecondInstallment.toFixed(2)} LRD</span></p>
            <p><strong>3rd Installment Total:</strong> <span class="amount-highlight">$${totalThirdInstallment.toFixed(2)} LRD</span></p>
          </div>
        </div>

        <div style="text-align: center; border: 2px solid #333; padding: 15px; background-color: #f0f8ff;">
          <h3 style="margin: 0; color: #2c5aa0;">GRAND TOTAL COLLECTED</h3>
          <h2 style="margin: 10px 0; color: #2c5aa0; font-size: 18pt;">$${totalAmount.toFixed(2)} LRD</h2>
        </div>

        <div style="margin-top: 20px; font-size: 9pt; border-top: 1px solid #ccc; padding-top: 10px;">
          <p><strong>Report Generated:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          <p><strong>Generated by:</strong> TVET Financial Management System</p>
        </div>
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
    margin: { top: '15mm', right: '10mm', bottom: '15mm', left: '10mm' },
    landscape: true // Using landscape for better table display
  });
  await browser.close();
  return pdfBuffer;
};

module.exports = generateTvetFinancialReportPdf;
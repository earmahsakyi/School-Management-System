const puppeteer = require('puppeteer');

const generatePdf = async (reportCardData) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Extract the first student record (assuming all records are for the same student)
    const student = reportCardData.data[0].student;
    const grades = reportCardData.data;

    // Calculate summary data
    const totalDaysPresent = grades.reduce((sum, grade) => sum + (grade.attendance?.daysPresent || 0), 0);
    const totalDaysAbsent = grades.reduce((sum, grade) => sum + (grade.attendance?.daysAbsent || 0), 0);
    const totalTimesTardy = grades.reduce((sum, grade) => sum + (grade.attendance?.timesTardy || 0), 0);
    
    // Get most recent conduct
    const sortedGrades = [...grades].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const mostRecentConduct = sortedGrades[0]?.conduct || 'Good';

    // Calculate overall average across all terms
    const overallAverage = (grades.reduce((sum, grade) => sum + (grade.overallAverage || 0), 0) / grades.length).toFixed(2);

    // Process grades data into subject-based structure
    const gradesBySubject = {};
    grades.forEach(gradeEntry => {
      gradeEntry.subjects.forEach(subjectScore => {
        const subjectName = subjectScore.subject;
        if (!gradesBySubject[subjectName]) {
          gradesBySubject[subjectName] = {
            '1st': null, '2nd': null, '3rd': null, 
            'Sem. Exam': null, 'Sem. Ave': null
          };
        }

        // Map period scores based on term
        if (gradeEntry.term === "1") {
          if (subjectScore.scores.period1 !== null) gradesBySubject[subjectName]['1st'] = subjectScore.scores.period1;
          if (subjectScore.scores.period2 !== null) gradesBySubject[subjectName]['2nd'] = subjectScore.scores.period2;
          if (subjectScore.scores.period3 !== null) gradesBySubject[subjectName]['3rd'] = subjectScore.scores.period3;
        } else if (gradeEntry.term === "2") {
          if (subjectScore.scores.period4 !== null) gradesBySubject[subjectName]['1st'] = subjectScore.scores.period4;
          if (subjectScore.scores.period5 !== null) gradesBySubject[subjectName]['2nd'] = subjectScore.scores.period5;
          if (subjectScore.scores.period6 !== null) gradesBySubject[subjectName]['3rd'] = subjectScore.scores.period6;
        }
        
        // Semester data
        if (subjectScore.scores.semesterExam !== null) gradesBySubject[subjectName]['Sem. Exam'] = subjectScore.scores.semesterExam;
        if (subjectScore.semesterAverage !== null) gradesBySubject[subjectName]['Sem. Ave'] = subjectScore.semesterAverage;
      });
    });

    // Prepare subject rows in consistent order
    const subjectOrder = [
      "English", "Mathematics", "General Science", "Social Studies", "Civics",
      "Literature", "Religious and Moral Education (RME)", "Physical Education (PE)"
    ];

    const subjectRows = subjectOrder.map(subject => {
      const scores = gradesBySubject[subject] || {};
      return `
        <tr>
          <td class="subject-cell">${subject}</td>
          <td>${scores['1st'] ?? ''}</td>
          <td>${scores['2nd'] ?? ''}</td>
          <td>${scores['3rd'] ?? ''}</td>
          <td>${scores['Sem. Exam'] ?? ''}</td>
          <td>${scores['Sem. Ave'] ?? ''}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>VMHS Report Card</title>
          <style>
              body {
                  font-family: 'Times New Roman', Times, serif;
                  margin: 20mm;
                  font-size: 11pt;
                  line-height: 1.5;
                  color: #333;
              }
              .container {
                  width: 100%;
                  max-width: 210mm;
                  margin: 0 auto;
                  padding: 10mm;
              }
              .header, .footer {
                  text-align: center;
                  margin-bottom: 10mm;
              }
              .school-name {
                  font-size: 18pt;
                  font-weight: bold;
              }
              .ministry {
                  font-size: 10pt;
              }
              .report-card-title {
                  font-size: 14pt;
                  font-weight: bold;
                  margin-top: 5mm;
                  margin-bottom: 5mm;
              }
              .seal-img {
                  max-width: 80px;
                  height: auto;
                  float: left;
                  margin-right: 15px;
                  margin-top: -10px;
              }
              .promotion-statement, .student-info, .parent-notice, .grades-table, 
              .summary-table, .signatures-table {
                  margin-bottom: 10mm;
                  clear: both;
              }
              .promotion-statement p, .student-info p, .parent-notice p {
                  margin: 3px 0;
              }
              .underline {
                  border-bottom: 1px solid #000;
                  display: inline-block;
                  min-width: 150px;
                  text-align: center;
              }
              table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 5mm;
              }
              table, th, td {
                  border: 1px solid #000;
              }
              th, td {
                  padding: 5px;
                  text-align: center;
              }
              .subject-cell {
                  text-align: left;
                  font-weight: bold;
              }
              .small-text {
                  font-size: 9pt;
              }
              .motto {
                  font-size: 10pt;
                  font-weight: bold;
                  margin-top: 15mm;
              }
              .note {
                  font-size: 9pt;
                  font-style: italic;
                  margin-top: 5mm;
              }
              .checkbox {
                  display: inline-block;
                  width: 10px;
                  height: 10px;
                  border: 1px solid black;
                  margin-right: 5px;
                  vertical-align: middle;
              }
              .checked-checkbox::after {
                  content: 'X';
                  font-size: 8pt;
                  line-height: 1;
                  display: block;
                  text-align: center;
              }
              .promotion-status {
                  font-weight: bold;
                  margin-top: 5mm;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/b2/Coat_of_arms_of_Liberia.svg" class="seal-img" alt="Ministry Seal">
                  <div style="overflow: hidden;">
                      <h1 class="school-name">VMHS</h1>
                      <div class="ministry">MINISTRY OF EDUCATION, REPUBLIC OF LIBERIA</div>
                      <div class="school-location">Monrovia, Liberia</div>
                  </div>
                  <h2 class="report-card-title">JUNIOR HIGH REPORT CARD</h2>
              </div>

              <div class="promotion-statement">
                  <h3>PROMOTION STATEMENT</h3>
                  <p>This certifies that:</p>
                  <p><span class="underline">${student.firstName} ${student.lastName}</span></p>
                  <p>Has completed Grade <span class="underline">${student.gradeLevel}</span></p>
                  <p style="margin-top: 15mm;">
                      <span class="underline">__________________________________</span><br>
                      REGISTRAR
                  </p>
                  <p style="margin-top: 5mm;">
                      <span class="underline">__________________________________</span><br>
                      PRINCIPAL
                  </p>
                  <p>Date <span class="underline">${new Date().toLocaleDateString()}</span></p>
                  <p class="note">NOTE: Any erasure on this card makes it invalid</p>
              </div>

              <div class="student-info">
                  <p>Student: <span class="underline">${student.firstName} ${student.lastName}</span></p>
                  <p>Sex: <span class="underline">${student.gender || ''}</span> 
                  Grade: <span class="underline">${student.gradeLevel}</span> 
                  R#: <span class="underline">${student.admissionNumber}</span></p>
                  <p>Academic Year: <span class="underline">${grades[0].academicYear}</span></p>
              </div>

              <div class="parent-notice">
                  <h3>PARENTS OR GUARDIANS NOTICE</h3>
                  <p class="small-text">Grades shown on this report card represent the cumulative average of homework, classwork, participation, quizzes, projects, and tests for each academic subject.</p>
                  <p class="small-text">These grades are intended to encourage improvement and not for comparison.</p>
              </div>

              <div class="grades-table">
                  <table>
                      <thead>
                          <tr>
                              <th class="subject-cell">SUBJECTS</th>
                              <th>1st</th>
                              <th>2nd</th>
                              <th>3rd</th>
                              <th>Sem. Exam</th>
                              <th>Sem. Ave</th>
                          </tr>
                      </thead>
                      <tbody>
                          ${subjectRows}
                      </tbody>
                  </table>
              </div>

              <div class="summary-table">
                  <table>
                      <tbody>
                          <tr>
                              <td class="subject-cell">Overall Average:</td>
                              <td>${overallAverage}</td>
                          </tr>
                          <tr>
                              <td class="subject-cell">Times Tardy:</td>
                              <td>${totalTimesTardy}</td>
                          </tr>
                          <tr>
                              <td class="subject-cell">Days Present:</td>
                              <td>${totalDaysPresent}</td>
                          </tr>
                          <tr>
                              <td class="subject-cell">Days Absent:</td>
                              <td>${totalDaysAbsent}</td>
                          </tr>
                          <tr>
                              <td class="subject-cell">Conduct:</td>
                              <td>${mostRecentConduct}</td>
                          </tr>
                      </tbody>
                  </table>
              </div>

              <div class="footer">
                  <p class="motto">MOTTO: STRIVING FOR POSTERITY</p>
                  <p class="small-text">ANY GRADE BELOW 70% IS A FAILING GRADE</p>
              </div>
          </div>
      </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm',
      },
    });

    await browser.close();
    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF:', error);
    if (browser) await browser.close();
    throw error;
  }
};

module.exports = generatePdf;
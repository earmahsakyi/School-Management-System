// Debug: Log environment variables at build time
console.log('=== BUILD TIME ENV DEBUG ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('All env keys:', Object.keys(process.env));
console.log('REACT_APP keys:', Object.keys(process.env).filter(k => k.startsWith('REACT_APP_')));

const envVars = [
  'REACT_APP_GRADE_SECTION_PASSCODE',
  'REACT_APP_STUDENTS_PASSCODE',
  'REACT_APP_STAFF_PASSCODE',
  'REACT_APP_TRANSCRIPT_PASSCODE',
  'REACT_APP_GRADE_SHEET_PASSCODE',
  'REACT_APP_ROSTER_SUMMARY_PASSCODE',
  'REACT_APP_PAYMENTS_PASSCODE',
  'REACT_APP_PROMOTION_PASSCODE',
  'REACT_APP_OTHER_PAYMENTS_PASSCODE',
  'REACT_APP_TVET_PAYMENTS_PASSCODE',
  'REACT_APP_FINANCIAL_REPORT_PASSCODE'
];

envVars.forEach(varName => {
  console.log(`${varName}:`, process.env[varName] || 'UNDEFINED');
});

console.log('=== END ENV DEBUG ===');

const validCodes = {
  'grade-section': process.env.REACT_APP_GRADE_SECTION_PASSCODE || 'B151616',
  students: process.env.REACT_APP_STUDENTS_PASSCODE || 'A198678',
  staff: process.env.REACT_APP_STAFF_PASSCODE || 'A198678',
  transcript: process.env.REACT_APP_TRANSCRIPT_PASSCODE || 'A198678',
  'grade-sheet': process.env.REACT_APP_GRADE_SHEET_PASSCODE || 'A198678',
  'roster-summary': process.env.REACT_APP_ROSTER_SUMMARY_PASSCODE || 'A198678',
  payments: process.env.REACT_APP_PAYMENTS_PASSCODE || 'C16213',
  promotion: process.env.REACT_APP_PROMOTION_PASSCODE || 'A198678',
  'other-payments': process.env.REACT_APP_OTHER_PAYMENTS_PASSCODE || 'C16213',
  'tvet-payments': process.env.REACT_APP_TVET_PAYMENTS_PASSCODE || 'C16213',
  'financial-report': process.env.REACT_APP_FINANCIAL_REPORT_PASSCODE || 'C16213',
};

// Warn about missing environment variables
Object.keys(validCodes).forEach((key) => {
  const envVar = `REACT_APP_${key.toUpperCase().replace(/-/g, '_')}_PASSCODE`;
  if (!process.env[envVar]) {
    console.warn(`⚠️ Environment variable ${envVar} is missing, using fallback value: ${validCodes[key]}`);
  } else {
    console.log(`✅ ${envVar} loaded successfully: ${process.env[envVar]}`);
  }
});

console.log('Valid Codes:', validCodes);
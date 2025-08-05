import {
  VERIFY_PASSCODE_SUCCESS,
  VERIFY_PASSCODE_FAIL,
  VERIFY_PASSCODE_LOADING
} from './types.js';

// Debug: Log environment variables at build time
console.log('=== BUILD TIME ENV DEBUG ===');
console.log('NODE_ENV:', import.meta.env.NODE_ENV);
console.log('All env keys:', Object.keys(import.meta.env));
console.log('VITE_ keys:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));

const envVars = [
  'VITE_GRADE_SECTION_PASSCODE',
  'VITE_STUDENTS_PASSCODE',
  'VITE_STAFF_PASSCODE',
  'VITE_TRANSCRIPT_PASSCODE',
  'VITE_GRADE_SHEET_PASSCODE',
  'VITE_ROSTER_SUMMARY_PASSCODE',
  'VITE_PAYMENTS_PASSCODE',
  'VITE_PROMOTION_PASSCODE',
  'VITE_OTHER_PAYMENTS_PASSCODE',
  'VITE_TVET_PAYMENTS_PASSCODE',
  'VITE_FINANCIAL_REPORT_PASSCODE'
];

envVars.forEach(varName => {
  console.log(`${varName}:`, import.meta.env[varName] || 'UNDEFINED');
});

console.log('=== END ENV DEBUG ===');

const validCodes = {
  'grade-section': import.meta.env.VITE_GRADE_SECTION_PASSCODE || 'B151616',
  students: import.meta.env.VITE_STUDENTS_PASSCODE || 'A198678',
  staff: import.meta.env.VITE_STAFF_PASSCODE || 'A198678',
  transcript: import.meta.env.VITE_TRANSCRIPT_PASSCODE || 'A198678',
  'grade-sheet': import.meta.env.VITE_GRADE_SHEET_PASSCODE || 'A198678',
  'roster-summary': import.meta.env.VITE_ROSTER_SUMMARY_PASSCODE || 'A198678',
  payments: import.meta.env.VITE_PAYMENTS_PASSCODE || 'C16213',
  promotion: import.meta.env.VITE_PROMOTION_PASSCODE || 'A198678',
  'other-payments': import.meta.env.VITE_OTHER_PAYMENTS_PASSCODE || 'C16213',
  'tvet-payments': import.meta.env.VITE_TVET_PAYMENTS_PASSCODE || 'C16213',
  'financial-report': import.meta.env.VITE_FINANCIAL_REPORT_PASSCODE || 'C16213',
};

// Warn about missing environment variables
Object.keys(validCodes).forEach((key) => {
  const envVar = `VITE_${key.toUpperCase().replace(/-/g, '_')}_PASSCODE`;
  if (!import.meta.env[envVar]) {
    console.warn(`⚠️ Environment variable ${envVar} is missing, using fallback value: ${validCodes[key]}`);
  } else {
    console.log(`✅ ${envVar} loaded successfully: ${import.meta.env[envVar]}`);
  }
});

console.log('Valid Codes:', validCodes);

export const verifyPasscode = (section, inputCode) => (dispatch) => {
  dispatch(setPasscodeLoading());
  
  console.log('Verifying passcode for section:', section);
  console.log('Input code:', inputCode);
  console.log('Expected code:', validCodes[section]);
  console.log('Code match:', validCodes[section] === inputCode);
  
  setTimeout(() => {
    if (validCodes[section] === inputCode) {
      console.log('✅ Passcode verification SUCCESS for:', section);
      dispatch({
        type: VERIFY_PASSCODE_SUCCESS,
        payload: section,
      });
    } else {
      console.log('❌ Passcode verification FAILED for:', section);
      dispatch({
        type: VERIFY_PASSCODE_FAIL,
        payload: section,
      });
    }
  }, 500);
};

export const setPasscodeLoading = () => ({
  type: VERIFY_PASSCODE_LOADING
});

export const resetPasscodeAccess = () => ({
  type: 'RESET_PASSCODE_ACCESS'
});
import {
  VERIFY_PASSCODE_SUCCESS,
  VERIFY_PASSCODE_FAIL,
  VERIFY_PASSCODE_LOADING
} from './types.js';

const validCodes = {
  'grade-section': import.meta.env.VITE_GRADE_SECTION_PASSCODE ,
  students: import.meta.env.VITE_STUDENTS_PASSCODE ,
  staff: import.meta.env.VITE_STAFF_PASSCODE ,
  transcript: import.meta.env.VITE_TRANSCRIPT_PASSCODE ,
  'grade-sheet': import.meta.env.VITE_GRADE_SHEET_PASSCODE ,
  'roster-summary': import.meta.env.VITE_ROSTER_SUMMARY_PASSCODE ,
  payments: import.meta.env.VITE_PAYMENTS_PASSCODE ,
  promotion: import.meta.env.VITE_PROMOTION_PASSCODE ,
  'other-payments': import.meta.env.VITE_OTHER_PAYMENTS_PASSCODE ,
  'tvet-payments': import.meta.env.VITE_TVET_PAYMENTS_PASSCODE ,
  'financial-report': import.meta.env.VITE_FINANCIAL_REPORT_PASSCODE ,
};

export const verifyPasscode = (section, inputCode) => (dispatch) => {
  dispatch(setPasscodeLoading());
  
  setTimeout(() => {
    if (validCodes[section] === inputCode) {
      dispatch({
        type: VERIFY_PASSCODE_SUCCESS,
        payload: section,
      });
    } else {
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
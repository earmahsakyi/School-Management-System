import {
  VERIFY_PASSCODE_SUCCESS,
  VERIFY_PASSCODE_FAIL,
  VERIFY_PASSCODE_LOADING
} from './types.js'

const validCodes = {
  'grade-section': process.env.REACT_APP_GRADE_SECTION_PASSCODE ,
  students: process.env.REACT_APP_STUDENTS_PASSCODE ,
  staff: process.env.REACT_APP_STAFF_PASSCODE ,
  transcript: process.env.REACT_APP_TRANSCRIPT_PASSCODE,
  'grade-sheet': process.env.REACT_APP_GRADE_SHEET_PASSCODE,
  'roster-summary': process.env.REACT_APP_ROSTER_SUMMARY_PASSCODE,
  payments: process.env.REACT_APP_PAYMENTS_PASSCODE,
  promotion: process.env.REACT_APP_PROMOTION_PASSCODE,
  'other-payments': process.env.REACT_APP_OTHER_PAYMENTS_PASSCODE,
  'tvet-payments': process.env.REACT_APP_TVET_PAYMENTS_PASSCODE ,
  'financial-report': process.env.REACT_APP_FINANCIAL_REPORT_PASSCODE,
};

export const verifyPasscode = (section, inputCode) => (dispatch) => {
  dispatch(setPasscodeLoading());
  
  // Add a small delay to show loading state
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

export const setPasscodeLoading = () => {
  return {
    type: VERIFY_PASSCODE_LOADING
  }
};

// Action to reset all passcode access (useful for logout)
export const resetPasscodeAccess = () => (dispatch) => {
  dispatch({
    type: 'RESET_PASSCODE_ACCESS'
  });
};
import axios from 'axios';
import {
  GET_REPORT_CARD_DATA_REQUEST,
  GET_REPORT_CARD_DATA_SUCCESS,
  GET_REPORT_CARD_DATA_FAIL,
  CLEAR_REPORT_CARD_ERRORS,
} from './types';

// Get report card data
export const getReportCardData = (studentId, academicYear) => async (dispatch) => {
  try {
    dispatch({ type: GET_REPORT_CARD_DATA_REQUEST });

    const { data } = await axios.get(`/api/reportcard/${studentId}/${academicYear}`);

    dispatch({
      type: GET_REPORT_CARD_DATA_SUCCESS,
      payload: data.data,
    });
  } catch (error) {
    dispatch({
      type: GET_REPORT_CARD_DATA_FAIL,
      payload: error.response.data.msg,
    });
  }
};

// Clear errors
export const clearReportCardErrors = () => async (dispatch) => {
  dispatch({ type: CLEAR_REPORT_CARD_ERRORS });
};

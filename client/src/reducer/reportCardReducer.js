import {
  GET_REPORT_CARD_DATA_REQUEST,
  GET_REPORT_CARD_DATA_SUCCESS,
  GET_REPORT_CARD_DATA_FAIL,
  CLEAR_REPORT_CARD_ERRORS,
} from '../actions/types';

const initialState = {
  reportCardData: null,
  loading: false,
  error: null,
};

export default function (state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case GET_REPORT_CARD_DATA_REQUEST:
      return {
        ...state,
        loading: true,
      };
    case GET_REPORT_CARD_DATA_SUCCESS:
      return {
        ...state,
        loading: false,
        reportCardData: payload,
      };
    case GET_REPORT_CARD_DATA_FAIL:
      return {
        ...state,
        loading: false,
        error: payload,
      };
    case CLEAR_REPORT_CARD_ERRORS:
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

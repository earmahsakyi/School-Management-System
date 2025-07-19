import {
  STAFF_SET_LOADING,
  CREATE_STAFF_SUCCESS,
  CREATE_STAFF_FAIL,
  GET_STAFF_SUCCESS,
  GET_STAFF_FAIL,
  GET_SINGLE_STAFF_SUCCESS,
  GET_SINGLE_STAFF_FAIL,
  UPDATE_STAFF_SUCCESS,
  UPDATE_STAFF_FAIL,
  DELETE_STAFF_SUCCESS,
  DELETE_STAFF_FAIL,
  SEARCH_STAFF_SUCCESS,
  SEARCH_STAFF_FAIL,
  GET_STAFF_AUDIT_SUCCESS,
  GET_STAFF_AUDIT_FAIL,
  CLEAR_STAFF,
  CLEAR_STAFF_ERRORS,
  STAFF_ERROR
} from '../actions/types';

const initialState = {
  staff: [],
  singleStaff: null,
  searchResults: [],
  auditTrail: [],
  loading: false,
  error: null,
  message: null,
  totalStaff: 0,
};

const staffReducer = (state = initialState, action) => {
  const { type, payload } = action;

  switch (type) {
    case STAFF_SET_LOADING:
      return {
        ...state,
        loading: true,
        error: null
      };

    case CREATE_STAFF_SUCCESS:
      return {
        ...state,
        loading: false,
        staff: [payload.data.staff, ...state.staff],
        message: payload.message || 'Staff created successfully',
        error: null,
        totalStaff: state.totalStaff + 1
      };

    case CREATE_STAFF_FAIL:
      return {
        ...state,
        loading: false,
        error: payload,
        message: null
      };

    case GET_STAFF_SUCCESS:
      return {
        ...state,
        loading: false,
        staff: payload.data || payload.staff || payload,
        totalStaff: payload.count || payload.totalStaff || (payload.data ? payload.data.length : 0),
        error: null
      };

    case GET_STAFF_FAIL:
      return {
        ...state,
        loading: false,
        error: payload,
        staff: []
      };

    case GET_SINGLE_STAFF_SUCCESS:
      return {
        ...state,
        loading: false,
        singleStaff: payload.data || payload,
        error: null
      };

    case GET_SINGLE_STAFF_FAIL:
      return {
        ...state,
        loading: false,
        error: payload,
        singleStaff: null
      };

    case UPDATE_STAFF_SUCCESS:
  return {
    ...state,
    loading: false,
    staff: state.staff.map(staffMember =>
      staffMember._id === payload.data._id 
        ? { ...staffMember, ...payload.data }
        : staffMember
    ),
    singleStaff: payload.data,
    message: payload.message || 'Staff updated successfully',
    error: null
  };


    case UPDATE_STAFF_FAIL:
      return {
        ...state,
        loading: false,
        error: payload,
        message: null
      };

    case DELETE_STAFF_SUCCESS:
      return {
        ...state,
        loading: false,
        staff: state.staff.filter(staffMember => staffMember._id !== payload),
        message: 'Staff deleted successfully',
        error: null,
        totalStaff: state.totalStaff > 0 ? state.totalStaff - 1 : 0,
        singleStaff: state.singleStaff?._id === payload ? null : state.singleStaff
      };

    case DELETE_STAFF_FAIL:
      return {
        ...state,
        loading: false,
        error: payload,
        message: null
      };

    case SEARCH_STAFF_SUCCESS:
      return {
        ...state,
        loading: false,
        searchResults: payload.data || payload,
        error: null
      };

    case SEARCH_STAFF_FAIL:
      return {
        ...state,
        loading: false,
        error: payload,
        searchResults: []
      };

    case GET_STAFF_AUDIT_SUCCESS:
      return {
        ...state,
        loading: false,
        auditTrail: payload.data || payload,
        error: null
      };

    case GET_STAFF_AUDIT_FAIL:
      return {
        ...state,
        loading: false,
        error: payload,
        auditTrail: []
      };

    case CLEAR_STAFF:
      return {
        ...state,
        staff: [],
        singleStaff: null,
        searchResults: [],
        auditTrail: [],
        totalStaff: 0,
        error: null,
        message: null
      };

    case CLEAR_STAFF_ERRORS:
      return {
        ...state,
        error: null,
        message: null
      };

    case STAFF_ERROR:
      return {
        ...state,
        loading: false,
        error: payload
      };

    default:
      return state;
  }
};

export default staffReducer;
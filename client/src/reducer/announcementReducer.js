import {
  ANNOUNCEMENT_SET_LOADING,
  GET_ANNOUNCEMENTS_SUCCESS,
  GET_ANNOUNCEMENTS_FAIL,
  CREATE_ANNOUNCEMENT_SUCCESS,
  CREATE_ANNOUNCEMENT_FAIL,
  DELETE_ANNOUNCEMENT_SUCCESS,
  DELETE_ANNOUNCEMENT_FAIL,
  CLEAR_ANNOUNCEMENT_ERRORS,
} from '../actions/types';

const initialState = {
  announcements: [],
  loading: false,
  error: null,
};

const announcementReducer = (state = initialState, action) => {
  const { type, payload } = action;

  switch (type) {
    case ANNOUNCEMENT_SET_LOADING:
      return {
        ...state,
        loading: true,
      };
    case GET_ANNOUNCEMENTS_SUCCESS:
      return {
        ...state,
        announcements: payload.data,
        loading: false,
        error: null,
      };
    case CREATE_ANNOUNCEMENT_SUCCESS:
      return {
        ...state,
        announcements: [payload.data, ...state.announcements],
        loading: false,
        error: null,
      };
    case DELETE_ANNOUNCEMENT_SUCCESS:
      return {
        ...state,
        announcements: state.announcements.filter(
          (announcement) => announcement._id !== payload
        ),
        loading: false,
        error: null,
      };
    case GET_ANNOUNCEMENTS_FAIL:
    case CREATE_ANNOUNCEMENT_FAIL:
    case DELETE_ANNOUNCEMENT_FAIL:
      return {
        ...state,
        loading: false,
        error: payload,
      };
    case CLEAR_ANNOUNCEMENT_ERRORS:
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

export default announcementReducer;

import {

  GET_ADMIN_PROFILE_SUCCESS,
  GET_ADMIN_PROFILE_FAIL,
  UPDATE_ADMIN_PROFILE_SUCCESS,
  UPDATE_ADMIN_PROFILE_FAIL,
  UPLOAD_ADMIN_PHOTO_FAIL,
  CLEAR_ADMIN_PROFILE,
  CLEAR_ADMINS,
  GET_ADMINS_SUCCESS,
  GET_ADMINS_FAIL,
  SEARCH_ADMINS_SUCCESS,
  SEARCH_ADMINS_FAIL,
  GET_ADMIN,
  GET_ADMIN_FAIL,
  ADMIN_SET_LOADING,
  CLEAR_ERRORS
} from '../actions/types.js';


const initialState = {
  profile: null,
  admin: {},
  admins: [], 
  loading: false, 
  error: null,
};

export default function (state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case ADMIN_SET_LOADING:
      return {
        ...state,
        loading: true
      };
    case CLEAR_ADMINS:
      return {
        ...state,
        admins: null,
        loading: false,
        error: null,
  };
    case GET_ADMIN_PROFILE_SUCCESS:
      return {
        ...state,
        profile:action.payload,
        loading: false,
        error: null
      };
    case UPDATE_ADMIN_PROFILE_SUCCESS:
      return{
        ...state,
       profile: action.payload,
       loading: false
      };
    case GET_ADMIN:
      return{
        ...state,
        admin:action.payload,
        loading:false
      }
    case GET_ADMIN_FAIL:
      return{
        ...state,
        loading: false,
        error : action.payload
      }
    case GET_ADMINS_SUCCESS:
    case SEARCH_ADMINS_SUCCESS:
      return {
        ...state,
        admins: Array.isArray(payload?.data) ? payload.data : [],
        loading: false,
        error: null
      };

    case GET_ADMIN_PROFILE_FAIL:
    case UPDATE_ADMIN_PROFILE_FAIL:
    case UPLOAD_ADMIN_PHOTO_FAIL:
    case GET_ADMINS_FAIL:
    case SEARCH_ADMINS_FAIL:
      return {
        ...state,
        loading: false,
        error: payload
      };

    case CLEAR_ADMIN_PROFILE:
      return {
        ...state,
        profile: null,
        loading: false,  
        error: null
      };

    case CLEAR_ERRORS:
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
}


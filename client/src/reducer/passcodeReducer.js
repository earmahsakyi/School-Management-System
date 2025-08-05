import {
  VERIFY_PASSCODE_SUCCESS,
  VERIFY_PASSCODE_FAIL,
  VERIFY_PASSCODE_LOADING
} from '../actions/types.js';

const initialState = {
  loading: false,
  access: {}, 
  errors: {}
};

export default function passcodeReducer(state = initialState, action) {
  switch (action.type) {
    case VERIFY_PASSCODE_LOADING:
      return {
        ...state,
        loading: true
      };

    case VERIFY_PASSCODE_SUCCESS:
      return {
        ...state,
        loading: false,
        access: {
          ...state.access,
          [action.payload]: true // Only grant access to the specific section
        },
        errors: {
          ...state.errors,
          [action.payload]: null // Clear any previous errors for this section
        }
      };

    case VERIFY_PASSCODE_FAIL:
      return {
        ...state,
        loading: false,
        access: {
          ...state.access,
          [action.payload]: false // Explicitly deny access to this section
        },
        errors: {
          ...state.errors,
          [action.payload]: 'Invalid passcode' // Set error for this section
        }
      };

    default:
      return state;
  }
}
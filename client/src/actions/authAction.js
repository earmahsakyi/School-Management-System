import { 
    AUTH_ERROR,REGISTER_FAIL,REGISTER_SUCCESS,LOGIN_SUCCESS ,LOGIN_FAIL ,LOGOUT ,USER_LOADED,AUTH_SET_LOADING, // Changed SET_LOADING to AUTH_SET_LOADING
    EMAIL_VERIFICATION_CONFIRM_FAILED,EMAIL_VERIFICATION_REQUEST_SENT,EMAIL_VERIFICATION_CONFIRMED,EMAIL_VERIFICATION_REQUEST_FAILED,
    FORGOT_PASSWORD_FAIL,FORGOT_PASSWORD_SUCCESS,RESET_PASSWORD_FAIL,RESET_PASSWORD_SUCCESS,
    CLEAR_AUTH_MESSAGE
} from './types';
import setAuthToken from '../utils/setAuthToken';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Renamed setLoading to setAuthLoading and using AUTH_SET_LOADING type
export const setAuthLoading = () => {
    return {
        type: AUTH_SET_LOADING
    }
};

// Load User
export const loadUser = () => async (dispatch) => {
  
  const token = localStorage.getItem('token');
  if (!token) {
    return dispatch({ type: AUTH_ERROR }); // Early return if no token
  }
  dispatch(setAuthLoading()); // Use new action creator
  setAuthToken(token);
  try {
    
    const res = await axios.get('/api/auth');
   
    dispatch({
      type: USER_LOADED,
      payload: res.data,
    });

  } catch (err) {
     localStorage.removeItem('token');
    dispatch({
      type: AUTH_ERROR,
      payload: err.response?.data?.message || 'Failed to load user',
    })
  }
};
//Email Verifiction
export const verifyEmail = (email) => async (dispatch) => {
  // dispatch(setAuthLoading()); // Consider if loading is needed here
  
  try {
    const res = await axios.post('/api/auth/verify-email', { email });
    const { email: verifiedEmail, message } = res.data; 
    localStorage.setItem('email', email);
    
    dispatch({
      type: EMAIL_VERIFICATION_REQUEST_SENT,
      payload: { email: verifiedEmail, message },
    });

  } catch (err) {
    dispatch({
      type: EMAIL_VERIFICATION_REQUEST_FAILED,
      payload: err.response?.data?.message || 'Email verification failed',
    });


}
};
// Confirm Email
export const confirmEmail = (token) => async (dispatch) => {
  dispatch(setAuthLoading()); // Use new action creator

  const email = localStorage.getItem('email'); // Pull the email

  try {
    const res = await axios.post('/api/auth/confirm-email-verification', {
      email,
      code: token, 
    });

    dispatch({
      type: EMAIL_VERIFICATION_CONFIRMED,
      payload: {
        message: res.data.message,
      }
    });

    return { success: true };
  } catch (err) {
    const errorMessage =
      err.response?.data?.message ||
      err.response?.data?.error || 
      err.message ||
      'Email verification failed';
    toast.error(errorMessage)
    dispatch({
      type: EMAIL_VERIFICATION_CONFIRM_FAILED,
      payload: errorMessage,
    });

    return { error: errorMessage };
  }
};

//login here
export const login = (formData) => async (dispatch) => {
  dispatch(setAuthLoading()); // Use new action creator
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  try {
    const res = await axios.post('/api/auth/login', formData, config);
    const { token, role, userId,profileUpdated } = res.data;
    
    // Store auth data
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    setAuthToken(token);

    dispatch({
      type: LOGIN_SUCCESS,
      payload: { token, role, userId, profileUpdated }
    });

    // Load full user data
    await dispatch(loadUser());

    return { 
      success: true,
      role, 
      profileUpdated
    };

  } catch (err) {
    const errorMsg = err.response?.data?.msg || 
                   err.response?.data?.message || 
                   'Login failed';
    
     toast.error(errorMsg) 
    
    dispatch({
      type: LOGIN_FAIL,
      payload: errorMsg
    });

    return { error: errorMsg };
  }
};
// Register a user
export const registerUser = (formData) => async (dispatch) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  try {
    dispatch(setAuthLoading()); // Use new action creator
    const res = await axios.post('/api/auth/register', formData, config);
    const { token, userID, role } = res.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('email', formData.email); // Store email for verification

    dispatch({
      type: REGISTER_SUCCESS,
      payload: { token, userID, role },
    });

    // Return the full response
    return { success: true, data: res.data };

  } catch (err) {
    let errorMsg = 'Registration failed'; // Default message

    if (err.response && err.response.data) {
      if (err.response.data.msg) {
        errorMsg = err.response.data.msg;
      } else if (err.response.data.message) {
        errorMsg = err.response.data.message;
      } else if (err.response.data.errors && Array.isArray(err.response.data.errors) && err.response.data.errors.length > 0) {
        errorMsg = err.response.data.errors[0].msg || errorMsg; // Use first validator error message
      } else if (err.message) {
        errorMsg = err.message; // Fallback to general axios error message if specific fields not found
      }
    } else if (err.message) {
      errorMsg = err.message; // Fallback if no err.response
    }

    dispatch({
      type: REGISTER_FAIL,
      payload: errorMsg,
    });
    return { error: errorMsg }; // Return error object
  }
};
//forgot password

export const forgotPassword = (email,secretKey) => async (dispatch) => {
  dispatch(setAuthLoading()); // Use new action creator

   try {
    const res = await axios.post('/api/auth/forgot-password', { email, secretKey });
    const { message } = res.data;
    localStorage.setItem('email', email);

    dispatch({
      type: FORGOT_PASSWORD_SUCCESS,
      payload: {email , message}
    });

    return { success: true };
  } catch (err) {
    const errorMessage =
      err.response?.data?.message ||
      err.response?.data?.error || 
      err.message ||
      'Failed to send code';

    dispatch({
      type:FORGOT_PASSWORD_FAIL,
      payload: errorMessage,
    });

    return { error: errorMessage };
  }

}
// Reset password
export const resetPassword = (email,token, newPassword) => async (dispatch) => {

    dispatch(setAuthLoading()); // Use new action creator

    try {
    const res = await axios.post('/api/auth/reset-password', {email, token, newPassword});
    

    dispatch({
      type: RESET_PASSWORD_SUCCESS,
      payload: res.data.message
    });

    return { success: true, message: res.data.message };
  } catch (err) {
    const errorMessage =
      err.response?.data?.message ||
      err.response?.data?.error || 
      err.message ||
      'Failed to send code';

    dispatch({
      type:RESET_PASSWORD_FAIL,
      payload: errorMessage,
    });

    return { error: errorMessage };
  }

}

export  const logout = () => async (dispatch) => {
   dispatch(setAuthLoading()); // Use new action creator
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('email');
 
  dispatch({type: LOGOUT})

  
}

// Clear Auth Message
export const clearAuthMessage = () => (dispatch) => {
  dispatch({ type: CLEAR_AUTH_MESSAGE });
};
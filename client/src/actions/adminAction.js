import {
  GET_ADMIN_PROFILE_SUCCESS,
  GET_ADMIN_PROFILE_FAIL,
  UPDATE_ADMIN_PROFILE_SUCCESS,
  UPDATE_ADMIN_PROFILE_FAIL,
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
} from './types.js';       

import axios from 'axios'

// Helper to get auth token (if not already globally available or imported)
const getTokenConfig = () => {
  const token = localStorage.getItem('token');
  const config = {
    headers: {
      'Content-Type': 'application/json'
    }
  };
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
};

// Get current admins's profile
export const getCurrentAdminProfile = () => async (dispatch) => {
 

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const config = {
      headers: {
        'x-auth-token': token,
        'Content-Type': 'application/json'
      },
      timeout: 15000 // Add a 15-second timeout
    };

    const res = await axios.get('/api/admin/profile', config);

    if (!res.data || !res.data.success || !res.data.data) {
      throw new Error('Invalid response from server');
    }

    dispatch({
      type: GET_ADMIN_PROFILE_SUCCESS,
      payload: res.data.data
    });

  } catch (err) {
    let errorMessage = err.message || 'Unknown error occurred';
    if (err.code === 'ECONNABORTED') {
      errorMessage = 'Request timed out. Please try again.';
    } else if (err.response) {
      errorMessage = err.response.data?.msg || err.response.data?.message || errorMessage;
    }

    dispatch({
      type: GET_ADMIN_PROFILE_FAIL,
      payload: errorMessage
    });
  }
};

// Create or update Admin profile
export const createOrUpdateAdminProfile = (formData) => async (dispatch) => {
  try {
    dispatch(setAdminLoading());

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };

    const res = await axios.post('/api/admin', formData, config);

    dispatch({
      type: UPDATE_ADMIN_PROFILE_SUCCESS,
      payload: res.data.data
    });

    return { success: true, data: res.data.data };

  } catch (err) {
    const errorMessage = err.response?.data?.msg || 'Error updating profile';

    dispatch({
      type: UPDATE_ADMIN_PROFILE_FAIL,
      payload: errorMessage
    });

    return { success: false, error: errorMessage };
  }
};


// Get all admins
export const getAdmins = () => async (dispatch) => {
  try {
    dispatch(setAdminLoading());

    const res = await axios.get('/api/admin');

    dispatch({
      type: GET_ADMINS_SUCCESS,
      payload: res.data
    });

  } catch (err) {
    dispatch({
      type: GET_ADMINS_FAIL,
      payload: err.response?.data?.msg || 'Error loading providers'
    });
  }
};


// Clear admin profile
export const clearAdminProfile = () => (dispatch) => {
  dispatch({ type: CLEAR_ADMIN_PROFILE });
};

// Clear errors
export const clearErrors = () => (dispatch) => {
  dispatch({ type: CLEAR_ERRORS });
};

export const clearAdmins = () => (dispatch) => {
  dispatch({type: CLEAR_ADMINS})
}

// Set loading
export const setAdminLoading = () => ({
  type: ADMIN_SET_LOADING
});
// search Admins
export const searchAdmins = (criteria) => async (dispatch) => {
  try {
    dispatch(setAdminLoading());

    const token = localStorage.getItem('token');
    const config = {
      params: criteria,
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      timeout: 15000 // Add a 15-second timeout (15000 milliseconds)
    };
    
    const res = await axios.get('/api/admin/search', config);

    

    // Ensure res.data and res.data.data exist and res.data.data is an array
    // The reducer for SEARCH_PROVIDERS_SUCCESS expects action.payload.data to be the array of providers.
    // So, res.data itself should be an object like { data: [...] }
    if (!res.data || !Array.isArray(res.data.data)) {
      console.error('Search response error: res.data or res.data.data is not in expected format.', res.data);
      throw new Error('Received an invalid response structure from the server.'); 
    }

    dispatch({
      type: SEARCH_ADMINS_SUCCESS,
      payload: res.data // The reducer expects payload.data to be the array
    });

    return res.data;

  } catch (err) {
    console.error('Search error:', err); // Log the full error object
    
    let errorMessage = 'Error searching providers. Please try again.';
    if (err.code === 'ECONNABORTED') {
      errorMessage = 'The search request timed out. Please check your connection and try again.';
      console.error('Search timed out:', err.message);
    } else if (err.message === 'Received an invalid response structure from the server.') {
      errorMessage = err.message; // Use the specific error message
    } else if (err.response) {
      errorMessage = err.response.data?.msg || err.response.data?.message || `Server error: ${err.response.status}`;
      console.error('Server error response:', err.response.data || err.response.status);
    } else if (err.request) {
      errorMessage = 'Network error - no response received. Please check your connection.';
      console.error('Network error (no response):', err.request);
    } else {
      // This handles errors during request setup or other unexpected errors
      errorMessage = err.message || 'An unexpected error occurred during search.';
      console.error('Request setup or other error:', err.message);
    }

    dispatch({
      type: SEARCH_ADMINS_FAIL,
      payload: errorMessage
    });
    
    // Optionally, re-throw if components need to react to the error object itself,
    // but for resetting loading state, dispatching _FAIL is key.
    // throw err; // Commented out as dispatching FAIL is usually sufficient for UI.
  }
};
//get AdminbyID
export const getAdminById = (id) => async (dispatch) => {

  try{
     dispatch(setAdminLoading())
     const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };

     const res = await axios.get(`/api/admin/${id}`, config)
     dispatch({
      type: GET_ADMIN,
      payload: res.data.data
    })
  }
  catch(err){
    dispatch({
      type: GET_ADMIN_FAIL,
      payload: err.response?.data?.msg || 'Error loading provider'
    });
  }
};

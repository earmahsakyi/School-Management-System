import axios from 'axios';
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
} from './types';

// Set loading state
export const setStaffLoading = () => ({
  type: STAFF_SET_LOADING
});

// Create Staff
export const createStaff = (formData) => async (dispatch) => {
  try {
    dispatch(setStaffLoading());
    const token = localStorage.getItem('token')
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        'x-auth-token': token
      }
    };

    const res = await axios.post('/api/staff', formData, config);
    
    dispatch({
      type: CREATE_STAFF_SUCCESS,
      payload: res.data
    });
    
    return res.data;
  } catch (err) {
    dispatch({
      type: CREATE_STAFF_FAIL,
      payload: err.response?.data?.msg || 'Failed to create staff'
    });
    throw err;
  }
};

// Get all staff
export const getAllStaff = () => async (dispatch) => {
  try {
    dispatch(setStaffLoading());
    const token = localStorage.getItem('token')
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      }
    };
    
    const res = await axios.get('/api/staff',config);
    
    dispatch({
      type: GET_STAFF_SUCCESS,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: GET_STAFF_FAIL,
      payload: err.response?.data?.msg || 'Failed to fetch staff'
    });
    throw err;
  }
};

// Get single staff by ID
export const getStaffById = (id) => async (dispatch) => {
  try {
    dispatch(setStaffLoading());
    const token = localStorage.getItem('token')
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      }
    };
    
    const res = await axios.get(`/api/staff/${id}`,config);
    
    dispatch({
      type: GET_SINGLE_STAFF_SUCCESS,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: GET_SINGLE_STAFF_FAIL,
      payload: err.response?.data?.msg || 'Failed to fetch staff'
    });
    throw err;
  }
};

// Update staff
export const updateStaff = (id, formData) => async (dispatch) => {
  try {
    dispatch(setStaffLoading());
    
    const token = localStorage.getItem('token')
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        'x-auth-token': token
      }
    };

    const res = await axios.put(`/api/staff/${id}`, formData, config);
    
    dispatch({
      type: UPDATE_STAFF_SUCCESS,
      payload: res.data
    });
    
    return res.data;
  } catch (err) {
    dispatch({
      type: UPDATE_STAFF_FAIL,
      payload: err.response?.data?.msg || 'Failed to update staff'
    });
    throw err;
  }
};

// Delete staff
export const deleteStaff = (id) => async (dispatch) => {
  try {
    dispatch(setStaffLoading());
    const token = localStorage.getItem('token')
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      }
    };
    
    await axios.delete(`/api/staff/${id}`,config);
    
    dispatch({
      type: DELETE_STAFF_SUCCESS,
      payload: id
    });
    
    return { success: true, message: 'Staff deleted successfully' };
  } catch (err) {
    dispatch({
      type: DELETE_STAFF_FAIL,
      payload: err.response?.data?.msg || 'Failed to delete staff'
    });
    throw err;
  }
};

// Search staff
export const searchStaff = (query) => async (dispatch) => {
  try {
    dispatch(setStaffLoading());
    const token = localStorage.getItem('token')
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      }
    };
    
    const res = await axios.get(`/api/staff/search?q=${encodeURIComponent(query)}`,config);
    
    dispatch({
      type: SEARCH_STAFF_SUCCESS,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: SEARCH_STAFF_FAIL,
      payload: err.response?.data?.msg || 'Failed to search staff'
    });
    throw err;
  }
};

// Get staff audit trail
export const getStaffAuditTrail = (id) => async (dispatch) => {
  try {
    dispatch(setStaffLoading());
    const token = localStorage.getItem('token')
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      }
    };
    
    const res = await axios.get(`/api/staff/${id}/audit`,config);
    
    dispatch({
      type: GET_STAFF_AUDIT_SUCCESS,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: GET_STAFF_AUDIT_FAIL,
      payload: err.response?.data?.msg || 'Failed to fetch audit trail'
    });
    throw err;
  }
};

// Clear staff data
export const clearStaff = () => ({
  type: CLEAR_STAFF
});

// Clear staff errors
export const clearStaffErrors = () => ({
  type: CLEAR_STAFF_ERRORS
});

// Set staff error
export const setStaffError = (error) => ({
  type: STAFF_ERROR,
  payload: error
});
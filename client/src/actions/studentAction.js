import axios from 'axios';
import { 
  // Student action types (add these to your types.js file)
  STUDENT_SET_LOADING,
  CREATE_STUDENT_SUCCESS,
  CREATE_STUDENT_FAIL,
  GET_STUDENTS_SUCCESS,
  GET_STUDENTS_FAIL,
  GET_STUDENT_SUCCESS,
  GET_STUDENT_FAIL,
  UPDATE_STUDENT_SUCCESS,
  UPDATE_STUDENT_FAIL,
  DELETE_STUDENT_SUCCESS,
  DELETE_STUDENT_FAIL,
  SEARCH_STUDENTS_SUCCESS,
  SEARCH_STUDENTS_FAIL,
  CLEAR_STUDENTS,
  CLEAR_STUDENT_ERRORS,
  STATS_LOADING,
  GET_STATS_SUCCESS,
  GET_STATS_FAIL
} from './types';

// Set loading state
export const setStudentLoading = () => ({
  type: STUDENT_SET_LOADING
});

// Set Stats Loading
export const setStatsLoading = () => (dispatch) => {
  dispatch({ type: STATS_LOADING });
};

// Clear errors
export const clearStudentErrors = () => ({
  type: CLEAR_STUDENT_ERRORS
});

// Clear students
export const clearStudents = () => ({
  type: CLEAR_STUDENTS
});

// Create student and parent
export const createStudentAndParent = (formData) => async (dispatch) => {
  try {
    dispatch(setStudentLoading());
    const token = localStorage.getItem('token')

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        'x-auth-token' : token
      }
    };

    const res = await axios.post('/api/student', formData, config);

    dispatch({
      type: CREATE_STUDENT_SUCCESS,
      payload: res.data
    });

    return res.data;
  } catch (err) {
    const error = err.response?.data?.msg || err.message || 'Failed to create student';
    dispatch({
      type: CREATE_STUDENT_FAIL,
      payload: error
    });
    throw err;
  }
};

// Get all students
export const getAllStudents = () => async (dispatch) => {
  try {
    dispatch(setStudentLoading());
    const token = localStorage.getItem('token')

    const config = {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token' : token
      }
    }

    const res = await axios.get('/api/student',config);

    dispatch({
      type: GET_STUDENTS_SUCCESS,
      payload: res.data
    });

    return res.data;
  } catch (err) {
    const error = err.response?.data?.msg || err.message || 'Failed to fetch students';
    dispatch({
      type: GET_STUDENTS_FAIL,
      payload: error
    });
    throw err;
  }
};

// Get student by ID
export const getStudentById = (id) => async (dispatch) => {
  try {
    dispatch(setStudentLoading());
    const token = localStorage.getItem('token')

    const config = {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token' : token
      }
    }

    const res = await axios.get(`/api/student/${id}`,config);

    dispatch({
      type: GET_STUDENT_SUCCESS,
      payload: res.data
    });

    return res.data;
  } catch (err) {
    const error = err.response?.data?.msg || err.message || 'Failed to fetch student';
    dispatch({
      type: GET_STUDENT_FAIL,
      payload: error
    });
    throw err;
  }
};

// Update student and parent
export const updateStudentAndParent = (id, formData) => async (dispatch) => {
  try {
    dispatch(setStudentLoading());

   const token = localStorage.getItem('token')

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        'x-auth-token' : token
      }
    }

    const res = await axios.put(`/api/student/${id}`, formData, config);

    dispatch({
      type: UPDATE_STUDENT_SUCCESS,
      payload: res.data
    });

    return res.data;
  } catch (err) {
    const error = err.response?.data?.msg || err.message || 'Failed to update student';
    dispatch({
      type: UPDATE_STUDENT_FAIL,
      payload: error
    });
    throw err;
  }
};

// Delete student and parent
export const deleteStudentAndParent = (id) => async (dispatch) => {
  try {
    dispatch(setStudentLoading());
    const token = localStorage.getItem('token')

    const config = {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token' : token
      }
    }

    const res = await axios.delete(`/api/student/${id}`,config);

    dispatch({
      type: DELETE_STUDENT_SUCCESS,
      payload: { id, message: res.data.msg }
    });

    return res.data;
  } catch (err) {
    const error = err.response?.data?.msg || err.message || 'Failed to delete student';
    dispatch({
      type: DELETE_STUDENT_FAIL,
      payload: error
    });
    throw err;
  }
};

// Search students
export const searchStudents = (admissionNumber) => async (dispatch) => {
  try {
    dispatch(setStudentLoading());
    const token = localStorage.getItem('token')

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        'x-auth-token' : token
      }
    }

    const params = new URLSearchParams();
    if (admissionNumber) params.append('admissionNumber', admissionNumber);

    const res = await axios.get(`/api/student/search?${params.toString()}`,config);

    dispatch({
      type: SEARCH_STUDENTS_SUCCESS,
      payload: res.data
    });

    return res.data;
  } catch (err) {
    const error = err.response?.data?.msg || err.message || 'Failed to search students';
    dispatch({
      type: SEARCH_STUDENTS_FAIL,
      payload: error
    });
    throw err;
  }
};

// Update promotion status
export const updatePromotionStatus = (studentId, promotionStatus) => async (dispatch) => {
  try {
    const token = localStorage.getItem('token')

    const config = {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token' : token
      }
    }
    
    const res = await axios.put(`/api/student/${studentId}/promotion`, promotionStatus, config);

    dispatch({
      type: UPDATE_STUDENT_SUCCESS,
      payload: res.data,
    });
  } catch (err) {
    dispatch({
      type: UPDATE_STUDENT_FAIL,
      payload: err.response.data.msg,
    });
  }
};

// Get Provider Stats
export const getStats = () => async (dispatch) => {
  
  try {
    dispatch(setStatsLoading());

    const res = await axios.get('/api/student/stats', ); 
    dispatch({
      type: GET_STATS_SUCCESS,
      payload: res.data 
    });
    return res.data

  } catch (err) {
    dispatch({
      type: GET_STATS_FAIL,
      payload: err.response?.data?.msg || err.message || 'Failed to fetch stats'
    });
    throw err;
  }
};
import axios from 'axios';
import {
  GRADE_SET_LOADING,
  GRADE_SET_ERROR,
  GRADE_CLEAR_ERROR,
  CREATE_GRADE_SUCCESS,
  CREATE_GRADE_FAIL,
  GET_ALL_GRADES_SUCCESS,
  GET_ALL_GRADES_FAIL,
  GET_GRADE_BY_ID_SUCCESS,
  GET_GRADE_BY_ID_FAIL,
  UPDATE_GRADE_SUCCESS,
  UPDATE_GRADE_FAIL,
  DELETE_GRADE_SUCCESS,
  DELETE_GRADE_FAIL,
  GET_STUDENT_GRADES_SUCCESS,
  GET_STUDENT_GRADES_FAIL,
  GET_STUDENT_PERFORMANCE_SUCCESS,
  GET_STUDENT_PERFORMANCE_FAIL,
  GET_CLASS_PERFORMANCE_SUCCESS,
  GET_CLASS_PERFORMANCE_FAIL,
  GRADE_SET_PAGINATION,
  GRADE_SET_FILTERS,
  GRADE_CLEAR_FILTERS,
  CLEAR_GRADES,
  CLEAR_GRADE_ERRORS,
  GRADE_SEARCH_STUDENTS_SUCCESS,
  GRADE_SEARCH_STUDENTS_FAIL
} from './types';

// Set loading state
export const setGradeLoading = (isLoading) => ({
  type: GRADE_SET_LOADING,
  payload: isLoading
});

// Set error
export const setGradeError = (error) => ({
  type: GRADE_SET_ERROR,
  payload: error
});

// Clear error
export const clearGradeError = () => ({
  type: GRADE_CLEAR_ERROR
});

// Clear all errors
export const clearGradeErrors = () => ({
  type: CLEAR_GRADE_ERRORS
});

// Clear grades
export const clearGrades = () => ({
  type: CLEAR_GRADES
});

// Set pagination
export const setGradePagination = (pagination) => ({
  type: GRADE_SET_PAGINATION,
  payload: pagination
});

// Set filters
export const setGradeFilters = (filters) => ({
  type: GRADE_SET_FILTERS,
  payload: filters
});

// Clear filters
export const clearGradeFilters = () => ({
  type: GRADE_CLEAR_FILTERS
});

// Create a new grade record
export const createGrade = (gradeData) => async (dispatch) => {
  try {
    dispatch(setGradeLoading(true));
    dispatch(clearGradeError());

    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const res = await axios.post('/api/grade', gradeData, config);

    dispatch({
      type: CREATE_GRADE_SUCCESS,
      payload: res.data
    });

    return res.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to create grade record';
    
    dispatch({
      type: CREATE_GRADE_FAIL,
      payload: errorMessage
    });
    
    throw error;
  } finally {
    dispatch(setGradeLoading(false));
  }
};

// Get all grades with filtering and pagination
export const getAllGrades = (params = {}) => async (dispatch) => {
  try {
    dispatch(setGradeLoading(true));
    dispatch(clearGradeError());

    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });

    const res = await axios.get(`/api/grade?${queryParams}`);

    dispatch({
      type: GET_ALL_GRADES_SUCCESS,
      payload: res.data
    });

    // Set pagination info
    if (res.data.pagination) {
      dispatch(setGradePagination(res.data.pagination));
    }

    return res.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to fetch grades';
    
    dispatch({
      type: GET_ALL_GRADES_FAIL,
      payload: errorMessage
    });
    
    throw error;
  } finally {
    dispatch(setGradeLoading(false));
  }
};

// Get grade by ID
export const getGradeById = (gradeId) => async (dispatch) => {
  try {
    dispatch(setGradeLoading(true));
    dispatch(clearGradeError());

    const res = await axios.get(`/api/grade/${gradeId}`);

    dispatch({
      type: GET_GRADE_BY_ID_SUCCESS,
      payload: res.data
    });

    return res.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to fetch grade record';
    
    dispatch({
      type: GET_GRADE_BY_ID_FAIL,
      payload: errorMessage
    });
    
    throw error;
  } finally {
    dispatch(setGradeLoading(false));
  }
};

// Get student grades
export const getStudentGrades = (studentId, params = {}) => async (dispatch) => {
  try {
    dispatch(setGradeLoading(true));
    dispatch(clearGradeError());

    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });

    const res = await axios.get(`/api/grade/student/${studentId}?${queryParams}`);

    dispatch({
      type: GET_STUDENT_GRADES_SUCCESS,
      payload: res.data
    });

    return res.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to fetch student grades';
    
    dispatch({
      type: GET_STUDENT_GRADES_FAIL,
      payload: errorMessage
    });
    
    throw error;
  } finally {
    dispatch(setGradeLoading(false));
  }
};

// Update grade record
export const updateGrade = (gradeId, updateData) => async (dispatch) => {
  try {
    dispatch(setGradeLoading(true));
    dispatch(clearGradeError());

    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const res = await axios.put(`/api/grade/${gradeId}`, updateData, config);

    dispatch({
      type: UPDATE_GRADE_SUCCESS,
      payload: res.data
    });

    return res.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to update grade record';
    
    dispatch({
      type: UPDATE_GRADE_FAIL,
      payload: errorMessage
    });
    
    throw error;
  } finally {
    dispatch(setGradeLoading(false));
  }
};

// Delete grade record
export const deleteGrade = (gradeId) => async (dispatch) => {
  try {
    dispatch(setGradeLoading(true));
    dispatch(clearGradeError());

    const res = await axios.delete(`/api/grade/${gradeId}`);

    dispatch({
      type: DELETE_GRADE_SUCCESS,
      payload: { gradeId, message: res.data.message }
    });

    return res.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to delete grade record';
    
    dispatch({
      type: DELETE_GRADE_FAIL,
      payload: errorMessage
    });
    
    throw error;
  } finally {
    dispatch(setGradeLoading(false));
  }
};

// Get student performance summary
export const getStudentPerformance = (studentId, params = {}) => async (dispatch) => {
  try {
    dispatch(setGradeLoading(true));
    dispatch(clearGradeError());

    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });

    const res = await axios.get(`/api/grade/performance/student/${studentId}?${queryParams}`);
    console.log(res.data);

    dispatch({
      type: GET_STUDENT_PERFORMANCE_SUCCESS,
      payload: res.data
    });

    return res.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to fetch student performance';
    
    dispatch({
      type: GET_STUDENT_PERFORMANCE_FAIL,
      payload: errorMessage
    });
    
    throw error;
  } finally {
    dispatch(setGradeLoading(false));
  }
};

// Get class performance statistics
export const getClassPerformance = (params = {}) => async (dispatch) => {
  try {
    dispatch(setGradeLoading(true));
    dispatch(clearGradeError());

    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });

    const res = await axios.get(`/api/grade/analytics/class-performance?${queryParams}`);

    dispatch({
      type: GET_CLASS_PERFORMANCE_SUCCESS,
      payload: res.data
    });

    return res.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to fetch class performance';
    
    dispatch({
      type: GET_CLASS_PERFORMANCE_FAIL,
      payload: errorMessage
    });
    
    throw error;
  } finally {
    dispatch(setGradeLoading(false));
  }
};

// Utility action to refresh grades after operations
export const refreshGrades = (currentFilters = {}) => async (dispatch) => {
  try {
    await dispatch(getAllGrades(currentFilters));
  } catch (error) {
    console.error('Failed to refresh grades:', error);
  }
};

// Batch operations
export const batchUpdateGrades = (updates) => async (dispatch) => {
  try {
    dispatch(setGradeLoading(true));
    dispatch(clearGradeError());

    const promises = updates.map(update => 
      axios.put(`/api/grade/${update.gradeId}`, update.data)
    );

    const results = await Promise.all(promises);
    
    dispatch({
      type: UPDATE_GRADE_SUCCESS,
      payload: { message: 'Batch update completed successfully', results }
    });

    return results;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to batch update grades';
    
    dispatch({
      type: UPDATE_GRADE_FAIL,
      payload: errorMessage
    });
    
    throw error;
  } finally {
    dispatch(setGradeLoading(false));
  }
};

// Search students by name or admission number
export const searchStudents = (query) => async (dispatch) => {
  try {
    dispatch(setGradeLoading(true));
    dispatch(clearGradeError());

    if (!query.trim()) {
      throw new Error('Search query is required');
    }

    const res = await axios.get(`/api/grade/students/search?query=${encodeURIComponent(query)}`);
    console.log(res.data)
    dispatch({
      type: GRADE_SEARCH_STUDENTS_SUCCESS,
      payload: res.data
    });

    return res.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to search students';
    
    dispatch({
      type: GRADE_SEARCH_STUDENTS_FAIL,
      payload: errorMessage
    });
    
    throw error;
  } finally {
    dispatch(setGradeLoading(false));
  }
};
import axios from 'axios';
import {
  ANNOUNCEMENT_SET_LOADING,
  GET_ANNOUNCEMENTS_SUCCESS,
  GET_ANNOUNCEMENTS_FAIL,
  CREATE_ANNOUNCEMENT_SUCCESS,
  CREATE_ANNOUNCEMENT_FAIL,
  DELETE_ANNOUNCEMENT_SUCCESS,
  DELETE_ANNOUNCEMENT_FAIL,
  CLEAR_ANNOUNCEMENT_ERRORS,
} from './types';

// Set loading state
export const setAnnouncementLoading = () => ({
  type: ANNOUNCEMENT_SET_LOADING,
});

// Get all announcements
export const getAnnouncements = () => async (dispatch) => {
  try {
    dispatch(setAnnouncementLoading());
    const token = localStorage.getItem('token');
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
    };

    const res = await axios.get('/api/announcements', config);

    dispatch({
      type: GET_ANNOUNCEMENTS_SUCCESS,
      payload: res.data,
    });
  } catch (err) {
    dispatch({
      type: GET_ANNOUNCEMENTS_FAIL,
      payload: err.response?.data?.msg || 'Failed to fetch announcements',
    });
  }
};

// Create announcement
export const createAnnouncement = (formData) => async (dispatch) => {
  try {
    dispatch(setAnnouncementLoading());
    const token = localStorage.getItem('token');
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
    };

    const res = await axios.post('/api/announcements', formData, config);

    dispatch({
      type: CREATE_ANNOUNCEMENT_SUCCESS,
      payload: res.data,
    });
  } catch (err) {
    dispatch({
      type: CREATE_ANNOUNCEMENT_FAIL,
      payload: err.response?.data?.msg || 'Failed to create announcement',
    });
  }
};

// Delete announcement
export const deleteAnnouncement = (id) => async (dispatch) => {
  try {
    dispatch(setAnnouncementLoading());
    const token = localStorage.getItem('token');
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
    };

    await axios.delete(`/api/announcements/${id}`, config);

    dispatch({
      type: DELETE_ANNOUNCEMENT_SUCCESS,
      payload: id,
    });
  } catch (err) {
    dispatch({
      type: DELETE_ANNOUNCEMENT_FAIL,
      payload: err.response?.data?.msg || 'Failed to delete announcement',
    });
  }
};

// Clear errors
export const clearAnnouncementErrors = () => ({
  type: CLEAR_ANNOUNCEMENT_ERRORS,
});

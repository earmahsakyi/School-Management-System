import {
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
  STUDENT_ERROR,
  CLEAR_STUDENT_ERRORS,
  STATS_LOADING,
  GET_STATS_SUCCESS,
  GET_STATS_FAIL
} from '../actions/types';

const initialState = {
  students: [],
  student: null,
  searchResults: [],
  loading: false,
  error: null,
  message: null,
  count: 0,
  stats: {},
  statsLoading: false,
};

const studentReducer = (state = initialState, action) => {
  const { type, payload } = action;

  switch (type) {
    case STUDENT_SET_LOADING:
      return {
        ...state,
        loading: true,
        error: null
      };
    case STATS_LOADING:
      return {
        ...state,
        statsLoading: true
      };
    case GET_STATS_SUCCESS:
        return {
        ...state,
        stats: payload,
        statsLoading: false,
        error: null
      };
    case GET_STATS_FAIL:
        return{
            ...state,
            statsLoading: false,
            error: payload,
            stats: {}
            
        };

    case CREATE_STUDENT_SUCCESS:
      return {
        ...state,
        loading: false,
        students: [payload.data.student, ...state.students],
        message: 'Student and parent created successfully',
        error: null,
        count: state.count + 1
      };

    case CREATE_STUDENT_FAIL:
      return {
        ...state,
        loading: false,
        error: payload,
        message: null
      };

    case GET_STUDENTS_SUCCESS:
      return {
        ...state,
        loading: false,
        students: payload.data,
        count: payload.count,
        error: null
      };

    case GET_STUDENTS_FAIL:
      return {
        ...state,
        loading: false,
        error: payload,
        students: []
      };

    case GET_STUDENT_SUCCESS:
      return {
        ...state,
        loading: false,
        student: payload.data,
        error: null
      };

    case GET_STUDENT_FAIL:
      return {
        ...state,
        loading: false,
        error: payload,
        student: null
      };

    case UPDATE_STUDENT_SUCCESS:
      // Handle both regular updates and promotion updates
      let updatedStudent;
      let message = 'Student updated successfully';
      
      // Check if payload has nested student data (regular update) or direct data (promotion update)
      if (action.payload.data && action.payload.data.student) {
        // Regular student update response structure
        updatedStudent = action.payload.data.student;
      } else if (action.payload.data) {
        // Promotion update response structure (direct student object)
        updatedStudent = action.payload.data;
      } else {
        // Fallback - use the entire payload as student data
        updatedStudent = action.payload;
      }
      
      // Extract message if available
      if (action.payload.message) {
        message = action.payload.message;
      } else if (action.payload.msg) {
        message = action.payload.msg;
      }
      
      return {
        ...state,
        loading: false,
        // Update the single student if it exists and IDs match
        student: state.student && state.student._id === updatedStudent._id 
          ? { ...state.student, ...updatedStudent }
          : state.student,
        // Update the student in the students array with null checks
        students: state.students.map(student => 
          student && student._id === updatedStudent._id 
            ? { ...student, ...updatedStudent }
            : student
        ).filter(student => student !== undefined), // Filter out any undefined entries
        message,
        error: null
      };

    case UPDATE_STUDENT_FAIL:
      return {
        ...state,
        loading: false,
        error: payload,
        message: null
      };

    case DELETE_STUDENT_SUCCESS:
      return {
        ...state,
        loading: false,
        students: state.students.filter(student => student._id !== payload.id),
        message: payload.message,
        error: null,
        count: state.count > 0 ? state.count - 1 : 0,
        // Clear student if it was the one being viewed
        student: state.student?._id === payload.id ? null : state.student
      };

    case DELETE_STUDENT_FAIL:
      return {
        ...state,
        loading: false,
        error: payload,
        message: null
      };

    case SEARCH_STUDENTS_SUCCESS:
      return {
        ...state,
        loading: false,
        searchResults: payload.data,
        error: null
      };

    case SEARCH_STUDENTS_FAIL:
      return {
        ...state,
        loading: false,
        error: payload,
        searchResults: []
      };

    case CLEAR_STUDENTS:
      return {
        ...state,
        students: [],
        student: null,
        searchResults: [],
        count: 0,
        error: null,
        message: null
      };

    case CLEAR_STUDENT_ERRORS:
      return {
        ...state,
        error: null,
        message: null
      };

    case STUDENT_ERROR:
      return {
        ...state,
        loading: false,
        error: payload
      };

    default:
      return state;
  }
};

export default studentReducer;
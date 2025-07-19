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
  GRADE_SEARCH_STUDENTS_FAIL,GRADE_SEARCH_STUDENTS_SUCCESS
} from '../actions/types.js';

const initialState = {
  // Data
  grades: [],
  currentGrade: null,
  studentGrades: [],
  studentPerformance: null,
  classPerformance: null,
  
  // UI State
  loading: false,
  error: null,
  message: null,
  
  // Pagination
  pagination: {
    current: 1,
    pages: 1,
    total: 0
  },
  
  // Filters
  filters: {
    academicYear: '',
    term: '',
    admissionNumber:'',
    gradeLevel: '',
    department: '',
    student: ''
  },
  
  // Operation status
  createSuccess: false,
  updateSuccess: false,
  deleteSuccess: false
};

const gradeReducer = (state = initialState, action) => {
  switch (action.type) {
    case GRADE_SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };

    case GRADE_SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };

    case GRADE_CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case CLEAR_GRADE_ERRORS:
      return {
        ...state,
        error: null,
        message: null
      };

    case CLEAR_GRADES:
      return {
        ...state,
        grades: [],
        currentGrade: null,
        studentGrades: [],
        studentPerformance: null,
        classPerformance: null,
        error: null,
        message: null,
        students: [],
      };

    case GRADE_SET_PAGINATION:
      return {
        ...state,
        pagination: action.payload
      };

    case GRADE_SET_FILTERS:
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload
        }
      };

    case GRADE_CLEAR_FILTERS:
      return {
        ...state,
        filters: {
          academicYear: '',
          term: '',
          gradeLevel: '',
          department: '',
          student: ''
        }
      };

    // Create Grade
    case CREATE_GRADE_SUCCESS:
      return {
        ...state,
        grades: [action.payload.data, ...state.grades],
        createSuccess: true,
        message: action.payload.message,
        error: null,
        loading: false
      };

    case CREATE_GRADE_FAIL:
      return {
        ...state,
        error: action.payload,
        createSuccess: false,
        loading: false
      };

    // Get All Grades
    case GET_ALL_GRADES_SUCCESS:
      return {
        ...state,
        grades: action.payload.data,
        pagination: action.payload.pagination || state.pagination,
        error: null,
        loading: false
      };

    case GET_ALL_GRADES_FAIL:
      return {
        ...state,
        error: action.payload,
        grades: [],
        loading: false
      };

    // Get Grade By ID
    case GET_GRADE_BY_ID_SUCCESS:
      return {
        ...state,
        currentGrade: action.payload.data,
        error: null,
        loading: false
      };

    case GET_GRADE_BY_ID_FAIL:
      return {
        ...state,
        error: action.payload,
        currentGrade: null,
        loading: false
      };

    // Update Grade
    case UPDATE_GRADE_SUCCESS:
      return {
        ...state,
        grades: state.grades.map(grade =>
          grade._id === action.payload.data._id ? action.payload.data : grade
        ),
        currentGrade: state.currentGrade?._id === action.payload.data._id 
          ? action.payload.data 
          : state.currentGrade,
        updateSuccess: true,
        message: action.payload.message,
        error: null,
        loading: false
      };

    case UPDATE_GRADE_FAIL:
      return {
        ...state,
        error: action.payload,
        updateSuccess: false,
        loading: false
      };

    // Delete Grade
    case DELETE_GRADE_SUCCESS:
      return {
        ...state,
        grades: state.grades.filter(grade => grade._id !== action.payload.gradeId),
        currentGrade: state.currentGrade?._id === action.payload.gradeId 
          ? null 
          : state.currentGrade,
        deleteSuccess: true,
        message: action.payload.message,
        error: null,
        loading: false
      };

    case DELETE_GRADE_FAIL:
      return {
        ...state,
        error: action.payload,
        deleteSuccess: false,
        loading: false
      };

    // Student Grades
    case GET_STUDENT_GRADES_SUCCESS:
      return {
        ...state,
        studentGrades: action.payload.data,
        error: null,
        loading: false
      };

    case GET_STUDENT_GRADES_FAIL:
      return {
        ...state,
        error: action.payload,
        studentGrades: [],
        loading: false
      };

    // Student Performance
    case GET_STUDENT_PERFORMANCE_SUCCESS:
      return {
        ...state,
        studentPerformance: action.payload.data,
        error: null,
        loading: false
      };

    case GET_STUDENT_PERFORMANCE_FAIL:
      return {
        ...state,
        error: action.payload,
        studentPerformance: null,
        loading: false
      };

    // Class Performance
    case GET_CLASS_PERFORMANCE_SUCCESS:
      return {
        ...state,
        classPerformance: action.payload.data,
        error: null,
        loading: false
      };

    case GET_CLASS_PERFORMANCE_FAIL:
      return {
        ...state,
        error: action.payload,
        classPerformance: null,
        loading: false
      };
    case GRADE_SEARCH_STUDENTS_SUCCESS:
      return {
        ...state,
        students: action.payload.data,
        error: null,
        loading: false
      };
    case GRADE_SEARCH_STUDENTS_FAIL:
      return {
        ...state,
        students: [],
        error: action.payload,
        loading: false
      };

    default:
      return state;
  }
};

export default gradeReducer;
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
  GET_STATS_FAIL,
  GET_PROMOTION_PREVIEW_REQUEST ,
 GET_PROMOTION_PREVIEW_SUCCESS ,
 GET_PROMOTION_PREVIEW_FAIL,
 PROCESS_STUDENT_PROMOTION_REQUEST,
PROCESS_STUDENT_PROMOTION_SUCCESS ,
PROCESS_STUDENT_PROMOTION_FAIL,
GET_YEARLY_AVERAGES_REQUEST ,
 GET_YEARLY_AVERAGES_SUCCESS,
 GET_YEARLY_AVERAGES_FAIL ,
PROCESS_BATCH_PROMOTIONS_REQUEST ,
 PROCESS_BATCH_PROMOTIONS_SUCCESS,
PROCESS_BATCH_PROMOTIONS_FAIL,
GET_ELIGIBLE_STUDENTS_REQUEST ,
 GET_ELIGIBLE_STUDENTS_SUCCESS ,
 GET_ELIGIBLE_STUDENTS_FAIL ,
CLEAR_PROMOTION_DATA,
 GET_STUDENT_DOCUMENTS_REQUEST,
  GET_STUDENT_DOCUMENTS_SUCCESS,
  GET_STUDENT_DOCUMENTS_FAIL,
  CLEAR_STUDENT_DOCUMENTS
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
  promotionPreview: null,
  yearlyAverages: null,
  eligibleStudents: null,
  batchPromotionResult: null,
  promotionLoading: false,
  promotionError: null,
  documents: null,
  documentsLoading: false,
  documentsError: null,
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
      case GET_PROMOTION_PREVIEW_REQUEST:
      return {
        ...state,
        promotionLoading: true,
        promotionError: null
      };
    case GET_PROMOTION_PREVIEW_SUCCESS:
      return {
        ...state,
        promotionLoading: false,
        promotionPreview: payload.data,
        promotionError: null
      };
    case GET_PROMOTION_PREVIEW_FAIL:
      return {
        ...state,
        promotionLoading: false,
        promotionError: payload,
        promotionPreview: null
      };

    // Process Student Promotion Cases
    case PROCESS_STUDENT_PROMOTION_REQUEST:
      return {
        ...state,
        promotionLoading: true,
        promotionError: null
      };
    case PROCESS_STUDENT_PROMOTION_SUCCESS:
      return {
        ...state,
        promotionLoading: false,
        promotionError: null,
        // Update the student in the students array if it exists
        students: state.students.map(student =>
          student._id === payload.data.updatedStudent.id
            ? { ...student, ...payload.data.updatedStudent }
            : student
        )
      };
    case PROCESS_STUDENT_PROMOTION_FAIL:
      return {
        ...state,
        promotionLoading: false,
        promotionError: payload
      };

    // Yearly Averages Cases
    case GET_YEARLY_AVERAGES_REQUEST:
      return {
        ...state,
        promotionLoading: true,
        promotionError: null
      };
    case GET_YEARLY_AVERAGES_SUCCESS:
      return {
        ...state,
        promotionLoading: false,
        yearlyAverages: payload.data,
        promotionError: null
      };
    case GET_YEARLY_AVERAGES_FAIL:
      return {
        ...state,
        promotionLoading: false,
        promotionError: payload,
        yearlyAverages: null
      };

    // Batch Promotions Cases
    case PROCESS_BATCH_PROMOTIONS_REQUEST:
      return {
        ...state,
        promotionLoading: true,
        promotionError: null
      };
    case PROCESS_BATCH_PROMOTIONS_SUCCESS:
      return {
        ...state,
        promotionLoading: false,
        batchPromotionResult: payload.data,
        promotionError: null
      };
    case PROCESS_BATCH_PROMOTIONS_FAIL:
      return {
        ...state,
        promotionLoading: false,
        promotionError: payload,
        batchPromotionResult: null
      };

    // Eligible Students Cases
    case GET_ELIGIBLE_STUDENTS_REQUEST:
      return {
        ...state,
        promotionLoading: true,
        promotionError: null
      };
    case GET_ELIGIBLE_STUDENTS_SUCCESS:
      return {
        ...state,
        promotionLoading: false,
        eligibleStudents: payload.data,
        promotionError: null
      };
    case GET_ELIGIBLE_STUDENTS_FAIL:
      return {
        ...state,
        promotionLoading: false,
        promotionError: payload,
        eligibleStudents: null
      };

            case GET_STUDENT_DOCUMENTS_REQUEST:
       return {
    ...state,
    documentsLoading: true,
    documentsError: null
  };

case GET_STUDENT_DOCUMENTS_SUCCESS:
  return {
    ...state,
    documentsLoading: false,
    documents: action.payload,
    documentsError: null
  };

case GET_STUDENT_DOCUMENTS_FAIL:
  return {
    ...state,
    documentsLoading: false,
    documentsError: action.payload,
    documents: null
  };

case CLEAR_STUDENT_DOCUMENTS:
  return {
    ...state,
    documents: null,
    documentsError: null,
    documentsLoading: false
  };

    // Clear promotion data
    case CLEAR_PROMOTION_DATA:
      return {
        ...state,
        promotionPreview: null,
        yearlyAverages: null,
        eligibleStudents: null,
        batchPromotionResult: null,
        promotionError: null
      };

    default:
      return state;
  }
};

export default studentReducer;
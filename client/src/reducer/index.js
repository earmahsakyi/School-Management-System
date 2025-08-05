import { combineReducers } from "redux";
import authReducer from "./authReducer";
import adminReducer from "./adminReducer";
import studentReducer from "./studentReducer";
import staffReducer from "./staffReducer";
import gradeReducer from "./gradeReducer";
import announcementReducer from "./announcementReducer";
import passcodeReducer from "./passcodeReducer";



const appReducer = combineReducers({
  auth: authReducer,
  admin: adminReducer,
  student: studentReducer,
  staff: staffReducer,
  grade: gradeReducer,
  announcement: announcementReducer,
  passcode: passcodeReducer,
 
});

const rootReducer = (state, action) => {
  if (action.type === 'LOGOUT') {
    return appReducer(undefined, action); 
  }
  return appReducer(state, action);
};

export default rootReducer;

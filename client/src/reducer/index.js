import { combineReducers } from "redux";
import authReducer from "./authReducer";
import adminReducer from "./adminReducer";


const appReducer = combineReducers({
  auth: authReducer,
  admin: adminReducer,
 
});

const rootReducer = (state, action) => {
  if (action.type === 'LOGOUT') {
    return appReducer(undefined, action); 
  }
  return appReducer(state, action);
};

export default rootReducer;

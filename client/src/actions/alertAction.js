export const SET_ALERT = 'SET_ALERT';
export const REMOVE_ALERT = 'REMOVE_ALERT';

   export const setAlert = (msg, type) => (dispatch) => {
     dispatch({
       type: SET_ALERT,
       payload: { msg, type },
     });
     setTimeout(() => dispatch({ type: REMOVE_ALERT }), 5000); // Auto-remove after 5s
   };
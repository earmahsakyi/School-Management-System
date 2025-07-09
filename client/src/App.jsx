import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Store from './store';
import { Toaster } from 'react-hot-toast';
import { Provider,useDispatch } from 'react-redux';
import Home from './components/layout/Home';
import Register from './components/auth/Register';
import VerifyEmail from './components/auth/VerifyEmail';
// import { loadUser } from './actions/authAction'; 

const AppInner = () => {
  const dispatch = useDispatch();

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
 
    </Routes>
  );
};

const App = () => {
  return (
    <Provider store={Store}>
      <Router>
        <AppInner />
          <Toaster position="top-right" /> 
      </Router>
    </Provider>
  );
};

export default App;

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Store from './store';
import {Toaster} from "react-hot-toast"
import { Provider,useDispatch } from 'react-redux';
import Home from './components/layout/Home';
import LandingPage from './components/layout/LandingPage'
import Register from './components/auth/Register';
import PrivateRoute from './components/routing/PrivateRoute'
import Students from './components/student/Student';
import VerifyEmail from './components/auth/VerifyEmail';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import AdminProfileForm from './components/auth/AdminProfileForm';
import Staff from './components/staff/Staff';
import AdminPage from './components/dashboard/AdminPage';
import StudentReportCard from './components/student/StudentReportCard';
import AdminPromotionView from './components/auth/AdminPromotionView';
import GradesPage from './components/grade/GradePage';
import GradeSection from './components/grade/GradeSection';
import ClassPerformancePage from './components/grade/ClassPerfomancePage';
import StudentPerformancePage from './components/grade/StudentPerformancePage';
 import { loadUser } from './actions/authAction'; 
 

const AppInner = () => {
  const dispatch = useDispatch();

  useEffect(() => {
   const token = localStorage.getItem('token');
    if (token) {
      dispatch(loadUser());
    }
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/complete-admin-profile" element={<PrivateRoute element={AdminProfileForm} />} />
      <Route path="/students" element={<PrivateRoute element={Students} />} />
      <Route path="/staff" element={<PrivateRoute element={Staff} />} />
      <Route path="/grade-section" element={<PrivateRoute element={GradeSection} />} />
      <Route path="/admin-dashboard" element={<PrivateRoute element={AdminPage} />} />
      <Route path="/class-performance" element={<PrivateRoute element={ClassPerformancePage} />} />
      <Route path="/student-performance" element={<PrivateRoute element={StudentPerformancePage} />} />
      <Route path="/grades" element={<PrivateRoute element={GradesPage} />} />
      <Route path="/report-card/:studentId/:academicYear" element={<PrivateRoute element={StudentReportCard} />} />
      <Route path="/admin/promotion/:studentId" element={<PrivateRoute element={AdminPromotionView} />} />
 
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

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
import AdminPromotionView from './components/auth/AdminPromotionView';
import GradesPage from './components/grade/GradePage';
import GradeSection from './components/grade/GradeSection';
import ClassPerformancePage from './components/grade/ClassPerfomancePage';
import RoosterSummary from './components/staff/RosterSummary';
import ReportCardsList from './components/student/ReportCardList';
import TranscriptList from './components/student/TranscriptList';
import StudentPerformancePage from './components/grade/StudentPerformancePage';
import MasterGradeSheet from './components/staff/MasterGradeSheet';
import PaymentsPage from './components/payment/PaymentPage';
import OtherPayment from './components/payment/OtherPayment'
import FinancialReport from './components/staff/FinancialReport';
import PromotionDashboard from './components/dashboard/PromotionDasboard';
import TvetPaymentsPage from './components/payment/TvetPaymentPage';
import ParentDashboard from './components/dashboard/ParentDashboard';
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
      <Route path="/transcript" element={<PrivateRoute element={TranscriptList} />} />
      <Route path="/admin/promotion/:studentId" element={<PrivateRoute element={AdminPromotionView} />} />
      <Route path="/reportCards" element={<PrivateRoute element={ReportCardsList} />} />
      <Route path="/grade-sheet" element={<PrivateRoute element={MasterGradeSheet} />} />
      <Route path="/roster-summary" element={<PrivateRoute element={RoosterSummary} />} />
      <Route path="/payments" element={<PrivateRoute element={PaymentsPage} />} />
      <Route path="/financial-report" element={<PrivateRoute element={FinancialReport} />} />
      <Route path="/promotion" element={<PrivateRoute element={PromotionDashboard} />} />
      <Route path="/other-payments" element={<PrivateRoute element={OtherPayment} />} />
      <Route path="/tvet-payments" element={<PrivateRoute element={TvetPaymentsPage} />} />
      <Route path="/parent-dashboard" element={<PrivateRoute element={ParentDashboard} />} />
 
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

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Store from './store';
import {Toaster} from "react-hot-toast"
import { Provider,useDispatch } from 'react-redux';
import Home from './components/layout/Home';
import LandingPage from './components/layout/LandingPage'
import Register from './components/auth/Register';
import PrivateRoute from './components/routing/PrivateRoute';
import PasscodeProtectedRoute from './components/routing/PasscodeProtectedRoute';
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
import TvetFinancialReport from './components/staff/TvetFinancialReport';
 import { loadUser } from './actions/authAction'; 
 import StaffDocuments from './components/staff/StaffDocuments';
 import StudentDocuments from './components/student/StudentDocuments';
 

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
      <Route path="/admin-dashboard" element={<PrivateRoute element={AdminPage} />} />
      <Route path="/class-performance" element={<PrivateRoute element={ClassPerformancePage} />} />
      <Route path="/student-performance" element={<PrivateRoute element={StudentPerformancePage} />} />
      <Route path="/grades" element={<PrivateRoute element={GradesPage} />} />
      <Route path="/admin/promotion/:studentId" element={<PrivateRoute element={AdminPromotionView} />} />
      <Route path="/reportCards" element={<PrivateRoute element={ReportCardsList} />} />
      <Route path="/parent-dashboard" element={<PrivateRoute element={ParentDashboard} />} />
      <Route path="/tvet-report" element={<PrivateRoute element={TvetFinancialReport} />} />
      <Route path="/staff/:id/documents" element={<PrivateRoute element={StaffDocuments} />} />
      <Route path="/student/:id/documents" element={<PrivateRoute element={StudentDocuments} />} />
      <Route
  path="/students"
  element={
    <PrivateRoute>
      <PasscodeProtectedRoute section="students">
        <Students />
      </PasscodeProtectedRoute>
    </PrivateRoute>
  }
/>

<Route
  path="/staff"
  element={
    <PrivateRoute>
      <PasscodeProtectedRoute section="staff">
        <Staff />
      </PasscodeProtectedRoute>
    </PrivateRoute>
  }
/>

<Route
  path="/grade-section"
  element={
    <PrivateRoute>
      <PasscodeProtectedRoute section="grade-section">
        <GradeSection />
      </PasscodeProtectedRoute>
    </PrivateRoute>
  }
/>

<Route
  path="/transcript"
  element={
    <PrivateRoute>
      <PasscodeProtectedRoute section="transcript">
        <TranscriptList />
      </PasscodeProtectedRoute>
    </PrivateRoute>
  }
/>

<Route
  path="/admin/promotion/:studentId"
  element={
    <PrivateRoute>
      <PasscodeProtectedRoute section="promotion">
        <AdminPromotionView />
      </PasscodeProtectedRoute>
    </PrivateRoute>
  }
/>

<Route
  path="/grade-sheet"
  element={
    <PrivateRoute>
      <PasscodeProtectedRoute section="grade-sheet">
        <MasterGradeSheet />
      </PasscodeProtectedRoute>
    </PrivateRoute>
  }
/>

<Route
  path="/roster-summary"
  element={
    <PrivateRoute>
      <PasscodeProtectedRoute section="roster-summary">
        <RoosterSummary />
      </PasscodeProtectedRoute>
    </PrivateRoute>
  }
/>

<Route
  path="/payments"
  element={
    <PrivateRoute>
      <PasscodeProtectedRoute section="payments">
        <PaymentsPage />
      </PasscodeProtectedRoute>
    </PrivateRoute>
  }
/>

<Route
  path="/financial-report"
  element={
    <PrivateRoute>
      <PasscodeProtectedRoute section="financial-report">
        <FinancialReport />
      </PasscodeProtectedRoute>
    </PrivateRoute>
  }
/>

<Route
  path="/promotion"
  element={
    <PrivateRoute>
      <PasscodeProtectedRoute section="promotion">
        <PromotionDashboard />
      </PasscodeProtectedRoute>
    </PrivateRoute>
  }
/>

<Route
  path="/other-payments"
  element={
    <PrivateRoute>
      <PasscodeProtectedRoute section="other-payments">
        <OtherPayment />
      </PasscodeProtectedRoute>
    </PrivateRoute>
  }
/>

<Route
  path="/tvet-payments"
  element={
    <PrivateRoute>
      <PasscodeProtectedRoute section="tvet-payments">
        <TvetPaymentsPage />
      </PasscodeProtectedRoute>
    </PrivateRoute>
  }
/>
 
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

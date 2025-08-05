import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import PasscodeModal from './PasscodeModal';

export default function PasscodeProtectedRoute({ section, children }) {
  const navigate = useNavigate();
  const { access } = useSelector((state) => state.passcode);
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  const [showModal, setShowModal] = useState(false);
  const hasAccess = access[section] === true;

  // Check access when component mounts or when access state changes
  useEffect(() => {
    if (isAuthenticated) {
      if (!hasAccess) {
        setShowModal(true);
      } else {
        setShowModal(false);
      }
    }
  }, [hasAccess, isAuthenticated]);

  // If not authenticated, let PrivateRoute handle the redirect
  if (!isAuthenticated) {
    return null;
  }

  // If user doesn't have access and modal is showing
  if (!hasAccess && showModal) {
    return (
      <PasscodeModal 
        section={section} 
        onClose={() => {
          setShowModal(false);
          // Redirect to dashboard or previous page when modal is closed
          navigate('/admin-dashboard');
        }}
        onSuccess={() => {
          setShowModal(false);
        }}
      />
    );
  }

  // If user doesn't have access and modal is not showing (cancelled)
  if (!hasAccess && !showModal) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">
            You don't have access to this section.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Enter Passcode
          </button>
        </div>
      </div>
    );
  }

  // User has access, render the children
  return children;
}
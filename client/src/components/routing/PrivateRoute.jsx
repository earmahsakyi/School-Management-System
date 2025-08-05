import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { Stars } from 'lucide-react'

const PrivateRoute = ({ children, element: Component }) => {
  const { isAuthenticated, loading, token } = useSelector((state) => state.auth);

  // If we're still loading and have a token, show loader
  if (loading && token) return <div className="flex items-center justify-center min-h-[40vh] text-gray-500 text-lg">
        <Stars className="animate-spin mr-2 w-6 h-6 text-blue-500" /> Loading your Dashboard...
      </div> ;
  
  // If no token exists, redirect to login
  if (!token) return <Navigate to="/" />;
  
  //If we have a token but auth check failed
  if (!isAuthenticated && token) return <div className="flex items-center justify-center min-h-[40vh] text-gray-500 text-lg">
        <Stars className="animate-spin mr-2 w-6 h-6 text-blue-500" /> Loading ...
      </div>;

  // If authenticated, render the component or children
  return children || <Component />;
};

export default PrivateRoute;
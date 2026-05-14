import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function PrivateRoute({ children, allowedRoles }) {
  const { authLoading, isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (authLoading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/profile" state={{ unauthorized: true }} replace />;
  }

  return children;
}

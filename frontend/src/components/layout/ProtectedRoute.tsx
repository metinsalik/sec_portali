import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useApi } from '@/context/ApiContext';

type ProtectedRouteProps = {
  allowedRoles?: string[];
};

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useApi();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Yükleniyor...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = allowedRoles.some((role) => user.roles.includes(role));
    
    if (!hasRole) {
      if (user.roles.includes('specialist') || user.roles.includes('physician') || user.roles.includes('dsp')) {
        return <Navigate to="/operations/dashboard" replace />;
      }
      return <Navigate to="/panel/dashboard" replace />;
    }
  }

  return <Outlet />;
};

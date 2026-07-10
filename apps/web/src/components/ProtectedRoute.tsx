import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Erişime izin verilen roller. Boşsa: tüm giriş yapmış kullanıcılar */
  allowedRoles?: string[];
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireAdmin,
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const hasAdminAccess = user.isAdmin || user.roles.includes('admin') || user.roles.includes('management');

  if (requireAdmin && !hasAdminAccess) {
    return <Navigate to="/portal" replace />;
  }

  // Dinamik modül kontrolü
  let requiredModule = '';
  if (location.pathname.startsWith('/hazmat')) requiredModule = 'HAZMAT';
  else if (location.pathname.startsWith('/fire-equipment')) requiredModule = 'FIRE_EQUIPMENT';
  else if (location.pathname.startsWith('/build-management')) requiredModule = 'BUILD_MANAGEMENT';
  else if (location.pathname.startsWith('/bina-turu')) requiredModule = 'BUILDING_TOUR';
  else if (location.pathname.startsWith('/operations')) requiredModule = 'OPERATIONS';
  else if (location.pathname.startsWith('/workflow')) requiredModule = 'WORKFLOW';
  else if (location.pathname.startsWith('/panel')) requiredModule = 'PANEL';

  const hasModuleAccess = requiredModule ? (user.modules?.includes(requiredModule) || false) : false;

  // Eğer modül gereksinimi varsa ve admin değilse, modül yetkisi yoksa reddet
  if (requiredModule && !hasAdminAccess && !hasModuleAccess) {
    return <Navigate to="/portal" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = allowedRoles.some((role) => user.roles.includes(role));
    // Eğer role sahip değilse VE admin değilse VE ilgili modüle özel yetkisi YOKSA reddet
    if (!hasRole && !hasAdminAccess && !hasModuleAccess) {
      return <Navigate to="/portal" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;

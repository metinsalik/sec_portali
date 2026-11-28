import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Erişime izin verilen roller. Boşsa: tüm giriş yapmış kullanıcılar */
  allowedRoles?: string[];
  requireAdmin?: boolean;
}

const POST_LOGIN_REDIRECT_KEY = 'post_login_redirect';

function AccessDeniedView({ reason }: { reason?: string }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm space-y-5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive border border-destructive/20">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Bu Alan İçin Yetkiniz Yok
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Görüntülemeye çalıştığınız sayfa veya işlem için gerekli erişim yetkiniz bulunmamaktadır.
          </p>
          {reason && (
            <p className="text-xs font-medium text-muted-foreground/80 bg-muted/60 rounded-md px-3 py-1.5 inline-block">
              {reason}
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Geri Dön
          </Button>
          <Button
            type="button"
            onClick={() => navigate('/portal', { replace: true })}
            className="w-full sm:w-auto gap-1.5"
          >
            <Home className="h-4 w-4" />
            Ana Sayfaya Dön
          </Button>
        </div>
      </div>
    </div>
  );
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
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    const targetUrl = `${location.pathname}${location.search}${location.hash}`;
    if (targetUrl && targetUrl !== '/login') {
      try {
        sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, targetUrl);
      } catch {
        // ignore storage errors
      }
    }
    const loginPath =
      targetUrl && targetUrl !== '/login' && targetUrl !== '/'
        ? `/login?redirect=${encodeURIComponent(targetUrl)}`
        : '/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  const hasAdminAccess =
    user.isAdmin || user.roles.includes('admin') || user.roles.includes('management');

  if (requireAdmin && !hasAdminAccess) {
    return <AccessDeniedView reason="Yönetici yetkisi gereklidir." />;
  }

  // Dinamik modül kontrolü
  let requiredModule = '';
  if (location.pathname.startsWith('/safety-management/electric-infrastructure')) {
    if (!hasAdminAccess) {
      return <AccessDeniedView reason="Bu modül yalnızca yöneticilere açıktır." />;
    }
  } else if (
    location.pathname.startsWith('/operations-management/thermal-camera') ||
    location.pathname.startsWith('/safety-management/thermal-camera')
  ) {
    const hasThermalAccess =
      hasAdminAccess ||
      user.modules?.includes('ELECTRIC_PANEL_INSPECTION') ||
      user.modules?.includes('THERMAL_CAMERA') ||
      user.modules?.includes('ELECTRIC_INFRASTRUCTURE');
    if (!hasThermalAccess) {
      return <AccessDeniedView reason="Termal Kamera modülü yetkisi gereklidir." />;
    }
  } else if (location.pathname.startsWith('/hazmat') || location.pathname.startsWith('/inventory')) requiredModule = 'HAZMAT';
  else if (location.pathname.startsWith('/fire-equipment')) requiredModule = 'FIRE_EQUIPMENT';
  else if (location.pathname.startsWith('/build-management')) requiredModule = 'BUILD_MANAGEMENT';
  else if (location.pathname.startsWith('/renovation-report')) requiredModule = 'RENOVATION_REPORT';
  else if (location.pathname.startsWith('/bina-turu')) requiredModule = 'BUILDING_TOUR';
  else if (location.pathname.startsWith('/operations-management/improvements')) requiredModule = 'IMPROVEMENTS_TRACKING';
  else if (location.pathname.startsWith('/operations-management')) requiredModule = '';
  else if (location.pathname.startsWith('/operations')) requiredModule = 'OPERATIONS';
  else if (location.pathname.startsWith('/workflow')) requiredModule = 'WORKFLOW';
  else if (location.pathname.startsWith('/panel')) requiredModule = 'PANEL';
  else if (location.pathname.startsWith('/checklists')) requiredModule = 'CHECKLISTS';
  else if (location.pathname.startsWith('/safety-management/isg-defter')) requiredModule = 'ISG_DEFTER';
  else if (location.pathname.startsWith('/fire-safety-control')) requiredModule = 'FIRE_SAFETY_CONTROL';
  else if (location.pathname.startsWith('/fm200')) requiredModule = 'FM200_TRACKING';
  else if (location.pathname === '/transfer') requiredModule = 'FILE_TRANSFER';

  const hasModuleAccess = requiredModule ? user.modules?.includes(requiredModule) || false : false;

  // Eğer modül gereksinimi varsa ve admin değilse, modül yetkisi yoksa reddet
  if (requiredModule && !hasAdminAccess && !hasModuleAccess) {
    return <AccessDeniedView reason={`Gerekli modül yetkisi: ${requiredModule}`} />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = allowedRoles.some((role) => user.roles.includes(role));
    if (!hasRole && !hasAdminAccess && !hasModuleAccess) {
      return <AccessDeniedView />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;

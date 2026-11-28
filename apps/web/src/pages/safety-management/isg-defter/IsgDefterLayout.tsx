import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { FacilitySwitcher } from '@/components/layout/FacilitySwitcher';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  BookOpen,
  Settings,
  ArrowLeft,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutGrid,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/layout/NotificationBell';

export default function IsgDefterLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('isg_defter_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('isg_defter_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const hasAdminAccess =
    user?.isAdmin ||
    user?.isManagement ||
    user?.roles?.includes('admin') ||
    user?.roles?.includes('management');

  const navItems = [
    {
      title: 'Dashboard',
      href: '/safety-management/isg-defter',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      title: 'Defter Kayıtları',
      href: '/safety-management/isg-defter/records',
      icon: BookOpen,
      exact: false,
    },
  ];

  if (hasAdminAccess) {
    navItems.push({
      title: 'Modül Ayarları',
      href: '/safety-management/isg-defter/settings',
      icon: Settings,
      exact: false,
    });
  }

  const isActive = (href: string, exact: boolean) => {
    if (exact) return location.pathname === href;
    return location.pathname.startsWith(href);
  };

  const activeTitle =
    navItems.find((item) => isActive(item.href, item.exact))?.title ||
    (location.pathname.includes('/items/') ? 'Tespit Detayı' : 'Tespit ve Öneri Defteri');

  const renderSidebarContent = (isCollapsed: boolean) => (
    <>
      <div className={cn('h-14 px-3 border-b border-border flex items-center justify-between gap-2 shrink-0')}>
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 border border-primary/20">
              İSG
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold tracking-tight truncate">HSE Portalı</span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">
                Tespit ve Öneri Defteri
              </span>
            </div>
          </div>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          className={cn('h-8 w-8 shrink-0 hidden md:inline-flex', isCollapsed && 'mx-auto')}
          title={isCollapsed ? 'Menüyü Genişlet' : 'Menüyü Daralt'}
        >
          {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(false)}
          className="h-8 w-8 shrink-0 md:hidden"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {!isCollapsed && (
          <>
            <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Tesis Seçimi
            </div>
            <FacilitySwitcher />
            <div className="mt-6 px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Tespit ve Öneri Defteri
            </div>
          </>
        )}

        <nav className={cn('space-y-1', isCollapsed ? 'px-2' : 'px-2')}>
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Button
                key={item.href}
                variant={active ? 'default' : 'ghost'}
                title={isCollapsed ? item.title : undefined}
                className={cn(
                  'w-full',
                  isCollapsed ? 'justify-center px-0 h-10' : 'justify-start',
                  active && 'bg-primary text-primary-foreground hover:bg-primary/90 font-medium'
                )}
                onClick={() => {
                  navigate(item.href);
                  setMobileMenuOpen(false);
                }}
              >
                <item.icon className={cn('h-4 w-4 shrink-0', !isCollapsed && 'mr-2')} />
                {!isCollapsed && <span className="truncate">{item.title}</span>}
              </Button>
            );
          })}
        </nav>
      </div>

      <div className="p-2 border-t border-border shrink-0">
        <Button
          type="button"
          variant="ghost"
          title={isCollapsed ? 'İş Güvenliği Modülleri' : undefined}
          className={cn(
            'w-full text-muted-foreground hover:text-foreground',
            isCollapsed ? 'justify-center px-0 h-9' : 'justify-start h-9 text-xs'
          )}
          onClick={() => navigate('/safety-management')}
        >
          <ArrowLeft className={cn('h-4 w-4 shrink-0', !isCollapsed && 'mr-2')} />
          {!isCollapsed && <span className="truncate">İş Güvenliği Yönetimi</span>}
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex border-r border-border bg-card flex-col h-full shrink-0 transition-all duration-200',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {renderSidebarContent(collapsed)}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative z-10 w-64 bg-card border-r border-border flex flex-col h-full">
            {renderSidebarContent(false)}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 sm:px-6 shrink-0 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden h-8 w-8 shrink-0"
              title="Menüyü Aç"
            >
              <Menu className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate('/portal')}
              className="h-8 gap-1.5 text-xs font-medium shrink-0"
            >
              <LayoutGrid className="h-3.5 w-3.5 text-primary" />
              <span>Uygulamalar</span>
            </Button>

            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 hidden sm:block" />

            <button
              type="button"
              onClick={() => navigate('/safety-management')}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block truncate"
            >
              İş Güvenliği
            </button>

            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />

            <h1 className="text-sm font-semibold text-foreground truncate">
              {activeTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <ThemeToggle />
            <NotificationBell />
            <div className="text-xs sm:text-sm hidden sm:block">
              <span className="text-muted-foreground">Kullanıcı: </span>
              <span className="font-medium text-foreground">{user?.fullName || user?.username}</span>
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

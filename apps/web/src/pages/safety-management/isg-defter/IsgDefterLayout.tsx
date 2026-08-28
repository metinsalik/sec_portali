import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { FacilitySwitcher } from '@/components/layout/FacilitySwitcher';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  BookOpen, 
  Settings,
  ArrowLeft 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/layout/NotificationBell';

export default function IsgDefterLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const hasAdminAccess = user?.isAdmin || user?.isManagement || user?.roles?.includes('admin') || user?.roles?.includes('management');

  const navItems = [
    {
      title: 'Dashboard',
      href: '/safety-management/isg-defter',
      icon: LayoutDashboard,
      exact: true
    },
    {
      title: 'Defter Kayıtları',
      href: '/safety-management/isg-defter/records',
      icon: BookOpen,
      exact: false
    }
  ];

  if (hasAdminAccess) {
    navItems.push({
      title: 'Modül Ayarları',
      href: '/safety-management/isg-defter/settings',
      icon: Settings,
      exact: false
    });
  }

  const isActive = (href: string, exact: boolean) => {
    if (exact) return location.pathname === href;
    return location.pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-card flex flex-col h-full flex-shrink-0">
        <div className="p-4 border-b flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/safety-management')} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">HSE PORTALI</span>
            <span className="text-xs text-muted-foreground">İSG Yönetimi</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tesis Seçimi
          </div>
          <FacilitySwitcher />

          <div className="mt-6 px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tespit ve Öneri Defteri
          </div>
          <nav className="space-y-1 px-2">
            {navItems.map((item) => {
              const active = isActive(item.href, item.exact);
              return (
                <Button
                  key={item.href}
                  variant={active ? "default" : "ghost"}
                  className={cn("w-full justify-start", active && "bg-slate-900 text-white hover:bg-slate-800 font-medium")}
                  onClick={() => navigate(item.href)}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-14 border-b bg-card flex items-center justify-between px-6 flex-shrink-0">
          <h1 className="text-lg font-semibold truncate">
            {navItems.find(item => isActive(item.href, item.exact))?.title || 'Tespit ve Öneri Defteri'}
          </h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <NotificationBell />
            <div className="text-sm">
              <span className="text-muted-foreground">Kullanıcı: </span>
              <span className="font-medium">{user?.fullName || user?.username}</span>
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  Shield, LayoutDashboard, Building2, Users, Briefcase, UserCheck,
  ClipboardList, FileText, Settings, Bell, ChevronDown, LogOut,
  User, BarChart3, ChevronRight, LayoutGrid, Database, Users2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AppLayoutProps {
  children: React.ReactNode;
}

const panelNavItems = [
  { label: 'GENEL', type: 'group' },
  { label: 'Dashboard', icon: LayoutDashboard, to: '/panel/dashboard' },
  { label: 'Tesis Yönetimi', icon: Building2, to: '/panel/facilities' },
  { label: 'PERSONEL', type: 'group' },
  { label: 'İSG Profesyonelleri', icon: Users, to: '/panel/professionals' },
  { label: 'İşveren Vekilleri', icon: UserCheck, to: '/panel/employers' },
  { label: 'OSGB Firmaları', icon: Briefcase, to: '/panel/osgb' },
  { label: 'ATAMA', type: 'group' },
  { label: 'Atama Yönetimi', icon: ClipboardList, to: '/panel/assignments' },
  { label: 'Mutabakat', icon: FileText, to: '/panel/reconciliation' },
];

const operationsNavItems = [
  { label: 'GENEL', type: 'group' },
  { label: 'Dashboard', icon: LayoutDashboard, to: '/operations/dashboard' },
  { label: 'VERİ GİRİŞİ', type: 'group' },
  { label: 'Aylık Personel Verisi', icon: Users, to: '/operations/hr-data' },
  { label: 'Kaza İstatistikleri', icon: BarChart3, to: '/operations/accidents' },
  { label: 'KAYITLAR', type: 'group' },
  { label: 'Tespit & Öneri Defteri', icon: ClipboardList, to: '/operations/notebooks' },
  { label: 'Eğitim Takibi', icon: FileText, to: '/operations/training' },
  { label: 'İSG Kurul', icon: Users, to: '/operations/board' },
  { label: 'Ölçüm & Kontrol', icon: Building2, to: '/operations/inspections' },
];

const settingsNavItems = [
  { label: 'GENEL', type: 'group' },
  { label: 'Tesis Yönetimi', icon: Building2, to: '/settings/facilities' },
  { label: 'Kullanıcı Yönetimi', icon: Users2, to: '/settings/users' },
  { label: 'TANIMLAR', type: 'group' },
  { label: 'Parametreler', icon: Settings, to: '/settings/parameters' },
  { label: 'Kategoriler', icon: Database, to: '/settings/definitions' },
];

const profileNavItems = (hasAdminAccess: boolean) => [
  { label: 'UYGULAMALAR', type: 'group' },
  ...(hasAdminAccess ? [{ label: 'İSG Atama Paneli', icon: LayoutDashboard, to: '/panel' }] : []),
  { label: 'Aylık Veri Sistemi', icon: FileText, to: '/operations' },
  { label: 'HESABIM', type: 'group' },
  { label: 'Profil Bilgileri', icon: User, to: '/profile' },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Route'a göre sidebar menüsünü belirle
  const path = location.pathname;
  const hasAdminAccess = user?.isAdmin || user?.isManagement || user?.roles?.includes('admin') || user?.roles?.includes('management');
  
  let navItems = operationsNavItems;
  let moduleName = 'Aylık Veri Sistemi';

  if (path.startsWith('/panel')) {
    navItems = panelNavItems;
    moduleName = 'İSG Atama Paneli';
  } else if (path.startsWith('/settings')) {
    navItems = settingsNavItems;
    moduleName = 'Sistem Ayarları';
  } else if (path.startsWith('/profile')) {
    navItems = profileNavItems(!!hasAdminAccess);
    moduleName = 'Kullanıcı Profili';
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r flex flex-col shrink-0 shadow-sm">
        {/* Logo & Module Name */}
        <div className="h-16 flex flex-col justify-center px-5 border-b">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold tracking-tight text-sm">
              SEÇ PORTALI
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-0.5 ml-8">
            {moduleName}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item, i) => {
            if (item.type === 'group') {
              return (
                <div key={i} className="px-2 pt-5 pb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {item.label}
                </div>
              );
            }
            const Icon = item.icon!;
            return (
              <NavLink
                key={item.to}
                to={item.to!}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors group',
                    isActive
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary transition-colors text-left">
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{user?.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.username}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="w-4 h-4 mr-2" /> Profil
              </DropdownMenuItem>
              {user?.isAdmin && (
                <DropdownMenuItem onClick={() => navigate('/settings/facilities')}>
                  <Settings className="w-4 h-4 mr-2" /> Sistem Ayarları
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4 mr-2" /> Çıkış Yap
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-muted/20">
        {/* Top Header */}
        <header className="h-16 bg-card border-b flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/portal')}
              className="hidden md:flex h-8"
            >
              <LayoutGrid className="w-4 h-4 mr-2 text-muted-foreground" />
              Uygulamalar
            </Button>
            
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground font-medium capitalize">
                {location.pathname.split('/').filter(Boolean).pop()?.replace('-', ' ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
            </Button>
            {user?.isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/settings/facilities')}
                className="gap-2 text-muted-foreground"
              >
                <Settings className="w-4 h-4" />
                Ayarlar
              </Button>
            )}
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

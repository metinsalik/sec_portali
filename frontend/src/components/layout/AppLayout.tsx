import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  Shield, LayoutDashboard, Building2, Users, Briefcase, UserCheck,
  ClipboardList, FileText, Settings, Bell, ChevronDown, LogOut,
  User, BarChart3, ChevronRight, LayoutGrid, Database, Users2, Mail,
  BellRing, Layers, ShieldAlert, AlertTriangle, FolderTree, Droplets, LifeBuoy, PackageOpen, Flame, PenTool, Menu, X, ShoppingCart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationBell } from './NotificationBell';
import { FacilitySwitcher } from './FacilitySwitcher';

interface AppLayoutProps {
  children: React.ReactNode;
}

const panelNavItems = [
  { label: 'GENEL', type: 'group' },
  { label: 'Dashboard', icon: LayoutDashboard, to: '/panel/dashboard', end: true },
  { label: 'Tesis Yönetimi', icon: Building2, to: '/panel/facilities' },
  { label: 'PERSONEL', type: 'group' },
  { label: 'İSG Profesyonelleri', icon: Users, to: '/panel/professionals' },
  { label: 'İşveren Vekilleri', icon: UserCheck, to: '/panel/employers' },
  { label: 'OSGB Firmaları', icon: Briefcase, to: '/panel/osgb' },
  { label: 'ATAMA', type: 'group' },
  { label: 'Atama Yönetimi', icon: ClipboardList, to: '/panel/assignments' },
  { label: 'Mutabakat', icon: FileText, to: '/panel/reconciliation' },
  { label: 'YÖNETİM', type: 'group' },
  { label: 'Modül Ayarları', icon: Settings, to: '/panel/settings' },
];

const operationsNavItems = (hasAdminAccess: boolean) => [
  { label: 'GENEL', type: 'group' },
  { label: 'Dashboard', icon: LayoutDashboard, to: '/operations/dashboard' },
  { label: 'Tesis Bilgileri', icon: Building2, to: '/operations/facility' },
  { label: 'VERİ GİRİŞİ', type: 'group' },
  { label: 'Aylık Personel Verisi', icon: Users, to: '/operations/hr-data' },
  { label: 'Kaza İstatistikleri', icon: BarChart3, to: '/operations/accidents' },
  { label: 'KAYITLAR', type: 'group' },
  { label: 'Olağan Dışı Olaylar', icon: ShieldAlert, to: '/operations/incidents' },
  { label: 'Tespit & Öneri Defteri', icon: ClipboardList, to: '/operations/notebooks' },
  { label: 'Eğitim Takibi', icon: FileText, to: '/operations/training' },
  { label: 'İSG Kurul', icon: Users, to: '/operations/board' },
  { label: 'Ölçüm & Kontrol', icon: Building2, to: '/operations/inspections' },
  ...(hasAdminAccess ? [
    { label: 'YÖNETİM', type: 'group' },
    { label: 'Modül Ayarları', icon: Settings, to: '/operations/settings' },
  ] : []),
];

const settingsNavItems = [
  { label: 'GENEL', type: 'group' },
  { label: 'Tesis Yönetimi', icon: Building2, to: '/settings/facilities' },
  { label: 'Kullanıcı Yönetimi', icon: Users2, to: '/settings/users' },
  { label: 'TANIMLAR', type: 'group' },
  { label: 'Kategoriler', icon: Database, to: '/settings/definitions' },
  { label: 'SİSTEM', type: 'group' },
  { label: 'E-posta Ayarları', icon: Mail, to: '/settings/smtp' },
  { label: 'Bildirim Ayarları', icon: BellRing, to: '/settings/notifications' },
  { label: 'E-posta Şablonları', icon: FileText, to: '/settings/templates' },
  { label: 'Rapor Şablonları', icon: Layers, to: '/settings/reports' },
];

const workflowNavItems = (hasAdminAccess: boolean) => [
  { label: 'GENEL', type: 'group' },
  { label: 'Dashboard', icon: LayoutDashboard, to: '/workflow/dashboard' },
  { label: 'İş Panosu', icon: ClipboardList, to: '/workflow/board' },
  { label: 'İş Havuzu', icon: Users2, to: '/workflow/pool' },
  { label: 'Ekip Özeti', icon: BarChart3, to: '/workflow/team' },
  { label: 'YÖNETİM', type: 'group' },
  { label: 'Modül Ayarları', icon: Settings, to: '/workflow/settings' },
];

const riskNavItems = [
  { label: 'GENEL', type: 'group' },
  { label: 'Dashboard', icon: LayoutDashboard, to: '/risks', end: true },
  { label: 'AYARLAR', type: 'group' },
  { label: 'Modül Ayarları', icon: Settings, to: '/risks/settings' },
];

const hazmatNavItems = [
  { label: 'GENEL', type: 'group' },
  { label: 'Dashboard', icon: LayoutDashboard, to: '/hazmat/dashboard', end: true },
  { label: 'TEHLİKELİ MADDE YÖNETİMİ', type: 'group' },
  { label: 'Envanter', icon: ClipboardList, to: '/hazmat/inventory' },
  { label: 'Departmanlar', icon: LayoutGrid, to: '/hazmat/departments' },
  { label: 'Temizlik Arabaları', icon: ShoppingCart, to: '/hazmat/cleaning-carts' },
  { label: 'Olağan Dışı Olay', icon: ShieldAlert, to: '/hazmat/incidents' },
  { label: 'EKİPMAN YÖNETİMİ', type: 'group' },
  { label: 'Göz Duşu Risk Analizi', icon: FileText, to: '/hazmat/eyewash-risk' },
  { label: 'Dökülme Saçılma Kiti', icon: LifeBuoy, to: '/hazmat/spill-kits' },
  { label: 'AYARLAR', type: 'group' },
  { label: 'Tehlikeli Madde Havuzu', icon: AlertTriangle, to: '/hazmat/materials' },
  { label: 'Kategoriler', icon: FolderTree, to: '/hazmat/settings/categories' },
  { label: 'Miktar Cinsi', icon: Database, to: '/hazmat/settings/units' },
  { label: 'Bölüm - Departman', icon: Settings, to: '/hazmat/settings/departments' },
  { label: 'Kit Malzemeleri', icon: PackageOpen, to: '/hazmat/settings/kit-items' },
];

const fireEquipmentNavItems = [
  { label: 'GENEL', type: 'group' },
  { label: 'Dashboard', icon: LayoutDashboard, to: '/fire-equipment/dashboard', end: true },
  { label: 'YANGIN EKİPMANLARI', type: 'group' },
  { label: 'Ekipmanlar', icon: Flame, to: '/fire-equipment/list' },
  { label: 'Bakım ve Kontroller', icon: PenTool, to: '/fire-equipment/maintenance' },
  { label: 'AYARLAR', type: 'group' },
  { label: 'Modül Ayarları', icon: Settings, to: '/fire-equipment/settings' },
];

const binaTuruNavItems = [
  { label: 'GENEL', type: 'group' },
  { label: 'Dashboard', icon: LayoutDashboard, to: '/bina-turu', end: true },
  { label: 'Turlar', icon: Building2, to: '/bina-turu/turler', end: true },
  { label: 'Yeni Tur Oluştur', icon: FileText, to: '/bina-turu/turler/olustur' },
  { label: 'UYGUNSUZLUK', type: 'group' },
  { label: 'Uygunsuzluk Takibi', icon: AlertTriangle, to: '/bina-turu/uygunsuzluklar' },
  { label: 'AYARLAR', type: 'group' },
  { label: 'Modül Ayarları', icon: Settings, to: '/bina-turu/ayarlar' },
];

const buildManagementNavItems = [
  { label: 'GENEL', type: 'group' },
  { label: 'Dashboard', icon: LayoutDashboard, to: '/build-management/dashboard', end: true },
  { label: '1. BÖLÜM: PLANLAMA', type: 'group' },
  { label: 'Yeni Proje', icon: FileText, to: '/build-management/new' },
  { label: '2. BÖLÜM: DENETİM VE KONTROL', type: 'group' },
  { label: 'Saha Denetimleri', icon: ShieldAlert, to: '/build-management/inspections' },
  { label: 'Bulgu Takibi', icon: AlertTriangle, to: '/build-management/findings' },
  { label: '3. BÖLÜM: TESLİM ALMA VE RAPOR', type: 'group' },
  { label: 'Teslim Alma', icon: UserCheck, to: '/build-management/handover' },
  { label: 'Raporlar', icon: Layers, to: '/build-management/reports' },
  { label: 'AYARLAR', type: 'group' },
  { label: 'Modül Ayarları', icon: Settings, to: '/build-management/settings' },
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Route'a göre sidebar menüsünü belirle
  const path = location.pathname;
  const hasAdminAccess = user?.isAdmin || user?.isManagement || user?.roles?.includes('admin') || user?.roles?.includes('management');
  
  let navItems = operationsNavItems(!!hasAdminAccess);
  let moduleName = 'Aylık Veri Sistemi';

  if (path.startsWith('/panel')) {
    navItems = panelNavItems;
    moduleName = 'İSG Atama Paneli';
  } else if (path.startsWith('/workflow')) {
    navItems = workflowNavItems(!!hasAdminAccess);
    moduleName = 'İş Takip (Workflow)';
  } else if (path.startsWith('/risks')) {
    navItems = riskNavItems;
    moduleName = 'Risk Yaşam Döngüsü';
  } else if (path.startsWith('/hazmat')) {
    navItems = hazmatNavItems;
    moduleName = 'Tehlikeli Madde Yönetimi';
  } else if (path.startsWith('/fire-equipment')) {
    navItems = fireEquipmentNavItems;
    moduleName = 'Yangın Envanter Yönetimi';
  } else if (path.startsWith('/bina-turu')) {
    navItems = binaTuruNavItems;
    moduleName = 'Bina Turu Yönetimi';
  } else if (path.startsWith('/build-management')) {
    navItems = buildManagementNavItems;
    moduleName = 'İnşaat ve Renovasyon Yönetimi';
  } else if (path.startsWith('/settings')) {
    navItems = settingsNavItems;
    moduleName = 'Sistem Ayarları';
  } else if (path.startsWith('/profile') || path.startsWith('/notifications')) {
    navItems = profileNavItems(!!hasAdminAccess);
    moduleName = path.startsWith('/profile') ? 'Kullanıcı Profili' : 'Bildirim Merkezi';
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Mobile/Tablet Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "w-64 bg-card border-r flex flex-col shrink-0 shadow-sm fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 print:hidden",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo & Module Name */}
        <div className="h-16 flex flex-col justify-center px-5 border-b relative">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 flex items-center justify-center">
              <img src="/mlpcare.jpg" alt="MLP Care Logo" className="w-full h-full object-contain rounded" />
            </div>
            <span className="font-semibold tracking-tight text-sm">
              HSE Portalı
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-0.5 ml-8">
            {moduleName}
          </span>
        </div>

        {/* Facility Switcher (Show for modules that need it) */}
        {(path.startsWith('/bina-turu') || path.startsWith('/hazmat') || path.startsWith('/risks') || path.startsWith('/operations') || path.startsWith('/fire-equipment') || path.startsWith('/build-management')) && (
          <FacilitySwitcher />
        )}

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
                key={item.label + '-' + i}
                to={item.to!}
                end={!!(item as any).end}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors group',
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors text-left">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-white" />
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
      <div className="flex-1 flex flex-col overflow-hidden bg-muted/20 print:bg-white">
        {/* Top Header */}
        <header className="h-16 bg-card border-b flex items-center justify-between px-4 lg:px-6 shrink-0 print:hidden">
          <div className="flex items-center gap-2 lg:gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </Button>
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
            <NotificationBell />
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
        <main className="flex-1 overflow-y-auto p-6 print:p-0 print:overflow-visible">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

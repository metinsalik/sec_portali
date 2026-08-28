import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  Shield, LayoutDashboard, Building2, Users, Briefcase, UserCheck,
  ClipboardList, FileText, Settings, Bell, ChevronDown, LogOut,
  User, BarChart3, ChevronRight, LayoutGrid, Database, Users2, Mail,
  BellRing, Layers, ShieldAlert, AlertTriangle, FolderTree, Droplets, LifeBuoy, PackageOpen, Flame, PenTool, Menu, X, ShoppingCart, PieChart, Calendar, AlertCircle, MessageSquare, BookOpen, DoorClosed
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationBell } from './NotificationBell';
import { FacilitySwitcher } from './FacilitySwitcher';
import { useChat } from '@/context/ChatContext';
import GlobalWorkflowChat from '@/components/workflow/GlobalWorkflowChat';
import { ErrorBoundary } from '@/components/ErrorBoundary';

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
  { label: 'Bildirimler', icon: Bell, to: '/notifications' },
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

const settingsNavItems = (hasAdminAccess: boolean) => [
  { label: 'GENEL', type: 'group' },
  { label: 'Tesis Yönetimi', icon: Building2, to: '/settings/facilities' },
  { label: 'Tesis Lokasyonları', icon: Building2, to: '/settings/locations' },
  ...(hasAdminAccess ? [
    { label: 'Kullanıcı Yönetimi', icon: Users2, to: '/settings/users' },
    { label: 'Tanım Yönetimi', icon: BookOpen, to: '/settings/definitions' },
    { label: 'Kategoriler', icon: Database, to: '/settings/definitions' },
    { label: 'SİSTEM', type: 'group' },
    { label: 'E-posta Ayarları', icon: Mail, to: '/settings/smtp' },
    { label: 'Telegram Entegrasyonu', icon: MessageSquare, to: '/settings/telegram' },
    { label: 'Bildirim Ayarları', icon: BellRing, to: '/settings/notifications' },
    { label: 'E-posta Şablonları', icon: FileText, to: '/settings/templates' },
    { label: 'Rapor Şablonları', icon: Layers, to: '/settings/reports' },
  ] : []),
];

const workflowNavItems = (hasAdminAccess: boolean) => [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/workflow/dashboard' },
  { label: 'Görevler', icon: ClipboardList, to: '/workflow/tasks' },
  { label: 'Planlar', icon: Users2, to: '/workflow/plans' },
  { label: 'Takvim', icon: Calendar, to: '/workflow/calendar' },
  { label: 'Uyarılar & Talepler', icon: AlertCircle, to: '/workflow/alerts' },
  { label: 'Raporlar', icon: BarChart3, to: '/workflow/reports' },
  ...(hasAdminAccess ? [{ label: 'Ayarlar', icon: Settings, to: '/workflow/settings' }] : []),
];

const riskNavItems = [
  { label: 'GENEL', type: 'group' },
  { label: 'Dashboard', icon: LayoutDashboard, to: '/risks', end: true },
  { label: 'RAPORLAR', type: 'group' },
  { label: 'Analiz ve Raporlar', icon: PieChart, to: '/risks/reports' },
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
  { label: 'Tüm Envanter', icon: Flame, to: '/fire-equipment/list' },
  { label: 'Alarm Buton', icon: ChevronRight, to: '/fire-equipment/list?category=Alarm Butonu' },
  { label: 'Dedektör', icon: ChevronRight, to: '/fire-equipment/list?category=Dedektör' },
  { label: 'Flaşör', icon: ChevronRight, to: '/fire-equipment/list?category=Flaşör' },
  { label: 'Hidrant', icon: ChevronRight, to: '/fire-equipment/list?category=Hidrant' },
  { label: 'Otm. Gazlı Söndürme', icon: ChevronRight, to: '/fire-equipment/list?category=Otomatik Gazlı Söndürme Sistemleri' },
  { label: 'Yangın Battaniyesi', icon: ChevronRight, to: '/fire-equipment/list?category=Yangın Battaniyesi' },
  { label: 'Yangın Dolabı', icon: ChevronRight, to: '/fire-equipment/list?category=Yangın Dolabı' },
  { label: 'Yangın Kapısı', icon: ChevronRight, to: '/fire-equipment/list?category=Yangın Kapısı' },
  { label: 'Yangın Paneli', icon: ChevronRight, to: '/fire-equipment/list?category=Yangın Paneli' },
  { label: 'Yangın Perdesi', icon: ChevronRight, to: '/fire-equipment/list?category=Yangın Perdesi' },
  { label: 'Yangın Tüpü', icon: ChevronRight, to: '/fire-equipment/list?category=Yangın Tüpü' },
  { label: 'İtfaiye Su Bağlantısı', icon: ChevronRight, to: '/fire-equipment/list?category=İtfaiye Su Verme Bağlantısı' },
  { label: 'Bakım ve Kontroller', icon: PenTool, to: '/fire-equipment/maintenance' },
  { label: 'AYARLAR', type: 'group' },
  { label: 'Modül Ayarları', icon: Settings, to: '/fire-equipment/settings' },
];

const fireDoorsNavItems = (hasAdminAccess: boolean) => [
  { label: 'GENEL', type: 'group' },
  { label: 'Tesis Kapıları', icon: DoorClosed, to: '/safety-management/fire-doors/list' },
  ...(hasAdminAccess ? [
    { label: 'AYARLAR', type: 'group' },
    { label: 'Modül Ayarları', icon: Settings, to: '/safety-management/fire-doors/settings' },
  ] : []),
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

const renovationReportNavItems = [
  { label: 'GENEL', type: 'group' },
  { label: 'Dashboard', icon: LayoutDashboard, to: '/renovation-report', end: true },
  { label: 'AYARLAR', type: 'group' },
  { label: 'Modül Ayarları', icon: Settings, to: '/renovation-report/settings' },
];

const checklistNavItems = (hasAdminAccess: boolean, hasSpecialistAccess: boolean) => [
  { label: 'GENEL', type: 'group' },
  { label: 'Dashboard', icon: LayoutDashboard, to: '/checklists', end: true },
  
  { label: 'SAHA DENETİMLERİ', type: 'group' },
  { label: 'Denetimlerim', icon: ClipboardList, to: '/checklists/submissions' },

  ...(hasAdminAccess ? [
    { label: 'YÖNETİM', type: 'group' },
    { label: 'Şablonlar ve Gruplar', icon: FileText, to: '/checklists/templates' },
    { label: 'Ayarlar', icon: Settings, to: '/checklists/settings' },
  ] : [])
];

const isgKurulNavItems = [
  { label: 'GENEL', type: 'group' },
  { label: 'Dashboard', icon: LayoutDashboard, to: '/isg-kurul/dashboard', end: true },
  { label: 'YÖNETİM', type: 'group' },
  { label: 'Kurul Toplantıları', icon: Users, to: '/isg-kurul/meetings' },
  { label: 'AYARLAR', type: 'group' },
  { label: 'Modül Ayarları', icon: Settings, to: '/isg-kurul/settings' },
];

const profileNavItems = (hasAdminAccess: boolean) => [
  { label: 'UYGULAMALAR', type: 'group' },
  ...(hasAdminAccess ? [{ label: 'Operasyon Yönetim Sistemi', icon: LayoutDashboard, to: '/operations-management' }] : []),
  ...(hasAdminAccess ? [{ label: 'Aylık Veri Sistemi', icon: FileText, to: '/operations' }] : []),
  { label: 'HESABIM', type: 'group' },
  { label: 'Profil Bilgileri', icon: User, to: '/profile' },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { openChat, hasUnread } = useChat();

  // Route'a göre sidebar menüsünü belirle
  const path = location.pathname;
  const hasAdminAccess = user?.isAdmin || user?.isManagement || user?.roles?.includes('admin') || user?.roles?.includes('management');
  const hasSpecialistAccess = user?.roles?.includes('specialist');
  
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
  } else if (path.startsWith('/safety-management/fire-doors')) {
    navItems = fireDoorsNavItems(hasAdminAccess);
    moduleName = 'Yangın Kapıları';
  } else if (path.startsWith('/bina-turu')) {
    navItems = binaTuruNavItems;
    moduleName = 'Bina Turu Yönetimi';
  } else if (path.startsWith('/build-management')) {
    navItems = buildManagementNavItems;
    moduleName = 'İnşaat ve Renovasyon Yönetimi';
  } else if (path.startsWith('/renovation-report')) {
    navItems = renovationReportNavItems;
    moduleName = 'Entegre Risk ve Güvenlik Denetimi';
  } else if (path.startsWith('/checklists')) {
    navItems = checklistNavItems(!!hasAdminAccess, !!hasSpecialistAccess);
    moduleName = 'İSG Kontrol Listeleri';
  } else if (path.startsWith('/settings')) {
    navItems = settingsNavItems(hasAdminAccess);
    moduleName = 'Sistem Ayarları';
  } else if (path.startsWith('/isg-kurul')) {
    navItems = isgKurulNavItems;
    moduleName = 'İSG Kurul Yönetimi';
  } else if (path.startsWith('/profile') || path.startsWith('/notifications')) {
    navItems = profileNavItems(!!hasAdminAccess);
    moduleName = path.startsWith('/profile') ? 'Kullanıcı Profili' : 'Bildirim Merkezi';
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getAppsUrl = () => {
    if (
      path.startsWith('/operations') ||
      path.startsWith('/risks') ||
      path.startsWith('/hazmat') ||
      path.startsWith('/checklists') ||
      path.startsWith('/isg-kurul') ||
      path.startsWith('/safety-management/fire-doors')
    ) {
      return '/safety-management';
    }
    if (
      path.startsWith('/panel') ||
      path.startsWith('/renovation-report')
    ) {
      return '/operations-management';
    }
    return '/portal';
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden print:h-auto print:overflow-visible print:block">
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
        {(path.startsWith('/isg-kurul') || path.startsWith('/bina-turu') || path.startsWith('/hazmat') || path.startsWith('/risks') || path.startsWith('/operations') || path.startsWith('/fire-equipment') || path.startsWith('/build-management') || path.startsWith('/renovation-report') || path.startsWith('/checklists') || path.startsWith('/safety-management/fire-doors')) && (
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
            
            const decodedSearch = decodeURIComponent(location.search);
            let customIsActive = false;
            
            if (item.to?.includes('?category=')) {
              customIsActive = (location.pathname + decodedSearch) === item.to;
            } else if (item.to === '/fire-equipment/list') {
              customIsActive = location.pathname === item.to && (!decodedSearch || !decodedSearch.includes('category='));
            } else {
              customIsActive = location.pathname.startsWith(item.to!) || (location.pathname === item.to); // React router default behavior approximation
              if ((item as any).end && location.pathname !== item.to) {
                customIsActive = false;
              }
            }

            return (
              <NavLink
                key={item.label + '-' + i}
                to={item.to!}
                end={!!(item as any).end}
                onClick={() => setIsSidebarOpen(false)}
                className={() =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors group',
                    customIsActive
                      ? 'bg-slate-900 text-white shadow-sm dark:bg-slate-50 dark:text-slate-900'
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
                <div className="w-8 h-8 bg-slate-900 dark:bg-slate-50 rounded-full flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-white dark:text-slate-900" />
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
              <DropdownMenuItem onClick={() => navigate('/settings/facilities')}>
                {hasAdminAccess ? (
                  <><Settings className="w-4 h-4 mr-2" /> Sistem Ayarları</>
                ) : (
                  <><Building2 className="w-4 h-4 mr-2" /> Tesis Bilgilerim</>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4 mr-2" /> Çıkış Yap
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-muted/20 print:bg-white print:overflow-visible print:block">
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
              onClick={() => navigate(getAppsUrl())}
              className="hidden md:flex h-8"
            >
              <LayoutGrid className="w-4 h-4 mr-2 text-muted-foreground" />
              Uygulamalar
            </Button>
            
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground font-medium capitalize">
                {(() => {
                  const lastSegment = location.pathname.split('/').filter(Boolean).pop();
                  if (!lastSegment) return '';
                  // CUIDs usually start with 'c' and are 25 chars long, UUIDs are 36 chars.
                  if (lastSegment.length >= 24 && (lastSegment.startsWith('c') || lastSegment.includes('-'))) {
                    if (location.pathname.includes('/workflow/plans/')) return 'Plan Detayı';
                    if (location.pathname.includes('/workflow/tasks/')) return 'Görev Detayı';
                    return 'Detay';
                  }
                  return lastSegment.replace('-', ' ');
                })()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 md:gap-3">
            {path.startsWith('/workflow') && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => openChat()}
                className="relative text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full w-9 h-9 md:w-10 md:h-10 transition-colors"
                title="İş Akışı Sohbetleri"
              >
                <MessageSquare className="w-5 h-5 md:w-5 md:h-5" />
                {hasUnread && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
                )}
              </Button>
            )}
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
        <main className="flex-1 overflow-y-auto p-6 print:p-0 print:overflow-visible print:block">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Global Workflow Chat Drawer */}
      <ErrorBoundary>
        <GlobalWorkflowChat />
      </ErrorBoundary>
    </div>
  );
}

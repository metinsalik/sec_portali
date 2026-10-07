import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, AlertOctagon, ClipboardList, Zap, 
  ChevronDown, ChevronRight, Settings, Upload, ArrowLeft,
  Building2, Activity, Menu, X, PanelLeftClose, PanelLeftOpen,
  User, LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuSeparator, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { type FacilityOption, ELECTRICAL_SHEETS } from './types';
import { ImprovementExcelImportModal } from './ImprovementExcelImportModal';

const API = import.meta.env.VITE_API_URL || '';

export const ImprovementsLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const hasAdminAccess = !!(
    user?.isAdmin || 
    user?.isManagement || 
    user?.roles?.includes('admin') || 
    user?.roles?.includes('management')
  );

  // Hastaneler ve Seçili Hastane
  const [facilities, setFacilities] = useState<FacilityOption[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('ALL');
  const [loadingFacilities, setLoadingFacilities] = useState(true);

  // Accordion durumu (Elektrik grubu)
  const [isElectricalOpen, setIsElectricalOpen] = useState(true);

  // Sidebar responsive & collapse
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Excel Import modalı
  const [showImportModal, setShowImportModal] = useState(false);

  // Hastaneleri çek (Yalnızca Hastane olanlar)
  const fetchFacilities = async () => {
    try {
      setLoadingFacilities(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/operations/improvements/facilities`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (data.success) {
        let facs: FacilityOption[] = data.data;
        
        // Eğer kullanıcı yönetici değilse, yalnızca yetkili olduğu tesisleri filtrele
        if (!hasAdminAccess && user?.facilities && user.facilities.length > 0) {
          facs = facs.filter(f => user.facilities.includes(f.id));
        }

        setFacilities(facs);

        // Kullanıcı yönetici değilse veya önceden seçilmiş bir tesis varsa ayarla
        const activeLocal = localStorage.getItem('activeFacilityId');
        if (!hasAdminAccess) {
          if (facs.length > 0) {
            const defaultId = activeLocal && facs.some(f => f.id === activeLocal) ? activeLocal : facs[0].id;
            setSelectedFacilityId(defaultId);
            localStorage.setItem('activeFacilityId', defaultId);
          }
        } else if (activeLocal && facs.some(f => f.id === activeLocal)) {
          setSelectedFacilityId(activeLocal);
        }
      }
    } catch (err) {
      console.error('Error fetching facilities:', err);
    } finally {
      setLoadingFacilities(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, [user]);

  const currentPath = location.pathname;
  const isElectricalActive = currentPath.startsWith('/operations-management/improvements/electrical');

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
      
      {/* Mobil Karartma Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
        />
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SOL YAN MENÜ (SIDEBAR) - SHADCN / APP-LAYOUT TASARIMI               */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r border-border transition-all duration-300 lg:static",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        isCollapsed ? "lg:w-[68px]" : "lg:w-64",
        "w-64"
      )}>
        
        {/* Brand / Başlık */}
        <div className={cn(
          "h-16 flex items-center border-b border-border transition-all duration-300",
          isCollapsed ? "justify-center px-2" : "justify-between px-4"
        )}>
          {isCollapsed ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(false)}
              className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg hidden lg:flex"
              title="Kenar çubuğunu aç"
            >
              <PanelLeftOpen className="w-5 h-5" />
            </Button>
          ) : (
            <>
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 font-bold">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm font-semibold tracking-tight text-foreground truncate">
                    İyileştirme Takip
                  </h1>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold truncate">
                    Operasyon Yönetimi
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCollapsed(true)}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg hidden lg:flex"
                  title="Kenar çubuğunu daralt"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(false)}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground lg:hidden"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Geri Dön Butonu */}
        {!isCollapsed && (
          <div className="px-3 pt-3">
            <button
              onClick={() => navigate('/operations-management')}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Operasyon Yönetimine Dön</span>
            </button>
          </div>
        )}

        {/* Tesis / Hastane Seçici (Sidebar İçi) */}
        <div className={cn("px-3 pt-3 pb-1", isCollapsed && "px-1.5")}>
          {isCollapsed ? (
            <div 
              title={facilities.find(f => f.id === selectedFacilityId)?.name || "Tüm Hastaneler"}
              className="w-10 h-10 mx-auto rounded-lg bg-muted flex items-center justify-center text-primary cursor-pointer hover:bg-muted/80"
              onClick={() => setIsCollapsed(false)}
            >
              <Building2 className="w-4 h-4" />
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block px-1">
                Aktif Hastane / Tesis
              </label>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 text-primary absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedFacilityId}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setSelectedFacilityId(newId);
                    if (newId !== 'ALL') {
                      localStorage.setItem('activeFacilityId', newId);
                      window.dispatchEvent(new Event('facilityChanged'));
                    }
                  }}
                  className="w-full h-8 pl-8 pr-2 rounded-lg border bg-background text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary truncate cursor-pointer"
                >
                  {hasAdminAccess && (
                    <option value="ALL">Tüm Hastaneler (Grup Geneli)</option>
                  )}
                  {facilities.map(fac => (
                    <option key={fac.id} value={fac.id}>
                      {fac.name} {fac.recordCount !== undefined ? `(${fac.recordCount})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Menü Linkleri */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          
          {/* GENEL GRUBU */}
          <div className={cn(
            "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pt-3 pb-1",
            isCollapsed && "text-center px-0"
          )}>
            {isCollapsed ? "—" : "GENEL"}
          </div>

          {/* 1. Dashboard */}
          <button
            onClick={() => {
              navigate('/operations-management/improvements');
              setIsSidebarOpen(false);
            }}
            title={isCollapsed ? "Dashboard" : undefined}
            className={cn(
              "w-full flex items-center rounded-lg text-sm font-medium transition-colors",
              isCollapsed ? "justify-center h-10 px-0" : "gap-3 px-3 py-2",
              currentPath === '/operations-management/improvements'
                ? "bg-slate-900 text-white shadow-sm dark:bg-slate-50 dark:text-slate-900"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0 text-blue-500" />
            {!isCollapsed && <span>Dashboard</span>}
          </button>

          {/* 2. Kritik Maddeler */}
          <button
            onClick={() => {
              navigate('/operations-management/improvements/critical');
              setIsSidebarOpen(false);
            }}
            title={isCollapsed ? "Kritik Maddeler" : undefined}
            className={cn(
              "w-full flex items-center rounded-lg text-sm font-medium transition-colors",
              isCollapsed ? "justify-center h-10 px-0" : "gap-3 px-3 py-2",
              currentPath === '/operations-management/improvements/critical'
                ? "bg-slate-900 text-white shadow-sm dark:bg-slate-50 dark:text-slate-900"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <AlertOctagon className="w-4 h-4 shrink-0 text-red-500" />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left">Kritik Maddeler</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-red-300 text-red-600 dark:border-red-800 dark:text-red-400">
                  Kritik
                </Badge>
              </>
            )}
          </button>

          {/* TAKİP ALANLARI GRUBU */}
          <div className={cn(
            "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pt-4 pb-1",
            isCollapsed && "text-center px-0"
          )}>
            {isCollapsed ? "—" : "TAKİP ALANLARI"}
          </div>

          {/* 3. Denetimler (Ayrı Başlık / Sekme) */}
          <button
            onClick={() => {
              navigate('/operations-management/improvements/denetimler');
              setIsSidebarOpen(false);
            }}
            title={isCollapsed ? "Denetimler" : undefined}
            className={cn(
              "w-full flex items-center rounded-lg text-sm font-medium transition-colors",
              isCollapsed ? "justify-center h-10 px-0" : "gap-3 px-3 py-2",
              currentPath === '/operations-management/improvements/denetimler'
                ? "bg-slate-900 text-white shadow-sm dark:bg-slate-50 dark:text-slate-900"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <ClipboardList className="w-4 h-4 shrink-0 text-emerald-500" />
            {!isCollapsed && <span className="text-left">Denetimler</span>}
          </button>

          {/* 4. Elektrik Emniyet Raporu (Açılır Grup) */}
          {isCollapsed ? (
            <button
              onClick={() => {
                navigate('/operations-management/improvements/electrical/elektrik-pk');
                setIsSidebarOpen(false);
              }}
              title="Elektrik Emniyet Raporu"
              className={cn(
                "w-full flex items-center justify-center h-10 rounded-lg text-sm font-medium transition-colors",
                isElectricalActive
                  ? "bg-slate-900 text-white shadow-sm dark:bg-slate-50 dark:text-slate-900"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Zap className="w-4 h-4 shrink-0 text-amber-500" />
            </button>
          ) : (
            <div className="space-y-1">
              <div
                onClick={() => setIsElectricalOpen(!isElectricalOpen)}
                className={cn(
                  "flex items-center justify-between rounded-lg text-sm font-medium transition-colors px-3 py-2 cursor-pointer select-none group",
                  isElectricalActive
                    ? "bg-muted/80 text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Zap className="w-4 h-4 shrink-0 text-amber-500" />
                  <span className="truncate">Elektrik Emniyet Raporu</span>
                </div>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform duration-200",
                    isElectricalOpen ? "rotate-0" : "-rotate-90"
                  )}
                />
              </div>

              {/* Alt Sekmeler */}
              {isElectricalOpen && (
                <div className="pl-4 pr-1 space-y-0.5 border-l-2 border-amber-500/30 ml-4 animate-in slide-in-from-top-1 duration-200">
                  {ELECTRICAL_SHEETS.map(item => {
                    const targetUrl = `/operations-management/improvements/electrical/${item.path}`;
                    const isActive = currentPath === targetUrl;

                    return (
                      <button
                        key={item.key}
                        onClick={() => {
                          navigate(targetUrl);
                          setIsSidebarOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 rounded-md text-xs font-medium px-2.5 py-1.5 transition-colors text-left",
                          isActive
                            ? "bg-slate-900 text-white shadow-xs dark:bg-slate-50 dark:text-slate-900 font-semibold"
                            : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                        )}
                      >
                        <ChevronRight className="w-3 h-3 shrink-0 opacity-70" />
                        <span className="truncate">{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SİSTEM & AYARLAR GRUBU */}
          <div className={cn(
            "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pt-4 pb-1",
            isCollapsed && "text-center px-0"
          )}>
            {isCollapsed ? "—" : "YÖNETİM"}
          </div>

          {/* 5. Ayarlar (Settings) */}
          <button
            onClick={() => {
              navigate('/operations-management/improvements/settings');
              setIsSidebarOpen(false);
            }}
            title={isCollapsed ? "Modül Ayarları" : undefined}
            className={cn(
              "w-full flex items-center rounded-lg text-sm font-medium transition-colors",
              isCollapsed ? "justify-center h-10 px-0" : "gap-3 px-3 py-2",
              currentPath === '/operations-management/improvements/settings'
                ? "bg-slate-900 text-white shadow-sm dark:bg-slate-50 dark:text-slate-900"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Settings className="w-4 h-4 shrink-0 text-slate-500" />
            {!isCollapsed && <span className="text-left">Modül Ayarları</span>}
          </button>

        </div>

        {/* User Section (Diğer Modüllerle Birebir Aynı Tasarım) */}
        <div className={cn("border-t border-border transition-all duration-300", isCollapsed ? "p-2 flex justify-center" : "p-3")}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                title={isCollapsed ? `${user?.fullName || 'Kullanıcı'} (${user?.username || ''})` : undefined}
                className={cn(
                  "flex items-center rounded-lg hover:bg-muted transition-colors text-left",
                  isCollapsed ? "h-10 w-10 justify-center p-0" : "w-full gap-3 px-3 py-2"
                )}
              >
                <div className="w-8 h-8 bg-slate-900 dark:bg-slate-50 rounded-full flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-white dark:text-slate-900" />
                </div>
                {!isCollapsed && (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{user?.fullName || 'Kullanıcı'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.username}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isCollapsed ? "end" : "start"} side={isCollapsed ? "right" : "top"} sideOffset={8} className="w-56">
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
              <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4 mr-2" /> Çıkış Yap
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      </aside>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ANA İÇERİK ALANI                                                    */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Üst Bar (Topbar) - Shadcn Card/Border stili */}
        <header className="h-16 bg-card border-b border-border px-4 lg:px-6 flex items-center justify-between shrink-0 shadow-xs z-10">
          
          {/* Sol: Menü Aç (Mobil) & Breadcrumb */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
              className="h-9 w-9 text-muted-foreground lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span 
                onClick={() => navigate('/operations-management')}
                className="hover:underline cursor-pointer font-medium hidden sm:inline"
              >
                Operasyon Yönetimi
              </span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60 hidden sm:inline" />
              <span className="font-semibold text-foreground">
                İyileştirme ve Aksiyon Takip
              </span>
            </div>
          </div>

          {/* Sağ: Hastane Filtresi & Excel Yükle & Theme */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Hastane Seçici Dropdown */}
            <div className="flex items-center gap-2 bg-muted/60 border border-border rounded-lg px-2.5 py-1.5 text-xs">
              <Building2 className="w-4 h-4 text-primary shrink-0" />
              <select
                value={selectedFacilityId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setSelectedFacilityId(newId);
                  if (newId !== 'ALL') {
                    localStorage.setItem('activeFacilityId', newId);
                    window.dispatchEvent(new Event('facilityChanged'));
                  }
                }}
                className="bg-transparent font-medium text-foreground outline-none cursor-pointer max-w-[180px] sm:max-w-[240px] truncate"
              >
                {hasAdminAccess && (
                  <option value="ALL">Tüm Hastaneler (Grup Geneli)</option>
                )}
                {facilities.map(fac => (
                  <option key={fac.id} value={fac.id}>
                    {fac.name} {fac.recordCount !== undefined ? `(${fac.recordCount})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImportModal(true)}
              className="h-9 text-xs font-medium"
            >
              <Upload className="w-3.5 h-3.5 mr-1.5 text-primary" />
              <span className="hidden sm:inline">Excel Yükle</span>
            </Button>

            <ThemeToggle />

          </div>

        </header>

        {/* Sayfa Gövdesi (Router Outlet) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-background">
          <Outlet context={{ selectedFacilityId, facilities, onRefreshFacilities: fetchFacilities }} />
        </main>

      </div>

      {/* Excel İçe Aktarma Modalı */}
      {showImportModal && (
        <ImprovementExcelImportModal
          facilities={facilities}
          activeFacilityId={selectedFacilityId}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            fetchFacilities();
          }}
        />
      )}

    </div>
  );
};

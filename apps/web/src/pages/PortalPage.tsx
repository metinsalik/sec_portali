import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, Settings, User, LogOut, ArrowRight,
  ShieldCheck, Wrench, HardHat, Flame, Building, 
  Compass, Activity, CheckCircle2, AlertCircle, LayoutGrid
} from 'lucide-react';

export default function PortalPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // O an aktif kullanıcı sayısını çekme
  const { data: activeData } = useQuery({
    queryKey: ['activeUserCount'],
    queryFn: async () => {
      const res = await api.get('/auth/active-count');
      return res.json();
    },
    refetchInterval: 15000,
  });
  const activeCount = activeData?.count ?? 0;

  // Admin veya Yönetici rolü kontrolü
  const hasAdminAccess = user?.isAdmin || user?.isManagement || user?.roles?.includes('admin') || user?.roles?.includes('management');

  // Kullanıcı isminin baş harflerini alma
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
  const userInitials = getInitials(user?.fullName || user?.username || 'Kullanıcı');

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border/60">
        <div className="flex justify-between items-center h-14 px-4 sm:px-6 lg:px-8 w-full max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0 overflow-hidden">
              <img src="/mlpcare.jpg" alt="MLP Care Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold tracking-tight text-foreground">HSE Portalı</h1>
              <Badge variant="outline" className="hidden sm:inline-flex text-[10px] font-normal rounded-md border-border/60">
                Kurumsal Portal
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {hasAdminAccess && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/settings')}
                className="hidden md:flex items-center gap-1.5 h-8 text-xs rounded-md text-muted-foreground hover:text-foreground"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Sistem Ayarları</span>
              </Button>
            )}

            <ThemeToggle />
            <NotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className="flex items-center gap-2 h-8 px-2 rounded-md hover:bg-muted text-xs font-medium text-foreground transition-colors border border-border/60"
                  title={user?.fullName || user?.username || ''}
                >
                  <div className="w-5 h-5 rounded bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold">
                    {userInitials}
                  </div>
                  <span className="hidden sm:inline-block max-w-[120px] truncate">
                    {user?.fullName || user?.username || 'Hesabım'}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-lg shadow-sm">
                <DropdownMenuLabel className="text-xs font-semibold">{user?.fullName || user?.username || 'Kullanıcı'}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="text-xs cursor-pointer rounded-md">
                    <User className="w-3.5 h-3.5 mr-2" />
                    Profil
                  </DropdownMenuItem>
                  {hasAdminAccess && (
                    <DropdownMenuItem onClick={() => navigate('/settings')} className="text-xs cursor-pointer rounded-md">
                      <Settings className="w-3.5 h-3.5 mr-2" />
                      Sistem Ayarları
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-xs text-destructive focus:text-destructive cursor-pointer rounded-md">
                  <LogOut className="w-3.5 h-3.5 mr-2" />
                  Çıkış Yap
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Header Title Section */}
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
              Uygulamalar ve Yönetim Modülleri
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Yetkili olduğunuz iş sağlığı, güvenlik ve operasyon modüllerine doğrudan erişin.
            </p>
          </div>

          {/* Module Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Card 1: Operasyon Yönetim Sistemi */}
            {(hasAdminAccess || user?.modules?.includes('PANEL') || user?.modules?.includes('RENOVATION_REPORT') || user?.modules?.includes('FIRE_SAFETY_CONTROL') || user?.modules?.includes('FM200_TRACKING') || user?.modules?.includes('IMPROVEMENTS_TRACKING')) && (
              <Card
                onClick={() => navigate('/operations-management')}
                className="group border border-border/60 hover:border-primary/50 shadow-xs hover:shadow-sm transition-all duration-200 rounded-lg p-5 flex flex-col justify-between cursor-pointer bg-card"
              >
                <div>
                  <div className="w-10 h-10 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3.5 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    Operasyon Yönetim Sistemi
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">
                    İSG Atama Paneli, renovasyon risk denetimleri, yangın güvenliği ve saha operasyonları.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/40 text-xs font-medium text-primary">
                  <span>Modüle Git</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            )}

            {/* Card 2: İş Güvenliği Yönetim Modülü */}
            {(hasAdminAccess || user?.modules?.includes('OPERATIONS') || user?.modules?.includes('RISKS') || user?.modules?.includes('HAZMAT') || user?.modules?.includes('CHECKLISTS') || user?.modules?.includes('ISG_KURUL')) && (
              <Card
                onClick={() => navigate('/safety-management')}
                className="group border border-border/60 hover:border-primary/50 shadow-xs hover:shadow-sm transition-all duration-200 rounded-lg p-5 flex flex-col justify-between cursor-pointer bg-card"
              >
                <div>
                  <div className="w-10 h-10 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3.5 transition-colors group-hover:bg-amber-600 group-hover:text-white">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    İş Güvenliği Yönetim Modülü
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">
                    Aylık veriler, Fine-Kinney risk değerlendirmesi, tehlikeli madde yönetimi ve İSG kontrolleri.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/40 text-xs font-medium text-primary">
                  <span>Modüle Git</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            )}

            {/* Card 3: İş Takip */}
            {(hasAdminAccess || user?.modules?.includes('WORKFLOW')) && (
              <Card
                onClick={() => navigate('/workflow')}
                className="group border border-border/60 hover:border-primary/50 shadow-xs hover:shadow-sm transition-all duration-200 rounded-lg p-5 flex flex-col justify-between cursor-pointer bg-card"
              >
                <div>
                  <div className="w-10 h-10 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3.5 transition-colors group-hover:bg-purple-600 group-hover:text-white">
                    <Activity className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    İş Akışı ve Görev Takibi
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">
                    İş atamaları, görev durum takibi, ekip koordinasyonu ve anlık bildirim yönetimi.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/40 text-xs font-medium text-primary">
                  <span>Modüle Git</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            )}

            {/* Card 4: Yangın Envanter Yönetimi */}
            {(hasAdminAccess || user?.modules?.includes('FIRE_EQUIPMENT')) && (
              <Card
                onClick={() => navigate('/fire-equipment')}
                className="group border border-border/60 hover:border-primary/50 shadow-xs hover:shadow-sm transition-all duration-200 rounded-lg p-5 flex flex-col justify-between cursor-pointer bg-card"
              >
                <div>
                  <div className="w-10 h-10 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3.5 transition-colors group-hover:bg-rose-600 group-hover:text-white">
                    <Flame className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    Yangın Envanter Yönetimi
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">
                    Yangın tüpü, dolap, hidrant, alarm ve algılama ekipmanları periyodik kontrol takibi.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/40 text-xs font-medium text-primary">
                  <span>Modüle Git</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            )}

            {/* Card 5: İnşaat ve Renovasyon Yönetimi */}
            {(hasAdminAccess || user?.modules?.includes('BUILD_MANAGEMENT')) && (
              <Card
                onClick={() => navigate('/build-management')}
                className="group border border-border/60 hover:border-primary/50 shadow-xs hover:shadow-sm transition-all duration-200 rounded-lg p-5 flex flex-col justify-between cursor-pointer bg-card"
              >
                <div>
                  <div className="w-10 h-10 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3.5 transition-colors group-hover:bg-sky-600 group-hover:text-white">
                    <HardHat className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    İnşaat ve Renovasyon
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">
                    İnşaat, tadilat ve renovasyon projelerinin ICRA analizleri, risk matrisleri ve onay süreçleri.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/40 text-xs font-medium text-primary">
                  <span>Modüle Git</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            )}

            {/* Card 6: Bina Turu Yönetimi */}
            {(hasAdminAccess || user?.modules?.includes('BUILDING_TOUR')) && (
              <Card
                onClick={() => navigate('/bina-turu')}
                className="group border border-border/60 hover:border-primary/50 shadow-xs hover:shadow-sm transition-all duration-200 rounded-lg p-5 flex flex-col justify-between cursor-pointer bg-card"
              >
                <div>
                  <div className="w-10 h-10 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3.5 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                    <Building className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    Bina Turu Yönetimi
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">
                    Hastanelerde periyodik bina turları planlama, saha bulguları ve aksiyon takip süreçleri.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/40 text-xs font-medium text-primary">
                  <span>Modüle Git</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            )}
          </div>

          {/* Active User Count & System Summary Card */}
          <div className="rounded-lg border border-border/60 bg-card p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <h4 className="text-xs font-semibold text-foreground">Canlı Sistem Durumu</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Şu an portal üzerinde aktif <span className="font-semibold text-emerald-600 dark:text-emerald-400">{activeCount}</span> kullanıcı oturumu bulunuyor.
              </p>
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto">
              {hasAdminAccess && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/settings/facilities')}
                  className="h-8 text-xs rounded-md border-border/60"
                >
                  <Building2 className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  Tesis Bilgileri
                </Button>
              )}
              {hasAdminAccess && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/settings/users')}
                  className="h-8 text-xs rounded-md border-border/60"
                >
                  <User className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  Kullanıcılar
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-4 px-4 sm:px-6 lg:px-8 w-full max-w-[1600px] mx-auto mt-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">MLP Care</span>
            <span>•</span>
            <span>HSE Portalı © {new Date().getFullYear()}</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Sağlık, Emniyet ve Çevre Yönetim Portalı
          </p>
        </div>
      </footer>
    </div>
  );
}

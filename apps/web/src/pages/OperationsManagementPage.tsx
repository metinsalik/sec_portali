import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/layout/NotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DomainCockpitSidebar, type DomainCockpitItem } from '@/components/shared/DomainCockpitSidebar';
import {
  ArrowLeft,
  ArrowRight,
  LayoutGrid,
  ClipboardCheck,
  Flame,
  ShieldAlert,
  CheckSquare,
  Camera,
  User,
  LogOut,
  Settings,
} from 'lucide-react';

interface DomainCockpitResponse {
  domain: string;
  moduleCounts: Record<string, number>;
  items: DomainCockpitItem[];
}

export default function OperationsManagementPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const hasAdminAccess =
    user?.isAdmin ||
    user?.isManagement ||
    user?.roles?.includes('admin') ||
    user?.roles?.includes('management');

  const activeFacilityId = localStorage.getItem('activeFacilityId') || '';

  const { data: cockpit, isLoading, isFetching, refetch } = useQuery<DomainCockpitResponse>({
    queryKey: ['domain-cockpit', 'operations', activeFacilityId],
    queryFn: async () => {
      const qs =
        activeFacilityId && activeFacilityId !== 'all'
          ? `&facilityId=${activeFacilityId}`
          : '';
      const res = await api.get(`/portal/domain-cockpit?domain=operations${qs}`);
      if (!res.ok) throw new Error('Alan kokpiti yüklenemedi');
      return res.json();
    },
    refetchInterval: 30_000,
  });

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
  const userInitials = getInitials(user?.fullName || user?.username || 'Kullanıcı');

  const counts = cockpit?.moduleCounts || {};

  const subModules = [
    {
      key: 'PANEL',
      show: hasAdminAccess || user?.modules?.includes('PANEL'),
      title: 'İSG Atama Paneli',
      desc: 'Profesyonel yönetimi, OSGB takibi, kurumsal atamalar ve yasal süre hesaplamaları.',
      to: '/panel',
      icon: LayoutGrid,
      iconCls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white',
      badgeCount: counts.PANEL || 0,
      badgeLabel: 'uyarı',
    },
    {
      key: 'RENOVATION_REPORT',
      show: hasAdminAccess || user?.modules?.includes('RENOVATION_REPORT'),
      title: 'Entegre Risk ve Güvenlik Denetimi',
      desc: 'İnşaat ve renovasyon alanlarının operasyonel teslim raporları ve takibi.',
      to: '/renovation-report',
      icon: ClipboardCheck,
      iconCls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white',
      badgeCount: counts.RENOVATION_REPORT || 0,
      badgeLabel: 'açık bulgu',
    },
    {
      key: 'FIRE_SAFETY_CONTROL',
      show: hasAdminAccess || user?.modules?.includes('FIRE_SAFETY_CONTROL'),
      title: 'Yangın Güvenliği Kontrol Sistemi',
      desc: 'Saha tespitleri, itfaiye ve denetim raporları, termin ve aksiyon takibi, kanıt yönetimi.',
      to: '/fire-safety-control',
      icon: Flame,
      iconCls: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:bg-rose-600 group-hover:text-white',
      badgeCount: counts.FIRE_SAFETY_CONTROL || 0,
      badgeLabel: 'açık madde',
    },
    {
      key: 'FM200_TRACKING',
      show: hasAdminAccess || user?.modules?.includes('FM200_TRACKING'),
      title: 'FM-200 & Gazlı Söndürme',
      desc: '4 fazlı adım adım denetim sihirbazı, mahal tüp envanteri, sızdırmazlık testi ve iş emri.',
      to: '/fm200',
      icon: ShieldAlert,
      iconCls: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 group-hover:bg-cyan-600 group-hover:text-white',
      badgeCount: counts.FM200_TRACKING || 0,
      badgeLabel: 'iş emri',
    },
    {
      key: 'IMPROVEMENTS_TRACKING',
      show: hasAdminAccess || user?.modules?.includes('IMPROVEMENTS_TRACKING'),
      title: 'İyileştirme ve Aksiyon Takip',
      desc: 'Hastane denetimleri, elektrik PK, topraklama, pano ve trafo periyodik kontrolleri.',
      to: '/operations-management/improvements',
      icon: CheckSquare,
      iconCls: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white',
      badgeCount: counts.IMPROVEMENTS_TRACKING || 0,
      badgeLabel: 'açık kayıt',
    },
    {
      key: 'THERMAL_CAMERA',
      show:
        hasAdminAccess ||
        user?.modules?.includes('ELECTRIC_PANEL_INSPECTION') ||
        user?.modules?.includes('THERMAL_CAMERA'),
      title: 'Elektrik Pano & Termal Kamera',
      desc: 'Tesislerdeki panoların termal kamera ile periyodik ısınma ölçümleri ve aksiyon yönetimi.',
      to: '/operations-management/thermal-camera',
      icon: Camera,
      iconCls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white',
      badgeCount: counts.THERMAL_CAMERA || 0,
      badgeLabel: 'kritik/dikkat',
    },
  ].filter((m) => m.show);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border/60">
        <div className="flex justify-between items-center h-14 px-4 sm:px-6 lg:px-8 w-full max-w-[1600px] mx-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/portal')}
              className="h-8 px-2 text-xs rounded-md text-muted-foreground hover:text-foreground"
              title="Portal'a Dön"
            >
              <ArrowLeft className="w-4 h-4 mr-1 sm:mr-1.5" />
              <span className="hidden sm:inline">Portal</span>
            </Button>

            <div className="h-4 w-px bg-border/60" />

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                <img src="/mlpcare.jpg" alt="MLP Care Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold tracking-tight text-foreground">HSE Portalı</h1>
                <Badge variant="outline" className="hidden sm:inline-flex text-[10px] font-normal rounded-md border-border/60">
                  Operasyon Yönetimi
                </Badge>
              </div>
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
                <DropdownMenuLabel className="text-xs font-semibold">
                  {user?.fullName || user?.username || 'Kullanıcı'}
                </DropdownMenuLabel>
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
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <Badge variant="outline" className="text-[10px] font-medium rounded-md border-border/60 text-muted-foreground">
              Saha ve Operasyon
            </Badge>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
              Operasyon Yönetim Sistemi
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Solda alt modülleri seçebilir, sağda bu alana ait açık ve öncelikli işlerinizi takip edebilirsiniz.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/portal')}
            className="h-8 text-xs rounded-md border-border/60 self-start sm:self-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Ana Portal&apos;a Dön
          </Button>
        </div>

        {/* 12 Kolon Grid: Sol 2/3 Alt Modüller + Sağ 1/3 Alana Özel Görev/Aksiyonlar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {subModules.map((mod) => {
              const Icon = mod.icon;
              return (
                <Card
                  key={mod.key}
                  onClick={() => navigate(mod.to)}
                  className="group border border-border/60 hover:border-primary/50 shadow-xs hover:shadow-sm transition-all duration-200 rounded-lg p-5 flex flex-col justify-between cursor-pointer bg-card"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3.5">
                      <div className={`w-10 h-10 rounded-md flex items-center justify-center transition-colors ${mod.iconCls}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      {mod.badgeCount > 0 && (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-semibold tabular-nums bg-primary/10 text-primary border-primary/25"
                        >
                          {mod.badgeCount} {mod.badgeLabel}
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">
                      {mod.desc}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/40 text-xs font-medium text-primary">
                    <span>Modüle Git</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="lg:col-span-4">
            <DomainCockpitSidebar
              title="Operasyon İşlerim & Öncelikler"
              description="Operasyon alt modüllerindeki size ait veya gecikmiş kayıtlar."
              items={cockpit?.items || []}
              isLoading={isLoading}
              isFetching={isFetching}
              onRefresh={() => refetch()}
            />
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

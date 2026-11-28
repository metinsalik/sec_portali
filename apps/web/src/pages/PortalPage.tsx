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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Settings,
  User,
  LogOut,
  ArrowRight,
  ShieldCheck,
  Wrench,
  HardHat,
  Flame,
  Building,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ClipboardCheck,
  Bell,
  Award,
  UploadCloud,
  RefreshCw,
  MapPin,
  LayoutGrid,
  CalendarClock,
} from 'lucide-react';

interface CockpitItem {
  id: string;
  bucket: 'critical' | 'checklist' | 'routine' | 'announcement';
  source:
    | 'WORKFLOW'
    | 'CHECKLIST'
    | 'IMPROVEMENT'
    | 'FIRE_SAFETY'
    | 'BINA_TURU'
    | 'ELEVATOR'
    | 'FIRE_EQUIPMENT'
    | 'PERIODIC_REPORT'
    | 'NOTIFICATION'
    | 'CERTIFICATE';
  sourceLabel: string;
  title: string;
  subtitle: string;
  facilityName?: string | null;
  dueDate?: string | null;
  isOverdue: boolean;
  daysDiff?: number | null;
  severity: 'critical' | 'warning' | 'info';
  link: string;
  actionLabel: string;
  createdAt: string;
}

interface CockpitResponse {
  summary: {
    criticalCount: number;
    checklistCount: number;
    routineCount: number;
    unreadNotificationsCount: number;
    activeUsersCount: number;
  };
  moduleBadges: {
    WORKFLOW: number;
    OPERATIONS_MANAGEMENT: number;
    SAFETY_MANAGEMENT: number;
    FIRE_EQUIPMENT: number;
    BUILDING_TOUR: number;
  };
  criticalItems: CockpitItem[];
  checklistItems: CockpitItem[];
  routineItems: CockpitItem[];
  announcements: CockpitItem[];
}

export default function PortalPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const activeFacilityId = localStorage.getItem('activeFacilityId') || '';

  const {
    data: cockpit,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<CockpitResponse>({
    queryKey: ['portal-cockpit-v2', activeFacilityId],
    queryFn: async () => {
      const qs = activeFacilityId && activeFacilityId !== 'all' ? `?facilityId=${activeFacilityId}` : '';
      const res = await api.get(`/portal/cockpit${qs}`);
      if (!res.ok) throw new Error('Kokpit yüklenemedi');
      return res.json();
    },
    refetchInterval: 30_000,
  });

  const activeCount = cockpit?.summary?.activeUsersCount ?? 0;

  const hasAdminAccess =
    user?.isAdmin ||
    user?.isManagement ||
    user?.roles?.includes('admin') ||
    user?.roles?.includes('management');

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
  const userInitials = getInitials(user?.fullName || user?.username || 'Kullanıcı');

  const formatDueLabel = (item: CockpitItem) => {
    if (item.daysDiff === null || item.daysDiff === undefined) return null;
    if (item.daysDiff < 0) return `${Math.abs(item.daysDiff)} gün gecikti`;
    if (item.daysDiff === 0) return 'Bugün';
    if (item.daysDiff === 1) return 'Yarın';
    return `${item.daysDiff} gün kaldı`;
  };

  const getSourceIcon = (source: CockpitItem['source']) => {
    switch (source) {
      case 'WORKFLOW':
        return <Activity className="w-3.5 h-3.5" />;
      case 'CHECKLIST':
        return <ClipboardCheck className="w-3.5 h-3.5" />;
      case 'IMPROVEMENT':
      case 'PERIODIC_REPORT':
        return <Wrench className="w-3.5 h-3.5" />;
      case 'FIRE_SAFETY':
      case 'FIRE_EQUIPMENT':
        return <Flame className="w-3.5 h-3.5" />;
      case 'BINA_TURU':
      case 'ELEVATOR':
        return <Building className="w-3.5 h-3.5" />;
      case 'CERTIFICATE':
        return <Award className="w-3.5 h-3.5" />;
      case 'NOTIFICATION':
      default:
        return <Bell className="w-3.5 h-3.5" />;
    }
  };

  const badges = cockpit?.moduleBadges;

  const moduleCards = [
    {
      key: 'ops_mgmt',
      show:
        hasAdminAccess ||
        user?.modules?.includes('PANEL') ||
        user?.modules?.includes('RENOVATION_REPORT') ||
        user?.modules?.includes('FIRE_SAFETY_CONTROL') ||
        user?.modules?.includes('FM200_TRACKING') ||
        user?.modules?.includes('IMPROVEMENTS_TRACKING'),
      title: 'Operasyon Yönetimi',
      desc: 'İSG Atama, denetimler, yangın & FM-200.',
      to: '/operations-management',
      icon: Wrench,
      iconCls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white',
      liveCount: badges?.OPERATIONS_MANAGEMENT || 0,
      liveLabel: 'aksiyon',
    },
    {
      key: 'safety_mgmt',
      show:
        hasAdminAccess ||
        user?.modules?.includes('OPERATIONS') ||
        user?.modules?.includes('RISKS') ||
        user?.modules?.includes('HAZMAT') ||
        user?.modules?.includes('CHECKLISTS'),
      title: 'İş Güvenliği Yönetimi',
      desc: 'Aylık veri, risk analizi, kimyasal, asansör.',
      to: '/safety-management',
      icon: ShieldCheck,
      iconCls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white',
      liveCount: badges?.SAFETY_MANAGEMENT || 0,
      liveLabel: 'bekleyen',
    },
    {
      key: 'workflow',
      show: hasAdminAccess || user?.modules?.includes('WORKFLOW'),
      title: 'İş Takip (Workflow)',
      desc: 'Görevler, planlar, takvim ve ekip koordinasyonu.',
      to: '/workflow',
      icon: Activity,
      iconCls: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white',
      liveCount: badges?.WORKFLOW || 0,
      liveLabel: 'görev',
    },
    {
      key: 'fire_eq',
      show: hasAdminAccess || user?.modules?.includes('FIRE_EQUIPMENT'),
      title: 'Yangın Envanteri',
      desc: 'Tüp, dolap, hidrant ve periyodik bakım.',
      to: '/fire-equipment',
      icon: Flame,
      iconCls: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:bg-rose-600 group-hover:text-white',
      liveCount: badges?.FIRE_EQUIPMENT || 0,
      liveLabel: 'bakım',
    },
    {
      key: 'build_mgmt',
      show: hasAdminAccess || user?.modules?.includes('BUILD_MANAGEMENT'),
      title: 'İnşaat & Renovasyon',
      desc: 'ICRA analizleri, risk matrisi ve onaylar.',
      to: '/build-management',
      icon: HardHat,
      iconCls: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 group-hover:bg-sky-600 group-hover:text-white',
      liveCount: 0,
      liveLabel: '',
    },
    {
      key: 'bina_turu',
      show: hasAdminAccess || user?.modules?.includes('BUILDING_TOUR'),
      title: 'Bina Turu Yönetimi',
      desc: 'Periyodik bina turları ve uygunsuzluklar.',
      to: '/bina-turu',
      icon: Building,
      iconCls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white',
      liveCount: badges?.BUILDING_TOUR || 0,
      liveLabel: 'açık',
    },
    {
      key: 'transfer',
      show: hasAdminAccess || user?.modules?.includes('FILE_TRANSFER'),
      title: 'Dosya Transferi',
      desc: '2 GB’a kadar süreli kurumsal dosya paylaşımı.',
      to: '/transfer',
      icon: UploadCloud,
      iconCls: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 group-hover:bg-cyan-600 group-hover:text-white',
      liveCount: 0,
      liveLabel: '',
    },
  ].filter((m) => m.show);

  const renderCompactRow = (item: CockpitItem, tone: 'critical' | 'checklist' | 'routine') => {
    const dueLabel = formatDueLabel(item);
    return (
      <div
        key={item.id}
        className={`px-3 py-2.5 rounded-lg border flex items-center justify-between gap-3 transition-colors ${
          tone === 'critical' && item.isOverdue
            ? 'border-destructive/30 bg-destructive/5 hover:border-destructive/50'
            : tone === 'critical'
            ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50'
            : 'border-border/70 bg-card hover:border-primary/40 hover:bg-muted/20'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
              tone === 'critical' && item.isOverdue
                ? 'bg-destructive/15 text-destructive'
                : tone === 'critical'
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                : tone === 'checklist'
                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {getSourceIcon(item.source)}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                {item.sourceLabel}
              </span>
              {dueLabel && (
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 tabular-nums font-semibold ${
                    item.isOverdue
                      ? 'bg-destructive text-destructive-foreground border-transparent'
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                  }`}
                >
                  {dueLabel}
                </Badge>
              )}
            </div>
            <p className="text-xs font-semibold text-foreground truncate mt-0.5">{item.title}</p>
            {item.subtitle && (
              <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
            )}
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          variant={tone === 'critical' && item.isOverdue ? 'destructive' : 'outline'}
          onClick={() => navigate(item.link)}
          className="h-7 px-2.5 text-[11px] gap-1 shrink-0"
        >
          {item.actionLabel}
          <ArrowRight className="w-3 h-3" />
        </Button>
      </div>
    );
  };

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
                Kişisel Kokpit
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border/60 bg-muted/30 text-[11px] text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="tabular-nums font-medium text-foreground">{activeCount}</span> aktif kullanıcı
            </div>

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
                  <span className="hidden sm:inline-block max-w-[130px] truncate">
                    {user?.fullName || user?.username || 'Hesabım'}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-lg shadow-sm">
                <DropdownMenuLabel className="text-xs font-semibold">
                  {user?.fullName || user?.username || 'Kullanıcı'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="text-xs cursor-pointer rounded-md">
                    <User className="w-3.5 h-3.5 mr-2" />
                    Profil Bilgileri
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile/facility')} className="text-xs cursor-pointer rounded-md">
                    <Building2 className="w-3.5 h-3.5 mr-2" />
                    Tesis ve Bilgileri
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile/locations')} className="text-xs cursor-pointer rounded-md">
                    <MapPin className="w-3.5 h-3.5 mr-2" />
                    Lokasyon ve Bilgileri
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
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Karşılama + 4 Kompakt KPI */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                Hoş geldiniz, {user?.fullName || user?.username}
              </h2>
              <p className="text-xs text-muted-foreground">
                Kritik aksiyonlar, tanımlanmış kontrol listeleri ve yaklaşan rutin kontroller tek bakışta.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-7 w-7 rounded-md shrink-0"
              title="Kokpiti Yenile"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
            <div className="px-3.5 py-2 rounded-lg border border-destructive/30 bg-destructive/5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-destructive">
                  Kritik &amp; Geciken
                </span>
                <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
              </div>
              <p className="text-lg font-bold text-destructive tabular-nums mt-0.5">
                {cockpit?.summary.criticalCount ?? 0}
              </p>
            </div>

            <div className="px-3.5 py-2 rounded-lg border border-blue-500/30 bg-blue-500/5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Kontrol Listesi
                </span>
                <ClipboardCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">
                {cockpit?.summary.checklistCount ?? 0}
              </p>
            </div>

            <div className="px-3.5 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Rutin &amp; Yaklaşan
                </span>
                <CalendarClock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">
                {cockpit?.summary.routineCount ?? 0}
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className="text-left px-3.5 py-2 rounded-lg border border-border/80 bg-card hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Duyuru / Bildirim
                </span>
                <Bell className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">
                {cockpit?.summary.unreadNotificationsCount ?? 0}
              </p>
            </button>
          </div>
        </div>

        {/* Ana 12 Kolon Grid: Sol 2/3 (3 Katmanlı Kokpit) + Sağ 1/3 (Modüllerim) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* SOL 2/3 (8 Kolon): 3 Ayrı Odaklı Kart */}
          <div className="lg:col-span-8 space-y-4">
            {/* 1. KART: KRİTİK & TERMİNİ GEÇENLER */}
            <Card className="rounded-lg border-destructive/30 overflow-hidden">
              <CardHeader className="py-3 px-4 border-b border-destructive/20 bg-destructive/5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <CardTitle className="text-sm font-semibold text-foreground">
                      1. Kritik ve Termini Geçen İşler
                    </CardTitle>
                  </div>
                  <Badge variant="destructive" className="text-[11px] tabular-nums">
                    {cockpit?.criticalItems.length ?? 0} Kayıt
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                {isLoading ? (
                  <div className="space-y-2">
                    <div className="h-12 rounded-lg bg-muted animate-pulse" />
                    <div className="h-12 rounded-lg bg-muted animate-pulse" />
                  </div>
                ) : !cockpit?.criticalItems?.length ? (
                  <div className="py-5 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Kritik veya termini geçmiş acil işiniz bulunmuyor.</span>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                    {cockpit.criticalItems.map((item) => renderCompactRow(item, 'critical'))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 2. KART: TANIMLANMIŞ & BEKLEYEN KONTROL LİSTELERİ */}
            <Card className="rounded-lg border-blue-500/30 overflow-hidden">
              <CardHeader className="py-3 px-4 border-b border-blue-500/20 bg-blue-500/5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <CardTitle className="text-sm font-semibold text-foreground">
                      2. Tanımlanmış ve Bekleyen Kontrol Listeleri
                    </CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-[11px] tabular-nums bg-blue-500/15 text-blue-700 dark:text-blue-300">
                    {cockpit?.checklistItems.length ?? 0} Liste
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                {isLoading ? (
                  <div className="h-12 rounded-lg bg-muted animate-pulse" />
                ) : !cockpit?.checklistItems?.length ? (
                  <div className="py-5 text-center text-xs text-muted-foreground">
                    Şu an size veya tesisinize tanımlanmış bekleyen kontrol listesi yok.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {cockpit.checklistItems.map((item) => renderCompactRow(item, 'checklist'))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 3. KART: RUTİN VE ZAMANI YAKLAŞAN KONTROLLER (ASANSÖR, YANGIN EKİPMANI, PK, SERTİFİKA) */}
            <Card className="rounded-lg border-emerald-500/30 overflow-hidden">
              <CardHeader className="py-3 px-4 border-b border-emerald-500/20 bg-emerald-500/5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <CardTitle className="text-sm font-semibold text-foreground">
                      3. Rutin ve Zamanı Yaklaşan Kontroller (30 Gün)
                    </CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-[11px] tabular-nums bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                    {cockpit?.routineItems.length ?? 0} Rutin
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                {isLoading ? (
                  <div className="h-12 rounded-lg bg-muted animate-pulse" />
                ) : !cockpit?.routineItems?.length ? (
                  <div className="py-5 text-center text-xs text-muted-foreground">
                    Önümüzdeki 30 gün içinde zamanı yaklaşan asansör, yangın ekipmanı veya periyodik kontrol kaydı yok.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                    {cockpit.routineItems.map((item) => renderCompactRow(item, 'routine'))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* SAĞ 1/3 (4 Kolon): Modüllerim + Duyurular + Hesabım & Tesisim */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="rounded-lg border-border/80">
              <CardHeader className="pb-3 border-b border-border bg-muted/20">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-primary" />
                    Modüllerim
                  </CardTitle>
                  <Badge variant="secondary" className="text-[11px] tabular-nums">
                    {moduleCards.length} Modül
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Yetkili olduğunuz modüllere tek tıkla geçin.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2.5">
                {moduleCards.map((mod) => {
                  const Icon = mod.icon;
                  return (
                    <button
                      key={mod.key}
                      type="button"
                      onClick={() => navigate(mod.to)}
                      className="group text-left p-3 rounded-lg border border-border/70 bg-card hover:border-primary/50 hover:shadow-xs transition-all duration-200 flex flex-col justify-between gap-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-colors ${mod.iconCls}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        {mod.liveCount > 0 && (
                          <Badge
                            variant="outline"
                            className="text-[10px] tabular-nums bg-primary/10 text-primary border-primary/25 px-1.5 py-0"
                          >
                            {mod.liveCount} {mod.liveLabel}
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                            {mod.title}
                          </span>
                          <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug">
                          {mod.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Okunmamış Duyurular */}
            {cockpit?.announcements && cockpit.announcements.length > 0 && (
              <Card className="rounded-lg border-border/80">
                <CardHeader className="py-2.5 px-4 border-b border-border bg-muted/20">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-primary" />
                      Okunmamış Duyurular
                    </CardTitle>
                    <Badge variant="secondary" className="text-[10px] tabular-nums">
                      {cockpit.announcements.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-3 space-y-2 max-h-48 overflow-y-auto">
                  {cockpit.announcements.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => navigate(a.link)}
                      className="w-full text-left p-2 rounded-md border border-border/60 hover:bg-muted/30 transition-colors"
                    >
                      <p className="text-xs font-semibold text-foreground truncate">{a.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{a.subtitle}</p>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Hesabım, Tesis ve Lokasyon Hızlı Erişim */}
            <Card className="rounded-lg border-border/80">
              <CardHeader className="pb-2.5 border-b border-border bg-muted/20">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Hesabım &amp; Tesisim
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/profile/facility')}
                  className="w-full justify-between h-8 text-xs font-medium px-2.5"
                >
                  <span className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                    Tesis ve Bilgileri
                  </span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/profile/locations')}
                  className="w-full justify-between h-8 text-xs font-medium px-2.5"
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    Lokasyon ve Bilgileri
                  </span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/profile')}
                  className="w-full justify-between h-8 text-xs font-medium px-2.5"
                >
                  <span className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-primary" />
                    Profil &amp; Sertifika Takibi
                  </span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                </Button>
              </CardContent>
            </Card>
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

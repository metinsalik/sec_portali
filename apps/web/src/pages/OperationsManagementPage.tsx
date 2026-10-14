import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/layout/NotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Settings
} from 'lucide-react';

export default function OperationsManagementPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const hasAdminAccess = user?.isAdmin || user?.isManagement || user?.roles?.includes('admin') || user?.roles?.includes('management');

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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-medium rounded-md border-border/60 text-muted-foreground">
                  Saha ve Operasyon
                </Badge>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                Operasyon Yönetim Sistemi
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                İşlemlerinizi gerçekleştirmek için ilgili operasyon alt modülünü seçin.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/portal')}
              className="h-8 text-xs rounded-md border-border/60 self-start sm:self-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Ana Portal'a Dön
            </Button>
          </div>

          {/* Module Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Card 1: İSG Atama Paneli */}
            {(hasAdminAccess || user?.modules?.includes('PANEL')) && (
              <Card
                onClick={() => navigate('/panel')}
                className="group border border-border/60 hover:border-primary/50 shadow-xs hover:shadow-sm transition-all duration-200 rounded-lg p-5 flex flex-col justify-between cursor-pointer bg-card"
              >
                <div>
                  <div className="w-10 h-10 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3.5 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                    <LayoutGrid className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    İSG Atama Paneli
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">
                    Profesyonel yönetimi, OSGB takibi, kurumsal atamalar ve yasal süre hesaplamaları.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/40 text-xs font-medium text-primary">
                  <span>Modüle Git</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            )}

            {/* Card 2: Entegre Risk ve Güvenlik Denetimi */}
            {(hasAdminAccess || user?.modules?.includes('RENOVATION_REPORT')) && (
              <Card
                onClick={() => navigate('/renovation-report')}
                className="group border border-border/60 hover:border-primary/50 shadow-xs hover:shadow-sm transition-all duration-200 rounded-lg p-5 flex flex-col justify-between cursor-pointer bg-card"
              >
                <div>
                  <div className="w-10 h-10 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3.5 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    Entegre Risk ve Güvenlik Denetimi
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">
                    İnşaat ve renovasyon alanlarının operasyonel teslim raporları ve takibi.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/40 text-xs font-medium text-primary">
                  <span>Modüle Git</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            )}

            {/* Card 3: Yangın Güvenliği Kontrol Sistemi */}
            {(hasAdminAccess || user?.modules?.includes('FIRE_SAFETY_CONTROL')) && (
              <Card
                onClick={() => navigate('/fire-safety-control')}
                className="group border border-border/60 hover:border-primary/50 shadow-xs hover:shadow-sm transition-all duration-200 rounded-lg p-5 flex flex-col justify-between cursor-pointer bg-card"
              >
                <div>
                  <div className="w-10 h-10 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3.5 transition-colors group-hover:bg-rose-600 group-hover:text-white">
                    <Flame className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    Yangın Güvenliği Kontrol Sistemi
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">
                    Saha tespitleri, itfaiye ve denetim raporları, termin ve aksiyon takibi, kanıt yönetimi.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/40 text-xs font-medium text-primary">
                  <span>Modüle Git</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            )}

            {/* Card 4: FM-200 & Gazlı Söndürme */}
            {(hasAdminAccess || user?.modules?.includes('FM200_TRACKING')) && (
              <Card
                onClick={() => navigate('/fm200')}
                className="group border border-border/60 hover:border-primary/50 shadow-xs hover:shadow-sm transition-all duration-200 rounded-lg p-5 flex flex-col justify-between cursor-pointer bg-card"
              >
                <div>
                  <div className="w-10 h-10 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-3.5 transition-colors group-hover:bg-cyan-600 group-hover:text-white">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    FM-200 & Gazlı Söndürme
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">
                    4 fazlı adım adım denetim sihirbazı, mahal tüp envanteri, sızdırmazlık testi ve kanıtlı iş emri yönetimi.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/40 text-xs font-medium text-primary">
                  <span>Modüle Git</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            )}

            {/* Card 5: İyileştirme ve Aksiyon Takip */}
            {(hasAdminAccess || user?.modules?.includes('IMPROVEMENTS_TRACKING')) && (
              <Card
                onClick={() => navigate('/operations-management/improvements')}
                className="group border border-border/60 hover:border-primary/50 shadow-xs hover:shadow-sm transition-all duration-200 rounded-lg p-5 flex flex-col justify-between cursor-pointer bg-card"
              >
                <div>
                  <div className="w-10 h-10 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3.5 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    İyileştirme ve Aksiyon Takip
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">
                    Hastane denetimleri, elektrik PK, topraklama, pano ve trafo periyodik kontrolleri konsolide takibi.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/40 text-xs font-medium text-primary">
                  <span>Modüle Git</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            )}

            {/* Card 6: Elektrik Pano & Termal Kamera Kontrolü */}
            {(hasAdminAccess || user?.modules?.includes('ELECTRIC_PANEL_INSPECTION') || user?.modules?.includes('THERMAL_CAMERA')) && (
              <Card
                onClick={() => navigate('/operations-management/thermal-camera')}
                className="group border border-border/60 hover:border-primary/50 shadow-xs hover:shadow-sm transition-all duration-200 rounded-lg p-5 flex flex-col justify-between cursor-pointer bg-card"
              >
                <div>
                  <div className="w-10 h-10 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3.5 transition-colors group-hover:bg-amber-600 group-hover:text-white">
                    <Camera className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    Elektrik Pano & Termal Kamera
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">
                    Tesislerdeki panoların termal kamera ile periyodik ısınma ölçümleri, Excel yükleme ve kritik aksiyon yönetimi.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/40 text-xs font-medium text-primary">
                  <span>Modüle Git</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            )}
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

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
  Users,
  BookOpen,
  FileSpreadsheet,
  AlertTriangle,
  FlaskConical,
  ListChecks,
  DoorClosed,
  ArrowUpDown,
  Zap,
  User,
  LogOut,
  Settings
} from 'lucide-react';

export default function SafetyManagementPage() {
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
                  İş Güvenliği
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
                  İş Sağlığı ve Güvenliği
                </Badge>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                İş Güvenliği Yönetim Modülü
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                İşlemlerinizi gerçekleştirmek için ilgili iş güvenliği alt modülünü seçin.
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
            {/* Card 1: İSG Kurul Yönetimi */}
            {(hasAdminAccess || user?.modules?.includes('ISG_KURUL')) && (
              <Card
                onClick={() => navigate('/isg-kurul')}
                className="group border border-border/60 hover:border-primary/50 shadow-xs hover:shadow-sm transition-all duration-200 rounded-lg p-5 flex flex-col justify-between cursor-pointer bg-card"
              >
                <div>
                  <div className="w-10 h-10 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3.5 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    İSG Kurul Yönetimi
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">
                    İş Sağlığı ve Güvenliği Kurul toplantıları, gündem ve kararlarının takibi.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/40 text-xs font-medium text-primary">
                  <span>Modüle Git</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            )}

            {/* Card 2: Tespit ve Öneri Defteri */}
            {(hasAdminAccess || user?.modules?.includes('ISG_DEFTER')) && (
              <Card
                onClick={() => navigate('/safety-management/isg-defter')}
                className="group border border-border/60 hover:border-primary/50 shadow-xs hover:shadow-sm transition-all duration-200 rounded-lg p-5 flex flex-col justify-between cursor-pointer bg-card"
              >
                <div>
                  <div className="w-10 h-10 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3.5 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    Tespit ve Öneri Defteri
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">
                    İSG Uzmanı ve İşyeri Hekimi onaylı karar kayıtları, aksiyonlar ve iyileştirme süreçleri.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/40 text-xs font-medium text-primary">
                  <span>Modüle Git</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            )}

            {/* Card 3: Aylık Veri Sistemi */}
            {(hasAdminAccess || user?.modules?.includes('OPERATIONS')) && (
              <Card
                onClick={() => navigate('/operations')}
                className="group border border-border/60 hover:border-primary/50 shadow-xs hover:shadow-sm transition-all duration-200 rounded-lg p-5 flex flex-col justify-between cursor-pointer bg-card"
              >
                <div>
                  <div className="w-10 h-10 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3.5 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    Aylık Veri Sistemi
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">
                    Aylık çalışma saatleri, çalışan sayıları, kaza kayıtları ve denetim bulgusu girişleri.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/40 text-xs font-medium text-primary">
                  <span>Modüle Git</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            )}

            {/* Card 4: Risk Değerlendirmesi */}
            {(hasAdminAccess || user?.modules?.includes('RISKS')) && (
              <Card
                onClick={() => navigate('/risks')}
                className="group border border-border/60 hover:border-primary/50 shadow-xs hover:shadow-sm transition-all duration-200 rounded-lg p-5 flex flex-col justify-between cursor-pointer bg-card"
              >
                <div>
                  <div className="w-10 h-10 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3.5 transition-colors group-hover:bg-amber-600 group-hover:text-white">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    Risk Değerlendirmesi
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">
                    Fine Kinney ve Matris yöntemi ile risk değerlendirme, 4 aşamalı iyileştirme takibi.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/40 text-xs font-medium text-primary">
                  <span>Modüle Git</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            )}

            {/* Card 5: Tehlikeli Madde Yönetimi */}
            {(hasAdminAccess || user?.modules?.includes('HAZMAT')) && (
              <Card
                onClick={() => navigate('/hazmat/dashboard')}
                className="group border border-border/60 hover:border-primary/50 shadow-xs hover:shadow-sm transition-all duration-200 rounded-lg p-5 flex flex-col justify-between cursor-pointer bg-card"
              >
                <div>
                  <div className="w-10 h-10 rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-3.5 transition-colors group-hover:bg-violet-600 group-hover:text-white">
                    <FlaskConical className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    Tehlikeli Madde Yönetimi
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">
                    Kimyasal envanteri, SDS kartları yönetimi, KKD ve tehlike etiketleri takibi.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/40 text-xs font-medium text-primary">
                  <span>Modüle Git</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            )}

            {/* Card 6: İSG Kontrol Listeleri */}
            {(hasAdminAccess || user?.modules?.includes('CHECKLISTS')) && (
              <Card
                onClick={() => navigate('/checklists')}
                className="group border border-border/60 hover:border-primary/50 shadow-xs hover:shadow-sm transition-all duration-200 rounded-lg p-5 flex flex-col justify-between cursor-pointer bg-card"
              >
                <div>
                  <div className="w-10 h-10 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3.5 transition-colors group-hover:bg-teal-600 group-hover:text-white">
                    <ListChecks className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    İSG Kontrol Listeleri
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">
                    Saha denetimleri için esnek formlar oluşturun, mobil ortamda doldurun ve Excel'e aktarın.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/40 text-xs font-medium text-primary">
                  <span>Modüle Git</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            )}

            {/* Card 7: Yangın Kapıları */}
            {(hasAdminAccess || user?.modules?.includes('FIRE_DOORS')) && (
              <Card
                onClick={() => navigate('/safety-management/fire-doors')}
                className="group border border-border/60 hover:border-primary/50 shadow-xs hover:shadow-sm transition-all duration-200 rounded-lg p-5 flex flex-col justify-between cursor-pointer bg-card"
              >
                <div>
                  <div className="w-10 h-10 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3.5 transition-colors group-hover:bg-rose-600 group-hover:text-white">
                    <DoorClosed className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    Yangın Kapıları
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">
                    Yangın kapılarının envanteri, denetimi ve puanlama tabanlı periyodik kontrolleri.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/40 text-xs font-medium text-primary">
                  <span>Modüle Git</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            )}

            {/* Card 8: Asansör Takip Yönetimi */}
            {(hasAdminAccess || user?.modules?.includes('ELEVATOR_TRACKING')) && (
              <Card
                onClick={() => navigate('/safety-management/elevator-tracking')}
                className="group border border-border/60 hover:border-primary/50 shadow-xs hover:shadow-sm transition-all duration-200 rounded-lg p-5 flex flex-col justify-between cursor-pointer bg-card"
              >
                <div>
                  <div className="w-10 h-10 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-3.5 transition-colors group-hover:bg-cyan-600 group-hover:text-white">
                    <ArrowUpDown className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    Asansör Takip Yönetimi
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">
                    Tesislerdeki asansörlerin envanteri, muayene tarihleri ve etiket durumlarının takibi.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/40 text-xs font-medium text-primary">
                  <span>Modüle Git</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            )}

            {/* Card 9: Elektrik Altyapı Kontrol Formu (Sadece Yönetici) */}
            {hasAdminAccess && (
              <Card
                onClick={() => navigate('/safety-management/electric-infrastructure')}
                className="group border border-border/60 hover:border-primary/50 shadow-xs hover:shadow-sm transition-all duration-200 rounded-lg p-5 flex flex-col justify-between cursor-pointer bg-card"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-10 h-10 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center transition-colors group-hover:bg-amber-600 group-hover:text-white">
                      <Zap className="w-5 h-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-medium rounded-md border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10">
                      Yönetici
                    </Badge>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    Elektrik Altyapı Kontrol
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">
                    Tesislerdeki ADP, jeneratör, kat panoları ve kritik altyapıların kontrol ve takip formu.
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

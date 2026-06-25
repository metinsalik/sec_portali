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
    refetchInterval: 15000, // 15 saniyede bir güncelle
  });
  const activeCount = activeData?.count ?? 0;

  // Admin veya Yönetici rolü kontrolü
  const hasAdminAccess = user?.isAdmin || user?.isManagement || user?.roles?.includes('admin') || user?.roles?.includes('management');

  // Kullanıcı isminin baş harflerini alma
  const getInitials = (name: string) => {
    if (!name) return 'MS';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
  const userInitials = getInitials(user?.fullName || user?.username || 'Metin Salık');

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#f8f9ff] dark:bg-[#171c20] bg-[radial-gradient(#d3e4fe_1px,transparent_1px)] dark:bg-[radial-gradient(#2c3135_1px,transparent_1px)] bg-[size:32px_32px] text-[#171c20] dark:text-[#edf1f6] transition-colors duration-300">

      {/* Desktop Header (hidden on mobile) */}
      <header className="hidden md:block bg-white dark:bg-[#171c20] border-b border-[#c2c7cc] dark:border-[#73787c] shadow-sm sticky top-0 z-50">
        <div className="flex justify-between items-center h-16 px-6 w-full max-w-[1440px] mx-auto">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center h-10">
              <img src="/mlpcare.jpg" alt="MLP Care Logo" className="h-full object-contain rounded-md" />
            </div>
            <h1 className="text-2xl font-bold text-[#0051d5] dark:text-[#b4c5ff]">HSE Portalı</h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[#42474b] dark:text-[#949899] text-sm">
              <span>Hoş geldin, <span className="font-bold text-[#171c20] dark:text-[#edf1f6]">{user?.fullName || user?.username || 'Metin Salık'}</span></span>
            </div>

            {hasAdminAccess && (
              <button
                onClick={() => navigate('/settings')}
                className="flex items-center gap-1.5 text-[#42474b] dark:text-[#949899] hover:text-[#0051d5] dark:hover:text-[#b4c5ff] transition-colors text-sm font-medium active:scale-95 duration-150"
              >
                <span className="material-symbols-outlined text-[18px]">settings</span>
                <span>Sistem Ayarları</span>
              </button>
            )}

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <NotificationBell />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="px-4 py-2 border border-[#c2c7cc] dark:border-[#73787c] rounded-lg text-sm font-medium text-[#171c20] dark:text-[#edf1f6] hover:bg-[#f0f4f9] dark:hover:bg-[#181c1d] transition-all active:scale-95">
                    Hesabım
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>{user?.fullName || user?.username || 'Metin Salık'}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                      <span className="material-symbols-outlined text-[18px] mr-2">person</span>
                      Profil
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600 cursor-pointer">
                    <span className="material-symbols-outlined text-[18px] mr-2">logout</span>
                    Çıkış Yap
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header (hidden on desktop) */}
      <header className="md:hidden sticky top-0 z-50 bg-white dark:bg-[#171c20] border-b border-[#c2c7cc] dark:border-[#73787c] w-full">
        <div className="flex justify-between items-center w-full px-4 py-4 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-2">
            <img src="/mlpcare.jpg" alt="MLP Care Logo" className="h-8 object-contain rounded" />
            <span className="text-xl font-bold text-[#011d2b] dark:text-[#cbe6fa] tracking-tight">HSE Portalı</span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <NotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-10 w-10 rounded-full bg-[#346cef] text-white flex items-center justify-center font-bold cursor-pointer active:scale-95 transition-transform">
                  {userInitials}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>{user?.fullName || user?.username || 'Metin Salık'}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                    <span className="material-symbols-outlined text-[18px] mr-2">person</span>
                    Profil
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600 cursor-pointer">
                  <span className="material-symbols-outlined text-[18px] mr-2">logout</span>
                  Çıkış Yap
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-6 py-8 md:py-10 flex flex-col pb-36 md:pb-10">

        {/* Header Section */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-[#011d2b] dark:text-[#cbe6fa] mb-2">Uygulamalar</h2>
          <p className="text-[#42474b] dark:text-[#949899] text-base md:text-lg">Lütfen işlem yapmak istediğiniz modülü seçin.</p>
        </div>

        {/* Bento Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Card 1: İSG Atama Paneli (Only shown to admin/management) */}
          {hasAdminAccess && (
            <div
              onClick={() => navigate('/panel')}
              className="group bg-white dark:bg-[#2c3135] border border-slate-200/80 dark:border-[#73787c]/30 rounded-xl p-6 md:p-8 form-shadow hover:translate-y-[-4px] transition-all duration-300 flex flex-col justify-between cursor-pointer active:scale-98"
            >
              {/* Mobile Card Layout */}
              <div className="flex md:hidden items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#e5eeff] dark:bg-[#0051d5]/20 flex items-center justify-center text-[#0051d5] dark:text-[#b4c5ff]">
                  <span className="material-symbols-outlined text-[28px]">grid_view</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-[#171c20] dark:text-[#edf1f6] mb-1">İSG Atama Paneli</h2>
                  <p className="text-sm text-[#42474b] dark:text-[#949899] mb-4">
                    Profesyonel yönetimi, OSGB takibi, kurumsal atamalar ve yasal süre hesaplamaları.
                  </p>
                  <div className="flex items-center gap-2 text-[#0051d5] dark:text-[#b4c5ff] text-sm font-medium group-hover:underline">
                    Uygulamaya Git
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </div>
                </div>
              </div>

              {/* Desktop Card Layout */}
              <div className="hidden md:flex flex-col justify-between h-full">
                <div>
                  <div className="w-14 h-14 rounded-xl bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center mb-6 text-[#0051d5] dark:text-[#b4c5ff] transition-transform group-hover:scale-110">
                    <span className="material-symbols-outlined text-[32px]">grid_view</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#011d2b] dark:text-[#cbe6fa] mb-2">İSG Atama Paneli</h3>
                  <p className="text-[#42474b] dark:text-[#949899] text-base mb-8 leading-relaxed">
                    Profesyonel yönetimi, OSGB takibi, kurumsal atamalar ve yasal süre hesaplamaları.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 text-[#0051d5] dark:text-[#b4c5ff] text-sm font-medium group-hover:gap-4 transition-all">
                  Uygulamaya Git
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </div>
              </div>
            </div>
          )}

          {/* Card 2: Aylık Veri Sistemi */}
          <div
            onClick={() => navigate('/operations')}
            className="group bg-white dark:bg-[#2c3135] border border-slate-200/80 dark:border-[#73787c]/30 rounded-xl p-6 md:p-8 form-shadow hover:translate-y-[-4px] transition-all duration-300 flex flex-col justify-between cursor-pointer active:scale-98"
          >
            {/* Mobile Card Layout */}
            <div className="flex md:hidden items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#e8f5e9] dark:bg-[#1b5e20]/20 flex items-center justify-center text-[#2e7d32] dark:text-emerald-400">
                <span className="material-symbols-outlined text-[28px]">description</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-[#171c20] dark:text-[#edf1f6] mb-1">Aylık Veri Sistemi</h2>
                <p className="text-sm text-[#42474b] dark:text-[#949899] mb-4">
                  Aylık çalışma saatleri, çalışan sayıları, kaza kayıtları ve denetim bulgusu girişleri.
                </p>
                <div className="flex items-center gap-2 text-[#2e7d32] dark:text-emerald-400 text-sm font-medium group-hover:underline">
                  Uygulamaya Git
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </div>
              </div>
            </div>

            {/* Desktop Card Layout */}
            <div className="hidden md:flex flex-col justify-between h-full">
              <div>
                <div className="w-14 h-14 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center mb-6 text-[#2e7d32] dark:text-emerald-400 transition-transform group-hover:scale-110">
                  <span className="material-symbols-outlined text-[32px]">description</span>
                </div>
                <h3 className="text-xl font-bold text-[#011d2b] dark:text-[#cbe6fa] mb-2">Aylık Veri Sistemi</h3>
                <p className="text-[#42474b] dark:text-[#949899] text-base mb-8 leading-relaxed">
                  Aylık çalışma saatleri, çalışan sayıları, kaza kayıtları ve denetim bulgusu girişleri.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-[#2e7d32] dark:text-emerald-400 text-sm font-medium group-hover:gap-4 transition-all">
                Uygulamaya Git
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </div>
            </div>
          </div>

          {/* Card 3: İş Takip */}
          <div
            onClick={() => navigate('/workflow')}
            className="group bg-white dark:bg-[#2c3135] border border-slate-200/80 dark:border-[#73787c]/30 rounded-xl p-6 md:p-8 form-shadow hover:translate-y-[-4px] transition-all duration-300 flex flex-col justify-between cursor-pointer active:scale-98"
          >
            {/* Mobile Card Layout */}
            <div className="flex md:hidden items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#f3e5f5] dark:bg-[#4a148c]/20 flex items-center justify-center text-[#7b1fa2] dark:text-purple-400">
                <span className="material-symbols-outlined text-[28px]">account_tree</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-[#171c20] dark:text-[#edf1f6] mb-1">İş Takip</h2>
                <p className="text-sm text-[#42474b] dark:text-[#949899] mb-4">
                  İş atama, durum takibi, ekip yönetimi ve bildirim sistemi.
                </p>
                <div className="flex items-center gap-2 text-[#7b1fa2] dark:text-purple-400 text-sm font-medium group-hover:underline">
                  Uygulamaya Git
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </div>
              </div>
            </div>

            {/* Desktop Card Layout */}
            <div className="hidden md:flex flex-col justify-between h-full">
              <div>
                <div className="w-14 h-14 rounded-xl bg-purple-50 dark:bg-purple-950/20 flex items-center justify-center mb-6 text-[#7b1fa2] dark:text-purple-400 transition-transform group-hover:scale-110">
                  <span className="material-symbols-outlined text-[32px]">account_tree</span>
                </div>
                <h3 className="text-xl font-bold text-[#011d2b] dark:text-[#cbe6fa] mb-2">İş Takip</h3>
                <p className="text-[#42474b] dark:text-[#949899] text-base mb-8 leading-relaxed">
                  İş atama, durum takibi, ekip yönetimi ve bildirim sistemi.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-[#7b1fa2] dark:text-purple-400 text-sm font-medium group-hover:gap-4 transition-all">
                Uygulamaya Git
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </div>
            </div>
          </div>

          {/* Card 4: Risk Değerlendirmesi */}
          <div
            onClick={() => navigate('/risks')}
            className="group bg-white dark:bg-[#2c3135] border border-slate-200/80 dark:border-[#73787c]/30 rounded-xl p-6 md:p-8 form-shadow hover:translate-y-[-4px] transition-all duration-300 flex flex-col justify-between cursor-pointer active:scale-98"
          >
            {/* Mobile Card Layout */}
            <div className="flex md:hidden items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#fff3e0] dark:bg-[#e65100]/20 flex items-center justify-center text-[#ef6c00] dark:text-orange-400">
                <span className="material-symbols-outlined text-[28px]">warning</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-[#171c20] dark:text-[#edf1f6] mb-1">Risk Değerlendirmesi</h2>
                <p className="text-sm text-[#42474b] dark:text-[#949899] mb-4">
                  Fine Kinney ve Matris yöntemi ile risk değerlendirme, 4 aşamalı iyileştirme takibi.
                </p>
                <div className="flex items-center gap-2 text-[#ef6c00] dark:text-orange-400 text-sm font-medium group-hover:underline">
                  Uygulamaya Git
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </div>
              </div>
            </div>

            {/* Desktop Card Layout */}
            <div className="hidden md:flex flex-col justify-between h-full">
              <div>
                <div className="w-14 h-14 rounded-xl bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center mb-6 text-[#ef6c00] dark:text-orange-400 transition-transform group-hover:scale-110">
                  <span className="material-symbols-outlined text-[32px]">warning</span>
                </div>
                <h3 className="text-xl font-bold text-[#011d2b] dark:text-[#cbe6fa] mb-2">Risk Değerlendirmesi</h3>
                <p className="text-[#42474b] dark:text-[#949899] text-base mb-8 leading-relaxed">
                  Fine Kinney ve Matris yöntemi ile risk değerlendirme, 4 aşamalı iyileştirme takibi.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-[#ef6c00] dark:text-orange-400 text-sm font-medium group-hover:gap-4 transition-all">
                Uygulamaya Git
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </div>
            </div>
          </div>

          {/* Card 5: Tehlikeli Madde Yönetimi */}
          <div
            onClick={() => navigate('/hazmat/dashboard')}
            className="group bg-white dark:bg-[#2c3135] border border-slate-200/80 dark:border-[#73787c]/30 rounded-xl p-6 md:p-8 form-shadow hover:translate-y-[-4px] transition-all duration-300 flex flex-col justify-between cursor-pointer active:scale-98"
          >
            {/* Mobile Card Layout */}
            <div className="flex md:hidden items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#fff8e1] dark:bg-[#f57f17]/20 flex items-center justify-center text-[#f57f17] dark:text-yellow-500">
                <span className="material-symbols-outlined text-[28px]">science</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-[#171c20] dark:text-[#edf1f6] mb-1">Tehlikeli Madde Yönetimi</h2>
                <p className="text-sm text-[#42474b] dark:text-[#949899] mb-4">
                  Kimyasal envanteri, SDS kartları yönetimi, KKD ve tehlike etiketleri takibi.
                </p>
                <div className="flex items-center gap-2 text-[#f57f17] dark:text-yellow-500 text-sm font-medium group-hover:underline">
                  Uygulamaya Git
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </div>
              </div>
            </div>

            {/* Desktop Card Layout */}
            <div className="hidden md:flex flex-col justify-between h-full">
              <div>
                <div className="w-14 h-14 rounded-xl bg-yellow-50 dark:bg-yellow-950/20 flex items-center justify-center mb-6 text-[#f57f17] dark:text-yellow-500 transition-transform group-hover:scale-110">
                  <span className="material-symbols-outlined text-[32px]">science</span>
                </div>
                <h3 className="text-xl font-bold text-[#011d2b] dark:text-[#cbe6fa] mb-2">Tehlikeli Madde Yönetimi</h3>
                <p className="text-[#42474b] dark:text-[#949899] text-base mb-8 leading-relaxed">
                  Kimyasal envanteri, SDS kartları yönetimi, KKD ve tehlike etiketleri takibi.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-[#f57f17] dark:text-yellow-500 text-sm font-medium group-hover:gap-4 transition-all">
                Uygulamaya Git
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </div>
            </div>
          </div>

          {/* Card 6: Fire Equipment */}
          <div
            onClick={() => navigate('/fire-equipment')}
            className="group bg-white dark:bg-[#2c3135] border border-slate-200/80 dark:border-[#73787c]/30 rounded-xl p-6 md:p-8 form-shadow hover:translate-y-[-4px] transition-all duration-300 flex flex-col justify-between cursor-pointer active:scale-98"
          >
            {/* Mobile Card Layout */}
            <div className="flex md:hidden items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#ffebee] dark:bg-[#d32f2f]/20 flex items-center justify-center text-[#d32f2f] dark:text-red-500">
                <span className="material-symbols-outlined text-[28px]">local_fire_department</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-[#171c20] dark:text-[#edf1f6] mb-1">Yangın Envanteri</h2>
                <p className="text-sm text-[#42474b] dark:text-[#949899] mb-4">
                  Yangın ekipmanları envanter, lokasyon ve bakım yönetimi.
                </p>
                <div className="flex items-center gap-2 text-[#d32f2f] dark:text-red-500 text-sm font-medium group-hover:underline">
                  Uygulamaya Git
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </div>
              </div>
            </div>

            {/* Desktop Card Layout */}
            <div className="hidden md:flex flex-col justify-between h-full">
              <div>
                <div className="w-14 h-14 rounded-xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center mb-6 text-[#d32f2f] dark:text-red-500 transition-transform group-hover:scale-110">
                  <span className="material-symbols-outlined text-[32px]">local_fire_department</span>
                </div>
                <h3 className="text-xl font-bold text-[#011d2b] dark:text-[#cbe6fa] mb-2">Yangın Envanter Yönetimi</h3>
                <p className="text-[#42474b] dark:text-[#949899] text-base mb-8 leading-relaxed">
                  Yangın ekipmanları envanter, lokasyon ve periyodik bakım yönetimi.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-[#d32f2f] dark:text-red-500 text-sm font-medium group-hover:gap-4 transition-all">
                Uygulamaya Git
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </div>
            </div>
          </div>


          {/* Card 7: İnşaat ve Renovasyon Yönetimi */}
          <div
            onClick={() => navigate('/build-management')}
            className="group bg-white dark:bg-[#2c3135] border border-slate-200/80 dark:border-[#73787c]/30 rounded-xl p-6 md:p-8 form-shadow hover:translate-y-[-4px] transition-all duration-300 flex flex-col justify-between cursor-pointer active:scale-98"
          >
            {/* Mobile Card Layout */}
            <div className="flex md:hidden items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#e3f2fd] dark:bg-[#1565c0]/20 flex items-center justify-center text-[#1565c0] dark:text-blue-400">
                <span className="material-symbols-outlined text-[28px]">construction</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-[#171c20] dark:text-[#edf1f6] mb-1">İnşaat ve Renovasyon</h2>
                <p className="text-sm text-[#42474b] dark:text-[#949899] mb-4">
                  İnşaat, renovasyon projelerinin ICRA, risk ve onay süreçleri yönetimi.
                </p>
                <div className="flex items-center gap-2 text-[#1565c0] dark:text-blue-400 text-sm font-medium group-hover:underline">
                  Uygulamaya Git
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </div>
              </div>
            </div>

            {/* Desktop Card Layout */}
            <div className="hidden md:flex flex-col justify-between h-full">
              <div>
                <div className="w-14 h-14 rounded-xl bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center mb-6 text-[#1565c0] dark:text-blue-400 transition-transform group-hover:scale-110">
                  <span className="material-symbols-outlined text-[32px]">construction</span>
                </div>
                <h3 className="text-xl font-bold text-[#011d2b] dark:text-[#cbe6fa] mb-2">İnşaat ve Renovasyon Yönetimi</h3>
                <p className="text-[#42474b] dark:text-[#949899] text-base mb-8 leading-relaxed">
                  İnşaat, renovasyon projelerinin ICRA, risk ve onay süreçleri yönetimi.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-[#1565c0] dark:text-blue-400 text-sm font-medium group-hover:gap-4 transition-all">
                Uygulamaya Git
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </div>
            </div>
          </div>

          {/* Card 8: Bina Turu Yönetimi */}
          <div
            onClick={() => navigate('/bina-turu')}
            className="group bg-white dark:bg-[#2c3135] border border-slate-200/80 dark:border-[#73787c]/30 rounded-xl p-6 md:p-8 form-shadow hover:translate-y-[-4px] transition-all duration-300 flex flex-col justify-between cursor-pointer active:scale-98"
          >
            {/* Mobile Card Layout */}
            <div className="flex md:hidden items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#e3f2fd] dark:bg-[#1565c0]/20 flex items-center justify-center text-[#0d47a1] dark:text-blue-500">
                <span className="material-symbols-outlined text-[28px]">apartment</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-[#171c20] dark:text-[#edf1f6] mb-1">Bina Turu Yönetimi</h2>
                <p className="text-sm text-[#42474b] dark:text-[#949899] mb-4">
                  Bina turlarını planlayın, denetimleri yürütün, uygunsuzlukları takip edin.
                </p>
                <div className="flex items-center gap-2 text-[#0d47a1] dark:text-blue-500 text-sm font-medium group-hover:underline">
                  Uygulamaya Git
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </div>
              </div>
            </div>

            {/* Desktop Card Layout */}
            <div className="hidden md:flex flex-col justify-between h-full">
              <div>
                <div className="w-14 h-14 rounded-xl bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center mb-6 text-[#0d47a1] dark:text-blue-500 transition-transform group-hover:scale-110">
                  <span className="material-symbols-outlined text-[32px]">apartment</span>
                </div>
                <h3 className="text-xl font-bold text-[#011d2b] dark:text-[#cbe6fa] mb-2">Bina Turu Yönetimi</h3>
                <p className="text-[#42474b] dark:text-[#949899] text-base mb-8 leading-relaxed">
                  Bina turlarını planlayın, denetimleri yürütün, uygunsuzlukları takip edin.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-[#0d47a1] dark:text-blue-500 text-sm font-medium group-hover:gap-4 transition-all">
                Uygulamaya Git
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </div>
            </div>
          </div>

        </div>

        {/* Active User Count Summary (hidden on mobile, visible on desktop) */}
        <section className="hidden md:flex mt-12 bg-[#eaeef3] dark:bg-[#2c3031] p-6 rounded-xl border border-[#c2c7cc] dark:border-[#73787c]/30 flex-col md:flex-row gap-6 items-center">
          <div className="flex-grow">
            <h4 className="text-sm font-bold text-[#171c20] dark:text-[#edf1f6] mb-1">O An Aktif Kullanıcı Sayısı</h4>
            <div className="flex items-center gap-2 text-xs text-[#42474b] dark:text-[#949899]">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Şu an sistemde aktif <span className="font-bold text-emerald-600 dark:text-emerald-400">{activeCount}</span> kullanıcı bulunuyor.
            </div>
          </div>
          <div className="flex gap-4">
            <div className="bg-white dark:bg-[#2c3135] px-4 py-2 rounded-lg border border-[#c2c7cc] dark:border-[#73787c]/30 text-center min-w-[120px]">
              <div className="text-[10px] font-bold text-[#42474b] dark:text-[#949899] uppercase tracking-wider">Aktif Atamalar</div>
              <div className="text-2xl font-bold text-[#011d2b] dark:text-[#cbe6fa]">124</div>
            </div>
            <div className="bg-white dark:bg-[#2c3135] px-4 py-2 rounded-lg border border-[#c2c7cc] dark:border-[#73787c]/30 text-center min-w-[120px]">
              <div className="text-[10px] font-bold text-[#42474b] dark:text-[#949899] uppercase tracking-wider">Bekleyen Görevler</div>
              <div className="text-2xl font-bold text-[#0051d5] dark:text-[#b4c5ff]">8</div>
            </div>
          </div>
        </section>

      </main>

      {/* Desktop Footer (hidden on mobile) */}
      <footer className="hidden md:block bg-white dark:bg-[#171c20] border-t border-[#c2c7cc] dark:border-[#73787c] py-6 px-6 w-full max-w-[1440px] mx-auto mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <span className="text-sm font-semibold text-[#171c20] dark:text-[#edf1f6]">MLP-CARE</span>
            <span className="text-xs text-[#42474b] dark:text-[#949899]">© 2026 MLP-CARE Healthcare Portal. All rights reserved.</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <a className="text-xs text-[#42474b] dark:text-[#949899] hover:text-[#0051d5] dark:hover:text-[#b4c5ff] transition-colors" href="#">Privacy Policy</a>
            <a className="text-xs text-[#42474b] dark:text-[#949899] hover:text-[#0051d5] dark:hover:text-[#b4c5ff] transition-colors" href="#">Terms of Service</a>
            <a className="text-xs text-[#42474b] dark:text-[#949899] hover:text-[#0051d5] dark:hover:text-[#b4c5ff] transition-colors" href="#">Security</a>
            <a className="text-xs text-[#42474b] dark:text-[#949899] hover:text-[#0051d5] dark:hover:text-[#b4c5ff] transition-colors" href="#">Cookie Settings</a>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Nav Bar */}
      <nav className="md:hidden fixed bottom-[72px] left-0 w-full z-40 bg-[#f0f4f9] dark:bg-[#2c3031] border-t border-[#c2c7cc] dark:border-[#73787c]/30 flex justify-around py-2.5 px-2 shadow-md">
        <button
          onClick={() => navigate('/portal')}
          className="flex flex-col items-center gap-0.5 text-[#0051d5] dark:text-[#b4c5ff] font-bold active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>grid_view</span>
          <span className="text-[10px] uppercase tracking-tighter">Modüller</span>
        </button>
        <button
          onClick={() => navigate('/notifications')}
          className="flex flex-col items-center gap-0.5 text-[#42474b] dark:text-[#949899] hover:text-[#0051d5] dark:hover:text-[#b4c5ff] active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">notifications</span>
          <span className="text-[10px] uppercase tracking-tighter">Bildirimler</span>
        </button>
        {hasAdminAccess && (
          <button
            onClick={() => navigate('/settings')}
            className="flex flex-col items-center gap-0.5 text-[#42474b] dark:text-[#949899] hover:text-[#0051d5] dark:hover:text-[#b4c5ff] active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined">settings</span>
            <span className="text-[10px] uppercase tracking-tighter">Ayarlar</span>
          </button>
        )}
        <button
          onClick={() => navigate('/profile')}
          className="flex flex-col items-center gap-0.5 text-[#42474b] dark:text-[#949899] hover:text-[#0051d5] dark:hover:text-[#b4c5ff] active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">account_circle</span>
          <span className="text-[10px] uppercase tracking-tighter">Profil</span>
        </button>
      </nav>

      {/* Mobile Footer */}
      <footer className="md:hidden fixed bottom-0 left-0 w-full z-40 bg-white dark:bg-[#2c3135] border-t border-[#c2c7cc] dark:border-[#73787c]/50 flex flex-col justify-center items-center py-3 px-4 gap-1">
        <span className="text-[10px] font-bold text-[#0051d5] dark:text-[#b4c5ff] uppercase tracking-tight text-center">
          HSE PORTALI GÜVENLİĞİ YÖNETİM SİSTEMİ
        </span>
        <span className="text-[10px] text-[#42474b] dark:text-[#949899] text-center">
          © 2026 MLP-CARE. Tüm hakları saklıdır.
        </span>
      </footer>

    </div>
  );
}

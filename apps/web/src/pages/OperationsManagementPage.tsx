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

export default function OperationsManagementPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const hasAdminAccess = user?.isAdmin || user?.isManagement || user?.roles?.includes('admin') || user?.roles?.includes('management');

  const getInitials = (name: string) => {
    if (!name) return 'MS';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
  const userInitials = getInitials(user?.fullName || user?.username || 'Metin Salık');

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#f8f9ff] dark:bg-[#171c20] bg-[radial-gradient(#d3e4fe_1px,transparent_1px)] dark:bg-[radial-gradient(#2c3135_1px,transparent_1px)] bg-[size:32px_32px] text-[#171c20] dark:text-[#edf1f6] transition-colors duration-300">
      
      {/* Desktop Header */}
      <header className="hidden md:block bg-white dark:bg-[#171c20] border-b border-[#c2c7cc] dark:border-[#73787c] shadow-sm sticky top-0 z-50">
        <div className="flex justify-between items-center h-16 px-6 w-full max-w-[1440px] mx-auto">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/portal')}>
            <span className="material-symbols-outlined text-[#0051d5] dark:text-[#b4c5ff] hover:scale-110 transition-transform">arrow_back</span>
            <div className="flex items-center justify-center h-10">
              <img src="/mlpcare.jpg" alt="MLP Care Logo" className="h-full object-contain rounded-md" />
            </div>
            <h1 className="text-2xl font-bold text-[#0051d5] dark:text-[#b4c5ff]">HSE Portalı</h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[#42474b] dark:text-[#949899] text-sm">
              <span>Hoş geldin, <span className="font-bold text-[#171c20] dark:text-[#edf1f6]">{user?.fullName || user?.username || 'Metin Salık'}</span></span>
            </div>

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

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-50 bg-white dark:bg-[#171c20] border-b border-[#c2c7cc] dark:border-[#73787c] w-full">
        <div className="flex justify-between items-center w-full px-4 py-4 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#011d2b] dark:text-[#cbe6fa] cursor-pointer" onClick={() => navigate('/portal')}>arrow_back</span>
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

      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-6 py-8 md:py-10 flex flex-col pb-36 md:pb-10">
        
        <div className="mb-8 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-[#0051d5] dark:text-[#b4c5ff]">
            <span className="material-symbols-outlined text-[40px]">settings_suggest</span>
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#011d2b] dark:text-[#cbe6fa] mb-2">Operasyon Yönetim Sistemi</h2>
            <p className="text-[#42474b] dark:text-[#949899] text-base md:text-lg">İşlemlerinizi yapmak için alt modüllerden birini seçin.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1: İSG Atama Paneli */}
          {(hasAdminAccess || user?.modules?.includes('PANEL')) && (
            <div
              onClick={() => navigate('/panel')}
              className="group bg-white dark:bg-[#2c3135] border border-slate-200/80 dark:border-[#73787c]/30 rounded-xl p-6 md:p-8 form-shadow hover:translate-y-[-4px] transition-all duration-300 flex flex-col justify-between cursor-pointer active:scale-98"
            >
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

          {/* Card 2: İnşaat Renovasyon Teslim Raporu */}
          {(hasAdminAccess || user?.modules?.includes('RENOVATION_REPORT')) && (
            <div
              onClick={() => navigate('/renovation-report')}
              className="group bg-white dark:bg-[#2c3135] border border-slate-200/80 dark:border-[#73787c]/30 rounded-xl p-6 md:p-8 form-shadow hover:translate-y-[-4px] transition-all duration-300 flex flex-col justify-between cursor-pointer active:scale-98"
            >
              <div className="flex md:hidden items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#e8f5e9] dark:bg-[#1b5e20]/20 flex items-center justify-center text-[#2e7d32] dark:text-emerald-400">
                  <span className="material-symbols-outlined text-[28px]">assignment_turned_in</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-[#171c20] dark:text-[#edf1f6] mb-1">İnşaat Renovasyon Teslim Raporu</h2>
                  <p className="text-sm text-[#42474b] dark:text-[#949899] mb-4">
                    İnşaat ve renovasyon alanlarının operasyonel teslim raporları ve takibi.
                  </p>
                  <div className="flex items-center gap-2 text-[#2e7d32] dark:text-emerald-400 text-sm font-medium group-hover:underline">
                    Uygulamaya Git
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </div>
                </div>
              </div>

              <div className="hidden md:flex flex-col justify-between h-full">
                <div>
                  <div className="w-14 h-14 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center mb-6 text-[#2e7d32] dark:text-emerald-400 transition-transform group-hover:scale-110">
                    <span className="material-symbols-outlined text-[32px]">assignment_turned_in</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#011d2b] dark:text-[#cbe6fa] mb-2">İnşaat Renovasyon Teslim Raporu</h3>
                  <p className="text-[#42474b] dark:text-[#949899] text-base mb-8 leading-relaxed">
                    İnşaat ve renovasyon alanlarının operasyonel teslim raporları ve takibi.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 text-[#2e7d32] dark:text-emerald-400 text-sm font-medium group-hover:gap-4 transition-all">
                  Uygulamaya Git
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Desktop Footer */}
      <footer className="hidden md:block bg-white dark:bg-[#171c20] border-t border-[#c2c7cc] dark:border-[#73787c] py-6 px-6 w-full max-w-[1440px] mx-auto mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <span className="text-sm font-semibold text-[#171c20] dark:text-[#edf1f6]">MLP-CARE</span>
            <span className="text-xs text-[#42474b] dark:text-[#949899]">© 2026 MLP-CARE Healthcare Portal. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LayoutDashboard, FileText, LogOut, Settings } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function PortalPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Admin veya Yönetici rolü kontrolü
  // Admin veya Yönetici rolü kontrolü
  const hasAdminAccess = user?.isAdmin || user?.isManagement || user?.roles?.includes('admin') || user?.roles?.includes('management');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Üst Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-primary-foreground font-bold tracking-wider text-sm">
              SEÇ
            </div>
            <span className="font-semibold text-foreground">MLPCARE SEÇ Portalı</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden md:inline-block">
              Hoş geldin, <span className="font-medium text-foreground">{user?.fullName || user?.username}</span>
            </span>

            {hasAdminAccess && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/panel/settings/parameters')} className="text-muted-foreground hover:text-foreground">
                <Settings className="w-4 h-4 mr-2" />
                Sistem Ayarları
              </Button>
            )}

            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Hesabım
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{user?.fullName || user?.username}</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600 cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  Çıkış Yap
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Ana İçerik */}
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Uygulamalar</h1>
            <p className="text-muted-foreground mt-2">Lütfen işlem yapmak istediğiniz modülü seçin.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Yalnızca yetkililer görebilir */}
            {hasAdminAccess && (
              <Card 
                className="group cursor-pointer hover:shadow-md transition-all duration-200 border-blue-100 dark:border-blue-900/30 hover:border-blue-300 dark:hover:border-blue-700/50 overflow-hidden relative"
                onClick={() => navigate('/panel')}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 dark:from-blue-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100/50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                    <LayoutDashboard className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl">İSG Atama Paneli</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mt-1">
                    Profesyonel yönetimi, OSGB takibi, kurumsal atamalar ve yasal süre hesaplamaları.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400">
                    Uygulamaya Git <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tüm kullanıcılar görebilir */}
            <Card 
              className="group cursor-pointer hover:shadow-md transition-all duration-200 border-emerald-100 dark:border-emerald-900/30 hover:border-emerald-300 dark:hover:border-emerald-700/50 overflow-hidden relative"
              onClick={() => navigate('/operations')}
            >
               <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 dark:from-emerald-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader>
                <div className="w-12 h-12 bg-emerald-100/50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl">Aylık Veri Sistemi</CardTitle>
                <CardDescription className="text-sm text-muted-foreground mt-1">
                  Aylık çalışma saatleri, çalışan sayıları, kaza kayıtları ve denetim bulgusu girişleri.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  Uygulamaya Git <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

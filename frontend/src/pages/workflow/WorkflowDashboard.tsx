import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ListTodo, Users, Settings2, BarChart2, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function WorkflowDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">İş Takip (Workflow)</h1>
          <p className="text-muted-foreground mt-2">
            Ekibinizin iş yükünü yönetin, atamaları yapın ve durumları izleyin.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Yeni İş Oluştur
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Kanban Board Card */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500" onClick={() => {}}>
          <CardHeader className="pb-2">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2">
              <ListTodo className="w-5 h-5" />
            </div>
            <CardTitle className="text-xl">İş Panosu</CardTitle>
            <CardDescription>Kanban tahtası ile işleri yönetin</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Aktif 12 İş</p>
          </CardContent>
        </Card>

        {/* Havuz Card */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-emerald-500" onClick={() => {}}>
          <CardHeader className="pb-2">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2">
              <Users className="w-5 h-5" />
            </div>
            <CardTitle className="text-xl">İş Havuzu</CardTitle>
            <CardDescription>Sahipsiz işleri görüntüleyin</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">3 Bekleyen İş</p>
          </CardContent>
        </Card>

        {/* Ekip Özeti Card */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-amber-500" onClick={() => {}}>
          <CardHeader className="pb-2">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-400 mb-2">
              <BarChart2 className="w-5 h-5" />
            </div>
            <CardTitle className="text-xl">Ekip Özeti</CardTitle>
            <CardDescription>Performans ve yük dağılımı</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Aylık rapor hazır</p>
          </CardContent>
        </Card>

        {/* Ayarlar Card */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-slate-500" onClick={() => {}}>
          <CardHeader className="pb-2">
            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-900/30 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400 mb-2">
              <Settings2 className="w-5 h-5" />
            </div>
            <CardTitle className="text-xl">Modül Ayarları</CardTitle>
            <CardDescription>Hiyerarşi ve Rol yönetimi</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Yönetici erişimi</p>
          </CardContent>
        </Card>
      </div>

      {/* Gelecek Geliştirme İçin Bildirim */}
      <Card className="border-dashed border-2 bg-card/50">
        <CardContent className="py-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
            <Bell className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Modül Geliştirme Aşamasında</h3>
          <p className="text-muted-foreground max-w-md">
            Veritabanı altyapısı ve mimari kuruldu. Kanban board, liste görünümleri ve bildirim kanalları (WhatsApp, Telegram) entegrasyonu devam ediyor.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

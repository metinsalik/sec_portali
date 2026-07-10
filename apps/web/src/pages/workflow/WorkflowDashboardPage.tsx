import React, { useState } from 'react';
import { useWorkflowDashboardStats } from '@/hooks/useWorkflow';
import { useAuth } from '@/context/AuthContext';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, CheckCircle2, Clock, AlertTriangle, XCircle, Users, MessageCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function WorkflowDashboardPage() {
  const { data: stats, isLoading, error } = useWorkflowDashboardStats();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectTelegram = async () => {
    try {
      setIsConnecting(true);
      const res = await api.get('/settings/telegram/connect');
      const data = await res.json();
      
      if (data.alreadyConnected) {
        toast.info('Telegram hesabınız zaten bağlı.');
        setTimeout(() => window.location.reload(), 1500);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Bağlantı kodu üretilemedi');
      }
      
      window.open(data.link, '_blank');
      toast.success('Telegram açılıyor... Lütfen bot ekranında BAŞLAT (START) düğmesine basın.');
    } catch (error: any) {
      toast.error(error.message || 'Telegram bağlantısı sırasında bir hata oluştu');
    } finally {
      setIsConnecting(false);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center text-slate-500">Dashboard yükleniyor...</div>;
  }

  if (error || !stats) {
    return <div className="p-6 text-center text-red-500">Dashboard yüklenemedi.</div>;
  }

  const {
    totalTasks,
    completedCount,
    openCount,
    overdueCount,
    blockedCount,
    avgCompletionHours,
    onTimePercentage,
    statusDistribution,
    workload,
    isAdmin,
    urgentTasks
  } = stats;

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-blue-100 text-blue-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <LayoutDashboard className="w-8 h-8 text-primary" />
            {isAdmin ? 'Yönetici Dashboard' : 'Kişisel Dashboard'}
          </h1>
          <p className="text-slate-500 mt-1">İş akışı özetiniz ve performans analizleriniz.</p>
        </div>
        {user && (
          <Button 
            onClick={handleConnectTelegram} 
            disabled={isConnecting}
            variant={user.hasTelegram ? "outline" : "default"}
            className={user.hasTelegram ? "border-blue-600 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900" : "bg-blue-600 hover:bg-blue-700 text-white"}
          >
            {isConnecting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageCircle className="w-4 h-4 mr-2" />}
            {user.hasTelegram ? 'Telegram Bağlantısı Aktif' : 'Telegram\'a Bağla'}
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Toplam Açık İş</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{openCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Gecikmiş İşler</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{overdueCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Ort. Tamamlama Süresi</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                {avgCompletionHours > 24 
                  ? `${(avgCompletionHours / 24).toFixed(1)} Gün` 
                  : `${avgCompletionHours.toFixed(1)} Saat`}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Zamanında Bitirme</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                %{onTimePercentage.toFixed(1)}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Status Chart */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Durum Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {statusDistribution.map((s: any) => (
                <div key={s.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-slate-600">{s.name}: {s.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Workload (Admin only) or Placeholder */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{isAdmin ? 'Personel İş Yükü ve Performansı' : 'Acil ve Geciken İşleriniz'}</CardTitle>
          </CardHeader>
          <CardContent>
            {isAdmin ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workload}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip cursor={{ fill: 'transparent' }} />
                    <Legend />
                    <Bar dataKey="total" name="Toplam İş" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completed" name="Tamamlanan" fill="#34d399" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="overdue" name="Geciken" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="space-y-4">
                {urgentTasks.length === 0 ? (
                  <div className="text-center text-slate-500 py-8">Acil veya geciken işiniz bulunmuyor. Harika!</div>
                ) : (
                  urgentTasks.map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900 dark:text-slate-100">{t.title}</span>
                        <span className="text-sm text-slate-500">Termin: {new Date(t.dueDate).toLocaleDateString('tr-TR')}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getPriorityColor(t.priority)}>{t.priority}</Badge>
                        <Button size="sm" variant="outline" onClick={() => navigate(`/workflow/tasks/${t.id}`)}>İncele</Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
      
      {/* Admin specific tables */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Sistemdeki Kritik / Gecikmiş Görevler (Darboğazlar)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {urgentTasks.length === 0 ? (
                <div className="text-center text-slate-500 py-4">Sistemde geciken iş yok.</div>
              ) : (
                urgentTasks.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div>
                      <div className="font-medium">{t.title}</div>
                      <div className="text-sm text-slate-500">Sorumlu: {t.assignee?.fullName || t.assigneeId} | Termin: {new Date(t.dueDate).toLocaleDateString('tr-TR')}</div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/workflow/tasks/${t.id}`)}>İncele</Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}

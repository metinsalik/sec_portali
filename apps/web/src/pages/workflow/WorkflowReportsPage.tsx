import React from 'react';
import { useWorkflowDashboardStats } from '@/hooks/useWorkflow';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function WorkflowReportsPage() {
  const { data: stats, isLoading, error } = useWorkflowDashboardStats();
  const { user } = useAuth();

  if (isLoading) {
    return <div className="p-6 text-center text-slate-500">Raporlar yükleniyor...</div>;
  }

  if (error || !stats) {
    return <div className="p-6 text-center text-red-500">Raporlar yüklenemedi.</div>;
  }

  const { workload, isAdmin } = stats;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <BarChart3 className="w-8 h-8 text-primary" />
          Performans ve Raporlar
        </h1>
        <p className="text-slate-500 dark:text-slate-400">Çalışan bazlı performans ölçümleri, geciken ve tamamlanan iş analizleri.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-500" />
              Çalışan Performans Değerlendirme Tablosu
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isAdmin ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-6 py-3 rounded-tl-lg">Personel</th>
                      <th className="px-6 py-3">Toplam İş Yükü</th>
                      <th className="px-6 py-3 text-emerald-600">Tamamlanan</th>
                      <th className="px-6 py-3 text-red-600">Geciken</th>
                      <th className="px-6 py-3 text-blue-600">Bekleyen (Devam)</th>
                      <th className="px-6 py-3 rounded-tr-lg">Performans Yüzdesi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workload.map((w: any, index: number) => {
                      const pending = w.total - w.completed;
                      const performanceScore = w.total > 0 ? ((w.completed / w.total) * 100).toFixed(1) : 0;
                      
                      return (
                        <tr key={index} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{w.name}</td>
                          <td className="px-6 py-4"><Badge variant="outline">{w.total}</Badge></td>
                          <td className="px-6 py-4"><Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">{w.completed}</Badge></td>
                          <td className="px-6 py-4"><Badge className="bg-red-100 text-red-800 hover:bg-red-100">{w.overdue}</Badge></td>
                          <td className="px-6 py-4"><Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">{pending}</Badge></td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700 flex-1">
                                <div className={`h-2.5 rounded-full ${w.completed > w.overdue ? 'bg-emerald-500' : 'bg-orange-500'}`} style={{ width: `${performanceScore}%` }}></div>
                              </div>
                              <span className="font-semibold text-xs">%{performanceScore}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center p-8 text-slate-500 flex flex-col items-center justify-center gap-3">
                <AlertTriangle className="w-10 h-10 text-orange-400" />
                <p>Bu alanda tüm çalışanların karşılaştırmalı performans verileri yer alır. Görüntüleme yetkiniz bulunmamaktadır.</p>
                <p className="text-sm">Kişisel performans bilgilerinizi Dashboard (Ana Sayfa) üzerinden takip edebilirsiniz.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

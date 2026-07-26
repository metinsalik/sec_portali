import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList, Clock, CheckCircle, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function ChecklistDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>({
    total: 0,
    completed: 0,
    draft: 0,
    avgScore: 0,
    recentSubmissions: []
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/checklists/submissions');
      const data = await response.json();
      
      const total = data.length;
      const completed = data.filter((s: any) => s.status === 'TAMAMLANDI');
      const draft = data.filter((s: any) => s.status === 'TASLAK');
      
      const totalScore = completed.reduce((sum: number, s: any) => sum + (s.percentScore || 0), 0);
      const avgScore = completed.length > 0 ? (totalScore / completed.length) : 0;

      setStats({
        total,
        completed: completed.length,
        draft: draft.length,
        avgScore,
        recentSubmissions: data.slice(0, 5)
      });
    } catch (error) {
      console.error('Error fetching dashboard stats', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">İSG Kontrol Listeleri Dashboard</h1>
        <p className="text-muted-foreground">
          {user?.activeFacility 
            ? `${user.activeFacility.name} tesisinize ait denetim özeti.` 
            : 'Tüm tesislere ait genel denetim özeti.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Denetim</CardTitle>
            <ClipboardList className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Sistemdeki tüm kayıtlar</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bekleyen (Taslak)</CardTitle>
            <Clock className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.draft}</div>
            <p className="text-xs text-muted-foreground mt-1">Tamamlanması gerekenler</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tamamlanan</CardTitle>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground mt-1">Biten denetimler</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ortalama Başarı</CardTitle>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">%{stats.avgScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">Tamamlananların ortalaması</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1 border-amber-200 bg-amber-50/30 dark:bg-amber-950/20 dark:border-amber-900/50">
          <CardHeader>
            <CardTitle className="text-amber-700 dark:text-amber-500 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> 
              Bekleyen İşlemler
            </CardTitle>
            <CardDescription>Tesisinize atanmış ve tamamlanmayı bekleyen denetimler.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentSubmissions.filter((s: any) => s.status === 'TASLAK').map((sub: any) => (
                <div key={sub.id} className="flex flex-col gap-2 p-3 bg-white dark:bg-[#2c3135] border border-amber-200 dark:border-amber-900/50 rounded-lg shadow-sm">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-amber-900 dark:text-amber-400">{sub.template.title}</h4>
                    <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 px-2 py-1 rounded-full">
                      Taslak
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{sub.facility?.name}</p>
                  
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>İlerleme</span>
                      <span>%{sub.percentScore?.toFixed(1) || 0}</span>
                    </div>
                    <Progress value={sub.percentScore || 0} className="h-1.5 [&>div]:bg-amber-500" />
                  </div>

                  <Button className="w-full mt-2 bg-amber-500 hover:bg-amber-600 text-white" size="sm" onClick={() => navigate(`/checklists/submissions/${sub.id}`)}>
                    Devam Et
                  </Button>
                </div>
              ))}
              
              {stats.draft === 0 && (
                <div className="text-center py-6 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Tüm denetimleriniz tamamlandı!
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Son Denetimler</CardTitle>
            <CardDescription>Sisteme eklenen en son kontrol listeleri</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentSubmissions.map((sub: any) => (
                <div key={sub.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div>
                    <h4 className="font-semibold">{sub.template.title}</h4>
                    <p className="text-sm text-muted-foreground">{sub.facility?.name}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`text-sm font-bold ${sub.status === 'TAMAMLANDI' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {sub.status}
                      </div>
                      <div className="text-xs text-muted-foreground">%{sub.percentScore?.toFixed(1) || 0}</div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/checklists/submissions/${sub.id}`)}>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {stats.recentSubmissions.length === 0 && (
                <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                  Kayıt bulunamadı.
                </div>
              )}
            </div>
            <div className="mt-4 text-center">
              <Button variant="outline" className="w-full" onClick={() => navigate('/checklists/submissions')}>
                Tüm Denetimleri Gör
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

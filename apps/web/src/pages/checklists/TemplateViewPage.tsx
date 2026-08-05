import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Progress } from '@/components/ui/progress';

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

const getGradeAndColor = (percentScore: number | undefined | null) => {
  if (percentScore === undefined || percentScore === null) return { grade: '-', color: 'text-gray-500 bg-gray-50' };
  if (percentScore >= 90) return { grade: 'A', color: 'text-emerald-700 bg-emerald-100 border border-emerald-200' };
  if (percentScore >= 80) return { grade: 'B', color: 'text-blue-700 bg-blue-100 border border-blue-200' };
  if (percentScore >= 70) return { grade: 'C', color: 'text-yellow-700 bg-yellow-100 border border-yellow-200' };
  if (percentScore >= 60) return { grade: 'D', color: 'text-orange-700 bg-orange-100 border border-orange-200' };
  if (percentScore >= 50) return { grade: 'E', color: 'text-red-700 bg-red-100 border border-red-200' };
  return { grade: 'F', color: 'text-red-900 bg-red-200 border border-red-300 font-bold' };
};

export default function TemplateViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    fetchTemplateAndSubmissions();
  }, [id]);

  const fetchTemplateAndSubmissions = async () => {
    try {
      // 1. Fetch template details
      const templateRes = await api.get(`/checklists/templates/${id}`);
      const templateData = await templateRes.json();
      setTemplate(templateData);

      // 2. Fetch all submissions and filter by templateId
      const subRes = await api.get('/checklists/submissions');
      const subData = await subRes.json();
      const filtered = subData.filter((s: any) => s.templateId === id);
      setSubmissions(filtered);
    } catch (error) {
      console.error('Error fetching template details', error);
    }
  };

  const stats = useMemo(() => {
    const total = submissions.length;
    const completed = submissions.filter((s: any) => s.status === 'TAMAMLANDI');
    const draft = submissions.filter((s: any) => s.status === 'TASLAK' || s.status === 'BEKLEYEN');
    
    const totalScore = completed.reduce((sum: number, s: any) => sum + (s.percentScore || 0), 0);
    const avgScore = completed.length > 0 ? (totalScore / completed.length) : 0;

    const trendData = [...completed].sort((a, b) => new Date(a.auditDate).getTime() - new Date(b.auditDate).getTime()).map(s => ({
      date: format(new Date(s.auditDate), 'dd MMM', { locale: tr }),
      score: s.percentScore || 0
    }));

    const pieData = [
      { name: 'Tamamlandı', value: completed.length },
      { name: 'Devam Ediyor / Taslak', value: draft.length },
    ];

    return { total, completed: completed.length, draft: draft.length, avgScore, trendData, pieData };
  }, [submissions]);

  if (!template) return <div className="p-6 flex justify-center items-center h-full"><div className="animate-pulse text-lg">Yükleniyor...</div></div>;

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <div className="flex items-center gap-4 border-b pb-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="shrink-0">
          <ArrowLeft className="w-5 h-5 mr-1" /> Geri
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">{template.title} Dashboard</h1>
          <p className="text-muted-foreground">{template.description || 'Bu şablona ait denetim analizleri ve sonuçları.'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-50 dark:bg-slate-900/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Toplam Denetim</p>
                <h3 className="text-3xl font-bold mt-1">{stats.total}</h3>
              </div>
              <div className="p-3 bg-slate-200 dark:bg-slate-800 rounded-full">
                <CheckCircle className="w-6 h-6 text-slate-700 dark:text-slate-300" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 dark:bg-emerald-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Tamamlanan</p>
                <h3 className="text-3xl font-bold text-emerald-700 dark:text-emerald-500 mt-1">{stats.completed}</h3>
              </div>
              <div className="p-3 bg-emerald-200 dark:bg-emerald-900 rounded-full">
                <CheckCircle className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Devam Eden</p>
                <h3 className="text-3xl font-bold text-amber-700 dark:text-amber-500 mt-1">{stats.draft}</h3>
              </div>
              <div className="p-3 bg-amber-200 dark:bg-amber-900 rounded-full">
                <Clock className="w-6 h-6 text-amber-700 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Ortalama Başarı</p>
                <h3 className="text-3xl font-bold text-blue-700 dark:text-blue-500 mt-1">%{stats.avgScore.toFixed(1)}</h3>
              </div>
              <div className="p-3 bg-blue-200 dark:bg-blue-900 rounded-full">
                <TrendingUp className="w-6 h-6 text-blue-700 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle>Zaman İçindeki Başarı Trendi</CardTitle>
            <CardDescription>Bu şablondaki denetimlerin tarihsel skor gelişimi</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {stats.trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis domain={[0, 100]} stroke="#64748b" />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Skor (%)" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col h-full items-center justify-center text-muted-foreground bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <TrendingUp className="w-10 h-10 mb-2 opacity-20" />
                <p>Grafik çizmek için yeterli tamamlanmış denetim yok.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle>Durum Dağılımı</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {stats.total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                Henüz denetim yok.
              </div>
            )}
            {stats.total > 0 && (
              <div className="flex justify-center gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div> Tamamlandı
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div> Devam Ediyor
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle>Geçmiş ve Devam Eden Denetimler</CardTitle>
          <CardDescription>Bu liste kullanılarak yapılan tüm denetim görevleri</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {submissions.map((sub) => (
              <div key={sub.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-100 dark:border-slate-800 rounded-xl hover:shadow-md transition-all bg-white dark:bg-slate-950 gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-lg">{sub.facility?.name || 'Kendi Tesisi'}</h4>
                    {sub.isPeriodic && (
                      <span className="text-[10px] uppercase tracking-wider font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Periyodik</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {format(new Date(sub.auditDate), 'dd MMM yyyy HH:mm', { locale: tr })}</span>
                    <span className="flex items-center gap-1">• Denetçi: <span className="font-medium text-foreground">{sub.conductedBy?.fullName || 'Atanmadı'}</span></span>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 sm:min-w-[200px] justify-between sm:justify-end">
                  <div className="flex flex-col items-end">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide ${sub.status === 'TAMAMLANDI' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700 animate-pulse'}`}>
                      {sub.status}
                    </span>
                    {sub.status === 'TAMAMLANDI' && (
                      <div className="flex flex-col items-end mt-1.5">
                        <div className="font-bold text-lg leading-none">%{sub.percentScore?.toFixed(1)}</div>
                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold mt-1 ${getGradeAndColor(sub.percentScore).color}`}>
                          Not: {getGradeAndColor(sub.percentScore).grade}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {sub.status === 'TAMAMLANDI' ? (
                      <>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/checklists/submissions/${sub.id}?mode=view`)} className="rounded-full px-4">
                          Görüntüle
                        </Button>
                        <Button variant="default" size="sm" onClick={() => navigate(`/checklists/submissions/${sub.id}?mode=edit`)} className="rounded-full px-4 bg-blue-600 hover:bg-blue-700">
                          Düzenle
                        </Button>
                      </>
                    ) : (
                      <Button variant="default" size="sm" onClick={() => navigate(`/checklists/submissions/${sub.id}`)} className="rounded-full px-6">
                        Devam Et
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {submissions.length === 0 && (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-lg font-medium">Kayıt Bulunamadı</p>
                <p className="text-sm mt-1">Bu şablon henüz hiçbir tesiste kullanılmamış.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

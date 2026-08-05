import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowRight, FileCheck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ReportsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      api.get(`/checklists/submissions`).then(async (res) => {
        const data = await res.json();
        setReports(data);
      });
    }
  }, [user]);

  const chartData = reports.filter(r => r.status === 'TAMAMLANDI').map(r => ({
    name: new Date(r.auditDate).toLocaleDateString(),
    score: r.percentScore || 0,
    title: r.template?.title
  }));

  const getGradeAndColor = (percentScore: number | undefined | null) => {
    if (percentScore === undefined || percentScore === null) return { grade: '-', color: 'text-gray-500 bg-gray-50' };
    if (percentScore >= 90) return { grade: 'A', color: 'text-emerald-700 bg-emerald-100 border border-emerald-200' };
    if (percentScore >= 80) return { grade: 'B', color: 'text-blue-700 bg-blue-100 border border-blue-200' };
    if (percentScore >= 70) return { grade: 'C', color: 'text-yellow-700 bg-yellow-100 border border-yellow-200' };
    if (percentScore >= 60) return { grade: 'D', color: 'text-orange-700 bg-orange-100 border border-orange-200' };
    if (percentScore >= 50) return { grade: 'E', color: 'text-red-700 bg-red-100 border border-red-200' };
    return { grade: 'F', color: 'text-red-900 bg-red-200 border border-red-300 font-bold' };
  };

  const templateGroups = useMemo(() => {
    const groups: Record<string, any> = {};
    
    reports.forEach(sub => {
      const tId = sub.templateId || sub.template?.id || 'unknown_template_id';
      
      if (!groups[tId]) {
        groups[tId] = {
          templateId: tId,
          templateTitle: sub.template?.title || 'Diğer / İsimsiz Şablonlar',
          submissions: [],
        };
      }
      groups[tId].submissions.push(sub);
    });

    return Object.values(groups).map(group => {
      const total = group.submissions.length;
      const completedList = group.submissions.filter((s: any) => s.status === 'TAMAMLANDI');
      const completed = completedList.length;
      const ongoing = total - completed;
      
      const avgScore = completed > 0 
        ? completedList.reduce((acc: number, curr: any) => acc + (curr.percentScore || 0), 0) / completed 
        : 0;

      return {
        ...group,
        total,
        completed,
        ongoing,
        avgScore,
      };
    });
  }, [reports]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kontrol Listesi Analizleri</h1>
        <p className="text-muted-foreground">Şablon bazlı detaylı denetim raporları ve trendler.</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Zaman İçinde Trend (Skor Yüzdesi - Tamamlananlar)</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Yeterli veri yok.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templateGroups.map((group) => (
          <Card key={group.templateId} className="hover:shadow-md transition-shadow flex flex-col">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-lg font-semibold leading-tight mb-1">
                {group.templateTitle}
              </CardTitle>
              <CardDescription>
                Toplam {group.total} Denetim
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pt-4">
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4 text-muted-foreground">
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1"><FileCheck className="w-4 h-4 text-emerald-500"/> Tamamlanan</span>
                    <span className="text-xl font-bold text-foreground">{group.completed}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1"><RefreshCw className="w-4 h-4 text-amber-500"/> Devam Eden</span>
                    <span className="text-xl font-bold text-foreground">{group.ongoing}</span>
                  </div>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg flex justify-between items-center mt-2 border">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Genel Başarı</span>
                    <span className="font-bold">%{group.avgScore.toFixed(1)}</span>
                  </div>
                  <div>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getGradeAndColor(group.avgScore).color}`}>
                      Not: {getGradeAndColor(group.avgScore).grade}
                    </span>
                  </div>
                </div>
              </div>
              
              {group.templateId !== 'unknown_template_id' ? (
                <div className="mt-6">
                  <Button className="w-full" variant="default" onClick={() => navigate(`/checklists/templates/${group.templateId}`)}>
                    Dashboard'a Git <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              ) : (
                <div className="mt-6 text-xs text-center text-red-500 bg-red-50 p-2 rounded border border-red-200">
                  Şablonu silindiği için detay raporu oluşturulamıyor.
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {templateGroups.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            Henüz raporlanacak bir denetim bulunmuyor.
          </div>
        )}
      </div>
    </div>
  );
}

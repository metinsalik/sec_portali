import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowRight, FileCheck, RefreshCw, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function ReportsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      Promise.all([
        api.get('/checklists/submissions'),
        api.get('/checklists/templates'),
        api.get('/checklists/groups')
      ]).then(async ([subRes, tplRes, grpRes]) => {
        setReports(await subRes.json());
        setTemplates(await tplRes.json());
        setGroups(await grpRes.json());
      }).catch(err => console.error("Error fetching report data", err));
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

  const reportGroups = useMemo(() => {
    const groupMap: Record<string, any> = {};
    
    // 1. Initialize all groups
    groups.forEach(g => {
      groupMap[g.id] = {
        groupId: g.id,
        groupName: g.name,
        submissions: [],
        templates: {}
      };
    });

    // 2. Initialize "Uncategorized"
    groupMap['no_group'] = {
      groupId: 'no_group',
      groupName: 'Kategorisiz Şablonlar',
      submissions: [],
      templates: {}
    };

    // 3. Populate with all templates (even those with 0 submissions)
    templates.forEach(t => {
      const gId = t.groupId || 'no_group';
      if (groupMap[gId]) {
        groupMap[gId].templates[t.id] = {
          templateId: t.id,
          templateTitle: t.title,
          submissions: []
        };
      }
    });
    
    // 4. Attach submissions
    reports.forEach(sub => {
      const gId = sub.template?.group?.id || sub.template?.groupId || 'no_group';
      
      if (!groupMap[gId]) {
         groupMap[gId] = {
           groupId: gId,
           groupName: sub.template?.group?.name || 'Kategorisiz Şablonlar',
           submissions: [],
           templates: {}
         };
      }
      
      groupMap[gId].submissions.push(sub);
      
      const tId = sub.template?.id || sub.templateId || 'unknown_template';
      if (!groupMap[gId].templates[tId]) {
         groupMap[gId].templates[tId] = {
            templateId: tId,
            templateTitle: sub.template?.title || 'Bilinmeyen Şablon',
            submissions: []
         };
      }
      groupMap[gId].templates[tId].submissions.push(sub);
    });

    return Object.values(groupMap)
      .filter(g => g.groupId !== 'no_group' || Object.keys(g.templates).length > 0) // Hide empty "Uncategorized"
      .map(group => {
      const total = group.submissions.length;
      const completedList = group.submissions.filter((s: any) => s.status === 'TAMAMLANDI');
      const completed = completedList.length;
      const ongoing = total - completed;
      
      const avgScore = completed > 0 
        ? completedList.reduce((acc: number, curr: any) => acc + (curr.percentScore || 0), 0) / completed 
        : 0;

      const templatesList = Object.values(group.templates).map((t: any) => {
         const tTotal = t.submissions.length;
         const tCompletedList = t.submissions.filter((s: any) => s.status === 'TAMAMLANDI');
         const tAvgScore = tCompletedList.length > 0 
            ? tCompletedList.reduce((acc: number, curr: any) => acc + (curr.percentScore || 0), 0) / tCompletedList.length 
            : 0;
         return {
            ...t,
            total: tTotal,
            completed: tCompletedList.length,
            ongoing: tTotal - tCompletedList.length,
            avgScore: tAvgScore
         };
      });

      return {
        ...group,
        total,
        completed,
        ongoing,
        avgScore,
        templatesList
      };
    });
  }, [reports, templates, groups]);

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

      <div className="space-y-6">
        {reportGroups.length > 0 ? (
          <Accordion type="multiple" className="w-full space-y-4">
            {reportGroups.map((group) => (
              <AccordionItem key={group.groupId} value={group.groupId} className="border rounded-lg bg-card text-card-foreground shadow-sm overflow-hidden">
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between w-full pr-4 text-left gap-4">
                    <div className="flex items-center gap-3">
                      <Folder className="w-5 h-5 text-primary" />
                      <div>
                        <h2 className="text-xl font-bold">{group.groupName}</h2>
                        <p className="text-sm text-muted-foreground font-normal">Toplam {group.total} Denetim</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 font-normal">
                      <div className="flex flex-col text-sm items-end">
                        <span className="text-muted-foreground text-xs">Genel Başarı</span>
                        <span className="font-bold">%{group.avgScore.toFixed(1)}</span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${getGradeAndColor(group.avgScore).color}`}>
                        Not: {getGradeAndColor(group.avgScore).grade}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="px-6 pb-6 pt-2 bg-muted/20 border-t">
                  {group.templatesList.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                      {group.templatesList.map((tpl: any) => (
                        <Card key={tpl.templateId} className="bg-background shadow-sm">
                          <CardHeader className="pb-3 border-b border-border/50 p-4">
                            <CardTitle className="text-base font-semibold leading-tight line-clamp-1">
                              {tpl.templateTitle}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              Toplam {tpl.total} Denetim
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="p-4 pt-3 space-y-3">
                            <div className="grid grid-cols-2 gap-2 text-muted-foreground text-sm">
                              <div className="flex flex-col gap-0.5">
                                <span className="flex items-center gap-1 text-xs"><FileCheck className="w-3 h-3 text-emerald-500"/> Tamamlanan</span>
                                <span className="text-base font-bold text-foreground">{tpl.completed}</span>
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <span className="flex items-center gap-1 text-xs"><RefreshCw className="w-3 h-3 text-amber-500"/> Devam Eden</span>
                                <span className="text-base font-bold text-foreground">{tpl.ongoing}</span>
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center bg-muted/50 p-2 rounded">
                              <span className="text-xs text-muted-foreground">Başarı: <strong className="text-foreground">%{tpl.avgScore.toFixed(1)}</strong></span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getGradeAndColor(tpl.avgScore).color}`}>
                                {getGradeAndColor(tpl.avgScore).grade}
                              </span>
                            </div>

                            <Button className="w-full mt-2" variant="outline" size="sm" onClick={() => navigate(`/checklists/templates/${tpl.templateId}`)}>
                              Dashboard'a Git <ArrowRight className="w-3 h-3 ml-2" />
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-sm text-muted-foreground">
                      Bu gruba henüz bir şablon eklenmemiş veya şablonlarda denetim yok.
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            Henüz raporlanacak bir denetim bulunmuyor.
          </div>
        )}
      </div>
    </div>
  );
}

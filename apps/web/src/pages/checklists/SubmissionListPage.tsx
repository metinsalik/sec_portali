import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SubmissionListPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchSubmissions();
    }
  }, [user]);

  const fetchSubmissions = async () => {
    try {
      const response = await api.get('/checklists/submissions');
      const data = await response.json();
      setSubmissions(data);
    } catch (error) {
      console.error('Error fetching submissions', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TASLAK': return 'text-amber-500 bg-amber-50';
      case 'BEKLEYEN': return 'text-blue-500 bg-blue-50';
      case 'TAMAMLANDI': return 'text-emerald-500 bg-emerald-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'TASLAK': return 'Başlanmamış';
      case 'BEKLEYEN': return 'Devam Eden';
      case 'TAMAMLANDI': return 'Tamamlanmış';
      default: return status;
    }
  };

  const renderGroupedByYear = (filteredSubmissions: any[]) => {
    const groupedByYear = filteredSubmissions.reduce((acc: any, sub: any) => {
      const year = new Date(sub.auditDate).getFullYear();
      if (!acc[year]) acc[year] = [];
      acc[year].push(sub);
      return acc;
    }, {});

    const sortedYears = Object.keys(groupedByYear).sort((a, b) => parseInt(b) - parseInt(a));

    if (sortedYears.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
          Bu kategoride henüz bir denetim bulunmuyor.
        </div>
      );
    }

    return (
      <div className="space-y-8 mt-6">
        {sortedYears.map(year => (
          <div key={year}>
            <h2 className="text-xl font-semibold mb-4 text-slate-700">{year} Yılı Denetimleri</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedByYear[year].map((sub: any) => (
                <Card key={sub.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-semibold leading-tight">
                      {sub.template?.title || 'İsimsiz Şablon'}
                    </CardTitle>
                    <div className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(sub.status)}`}>
                      {getStatusLabel(sub.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground mt-2">
                      <div className="flex justify-between">
                        <span>Tarih:</span>
                        <span className="font-medium text-foreground">
                          {format(new Date(sub.auditDate), 'dd MMM yyyy', { locale: tr })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Denetçi:</span>
                        <span className="font-medium text-foreground">{sub.conductedBy?.fullName || '-'}</span>
                      </div>
                      {sub.status === 'TAMAMLANDI' && (
                        <div className="flex justify-between">
                          <span>Skor:</span>
                          <span className="font-medium text-foreground">
                            {sub.totalScore} / {sub.maxScore} (%{sub.percentScore?.toFixed(1)})
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-6 flex justify-end">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/checklists/submissions/${sub.id}`)}>
                        {sub.status === 'TASLAK' || sub.status === 'BEKLEYEN' ? (
                          <><Edit className="w-4 h-4 mr-2" /> Devam Et</>
                        ) : (
                          <><Eye className="w-4 h-4 mr-2" /> Görüntüle</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Saha Denetimleri</h1>
          <p className="text-muted-foreground">Tesisinize ait doldurulmuş kontrol listeleri.</p>
        </div>
        {(user?.isAdmin || user?.isManagement || user?.roles?.includes('admin') || user?.roles?.includes('management') || user?.roles?.includes('specialist')) && (
          <Button onClick={() => navigate('/checklists/submissions/new')} className="gap-2 shadow-sm">
            <Plus className="w-4 h-4" />
            Yeni Denetim Başlat
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">Tümü</TabsTrigger>
          <TabsTrigger value="taslak">Başlanmamış</TabsTrigger>
          <TabsTrigger value="bekleyen">Devam Eden</TabsTrigger>
          <TabsTrigger value="tamamlandi">Tamamlanmış</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          {renderGroupedByYear(submissions)}
        </TabsContent>
        <TabsContent value="taslak" className="mt-0">
          {renderGroupedByYear(submissions.filter(s => s.status === 'TASLAK'))}
        </TabsContent>
        <TabsContent value="bekleyen" className="mt-0">
          {renderGroupedByYear(submissions.filter(s => s.status === 'BEKLEYEN'))}
        </TabsContent>
        <TabsContent value="tamamlandi" className="mt-0">
          {renderGroupedByYear(submissions.filter(s => s.status === 'TAMAMLANDI'))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

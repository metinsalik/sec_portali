import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Eye, Edit, Folder, ClipboardCheck, ArrowRight, LayoutList } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function SubmissionListPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Parse initial status from URL (e.g. ?status=bekleyen)
  const queryParams = new URLSearchParams(location.search);
  const initialStatus = queryParams.get('status')?.toLowerCase() || 'bekleyen';
  
  const [activeTab, setActiveTab] = useState(initialStatus);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  
  // Get active facility from sidebar context (localStorage)
  const [activeFacilityId, setActiveFacilityId] = useState<string | null>(localStorage.getItem('activeFacilityId'));
  const [viewAllFacilities, setViewAllFacilities] = useState(false);
  
  const isAdminOrManager = user?.isAdmin || user?.isManagement || user?.roles?.includes('admin') || user?.roles?.includes('management') || user?.roles?.includes('specialist');

  useEffect(() => {
    const handleStorageChange = () => {
      const newFacilityId = localStorage.getItem('activeFacilityId');
      if (newFacilityId !== activeFacilityId) {
        setActiveFacilityId(newFacilityId);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [activeFacilityId]);

  useEffect(() => {
    // If URL status changes from sidebar, update active tab
    const urlStatus = queryParams.get('status')?.toLowerCase();
    if (urlStatus && urlStatus !== activeTab) {
      setActiveTab(urlStatus);
    }
  }, [location.search]);

  useEffect(() => {
    if (user) {
      fetchSubmissions();
    }
  }, [user, selectedYear, activeFacilityId, viewAllFacilities]);

  const fetchSubmissions = async () => {
    try {
      let url = `/checklists/submissions?year=${selectedYear}`;
      if (!viewAllFacilities && activeFacilityId) {
        url += `&facilityId=${activeFacilityId}`;
      }
      const response = await api.get(url);
      const data = await response.json();
      setSubmissions(data);
    } catch (error) {
      console.error('Error fetching submissions', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'TASLAK': 
        return <Badge variant="outline" className="text-slate-500 bg-slate-50 border-slate-200">Başlanmamış (Taslak)</Badge>;
      case 'BEKLEYEN': 
        return <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200">Devam Ediyor</Badge>;
      case 'ONAY_BEKLIYOR': 
        return <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">Onay Bekliyor</Badge>;
      case 'TAMAMLANDI': 
        return <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200">Tamamlandı</Badge>;
      default: 
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderGroupedByTemplateGroup = (filteredSubmissions: any[]) => {
    // Group by Template Group -> Template
    const grouped = filteredSubmissions.reduce((acc: any, sub: any) => {
      const groupName = sub.template?.group?.name || 'Diğer Kontrol Listeleri';
      if (!acc[groupName]) acc[groupName] = [];
      acc[groupName].push(sub);
      return acc;
    }, {});

    const sortedGroups = Object.keys(grouped).sort();

    if (sortedGroups.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed rounded-xl bg-slate-50/50 text-slate-400">
          <LayoutList className="w-12 h-12 mb-4 opacity-30" />
          <p className="text-lg">Bu sekmede seçili tesise ait denetim bulunmuyor.</p>
        </div>
      );
    }

    return (
      <div className="space-y-10 mt-6">
        {sortedGroups.map((groupName, gIdx) => (
          <div key={gIdx} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b flex items-center gap-3">
              <Folder className="w-5 h-5 text-indigo-500" />
              <h2 className="text-xl font-bold text-slate-800">{groupName}</h2>
              <Badge variant="secondary" className="ml-2 font-normal text-slate-500">{grouped[groupName].length} Denetim</Badge>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {grouped[groupName].map((sub: any) => (
                  <Card key={sub.id} className="hover:shadow-md transition-all duration-200 border-slate-200 flex flex-col">
                    <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/50">
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <CardTitle className="text-[17px] font-bold leading-snug text-slate-800">
                          {sub.template?.title || 'İsimsiz Şablon'}
                        </CardTitle>
                      </div>
                      <div className="flex flex-wrap gap-2 items-center">
                        {getStatusBadge(sub.status)}
                        {sub.isPeriodic && (
                          <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-0">Periyodik</Badge>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-4 flex-1">
                      <div className="space-y-3 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <ClipboardCheck className="w-4 h-4 text-slate-400" />
                          <span className="font-medium">Tesis:</span> 
                          <span className="truncate">{sub.facility?.name || 'Bilinmeyen Tesis'}</span>
                        </div>
                        
                        <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Denetim Tarihi</span>
                            <span className="font-medium text-slate-700">
                              {format(new Date(sub.auditDate), 'dd MMMM yyyy', { locale: tr })}
                            </span>
                          </div>
                          
                          {sub.status === 'TAMAMLANDI' && (
                            <div className="flex flex-col items-end">
                              <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Başarı Oranı</span>
                              <span className={`font-bold ${sub.percentScore && sub.percentScore < 50 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                %{sub.percentScore?.toFixed(1) || 0}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-slate-500">Denetçi:</span>
                          <span className="font-medium text-slate-700 truncate max-w-[150px]">
                            {sub.conductedBy?.fullName || '-'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="pt-0 pb-4 px-4 mt-auto">
                      <Button 
                        className={`w-full gap-2 ${sub.status === 'TAMAMLANDI' ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                        variant={sub.status === 'TAMAMLANDI' ? 'default' : 'default'}
                        onClick={() => navigate(`/checklists/submissions/${sub.id}`)}
                      >
                        {sub.status === 'TASLAK' || sub.status === 'BEKLEYEN' ? (
                          <><Edit className="w-4 h-4" /> Denetime Devam Et <ArrowRight className="w-4 h-4 opacity-50 ml-auto" /></>
                        ) : sub.status === 'ONAY_BEKLIYOR' ? (
                          <><Eye className="w-4 h-4" /> Onay Bekleyen Raporu İncele</>
                        ) : (
                          <><Eye className="w-4 h-4" /> Sonuçları İncele</>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-[1400px] space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">Tesis Denetimlerim</h1>
          <p className="text-slate-500 text-lg">
            Seçili tesise atanmış devam eden ve tamamlanan kontrol listeleri.
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
          <select 
            value={selectedYear} 
            onChange={e => setSelectedYear(e.target.value)}
            className="p-2 border-0 bg-transparent text-sm font-semibold text-slate-700 focus:ring-0 outline-none cursor-pointer"
          >
            {[2023, 2024, 2025, 2026, 2027, 2028].map(y => (
              <option key={y} value={y}>{y} Yılı</option>
            ))}
          </select>

          <Separator orientation="vertical" className="h-8" />
          
          {isAdminOrManager && (
            <div className="flex items-center gap-2 px-2 border-r pr-4">
              <input 
                type="checkbox" 
                id="allFacilities" 
                checked={viewAllFacilities} 
                onChange={e => setViewAllFacilities(e.target.checked)} 
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer" 
              />
              <label htmlFor="allFacilities" className="text-sm font-bold text-indigo-900 cursor-pointer">
                Tüm Tesisleri Gör
              </label>
            </div>
          )}

          {isAdminOrManager && (
            <Button onClick={() => navigate('/checklists/submissions/new')} className="gap-2 bg-slate-900 hover:bg-slate-800 rounded-lg px-6">
              <Plus className="w-4 h-4" />
              Yeni Başlat
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 p-1 bg-slate-100 rounded-xl flex-wrap h-auto">
          <TabsTrigger value="bekleyen" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">Devam Edenler</TabsTrigger>
          <TabsTrigger value="onay_bekleyen" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">Onay Bekleyenler</TabsTrigger>
          <TabsTrigger value="tamamlandi" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">Tamamlananlar</TabsTrigger>
          <TabsTrigger value="taslak" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">Başlanmamış</TabsTrigger>
          <TabsTrigger value="all" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">Tümü</TabsTrigger>
        </TabsList>

        <TabsContent value="bekleyen" className="mt-0 outline-none">
          {renderGroupedByTemplateGroup(submissions.filter(s => s.status === 'BEKLEYEN'))}
        </TabsContent>
        <TabsContent value="onay_bekleyen" className="mt-0 outline-none">
          {renderGroupedByTemplateGroup(submissions.filter(s => s.status === 'ONAY_BEKLIYOR'))}
        </TabsContent>
        <TabsContent value="tamamlandi" className="mt-0 outline-none">
          {renderGroupedByTemplateGroup(submissions.filter(s => s.status === 'TAMAMLANDI'))}
        </TabsContent>
        <TabsContent value="taslak" className="mt-0 outline-none">
          {renderGroupedByTemplateGroup(submissions.filter(s => s.status === 'TASLAK'))}
        </TabsContent>
        <TabsContent value="all" className="mt-0 outline-none">
          {renderGroupedByTemplateGroup(submissions)}
        </TabsContent>
      </Tabs>
    </div>
  );
}

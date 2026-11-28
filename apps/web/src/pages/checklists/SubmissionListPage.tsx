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
import { Checkbox } from '@/components/ui/checkbox';

export default function SubmissionListPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const initialStatus = queryParams.get('status')?.toLowerCase() || 'bekleyen';

  const [activeTab, setActiveTab] = useState(initialStatus);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [activeFacilityId, setActiveFacilityId] = useState<string | null>(
    localStorage.getItem('activeFacilityId')
  );
  const [viewAllFacilities, setViewAllFacilities] = useState(false);

  const isAdminOrManager =
    user?.isAdmin ||
    user?.isManagement ||
    user?.roles?.includes('admin') ||
    user?.roles?.includes('management') ||
    user?.roles?.includes('specialist');

  useEffect(() => {
    const handleFacilityChange = () => {
      const newFacilityId = localStorage.getItem('activeFacilityId');
      if (newFacilityId !== activeFacilityId) {
        setActiveFacilityId(newFacilityId);
      }
    };
    window.addEventListener('storage', handleFacilityChange);
    window.addEventListener('facilityChanged', handleFacilityChange);
    return () => {
      window.removeEventListener('storage', handleFacilityChange);
      window.removeEventListener('facilityChanged', handleFacilityChange);
    };
  }, [activeFacilityId]);

  useEffect(() => {
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
      if (!viewAllFacilities && activeFacilityId && activeFacilityId !== 'all') {
        url += `&facilityId=${activeFacilityId}`;
      }
      const response = await api.get(url);
      const data = await response.json();
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching submissions', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'BEKLEYEN':
        return (
          <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
            Bekliyor
          </Badge>
        );
      case 'TASLAK':
        return (
          <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground border-border">
            Taslak
          </Badge>
        );
      case 'ONAY_BEKLIYOR':
        return (
          <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30">
            Onay Bekliyor
          </Badge>
        );
      case 'TAMAMLANDI':
        return (
          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
            Tamamlandı
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px]">
            {status}
          </Badge>
        );
    }
  };

  const renderGroupedByTemplateGroup = (filteredSubmissions: any[]) => {
    const grouped = filteredSubmissions.reduce((acc: any, sub: any) => {
      const groupName = sub.template?.group?.name || 'Diğer Kontrol Listeleri';
      if (!acc[groupName]) acc[groupName] = [];
      acc[groupName].push(sub);
      return acc;
    }, {});

    const sortedGroups = Object.keys(grouped).sort();

    if (sortedGroups.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-14 border border-dashed border-border rounded-lg bg-muted/15 text-muted-foreground">
          <LayoutList className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-xs font-medium">Bu sekmede seçili tesise ait denetim bulunmuyor.</p>
        </div>
      );
    }

    return (
      <div className="space-y-5 mt-4">
        {sortedGroups.map((groupName, gIdx) => (
          <div key={gIdx} className="bg-card rounded-lg border border-border/80 overflow-hidden">
            <div className="bg-muted/30 px-4 py-3 border-b border-border flex items-center gap-2.5">
              <Folder className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">{groupName}</h2>
              <Badge variant="secondary" className="text-[10px] tabular-nums">
                {grouped[groupName].length} Denetim
              </Badge>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {grouped[groupName].map((sub: any) => (
                <Card
                  key={sub.id}
                  className="rounded-lg border-border/70 hover:border-primary/40 transition-all duration-200 flex flex-col bg-card"
                >
                  <CardHeader className="pb-2.5 border-b border-border/50 bg-muted/15">
                    <CardTitle className="text-sm font-semibold leading-snug text-foreground">
                      {sub.template?.title || 'İsimsiz Şablon'}
                    </CardTitle>
                    <div className="flex flex-wrap gap-1.5 items-center pt-1">
                      {getStatusBadge(sub.status)}
                      {sub.isPeriodic && (
                        <Badge variant="secondary" className="text-[10px]">
                          Periyodik
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-3.5 flex-1 space-y-2.5 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <ClipboardCheck className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-medium text-foreground truncate">
                        {sub.facility?.name || 'Bilinmeyen Tesis'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center bg-muted/30 p-2.5 rounded-md border border-border/60">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                          Tarih
                        </span>
                        <span className="font-medium text-foreground tabular-nums">
                          {format(new Date(sub.auditDate), 'dd MMM yyyy', { locale: tr })}
                        </span>
                      </div>

                      {sub.status === 'TAMAMLANDI' && (
                        <div className="text-right">
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                            Başarı
                          </span>
                          <span
                            className={`font-bold tabular-nums ${
                              sub.percentScore != null && sub.percentScore < 50
                                ? 'text-destructive'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            %{sub.percentScore?.toFixed(1) || 0}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                      <span>Denetçi:</span>
                      <span className="font-medium text-foreground truncate max-w-[160px]">
                        {sub.conductedBy?.fullName || '-'}
                      </span>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0 pb-3.5 px-4 mt-auto">
                    <Button
                      size="sm"
                      variant={sub.status === 'TAMAMLANDI' ? 'outline' : 'default'}
                      className="w-full h-8 text-xs gap-1.5"
                      onClick={() => navigate(`/checklists/submissions/${sub.id}`)}
                    >
                      {sub.status === 'TASLAK' || sub.status === 'BEKLEYEN' ? (
                        <>
                          <Edit className="w-3.5 h-3.5" /> Denetime Devam Et{' '}
                          <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-70" />
                        </>
                      ) : sub.status === 'ONAY_BEKLIYOR' ? (
                        <>
                          <Eye className="w-3.5 h-3.5" /> Onay Bekleyen Raporu İncele
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" /> Sonuçları İncele
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-5 pb-10">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Tesis Denetimlerim
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Seçili tesise atanmış bekleyen, devam eden ve tamamlanan kontrol listeleri.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 bg-card p-1.5 rounded-lg border border-border">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="h-8 px-2.5 rounded-md bg-transparent text-xs font-semibold text-foreground outline-none cursor-pointer"
          >
            {[2023, 2024, 2025, 2026, 2027, 2028].map((y) => (
              <option key={y} value={y}>
                {y} Yılı
              </option>
            ))}
          </select>

          {isAdminOrManager && (
            <label className="flex items-center gap-2 px-2.5 border-l border-border text-xs font-medium cursor-pointer">
              <Checkbox
                checked={viewAllFacilities}
                onCheckedChange={(c) => setViewAllFacilities(!!c)}
              />
              <span>Tüm Tesisler</span>
            </label>
          )}

          {isAdminOrManager && (
            <Button
              size="sm"
              onClick={() => navigate('/checklists/submissions/new')}
              className="h-8 text-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Yeni Başlat
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="bekleyen" className="text-xs">
            Bekleyenler ({submissions.filter((s) => s.status === 'BEKLEYEN').length})
          </TabsTrigger>
          <TabsTrigger value="taslak" className="text-xs">
            Taslaklar ({submissions.filter((s) => s.status === 'TASLAK').length})
          </TabsTrigger>
          <TabsTrigger value="onay_bekleyen" className="text-xs">
            Onay Bekleyen ({submissions.filter((s) => s.status === 'ONAY_BEKLIYOR').length})
          </TabsTrigger>
          <TabsTrigger value="tamamlandi" className="text-xs">
            Tamamlanan ({submissions.filter((s) => s.status === 'TAMAMLANDI').length})
          </TabsTrigger>
          <TabsTrigger value="all" className="text-xs">
            Tümü ({submissions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bekleyen" className="mt-0 outline-none">
          {renderGroupedByTemplateGroup(submissions.filter((s) => s.status === 'BEKLEYEN'))}
        </TabsContent>
        <TabsContent value="taslak" className="mt-0 outline-none">
          {renderGroupedByTemplateGroup(submissions.filter((s) => s.status === 'TASLAK'))}
        </TabsContent>
        <TabsContent value="onay_bekleyen" className="mt-0 outline-none">
          {renderGroupedByTemplateGroup(submissions.filter((s) => s.status === 'ONAY_BEKLIYOR'))}
        </TabsContent>
        <TabsContent value="tamamlandi" className="mt-0 outline-none">
          {renderGroupedByTemplateGroup(submissions.filter((s) => s.status === 'TAMAMLANDI'))}
        </TabsContent>
        <TabsContent value="all" className="mt-0 outline-none">
          {renderGroupedByTemplateGroup(submissions)}
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Building2, ArrowLeft, Search, LayoutGrid, List as ListIcon, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const API = import.meta.env.VITE_API_URL || '';

export default function FacilityDepartmentsPage() {
  const { facilityId } = useParams<{ facilityId: string }>();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  const { data: facilities = [] } = useQuery({
    queryKey: ['risk-facilities'],
    queryFn: async () => {
      const res = await fetch(`${API}/api/risks/facilities`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
  });

  const facility = facilities.find((f: any) => f.id === facilityId);

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['risk-departments', facilityId],
    queryFn: async () => {
      const res = await fetch(`${API}/api/risks/departments?facilityId=${facilityId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Departmanlar alınamadı');
      return res.json();
    },
    enabled: !!facilityId,
  });

  const filteredDepartments = useMemo(() => {
    return departments.filter((d: any) => d.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [departments, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/risks/facility/${facilityId}`)} className="h-8 px-2">
          <ArrowLeft className="w-4 h-4 mr-1" /> {facility?.name || 'Tesis'}
        </Button>
        <div className="h-5 w-px bg-border" />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">Tüm Departmanlar</h1>
          <p className="text-xs text-muted-foreground">{facility?.name} kapsamındaki tüm departmanlar</p>
        </div>
      </div>

      {/* Arama ve Görünüm Modu */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card dark:bg-slate-900 p-4 rounded-xl border border-border form-shadow">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Departman ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary/20 focus:outline-none text-sm"
          />
        </div>
        
        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
          <Button 
            variant={viewMode === 'card' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setViewMode('card')}
            className="px-3"
          >
            <LayoutGrid className="w-4 h-4 mr-2" /> Kart
          </Button>
          <Button 
            variant={viewMode === 'list' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setViewMode('list')}
            className="px-3"
          >
            <ListIcon className="w-4 h-4 mr-2" /> Liste
          </Button>
        </div>
      </div>

      {/* İçerik */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
      ) : filteredDepartments.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-border">
          <Building2 className="w-10 h-10 opacity-30 mx-auto mb-3" />
          <p className="font-medium">Aramaya uygun departman bulunamadı</p>
        </div>
      ) : viewMode === 'card' ? (
        /* KART GÖRÜNÜMÜ */
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDepartments.map((dept: any) => {
            const acikCount = dept.stats?.acik || 0;
            const hasRisk = dept.riskCount > 0;
            
            return (
              <div
                key={dept.id}
                onClick={() => navigate(`/risks/department/${dept.id}`)}
                className="bg-card dark:bg-slate-900 p-6 rounded-xl border border-border dark:border-slate-800 form-shadow hover:border-primary transition-colors cursor-pointer group flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-4">
                  <h5 className="text-lg font-bold text-foreground truncate pr-2">{dept.name}</h5>
                  <span className={`text-xs px-2 py-1 rounded shrink-0 ${hasRisk ? 'bg-error/10 text-error font-medium' : 'bg-muted text-muted-foreground'}`}>
                    {dept.riskCount} Risk
                  </span>
                </div>
                
                <div className="mb-6 flex-1 space-y-1.5">
                  {hasRisk ? (
                    <>
                      {(acikCount > 0) && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-600"></div>
                          <span className="text-sm text-muted-foreground dark:text-slate-400">Açık Tehlike</span>
                          <span className="ml-auto font-bold text-red-600">{acikCount}</span>
                        </div>
                      )}
                      {(dept.stats?.mudahale > 0) && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                          <span className="text-sm text-muted-foreground dark:text-slate-400">İlk Müdahale</span>
                          <span className="ml-auto font-bold text-orange-500">{dept.stats.mudahale}</span>
                        </div>
                      )}
                      {(dept.stats?.takip > 0) && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                          <span className="text-sm text-muted-foreground dark:text-slate-400">Takipte</span>
                          <span className="ml-auto font-bold text-blue-600">{dept.stats.takip}</span>
                        </div>
                      )}
                      {(dept.stats?.kapali > 0) && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-sm text-muted-foreground dark:text-slate-400">Kapatıldı</span>
                          <span className="ml-auto font-bold text-green-500">{dept.stats.kapali}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="italic text-muted-foreground text-sm">Risk kaydı yok</div>
                  )}
                </div>
                
                <div className="pt-4 border-t border-border flex items-center justify-between text-primary">
                  <span className="text-sm font-medium">Detayları Gör</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LİSTE GÖRÜNÜMÜ */
        <div className="bg-card dark:bg-slate-900 border border-border rounded-xl overflow-hidden form-shadow">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="px-6 py-4 font-medium">Departman Adı</th>
                <th className="px-6 py-4 font-medium text-center">Toplam Risk</th>
                <th className="px-6 py-4 font-medium text-center">Açık Tehlike</th>
                <th className="px-6 py-4 font-medium text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredDepartments.map((dept: any) => {
                const acikCount = dept.stats?.acik || 0;
                return (
                  <tr 
                    key={dept.id} 
                    onClick={() => navigate(`/risks/department/${dept.id}`)}
                    className="hover:bg-muted/30 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4 font-medium text-foreground">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-4 h-4 text-primary opacity-50" />
                        {dept.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-muted font-medium">
                        {dept.riskCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {acikCount > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-error/10 text-error font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                          {acikCount}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

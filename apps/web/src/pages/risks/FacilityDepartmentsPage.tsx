import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Building2, ArrowLeft, Search, ChevronRight, ChevronDown, Plus, Minus, MapPin, LayoutGrid, List as ListIcon, FolderTree } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const API = import.meta.env.VITE_API_URL || '';

// Grouping Helper
function buildTree(locations: any[]) {
  const tree: Record<string, any> = {};

  locations.forEach(loc => {
    const b = loc.building || 'Belirtilmemiş Bina';
    const f = loc.floor || 'Belirtilmemiş Kat';
    const d = loc.department || 'Belirtilmemiş Birim';
    const facId = loc.facilityId;

    if (!tree[b]) tree[b] = { type: 'building', name: b, children: {}, risks: 0, stats: { acik: 0, mudahale: 0, takip: 0, kapali: 0 }, groupId: `group:building:${facId}:${b}` };
    if (!tree[b].children[f]) tree[b].children[f] = { type: 'floor', name: f, children: {}, risks: 0, stats: { acik: 0, mudahale: 0, takip: 0, kapali: 0 }, groupId: `group:floor:${facId}:${b}|${f}` };
    if (!tree[b].children[f].children[d]) tree[b].children[f].children[d] = { type: 'department', name: d, children: [], risks: 0, stats: { acik: 0, mudahale: 0, takip: 0, kapali: 0 }, groupId: `group:department:${facId}:${b}|${f}|${d}` };

    // Update stats bottom-up
    const unit = { ...loc, type: 'unit' };
    tree[b].children[f].children[d].children.push(unit);
    
    // Aggregate stats
    [tree[b], tree[b].children[f], tree[b].children[f].children[d]].forEach(node => {
      node.risks += loc.riskCount || 0;
      node.stats.acik += loc.stats?.acik || 0;
      node.stats.mudahale += loc.stats?.mudahale || 0;
      node.stats.takip += loc.stats?.takip || 0;
      node.stats.kapali += loc.stats?.kapali || 0;
    });
  });

  return tree;
}

export default function FacilityDepartmentsPage() {
  const { facilityId } = useParams<{ facilityId: string }>();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'tree' | 'card' | 'list'>('tree');

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

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['risk-departments-flat', facilityId],
    queryFn: async () => {
      const res = await fetch(`${API}/api/risks/departments?facilityId=${facilityId}&flat=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Lokasyonlar alınamadı');
      return res.json();
    },
    enabled: !!facilityId,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['risk-departments', facilityId],
    queryFn: async () => {
      const res = await fetch(`${API}/api/risks/departments?facilityId=${facilityId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Departmanlar alınamadı');
      return res.json();
    },
    enabled: !!facilityId && viewMode !== 'tree',
  });

  const filteredDepartments = useMemo(() => {
    return departments.filter((d: any) => d.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [departments, searchQuery]);

  const filteredTree = useMemo(() => {
    let filtered = locations;
    if (searchQuery.trim()) {
      filtered = locations.filter((loc: any) => 
        (loc.building || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (loc.floor || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (loc.department || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (loc.description || loc.name || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return buildTree(filtered);
  }, [locations, searchQuery]);

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderStats = (stats: any, riskCount: number) => {
    if (riskCount === 0) return <span className="text-xs text-muted-foreground">Risk yok</span>;
    return (
      <div className="flex items-center gap-3">
        {stats.acik > 0 && <span className="text-xs font-bold text-red-600 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-600" />{stats.acik}</span>}
        {stats.mudahale > 0 && <span className="text-xs font-bold text-orange-500 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500" />{stats.mudahale}</span>}
        {stats.takip > 0 && <span className="text-xs font-bold text-blue-600 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-600" />{stats.takip}</span>}
      </div>
    );
  };

  const renderTree = () => {
    return Object.entries(filteredTree).map(([bName, bNode]: any) => (
      <div key={bName} className="mb-4">
        {/* Building Node */}
        <div 
          className="flex items-center justify-between p-4 bg-card border rounded-lg shadow-sm cursor-pointer hover:border-primary transition-colors group"
          onClick={() => toggleNode(`b-${bName}`)}
        >
          <div className="flex items-center gap-3">
            {expandedNodes[`b-${bName}`] ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
            <Building2 className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">{bName}</h3>
          </div>
          <div className="flex items-center gap-4">
            {renderStats(bNode.stats, bNode.risks)}
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold">{bNode.risks} Risk</span>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 px-3 opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/risks/department/${bNode.groupId}`);
              }}
            >
              Risk Ekle / İncele
            </Button>
          </div>
        </div>

        {/* Floors */}
        {expandedNodes[`b-${bName}`] && (
          <div className="pl-8 pr-2 py-2 space-y-3 mt-2 border-l-2 border-border ml-6">
            {Object.entries(bNode.children).map(([fName, fNode]: any) => (
              <div key={`${bName}-${fName}`}>
                {/* Floor Node */}
                <div 
                  className="flex items-center justify-between p-3 bg-muted/30 border border-border/50 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors group"
                  onClick={() => toggleNode(`f-${bName}-${fName}`)}
                >
                  <div className="flex items-center gap-2">
                    {expandedNodes[`f-${bName}-${fName}`] ? <Minus className="w-4 h-4 text-muted-foreground" /> : <Plus className="w-4 h-4 text-muted-foreground" />}
                    <h4 className="font-semibold text-foreground">{fName}</h4>
                  </div>
                  <div className="flex items-center gap-4">
                    {renderStats(fNode.stats, fNode.risks)}
                    <span className="text-xs font-semibold text-muted-foreground">{fNode.risks} Risk</span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 px-2 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/risks/department/${fNode.groupId}`);
                      }}
                    >
                      Risk Ekle / İncele
                    </Button>
                  </div>
                </div>

                {/* Departments */}
                {expandedNodes[`f-${bName}-${fName}`] && (
                  <div className="pl-6 py-2 space-y-2 mt-2 border-l-2 border-border/50 ml-3">
                    {Object.entries(fNode.children).map(([dName, dNode]: any) => (
                      <div key={`${bName}-${fName}-${dName}`}>
                        {/* Department Node */}
                        <div 
                          className="flex items-center justify-between p-2.5 bg-background border rounded-md cursor-pointer hover:border-primary/50 group"
                          onClick={() => toggleNode(`d-${bName}-${fName}-${dName}`)}
                        >
                          <div className="flex items-center gap-2">
                            {expandedNodes[`d-${bName}-${fName}-${dName}`] ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                            <h5 className="font-medium text-sm text-foreground">{dName}</h5>
                          </div>
                          <div className="flex items-center gap-3">
                            {renderStats(dNode.stats, dNode.risks)}
                            <span className="text-xs font-semibold text-muted-foreground">{dNode.risks} Risk</span>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 px-2 opacity-0 group-hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/risks/department/${dNode.groupId}`);
                              }}
                            >
                              Risk Ekle / İncele
                            </Button>
                          </div>
                        </div>

                        {/* Units (Mahal) */}
                        {expandedNodes[`d-${bName}-${fName}-${dName}`] && (
                          <div className="pl-6 py-1.5 space-y-1 mt-1 border-l border-border/30 ml-2">
                            {dNode.children.map((unit: any) => (
                              <div 
                                key={unit.id}
                                className="flex items-center justify-between p-2 text-sm hover:bg-muted/50 rounded-md cursor-pointer group"
                                onClick={() => navigate(`/risks/department/${unit.id}`)}
                              >
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                                  <span className="text-muted-foreground">{unit.description || unit.name || 'Ana Birim Merkezi'}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  {renderStats(unit.stats, unit.riskCount)}
                                  {unit.riskCount > 0 && <span className="text-xs font-medium text-muted-foreground">{unit.riskCount}</span>}
                                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 text-primary" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/risks/facility/${facilityId}`)} className="h-8 px-2">
          <ArrowLeft className="w-4 h-4 mr-1" /> {facility?.name || 'Tesis'}
        </Button>
        <div className="h-5 w-px bg-border" />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">Lokasyonlar ve Birimler</h1>
          <p className="text-xs text-muted-foreground">{facility?.name} kapsamındaki tüm lokasyonların ağaç ve liste görünümü</p>
        </div>
      </div>

      {/* Arama ve View Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card dark:bg-slate-900 p-4 rounded-xl border border-border form-shadow">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Lokasyon veya birim ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary/20 focus:outline-none text-sm"
          />
        </div>
        
        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
          <Button 
            variant={viewMode === 'tree' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setViewMode('tree')}
            className="px-3"
          >
            <FolderTree className="w-4 h-4 mr-2" /> Ağaç
          </Button>
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
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : viewMode === 'tree' ? (
        Object.keys(filteredTree).length === 0 ? (
          <div className="py-16 text-center text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-border">
            <Building2 className="w-10 h-10 opacity-30 mx-auto mb-3" />
            <p className="font-medium">Aramaya uygun lokasyon bulunamadı</p>
          </div>
        ) : (
          <div className="space-y-4">
            {renderTree()}
          </div>
        )
      ) : viewMode === 'card' ? (
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
        <div className="bg-card dark:bg-slate-900 border border-border rounded-xl overflow-hidden form-shadow">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="px-6 py-4 font-medium">Birim Adı</th>
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

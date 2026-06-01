import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Building2, Plus, ChevronRight, AlertTriangle, ShieldCheck, Clock, Activity, ArrowLeft, RefreshCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import FacilityAdvancedDashboard from '@/components/risks/FacilityAdvancedDashboard';

const API = import.meta.env.VITE_API_URL || '';

const PIE_COLORS = ['#dc2626', '#ea580c', '#2563eb', '#16a34a'];

const LEVEL_COLORS: Record<string, string> = {
  'Tolere Gösterilmez Risk': '#7f1d1d', // Koyu Kırmızı
  'Yüksek Risk':             '#dc2626', // Kırmızı
  'Önemli Risk':             '#ea580c', // Turuncu
  'Olası Risk':              '#eab308', // Sarı
  'Önemsiz Risk':            '#16a34a', // Yeşil
  'Bilinmiyor':              '#9ca3af'  // Gri
};

const STATUS_MAP: Record<string, { label: string; color: string; dot: string }> = {
  ACIK_TEHLIKE:        { label: 'Açık Tehlike',    color: 'text-red-600',    dot: 'bg-red-500' },
  ILK_MUDAHALE_EDILDI: { label: 'İlk Müdahale',    color: 'text-orange-600', dot: 'bg-orange-500' },
  TAKIP_SURECINDE:     { label: 'Takip Sürecinde', color: 'text-blue-600',   dot: 'bg-blue-500' },
  KAPATILDI_GUVENLI:   { label: 'Kapatıldı',       color: 'text-emerald-600',dot: 'bg-emerald-500' },
};

export default function RiskFacilityPage() {
  const { facilityId } = useParams<{ facilityId: string }>();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [newDeptName, setNewDeptName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [adding, setAdding] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const { data: departments = [], isLoading, refetch } = useQuery({
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

  const { data: facilities = [] } = useQuery({
    queryKey: ['risk-facilities'],
    queryFn: async () => {
      const res = await fetch(`${API}/api/risks/facilities`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
  });

  const { data: facilityRisks = [], isLoading: risksLoading } = useQuery({
    queryKey: ['facility-risks', facilityId],
    queryFn: async () => {
      const res = await fetch(`${API}/api/risks/lifecycle?facilityId=${facilityId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Tesis riskleri alınamadı');
      return res.json();
    },
    enabled: !!facilityId,
  });

  const facility = facilities.find((f: any) => f.id === facilityId);

  const filteredDepartments = useMemo(() => {
    return departments.filter((d: any) => d.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [departments, searchQuery]);

  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(facilityRisks.map((r: any) => r.riskCategory).filter(Boolean))) as string[];
  }, [facilityRisks]);

  const filteredFacilityRisks = useMemo(() => {
    let list = [...facilityRisks];
    if (filterCategory) {
      list = list.filter(r => r.riskCategory === filterCategory);
    }
    return list;
  }, [facilityRisks, filterCategory]);

  // Dashboard Metrics
  const statusCounts = useMemo(() => {
    const counts = { ACIK_TEHLIKE: 0, ILK_MUDAHALE_EDILDI: 0, TAKIP_SURECINDE: 0, KAPATILDI_GUVENLI: 0 };
    filteredFacilityRisks.forEach((r: any) => {
      if (counts[r.status as keyof typeof counts] !== undefined) {
        counts[r.status as keyof typeof counts]++;
      }
    });
    return Object.entries(counts).map(([k, v]) => ({ name: STATUS_MAP[k]?.label || k, value: v }));
  }, [filteredFacilityRisks]);

  const levelCounts = useMemo(() => {
    const levels = filteredFacilityRisks.reduce((acc: any, r: any) => {
      const lvl = r.finalLevel || r.initialLevel || 'Bilinmiyor';
      acc[lvl] = (acc[lvl] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(levels).map(([k, v]) => ({ 
      name: k, 
      count: v,
      fill: LEVEL_COLORS[k] || LEVEL_COLORS['Bilinmiyor']
    }));
  }, [filteredFacilityRisks]);

  const handleAddDept = async () => {
    if (!newDeptName.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`${API}/api/risks/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ facilityId, name: newDeptName.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Hata');
      }
      toast.success(`"${newDeptName}" departmanı eklendi`);
      setNewDeptName('');
      setShowAdd(false);
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAdding(false);
    }
  };

  // Dinamik Filtre Metni
  const activeFiltersText = [
    filterCategory && `Kategori: ${filterCategory}`
  ].filter(Boolean).join(', ');

  const chartTitleSuffix = activeFiltersText ? ` - ${activeFiltersText}` : '';

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/risks')} className="h-8 px-2">
          <ArrowLeft className="w-4 h-4 mr-1" /> Tesisler
        </Button>
        <div className="h-5 w-px bg-border" />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{facility?.name || 'Tesis'}</h1>
          <p className="text-xs text-muted-foreground">Departman bazlı risk yönetimi</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)} className="shrink-0">
          <Plus className="w-4 h-4 mr-1.5" /> Departman Ekle
        </Button>
      </div>

      {/* Yeni Departman Formu */}
      {showAdd && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex gap-2 items-center">
            <input
              value={newDeptName}
              onChange={e => setNewDeptName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddDept()}
              placeholder="Departman adı (Örn: Acil Servis)"
              className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
            <Button size="sm" onClick={handleAddDept} disabled={adding || !newDeptName.trim()}>
              {adding ? 'Ekleniyor...' : 'Ekle'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>İptal</Button>
          </CardContent>
        </Card>
      )}

      {/* TOP METRICS (Stitch Style) */}
      {!risksLoading && (
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card dark:bg-slate-900 p-6 rounded-xl border border-border dark:border-slate-800 form-shadow text-center">
            <p className="text-sm font-medium text-muted-foreground dark:text-slate-400 mb-2">Toplam Risk</p>
            <h3 className="text-4xl font-bold text-primary">{filteredFacilityRisks.length}</h3>
          </div>
          <div className="bg-card dark:bg-slate-900 p-6 rounded-xl border border-border dark:border-slate-800 form-shadow text-center">
            <p className="text-sm font-medium text-muted-foreground dark:text-slate-400 mb-2">Toplam Departman</p>
            <h3 className="text-4xl font-bold text-primary">{departments.length}</h3>
          </div>
          <div className="bg-card dark:bg-slate-900 p-6 rounded-xl border border-border dark:border-slate-800 form-shadow flex items-center justify-between col-span-1 md:col-span-2">
            <div className="text-left">
              <p className="text-sm font-medium text-muted-foreground dark:text-slate-400 mb-1">Son Güncelleme</p>
              <h3 className="text-lg text-primary font-bold">
                {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })} - {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
              </h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-surface-ice flex items-center justify-center text-secondary">
              <RefreshCcw className="w-6 h-6" />
            </div>
          </div>
        </section>
      )}

      {/* DISTRIBUTION SECTION (Stitch Style Donut & CSS Bars) */}
      {!risksLoading && facilityRisks.length > 0 && (() => {
        const total = filteredFacilityRisks.length;
        const acikCount = filteredFacilityRisks.filter(r => r.status === 'ACIK_TEHLIKE').length;
        const kapaliCount = total - acikCount;
        const acikPercent = total > 0 ? Math.round((acikCount / total) * 100) : 0;
        
        const getLvlCount = (lvlName: string) => levelCounts.find((l: any) => l.name === lvlName)?.count || 0;
        const tolere = getLvlCount('Tolere Gösterilmez Risk');
        const yuksek = getLvlCount('Yüksek Risk');
        const onemli = getLvlCount('Önemli Risk');
        const olasi = getLvlCount('Olası Risk');
        const onemsiz = getLvlCount('Önemsiz Risk');

        const pct = (val: number) => total > 0 ? (val / total) * 100 : 0;

        return (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-1 bg-card dark:bg-slate-900 p-6 rounded-xl border border-border dark:border-slate-800 form-shadow flex flex-col">
              <h4 className="text-sm font-bold text-foreground dark:text-slate-100 mb-6">Tesis Geneli Durum Dağılımı</h4>
              <div className="flex-1 flex flex-col items-center justify-center relative">
                <div 
                  className="donut-chart w-48 h-48 flex items-center justify-center"
                  style={{ background: `conic-gradient(var(--color-error) 0% ${acikPercent}%, var(--color-surface-container-high) ${acikPercent}% 100%)` }}
                >
                  <div className="z-10 text-center flex flex-col items-center">
                    <span className="text-3xl font-bold text-error block leading-none">{acikPercent}%</span>
                    <span className="text-xs font-medium text-muted-foreground dark:text-slate-400 mt-1">Açık Tehlike</span>
                  </div>
                </div>
                <div className="mt-8 grid grid-cols-2 gap-4 w-full px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-error"></div>
                    <span className="text-xs font-medium text-muted-foreground dark:text-slate-400">Açık ({acikCount})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-muted dark:bg-slate-800"></div>
                    <span className="text-xs font-medium text-muted-foreground dark:text-slate-400">Kapalı ({kapaliCount})</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-card dark:bg-slate-900 p-6 rounded-xl border border-border dark:border-slate-800 form-shadow">
              <h4 className="text-sm font-bold text-foreground dark:text-slate-100 mb-6">Tesis Geneli Risk Seviyesi Dağılımı</h4>
              <div className="space-y-6 pt-4">
                
                {[
                  { label: 'Tolere Gösterilemez Risk', count: tolere, barClass: 'risk-bar-unbearable', width: pct(tolere) },
                  { label: 'Yüksek Risk', count: yuksek, barClass: 'risk-bar-high', width: pct(yuksek) },
                  { label: 'Önemli Risk', count: onemli, barClass: 'risk-bar-significant', width: pct(onemli) },
                  { label: 'Olası Risk', count: olasi, barClass: 'risk-bar-probable', width: pct(olasi) },
                  { label: 'Önemsiz Risk', count: onemsiz, barClass: 'risk-bar-insignificant', width: pct(onemsiz) }
                ].map((item, idx) => (
                  <div key={idx} className="relative">
                    <div className="flex items-center gap-4 mb-1">
                      <span className="w-36 text-right text-xs font-medium text-muted-foreground dark:text-slate-400">{item.label}</span>
                      <div className="flex-1 h-8 bg-muted dark:bg-slate-800/50 rounded-sm overflow-hidden flex items-center">
                        <div 
                          className={`${item.barClass} h-full transition-all duration-1000 ease-out`} 
                          style={{ width: `${item.width}%` }}
                        ></div>
                      </div>
                      <span className="w-8 font-bold text-foreground dark:text-slate-100 text-sm">{item.count}</span>
                    </div>
                  </div>
                ))}
                
                <div className="flex flex-wrap justify-center gap-6 pt-6 border-t border-border dark:border-slate-700 mt-4">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full risk-bar-unbearable"></div><span className="text-[10px] font-medium text-muted-foreground dark:text-slate-400">Tolere G.</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full risk-bar-high"></div><span className="text-[10px] font-medium text-muted-foreground dark:text-slate-400">Yüksek</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full risk-bar-significant"></div><span className="text-[10px] font-medium text-muted-foreground dark:text-slate-400">Önemli</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full risk-bar-probable"></div><span className="text-[10px] font-medium text-muted-foreground dark:text-slate-400">Olası</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full risk-bar-insignificant"></div><span className="text-[10px] font-medium text-muted-foreground dark:text-slate-400">Önemsiz</span></div>
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* GELİŞMİŞ DASHBOARD KISMI (Tablo ve Kompleks Analizler) */}
      {!risksLoading && facilityRisks.length > 0 && (
        <FacilityAdvancedDashboard facilityRisks={filteredFacilityRisks} />
      )}

      <section className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h4 className="text-2xl text-foreground dark:text-slate-100 font-bold">Departmanlar</h4>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text"
                placeholder="Departman ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-card dark:bg-slate-900 border border-border dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-secondary/20 focus:outline-none text-sm"
              />
            </div>
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-card dark:bg-slate-900 border border-border dark:border-slate-700 rounded-lg px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-secondary/20 outline-none"
            >
              <option value="">Tüm Kategoriler</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Departman Listesi */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1,2,3].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl bg-muted dark:bg-slate-800" />)}
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="col-span-full py-16 text-center text-muted-foreground dark:text-slate-400 bg-muted/30 dark:bg-slate-800/30 rounded-xl border border-dashed border-border dark:border-slate-700">
            <Building2 className="w-10 h-10 opacity-30 mx-auto mb-3" />
            <p className="font-medium">Departman bulunamadı</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredDepartments.map((dept: any) => {
              const acikCount = dept.stats?.acik || 0;
              const hasRisk = dept.riskCount > 0;
              
              return (
                <div
                  key={dept.id}
                  onClick={() => navigate(`/risks/department/${dept.id}`)}
                  className="bg-card dark:bg-slate-900 p-6 rounded-xl border border-border dark:border-slate-800 form-shadow hover:border-secondary transition-colors cursor-pointer group flex flex-col h-full"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h5 className="text-lg font-bold text-foreground dark:text-slate-100 truncate pr-2">{dept.name}</h5>
                    <span className={`text-xs px-2 py-1 rounded shrink-0 ${hasRisk ? 'bg-error-container text-on-error-container' : 'bg-muted dark:bg-slate-800/50 text-muted-foreground dark:text-slate-400'}`}>
                      {dept.riskCount} Risk
                    </span>
                  </div>
                  
                  <div className="mb-6 flex-1">
                    {hasRisk ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-error"></div>
                        <span className="text-sm text-muted-foreground dark:text-slate-400">Açık Tehlike</span>
                        <span className="ml-auto font-bold text-error">{acikCount}</span>
                      </div>
                    ) : (
                      <div className="italic text-muted-foreground dark:text-slate-400 text-sm">Risk kaydı yok</div>
                    )}
                  </div>
                  
                  <div className="pt-4 border-t border-border dark:border-slate-700 flex items-center justify-between text-secondary">
                    <span className="text-sm font-medium">Detayları Gör</span>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

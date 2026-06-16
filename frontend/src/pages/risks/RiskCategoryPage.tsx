import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useState, useMemo } from 'react';
import {
  ArrowLeft, Plus, Upload, Pencil, Eye, ArrowUpDown, Trash2, AlertTriangle, Building2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import RiskExcelImport from './RiskExcelImport';
import FacilityAdvancedDashboard from '@/components/risks/FacilityAdvancedDashboard';

const API = import.meta.env.VITE_API_URL || '';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  ACIK_TEHLIKE:        { label: 'Açık Tehlike',    color: 'text-red-600',    bg: 'bg-red-50 dark:bg-red-900/20',       border: 'border-red-200 dark:border-red-800' },
  ILK_MUDAHALE_EDILDI: { label: 'İlk Müdahale',    color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800' },
  TAKIP_SURECINDE:     { label: 'Takip Sürecinde', color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-900/20',     border: 'border-blue-200 dark:border-blue-800' },
  KAPATILDI_GUVENLI:   { label: 'Kapatıldı ✓',    color: 'text-emerald-600',bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800' },
};

const LEVEL_BADGE: Record<string, string> = {
  'Tolere Gösterilmez Risk': 'bg-red-900 text-red-100 border-red-950 dark:bg-red-950 dark:text-red-200',
  'Yüksek Risk':             'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  'Önemli Risk':             'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
  'Olası Risk':              'bg-amber-100 text-amber-800 border-amber-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
  'Önemsiz Risk':            'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
};

const LEVEL_COLORS: Record<string, string> = {
  'Tolere Gösterilmez Risk': '#7f1d1d', // Koyu Kırmızı
  'Yüksek Risk':             '#b91c1c', // Kırmızı
  'Önemli Risk':             '#c2410c', // Turuncu
  'Olası Risk':              '#b45309', // Sarı
  'Önemsiz Risk':            '#047857', // Yeşil
  'Bilinmiyor':              '#9ca3af'  // Gri
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['ACIK_TEHLIKE'];
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
}

function LevelBadge({ level }: { level: string }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${LEVEL_BADGE[level] || 'bg-muted text-muted-foreground border-border'}`}>
      {level}
    </span>
  );
}

export default function RiskCategoryPage() {
  const { facilityId } = useParams<{ facilityId: string }>();
  const [searchParams] = useSearchParams();
  const mainCat = searchParams.get('mainCat') || '';
  const subCat = searchParams.get('subCat') || '';
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = localStorage.getItem('token');

  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterDepartment, setFilterDepartment] = useState<string>('');
  const [filterResponsible, setFilterResponsible] = useState<string>('');

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'initialScore', direction: 'desc' });

  // Tesis Bilgisi
  const { data: facilities = [] } = useQuery({
    queryKey: ['risk-facilities'],
    queryFn: async () => {
      const res = await fetch(`${API}/api/risks/facilities`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    }
  });
  const facility = facilities.find((f: any) => f.id === facilityId);

  // Departmanlar (Haritalama için)
  const { data: departments = [] } = useQuery({
    queryKey: ['risk-departments', facilityId],
    queryFn: async () => {
      const res = await fetch(`${API}/api/risks/departments?facilityId=${facilityId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    },
    enabled: !!facilityId
  });

  const departmentMap = useMemo(() => {
    const map: Record<string, { name: string, code: string }> = {};
    departments.forEach((d: any) => {
      const code = d.name ? d.name.replace(/i/g, 'İ').replace(/ı/g, 'I').toUpperCase().substring(0, 3) : 'GEN';
      map[d.id] = { name: d.name, code: code };
    });
    return map;
  }, [departments]);

  // Riskler
  const { data: allRisks = [], isLoading } = useQuery({
    queryKey: ['facility-risks', facilityId],
    queryFn: async () => {
      const res = await fetch(`${API}/api/risks/lifecycle?facilityId=${facilityId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Riskler alınamadı');
      return res.json();
    },
    enabled: !!facilityId,
  });

  // Kategoriye Göre Filtrele
  const categoryRisks = useMemo(() => {
    return allRisks.filter((r: any) => {
      if (mainCat && r.riskCategory !== mainCat) return false;
      if (subCat && r.subCategory !== subCat) return false;
      return true;
    });
  }, [allRisks, mainCat, subCat]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API}/api/risks/lifecycle/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Silinemedi');
    },
    onSuccess: () => {
      toast.success('Risk silindi');
      queryClient.invalidateQueries({ queryKey: ['facility-risks', facilityId] });
    },
    onError: () => toast.error('Silme işlemi başarısız'),
  });

  const handleDelete = (id: string) => {
    if (confirm('Bu riski silmek istediğinize emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const uniqueDepartments = useMemo(() => {
    const ids = Array.from(new Set(categoryRisks.map((r: any) => r.departmentId).filter(Boolean))) as string[];
    return ids.map(id => ({ id, name: departmentMap[id]?.name || 'Bilinmeyen Departman' }));
  }, [categoryRisks, departmentMap]);

  const uniqueResponsibles = useMemo(() => Array.from(new Set(categoryRisks.map((r: any) => r.improvementResponsible).filter(Boolean))) as string[], [categoryRisks]);

  const sortedRisks = useMemo(() => {
    let sortableRisks = [...categoryRisks];
    if (filterStatus) {
      sortableRisks = sortableRisks.filter(r => r.status === filterStatus);
    }
    if (filterDepartment) {
      sortableRisks = sortableRisks.filter(r => r.departmentId === filterDepartment);
    }
    if (filterResponsible) {
      sortableRisks = sortableRisks.filter(r => r.improvementResponsible === filterResponsible);
    }
    
    if (sortConfig !== null) {
      sortableRisks.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'initialScore' || sortConfig.key === 'finalScore' || sortConfig.key === 'riskNo') {
          aValue = Number(aValue) || 0;
          bValue = Number(bValue) || 0;
        } else {
          if (aValue === null) aValue = '';
          if (bValue === null) bValue = '';
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableRisks;
  }, [categoryRisks, sortConfig, filterStatus, filterDepartment, filterResponsible]);

  const initialLevelCounts = useMemo(() => {
    return sortedRisks.reduce((acc: any, r: any) => {
      const lvl = r.initialLevel || 'Bilinmiyor';
      acc[lvl] = (acc[lvl] || 0) + 1;
      return acc;
    }, {});
  }, [sortedRisks]);

  const finalLevelCounts = useMemo(() => {
    return sortedRisks.reduce((acc: any, r: any) => {
      const lvl = r.finalLevel || r.initialLevel || 'Bilinmiyor';
      acc[lvl] = (acc[lvl] || 0) + 1;
      return acc;
    }, {});
  }, [sortedRisks]);

  const activeFiltersText = [
    filterStatus && `Durum: ${STATUS_CONFIG[filterStatus]?.label}`,
    filterDepartment && `Departman: ${departmentMap[filterDepartment]?.name}`,
    filterResponsible && `İyileştirme Sorumlusu: ${filterResponsible}`
  ].filter(Boolean).join(', ');

  const chartTitleSuffix = activeFiltersText ? ` - ${activeFiltersText}` : '';

  const pageTitle = subCat ? `${mainCat} - ${subCat}` : mainCat;

  return (
    <div className="space-y-6">
      {/* Başlık ve Aksiyonlar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/risks/facility/${facilityId}/categories`)} className="h-8 px-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> Kategoriler
          </Button>
          <div className="h-5 w-px bg-border" />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {pageTitle}
            </h1>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{facility?.name || 'Tesis'} Kapsamında</p>
          </div>
        </div>
      </div>

      {/* DASHBOARD KISMI */}
      {!isLoading && categoryRisks.length > 0 && (() => {
        const total = sortedRisks.length;
        const acikCount = sortedRisks.filter(r => r.status === 'ACIK_TEHLIKE').length;
        const kapaliCount = total - acikCount;
        const acikPercent = total > 0 ? Math.round((acikCount / total) * 100) : 0;
        
        const getInitCount = (lvlName: string) => initialLevelCounts[lvlName] || 0;
        const getFinalCount = (lvlName: string) => finalLevelCounts[lvlName] || 0;
        
        const iTolere = getInitCount('Tolere Gösterilmez Risk');
        const iYuksek = getInitCount('Yüksek Risk');
        const iOnemli = getInitCount('Önemli Risk');
        const iOlasi = getInitCount('Olası Risk');
        const iOnemsiz = getInitCount('Önemsiz Risk');

        const fTolere = getFinalCount('Tolere Gösterilmez Risk');
        const fYuksek = getFinalCount('Yüksek Risk');
        const fOnemli = getFinalCount('Önemli Risk');
        const fOlasi = getFinalCount('Olası Risk');
        const fOnemsiz = getFinalCount('Önemsiz Risk');

        const pct = (val: number) => total > 0 ? (val / total) * 100 : 0;

        return (
          <>
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-1 bg-card dark:bg-slate-900 p-6 rounded-xl border border-border dark:border-slate-800 form-shadow flex flex-col">
              <h4 className="text-sm font-bold text-foreground dark:text-slate-100 mb-6 truncate">
                Kategori Durum Dağılımı{chartTitleSuffix && <span className="font-normal text-xs ml-1 opacity-70">({chartTitleSuffix})</span>}
              </h4>
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

            <div className="lg:col-span-2 bg-card dark:bg-slate-900 p-6 rounded-xl border border-border dark:border-slate-800 form-shadow flex flex-col">
              <h4 className="text-sm font-bold text-foreground dark:text-slate-100 mb-4 truncate">
                Kategori Risk Seviyesi Dağılımı{chartTitleSuffix && <span className="font-normal text-xs ml-1 opacity-70">({chartTitleSuffix})</span>}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                {/* İlk Tespit */}
                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-muted-foreground uppercase text-center border-b pb-2">İlk Tespit Risk Skoru</h5>
                  {[
                    { label: 'Tolere Gösterilemez Risk', count: iTolere, barClass: 'risk-bar-unbearable', width: pct(iTolere) },
                    { label: 'Yüksek Risk', count: iYuksek, barClass: 'risk-bar-high', width: pct(iYuksek) },
                    { label: 'Önemli Risk', count: iOnemli, barClass: 'risk-bar-significant', width: pct(iOnemli) },
                    { label: 'Olası Risk', count: iOlasi, barClass: 'risk-bar-probable', width: pct(iOlasi) },
                    { label: 'Önemsiz Risk', count: iOnemsiz, barClass: 'risk-bar-insignificant', width: pct(iOnemsiz) }
                  ].map((item, idx) => (
                    <div key={`init-${idx}`} className="relative group/bar">
                      <div className="flex items-center gap-3 group-hover/bar:bg-muted/30 p-1 -mx-1 rounded transition-colors">
                        <span className="w-24 text-right text-[10px] font-medium text-muted-foreground dark:text-slate-400 leading-tight group-hover/bar:text-foreground transition-colors">{item.label}</span>
                        <div className="flex-1 h-6 bg-muted dark:bg-slate-800/50 rounded-sm overflow-hidden flex items-center">
                          <div className={`${item.barClass} h-full transition-all duration-1000 ease-out`} style={{ width: `${item.width}%` }}></div>
                        </div>
                        <span className="w-6 font-bold text-foreground dark:text-slate-100 text-xs">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* İyileştirme Sonrası */}
                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-muted-foreground uppercase text-center border-b pb-2">İyileştirme Sonrası Risk Skoru</h5>
                  {[
                    { label: 'Tolere Gösterilemez Risk', count: fTolere, barClass: 'risk-bar-unbearable', width: pct(fTolere) },
                    { label: 'Yüksek Risk', count: fYuksek, barClass: 'risk-bar-high', width: pct(fYuksek) },
                    { label: 'Önemli Risk', count: fOnemli, barClass: 'risk-bar-significant', width: pct(fOnemli) },
                    { label: 'Olası Risk', count: fOlasi, barClass: 'risk-bar-probable', width: pct(fOlasi) },
                    { label: 'Önemsiz Risk', count: fOnemsiz, barClass: 'risk-bar-insignificant', width: pct(fOnemsiz) }
                  ].map((item, idx) => (
                    <div key={`final-${idx}`} className="relative group/bar">
                      <div className="flex items-center gap-3 group-hover/bar:bg-muted/30 p-1 -mx-1 rounded transition-colors">
                        <span className="w-24 text-right text-[10px] font-medium text-muted-foreground dark:text-slate-400 leading-tight group-hover/bar:text-foreground transition-colors">{item.label}</span>
                        <div className="flex-1 h-6 bg-muted dark:bg-slate-800/50 rounded-sm overflow-hidden flex items-center">
                          <div className={`${item.barClass} h-full transition-all duration-1000 ease-out`} style={{ width: `${item.width}%` }}></div>
                        </div>
                        <span className="w-6 font-bold text-foreground dark:text-slate-100 text-xs">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-wrap justify-center gap-4 pt-4 mt-auto">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full risk-bar-unbearable"></div><span className="text-[9px] font-medium text-muted-foreground dark:text-slate-400">Tolere G.</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full risk-bar-high"></div><span className="text-[9px] font-medium text-muted-foreground dark:text-slate-400">Yüksek</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full risk-bar-significant"></div><span className="text-[9px] font-medium text-muted-foreground dark:text-slate-400">Önemli</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full risk-bar-probable"></div><span className="text-[9px] font-medium text-muted-foreground dark:text-slate-400">Olası</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full risk-bar-insignificant"></div><span className="text-[9px] font-medium text-muted-foreground dark:text-slate-400">Önemsiz</span></div>
              </div>
            </div>
          </section>
          </>
        );
      })()}

      {/* Filtre */}
      <div className="flex flex-col sm:flex-row gap-3 bg-card p-3 rounded-xl border shadow-sm">
        <div className="flex gap-2 flex-wrap items-center">
          <Button size="sm" variant={filterStatus === '' ? 'default' : 'outline'} onClick={() => setFilterStatus('')} className="h-8 text-xs rounded-full">
            Tümü ({categoryRisks.length})
          </Button>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            const count = categoryRisks.filter((r: any) => r.status === key).length;
            return (
              <Button
                key={key} size="sm" variant={filterStatus === key ? 'default' : 'outline'}
                onClick={() => setFilterStatus(filterStatus === key ? '' : key)}
                className="h-8 text-xs rounded-full border-dashed"
              >
                <span className={`w-2 h-2 rounded-full mr-1.5 ${cfg.border.replace('border-', 'bg-').split(' ')[0]}`} />
                {cfg.label} ({count})
              </Button>
            );
          })}
        </div>
        
        <div className="flex gap-2 flex-wrap ml-auto">
          <select 
            value={filterDepartment} 
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="h-8 text-xs bg-background border border-border rounded-full px-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Tüm Departmanlar</option>
            {uniqueDepartments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
          
          <select 
            value={filterResponsible} 
            onChange={(e) => setFilterResponsible(e.target.value)}
            className="h-8 text-xs bg-background border border-border rounded-full px-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Tüm Sorumlular</option>
            {uniqueResponsibles.map(resp => (
              <option key={resp} value={resp}>{resp}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLO KISMI */}
      <Card className="border shadow-sm overflow-hidden rounded-xl">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
          </div>
        ) : categoryRisks.length === 0 ? (
          <CardContent className="py-20 text-center">
            <AlertTriangle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="font-medium text-lg text-muted-foreground">
              {filterStatus ? 'Bu filtrede risk bulunamadı' : 'Bu kategoriye ait risk yok'}
            </p>
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                <tr>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('riskNo')}>
                    <div className="flex items-center gap-1">Risk No <ArrowUpDown className="w-3 h-3"/></div>
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('departmentId')}>
                    <div className="flex items-center gap-1">Departman <ArrowUpDown className="w-3 h-3"/></div>
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('subCategory')}>
                    <div className="flex items-center gap-1">Alt Kategori <ArrowUpDown className="w-3 h-3"/></div>
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('improvementResponsible')}>
                    <div className="flex items-center gap-1">İyileştirme Sorumlusu <ArrowUpDown className="w-3 h-3"/></div>
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('initialScore')}>
                    <div className="flex items-center gap-1 whitespace-nowrap">Mevcut Risk <ArrowUpDown className="w-3 h-3"/></div>
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('finalScore')}>
                    <div className="flex items-center gap-1 whitespace-nowrap">İyileştirme Sonrası Risk <ArrowUpDown className="w-3 h-3"/></div>
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-1">Durum <ArrowUpDown className="w-3 h-3"/></div>
                  </th>
                  <th className="px-4 py-3 font-medium text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedRisks.map((risk) => {
                  const dept = departmentMap[risk.departmentId];
                  const dCode = dept?.code || 'GEN';
                  return (
                    <tr key={risk.id} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-4 py-3 font-mono font-medium text-muted-foreground">
                        {dCode}-{String(risk.riskNo).padStart(3, '0')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium flex items-center gap-2">
                          <Building2 className="w-3 h-3 text-muted-foreground" />
                          {dept?.name || 'Bilinmeyen'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {risk.subCategory || '-'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {risk.improvementResponsible || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <LevelBadge level={risk.initialLevel || 'Bilinmiyor'} />
                      </td>
                      <td className="px-4 py-3">
                        {risk.finalLevel ? <LevelBadge level={risk.finalLevel} /> : <span className="text-muted-foreground ml-4">-</span>}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={risk.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-blue-600" onClick={() => navigate(`/risks/department/${risk.departmentId}/view/${risk.id}`)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-orange-600" onClick={() => navigate(`/risks/department/${risk.departmentId}/edit/${risk.id}`)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(risk.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

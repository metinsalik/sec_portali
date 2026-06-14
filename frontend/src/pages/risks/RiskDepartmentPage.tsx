import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useMemo } from 'react';
import {
  ArrowLeft, Plus, Upload, Pencil, X, Check, AlertTriangle,
  Eye, ArrowUpDown, Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import RiskExcelImport from './RiskExcelImport';
import FacilityAdvancedDashboard from '@/components/risks/FacilityAdvancedDashboard';
import { RiskPrintModal } from '@/components/risks/RiskPrintModal';
import { Printer } from 'lucide-react';

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

// Colors for Pie Chart (Status)
const PIE_COLORS = ['#dc2626', '#ea580c', '#2563eb', '#16a34a'];

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

export default function RiskDepartmentPage() {
  const { departmentId } = useParams<{ departmentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = localStorage.getItem('token');

  const [showImport, setShowImport] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterResponsible, setFilterResponsible] = useState<string>('');

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'initialScore', direction: 'desc' });

  const { data: department } = useQuery({
    queryKey: ['risk-department-details', departmentId],
    queryFn: async () => {
      const res = await fetch(`${API}/api/risks/departments/${departmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Departman detayları alınamadı');
      return res.json();
    },
    enabled: !!departmentId
  });

  const { data: risks = [], isLoading } = useQuery({
    queryKey: ['risks', departmentId],
    queryFn: async () => {
      const params = new URLSearchParams({ departmentId: departmentId! });
      if (filterStatus) params.set('status', filterStatus);
      const res = await fetch(`${API}/api/risks/lifecycle?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Riskler alınamadı');
      return res.json();
    },
    enabled: !!departmentId,
  });

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
      queryClient.invalidateQueries({ queryKey: ['risks', departmentId] });
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

  // Unique categories & responsibles for filtering
  const uniqueCategories = useMemo(() => Array.from(new Set(risks.map((r: any) => r.riskCategory).filter(Boolean))) as string[], [risks]);
  const uniqueResponsibles = useMemo(() => Array.from(new Set(risks.map((r: any) => r.improvementResponsible).filter(Boolean))) as string[], [risks]);

  const sortedRisks = useMemo(() => {
    let sortableRisks = [...risks];
    if (filterStatus) {
      sortableRisks = sortableRisks.filter(r => r.status === filterStatus);
    }
    if (filterCategory) {
      sortableRisks = sortableRisks.filter(r => r.riskCategory === filterCategory);
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
  }, [risks, sortConfig, filterStatus, filterCategory, filterResponsible]);

  // Dashboard Metrics Computations (Dinamik)
  const statusCounts = useMemo(() => {
    const counts = { ACIK_TEHLIKE: 0, ILK_MUDAHALE_EDILDI: 0, TAKIP_SURECINDE: 0, KAPATILDI_GUVENLI: 0 };
    sortedRisks.forEach((r: any) => {
      if (counts[r.status as keyof typeof counts] !== undefined) {
        counts[r.status as keyof typeof counts]++;
      }
    });
    return Object.entries(counts).map(([k, v]) => ({ name: STATUS_CONFIG[k].label, value: v, status: k }));
  }, [sortedRisks]);

  const levelCounts = useMemo(() => {
    const levels = sortedRisks.reduce((acc: any, r: any) => {
      const lvl = r.finalLevel || r.initialLevel || 'Bilinmiyor';
      acc[lvl] = (acc[lvl] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(levels).map(([k, v]) => ({ 
      name: k, 
      count: v,
      fill: LEVEL_COLORS[k] || LEVEL_COLORS['Bilinmiyor']
    }));
  }, [sortedRisks]);

  const deptName = department?.name || 'Departman';
  const deptCode = department?.code || 'GEN';
  const facilityId = department?.facilityId;

  // Dinamik Filtre Metni
  const activeFiltersText = [
    filterStatus && `Durum: ${STATUS_CONFIG[filterStatus]?.label}`,
    filterCategory && `Kategori: ${filterCategory}`,
    filterResponsible && `Sorumlu: ${filterResponsible}`
  ].filter(Boolean).join(', ');

  const chartTitleSuffix = activeFiltersText ? ` - ${activeFiltersText}` : '';

  return (
    <div className="space-y-6">
      {/* Başlık ve Aksiyonlar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(facilityId ? `/risks/facility/${facilityId}` : '/risks')} className="h-8 px-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> Departmanlar
          </Button>
          <div className="h-5 w-px bg-border" />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {deptName}
            </h1>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">Departman Kodu: {deptCode}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowPrintModal(true)} className="shadow-sm border-blue-200 text-blue-700 hover:bg-blue-50">
            <Printer className="w-4 h-4 mr-1.5" /> Çıktı Önizleme
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowImport(true)} className="shadow-sm">
            <Upload className="w-4 h-4 mr-1.5" /> Excel İçe Aktar
          </Button>
          <Button size="sm" onClick={() => navigate(`/risks/department/${departmentId}/create`)} className="shadow-md">
            <Plus className="w-4 h-4 mr-1.5" /> Yeni Risk Ekle
          </Button>
        </div>
      </div>

      {/* YENİ STITCH DASHBOARD KISMI */}
      {!isLoading && risks.length > 0 && (() => {
        const total = sortedRisks.length;
        const acikCount = sortedRisks.filter(r => r.status === 'ACIK_TEHLIKE').length;
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
          <>
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-1 bg-card dark:bg-slate-900 p-6 rounded-xl border border-border dark:border-slate-800 form-shadow flex flex-col">
              <h4 className="text-sm font-bold text-foreground dark:text-slate-100 mb-6 truncate" title={`Departman Durum Dağılımı${chartTitleSuffix}`}>
                Departman Durum Dağılımı{chartTitleSuffix && <span className="font-normal text-xs ml-1 opacity-70">({chartTitleSuffix})</span>}
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

            <div className="lg:col-span-2 bg-card dark:bg-slate-900 p-6 rounded-xl border border-border dark:border-slate-800 form-shadow">
              <h4 className="text-sm font-bold text-foreground dark:text-slate-100 mb-6 truncate" title={`Departman Risk Seviyesi Dağılımı${chartTitleSuffix}`}>
                Departman Risk Seviyesi Dağılımı{chartTitleSuffix && <span className="font-normal text-xs ml-1 opacity-70">({chartTitleSuffix})</span>}
              </h4>
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

          {/* GELİŞMİŞ DASHBOARD KISMI (Accordion Yapısı) */}
          <FacilityAdvancedDashboard facilityRisks={sortedRisks} />
          </>
        );
      })()}

      {/* Filtre */}
      <div className="flex flex-col sm:flex-row gap-3 bg-card p-3 rounded-xl border shadow-sm">
        <div className="flex gap-2 flex-wrap items-center">
          <Button size="sm" variant={filterStatus === '' ? 'default' : 'outline'} onClick={() => setFilterStatus('')} className="h-8 text-xs rounded-full">
            Tümü ({risks.length})
          </Button>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            const count = risks.filter((r: any) => r.status === key).length;
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
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-8 text-xs bg-background border border-border rounded-full px-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Tüm Kategoriler</option>
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
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
        ) : risks.length === 0 ? (
          <CardContent className="py-20 text-center">
            <AlertTriangle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="font-medium text-lg text-muted-foreground">
              {filterStatus ? 'Bu filtrede risk bulunamadı' : 'Henüz risk yok'}
            </p>
            {!filterStatus && (
              <p className="text-sm text-muted-foreground/60 mt-2">
                "Yeni Risk Ekle" butonu ile ilk riskinizi oluşturun.
              </p>
            )}
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                <tr>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('riskNo')}>
                    <div className="flex items-center gap-1">Risk No <ArrowUpDown className="w-3 h-3"/></div>
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('riskCategory')}>
                    <div className="flex items-center gap-1">Kategori - Alt Kategori <ArrowUpDown className="w-3 h-3"/></div>
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('improvementResponsible')}>
                    <div className="flex items-center gap-1">Sorumlu <ArrowUpDown className="w-3 h-3"/></div>
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('initialScore')}>
                    <div className="flex items-center gap-1">Seviye <ArrowUpDown className="w-3 h-3"/></div>
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-1">Durum <ArrowUpDown className="w-3 h-3"/></div>
                  </th>
                  <th className="px-4 py-3 font-medium text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedRisks.map((risk) => (
                  <tr key={risk.id} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-4 py-3 font-mono font-medium text-muted-foreground">
                      {deptCode}-{String(risk.riskNo).padStart(3, '0')}
                    </td>
                    <td className="px-4 py-3 min-w-[200px]">
                      <div className="font-medium text-foreground">{risk.riskCategory}</div>
                      {risk.subCategory && <div className="text-xs text-muted-foreground">{risk.subCategory}</div>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {risk.improvementResponsible || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <LevelBadge level={risk.finalLevel || risk.initialLevel} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={risk.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-blue-600" onClick={() => navigate(`/risks/department/${departmentId}/view/${risk.id}`)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-orange-600" onClick={() => navigate(`/risks/department/${departmentId}/edit/${risk.id}`)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(risk.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal: Excel Import */}
      {showImport && (
        <RiskExcelImport
          facilityId={facilityId}
          departmentName={department?.name}
          onClose={() => setShowImport(false)}
          onSuccess={() => {
            setShowImport(false);
            queryClient.invalidateQueries({ queryKey: ['risks', departmentId] });
          }}
        />
      )}

      {/* Modal: Print Preview */}
      <RiskPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        risks={risks}
        department={department}
        deptCode={deptCode}
      />
    </div>
  );
}

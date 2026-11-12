import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { 
  Building2, ChevronRight, ChevronDown, RefreshCw, 
  AlertTriangle, Zap, ClipboardList, Wrench, Flame, TrendingUp,
  Layers, ArrowUpDown, ArrowUp, ArrowDown, FileText, ClipboardCheck, Activity,
  LayoutDashboard, Filter, Search, ShieldAlert, CheckCircle2, Clock, Eye,
  SlidersHorizontal, Check, Sparkles, XCircle, ArrowRight, ShieldCheck, PieChart, Info
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, LabelList, Cell 
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { type DashboardStats, type FacilityOption } from './types';
import { ReportModuleDashboard } from './ReportModuleDashboard';
import { ExecutiveProgressCockpit } from './ExecutiveProgressCockpit';

const API = import.meta.env.VITE_API_URL || '';

// Yan Menü ile Birebir Uyumlu Raporlama ve Takip Grupları
const TRACKING_GROUPS = [
  {
    key: 'DENETIMLER',
    name: 'Denetimler',
    icon: ClipboardList,
    accentColor: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60',
    badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    items: [
      { key: 'HASTANE_IC_DENETIMLERI', name: 'Hastane İç Denetimleri', path: '/operations-management/improvements/denetimler/hastane-ic', icon: ClipboardList },
      { key: 'MERKEZI_DENETIMLER', name: 'Merkezi Denetimler', path: '/operations-management/improvements/denetimler/merkezi', icon: ClipboardList },
      { key: 'SAGLIK_DENETIMLERI', name: 'Sağlık Denetimleri', path: '/operations-management/improvements/denetimler/saglik', icon: ClipboardList },
      { key: 'ITFAIYE_YANGIN_DENETIMLERI', name: 'İtfaiye/Yangın Komisyonu Denetimleri', path: '/operations-management/improvements/denetimler/itfaiye-yangin', icon: ClipboardList },
    ],
  },
  {
    key: 'ELEKTRIK',
    name: 'Elektrik Emniyet Raporu',
    icon: Zap,
    accentColor: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60',
    badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    items: [
      { key: 'ELEKTRIK_PK', name: 'Elektrik PK', path: '/operations-management/improvements/electrical/elektrik-pk', icon: Zap },
      { key: 'TOPRAKLAMA_PK', name: 'Topraklama PK', path: '/operations-management/improvements/electrical/topraklama-pk', icon: Zap },
      { key: 'PARATONER_PK', name: 'Paratoner PK', path: '/operations-management/improvements/electrical/paratoner-pk', icon: Zap },
      { key: 'JENERATOR_PK', name: 'Jeneratör PK & Bakım', path: '/operations-management/improvements/electrical/jenerator-pk', icon: Zap },
      { key: 'ELEKTRIK_PANO_KONTROLLERI', name: 'Elektrik Pano Kontrolleri', path: '/operations-management/improvements/electrical/pano-kontrol', icon: Zap },
      { key: 'TRAFO', name: 'Trafo PK & Bakım', path: '/operations-management/improvements/electrical/trafo', icon: Zap },
      { key: 'UPS', name: 'UPS PK & Bakım', path: '/operations-management/improvements/electrical/ups', icon: Zap },
    ],
  },
  {
    key: 'MEKANIK',
    name: 'Mekanik Emniyet Raporu',
    icon: Wrench,
    accentColor: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800/60',
    badgeColor: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
    items: [
      { key: 'KAZANLAR', name: 'Kazanlar', path: '/operations-management/improvements/mechanical/kazanlar', icon: Wrench },
      { key: 'CHILLERLER', name: 'Chillerler', path: '/operations-management/improvements/mechanical/chillerler', icon: Wrench },
      { key: 'KLIMA_SANTRALLERI', name: 'Klima Santralleri', path: '/operations-management/improvements/mechanical/klima-santralleri', icon: Wrench },
    ],
  },
  {
    key: 'YANGIN',
    name: 'Yangın Sistemleri Emniyet Raporu',
    icon: Flame,
    accentColor: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/60',
    badgeColor: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    items: [
      { key: 'SULU_SONDURME_PK_BAKIM', name: 'Sulu Söndürme PK & Bakım', path: '/operations-management/improvements/fire-safety/sulu-sondurme-pk-bakim', icon: Flame },
      { key: 'GAZLI_SONDURME_PK_BAKIM', name: 'Gazlı Söndürme PK & Bakım', path: '/operations-management/improvements/fire-safety/gazli-sondurme-pk-bakim', icon: Flame },
      { key: 'BASINCLANDIRMA_PK_BAKIM', name: 'Basınçlandırma Sistemleri PK & Bakım', path: '/operations-management/improvements/fire-safety/basinclandirma-pk-bakim', icon: Flame },
      { key: 'YANGIN_ALGILAMA_PK_BAKIM', name: 'Yangın Algılama ve Uyarı Sistemleri PK & Bakım', path: '/operations-management/improvements/fire-safety/yangin-algilama-pk-bakim', icon: Flame },
    ],
  },
];

const TOTAL_TRACKING_SHEETS = TRACKING_GROUPS.reduce((acc, g) => acc + g.items.length, 0);

// ─────────────────────────────────────────────────────────────────────────────
// TAKİP ALANLARI DAĞILIM MATRİSİ GRUPLARI (KULLANICI GÖRSELİ STANDARDI)
// ─────────────────────────────────────────────────────────────────────────────
interface MatrixSheetItem {
  key: string;
  name: string;
  path: string;
  icon: any;
}

interface MatrixGroupDef {
  key: string;
  name: string;
  items: MatrixSheetItem[];
}

const MATRIX_GROUPS: MatrixGroupDef[] = [
  {
    key: 'DENETIMLER',
    name: 'Denetimler',
    items: [
      { key: 'HASTANE_IC_DENETIMLERI', name: 'Hastane İç Denetimleri', path: '/operations-management/improvements/denetimler/hastane-ic', icon: ClipboardList },
      { key: 'MERKEZI_DENETIMLER', name: 'Merkezi Denetimler', path: '/operations-management/improvements/denetimler/merkezi', icon: ClipboardCheck },
      { key: 'SAGLIK_DENETIMLERI', name: 'Sağlık Bakanlığı Denetimleri', path: '/operations-management/improvements/denetimler/saglik', icon: Activity },
      { key: 'ITFAIYE_YANGIN_DENETIMLERI', name: 'İtfaiye/Yangın Komisyonu Denetimleri', path: '/operations-management/improvements/denetimler/itfaiye-yangin', icon: Flame },
    ],
  },
  {
    key: 'ELEKTRIK',
    name: 'Elektrik Emniyet Raporu',
    items: [
      { key: 'ELEKTRIK_PK', name: 'Elektrik PK', path: '/operations-management/improvements/electrical/elektrik-pk', icon: Zap },
      { key: 'TOPRAKLAMA_PK', name: 'Topraklama PK', path: '/operations-management/improvements/electrical/topraklama-pk', icon: Zap },
      { key: 'PARATONER_PK', name: 'Paratoner PK', path: '/operations-management/improvements/electrical/paratoner-pk', icon: Zap },
      { key: 'ELEKTRIK_PANO_KONTROLLERI', name: 'Elektrik Pano Kontrolleri', path: '/operations-management/improvements/electrical/pano-kontrol', icon: Zap },
      { key: 'JENERATOR_PK', name: 'Jeneratör PK & Bakım', path: '/operations-management/improvements/electrical/jenerator-pk', icon: Zap },
      { key: 'TRAFO', name: 'Trafo PK & Bakım', path: '/operations-management/improvements/electrical/trafo', icon: Zap },
      { key: 'UPS', name: 'UPS PK & Bakım', path: '/operations-management/improvements/electrical/ups', icon: Zap },
    ],
  },
  {
    key: 'MEKANIK',
    name: 'Mekanik Emniyet Raporu',
    items: [
      { key: 'KAZANLAR', name: 'Kazanlar', path: '/operations-management/improvements/mechanical/kazanlar', icon: Wrench },
      { key: 'CHILLERLER', name: 'Chillerler', path: '/operations-management/improvements/mechanical/chillerler', icon: Wrench },
      { key: 'KLIMA_SANTRALLERI', name: 'Klima Santralleri', path: '/operations-management/improvements/mechanical/klima-santralleri', icon: Wrench },
    ],
  },
  {
    key: 'YANGIN',
    name: 'Yangın Sistemleri Emniyet Raporu',
    items: [
      { key: 'SULU_SONDURME_PK_BAKIM', name: 'Sulu Söndürme PK & Bakım', path: '/operations-management/improvements/fire-safety/sulu-sondurme-pk-bakim', icon: Flame },
      { key: 'GAZLI_SONDURME_PK_BAKIM', name: 'Gazlı Söndürme PK & Bakım', path: '/operations-management/improvements/fire-safety/gazli-sondurme-pk-bakim', icon: Flame },
      { key: 'BASINCLANDIRMA_PK_BAKIM', name: 'Basınçlandırma Sistemleri PK & Bakım', path: '/operations-management/improvements/fire-safety/basinclandirma-pk-bakim', icon: Flame },
      { key: 'YANGIN_ALGILAMA_PK_BAKIM', name: 'Yangın Algılama ve Uyarı Sistemleri PK & Bakım', path: '/operations-management/improvements/fire-safety/yangin-algilama-pk-bakim', icon: Flame },
    ],
  },
];

// Durum Dağılımı Renk Kodları (Tamamlandı Yeşil, Devam Ediyor Mavi, Başlamadı Kırmızı, İptal Edildi Gri)
const getDurumColor = (status: string): string => {
  switch (status) {
    case 'Tamamlandı':
      return '#16a34a'; // Yeşil
    case 'Devam Ediyor':
      return '#2563eb'; // Mavi
    case 'Başlamadı':
      return '#dc2626'; // Kırmızı
    case 'İptal Edildi':
      return '#64748b'; // Gri
    case 'Açık':
      return '#0284c7'; // Açık Mavi
    case 'Girilmemiş':
      return '#94a3b8'; // Açık Gri
    default:
      return '#94a3b8'; // Gri
  }
};

// Risk Dağılımı Renk Kodları (Kritik Koyu Kırmızı, Yüksek Kırmızı, Önemli Turuncu, Olası Sarı, Önemsiz Gri)
const getRiskColor = (risk: string): string => {
  switch (risk) {
    case 'Kritik':
      return '#991b1b'; // Koyu Kırmızı
    case 'Yüksek':
      return '#dc2626'; // Kırmızı
    case 'Önemli':
      return '#ea580c'; // Turuncu
    case 'Olası':
      return '#eab308'; // Sarı
    case 'Önemsiz':
      return '#64748b'; // Gri
    case 'Girilmemiş':
      return '#94a3b8'; // Açık Gri
    default:
      return '#94a3b8'; // Gri
  }
};



// Rapor Seçici Sekmeleri
const MODULE_NAV_ITEMS = [
  { key: 'ALL', label: 'Tüm Raporlar', path: '/operations-management/improvements', icon: LayoutDashboard },
  { key: 'DENETIMLER', label: 'Denetimler', path: '/operations-management/improvements/denetimler/dashboard', icon: ClipboardList, color: 'text-emerald-500' },
  { key: 'ELEKTRIK', label: 'Elektrik Emniyet', path: '/operations-management/improvements/electrical/dashboard', icon: Zap, color: 'text-amber-500' },
  { key: 'MEKANIK', label: 'Mekanik Emniyet', path: '/operations-management/improvements/mechanical/dashboard', icon: Wrench, color: 'text-cyan-500' },
  { key: 'YANGIN', label: 'Yangın Sistemleri', path: '/operations-management/improvements/fire-safety/dashboard', icon: Flame, color: 'text-rose-500' },
];

const MODULE_CONFIGS: Record<string, {
  title: string;
  subtitle: string;
  badge: string;
  icon: any;
  color: string;
  bg: string;
}> = {
  ALL: {
    title: 'İyileştirme ve Aksiyon Takip Dashboard',
    subtitle: 'Grup geneli denetimler ve tüm periyodik kontrol raporları genel konsolide analiz merkezi',
    badge: 'Tüm Raporlar Konsolide',
    icon: LayoutDashboard,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60',
  },
  DENETIMLER: {
    title: 'Denetimler Dashboard',
    subtitle: 'Hastane İç, Merkezi, Sağlık Bakanlığı ve İtfaiye Denetimleri konsolide bulgu ve aksiyon takip paneli',
    badge: 'Denetimler Modülü',
    icon: ClipboardList,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60',
  },
  ELEKTRIK: {
    title: 'Elektrik Emniyet Raporu Dashboard',
    subtitle: 'Elektrik PK, Topraklama, Paratoner, Jeneratör, Pano, Trafo ve UPS kontrolleri analiz ve takip paneli',
    badge: 'Elektrik Emniyeti',
    icon: Zap,
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60',
  },
  MEKANIK: {
    title: 'Mekanik Emniyet Raporu Dashboard',
    subtitle: 'Kazanlar, Chillerler ve Klima Santralleri periyodik kontrol ve bakım bulguları analiz paneli',
    badge: 'Mekanik Emniyeti',
    icon: Wrench,
    color: 'text-cyan-500',
    bg: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800/60',
  },
  YANGIN: {
    title: 'Yangın Sistemleri Emniyet Raporu Dashboard',
    subtitle: 'Sulu, Gazlı, Basınçlandırma ve Yangın Algılama sistemleri kontrol ve bakım bulguları analiz paneli',
    badge: 'Yangın Sistemleri',
    icon: Flame,
    color: 'text-rose-500',
    bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60',
  },
};

interface ImprovementsDashboardPageProps {
  moduleGroup?: 'ALL' | 'DENETIMLER' | 'ELEKTRIK' | 'MEKANIK' | 'YANGIN';
}

export const ImprovementsDashboardPage: React.FC<ImprovementsDashboardPageProps> = ({
  moduleGroup: propModuleGroup
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedFacilityId } = useOutletContext<{
    selectedFacilityId: string;
    facilities: FacilityOption[];
  }>();

  // Aktif modül grubunu prop'tan veya URL'den belirle
  const currentModule = ((): 'ALL' | 'DENETIMLER' | 'ELEKTRIK' | 'MEKANIK' | 'YANGIN' => {
    if (propModuleGroup) return propModuleGroup;
    const path = location.pathname.toLowerCase();
    if (path.includes('/denetimler')) return 'DENETIMLER';
    if (path.includes('/electrical')) return 'ELEKTRIK';
    if (path.includes('/mechanical')) return 'MEKANIK';
    if (path.includes('/fire-safety')) return 'YANGIN';
    return 'ALL';
  })();

  const currentConfig = MODULE_CONFIGS[currentModule] || MODULE_CONFIGS.ALL;
  const CurrentIcon = currentConfig.icon;

  const displayedTrackingGroups = currentModule === 'ALL'
    ? TRACKING_GROUPS
    : TRACKING_GROUPS.filter(g => g.key === currentModule);

  const displayedMatrixGroups = currentModule === 'ALL'
    ? MATRIX_GROUPS
    : MATRIX_GROUPS.filter(g => g.key === currentModule);

  const totalDisplayedSheets = displayedMatrixGroups.reduce((acc, g) => acc + g.items.length, 0);

  // Dashboard Stats
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Akordiyon durumları (DEFAULT OLARAK KAPALI)
  const [expandedHospitals, setExpandedHospitals] = useState<Record<string, boolean>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Dashboard İstatistiklerini Çek
  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const token = localStorage.getItem('token');
      const moduleParam = currentModule !== 'ALL' ? `&moduleGroup=${currentModule}` : '';
      const url = `${API}/api/operations/improvements/dashboard-stats?facilityId=${selectedFacilityId}${moduleParam}`;
      const res = await fetch(url, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedFacilityId, currentModule]);



  // Takip Alanları Akordiyon State (DEFAULT KAPALI)
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [collapsedMatrixGroups, setCollapsedMatrixGroups] = useState<Record<string, boolean>>({});

  const toggleMatrixGroup = (groupKey: string) => {
    setCollapsedMatrixGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Takip Alanları Dağılım Matrisi Sıralama State ve Fonksiyonları
  const [matrixSortKey, setMatrixSortKey] = useState<string>('');
  const [matrixSortDir, setMatrixSortDir] = useState<'asc' | 'desc'>('desc');

  const handleMatrixSort = (key: string) => {
    if (matrixSortKey === key) {
      if (matrixSortDir === 'desc') {
        setMatrixSortDir('asc');
      } else {
        setMatrixSortKey('');
      }
    } else {
      setMatrixSortKey(key);
      setMatrixSortDir(key === 'name' ? 'asc' : 'desc');
    }
  };

  const getSheetRowData = (sheetKey: string) => {
    const sh = stats?.sheets?.[sheetKey] || {
      total: 0,
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      openStatus: 0,
      open: 0,
      cancelled: 0,
      openHighCritical: 0,
      completionPercentage: 0,
    };

    const total = sh.total || 0;
    const completed = sh.completed || 0;
    const inProgress = sh.inProgress || 0;
    const notStarted = sh.notStarted || 0;
    const openStatus = sh.openStatus || 0;
    const cancelled = sh.cancelled || 0;
    const openHighCritical = sh.openHighCritical || 0;
    const active = total - cancelled;
    const ratio = active > 0 ? (completed / active) * 100 : 0;

    return {
      total,
      completed,
      inProgress,
      notStarted,
      openStatus,
      cancelled,
      openHighCritical,
      ratio,
    };
  };

  const getSortedMatrixItems = (items: MatrixSheetItem[]) => {
    if (!matrixSortKey) return items;
    return [...items].sort((a, b) => {
      const aData = getSheetRowData(a.key);
      const bData = getSheetRowData(b.key);
      if (matrixSortKey === 'name') {
        return matrixSortDir === 'asc' 
          ? a.name.localeCompare(b.name, 'tr') 
          : b.name.localeCompare(a.name, 'tr');
      }
      const aVal = (aData as any)[matrixSortKey] || 0;
      const bVal = (bData as any)[matrixSortKey] || 0;
      return matrixSortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
  };

  const renderSortIcon = (colKey: string) => {
    if (matrixSortKey !== colKey) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60 inline ml-1 shrink-0" />;
    }
    return matrixSortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-primary inline ml-1 font-bold shrink-0" />
    ) : (
      <ArrowDown className="w-3 h-3 text-primary inline ml-1 font-bold shrink-0" />
    );
  };

  // Hastane Karşılaştırması Akordiyon & Sıralama State (DEFAULT KAPALI)
  const [isHospMatrixOpen, setIsHospMatrixOpen] = useState(false);
  const [hospSortKey, setHospSortKey] = useState<string>('total');
  const [hospSortDir, setHospSortDir] = useState<'asc' | 'desc'>('desc');

  const handleHospSort = (key: string) => {
    if (hospSortKey === key) {
      setHospSortDir(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setHospSortKey(key);
      setHospSortDir(key === 'name' ? 'asc' : 'desc');
    }
  };

  const renderHospSortIcon = (colKey: string) => {
    if (hospSortKey !== colKey) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60 inline ml-1 shrink-0" />;
    }
    return hospSortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-primary inline ml-1 font-bold shrink-0" />
    ) : (
      <ArrowDown className="w-3 h-3 text-primary inline ml-1 font-bold shrink-0" />
    );
  };

  const getSortedHospitals = () => {
    const baseList = (stats?.hospitalComparison || stats?.hospitals || []).filter(h => (h.total || 0) > 0);
    return [...baseList].sort((a, b) => {
      if (hospSortKey === 'name') {
        return hospSortDir === 'asc' 
          ? (a.hospitalName || '').localeCompare(b.hospitalName || '', 'tr')
          : (b.hospitalName || '').localeCompare(a.hospitalName || '', 'tr');
      }
      const aVal = (a as any)[hospSortKey] ?? 0;
      const bVal = (b as any)[hospSortKey] ?? 0;
      return hospSortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
  };

  const handleHospitalSelect = (hospId: string) => {
    localStorage.setItem('activeFacilityId', hospId);
    window.dispatchEvent(new Event('facilityChanged'));
  };

  // Bir grubun bir hastanedeki konsolide istatistiklerini hesapla
  const getGroupStats = (sheets: Record<string, any>, items: Array<{ key: string }>) => {
    let total = 0;
    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;
    let cancelled = 0;

    items.forEach(it => {
      const s = sheets[it.key];
      if (s) {
        total += s.total || 0;
        completed += s.completed || 0;
        inProgress += s.inProgress || 0;
        notStarted += s.notStarted || 0;
        cancelled += s.cancelled || 0;
      }
    });

    const active = total - cancelled;
    const ratio = active > 0 ? ((completed / active) * 100).toFixed(2) : '0,00';

    return { total, completed, inProgress, notStarted, cancelled, active, ratio };
  };

  const summary = stats?.summary || {
    total: 0,
    completed: 0,
    inProgress: 0,
    notStarted: 0,
    cancelled: 0,
    open: 0,
    completionPercentage: 0,
    openCritical: 0,
    openHigh: 0,
    critical: 0,
    unspecifiedStatus: 0,
    missingAssignee: 0,
    risks: { critical: 0, high: 0, medium: 0, low: 0, negligible: 0 }
  };

  const getFilterTotalCount = (opt: RiskFilterOption): number => {
    if (opt.key === 'ALL') return summary.total;
    if (!opt.countKey) return 0;
    return summary.risks?.[opt.countKey] || 0;
  };

  const openCount = (summary.inProgress || 0) + (summary.notStarted || 0) + (stats?.statusDistribution?.['Açık'] || 0);
  const criticalCount = summary.risks?.critical || summary.critical || 0;
  const unspecifiedStatusCount = summary.unspecifiedStatus || (stats?.statusDistribution?.['Girilmemiş'] || 0) + (stats?.statusDistribution?.['Tanımsız durum'] || 0);
  const missingAssigneeCount = summary.missingAssignee || 0;
  const hasDurumEksik = unspecifiedStatusCount > 0;
  const hasWarning = unspecifiedStatusCount > 0 || missingAssigneeCount > 0;

  // 1. Durum Dağılımı Verisi (Görseldeki 7 Kategori)
  const durumCategories = [
    'Tamamlandı',
    'Devam Ediyor',
    'Başlamadı',
    'İptal Edildi',
    'Açık',
    'Girilmemiş',
    'Tanımsız durum'
  ];

  const durumData = durumCategories.map(cat => {
    let val = stats?.statusDistribution?.[cat];
    if (val === undefined) {
      if (cat === 'Tamamlandı') val = summary.completed;
      else if (cat === 'Devam Ediyor') val = summary.inProgress;
      else if (cat === 'Başlamadı') val = summary.notStarted;
      else if (cat === 'İptal Edildi') val = summary.cancelled;
      else if (cat === 'Açık') val = 0;
      else if (cat === 'Girilmemiş') val = 0;
      else val = 0;
    }
    return { name: cat, value: val };
  });

  // 2. Risk Dağılımı Verisi (Kritik, Yüksek, Önemli, Olası, Önemsiz)
  const riskCategories = [
    'Kritik',
    'Yüksek',
    'Önemli',
    'Olası',
    'Önemsiz',
    'Girilmemiş',
    'Tanımsız risk'
  ];

  const riskData = riskCategories.map(cat => {
    let val = stats?.riskDistribution?.[cat];
    if (val === undefined) {
      if (cat === 'Kritik') val = summary.risks.critical;
      else if (cat === 'Yüksek') val = summary.risks.high;
      else if (cat === 'Önemli') val = summary.risks.medium;
      else if (cat === 'Olası') val = summary.risks.low;
      else if (cat === 'Önemsiz') val = summary.risks.negligible;
      else val = 0;
    }
    return { name: cat, value: val };
  });

  const maxDurum = Math.max(...durumData.map(d => d.value), 10);
  const durumYMax = Math.ceil((maxDurum * 1.25) / 10) * 10;

  const maxRisk = Math.max(...riskData.map(d => d.value), 10);
  const riskYMax = Math.ceil((maxRisk * 1.25) / 10) * 10;



  return (
    <div className="space-y-6 max-w-[1700px] mx-auto pb-12 font-sans px-4 sm:px-6">
      
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. ÜST BAŞLIK, MODÜL SEÇİCİ SEKMELER VE YENİLE                     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${currentConfig.bg}`}>
            <CurrentIcon className={`w-6 h-6 ${currentConfig.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {currentConfig.title}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
                {currentConfig.badge}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {selectedFacilityId === 'ALL' ? (
                <span>{currentConfig.subtitle} (Grup Geneli)</span>
              ) : (
                <span>Seçili hastanenin {currentConfig.title.toLowerCase()} performansı</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedFacilityId !== 'ALL' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleHospitalSelect('ALL')}
              className="text-xs cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 mr-1.5" />
              Tüm Hastaneler (Grup Geneli)
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            className="self-start sm:self-auto text-xs shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingStats ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
        </div>
      </div>

      {/* 5'Lİ RAPOR SEÇİCİ SEKMELERİ (TÜMÜ / DENETİMLER / ELEKTRİK / MEKANİK / YANGIN) */}
      <div className="flex items-center gap-1.5 p-1.5 bg-muted/50 border border-border/80 rounded-xl overflow-x-auto select-none">
        {MODULE_NAV_ITEMS.map((item) => {
          const isActive = currentModule === item.key;
          const ItemIcon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                isActive 
                  ? "bg-background text-foreground shadow-xs border border-border/80" 
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              <ItemIcon className={cn("w-4 h-4 shrink-0", item.color || "text-blue-500")} />
              <span>{item.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>



          {/* 1. YÖNETİCİ İLERLEME VE SAHA OLGUNLUK KOKPİTİ */}
          <ExecutiveProgressCockpit
            stats={stats}
            mode="MAIN"
          />

          {/* 2. 7'Lİ KPI KARTLARI GRİDİ (KONSOLİDE RAPORLAR & AĞIRLIKLI İLERLEME) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3.5">
            {/* 1. Toplam Bulgu */}
            <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <div className="text-xs font-medium text-muted-foreground">Toplam bulgu</div>
              <div className="text-3xl font-bold tabular-nums text-foreground mt-1.5">{summary.total}</div>
              <div className="text-[11px] text-muted-foreground mt-2 truncate">Tüm takip alanları</div>
            </div>

            {/* 2. Açık Bulgu */}
            <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <div className="text-xs font-medium text-muted-foreground">Açık bulgu</div>
              <div className="text-3xl font-bold tabular-nums text-foreground mt-1.5">{openCount}</div>
              <div className="text-[11px] text-muted-foreground mt-2 truncate">Başlamadı, Devam, Açık</div>
            </div>

            {/* 3. Tamamlanan */}
            <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <div className="text-xs font-medium text-muted-foreground">Tamamlanan</div>
              <div className="text-3xl font-bold tabular-nums text-foreground mt-1.5">{summary.completed}</div>
              <div className="text-[11px] text-muted-foreground mt-2 truncate">Tamamlandı durumundakiler</div>
            </div>

            {/* 4. Tamamlanma Oranı */}
            <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <div className="text-xs font-medium text-muted-foreground">Tamamlanma</div>
              <div className="text-3xl font-bold tabular-nums text-foreground mt-1.5">
                {hasDurumEksik ? '—' : (summary.total - summary.cancelled > 0 ? `%${(((summary.completed) / (summary.total - summary.cancelled)) * 100).toFixed(1).replace('.', ',')}` : '—')}
              </div>
              <div className="text-[11px] text-muted-foreground mt-2 truncate">Kesin kapananlar (%100)</div>
            </div>

            {/* 5. Ağırlıklı İlerleme / Gerçekleşme (Devam Edenler Dahil) */}
            <div className="bg-card border-2 border-primary/30 bg-primary/5 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <div className="text-xs font-bold text-primary flex items-center justify-between">
                <span>Ağırlıklı İlerleme</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/20 text-primary tabular-nums font-semibold">Süreç Dahil</span>
              </div>
              <div className="text-3xl font-bold tabular-nums text-primary mt-1.5">
                {summary.total - summary.cancelled > 0 
                  ? `%${(summary.weightedCompletionPercentage ?? 0).toFixed(1).replace('.', ',')}` 
                  : '—'}
              </div>
              <div className="text-[11px] text-muted-foreground mt-2 truncate" title="Talep, ihale, sipariş, malzeme, saha adımları dahil">
                Talep, sipariş, saha adımları dahil
              </div>
            </div>

            {/* 6. Kritik Bulgu */}
            <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <div className="text-xs font-medium text-muted-foreground">Kritik bulgu</div>
              <div className="text-3xl font-bold tabular-nums text-[#991b1b] dark:text-red-400 mt-1.5">
                {criticalCount}
              </div>
              <div className="text-[11px] text-muted-foreground mt-2 truncate">Tamamlananlar dahil</div>
            </div>

            {/* 7. Durumu Belirsiz */}
            <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <div className="text-xs font-medium text-muted-foreground">Durumu belirsiz</div>
              <div className="text-3xl font-bold tabular-nums text-[#d97706] dark:text-amber-400 mt-1.5">
                {unspecifiedStatusCount}
              </div>
              <div className="text-[11px] text-muted-foreground mt-2 truncate">Boş veya tanımsız durum</div>
            </div>
          </div>

          {/* 3. UYARI / BİLGİLENDİRME BANTI */}
          {hasWarning && (
            <div className="bg-[#fff9eb] border border-[#fde68a] dark:bg-amber-950/30 dark:border-amber-800/50 rounded-xl p-3.5 px-4 text-xs text-[#92400e] dark:text-amber-300">
              <span>
                {unspecifiedStatusCount > 0 ? `${unspecifiedStatusCount} bulgunun durumu boş veya tanımsız; tamamlanma oranı hesaplanmadı.` : ''}
                {unspecifiedStatusCount > 0 && missingAssigneeCount > 0 ? ' ' : ''}
                {missingAssigneeCount > 0 ? `${missingAssigneeCount} bulgunun sorumlusu belirtilmemiş.` : ''}
              </span>
            </div>
          )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. DURUM VE RİSK DAĞILIMI GRAFİKLERİ (KULLANICI GÖRSELİ STANDARDI)  */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        
        {/* Sol Grafik: Durum Dağılımı */}
        <div className="bg-card text-card-foreground border border-border/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            {/* Kart Başlığı */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground tracking-tight">
                  Durum Dağılımı
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tespitlerin takip durumu
                </p>
              </div>
            </div>

            {/* Recharts Bar Chart */}
            <div className="w-full min-w-0 h-72">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={288}>
                <BarChart
                  data={durumData}
                  margin={{ top: 24, right: 12, left: -16, bottom: 20 }}
                  barSize={32}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" opacity={0.6} />
                  <XAxis 
                    dataKey="name" 
                    tickLine={false} 
                    axisLine={{ stroke: 'currentColor', className: 'text-slate-200 dark:text-slate-800' }}
                    tick={{ fontSize: 11, fill: 'currentColor', className: 'text-slate-500 dark:text-slate-400' }}
                    interval={0}
                  />
                  <YAxis 
                    domain={[0, durumYMax]} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fontSize: 11, fill: 'currentColor', className: 'text-slate-400 dark:text-slate-500' }}
                  />
                  <RechartsTooltip
                    cursor={{ fill: 'currentColor', className: 'text-slate-100 dark:text-slate-800/40' }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      color: 'hsl(var(--foreground))',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[4, 4, 0, 0]}
                  >
                    {durumData.map((entry, index) => (
                      <Cell key={`cell-durum-${index}`} fill={getDurumColor(entry.name)} />
                    ))}
                    <LabelList 
                      dataKey="value" 
                      position="top" 
                      content={(props: any) => {
                        const { x, y, width, value, index } = props;
                        if (value === undefined || value === null) return null;
                        const color = getDurumColor(durumData[index]?.name || '');
                        return (
                          <text
                            x={Number(x) + Number(width) / 2}
                            y={Number(y) - 6}
                            fill={color}
                            textAnchor="middle"
                            fontSize={12}
                            fontWeight={700}
                          >
                            {value}
                          </text>
                        );
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Alt Lejant / Sayı Çubuğu (Renkli Noktalar ile) */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground pt-3 border-t border-border/50 mt-2 gap-y-1.5">
            {durumData.map(d => (
              <span key={d.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: getDurumColor(d.name) }} />
                <span>{d.name}</span>
                <strong className="text-foreground tabular-nums font-bold">{d.value}</strong>
              </span>
            ))}
          </div>
        </div>

        {/* Sağ Grafik: Risk Dağılımı */}
        <div className="bg-card text-card-foreground border border-border/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            {/* Kart Başlığı */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground tracking-tight">
                  Risk Dağılımı
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Kaydedilmiş risk seviyeleri
                </p>
              </div>
            </div>

            {/* Recharts Bar Chart */}
            <div className="w-full min-w-0 h-72">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={288}>
                <BarChart
                  data={riskData}
                  margin={{ top: 24, right: 12, left: -16, bottom: 20 }}
                  barSize={32}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" opacity={0.6} />
                  <XAxis 
                    dataKey="name" 
                    tickLine={false} 
                    axisLine={{ stroke: 'currentColor', className: 'text-slate-200 dark:text-slate-800' }}
                    tick={{ fontSize: 11, fill: 'currentColor', className: 'text-slate-500 dark:text-slate-400' }}
                    interval={0}
                  />
                  <YAxis 
                    domain={[0, riskYMax]} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fontSize: 11, fill: 'currentColor', className: 'text-slate-400 dark:text-slate-500' }}
                  />
                  <RechartsTooltip
                    cursor={{ fill: 'currentColor', className: 'text-slate-100 dark:text-slate-800/40' }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      color: 'hsl(var(--foreground))',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[4, 4, 0, 0]}
                  >
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-risk-${index}`} fill={getRiskColor(entry.name)} />
                    ))}
                    <LabelList 
                      dataKey="value" 
                      position="top" 
                      content={(props: any) => {
                        const { x, y, width, value, index } = props;
                        if (value === undefined || value === null) return null;
                        const color = getRiskColor(riskData[index]?.name || '');
                        return (
                          <text
                            x={Number(x) + Number(width) / 2}
                            y={Number(y) - 6}
                            fill={color}
                            textAnchor="middle"
                            fontSize={12}
                            fontWeight={700}
                          >
                            {value}
                          </text>
                        );
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Alt Lejant / Sayı Çubuğu (Renkli Noktalar ile) */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground pt-3 border-t border-border/50 mt-2 gap-y-1.5">
            {riskData.map(r => (
              <span key={r.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: getRiskColor(r.name) }} />
                <span>{r.name}</span>
                <strong className="text-foreground tabular-nums font-bold">{r.value}</strong>
              </span>
            ))}
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 5. TAKİP ALANLARI DAĞILIM MATRİSİ (KULLANICI GÖRSELİ STANDARDI)     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-card text-card-foreground border border-border/80 rounded-2xl shadow-xs overflow-hidden">
        
        {/* Kart Başlığı ve Bilgi Rozeti (Tıklanabilir Akordiyon) */}
        <div 
          onClick={() => setIsMatrixOpen(!isMatrixOpen)}
          className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-muted/30 select-none transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
                  Takip Alanları
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {totalDisplayedSheets} takip alanı
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Takip alanları denetim ve periyodik kontrol bulguları dağılımı
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <span className="text-xs tabular-nums font-bold text-muted-foreground hidden sm:inline">
              {summary.total} toplam bulgu
            </span>
            <div className="w-8 h-8 rounded-lg border flex items-center justify-center text-muted-foreground bg-background group-hover:bg-muted transition-colors">
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isMatrixOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </div>

        {/* Dağılım Matrisi Tablosu (DEFAULT OLARAK KAPALI) */}
        {isMatrixOpen && (
          <div className="overflow-x-auto border-t border-border/70 animate-in slide-in-from-top-2 duration-150">
            <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/70 bg-muted/20 text-muted-foreground text-xs select-none">
                <th 
                  onClick={() => handleMatrixSort('name')}
                  className="py-3 px-4 text-left font-semibold cursor-pointer hover:text-foreground transition-colors min-w-[240px]"
                >
                  <span className="inline-flex items-center gap-1.5">
                    Takip alanı
                    {renderSortIcon('name')}
                  </span>
                </th>
                <th 
                  onClick={() => handleMatrixSort('total')}
                  className="py-3 px-3 text-center font-semibold cursor-pointer hover:text-foreground transition-colors"
                >
                  <span className="inline-flex items-center justify-center gap-1">
                    Toplam
                    {renderSortIcon('total')}
                  </span>
                </th>
                <th 
                  onClick={() => handleMatrixSort('completed')}
                  className="py-3 px-3 text-center font-semibold cursor-pointer hover:text-foreground transition-colors"
                >
                  <span className="inline-flex items-center justify-center gap-1">
                    Tamamlandı
                    {renderSortIcon('completed')}
                  </span>
                </th>
                <th 
                  onClick={() => handleMatrixSort('inProgress')}
                  className="py-3 px-3 text-center font-semibold cursor-pointer hover:text-foreground transition-colors"
                >
                  <span className="inline-flex items-center justify-center gap-1">
                    Devam ediyor
                    {renderSortIcon('inProgress')}
                  </span>
                </th>
                <th 
                  onClick={() => handleMatrixSort('notStarted')}
                  className="py-3 px-3 text-center font-semibold cursor-pointer hover:text-foreground transition-colors"
                >
                  <span className="inline-flex items-center justify-center gap-1">
                    Başlamadı
                    {renderSortIcon('notStarted')}
                  </span>
                </th>
                <th 
                  onClick={() => handleMatrixSort('openStatus')}
                  className="py-3 px-3 text-center font-semibold cursor-pointer hover:text-foreground transition-colors"
                >
                  <span className="inline-flex items-center justify-center gap-1">
                    Açık
                    {renderSortIcon('openStatus')}
                  </span>
                </th>
                <th 
                  onClick={() => handleMatrixSort('cancelled')}
                  className="py-3 px-3 text-center font-semibold cursor-pointer hover:text-foreground transition-colors"
                >
                  <span className="inline-flex items-center justify-center gap-1">
                    İptal
                    {renderSortIcon('cancelled')}
                  </span>
                </th>
                <th 
                  onClick={() => handleMatrixSort('openHighCritical')}
                  className="py-3 px-3 text-center font-semibold cursor-pointer hover:text-foreground transition-colors"
                >
                  <span className="inline-flex items-center justify-center gap-1">
                    Yüksek/kritik kapanmamış
                    {renderSortIcon('openHighCritical')}
                  </span>
                </th>
                <th 
                  onClick={() => handleMatrixSort('ratio')}
                  className="py-3 px-4 text-right font-semibold cursor-pointer hover:text-foreground transition-colors"
                >
                  <span className="inline-flex items-center justify-end gap-1">
                    Tamamlanma
                    {renderSortIcon('ratio')}
                  </span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/40">
              {displayedMatrixGroups.map(group => {
                const sortedItems = getSortedMatrixItems(group.items);
                const groupTotal = group.items.reduce((acc, it) => acc + (stats?.sheets?.[it.key]?.total || 0), 0);

                return (
                  <React.Fragment key={group.key}>
                    {/* Grup Ara Başlık Satırı (Açılır / Kapanır) */}
                    <tr 
                      onClick={() => toggleMatrixGroup(group.key)}
                      className="bg-slate-50/80 dark:bg-slate-800/50 border-t border-b border-border/70 cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-800/70 select-none transition-colors"
                    >
                      <td colSpan={5} className="py-2.5 px-4 text-xs font-bold text-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-2">
                          <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${collapsedMatrixGroups[group.key] ? '-rotate-90' : 'rotate-0'}`} />
                          <span>{group.name}</span>
                        </div>
                      </td>
                      <td colSpan={4} className="py-2.5 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 text-right tabular-nums">
                        {groupTotal} bulgu
                      </td>
                    </tr>

                    {/* Grup Altındaki Takip Alanı Satırları */}
                    {!collapsedMatrixGroups[group.key] && sortedItems.map(row => {
                      const data = getSheetRowData(row.key);
                      const RowIcon = row.icon;

                      return (
                        <tr 
                          key={row.key}
                          onClick={() => navigate(row.path)}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <RowIcon className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors shrink-0" />
                              <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                                {row.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center text-xs tabular-nums font-bold text-foreground">
                            {data.total}
                          </td>
                          <td className="py-3 px-3 text-center text-xs tabular-nums text-slate-600 dark:text-slate-300">
                            {data.completed}
                          </td>
                          <td className="py-3 px-3 text-center text-xs tabular-nums text-slate-600 dark:text-slate-300">
                            {data.inProgress}
                          </td>
                          <td className="py-3 px-3 text-center text-xs tabular-nums text-slate-600 dark:text-slate-300">
                            {data.notStarted}
                          </td>
                          <td className="py-3 px-3 text-center text-xs tabular-nums text-slate-600 dark:text-slate-300">
                            {data.openStatus}
                          </td>
                          <td className="py-3 px-3 text-center text-xs tabular-nums text-slate-600 dark:text-slate-300">
                            {data.cancelled}
                          </td>
                          <td className="py-3 px-3 text-center text-xs tabular-nums font-semibold text-red-600 dark:text-red-400">
                            {data.openHighCritical}
                          </td>
                          <td className="py-3 px-4 text-right text-xs tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                            {data.total === 0 ? '—' : `%${data.ratio.toFixed(2).replace('.', ',')}`}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 6. HASTANE KARŞILAŞTIRMASI MATRİSİ (SİSTEMDE VERİSİ OLAN HASTANELER)*/}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-card text-card-foreground border border-border/80 rounded-2xl shadow-xs overflow-hidden">
        
        {/* Kart Başlığı ve Bilgi Rozeti (Tıklanabilir Akordiyon) */}
        <div 
          onClick={() => setIsHospMatrixOpen(!isHospMatrixOpen)}
          className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-muted/30 select-none transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
                  Hastane Karşılaştırması
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {getSortedHospitals().length} hastane
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {currentModule === 'ALL'
                  ? 'Hastane seçiminden bağımsız, grup genelindeki kayıtlar'
                  : `${currentConfig.title} kapsamında grup genelindeki kayıtlar`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="w-8 h-8 rounded-lg border flex items-center justify-center text-muted-foreground bg-background group-hover:bg-muted transition-colors">
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isHospMatrixOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </div>

        {/* Hastane Karşılaştırması Tablosu */}
        {isHospMatrixOpen && (
          <div className="border-t border-border/70 animate-in slide-in-from-top-2 duration-150">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-background/95 backdrop-blur-xs z-10">
                  <tr className="border-b border-border/70 bg-muted/20 text-muted-foreground text-xs select-none">
                    <th 
                      onClick={() => handleHospSort('name')}
                      className="py-3 px-4 text-left font-semibold cursor-pointer hover:text-foreground transition-colors min-w-[220px]"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        Hastane
                        {renderHospSortIcon('name')}
                      </span>
                    </th>
                    <th 
                      onClick={() => handleHospSort('total')}
                      className="py-3 px-3 text-center font-semibold cursor-pointer hover:text-foreground transition-colors min-w-[80px]"
                    >
                      <span className="inline-flex items-center justify-center gap-1">
                        Toplam
                        {renderHospSortIcon('total')}
                      </span>
                    </th>
                    <th 
                      onClick={() => handleHospSort('completed')}
                      className="py-3 px-3 text-center font-semibold cursor-pointer hover:text-foreground transition-colors min-w-[95px]"
                    >
                      <span className="inline-flex items-center justify-center gap-1">
                        Tamamlandı
                        {renderHospSortIcon('completed')}
                      </span>
                    </th>
                    <th 
                      onClick={() => handleHospSort('inProgress')}
                      className="py-3 px-3 text-center font-semibold cursor-pointer hover:text-foreground transition-colors min-w-[105px]"
                    >
                      <span className="inline-flex items-center justify-center gap-1">
                        Devam ediyor
                        {renderHospSortIcon('inProgress')}
                      </span>
                    </th>
                    <th 
                      onClick={() => handleHospSort('notStarted')}
                      className="py-3 px-3 text-center font-semibold cursor-pointer hover:text-foreground transition-colors min-w-[95px]"
                    >
                      <span className="inline-flex items-center justify-center gap-1">
                        Başlamadı
                        {renderHospSortIcon('notStarted')}
                      </span>
                    </th>
                    <th 
                      onClick={() => handleHospSort('openStatus')}
                      className="py-3 px-3 text-center font-semibold cursor-pointer hover:text-foreground transition-colors min-w-[80px]"
                    >
                      <span className="inline-flex items-center justify-center gap-1">
                        Açık
                        {renderHospSortIcon('openStatus')}
                      </span>
                    </th>
                    <th 
                      onClick={() => handleHospSort('cancelled')}
                      className="py-3 px-3 text-center font-semibold cursor-pointer hover:text-foreground transition-colors min-w-[80px]"
                    >
                      <span className="inline-flex items-center justify-center gap-1">
                        İptal
                        {renderHospSortIcon('cancelled')}
                      </span>
                    </th>
                    <th 
                      onClick={() => handleHospSort('openHighCritical')}
                      className="py-3 px-3 text-center font-semibold cursor-pointer hover:text-foreground transition-colors min-w-[170px]"
                    >
                      <span className="inline-flex items-center justify-center gap-1">
                        Yüksek/kritik kapanmamış
                        {renderHospSortIcon('openHighCritical')}
                      </span>
                    </th>
                    <th 
                      onClick={() => handleHospSort('completionPercentage')}
                      className="py-3 px-4 text-right font-semibold cursor-pointer hover:text-foreground transition-colors min-w-[110px]"
                    >
                      <span className="inline-flex items-center justify-end gap-1">
                        Tamamlanma
                        {renderHospSortIcon('completionPercentage')}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 text-xs">
                  {getSortedHospitals().length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-muted-foreground">
                        Sistemde kayıtlı veri bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    getSortedHospitals().map((hosp) => {
                      const isCurrentActive = selectedFacilityId === hosp.hospitalId;
                      const activeTotal = (hosp.total || 0) - (hosp.cancelled || 0);
                      const ratio = hosp.completionPercentage !== undefined 
                        ? hosp.completionPercentage 
                        : (activeTotal > 0 ? ((hosp.completed || 0) / activeTotal) * 100 : 0);

                      return (
                        <tr 
                          key={hosp.hospitalId}
                          onClick={() => handleHospitalSelect(hosp.hospitalId)}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group ${
                            isCurrentActive ? 'bg-primary/5 dark:bg-primary/10 font-medium' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Building2 className={`w-4 h-4 shrink-0 transition-colors ${
                                isCurrentActive ? 'text-primary' : 'text-slate-400 group-hover:text-primary'
                              }`} />
                              <span className={`text-xs font-semibold transition-colors ${
                                isCurrentActive ? 'text-primary' : 'text-foreground group-hover:text-primary'
                              }`}>
                                {hosp.hospitalName}
                              </span>
                              {isCurrentActive && (
                                <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary font-bold">
                                  Seçili
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center text-xs tabular-nums font-bold text-foreground">
                            {hosp.total || 0}
                          </td>
                          <td className="py-3 px-3 text-center text-xs tabular-nums text-slate-600 dark:text-slate-300">
                            {hosp.completed || 0}
                          </td>
                          <td className="py-3 px-3 text-center text-xs tabular-nums text-slate-600 dark:text-slate-300">
                            {hosp.inProgress || 0}
                          </td>
                          <td className="py-3 px-3 text-center text-xs tabular-nums text-slate-600 dark:text-slate-300">
                            {hosp.notStarted || 0}
                          </td>
                          <td className="py-3 px-3 text-center text-xs tabular-nums text-slate-600 dark:text-slate-300">
                            {hosp.openStatus || 0}
                          </td>
                          <td className="py-3 px-3 text-center text-xs tabular-nums text-slate-600 dark:text-slate-300">
                            {hosp.cancelled || 0}
                          </td>
                          <td className="py-3 px-3 text-center text-xs tabular-nums font-semibold text-red-600 dark:text-red-400">
                            {hosp.openHighCritical || 0}
                          </td>
                          <td className="py-3 px-4 text-right text-xs tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                            {hosp.total === 0 ? '—' : `%${ratio.toFixed(2).replace('.', ',')}`}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Alt Bilgi Açıklaması (Kullanıcı Ekran Görüntüsü ile Birebir) */}
            <div className="p-3.5 px-4 sm:px-6 bg-slate-50/50 dark:bg-slate-900/40 border-t border-border/70 text-xs text-muted-foreground select-none">
              Sıfır kayıt, hastanede uygunsuzluk bulunmadığını göstermez. Yalnızca bu dosyadaki kayıt sayısını ifade eder.
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Filter,
  Search,
  ExternalLink,
  ChevronDown,
  Layers,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  ListOrdered,
  ArrowUpDown,
  RotateCcw,
  Zap,
  Flame,
  Wrench,
  FileCheck2,
  ChevronRight,
  Eye,
  X,
  Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { ImprovementTable } from './ImprovementTable';
import { AuditProgressTrendChart } from './AuditProgressTrendChart';
import type { ImprovementRecord } from './types';

const API = import.meta.env.VITE_API_URL || '';

interface FacilityOption {
  id: string;
  name: string;
  shortName?: string;
  code?: string;
}

interface HospitalStat {
  hospitalId: string;
  hospitalName: string;
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  open: number;
  openHighCritical: number;
  completionPercentage: number;
  weightedCompletionPercentage: number;
  risks?: {
    critical?: number;
    high?: number;
    medium?: number;
    low?: number;
    negligible?: number;
  };
  sheets?: Record<string, any>;
}

interface DashboardStats {
  summary: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    cancelled: number;
    completionPercentage: number;
    weightedCompletionPercentage: number;
    openHighCritical: number;
    risks?: {
      critical?: number;
      high?: number;
      medium?: number;
      low?: number;
      negligible?: number;
    };
  };
  hospitals: HospitalStat[];
}

// 4 Ana Takip Grubu ve Alt Sekmeleri
const TRACKING_GROUPS = [
  {
    key: 'DENETIMLER',
    name: 'Denetim Raporları',
    icon: FileCheck2,
    accentColor: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60',
    barColor: 'bg-indigo-600',
    badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    items: [
      { key: 'HASTANE_IC_DENETIMLERI', name: 'Hastane İç Denetimleri', path: '/operations-management/improvements/denetimler/hastane-ic', icon: FileCheck2 },
      { key: 'MERKEZI_DENETIMLER', name: 'Merkezi Denetimler', path: '/operations-management/improvements/denetimler/merkezi', icon: FileCheck2 },
      { key: 'SAGLIK_DENETIMLERI', name: 'Sağlık Bakanlığı Denetimleri', path: '/operations-management/improvements/denetimler/saglik-bakanligi', icon: FileCheck2 },
      { key: 'ITFAIYE_YANGIN_DENETIMLERI', name: 'İtfaiye Yangın Denetimleri', path: '/operations-management/improvements/denetimler/itfaiye-yangin', icon: Flame },
    ],
  },
  {
    key: 'ELEKTRIK',
    name: 'Elektrik Sistemleri Emniyet Raporu',
    icon: Zap,
    accentColor: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60',
    barColor: 'bg-amber-500',
    badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    items: [
      { key: 'ELEKTRIK_PK', name: 'Elektrik İç Tesisat Uygunluk Belgesi (PK)', path: '/operations-management/improvements/electrical/elektrik-pk', icon: Zap },
      { key: 'TOPRAKLAMA_PK', name: 'Topraklama Ölçüm Raporu (PK)', path: '/operations-management/improvements/electrical/topraklama-pk', icon: Zap },
      { key: 'PARATONER_PK', name: 'Paratoner Ölçüm Raporu (PK)', path: '/operations-management/improvements/electrical/paratoner-pk', icon: Zap },
      { key: 'JENERATOR_PK', name: 'Jeneratör Test & Kontrol Raporu (PK)', path: '/operations-management/improvements/electrical/jenerator-pk', icon: Zap },
      { key: 'ELEKTRIK_PANO_KONTROLLERI', name: 'Elektrik Dağıtım Panoları Kontrolü', path: '/operations-management/improvements/electrical/elektrik-pano-kontrolleri', icon: Zap },
      { key: 'TRAFO', name: 'Trafo Merkezi Bakım ve Kontrol', path: '/operations-management/improvements/electrical/trafo', icon: Zap },
      { key: 'UPS', name: 'Kesintisiz Güç Kaynağı (UPS) Sistemleri', path: '/operations-management/improvements/electrical/ups', icon: Zap },
    ],
  },
  {
    key: 'MEKANIK',
    name: 'Mekanik Sistemler Emniyet Raporu',
    icon: Wrench,
    accentColor: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800/60',
    barColor: 'bg-cyan-600',
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
    barColor: 'bg-red-600',
    badgeColor: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    items: [
      { key: 'SULU_SONDURME_PK_BAKIM', name: 'Sulu Söndürme PK & Bakım', path: '/operations-management/improvements/fire-safety/sulu-sondurme-pk-bakim', icon: Flame },
      { key: 'GAZLI_SONDURME_PK_BAKIM', name: 'Gazlı Söndürme PK & Bakım', path: '/operations-management/improvements/fire-safety/gazli-sondurme-pk-bakim', icon: Flame },
      { key: 'BASINCLANDIRMA_PK_BAKIM', name: 'Basınçlandırma Sistemleri PK & Bakım', path: '/operations-management/improvements/fire-safety/basinclandirma-pk-bakim', icon: Flame },
      { key: 'YANGIN_ALGILAMA_PK_BAKIM', name: 'Yangın Algılama ve Uyarı Sistemleri PK & Bakım', path: '/operations-management/improvements/fire-safety/yangin-algilama-pk-bakim', icon: Flame },
    ],
  },
];

const MODULE_SHEET_MAP: Record<string, string[]> = {
  DENETIMLER: ['HASTANE_IC_DENETIMLERI', 'MERKEZI_DENETIMLER', 'SAGLIK_DENETIMLERI', 'ITFAIYE_YANGIN_DENETIMLERI', 'DENETIMLER'],
  ELEKTRIK: ['ELEKTRIK_PK', 'TOPRAKLAMA_PK', 'PARATONER_PK', 'JENERATOR_PK', 'ELEKTRIK_PANO_KONTROLLERI', 'TRAFO', 'UPS'],
  MEKANIK: ['KAZANLAR', 'CHILLERLER', 'KLIMA_SANTRALLERI'],
  YANGIN: ['SULU_SONDURME_PK_BAKIM', 'GAZLI_SONDURME_PK_BAKIM', 'BASINCLANDIRMA_PK_BAKIM', 'YANGIN_ALGILAMA_PK_BAKIM'],
};

// Sekme etiketi çözücü
const getSheetDisplayName = (sheetKey: string): string => {
  for (const group of TRACKING_GROUPS) {
    if (group.key === sheetKey) return group.name;
    const found = group.items.find(i => i.key === sheetKey);
    if (found) return found.name;
  }
  return sheetKey;
};

// Risk Filtre Butonları Yapılandırması
interface RiskOption {
  key: string;
  label: string;
  dotColor: string;
  activeClass: string;
  badgeClass: string;
}

const RISK_FILTER_OPTIONS: RiskOption[] = [
  {
    key: 'ALL',
    label: 'Tüm Riskler (Toplam)',
    dotColor: '#3b82f6',
    activeClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/40 ring-1 ring-blue-500/30',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
  },
  {
    key: 'Kritik',
    label: 'Kritik',
    dotColor: '#991b1b',
    activeClass: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/40 ring-1 ring-red-500/30',
    badgeClass: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
  },
  {
    key: 'Yüksek',
    label: 'Yüksek',
    dotColor: '#e11d48',
    activeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40 ring-1 ring-rose-500/30',
    badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
  },
  {
    key: 'Önemli',
    label: 'Önemli',
    dotColor: '#d97706',
    activeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 ring-1 ring-amber-500/30',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  },
  {
    key: 'Olası',
    label: 'Olası',
    dotColor: '#ca8a04',
    activeClass: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-500/40 ring-1 ring-yellow-500/30',
    badgeClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300',
  },
  {
    key: 'Önemsiz',
    label: 'Önemsiz',
    dotColor: '#64748b',
    activeClass: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/40 ring-1 ring-slate-500/30',
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-950/50 dark:text-slate-300',
  },
];

export const ExecutiveSummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const tableSectionRef = useRef<HTMLDivElement>(null);

  // Outlet context ile tesis listesi ve aktif tesis
  const outletCtx = useOutletContext<{
    selectedFacilityId?: string;
    setSelectedFacilityId?: (id: string) => void;
    facilities?: FacilityOption[];
  }>() || {};

  // Kullanıcı Yetki & Tesis Kontrolü
  const { user } = useAuth();
  const hasAdminAccess = !!(
    user?.isAdmin || 
    user?.isManagement || 
    user?.roles?.includes('admin') || 
    user?.roles?.includes('management')
  );
  const userFacilities = useMemo(() => user?.facilities || [], [user?.facilities]);

  const [selectedFacilityId, setSelectedFacilityIdState] = useState<string>(() => {
    return outletCtx.selectedFacilityId || localStorage.getItem('activeFacilityId') || 'ALL';
  });

  // KULLANICI İSTEĞİ: Çoklu Tesis Seçimi (Tüm Tesislerin Dağılım Özeti'nden birden fazla tesis seçilebilir)
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('exec_summary_selected_facilities');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    const single = outletCtx.selectedFacilityId || localStorage.getItem('activeFacilityId');
    if (single && single !== 'ALL') return [single];
    return [];
  });

  useEffect(() => {
    localStorage.setItem('exec_summary_selected_facilities', JSON.stringify(selectedFacilityIds));
    if (selectedFacilityIds.length === 1) {
      setSelectedFacilityIdState(selectedFacilityIds[0]);
      localStorage.setItem('activeFacilityId', selectedFacilityIds[0]);
    } else {
      setSelectedFacilityIdState('ALL');
      if (selectedFacilityIds.length === 0) {
        localStorage.removeItem('activeFacilityId');
      }
    }
  }, [selectedFacilityIds]);

  const facilities = outletCtx.facilities || [];

  // Dashboard Stats
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Tablo Kayıtları (Tüm kayıtlar çekilir, yetkiye göre süzülür)
  const [rawRecords, setRawRecords] = useState<ImprovementRecord[]>([]);

  // Kullanıcı yetkisine göre yetkili kayıtlar
  const records = useMemo(() => {
    if (hasAdminAccess || userFacilities.length === 0) return rawRecords;
    return rawRecords.filter(r => userFacilities.includes(r.facilityId));
  }, [rawRecords, hasAdminAccess, userFacilities]);
  const [loadingRecords, setLoadingRecords] = useState(true);

  // Akordiyon durumları (Hastaneler ve Takip Grubu Barları)
  const [expandedHospitals, setExpandedHospitals] = useState<Record<string, boolean>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // ─────────────────────────────────────────────────────────────────────────
  // KULLANICI İSTEĞİ:
  // 1. "Default hazırlanınca Kritik ile gelir."
  // 2. "Filitreleri akılda tutmalı."
  // ─────────────────────────────────────────────────────────────────────────
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>(() => {
    return localStorage.getItem('exec_summary_risk_filter') || 'Kritik';
  });

  // KULLANICI İSTEĞİ: Çoklu Durum Filtresi (Başlamadı, Devam Ediyor, Tamamlandı seçilebilir)
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('exec_summary_status_filter');
      if (saved) {
        if (saved === 'ALL') return [];
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
        if (typeof parsed === 'string' && parsed !== 'ALL') return [parsed];
      }
    } catch {
      const savedStr = localStorage.getItem('exec_summary_status_filter');
      if (savedStr && savedStr !== 'ALL') return [savedStr];
    }
    return [];
  });

  // KULLANICI İSTEĞİ: Tesisler Özeti Akordiyonu (Varsayılan olarak açık)
  const [isFacilitySummaryOpen, setIsFacilitySummaryOpen] = useState<boolean>(true);

  // KULLANICI İSTEĞİ: Trend Grafiği (Default KAPALI, istendiğinde açılır)
  const [isTrendChartOpen, setIsTrendChartOpen] = useState<boolean>(false);

  // KULLANICI İSTEĞİ: Hastanelere Göre Bulgu Dağılımı Bölümü (Katlanabilir, DEFAULT KAPALI GELSİN)
  const [isHospitalsListOpen, setIsHospitalsListOpen] = useState<boolean>(false);

  // Çoklu Tesis Seçimi Fonksiyonları
  const toggleFacilitySelect = (hospitalId: string) => {
    setSelectedFacilityIds(prev => {
      if (prev.includes(hospitalId)) {
        return prev.filter(id => id !== hospitalId);
      } else {
        return [...prev, hospitalId];
      }
    });
  };

  const selectAllFacilities = () => {
    setSelectedFacilityIds(allAuthorizedHospitals.map(h => h.hospitalId));
  };

  const clearFacilitySelection = () => {
    setSelectedFacilityIds([]);
    setSelectedFacilityIdState('ALL');
    localStorage.removeItem('activeFacilityId');
    localStorage.removeItem('exec_summary_selected_facilities');
    if (outletCtx.setSelectedFacilityId) {
      outletCtx.setSelectedFacilityId('ALL');
    }
  };

  // Seçili Denetim Başlığı / Takip Alanı Filtresi (ALL, DENETIMLER, ELEKTRIK_PK vb.)
  const [selectedSheetFilter, setSelectedSheetFilter] = useState<string>(() => {
    return localStorage.getItem('exec_summary_sheet_filter') || 'ALL';
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'risk' | 'total' | 'progress' | 'name'>('risk');
  const [onlyWithSelectedRisk, setOnlyWithSelectedRisk] = useState<boolean>(false);

  // Filtreleri localStorage'a kaydet (Akılda tut)
  useEffect(() => {
    localStorage.setItem('exec_summary_risk_filter', selectedRiskFilter);
  }, [selectedRiskFilter]);

  useEffect(() => {
    localStorage.setItem('exec_summary_sheet_filter', selectedSheetFilter);
  }, [selectedSheetFilter]);

  useEffect(() => {
    localStorage.setItem('exec_summary_status_filter', JSON.stringify(selectedStatuses));
  }, [selectedStatuses]);

  // Durum filtresi aktif mi? (0 veya 3'ü de seçiliyse hepsi gösterilir)
  const hasStatusFilter = selectedStatuses.length > 0 && selectedStatuses.length < 3;

  // Çoklu durum geçişi (Toggle)
  const toggleStatusFilter = (targetRisk: string, status: string) => {
    if (selectedRiskFilter !== targetRisk) {
      setSelectedRiskFilter(targetRisk);
      setSelectedStatuses([status]);
      return;
    }
    if (selectedStatuses.includes(status)) {
      const next = selectedStatuses.filter(s => s !== status);
      setSelectedStatuses(next);
    } else {
      const next = [...selectedStatuses, status];
      if (next.length === 3) {
        setSelectedStatuses([]); // Hepsi seçilince filtresize normalleşir
      } else {
        setSelectedStatuses(next);
      }
    }
  };

  // Sadece riski seç (Durumları sıfırlayıp o riskin tamamını gösterir)
  const handleSelectRiskOnly = (targetRisk: string) => {
    setSelectedRiskFilter(targetRisk);
    setSelectedStatuses([]);
  };

  // İstatistikleri Çek (Tüm hastaneleri kapsayacak şekilde)
  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const token = localStorage.getItem('token');
      const url = `${API}/api/operations/improvements/dashboard-stats?facilityId=ALL`;
      const res = await fetch(url, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching executive stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Tablo Kayıtlarını Çek (Hızlı ve reaktif filtreleme için tüm kayıtlar yüklenir)
  const fetchRecords = async () => {
    try {
      setLoadingRecords(true);
      const token = localStorage.getItem('token');
      const url = `${API}/api/operations/improvements/records?limit=all`;
      const res = await fetch(url, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (data.success) {
        setRawRecords(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching executive records:', err);
    } finally {
      setLoadingRecords(false);
    }
  };

  useEffect(() => {
    if (!hasAdminAccess) {
      if (userFacilities.length === 1) {
        const myFac = userFacilities[0];
        if (selectedFacilityId !== myFac) {
          setSelectedFacilityIdState(myFac);
          localStorage.setItem('activeFacilityId', myFac);
        }
      } else if (userFacilities.length > 1) {
        // Birden çok tesisi olan kullanıcı: Geçersiz bir tesis seçilmişse ALL (kendi yetkisindeki tesisler toplu) moduna çek
        if (selectedFacilityId !== 'ALL' && !userFacilities.includes(selectedFacilityId)) {
          setSelectedFacilityIdState('ALL');
          localStorage.removeItem('activeFacilityId');
        }
      }
    }
  }, [hasAdminAccess, userFacilities, selectedFacilityId]);

  useEffect(() => {
    fetchStats();
    fetchRecords();

    const handleFacilityChange = () => {
      const activeLocal = localStorage.getItem('activeFacilityId') || 'ALL';
      setSelectedFacilityIdState(activeLocal);
    };

    window.addEventListener('facilityChanged', handleFacilityChange);
    return () => {
      window.removeEventListener('facilityChanged', handleFacilityChange);
    };
  }, []);

  const toggleHospitalExpand = (hospId: string) => {
    setExpandedHospitals(prev => ({
      ...prev,
      [hospId]: !prev[hospId],
    }));
  };

  const toggleGroupExpand = (hospId: string, groupKey: string) => {
    const key = `${hospId}_${groupKey}`;
    setExpandedGroups(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleHospitalSelect = (hospitalId: string) => {
    if (hospitalId === 'ALL') {
      localStorage.removeItem('activeFacilityId');
      setSelectedFacilityIds([]);
    } else {
      localStorage.setItem('activeFacilityId', hospitalId);
      setSelectedFacilityIds([hospitalId]);
    }
    setSelectedFacilityIdState(hospitalId);
    if (outletCtx.setSelectedFacilityId) {
      outletCtx.setSelectedFacilityId(hospitalId);
    }
    window.dispatchEvent(new Event('facilityChanged'));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // KULLANICI İSTEĞİ: "En sonunda bir yere filitre temizle koyalım. 
  // filitreyi temizleyince toplam olarak gösterebilir."
  // ─────────────────────────────────────────────────────────────────────────
  const handleClearAllFilters = () => {
    setSelectedRiskFilter('ALL'); // Temizleyince toplam olarak gösterir
    setSelectedStatuses([]);
    setSelectedSheetFilter('ALL');
    setSearchQuery('');
    setOnlyWithSelectedRisk(false);
    clearFacilitySelection();
    localStorage.setItem('exec_summary_risk_filter', 'ALL');
    localStorage.setItem('exec_summary_status_filter', '[]');
    localStorage.setItem('exec_summary_sheet_filter', 'ALL');
  };

  // Denetim başlığı seçildiğinde tabloya filtre uygula ve tabloya kaydır
  const handleSelectSheetFilter = (sheetKey: string, hospId?: string) => {
    setSelectedSheetFilter(sheetKey);
    if (hospId) {
      handleHospitalSelect(hospId);
    }
    // Tablo alanına yumuşak kaydır
    if (tableSectionRef.current) {
      tableSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // KULLANICI İSTEĞİ:
  // "BAH — Takip Alanları Dağılımı (4 Ana Modül):
  // tüm filitreleme Risk Seviyesine Göre Filtrele: kısmında seçtiğimde oradan gelecek.
  // sayıları da ona göre görelim.
  // Misal merkezi denetimlerde 52 bulgu değil Kritik seçtim ya orada kaç tane kritik var onu göstersin.
  // yanındaki kısımda da devam eden tamamlanan ve başlamamış kırılımı ile göstersin.
  // tabloda filitrele dediğimde de aşağıda ona ulaşabileyim. oradan da detaylarına bakarım.
  // sistem bu şekilde olmalı. filitreyi temizleyince toplam olarak gösterebilir."
  // ─────────────────────────────────────────────────────────────────────────

  // Alt Sekme Canlı Hesaplayıcı (Seçili Risk Seviyesine Duyarlı)
  const getSubItemStats = (hospitalId: string, sheetKey: string) => {
    const hospRecords = records.filter(r => r.facilityId === hospitalId && r.sheetType === sheetKey);

    // Seçili risk filtresine göre süz
    let riskFiltered = hospRecords;
    if (selectedRiskFilter !== 'ALL') {
      if (selectedRiskFilter === 'OLASI_ONEMSIZ') {
        riskFiltered = hospRecords.filter(r => r.riskScore === 'Olası' || r.riskScore === 'Önemsiz');
      } else {
        riskFiltered = hospRecords.filter(r => r.riskScore === selectedRiskFilter);
      }
    }

    const total = riskFiltered.length;
    const notStarted = riskFiltered.filter(r => r.status === 'Başlamadı' || !r.status).length;
    const inProgress = riskFiltered.filter(r => r.status === 'Devam Ediyor').length;
    const completed = riskFiltered.filter(r => r.status === 'Tamamlandı').length;
    const cancelled = riskFiltered.filter(r => r.status === 'İptal Edildi').length;
    const active = total - cancelled;
    const progress = active > 0 ? Math.round((completed / active) * 100) : (total > 0 && completed === total ? 100 : 0);

    const overallTotal = hospRecords.length;

    // Aktif Durum Filtresiyle Birebir Eşleşen Kayıt Sayısı
    let matchingFilterCount = 0;
    if (hasStatusFilter) {
      matchingFilterCount = riskFiltered.filter(r => {
        const s = r.status?.trim() || 'Başlamadı';
        if (selectedStatuses.includes('Başlamadı') && (s === 'Başlamadı' || !r.status || r.status.trim() === '')) return true;
        if (selectedStatuses.includes('Devam Ediyor') && s === 'Devam Ediyor') return true;
        if (selectedStatuses.includes('Tamamlandı') && s === 'Tamamlandı') return true;
        return false;
      }).length;
    } else {
      matchingFilterCount = total;
    }

    return { 
      total, 
      notStarted, 
      inProgress, 
      completed, 
      cancelled, 
      progress, 
      overallTotal,
      matchingFilterCount,
      hasRecords: total > 0 
    };
  };

  // Ana Modül Grubu Canlı Hesaplayıcı (Seçili Risk Seviyesine Duyarlı)
  const getGroupStats = (hospitalId: string, items: { key: string }[]) => {
    let total = 0;
    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;
    let cancelled = 0;
    let overallTotal = 0;
    let matchingFilterCount = 0;

    items.forEach(it => {
      const s = getSubItemStats(hospitalId, it.key);
      total += s.total;
      completed += s.completed;
      inProgress += s.inProgress;
      notStarted += s.notStarted;
      cancelled += s.cancelled;
      overallTotal += s.overallTotal;
      matchingFilterCount += s.matchingFilterCount;
    });

    const activeTotal = total - cancelled;
    const progress = activeTotal > 0 ? Math.round((completed / activeTotal) * 100) : (total > 0 && completed === total ? 100 : 0);

    return { 
      total, 
      completed, 
      inProgress, 
      notStarted, 
      cancelled, 
      activeTotal, 
      progress, 
      overallTotal,
      matchingFilterCount,
      hasRecords: total > 0 
    };
  };

  // Hastane Kartı Canlı Hesaplayıcı (Seçili Risk Seviyesine Duyarlı)
  const getHospitalComputedStats = (hospitalId: string) => {
    const hospFromStats = stats?.hospitals?.find(h => h.hospitalId === hospitalId);
    const hospRecords = records.filter(r => r.facilityId === hospitalId);
    const overallTotal = hospRecords.length > 0 ? hospRecords.length : (hospFromStats?.total || 0);
    const overallCompleted = hospRecords.length > 0 ? hospRecords.filter(r => r.status === 'Tamamlandı').length : (hospFromStats?.completed || 0);
    const overallInProgress = hospRecords.length > 0 ? hospRecords.filter(r => r.status === 'Devam Ediyor').length : (hospFromStats?.inProgress || 0);
    const overallNotStarted = hospRecords.length > 0 ? hospRecords.filter(r => r.status === 'Başlamadı' || !r.status).length : (hospFromStats?.notStarted || 0);
    const overallCancelled = hospRecords.length > 0 ? hospRecords.filter(r => r.status === 'İptal Edildi').length : (hospFromStats?.cancelled || 0);
    const overallActive = overallTotal - overallCancelled;
    const overallProgress = overallActive > 0 ? Math.round((overallCompleted / overallActive) * 100) : 0;

    let riskRecords = hospRecords;
    if (selectedRiskFilter !== 'ALL') {
      if (selectedRiskFilter === 'OLASI_ONEMSIZ') {
        riskRecords = hospRecords.filter(r => r.riskScore === 'Olası' || r.riskScore === 'Önemsiz');
      } else {
        riskRecords = hospRecords.filter(r => r.riskScore === selectedRiskFilter);
      }
    }

    const riskTotal = riskRecords.length;
    const riskCompleted = riskRecords.filter(r => r.status === 'Tamamlandı').length;
    const riskInProgress = riskRecords.filter(r => r.status === 'Devam Ediyor').length;
    const riskNotStarted = riskRecords.filter(r => r.status === 'Başlamadı' || !r.status).length;
    const riskCancelled = riskRecords.filter(r => r.status === 'İptal Edildi').length;
    const riskActive = riskTotal - riskCancelled;
    const riskProgress = riskActive > 0 ? Math.round((riskCompleted / riskActive) * 100) : (riskTotal > 0 && riskCompleted === riskTotal ? 100 : 0);

    // Aktif Filtreyle (Risk + Çoklu Durum) Birebir Eşleşen Kayıt Sayısı
    let matchingFilterCount = 0;
    if (hasStatusFilter) {
      matchingFilterCount = riskRecords.filter(r => {
        const s = r.status?.trim() || 'Başlamadı';
        if (selectedStatuses.includes('Başlamadı') && (s === 'Başlamadı' || !r.status || r.status.trim() === '')) return true;
        if (selectedStatuses.includes('Devam Ediyor') && s === 'Devam Ediyor') return true;
        if (selectedStatuses.includes('Tamamlandı') && s === 'Tamamlandı') return true;
        return false;
      }).length;
    } else {
      matchingFilterCount = selectedRiskFilter !== 'ALL' ? riskTotal : overallTotal;
    }

    return {
      overallTotal,
      overallCompleted,
      overallInProgress,
      overallNotStarted,
      overallProgress,
      riskTotal,
      riskCompleted,
      riskInProgress,
      riskNotStarted,
      riskProgress,
      matchingFilterCount,
      selectedStatusCount: matchingFilterCount,
      critical: hospRecords.filter(r => r.riskScore === 'Kritik').length,
      high: hospRecords.filter(r => r.riskScore === 'Yüksek').length,
      medium: hospRecords.filter(r => r.riskScore === 'Önemli').length,
      low: hospRecords.filter(r => r.riskScore === 'Olası').length,
      negligible: hospRecords.filter(r => r.riskScore === 'Önemsiz').length,
    };
  };

  // Toplam risk sayıları (Risk Filtre Butonları için)
  const getFilterTotalCount = (opt: RiskOption): number => {
    if (records.length === 0 && stats?.summary) {
      if (opt.key === 'ALL') return stats.summary.total;
      if (opt.key === 'Kritik') return stats.summary.risks?.critical || 0;
      if (opt.key === 'Yüksek') return stats.summary.risks?.high || 0;
      if (opt.key === 'Önemli') return stats.summary.risks?.medium || 0;
      if (opt.key === 'OLASI_ONEMSIZ') return (stats.summary.risks?.low || 0) + (stats.summary.risks?.negligible || 0);
    }
    if (opt.key === 'ALL') return records.length;
    if (opt.key === 'OLASI_ONEMSIZ') {
      return records.filter(r => r.riskScore === 'Olası' || r.riskScore === 'Önemsiz').length;
    }
    return records.filter(r => r.riskScore === opt.key).length;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // KPI KARTLARI ÜÇLÜ YAPI (Başlamadı / Devam / Tamamlandı + Toplam)
  // Odaklı hastane(ler) varsa onların sayıları, yoksa tüm zincir sayıları gösterilir.
  // ─────────────────────────────────────────────────────────────────────────
  const kpiData = useMemo(() => {
    const hasFacFilter = selectedFacilityIds.length > 0;
    if (records.length === 0 && stats?.summary && !hasFacFilter) {
      const s = stats.summary;
      return {
        total: { notStarted: s.notStarted, inProgress: s.inProgress, completed: s.completed, total: s.total },
        critical: { notStarted: 0, inProgress: 0, completed: 0, total: s.risks?.critical || 0 },
        high: { notStarted: 0, inProgress: 0, completed: 0, total: s.risks?.high || 0 },
        medium: { notStarted: 0, inProgress: 0, completed: 0, total: s.risks?.medium || 0 },
        lowAndNegligible: { notStarted: 0, inProgress: 0, completed: 0, total: (s.risks?.low || 0) + (s.risks?.negligible || 0) },
      };
    }
    const relevantRecords = hasFacFilter
      ? records.filter(r => selectedFacilityIds.includes(r.facilityId))
      : records;

    const calcSplit = (subList: ImprovementRecord[]) => {
      const notStarted = subList.filter(r => r.status === 'Başlamadı' || !r.status).length;
      const inProgress = subList.filter(r => r.status === 'Devam Ediyor').length;
      const completed = subList.filter(r => r.status === 'Tamamlandı').length;
      const total = subList.length;
      return { notStarted, inProgress, completed, total };
    };

    return {
      total: calcSplit(relevantRecords),
      critical: calcSplit(relevantRecords.filter(r => r.riskScore === 'Kritik')),
      high: calcSplit(relevantRecords.filter(r => r.riskScore === 'Yüksek')),
      medium: calcSplit(relevantRecords.filter(r => r.riskScore === 'Önemli')),
      lowAndNegligible: calcSplit(relevantRecords.filter(r => r.riskScore === 'Olası' || r.riskScore === 'Önemsiz')),
    };
  }, [records, selectedFacilityIds, stats?.summary]);

  // Yetkili Tesisler Listesi (Yetkisiz hastaneler filtrelenir)
  const authorizedFacilities = useMemo(() => {
    if (hasAdminAccess || userFacilities.length === 0) return facilities;
    return facilities.filter(f => userFacilities.includes(f.id));
  }, [facilities, hasAdminAccess, userFacilities]);

  // Tüm Yetkili Hastaneler (Filtresiz ham liste)
  const allAuthorizedHospitals = useMemo(() => {
    const rawList = stats?.hospitals || [];
    return (hasAdminAccess || userFacilities.length === 0)
      ? rawList
      : rawList.filter(h => userFacilities.includes(h.hospitalId));
  }, [stats?.hospitals, hasAdminAccess, userFacilities]);

  // Filtrelenmiş ve sıralanmış hastane listesi (Çoklu tesis seçimine ve arama kriterlerine göre)
  const filteredHospitals = useMemo(() => {
    return allAuthorizedHospitals.filter(hosp => {
      // Çoklu Tesis Filtresi
      if (selectedFacilityIds.length > 0 && !selectedFacilityIds.includes(hosp.hospitalId)) {
        return false;
      }
      // İsim filtresi
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = (hosp.hospitalName || '').toLowerCase().includes(q);
        if (!matches) return false;
      }
      // Sadece seçili riski veya durumu olanlar
      if ((selectedRiskFilter !== 'ALL' || hasStatusFilter) && onlyWithSelectedRisk) {
        const c = getHospitalComputedStats(hosp.hospitalId);
        if (c.matchingFilterCount <= 0) return false;
      }
      return true;
    }).sort((a, b) => {
      const aComp = getHospitalComputedStats(a.hospitalId);
      const bComp = getHospitalComputedStats(b.hospitalId);

      if (sortBy === 'risk') {
        if (hasStatusFilter || selectedRiskFilter !== 'ALL') {
          if (bComp.matchingFilterCount !== aComp.matchingFilterCount) return bComp.matchingFilterCount - aComp.matchingFilterCount;
        } else {
          const aCritHigh = aComp.critical + aComp.high;
          const bCritHigh = bComp.critical + bComp.high;
          if (bCritHigh !== aCritHigh) return bCritHigh - aCritHigh;
        }
        return bComp.overallTotal - aComp.overallTotal;
      }
      if (sortBy === 'total') {
        return bComp.overallTotal - aComp.overallTotal;
      }
      if (sortBy === 'progress') {
        return bComp.overallProgress - aComp.overallProgress;
      }
      if (sortBy === 'name') {
        return (a.hospitalName || '').localeCompare(b.hospitalName || '', 'tr');
      }
      return 0;
    });
  }, [allAuthorizedHospitals, selectedFacilityIds, records, searchQuery, selectedRiskFilter, selectedStatuses, hasStatusFilter, onlyWithSelectedRisk, sortBy]);

  // ─────────────────────────────────────────────────────────────────────────
  // KULLANICI İSTEĞİ: TABLO FİLTRESİ
  // "Yukarıdaki filitreye göre aşağıda listelenmeli. Yine burada seçtiğimiz 
  // denetim başlığı da alttaki dinamik listede listelenebilir olmalı."
  // ─────────────────────────────────────────────────────────────────────────
  const filteredRecordsForTable = useMemo(() => {
    return records.filter(r => {
      // 0. Çoklu Tesis Filtresi
      if (selectedFacilityIds.length > 0 && !selectedFacilityIds.includes(r.facilityId)) {
        return false;
      }

      // 1. Risk Filtresi
      if (selectedRiskFilter !== 'ALL') {
        if (selectedRiskFilter === 'OLASI_ONEMSIZ') {
          if (r.riskScore !== 'Olası' && r.riskScore !== 'Önemsiz') return false;
        } else if (r.riskScore !== selectedRiskFilter) {
          return false;
        }
      }

      // 1.5 Çoklu Durum Filtresi (Başlamadı / Devam Ediyor / Tamamlandı)
      if (hasStatusFilter) {
        const s = r.status?.trim() || 'Başlamadı';
        const isNotStarted = !r.status || r.status.trim() === '' || s === 'Başlamadı';
        const isInProgress = s === 'Devam Ediyor';
        const isCompleted = s === 'Tamamlandı';

        const matchNotStarted = selectedStatuses.includes('Başlamadı') && isNotStarted;
        const matchInProgress = selectedStatuses.includes('Devam Ediyor') && isInProgress;
        const matchCompleted = selectedStatuses.includes('Tamamlandı') && isCompleted;

        if (!matchNotStarted && !matchInProgress && !matchCompleted) {
          return false;
        }
      }

      // 2. Denetim Başlığı / Sekme Filtresi
      if (selectedSheetFilter !== 'ALL') {
        // Eğer bir ana modül grubu seçildiyse (DENETIMLER, ELEKTRIK, MEKANIK, YANGIN)
        if (MODULE_SHEET_MAP[selectedSheetFilter]) {
          const allowed = MODULE_SHEET_MAP[selectedSheetFilter];
          if (!allowed.includes(r.sheetType) && r.moduleGroup !== selectedSheetFilter) {
            return false;
          }
        } else if (r.sheetType !== selectedSheetFilter) {
          return false;
        }
      }

      return true;
    });
  }, [records, selectedFacilityIds, selectedRiskFilter, selectedStatuses, hasStatusFilter, selectedSheetFilter]);

  const selectedRiskOpt = RISK_FILTER_OPTIONS.find(o => o.key === selectedRiskFilter) || RISK_FILTER_OPTIONS[0];

  const hasAnyFilterActive = selectedRiskFilter !== 'ALL' || 
    hasStatusFilter ||
    selectedSheetFilter !== 'ALL' || 
    selectedFacilityIds.length > 0 || 
    Boolean(searchQuery.trim()) || 
    onlyWithSelectedRisk;

  const currentFocusHospitalName = useMemo(() => {
    if (selectedFacilityIds.length === 1) {
      return allAuthorizedHospitals.find(h => h.hospitalId === selectedFacilityIds[0])?.hospitalName || selectedFacilityIds[0];
    }
    if (selectedFacilityIds.length > 1) {
      const names = selectedFacilityIds.map(id => allAuthorizedHospitals.find(h => h.hospitalId === id)?.hospitalName || id);
      return `${selectedFacilityIds.length} Tesis (${names.join(', ')})`;
    }
    return null;
  }, [selectedFacilityIds, allAuthorizedHospitals]);

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto pb-16 font-sans px-4 sm:px-6">
      
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. ÜST BAŞLIK VE HIZLI EYLEMLER                                     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-5 pt-2">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
              <span>Yönetici Özeti & Denetim Paneli</span>
            </h1>
            <Badge variant="outline" className="text-xs font-semibold px-2.5 py-0.5 bg-primary/10 text-primary border-primary/20">
              Canlı Takip
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            Tüm hastanelerin emniyet ve denetim bulgularını tek bir noktadan izleyin, risk seviyelerine ve denetim başlıklarına göre anında filtreleyip inceleyin.
          </p>
        </div>

        {/* Sağ Üst Hızlı Kontroller */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {hasAnyFilterActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAllFilters}
              className="text-xs h-9 text-destructive hover:bg-destructive/10 border-destructive/30 cursor-pointer shadow-2xs"
              title="Tüm filtreleri temizler ve toplam durumları gösterir"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Filtreleri Temizle (Toplam Göster)
            </Button>
          )}

          <Button
            variant="default"
            size="sm"
            onClick={() => {
              if (tableSectionRef.current) {
                tableSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="text-xs h-9 cursor-pointer shadow-2xs font-bold"
          >
            <ListOrdered className="w-3.5 h-3.5 mr-1.5" />
            Bulgu Tablosuna Git ({filteredRecordsForTable.length})
          </Button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2.5 DENETİM İLERLEME & KAPSAM DEĞİŞİMİ TREND GRAFİĞİ (KATLANABİLİR) */}
      {/* (KULLANICI İSTEĞİ: DEFAULT KAPALI, İSTENDİĞİNDE AÇILIR)             */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-card text-card-foreground border border-border/80 rounded-2xl shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setIsTrendChartOpen(prev => !prev)}
          className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-muted/30 transition-colors text-left cursor-pointer select-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                  Denetim İlerleme & Kapsam Değişimi Trend Grafiği
                </h3>
                <Badge variant="outline" className="text-[10px] font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                  {isTrendChartOpen ? 'Grafik Açık' : 'Tıklayarak Açın (Kapalı)'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Bulgu eklenme ve ağırlıklı ilerleme hızını zaman serisinde inceleyin (Earned Value / Burnup Modeli)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground shrink-0">
            <span className="hidden sm:inline">{isTrendChartOpen ? 'Grafiği Gizle' : 'Grafiği Göster'}</span>
            <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isTrendChartOpen ? "rotate-180" : "")} />
          </div>
        </button>

        {isTrendChartOpen && (
          <div className="border-t border-border/70 p-4 sm:p-6 bg-background animate-in slide-in-from-top-1 duration-150">
            <AuditProgressTrendChart
              records={records}
              facilities={authorizedFacilities}
              selectedFacilityId={selectedFacilityId}
              onFacilityChange={handleHospitalSelect}
            />
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. ANA BÖLÜM: HASTANELERE GÖRE BULGU DAĞILIMI                       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-card text-card-foreground border border-border/80 rounded-2xl shadow-xs overflow-hidden">
        
        {/* BÖLÜM BAŞLIĞI */}
        <div className="p-5 sm:p-6 border-b bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold shrink-0">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold tracking-tight text-foreground">
                    Genel Durum & Risk Dağılımı KPI Göstergeleri (Tüm Zincir)
                  </h2>
                  <Badge variant="outline" className="text-xs font-mono px-2 py-0.5">
                    {allAuthorizedHospitals.length} Hastane
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Risk düzeyleri, açık/kapalı bulgu durumları ve tesisler arası genel dağılım özeti
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {selectedFacilityIds.length > 0 && (
                <div className="px-3.5 py-1.5 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-2 text-xs text-primary font-medium">
                  <span>
                    Seçili Tesisler: <strong>{currentFocusHospitalName}</strong>
                  </span>
                  <button 
                    onClick={clearFacilitySelection}
                    className="text-xs underline hover:text-primary/80 ml-1.5 cursor-pointer font-bold"
                    title="Tüm tesisleri göster"
                  >
                    Tümüne Dön
                  </button>
                </div>
              )}

              {hasAnyFilterActive && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAllFilters}
                  className="text-xs text-muted-foreground hover:text-destructive h-8 cursor-pointer"
                  title="Tüm filtreleri baştan başlatır ve toplam durumları gösterir"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  Sıfırla
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* RİSK VE DURUM KPI GÖSTERGELERİ & FİLTRELEME ALANI */}
        <div className="p-5 border-b bg-background/50 space-y-4">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span>Genel Durum & Risk Dağılımı KPI Göstergeleri:</span>
              <span className="text-[11px] font-normal text-muted-foreground hidden sm:inline">
                (Karta tıklayarak risk seviyesini, içindeki <strong>Başlamadı / Devam / Tamam</strong> butonlarına basarak duruma göre filtreleyin)
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono flex-wrap">
              <span className="font-sans">Aktif Filtre:</span>
              <Badge variant="secondary" className="font-mono text-[11px] font-bold">
                {selectedRiskOpt.label}
              </Badge>
              {hasStatusFilter && selectedStatuses.map(status => (
                <Badge 
                  key={status}
                  variant="default" 
                  className={cn(
                    "font-mono text-[11px] font-bold flex items-center gap-1",
                    status === 'Başlamadı' && "bg-amber-500 hover:bg-amber-600 text-white",
                    status === 'Devam Ediyor' && "bg-blue-600 hover:bg-blue-700 text-white",
                    status === 'Tamamlandı' && "bg-emerald-600 hover:bg-emerald-700 text-white"
                  )}
                >
                  <span>Durum: {status}</span>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      toggleStatusFilter(selectedRiskFilter, status);
                    }}
                    className="ml-1 hover:opacity-80 cursor-pointer"
                    title={`${status} durum filtresini kaldır`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              {hasStatusFilter && (
                <button
                  type="button"
                  onClick={() => setSelectedStatuses([])}
                  className="text-[11px] text-muted-foreground hover:text-foreground underline cursor-pointer"
                  title="Tüm durumları göster"
                >
                  (Tüm Durumlar)
                </button>
              )}
              <span className="text-muted-foreground/40 font-normal">|</span>
              <span>Eşleşen:</span>
              <strong className="text-foreground font-bold">
                {filteredRecordsForTable.length} Bulgu
              </strong>
            </div>
          </div>

          {/* 5 KPI KARTI (Tıklanabilir Risk & Çoklu Durum Filtre Paneli) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {[
              {
                key: 'ALL',
                title: 'Toplam Bulgu',
                icon: Layers,
                accentText: 'text-blue-600 dark:text-blue-400',
                activeRing: 'bg-blue-500/10 border-blue-500/60 ring-2 ring-blue-500/30 shadow-xs',
                activeBadge: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
                counts: kpiData.total,
              },
              {
                key: 'Kritik',
                title: 'Kritik Risk',
                icon: AlertTriangle,
                accentText: 'text-red-600 dark:text-red-400',
                activeRing: 'bg-red-500/10 border-red-500/60 ring-2 ring-red-500/30 shadow-xs',
                activeBadge: 'bg-red-500/10 text-red-600 border-red-500/30',
                counts: kpiData.critical,
              },
              {
                key: 'Yüksek',
                title: 'Yüksek Risk',
                icon: Flame,
                accentText: 'text-rose-600 dark:text-rose-400',
                activeRing: 'bg-rose-500/10 border-rose-500/60 ring-2 ring-rose-500/30 shadow-xs',
                activeBadge: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
                counts: kpiData.high,
              },
              {
                key: 'Önemli',
                title: 'Önemli Risk',
                icon: ShieldAlert,
                accentText: 'text-amber-600 dark:text-amber-400',
                activeRing: 'bg-amber-500/10 border-amber-500/60 ring-2 ring-amber-500/30 shadow-xs',
                activeBadge: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
                counts: kpiData.medium,
              },
              {
                key: 'OLASI_ONEMSIZ',
                title: 'Olası & Önemsiz',
                icon: ShieldCheck,
                accentText: 'text-slate-600 dark:text-slate-400',
                activeRing: 'bg-slate-500/10 border-slate-500/60 ring-2 ring-slate-500/30 shadow-xs',
                activeBadge: 'bg-slate-500/10 text-slate-600 border-slate-500/30',
                counts: kpiData.lowAndNegligible,
              },
            ].map(card => {
              const isCardActive = selectedRiskFilter === card.key;
              const CardIcon = card.icon;

              return (
                <div
                  key={card.key}
                  onClick={() => handleSelectRiskOnly(card.key)}
                  className={cn(
                    "p-3.5 rounded-2xl border transition-all cursor-pointer select-none shadow-2xs group/kpi",
                    isCardActive
                      ? card.activeRing
                      : "bg-card hover:bg-muted/40 border-border/80"
                  )}
                  title={`${card.title} - Tıklayarak bu risk seviyesindeki tüm bulguları listeleyin`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-tight text-foreground uppercase flex items-center gap-1.5">
                      <CardIcon className={cn("w-3.5 h-3.5", card.accentText)} />
                      {card.title}
                    </span>
                    {isCardActive && !hasStatusFilter && (
                      <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 font-bold", card.activeBadge)}>
                        Aktif
                      </Badge>
                    )}
                  </div>

                  {/* 4'LÜ BUTON IZGARASI: Başlamadı / Devam / Tamam / Toplam */}
                  <div className="grid grid-cols-4 gap-1.5 mt-2.5 pt-2 border-t border-border/50">
                    {/* Başlamadı */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStatusFilter(card.key, 'Başlamadı');
                      }}
                      className={cn(
                        "flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg text-center transition-all cursor-pointer",
                        isCardActive && selectedStatuses.includes('Başlamadı')
                          ? "bg-amber-500 text-white font-black shadow-xs ring-2 ring-amber-400 scale-[1.04]"
                          : "hover:bg-amber-500/15 text-amber-700 dark:text-amber-400 bg-amber-500/10"
                      )}
                      title={`${card.title} seviyesinde Başlamadı durumunu filtrele (Çoklu seçim yapılabilir)`}
                    >
                      <span className="text-xs sm:text-sm font-bold font-mono leading-none">
                        {card.counts.notStarted}
                      </span>
                      <span className={cn(
                        "text-[9px] font-medium leading-tight mt-1",
                        isCardActive && selectedStatuses.includes('Başlamadı') ? "text-white" : "text-amber-600 dark:text-amber-400"
                      )}>
                        Başlamadı
                      </span>
                    </button>

                    {/* Devam */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStatusFilter(card.key, 'Devam Ediyor');
                      }}
                      className={cn(
                        "flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg text-center transition-all cursor-pointer",
                        isCardActive && selectedStatuses.includes('Devam Ediyor')
                          ? "bg-blue-600 text-white font-black shadow-xs ring-2 ring-blue-400 scale-[1.04]"
                          : "hover:bg-blue-500/15 text-blue-700 dark:text-blue-400 bg-blue-500/10"
                      )}
                      title={`${card.title} seviyesinde Devam Eden durumunu filtrele (Çoklu seçim yapılabilir)`}
                    >
                      <span className="text-xs sm:text-sm font-bold font-mono leading-none">
                        {card.counts.inProgress}
                      </span>
                      <span className={cn(
                        "text-[9px] font-medium leading-tight mt-1",
                        isCardActive && selectedStatuses.includes('Devam Ediyor') ? "text-white" : "text-blue-600 dark:text-blue-400"
                      )}>
                        Devam
                      </span>
                    </button>

                    {/* Tamam */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStatusFilter(card.key, 'Tamamlandı');
                      }}
                      className={cn(
                        "flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg text-center transition-all cursor-pointer",
                        isCardActive && selectedStatuses.includes('Tamamlandı')
                          ? "bg-emerald-600 text-white font-black shadow-xs ring-2 ring-emerald-400 scale-[1.04]"
                          : "hover:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10"
                      )}
                      title={`${card.title} seviyesinde Tamamlanan durumunu filtrele (Çoklu seçim yapılabilir)`}
                    >
                      <span className="text-xs sm:text-sm font-bold font-mono leading-none">
                        {card.counts.completed}
                      </span>
                      <span className={cn(
                        "text-[9px] font-medium leading-tight mt-1",
                        isCardActive && selectedStatuses.includes('Tamamlandı') ? "text-white" : "text-emerald-600 dark:text-emerald-400"
                      )}>
                        Tamam
                      </span>
                    </button>

                    {/* Toplam */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectRiskOnly(card.key);
                      }}
                      className={cn(
                        "flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg text-center transition-all cursor-pointer",
                        isCardActive && !hasStatusFilter
                          ? "bg-foreground text-background font-black shadow-xs ring-2 ring-foreground/40 scale-[1.04]"
                          : "hover:bg-muted text-muted-foreground bg-muted/50"
                      )}
                      title={`${card.title} seviyesindeki tüm durumları göster`}
                    >
                      <span className="text-xs sm:text-sm font-black font-mono leading-none">
                        {card.counts.total}
                      </span>
                      <span className={cn(
                        "text-[9px] font-bold leading-tight mt-1",
                        isCardActive && !hasStatusFilter ? "text-background" : "text-muted-foreground"
                      )}>
                        Toplam
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* KULLANICI İSTEĞİ: TESİSLER DAĞILIM ÖZETİ (ÇOKLU SEÇİM ÖZELLİĞİ İLE) */}
          <div className="border border-border/80 rounded-xl bg-card overflow-hidden transition-all shadow-2xs">
            <button
              type="button"
              onClick={() => setIsFacilitySummaryOpen(prev => !prev)}
              className="w-full p-3 sm:px-4 flex items-center justify-between hover:bg-muted/40 transition-colors text-left cursor-pointer select-none"
            >
              <div className="flex items-center gap-2.5 flex-wrap">
                <Building2 className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-foreground">
                  {userFacilities.length > 0 && !hasAdminAccess ? `Yetkili Tesislerin Dağılım Özeti (${allAuthorizedHospitals.length} Tesis)` : `Tüm Tesislerin Dağılım Özeti (${allAuthorizedHospitals.length} Tesis)`}
                </span>
                <Badge variant="outline" className="text-[11px] font-mono font-bold bg-muted/60">
                  {selectedRiskFilter === 'ALL' ? 'Tüm Riskler' : (selectedRiskFilter === 'OLASI_ONEMSIZ' ? 'Olası ve Önemsiz' : `${selectedRiskFilter} Risk`)}
                  {hasStatusFilter ? ` • ${selectedStatuses.join(' + ')}` : ''}
                </Badge>
                {selectedFacilityIds.length > 0 && (
                  <Badge className="text-[11px] font-mono font-bold bg-primary text-primary-foreground">
                    {selectedFacilityIds.length} Tesis Seçili
                  </Badge>
                )}
                {hasStatusFilter && (
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium hidden sm:inline">
                    (Seçili filtrelere göre canlı sayılar)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium shrink-0">
                <span>{isFacilitySummaryOpen ? 'Özeti Gizle' : 'Tesis Listesini Aç'}</span>
                <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isFacilitySummaryOpen && "rotate-180")} />
              </div>
            </button>

            {isFacilitySummaryOpen && (
              <div className="p-3 sm:p-4 bg-muted/20 border-t border-border/60 animate-in slide-in-from-top-1 duration-150 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-[11px] text-muted-foreground">
                    Her tesisin aktif filtreye ({selectedRiskFilter === 'ALL' ? 'Tüm Riskler' : selectedRiskFilter}{hasStatusFilter ? ` - ${selectedStatuses.join(', ')}` : ''}) göre eşleşen bulgu sayıları: <span className="font-semibold text-foreground">(Birden fazla tesis seçebilirsiniz)</span>
                  </p>
                  <div className="flex items-center gap-2">
                    {selectedFacilityIds.length > 0 ? (
                      <>
                        <span className="text-xs font-bold text-primary">
                          {selectedFacilityIds.length} / {allAuthorizedHospitals.length} seçildi
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={clearFacilitySelection}
                          className="h-7 text-xs text-destructive hover:bg-destructive/10 px-2 cursor-pointer font-medium"
                        >
                          Seçimi Temizle (Tümü)
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={selectAllFacilities}
                        className="h-7 text-xs text-muted-foreground hover:text-foreground px-2 cursor-pointer font-medium"
                      >
                        Tümünü Seç
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {allAuthorizedHospitals.map(hosp => {
                    const hStats = getHospitalComputedStats(hosp.hospitalId);
                    const isSelected = selectedFacilityIds.includes(hosp.hospitalId);

                    return (
                      <div
                        key={hosp.hospitalId}
                        onClick={() => toggleFacilitySelect(hosp.hospitalId)}
                        className={cn(
                          "p-2.5 rounded-lg border text-left transition-all cursor-pointer select-none group relative",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-xs ring-2 ring-primary/30"
                            : "bg-card hover:bg-muted/70 border-border/80 text-foreground"
                        )}
                        title={`${hosp.hospitalName} - Tıklayarak seçin/kaldırın`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary-foreground/25 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-primary-foreground stroke-[3]" />
                          </div>
                        )}
                        <div className="text-[11px] font-bold truncate pr-5">
                          {hosp.hospitalName}
                        </div>
                        <div className="mt-1 flex items-baseline justify-between gap-1">
                          <span className={cn(
                            "text-sm font-black font-mono",
                            isSelected ? "text-primary-foreground" : "text-foreground"
                          )}>
                            {hStats.matchingFilterCount}
                          </span>
                          <span className={cn(
                            "text-[10px] truncate",
                            isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                          )}>
                            {hasStatusFilter 
                              ? selectedStatuses.map(s => s === 'Başlamadı' ? 'bşl' : s === 'Devam Ediyor' ? 'dvm' : 'tmm').join('+')
                              : (selectedRiskFilter !== 'ALL' ? (selectedRiskFilter === 'OLASI_ONEMSIZ' ? 'Olası' : selectedRiskFilter) : 'Toplam')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ── BÖLÜM: HASTANELERE GÖRE BULGU DAĞILIMI DETAY LİSTESİ (DEFAULT KAPALI, İSTENDİĞİNDE AÇILIR) ── */}
        <div className="border-t border-border/80 bg-muted/15">
          <button
            type="button"
            onClick={() => setIsHospitalsListOpen(prev => !prev)}
            className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-muted/30 transition-colors text-left cursor-pointer select-none"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold shrink-0">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                    Hastanelere Göre Bulgu Dağılımı Detay Listesi
                  </h3>
                  <Badge variant="outline" className="text-xs font-mono px-2 py-0.5">
                    {filteredHospitals.length} Hastane
                  </Badge>
                  {selectedFacilityIds.length > 0 && (
                    <Badge className="text-xs font-mono font-bold bg-primary text-primary-foreground">
                      {selectedFacilityIds.length} Tesis Filtrelendi
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-[10px] font-mono font-semibold">
                    {isHospitalsListOpen ? 'Bölüm Açık' : 'Tıklayarak Açın (Kapalı)'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {isHospitalsListOpen 
                    ? 'Hastanelerin detaylı kartlarını daraltmak için tıklayın' 
                    : 'Tüm hastanelerin açık/kapalı bulguları, risk düzeyleri ve 4 ana emniyet modülü kartlarını görüntülemek için tıklayın'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground shrink-0 ml-3">
              <span className="hidden sm:inline">{isHospitalsListOpen ? 'Listeyi Gizle' : 'Listeyi Aç'}</span>
              <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isHospitalsListOpen ? "rotate-180" : "")} />
            </div>
          </button>
        </div>

        {isHospitalsListOpen ? (
          <div className="border-t border-border/80 animate-in slide-in-from-top-1 duration-150">
            {/* Arama ve Sıralama Çubuğu */}
            <div className="p-4 sm:p-5 bg-background border-b border-border/60">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Hastane adına göre ara..."
                    className="pl-9 h-9 text-xs bg-background"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap">
                  {/* Sadece Seçili Filtresi Olanlar Toggle */}
                  {(selectedRiskFilter !== 'ALL' || hasStatusFilter) && (
                    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={onlyWithSelectedRisk}
                        onChange={(e) => setOnlyWithSelectedRisk(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5"
                      />
                      <span>Sadece seçili filtreye uygun bulgusu olan hastaneler</span>
                    </label>
                  )}

                  {/* Sıralama */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <span>Sırala:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-background border border-border/80 rounded-lg px-2.5 py-1 text-xs text-foreground cursor-pointer"
                    >
                      <option value="risk">Risk Yoğunluğuna Göre</option>
                      <option value="total">Toplam Bulguya Göre</option>
                      <option value="progress">İlerleme Yüzdesine Göre</option>
                      <option value="name">İsme Göre (A-Z)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

        {/* HASTANELER LİSTESİ (AKORDİYONLU VE GENİŞ İLERLEME BARLI) */}
        <div className="divide-y divide-border/60">
          {loadingStats || loadingRecords ? (
            <div className="p-12 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Veriler ve risk analizleri yükleniyor...</span>
            </div>
          ) : filteredHospitals.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              Arama kriterlerine uygun hastane bulunamadı.
            </div>
          ) : (
            filteredHospitals.map(hosp => {
              const isHospOpen = !!expandedHospitals[hosp.hospitalId];
              const isCurrentActive = selectedFacilityIds.includes(hosp.hospitalId);
              const hospStats = getHospitalComputedStats(hosp.hospitalId);

              return (
                <div key={hosp.hospitalId} className={cn(
                  "transition-colors",
                  isCurrentActive && "bg-primary/5"
                )}>
                  
                  {/* HASTANE BAŞLIK SATIRI */}
                  <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    
                    {/* Sol: İsim ve Tesis İkonu */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 border transition-colors",
                        isCurrentActive 
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "bg-muted/70 text-muted-foreground border-border/80"
                      )}>
                        <Building2 className="w-5 h-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm sm:text-base font-bold text-foreground tracking-tight truncate">
                            {hosp.hospitalName}
                          </h3>
                          {isCurrentActive && (
                            <Badge className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0">
                              Odaklı
                            </Badge>
                          )}
                        </div>

                        {/* Canlı Kırılım ve Durum Satırı */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                          {hasStatusFilter ? (
                            <span className="font-extrabold text-foreground px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                              {hospStats.matchingFilterCount} {selectedRiskFilter !== 'ALL' ? (selectedRiskFilter === 'OLASI_ONEMSIZ' ? 'Olası ve Önemsiz' : selectedRiskFilter) : ''} ({selectedStatuses.join(' + ')}) Bulgu
                            </span>
                          ) : selectedRiskFilter !== 'ALL' ? (
                            <span className="font-bold text-foreground">
                              {hospStats.riskTotal} {selectedRiskFilter === 'OLASI_ONEMSIZ' ? 'Olası ve Önemsiz' : selectedRiskFilter} Bulgu
                            </span>
                          ) : (
                            <span className="font-mono font-medium text-foreground">{hospStats.overallTotal} Toplam Bulgu</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Orta / Sağ: Seçili Risk Rozeti + İlerleme Çubuğu + Aksiyonlar */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6 shrink-0">
                      
                      {/* Seçili Risk / Filtre Rozeti */}
                      <div className="flex items-center gap-2">
                        {hasStatusFilter ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold bg-amber-500/15 border-amber-500/30 text-amber-800 dark:text-amber-300 shadow-2xs">
                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                            <span>{hospStats.matchingFilterCount} Bulgu ({selectedStatuses.join(' + ')})</span>
                          </div>
                        ) : selectedRiskFilter !== 'ALL' ? (
                          <div className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold",
                            selectedRiskOpt.activeClass
                          )}>
                            <span 
                              className="w-2 h-2 rounded-full shrink-0" 
                              style={{ backgroundColor: selectedRiskOpt.dotColor }}
                            />
                            <span>{hospStats.riskTotal} {selectedRiskFilter === 'OLASI_ONEMSIZ' ? 'Olası & Önemsiz' : selectedRiskFilter}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 text-xs font-bold">
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                            <span>{hospStats.overallTotal} Toplam Bulgu</span>
                          </div>
                        )}
                      </div>

                      {/* İlerleme ve Mini Risk Dağılımı */}
                      {hasStatusFilter ? (
                        <div className="w-full sm:w-44 text-right flex items-center justify-end">
                          <span className="text-xs font-mono text-muted-foreground">
                            Eşleşen: <strong className="text-foreground text-sm font-black">{hospStats.matchingFilterCount}</strong> Bulgu
                          </span>
                        </div>
                      ) : selectedRiskFilter !== 'ALL' ? (
                        <div className="w-full sm:w-48 space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-muted-foreground text-[11px]">
                              {selectedRiskFilter} İlerlemesi
                            </span>
                            <span className="font-bold text-foreground">
                              %{hospStats.riskProgress}
                            </span>
                          </div>
                          <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full rounded-full transition-all duration-300",
                                selectedRiskFilter === 'Kritik' 
                                  ? "bg-red-600" 
                                  : selectedRiskFilter === 'Yüksek'
                                  ? "bg-rose-600"
                                  : "bg-primary"
                              )}
                              style={{ 
                                width: `${Math.min(100, Math.max(0, hospStats.riskProgress))}%` 
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="w-full sm:w-48 space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-muted-foreground text-[11px]">
                              Genel İlerleme
                            </span>
                            <span className="font-bold text-foreground">
                              %{hospStats.overallProgress}
                            </span>
                          </div>
                          <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-300 bg-primary"
                              style={{ 
                                width: `${Math.min(100, Math.max(0, hospStats.overallProgress))}%` 
                              }}
                            />
                          </div>

                          {/* 5 Risk Seviyesi Mini Noktalar (Sadece Konsolide Tüm Riskler görünümünde gösterilir) */}
                          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground pt-0.5">
                            <span title="Kritik Risk Sayısı" className="flex items-center gap-0.5 text-red-700 dark:text-red-400 font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-600 inline-block" />
                              {hospStats.critical}
                            </span>
                            <span title="Yüksek Risk Sayısı" className="flex items-center gap-0.5 text-rose-600 dark:text-rose-400 font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                              {hospStats.high}
                            </span>
                            <span title="Önemli Risk Sayısı" className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                              {hospStats.medium}
                            </span>
                            <span title="Olası Risk Sayısı" className="flex items-center gap-0.5 text-yellow-600 dark:text-yellow-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block" />
                              {hospStats.low}
                            </span>
                            <span title="Önemsiz Risk Sayısı" className="flex items-center gap-0.5 text-slate-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
                              {hospStats.negligible}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Aksiyon Butonları */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button
                          variant={isCurrentActive ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleFacilitySelect(hosp.hospitalId)}
                          className={cn("text-xs h-8 px-2.5 cursor-pointer font-medium", isCurrentActive && "bg-primary text-primary-foreground")}
                          title={isCurrentActive ? "Tesis seçimini kaldır" : "Listeyi ve paneli bu tesise göre filtrele"}
                        >
                          {isCurrentActive ? (
                            <>
                              <Check className="w-3.5 h-3.5 mr-1" />
                              Seçili
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              Odakla
                            </>
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleHospitalExpand(hosp.hospitalId)}
                          className="text-xs h-8 px-2.5 cursor-pointer text-muted-foreground hover:text-foreground"
                          title={isHospOpen ? 'Alt modülleri gizle' : 'Alt modülleri incele'}
                        >
                          <span className="mr-1">{isHospOpen ? 'Gizle' : 'Detay'}</span>
                          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isHospOpen && "rotate-180")} />
                        </Button>
                      </div>

                    </div>
                  </div>

                  {/* ───────────────────────────────────────────────────────── */}
                  {/* KULLANICI İSTEĞİ: İÇ İÇE AÇILAN BAR GÖSTERİMİ & İLERLEME    */}
                  {/* (BAH — Takip Alanları Dağılımı Bar Tasarımı)                */}
                  {/* Sayılar ve barlar seçili risk seviyesine göre canlı gelir   */}
                  {/* ───────────────────────────────────────────────────────── */}
                  {isHospOpen && (
                    <div className="bg-muted/30 border-t border-border/70 p-4 sm:p-5 space-y-3 animate-in slide-in-from-top-1 duration-150">
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-1 gap-2">
                        <div className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-primary" />
                          <span>{hosp.hospitalName} — Takip Alanları Dağılımı (4 Ana Modül):</span>
                          {hasStatusFilter ? (
                            <Badge variant="outline" className="text-[11px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 font-bold uppercase">
                              {selectedRiskFilter === 'ALL' ? 'Tüm Riskler' : selectedRiskFilter} • {selectedStatuses.join(' + ')} Gösteriliyor
                            </Badge>
                          ) : selectedRiskFilter !== 'ALL' ? (
                            <Badge variant="outline" className="text-[11px] bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 font-bold uppercase">
                              {selectedRiskFilter} Seviyesi Gösteriliyor
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[11px] bg-muted text-muted-foreground">
                              Tüm Riskler (Toplam)
                            </Badge>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          İlgili bar veya alt başlığa tıklayarak alttaki tabloda anında filtreleyin
                        </span>
                      </div>

                      {/* 4 ANA EMNİYET MODÜLÜ BARI (İÇ İÇE AÇILIR LİSTE) */}
                      <div className="space-y-2.5">
                        {TRACKING_GROUPS.map(group => {
                          const groupKey = `${hosp.hospitalId}_${group.key}`;
                          const isGroupOpen = !!expandedGroups[groupKey];
                          const groupStats = getGroupStats(hosp.hospitalId, group.items);
                          const GroupIcon = group.icon;
                          const isGroupFiltered = selectedSheetFilter === group.key && selectedFacilityId === hosp.hospitalId;

                          return (
                            <div 
                              key={group.key}
                              className={cn(
                                "border rounded-xl overflow-hidden transition-all bg-card shadow-2xs",
                                isGroupFiltered ? "border-primary ring-1 ring-primary/30" : "border-border/80"
                              )}
                            >
                              
                              {/* ANA MODÜL BARI (Geniş İlerleme Çubuklu Bar) */}
                              <div 
                                onClick={() => toggleGroupExpand(hosp.hospitalId, group.key)}
                                className="p-3 sm:p-4 bg-card hover:bg-muted/40 transition-colors cursor-pointer select-none flex flex-col md:flex-row md:items-center justify-between gap-3"
                              >
                                
                                {/* Sol: İkon + Modül İsmi + Alt Sekme Sayısı */}
                                <div className="flex items-center gap-3 min-w-0 md:w-64">
                                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border", group.accentColor)}>
                                    <GroupIcon className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">
                                      {group.name}
                                    </h4>
                                    <span className="text-[10px] text-muted-foreground">
                                      {hasStatusFilter ? (
                                        <strong className="text-foreground font-bold">{groupStats.matchingFilterCount} {selectedRiskFilter !== 'ALL' ? (selectedRiskFilter === 'OLASI_ONEMSIZ' ? 'Olası' : selectedRiskFilter) : ''} ({selectedStatuses.join(' + ')}) bulgu</strong>
                                      ) : selectedRiskFilter !== 'ALL' ? (
                                        <strong className="text-foreground font-bold">{groupStats.total} {selectedRiskFilter === 'OLASI_ONEMSIZ' ? 'Olası ve Önemsiz' : selectedRiskFilter} bulgu</strong>
                                      ) : (
                                        <>{group.items.length} Alt Başlık • <strong className="text-foreground font-bold">{groupStats.total}</strong> toplam bulgu</>
                                      )}
                                    </span>
                                  </div>
                                </div>

                                {/* Orta: İlerleme Barı (Progress Bar) veya Filtrelenen Sayı */}
                                {hasStatusFilter ? (
                                  <div className="flex-1 max-w-md w-full flex items-center justify-center">
                                    <span className="text-xs font-mono text-muted-foreground">
                                      Eşleşen: <strong className="text-foreground font-bold">{groupStats.matchingFilterCount}</strong> Bulgu
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex-1 max-w-md w-full space-y-1">
                                    <div className="flex items-center justify-between text-xs font-mono">
                                      <span className="text-[11px] text-muted-foreground font-sans">
                                        {selectedRiskFilter !== 'ALL' ? `${selectedRiskFilter} İlerlemesi` : 'İlerleme Oranı'}
                                      </span>
                                      <span className="font-bold text-foreground">
                                        %{groupStats.progress}
                                      </span>
                                    </div>
                                    <div className="w-full bg-muted/70 h-2 rounded-full overflow-hidden">
                                      <div 
                                        className={cn("h-full rounded-full transition-all duration-300", group.barColor)}
                                        style={{ width: `${Math.min(100, Math.max(0, groupStats.progress))}%` }}
                                        title={`Tamamlanma: %${groupStats.progress}`}
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Sağ: Üçlü Dağılım veya Filtrelenmiş Sayı + Filtrele Butonu + Aç/Kapa İkonu */}
                                <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                                  {hasStatusFilter ? (
                                    <div className="font-mono text-xs font-bold text-foreground bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                                      <span>{groupStats.matchingFilterCount} Bulgu</span>
                                    </div>
                                  ) : (
                                    <div className="font-mono text-xs flex items-center gap-1.5 font-bold">
                                      <span className="text-amber-600 dark:text-amber-400" title="Başlamadı">{groupStats.notStarted}</span>
                                      <span className="text-muted-foreground/40 font-normal">/</span>
                                      <span className="text-blue-600 dark:text-blue-400" title="Devam">{groupStats.inProgress}</span>
                                      <span className="text-muted-foreground/40 font-normal">/</span>
                                      <span className="text-emerald-600 dark:text-emerald-400" title="Tamam">{groupStats.completed}</span>
                                      <span className="text-foreground ml-1 font-bold">({groupStats.total})</span>
                                    </div>
                                  )}

                                  {/* Bu Grubu Tabloda Filtrele Butonu */}
                                  <Button
                                    variant={isGroupFiltered ? "default" : "outline"}
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectSheetFilter(isGroupFiltered ? 'ALL' : group.key, hosp.hospitalId);
                                    }}
                                    className="h-7 text-[11px] px-2.5 cursor-pointer font-medium"
                                    title="Tüm grubu alttaki dinamik listede filtreler"
                                  >
                                    <Filter className="w-3 h-3 mr-1" />
                                    {isGroupFiltered ? 'Filtrelendi' : 'Filtrele'}
                                  </Button>

                                  {/* Aç/Kapa İkonu */}
                                  <div className="text-muted-foreground p-1 hover:text-foreground">
                                    <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isGroupOpen && "rotate-180")} />
                                  </div>
                                </div>

                              </div>

                              {/* İÇ İÇE AÇILAN ALT DENETİM BARLARI */}
                              {isGroupOpen && (
                                <div className="p-2 sm:p-3 bg-muted/20 border-t border-border/60 space-y-1.5 animate-in slide-in-from-top-1 duration-150">
                                  {group.items.map(subItem => {
                                    const subStats = getSubItemStats(hosp.hospitalId, subItem.key);
                                    const isSubFiltered = selectedSheetFilter === subItem.key && selectedFacilityId === hosp.hospitalId;
                                    const SubIcon = subItem.icon;

                                    return (
                                      <div
                                        key={subItem.key}
                                        onClick={() => handleSelectSheetFilter(isSubFiltered ? 'ALL' : subItem.key, hosp.hospitalId)}
                                        className={cn(
                                          "flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 rounded-lg border text-xs transition-all cursor-pointer select-none group/sub",
                                          isSubFiltered 
                                            ? "bg-primary/10 border-primary text-primary shadow-xs ring-1 ring-primary/20" 
                                            : "bg-background hover:bg-muted/60 border-border/70 text-foreground"
                                        )}
                                      >
                                        
                                        {/* Sol: İkon + Alt Başlık Adı + Seçili Düzeydeki Sayı */}
                                        <div className="flex items-center gap-2 min-w-0 sm:w-64">
                                          <SubIcon className={cn("w-3.5 h-3.5 shrink-0", isSubFiltered ? "text-primary" : "text-muted-foreground group-hover/sub:text-primary")} />
                                          <span className="font-semibold truncate">
                                            {subItem.name}
                                          </span>
                                          {hasStatusFilter ? (
                                            <span className="text-[10px] font-mono text-muted-foreground shrink-0 font-medium">
                                              ({subStats.matchingFilterCount} {selectedRiskFilter !== 'ALL' ? (selectedRiskFilter === 'OLASI_ONEMSIZ' ? 'Olası' : selectedRiskFilter) : ''} {selectedStatuses.join('+')})
                                            </span>
                                          ) : selectedRiskFilter !== 'ALL' ? (
                                            <span className="text-[10px] font-mono text-muted-foreground shrink-0 font-medium">
                                              ({subStats.total} {selectedRiskFilter === 'OLASI_ONEMSIZ' ? 'Olası' : selectedRiskFilter})
                                            </span>
                                          ) : null}
                                        </div>

                                        {/* Orta: Alt İlerleme Çubuğu veya Eşleşen Sayı */}
                                        {hasStatusFilter ? (
                                          <div className="flex-1 max-w-xs w-full text-center">
                                            <span className="text-[10px] font-mono text-muted-foreground">
                                              Eşleşen: <strong className="text-foreground font-bold">{subStats.matchingFilterCount}</strong> Bulgu
                                            </span>
                                          </div>
                                        ) : (
                                          <div className="flex-1 max-w-xs w-full space-y-1">
                                            <div className="flex items-center justify-between text-[11px] font-mono">
                                              <span className="text-muted-foreground text-[10px]">
                                                {selectedRiskFilter !== 'ALL' ? `${selectedRiskFilter} İlerlemesi` : 'Tamamlanma'}
                                              </span>
                                              <span className="font-bold">%{subStats.progress}</span>
                                            </div>
                                            <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                                              <div 
                                                className={cn(
                                                  "h-full rounded-full transition-all", 
                                                  subStats.progress === 100 
                                                    ? "bg-emerald-500" 
                                                    : selectedRiskFilter === 'Kritik'
                                                    ? "bg-red-500"
                                                    : group.barColor
                                                )}
                                                style={{ width: `${Math.min(100, Math.max(0, subStats.progress))}%` }}
                                              />
                                            </div>
                                          </div>
                                        )}

                                        {/* Sağ: Üçlü Dağılım veya Filtrelenmiş Sayı + Durum Rozeti + Link */}
                                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto font-mono text-[11px]">
                                          {hasStatusFilter ? (
                                            <div className="font-mono text-xs font-bold text-foreground bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                                              <span>{subStats.matchingFilterCount} Bulgu</span>
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-1 font-bold">
                                              <span className="text-amber-600 dark:text-amber-400" title="Başlamadı">{subStats.notStarted}</span>
                                              <span className="text-muted-foreground/40 font-normal">/</span>
                                              <span className="text-blue-600 dark:text-blue-400" title="Devam">{subStats.inProgress}</span>
                                              <span className="text-muted-foreground/40 font-normal">/</span>
                                              <span className="text-emerald-600 dark:text-emerald-400" title="Tamam">{subStats.completed}</span>
                                              <span className="text-foreground ml-1.5 font-bold">({subStats.total})</span>
                                            </div>
                                          )}

                                          <Badge 
                                            variant={isSubFiltered ? "default" : "outline"}
                                            className={cn("text-[10px] px-2 py-0 cursor-pointer", isSubFiltered && "bg-primary text-primary-foreground font-semibold")}
                                          >
                                            {isSubFiltered ? 'Tabloda Gösteriliyor' : 'Tabloda Filtrele'}
                                          </Badge>

                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              navigate(subItem.path);
                                            }}
                                            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                                            title="İlgili takip sekmesine git"
                                          >
                                            <ExternalLink className="w-3 h-3" />
                                          </button>
                                        </div>

                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                            </div>
                          );
                        })}
                      </div>

                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

        {/* Panel Dipnotu & Filtreleri Sıfırla Linki */}
        <div className="p-4 px-6 border-t bg-muted/20 text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>{filteredHospitals.length} hastane listelendi (Toplam {allAuthorizedHospitals.length} kayıtlı)</span>
          <div className="flex items-center gap-3">
            <span className="font-mono">{records.length} toplam bulgu • {kpiData.critical.total} kritik risk</span>
            {hasAnyFilterActive && (
              <button 
                onClick={handleClearAllFilters}
                className="text-xs text-primary font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Filtreleri Sıfırla
              </button>
            )}
          </div>
        </div>
      </div>
    ) : (
      <div className="p-4 px-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2 bg-muted/10 border-t border-border/60">
        <Building2 className="w-3.5 h-3.5 text-muted-foreground/60" />
        <span>Hastane detay listesi kapalı ({filteredHospitals.length} Tesis). Görüntülemek için yukarıdaki <strong>Listeyi Aç</strong> butonuna tıklayabilirsiniz.</span>
      </div>
    )}

  </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. DİNAMİK YÖNETİCİ TABLOSU (IMPROVEMENT TABLE ENTEGRASYONU)         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div ref={tableSectionRef} className="space-y-3 pt-2">
        
        {/* Tablo Üst Kontrol & Canlı Filtre Rozetleri */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold shrink-0">
              <ListOrdered className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                  {selectedRiskFilter === 'ALL' ? 'Tüm Risk Seviyeleri' : (selectedRiskFilter === 'OLASI_ONEMSIZ' ? 'Olası ve Önemsiz Risk' : `${selectedRiskFilter} Risk`)}
                  {hasStatusFilter ? ` • ${selectedStatuses.join(' + ')}` : ''} Bulgular Listesi
                </h3>
                <Badge variant="outline" className="font-mono text-xs font-bold">
                  {filteredRecordsForTable.length} Kayıt Gösteriliyor
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Yukarıda seçtiğiniz hastane, risk seviyesi ve denetim başlığına göre canlı filtrelenmiş liste
              </p>
            </div>
          </div>

          {/* Aktif Filtre Rozetleri & Sıfırla Butonu */}
          <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
            {/* Durum Rozetleri */}
            {hasStatusFilter && selectedStatuses.map(status => (
              <span 
                key={status}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border",
                  status === 'Başlamadı' && "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
                  status === 'Devam Ediyor' && "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
                  status === 'Tamamlandı' && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                )}
              >
                <span>Durum: {status}</span>
                <button 
                  onClick={() => toggleStatusFilter(selectedRiskFilter, status)}
                  className="ml-0.5 hover:opacity-80 cursor-pointer"
                  title={`${status} durum filtresini kaldır`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {/* Risk Rozeti */}
            {selectedRiskFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                <span>Risk: {selectedRiskFilter}</span>
                <button 
                  onClick={() => setSelectedRiskFilter('ALL')}
                  className="hover:text-red-800 ml-0.5 cursor-pointer"
                  title="Risk filtresini kaldır, tüm riskleri göster"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Hastane / Tesis Rozeti */}
            {selectedFacilityIds.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <span>Tesis: {currentFocusHospitalName}</span>
                <button 
                  onClick={clearFacilitySelection}
                  className="hover:text-primary/80 ml-0.5 cursor-pointer"
                  title="Tesis filtresini kaldır, tüm hastaneleri göster"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Denetim Başlığı Rozeti */}
            {selectedSheetFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                <span>Başlık: {getSheetDisplayName(selectedSheetFilter)}</span>
                <button 
                  onClick={() => setSelectedSheetFilter('ALL')}
                  className="hover:text-indigo-800 ml-0.5 cursor-pointer"
                  title="Başlık filtresini kaldır, tüm başlıkları göster"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* En Sonda Temizle Butonu */}
            {hasAnyFilterActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAllFilters}
                className="text-xs h-8 text-destructive hover:bg-destructive/10 border-destructive/30 cursor-pointer"
                title="Tüm filtreleri temizle ve toplam görünüme dön"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Filtreleri Temizle
              </Button>
            )}
          </div>
        </div>

        {/* Zenginleştirilmiş Ortak Tablo Bileşeni */}
        <ImprovementTable
          records={filteredRecordsForTable}
          loading={loadingRecords}
          sheetTitle="Yonetici_Ozeti_Bulgular"
          sheetType="EXECUTIVE"
          onRefresh={() => {
            fetchStats();
            fetchRecords();
          }}
          selectedFacilityId={selectedFacilityId}
          facilities={facilities}
        />
      </div>

    </div>
  );
};

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { useActiveFacility } from '@/hooks/useActiveFacility';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Flame, 
  Plus, 
  Settings, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Building2, 
  ArrowRight,
  Database,
  Sparkles,
  ClipboardList,
  Eye,
  Pencil,
  Trash2,
  Printer,
  ChevronDown,
  ChevronUp,
  MessageSquarePlus,
  Upload,
  Paperclip,
  X,
  Maximize2,
  Image as ImageIcon,
  BarChart3,
  Building,
  Layers,
  CheckCircle,
  ShieldAlert,
  PieChart,
  TrendingUp,
  Filter,
  CheckCircle as CheckCircleIcon,
  CircleDot
} from 'lucide-react';
import { toast } from 'sonner';
import { calculateItemProgress } from './FireSafetyAuditPage';

export default function FireSafetyDashboard() {
  const facilityId = useActiveFacility();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [deleteAuditId, setDeleteAuditId] = useState<string | null>(null);

  // Genişletilmiş Tutanak Maddeleri Aç/Kapa
  const [expandedAuditIds, setExpandedAuditIds] = useState<Record<string, boolean>>({});

  // Dashboard Hızlı Aksiyon Modalı State'i
  const [quickActionItem, setQuickActionItem] = useState<{
    item: any;
    auditTitle: string;
  } | null>(null);
  const [quickDesc, setQuickDesc] = useState('');
  const [quickDoneBy, setQuickDoneBy] = useState('');
  const [quickDepartment, setQuickDepartment] = useState('');
  const [quickStatus, setQuickStatus] = useState('Tamamlandı');
  const [quickFiles, setQuickFiles] = useState<string[]>([]);
  const [uploadingQuickFile, setUploadingQuickFile] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);

  const isManager = Boolean(
    user?.isAdmin || 
    user?.isManagement || 
    user?.roles?.includes('admin') || 
    user?.roles?.includes('management')
  );

  const globalFacId = facilityId || localStorage.getItem('activeFacilityId') || '';
  // Yönetici ise ve seçili tesis yoksa varsayılan 'all', normal kullanıcı ise seçili tesis
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(() => {
    if (globalFacId) return globalFacId;
    if (isManager) return 'all';
    return '';
  });

  // Settings
  const { data: settingsData } = useQuery({
    queryKey: ['fire-safety-settings'],
    queryFn: async () => {
      const res = await api.get('/fire-safety-control/settings/all');
      if (!res.ok) return null;
      return res.json();
    }
  });

  const getArray = (field: any, defaults: string[] = []): string[] => {
    if (!field) return defaults;
    if (Array.isArray(field)) {
      return field.map(item => (typeof item === 'string' ? item : item.name || '')).filter(Boolean);
    }
    return defaults;
  };

  const responsiblesList = getArray(settingsData?.responsibles, [
    'Teknik Hizmetler – Hastane',
    'Teknik Hizmetler – Merkez',
    'Teknik Hizmetler & İSG – Hastane',
    'Satın Alma Direktörlüğü',
    'Dizayn Yöneticisi & Satınalma',
    'Merkez Satın Alma & Mimar'
  ]);

  // Tesis listesini getir
  const { data: facilities = [] } = useQuery({
    queryKey: ['facilities'],
    queryFn: async () => {
      const res = await api.get('/settings/facilities');
      if (!res.ok) return [];
      return res.json();
    }
  });

  // Etkin sorgu tesis parametresi
  const effectiveFacId = selectedFacilityId || (isManager ? 'all' : globalFacId);

  // Tutanakları getir
  const { data: audits = [], isLoading } = useQuery({
    queryKey: ['fire-safety-audits', effectiveFacId],
    queryFn: async () => {
      if (!effectiveFacId) return [];
      const res = await api.get(`/fire-safety-control?facilityId=${effectiveFacId}`);
      if (!res.ok) throw new Error('Tutanaklar yüklenemedi');
      return res.json();
    },
    enabled: !!effectiveFacId
  });

  const currentFacility = facilities.find((f: any) => f.id === effectiveFacId);

  // Silme mutasyonu
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/fire-safety-control/${id}`);
      if (!res.ok) throw new Error('Tutanak silinemedi');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fire-safety-audits'] });
      toast.success('Toplantı tutanağı başarıyla silindi');
      setDeleteAuditId(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Silme işlemi sırasında hata oluştu');
    }
  });

  // Aç/Kapat kontrolü
  const toggleExpandAudit = (auditId: string) => {
    setExpandedAuditIds(prev => ({
      ...prev,
      [auditId]: !prev[auditId]
    }));
  };

  // Dashboard'dan Hızlı Aksiyon Aç
  const handleOpenQuickAction = (item: any, auditTitle: string) => {
    setQuickActionItem({ item, auditTitle });
    setQuickDesc('');
    setQuickDoneBy(user?.fullName || user?.username || '');

    const firstResp = item.responsible ? item.responsible.split(',')[0].trim() : '';
    setQuickDepartment(firstResp);

    setQuickStatus('Tamamlandı');
    setQuickFiles([]);
  };

  // Dashboard Hızlı Aksiyon Kanıt Dosyası Yükleme
  const handleFileUploadQuickAction = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const targetFacId = quickActionItem?.item?.audit?.facilityId || effectiveFacId || 'general';

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      setUploadingQuickFile(true);
      const res = await api.post(`/fire-safety-control/upload?facilityId=${targetFacId}`, formData);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Yükleme başarısız');

      const uploadedUrls = data.map((f: any) => f.url);
      setQuickFiles(prev => [...prev, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} kanıt belgesi eklendi`);
    } catch (err: any) {
      toast.error(err.message || 'Dosya yüklenirken hata oluştu');
    } finally {
      setUploadingQuickFile(false);
      e.target.value = '';
    }
  };

  // Dashboard Hızlı Aksiyon Kaydet
  const handleSubmitQuickAction = async () => {
    if (!quickDesc.trim()) {
      toast.error('Lütfen yapılan işlem açıklamasını girin');
      return;
    }
    if (!quickActionItem?.item?.id) return;

    try {
      setSubmittingAction(true);
      const performedByText = quickDepartment
        ? (quickDoneBy ? `${quickDoneBy} (${quickDepartment})` : quickDepartment)
        : (quickDoneBy || 'Yetkili');

      const res = await api.post(`/fire-safety-control/items/${quickActionItem.item.id}/actions`, {
        explanation: quickDesc,
        performedBy: performedByText,
        department: quickDepartment,
        evidencePhotos: quickFiles,
        status: quickStatus,
        actionDate: new Date().toISOString()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Aksiyon kaydedilemedi');

      toast.success(`Madde #${quickActionItem.item.orderNo} için aksiyon başarıyla eklendi!`);
      queryClient.invalidateQueries({ queryKey: ['fire-safety-audits'] });
      setQuickActionItem(null);
    } catch (err: any) {
      toast.error(err.message || 'Hata oluştu');
    } finally {
      setSubmittingAction(false);
    }
  };

  // İstatistik hesaplamaları
  const allItems = audits.flatMap((a: any) => a.items || []);
  const totalFindings = allItems.length;
  const completedCount = allItems.filter((i: any) => i.status === 'TAMAMLANDI' || i.status === 'COMPLETED').length;
  const inProgressCount = allItems.filter((i: any) => i.status === 'DEVAM_EDIYOR' || i.status === 'IN_PROGRESS').length;
  const openCount = allItems.filter((i: any) => i.status === 'ACIK' || i.status === 'OPEN').length;
  const totalEvidenceCount = allItems.reduce((acc: number, item: any) => acc + (item.actions?.length || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="outline" className="border-amber-400 text-amber-600 bg-amber-50">Taslak</Badge>;
      case 'DEVAM_EDIYOR':
      case 'IN_PROGRESS':
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-semibold">Devam Ediyor</Badge>;
      case 'TAMAMLANDI':
      case 'COMPLETED':
        return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">Tamamlandı</Badge>;
      case 'ARSIV':
      case 'ARCHIVED':
        return <Badge variant="secondary">Arşiv</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Kategori Bazlı İstatistik Hesaplamaları
  const categoryStats = React.useMemo(() => {
    const map: Record<string, { total: number; completed: number; inProgress: number; open: number }> = {};

    allItems.forEach((item: any) => {
      const cats = (item.category || 'Genel Yangın Güvenliği')
        .split(',')
        .map((c: string) => c.trim())
        .filter(Boolean);

      const status = (item.status || '').toUpperCase();
      const isComp = status === 'TAMAMLANDI' || status === 'COMPLETED';
      const isProg = status === 'DEVAM_EDIYOR' || status === 'IN_PROGRESS';

      cats.forEach((cat: string) => {
        if (!map[cat]) {
          map[cat] = { total: 0, completed: 0, inProgress: 0, open: 0 };
        }
        map[cat].total += 1;
        if (isComp) {
          map[cat].completed += 1;
        } else if (isProg) {
          map[cat].inProgress += 1;
        } else {
          map[cat].open += 1;
        }
      });
    });

    return Object.entries(map).map(([name, stat]) => {
      const pct = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
      const inProgPct = stat.total > 0 ? Math.round((stat.inProgress / stat.total) * 100) : 0;
      const openPct = stat.total > 0 ? Math.round((stat.open / stat.total) * 100) : 0;
      return { name, ...stat, pct, inProgPct, openPct };
    }).sort((a, b) => b.total - a.total);
  }, [allItems]);

  // Tesis Bazlı İstatistik Hesaplamaları (Tüm Tesisler görünümü için)
  const facilityStats = React.useMemo(() => {
    const map: Record<string, { name: string; auditsCount: number; total: number; completed: number; inProgress: number; open: number }> = {};

    audits.forEach((audit: any) => {
      const fId = audit.facilityId || 'unknown';
      const fName = audit.facility?.name || facilities.find((f: any) => f.id === fId)?.name || 'Bilinmeyen Tesis';

      if (!map[fId]) {
        map[fId] = { name: fName, auditsCount: 0, total: 0, completed: 0, inProgress: 0, open: 0 };
      }
      map[fId].auditsCount += 1;

      const items = audit.items || [];
      items.forEach((item: any) => {
        map[fId].total += 1;
        const status = (item.status || '').toUpperCase();
        if (status === 'TAMAMLANDI' || status === 'COMPLETED') {
          map[fId].completed += 1;
        } else if (status === 'DEVAM_EDIYOR' || status === 'IN_PROGRESS') {
          map[fId].inProgress += 1;
        } else {
          map[fId].open += 1;
        }
      });
    });

    return Object.entries(map).map(([id, stat]) => {
      const pct = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
      const inProgPct = stat.total > 0 ? Math.round((stat.inProgress / stat.total) * 100) : 0;
      const openPct = stat.total > 0 ? Math.round((stat.open / stat.total) * 100) : 0;
      return { id, ...stat, pct, inProgPct, openPct };
    }).sort((a, b) => b.total - a.total);
  }, [audits, facilities]);

  // Eğer kullanıcı yönetici değilse ve seçili tesis de yoksa uyarı göster
  if (!effectiveFacId && !isManager) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 m-6">
        <Building2 className="w-16 h-16 text-slate-400 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Lütfen Bir Tesis Seçin</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md">
          Yangın Güvenliği Kontrol Sistemi verilerini ve tutanaklarını görüntülemek için sol menüden aktif tesisi seçiniz.
        </p>
      </div>
    );
  }

  const isAllFacilities = effectiveFacId === 'all';
  const overallSuccessRate = totalFindings > 0 ? Math.round((completedCount / totalFindings) * 100) : 0;
  const overallInProgressRate = totalFindings > 0 ? Math.round((inProgressCount / totalFindings) * 100) : 0;
  const overallOpenRate = totalFindings > 0 ? Math.round((openCount / totalFindings) * 100) : 0;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 p-6 md:p-8 rounded-2xl text-white shadow-lg">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
            <Flame className="w-4 h-4 text-amber-300" />
            {isManager ? 'Yönetici Dashboard’u' : 'Operasyon Yönetimi'}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Yangın Güvenliği Kontrol Sistemi
          </h1>
          <p className="text-red-100 max-w-2xl text-sm md:text-base">
            {isAllFacilities 
              ? 'Tüm tesisler genelinde yangın güvenliği denetimleri, kategori durumları, tamamlanma oranları ve aksiyon takibi.'
              : `${currentFacility?.name || 'Seçili Tesis'} bünyesindeki yangın güvenliği denetimleri, itfaiye kontrolleri, tespitler ve aksiyon takibi.`
            }
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isManager && (
            <Button
              variant="outline"
              onClick={() => navigate('/fire-safety-control/settings')}
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm shadow-sm"
            >
              <Settings className="w-4 h-4 mr-2" />
              Modül Ayarları
            </Button>
          )}

          <Button
            onClick={() => navigate('/fire-safety-control/audit/new')}
            className="bg-white text-red-600 hover:bg-red-50 font-semibold shadow-md"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Tutanak / Denetim
          </Button>
        </div>
      </div>

      {/* Yönetici Tesis Filtre Çubuğu (Yöneticiler için Tüm Tesisler ve Tekil Tesis Seçimi) */}
      {isManager && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Yönetici Görünümü</div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {isAllFacilities ? 'Tüm Tesislerin Konsolide Durumu' : `${currentFacility?.name} Denetim Durumu`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Tesis Filtresi:</span>
            <select
              value={effectiveFacId}
              onChange={e => setSelectedFacilityId(e.target.value)}
              className="text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-red-500 outline-hidden"
            >
              <option value="all">🏢 Tüm Tesisler (Konsolide Yönetici Özeti)</option>
              {facilities.map((f: any) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Toplam Tutanak</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{audits.length}</h3>
              {isAllFacilities && (
                <p className="text-[11px] text-slate-400 mt-0.5">{facilityStats.length} farklı tesiste</p>
              )}
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
              <ClipboardList className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Toplam Tespit</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{totalFindings}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Madde kayıtlı</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Tamamlanan</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{completedCount}</h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">%{overallSuccessRate} Başarı</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Devam Eden</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">{inProgressCount}</h3>
              <p className="text-[11px] text-amber-600 font-semibold mt-0.5">%{overallInProgressRate} Süreçte</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Bekleyen</p>
              <h3 className="text-2xl font-bold text-red-600 mt-1">{openCount}</h3>
              <p className="text-[11px] text-red-500 font-semibold mt-0.5">%{overallOpenRate} Bekliyor</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GENEL İLERLEME & BAŞARI ÇUBUĞU */}
      {totalFindings > 0 && (
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {isAllFacilities ? 'Tüm Tesisler Genel Başarı ve Tamamlanma Durumu' : 'Tesis Genel Başarı ve Tamamlanma Durumu'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold">
                <span className="text-emerald-600 flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  {completedCount} Tamamlanan (%{overallSuccessRate})
                </span>
                <span className="text-amber-600 flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  {inProgressCount} Devam Eden (%{overallInProgressRate})
                </span>
                <span className="text-red-500 flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  {openCount} Bekliyor (%{overallOpenRate})
                </span>
              </div>
            </div>

            <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden flex shadow-inner">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${overallSuccessRate}%` }}
                title={`Tamamlandı: ${completedCount} madde (%${overallSuccessRate})`}
              />
              <div
                className="bg-amber-500 h-full transition-all duration-500"
                style={{ width: `${overallInProgressRate}%` }}
                title={`Devam Ediyor: ${inProgressCount} madde (%${overallInProgressRate})`}
              />
              <div
                className="bg-red-500 h-full transition-all duration-500"
                style={{ width: `${overallOpenRate}%` }}
                title={`Bekliyor: ${openCount} madde (%${overallOpenRate})`}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* YÖNETİCİ GÖRÜNÜMÜ: TÜM TESİSLERİN DURUMLARI (TESİS BAZINDA KARŞILAŞTIRMA) */}
      {(isAllFacilities || isManager) && facilityStats.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-red-600" />
                Tüm Tesislerin Yangın Güvenliği Durumları
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tesis bazında kayıtlı tutanak sayısı, tespitler, tamamlanan / devam eden / bekleyen dağılımı ve başarı yüzdeleri
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {facilityStats.map(stat => (
              <Card
                key={stat.id}
                onClick={() => setSelectedFacilityId(stat.id)}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md border ${
                  effectiveFacId === stat.id 
                    ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/10' 
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1 flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-slate-500 shrink-0" />
                      {stat.name}
                    </CardTitle>
                    <Badge variant="outline" className="text-[11px] font-semibold">
                      {stat.auditsCount} Tutanak
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-1 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-500 font-medium">Toplam Tespit:</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{stat.total} Madde</span>
                  </div>

                  {/* Çok Renkli İlerleme Çubuğu */}
                  <div className="space-y-1">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full transition-all"
                        style={{ width: `${stat.pct}%` }}
                        title={`Tamamlandı: %${stat.pct}`}
                      />
                      <div
                        className="bg-amber-500 h-full transition-all"
                        style={{ width: `${stat.inProgPct}%` }}
                        title={`Devam Ediyor: %${stat.inProgPct}`}
                      />
                      <div
                        className="bg-red-500 h-full transition-all"
                        style={{ width: `${stat.openPct}%` }}
                        title={`Bekliyor: %${stat.openPct}`}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] font-bold pt-1">
                      <span className="text-emerald-600">{stat.completed} Tamamlandı</span>
                      <span className="text-amber-600">{stat.inProgress} Devam</span>
                      <span className="text-red-500">{stat.open} Bekliyor</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Tamamlanma Oranı:</span>
                    <span className="text-xs font-extrabold text-emerald-600">%{stat.pct}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* KATEGORİYE GÖRE DURUM ANALİZİ (CATEGORY BREAKDOWN) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-600" />
              Kategoriye Göre Durum Dökümü (Devam Eden / Tamamlanan / Bekleyen)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Yangın güvenliği kategorilerine göre maddelerin mevcut dağılımı ve başarı yüzdeleri
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1 self-start sm:self-auto">
            {categoryStats.length} Kategori
          </Badge>
        </div>

        {categoryStats.length === 0 ? (
          <Card className="border-dashed border border-slate-200 dark:border-slate-800">
            <CardContent className="p-8 text-center text-xs text-slate-500">
              Henüz kategori bazlı kayıtlı tespit maddesi bulunmamaktadır.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryStats.map(cat => (
              <Card key={cat.name} className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:shadow-sm transition-all">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
                      {cat.name}
                    </CardTitle>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                      {cat.total} Madde
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2 space-y-3">
                  {/* Katmanlı İlerleme Çubuğu */}
                  <div className="space-y-1.5">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${cat.pct}%` }}
                        title={`Tamamlandı: ${cat.completed} madde (%${cat.pct})`}
                      />
                      <div
                        className="bg-amber-500 h-full transition-all duration-300"
                        style={{ width: `${cat.inProgPct}%` }}
                        title={`Devam Ediyor: ${cat.inProgress} madde (%${cat.inProgPct})`}
                      />
                      <div
                        className="bg-red-500 h-full transition-all duration-300"
                        style={{ width: `${cat.openPct}%` }}
                        title={`Bekliyor: ${cat.open} madde (%${cat.openPct})`}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-emerald-600 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        {cat.completed} Tamamlandı
                      </span>
                      <span className="text-amber-600 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        {cat.inProgress} Devam
                      </span>
                      <span className="text-red-500 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        {cat.open} Bekliyor
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Başarı / Tamamlanma:</span>
                    <span className="font-extrabold text-emerald-600">%{cat.pct}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>



      {/* Tutanaklar ve Timeline (Zaman Çizelgesi) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-600" />
              Tutanak Takvimi & Aksiyon Zaman Çizelgesi (Timeline)
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Maddelerin toplantıdan toplantıya devreden aksiyon barları ve % tamamlanma oranları
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : audits.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800">
            <CardContent className="p-12 text-center space-y-4">
              <Flame className="w-12 h-12 text-slate-400 mx-auto" />
              <div>
                <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200">Henüz Kayıtlı Tutanak Yok</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                  Bu tesis için yeni bir yangın denetim tutanağı oluşturarak saha tespitlerini ve aksiyon süreçlerini takip edebilirsiniz.
                </p>
              </div>
              <Button
                onClick={() => navigate('/fire-safety-control/audit/new')}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                İlk Tutanağı Başlat
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 md:ml-6 pl-4 md:pl-8 space-y-6">
            {audits.map((audit: any, aIndex: number) => {
              const auditItems = audit.items || [];
              const completed = auditItems.filter((i: any) => i.status === 'TAMAMLANDI' || i.status === 'COMPLETED').length;
              const inProgress = auditItems.filter((i: any) => i.status === 'DEVAM_EDIYOR' || i.status === 'IN_PROGRESS').length;
              const open = auditItems.filter((i: any) => i.status === 'ACIK' || i.status === 'OPEN').length;
              const progressPct = auditItems.length > 0 ? Math.round((completed / auditItems.length) * 100) : 0;
              const inProgressPct = auditItems.length > 0 ? Math.round((inProgress / auditItems.length) * 100) : 0;
              const openPct = auditItems.length > 0 ? Math.round((open / auditItems.length) * 100) : 0;

              return (
                <div key={audit.id} className="relative group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[25px] md:-left-[41px] top-6 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-4 border-red-600 shadow-xs group-hover:scale-110 transition-transform" />

                  <Card className="hover:shadow-md transition-all duration-200 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <CardHeader className="p-4 md:p-5 pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(audit.auditDate).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {audit.facility?.name || currentFacility?.name}
                          </span>
                        </div>
                        {getStatusBadge(audit.status)}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                        <div>
                          <CardTitle className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-red-600 transition-colors">
                            {audit.title}
                          </CardTitle>
                          <CardDescription className="text-xs text-slate-500 mt-0.5">
                            {audit.subtitle || audit.topic || 'Toplantı ve denetim tutanağı detayı.'}
                          </CardDescription>
                        </div>

                        {/* Aksiyon Butonları */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/fire-safety-control/audit/${audit.id}?mode=view`)}
                            className="text-xs h-8 px-3 flex items-center gap-1 text-slate-700 dark:text-slate-300"
                            title="Toplantı Tutanağını İncele ve Yazdır"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            Görüntüle (Baskı)
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/fire-safety-control/audit/${audit.id}?mode=edit`)}
                            className="text-xs h-8 px-3 flex items-center gap-1 text-slate-700 dark:text-slate-300"
                            title="Tutanak ve Aksiyonları Düzenle"
                          >
                            <Pencil className="w-3.5 h-3.5 text-amber-600" />
                            Düzenle & Aksiyon
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteAuditId(audit.id)}
                            className="text-xs h-8 px-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                            title="Tutanağı Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 md:p-5 pt-0 space-y-3">
                      {/* Timeline Aksiyon Çubukları ve İlerleme Oranı */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              Maddelerin Aksiyon Tamamlanma Durumu:
                            </span>
                            <div className="flex items-center gap-3 text-[11px]">
                              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                {completed} Tamamlandı (%{progressPct})
                              </span>
                              <span className="flex items-center gap-1 text-amber-600 font-semibold">
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                                {inProgress} Devam Ediyor (%{inProgressPct})
                              </span>
                              <span className="flex items-center gap-1 text-red-500 font-semibold">
                                <span className="w-2 h-2 rounded-full bg-red-500" />
                                {open} Bekliyor (%{openPct})
                              </span>
                            </div>
                          </div>

                          <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                            %{progressPct} Tamamlandı
                          </span>
                        </div>

                        {/* Çok Katmanlı Aksiyon İlerleme Çubuğu */}
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden flex">
                          <div 
                            className="bg-emerald-500 h-full transition-all duration-500"
                            style={{ width: `${progressPct}%` }}
                            title={`Tamamlandı: ${completed} madde (%${progressPct})`}
                          />
                          <div 
                            className="bg-amber-500 h-full transition-all duration-500"
                            style={{ width: `${inProgressPct}%` }}
                            title={`Devam Ediyor: ${inProgress} madde (%${inProgressPct})`}
                          />
                          <div 
                            className="bg-red-500 h-full transition-all duration-500"
                            style={{ width: `${openPct}%` }}
                            title={`Bekliyor: ${open} madde (%${openPct})`}
                          />
                        </div>

                        {/* Maddeleri ve Hızlı Aksiyonları Aç/Kapat Butonu */}
                        <div className="pt-2 flex justify-between items-center border-t border-slate-200/60 dark:border-slate-800">
                          <span className="text-[11px] text-slate-500 font-medium">
                            {auditItems.length} Tespit Maddesi Kayıtlı
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpandAudit(audit.id)}
                            className="text-xs h-7 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 flex items-center gap-1 font-semibold"
                          >
                            {expandedAuditIds[audit.id] ? (
                              <>
                                <ChevronUp className="w-3.5 h-3.5" />
                                Maddeleri ve Hızlı Aksiyonları Gizle
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3.5 h-3.5" />
                                Maddeleri Listele & Hızlı Aksiyon Gir ({auditItems.length})
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Genişletilmiş Maddeler Listesi ve Doğrudan Dashboard'dan Hızlı Aksiyon Girişi */}
                      {expandedAuditIds[audit.id] && (
                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                            <span>Toplantı Tespit Maddeleri & Hızlı Müdahale</span>
                            <span className="text-[10px] text-slate-400 font-normal">Her maddeye anında aksiyon kaydı ekleyebilirsiniz</span>
                          </div>

                          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                            {auditItems.map((item: any) => {
                              const isCompleted = item.status === 'TAMAMLANDI' || item.status === 'COMPLETED';
                              const isInProgress = item.status === 'DEVAM_EDIYOR' || item.status === 'IN_PROGRESS';
                              const { percent: itemPct } = calculateItemProgress(item);

                              return (
                                <div
                                  key={item.id}
                                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-teal-400 transition-colors shadow-2xs"
                                >
                                  <div className="space-y-1.5 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="w-5 h-5 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-bold flex items-center justify-center text-[10px] border border-teal-300 dark:border-teal-800 shrink-0">
                                        {item.orderNo}
                                      </span>
                                      <span className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                                        {item.topic}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 pl-7 text-[11px] text-slate-500">
                                      {item.responsible && (
                                        <span className="text-teal-700 dark:text-teal-400 font-semibold px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800">
                                          {item.responsible}
                                        </span>
                                      )}
                                      {item.actions && item.actions.length > 0 ? (
                                        <span className="text-slate-500 font-medium">
                                          · {item.actions.length} aksiyon kaydı
                                        </span>
                                      ) : (
                                        <span className="text-slate-400 italic">
                                          · Henüz aksiyon girilmedi
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2.5 shrink-0 pl-7 sm:pl-0">
                                    {/* % Tamamlanma Rozeti */}
                                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                                      <div className="w-12 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                        <div
                                          className={`h-full ${itemPct === 100 ? 'bg-emerald-500' : itemPct > 0 ? 'bg-amber-500' : 'bg-red-500'}`}
                                          style={{ width: `${itemPct}%` }}
                                        />
                                      </div>
                                      <span className={`text-[10px] font-extrabold ${itemPct === 100 ? 'text-emerald-600' : itemPct > 0 ? 'text-amber-600' : 'text-red-500'}`}>
                                        %{itemPct}
                                      </span>
                                    </div>

                                    <Badge className={
                                      isCompleted
                                        ? 'bg-emerald-600 text-white font-semibold text-[10px]'
                                        : isInProgress
                                        ? 'bg-amber-500 text-white font-semibold text-[10px]'
                                        : 'bg-red-500 text-white font-semibold text-[10px]'
                                    }>
                                      {isCompleted ? 'Tamamlandı' : isInProgress ? 'Devam Ediyor' : 'Bekliyor'}
                                    </Badge>

                                    <Button
                                      size="sm"
                                      onClick={() => handleOpenQuickAction(item, audit.title)}
                                      className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 text-white text-[11px] h-7 px-2.5 shadow-2xs flex items-center gap-1"
                                      title="Dashboard üzerinden bu maddeye hızlı aksiyon ve kanıt ekleyin"
                                    >
                                      <MessageSquarePlus className="w-3 h-3 text-emerald-400" />
                                      + Hızlı Aksiyon Gir
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DASHBOARD HIZLI AKSİYON MODALI */}
      <Dialog open={!!quickActionItem} onOpenChange={open => !open && setQuickActionItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-slate-900 dark:text-slate-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Hızlı Aksiyon ve Kanıt Girişi
            </DialogTitle>
            <DialogDescription className="text-xs">
              {quickActionItem?.auditTitle} · Madde #{quickActionItem?.item?.orderNo}: {quickActionItem?.item?.topic?.slice(0, 60)}...
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Yapılan İşlem / Faaliyet Açıklaması *</label>
              <Textarea
                rows={3}
                value={quickDesc}
                onChange={e => setQuickDesc(e.target.value)}
                placeholder="Örn: Yetkili servis çağrıldı, eksiklik giderildi..."
                className="mt-1 text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">İşlemi Yapan / Giren Kişi</label>
              <Input
                value={quickDoneBy}
                onChange={e => setQuickDoneBy(e.target.value)}
                placeholder="İsim, Departman veya Firma"
                className="mt-1 text-xs h-8"
              />
            </div>

            {/* Sorumlu Departman Seçimi */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">İşlemi Yürüten / Sorumlu Departman</label>
              <select
                value={quickDepartment}
                onChange={e => setQuickDepartment(e.target.value)}
                className="mt-1 w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 font-medium text-teal-800 dark:text-teal-300 h-8"
              >
                {quickActionItem?.item?.responsible && (
                  <optgroup label="Bu Maddede Atanmış Sorumlular">
                    {quickActionItem.item.responsible.split(',').map((r: string) => r.trim()).filter(Boolean).map((r: string) => (
                      <option key={r} value={r}>★ {r}</option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Tüm Departmanlar">
                  {responsiblesList.map((r: string) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">İşlem Sonrası Maddenin Yeni Durumu</label>
              <select
                value={quickStatus}
                onChange={e => setQuickStatus(e.target.value)}
                className="mt-1 w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 font-bold h-8"
              >
                <option value="Tamamlandı">Tamamlandı (Yeşil)</option>
                <option value="Devam Ediyor">Devam Ediyor (Turuncu)</option>
                <option value="Başlamadı">Bekliyor (Kırmızı)</option>
              </select>
            </div>

            {/* Kanıt Belgeleri / Fotoğrafları Yükleme */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Kanıt Fotoğrafları / Belgeler</label>
                <label className="cursor-pointer text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  {uploadingQuickFile ? 'Yükleniyor...' : 'Kanıt Seç / Yükle'}
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileUploadQuickAction}
                    disabled={uploadingQuickFile}
                  />
                </label>
              </div>

              {quickFiles.length > 0 ? (
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1.5 border rounded-lg bg-slate-50 dark:bg-slate-800/40">
                  {quickFiles.map((fileUrl, fIdx) => (
                    <div key={fIdx} className="relative group w-14 h-14 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 shadow-2xs">
                      <img 
                        src={fileUrl} 
                        alt="Kanıt" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setQuickFiles(prev => prev.filter((_, i) => i !== fIdx))}
                        className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        title="Kaldır"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2.5 text-center border border-dashed rounded-lg text-xs text-slate-400">
                  Henüz kanıt belgesi eklenmedi.
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setQuickActionItem(null)}>İptal</Button>
            <Button
              size="sm"
              onClick={handleSubmitQuickAction}
              disabled={submittingAction}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {submittingAction ? 'Kaydediliyor...' : 'Aksiyonu Kaydet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteAuditId} onOpenChange={open => !open && setDeleteAuditId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Tutanağı Silmek İstiyor Musunuz?
            </DialogTitle>
            <DialogDescription className="text-sm">
              Bu tutanak ve içerisindeki tüm tespitler, aksiyon kayıtları ve kanıt fotoğrafları kalıcı olarak silinecektir. Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteAuditId(null)}>İptal</Button>
            <Button
              onClick={() => deleteAuditId && deleteMutation.mutate(deleteAuditId)}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending ? 'Siliniyor...' : 'Evet, Kalıcı Olarak Sil'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

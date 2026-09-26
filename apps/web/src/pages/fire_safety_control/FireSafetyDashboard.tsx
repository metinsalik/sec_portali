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
  CircleDot,
  Camera,
  Copy,
  Check,
  Activity,
  History
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
  const [quickProgressPercent, setQuickProgressPercent] = useState<number>(100);
  const [quickFiles, setQuickFiles] = useState<string[]>([]);
  const [uploadingQuickFile, setUploadingQuickFile] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);

  // Saha Kanıt Yükleme Sihirbazı (Field Evidence Wizard) State'i
  const [isFieldWizardOpen, setIsFieldWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [wizardFacilityId, setWizardFacilityId] = useState<string>('');
  const [wizardAuditId, setWizardAuditId] = useState<string>('');
  const [wizardSelectedCategory, setWizardSelectedCategory] = useState<string>('ALL');
  const [wizardItemId, setWizardItemId] = useState<string>('');
  const [wizardFiles, setWizardFiles] = useState<string[]>([]);
  const [uploadingWizardFiles, setUploadingWizardFiles] = useState(false);
  const [wizardExplanation, setWizardExplanation] = useState('');
  const [wizardDoneBy, setWizardDoneBy] = useState('');
  const [wizardDepartment, setWizardDepartment] = useState('');
  const [wizardProgressPercent, setWizardProgressPercent] = useState<number>(100);
  const [wizardStatus, setWizardStatus] = useState('Tamamlandı');
  const [submittingWizard, setSubmittingWizard] = useState(false);

  const isManager = Boolean(
    user?.isAdmin || 
    user?.isManagement || 
    user?.roles?.includes('admin') || 
    user?.roles?.includes('management')
  );

  const globalFacId = facilityId || localStorage.getItem('activeFacilityId') || '';
  const userFacilityIds = user?.facilities || [];
  const hasMultipleFacilities = isManager || userFacilityIds.length > 1;

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

  const categoriesList = getArray(settingsData?.categories, [
    'Yangın Kompartımanı & İzolasyon',
    'Elektrik & Pano Güvenliği',
    'Acil Durum Aydınlatma & Yönlendirme',
    'Kaçış Merdivenleri & Çıkışlar',
    'Algılama & Otomatik Söndürme',
    'İnşaat, Boya & Fiziki Alan Bakımı'
  ]);

  const sourcesList = getArray(settingsData?.sources, [
    'İtfaiye Denetim Raporu',
    'SEGEM Raporu',
    'İç Süreç',
    'Saha Turu',
    'Yasal Denetim'
  ]);

  // Seçili kategori filtresi (Dashboard'da tıklandığında maddeleri filtrelemek için)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  // Tesis listesini getir
  const { data: facilities = [] } = useQuery({
    queryKey: ['facilities'],
    queryFn: async () => {
      const res = await api.get('/settings/facilities');
      if (!res.ok) return [];
      return res.json();
    }
  });

  // Kullanıcının görebileceği tesisler listesi (Yönetici ise hepsi, değilse kullanıcının tanımlı tesisleri)
  const accessibleFacilities = React.useMemo(() => {
    if (isManager) return facilities;
    if (userFacilityIds.length === 0) return facilities;
    return facilities.filter((f: any) => userFacilityIds.includes(f.id));
  }, [facilities, userFacilityIds, isManager]);

  // Çoklu tesise sahipse (veya yönetici ise) varsayılan olarak 'all' (konsolide) başlar veya seçili olanı korur
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(() => {
    if (hasMultipleFacilities) return 'all';
    if (globalFacId) return globalFacId;
    return 'all';
  });

  // Etkin sorgu tesis parametresi
  const effectiveFacId = selectedFacilityId || (hasMultipleFacilities ? 'all' : (globalFacId || 'all'));

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
    setQuickProgressPercent(100);
    setQuickFiles([]);
  };

  // Dosya listesi yükleme fonksiyonu (Sürükle-bırak, Yapıştır, Dosya Seçici için ortak)
  const uploadQuickFilesGeneric = async (files: File[]) => {
    if (!files || files.length === 0) return;

    const targetFacId = quickActionItem?.item?.audit?.facilityId || effectiveFacId || 'general';
    const facObj = facilities.find((f: any) => f.id === targetFacId);
    const facNameParam = encodeURIComponent(facObj?.shortName || facObj?.name || '');

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      setUploadingQuickFile(true);
      const res = await api.post(`/fire-safety-control/upload?facilityId=${targetFacId}&facilityName=${facNameParam}`, formData);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Yükleme başarısız');

      const uploadedUrls = data.map((f: any) => f.url);
      setQuickFiles(prev => [...prev, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} kanıt belgesi eklendi`);
    } catch (err: any) {
      toast.error(err.message || 'Dosya yüklenirken hata oluştu');
    } finally {
      setUploadingQuickFile(false);
    }
  };

  // Dashboard Hızlı Aksiyon Kanıt Dosyası Yükleme (Input onChange)
  const handleFileUploadQuickAction = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await uploadQuickFilesGeneric(Array.from(files));
    e.target.value = '';
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
        progressPercent: quickProgressPercent,
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

  // SAHA KANIT YÜKLEME SİHİRBAZI AÇ
  const handleOpenFieldWizard = () => {
    const defaultFacId = effectiveFacId && effectiveFacId !== 'all' ? effectiveFacId : (facilities[0]?.id || '');
    setWizardFacilityId(defaultFacId);
    setWizardAuditId('');
    setWizardSelectedCategory('ALL');
    setWizardItemId('');
    setWizardFiles([]);
    setWizardExplanation('');
    setWizardDoneBy(user?.fullName || user?.username || '');
    setWizardDepartment('');
    setWizardStatus('Tamamlandı');
    setWizardProgressPercent(100);
    setWizardStep(1);
    setIsFieldWizardOpen(true);
  };

  // Saha Sihirbazı Dosya Listesi Yükleme (Sürükle-bırak, Yapıştır, Dosya Seçici ve Kamera için ortak)
  const uploadWizardFilesGeneric = async (files: File[]) => {
    if (!files || files.length === 0) return;

    const facObj = facilities.find((f: any) => f.id === wizardFacilityId);
    const facNameParam = encodeURIComponent(facObj?.shortName || facObj?.name || '');

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      setUploadingWizardFiles(true);
      const res = await api.post(`/fire-safety-control/upload?facilityId=${wizardFacilityId}&facilityName=${facNameParam}`, formData);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Yükleme başarısız');

      const uploadedUrls = data.map((f: any) => f.url);
      setWizardFiles(prev => [...prev, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} fotoğraf/kanıt başarıyla yüklendi`);
    } catch (err: any) {
      toast.error(err.message || 'Dosya yükleme hatası');
    } finally {
      setUploadingWizardFiles(false);
    }
  };

  // Saha Sihirbazı Dosya / Fotoğraf Yükleme (Input onChange)
  const handleWizardFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await uploadWizardFilesGeneric(Array.from(files));
    e.target.value = '';
  };

  // Saha Sihirbazı Tamamla ve Gönder
  const handleSubmitWizard = async () => {
    if (!wizardItemId) {
      toast.error('Lütfen bir tespit maddesi seçin');
      return;
    }
    if (!wizardExplanation.trim()) {
      toast.error('Lütfen sahada yapılan işlemi / açıklamayı girin');
      return;
    }

    try {
      setSubmittingWizard(true);
      const performedByText = wizardDepartment
        ? (wizardDoneBy ? `${wizardDoneBy} (${wizardDepartment})` : wizardDepartment)
        : (wizardDoneBy || 'Saha Sorumlusu');

      const res = await api.post(`/fire-safety-control/items/${wizardItemId}/actions`, {
        explanation: wizardExplanation,
        performedBy: performedByText,
        department: wizardDepartment,
        evidencePhotos: wizardFiles,
        status: wizardStatus,
        progressPercent: wizardProgressPercent,
        actionDate: new Date().toISOString()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'İşlem kaydedilemedi');

      toast.success('Saha kanıtı ve aksiyonu başarıyla sisteme işlendi!');
      queryClient.invalidateQueries({ queryKey: ['fire-safety-audits'] });
      setIsFieldWizardOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Saha kanıtı kaydedilirken hata oluştu');
    } finally {
      setSubmittingWizard(false);
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

  // Rapor Yaşam Döngüsü ve Olay Logları (Tarih bazlı kronolojik akış)
  const auditTimelineLogs = React.useMemo(() => {
    const logs: Array<{
      id: string;
      date: string;
      type: 'AUDIT_CREATED' | 'ACTION_LOG' | 'ITEM_ADDED';
      title: string;
      description: string;
      badgeText: string;
      badgeColor: string;
      auditId?: string;
      facilityName?: string;
    }> = [];

    audits.forEach((audit: any) => {
      const facName = audit.facility?.name || facilities.find((f: any) => f.id === audit.facilityId)?.name || '';
      const auditItems = audit.items || [];

      // 1. Tutanak Başlatılma / Oluşturulma Olayı
      if (audit.auditDate) {
        logs.push({
          id: `audit-${audit.id}`,
          date: audit.auditDate,
          type: 'AUDIT_CREATED',
          title: `${audit.title} Başlatıldı`,
          description: `${facName ? facName + ' tesisinde ' : ''}${auditItems.length} adet tespit maddesi ile denetim/toplantı kaydı açıldı.`,
          badgeText: `${auditItems.length} Tespit`,
          badgeColor: 'bg-blue-600 text-white',
          auditId: audit.id,
          facilityName: facName
        });
      }

      // 2. Aksiyon ve Kanıt Girişi Olayları (Tarih bazlı gruplama veya tekil)
      const actionDateMap: Record<string, { actionsCount: number; completedCount: number; inProgressCount: number; photosCount: number; sampleDesc: string }> = {};

      auditItems.forEach((item: any) => {
        (item.actions || []).forEach((act: any) => {
          const rawDate = act.actionDate || act.createdAt || audit.auditDate;
          const dateStr = rawDate ? new Date(rawDate).toISOString().split('T')[0] : 'Bilinmeyen Tarih';

          if (!actionDateMap[dateStr]) {
            actionDateMap[dateStr] = { actionsCount: 0, completedCount: 0, inProgressCount: 0, photosCount: 0, sampleDesc: act.explanation || '' };
          }
          actionDateMap[dateStr].actionsCount += 1;
          if (act.status === 'Tamamlandı') actionDateMap[dateStr].completedCount += 1;
          else if (act.status === 'Devam Ediyor') actionDateMap[dateStr].inProgressCount += 1;
          if (act.evidencePhotos?.length) actionDateMap[dateStr].photosCount += act.evidencePhotos.length;
        });
      });

      Object.entries(actionDateMap).forEach(([dateStr, stat]) => {
        logs.push({
          id: `actions-${audit.id}-${dateStr}`,
          date: dateStr,
          type: 'ACTION_LOG',
          title: `${audit.title} - Saha Müdahale & Aksiyon Takibi`,
          description: `${stat.actionsCount} aksiyon yürütüldü. ${stat.completedCount > 0 ? stat.completedCount + ' madde tamamlandı, ' : ''}${stat.inProgressCount > 0 ? stat.inProgressCount + ' madde devam ediyor. ' : ''}${stat.photosCount > 0 ? stat.photosCount + ' kanıt fotoğrafı yüklendi.' : ''}`,
          badgeText: `${stat.actionsCount} Aksiyon`,
          badgeColor: stat.completedCount > 0 ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white',
          auditId: audit.id,
          facilityName: facName
        });
      });
    });

    // Tarihe göre yeniden eskiye doğru sırala
    return logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
          {/* Saha Kanıt Yükleme Sihirbazı Butonu */}
          <Button
            onClick={handleOpenFieldWizard}
            className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold shadow-md border border-amber-300/60"
            title="Saha turundayken hızlıca kanıt yüklemek ve aksiyon girmek için sihirbazı başlatın"
          >
            <Sparkles className="w-4 h-4 mr-2 text-red-600" />
            Saha Kanıt Yükle (Wizard)
          </Button>

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

      {/* Çoklu Tesis veya Yönetici Tesis Filtre Çubuğu */}
      {hasMultipleFacilities && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {isManager ? 'Yönetici Görünümü' : 'Yetkili Tesisler Görünümü'}
              </div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {isAllFacilities 
                  ? (isManager ? 'Tüm Tesislerin Konsolide Durumu' : 'Sorumlu Olduğum Tesislerin Konsolide Durumu')
                  : `${currentFacility?.name || 'Seçili Tesis'} Denetim Durumu`
                }
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
              <option value="all">
                {isManager 
                  ? '🏢 Tüm Tesisler (Konsolide Yönetici Özeti)' 
                  : `🏢 Sorumlu Olduğum Tesisler (Konsolide Özet - ${accessibleFacilities.length} Tesis)`
                }
              </option>
              {accessibleFacilities.map((f: any) => (
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

      {/* TESİS BAZINDA KARŞILAŞTIRMA VE DURUMLAR (YÖNETİCİ VEYA ÇOKLU TESİS KULLANICISI) */}
      {(isAllFacilities || hasMultipleFacilities) && facilityStats.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-red-600" />
                {isManager 
                  ? 'Tüm Tesislerin Yangın Güvenliği Durumları' 
                  : 'Sorumlu Olduğum Tesislerin Yangın Güvenliği Durumları'
                }
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tesis bazında kayıtlı tutanak sayısı, tespitler, tamamlanan / devam eden / bekleyen dağılımı ve başarı yüzdeleri (Tesis detayına gitmek için karta tıklayabilirsiniz)
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

      {/* KATEGORİYE GÖRE DURUM ANALİZİ & ETKİLEŞİMLİ FİLTRELEME */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-red-600" />
              Kategori Durumları & Tespit Maddeleri Filtresi
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Aşağıdaki kategorilere veya butonlara tıklayarak ilgili tespit maddelerini doğrudan listeleyebilir ve hızlı aksiyon girebilirsiniz.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Kategori Filtresi:</span>
            {selectedCategoryFilter !== 'ALL' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCategoryFilter('ALL')}
                className="text-xs h-7 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold"
              >
                Filtreyi Temizle
              </Button>
            )}
          </div>
        </div>

        {/* Hızlı Kategori Seçim Çubuğu (Chips / Bar) */}
        <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('ALL')}
            className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              selectedCategoryFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs dark:bg-slate-100 dark:text-slate-900'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 hover:border-slate-300'
            }`}
          >
            <span>Tümü ({totalFindings})</span>
          </button>

          {categoryStats.map(cat => (
            <button
              key={cat.name}
              type="button"
              onClick={() => setSelectedCategoryFilter(cat.name)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                selectedCategoryFilter === cat.name
                  ? 'bg-red-600 text-white font-bold shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 hover:border-slate-300'
              }`}
            >
              <span>{cat.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedCategoryFilter === cat.name
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {cat.total}
              </span>
            </button>
          ))}
        </div>

        {/* Kategori Liste Görünümü (Kompakt, Şık ve Yer Kaplamayan Liste) */}
        {categoryStats.length === 0 ? (
          <Card className="border-dashed border border-slate-200 dark:border-slate-800">
            <CardContent className="p-8 text-center text-xs text-slate-500">
              Henüz kategori bazlı kayıtlı tespit maddesi bulunmamaktadır.
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {categoryStats.map(cat => {
                const isSelected = selectedCategoryFilter === cat.name;
                const catItems = allItems.filter((it: any) => {
                  const c = (it.category || '').split(',').map((x: string) => x.trim());
                  return c.includes(cat.name);
                });

                return (
                  <div
                    key={cat.name}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-red-50/20 dark:bg-red-950/20 border-l-4 border-l-red-600'
                        : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40 border-l-4 border-l-transparent'
                    }`}
                  >
                    {/* Liste Başlık Satırı */}
                    <div
                      onClick={() => setSelectedCategoryFilter(isSelected ? 'ALL' : cat.name)}
                      className="p-3.5 sm:px-5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer"
                    >
                      {/* Sol: Kategori Adı ve Madde Sayısı */}
                      <div className="flex items-center gap-3 min-w-[280px]">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-red-600 text-white shadow-2xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}>
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs md:text-sm font-bold ${
                              isSelected ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'
                            }`}>
                              {cat.name}
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {cat.total} Madde
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {isSelected ? 'Maddeleri gizlemek için tıklayın' : 'Maddeleri aşağıda listelemek ve incelemek için tıklayın'}
                          </span>
                        </div>
                      </div>

                      {/* Orta: Kompakt Çok Renkli İlerleme Çubuğu */}
                      <div className="flex-1 max-w-md space-y-1">
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
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {cat.completed} Tamamlandı
                          </span>
                          <span className="text-amber-600 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            {cat.inProgress} Devam
                          </span>
                          <span className="text-red-500 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            {cat.open} Bekliyor
                          </span>
                        </div>
                      </div>

                      {/* Sağ: Başarı Yüzdesi */}
                      <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-semibold">Başarı Oranı</span>
                          <span className={`text-sm font-extrabold ${cat.pct >= 80 ? 'text-emerald-600' : cat.pct >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                            %{cat.pct}
                          </span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-md transition-colors ${
                          isSelected ? 'bg-red-600 text-white shadow-2xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}>
                          {isSelected ? 'Seçili' : 'Maddeleri Gör →'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* SEÇİLİ KATEGORİ TESPİT MADDELERİ & DİNAMİK LİSTE (ALTA AÇILAN PANEL) */}
        {selectedCategoryFilter !== 'ALL' && (
          <div className="p-4 md:p-6 rounded-2xl border-2 border-red-500/30 bg-white dark:bg-slate-900 shadow-lg space-y-4 animate-in fade-in-50 duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse shrink-0" />
                <div>
                  <h3 className="font-bold text-sm md:text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>{selectedCategoryFilter}</span>
                    <Badge variant="outline" className="font-bold text-xs bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300">
                      {allItems.filter((it: any) => {
                        const c = (it.category || '').split(',').map((x: string) => x.trim());
                        return c.includes(selectedCategoryFilter);
                      }).length} Tespit Maddesi
                    </Badge>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Bu kategoriye ait tespitleri aşağıda inceleyebilir, doğrudan hızlı aksiyon ve kanıt girebilirsiniz.
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCategoryFilter('ALL')}
                className="text-xs h-8 text-slate-600 dark:text-slate-300 hover:text-red-600 border-slate-300 dark:border-slate-700"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Kategoriyi Kapat
              </Button>
            </div>

            {/* Madde Listesi */}
            {(() => {
              const matchedItems = allItems.filter((it: any) => {
                const c = (it.category || '').split(',').map((x: string) => x.trim());
                return c.includes(selectedCategoryFilter);
              });

              if (matchedItems.length === 0) {
                return (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Bu kategoriye ait herhangi bir madde bulunamadı.
                  </div>
                );
              }

              return (
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {matchedItems.map((item: any) => {
                    const isCompleted = item.status === 'TAMAMLANDI' || item.status === 'COMPLETED';
                    const isInProgress = item.status === 'DEVAM_EDIYOR' || item.status === 'IN_PROGRESS';
                    const { percent: itemPct } = calculateItemProgress(item);
                    const itemAudit = audits.find((a: any) => (a.items || []).some((i: any) => i.id === item.id));

                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-red-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                              {item.orderNo}
                            </span>
                            <span className="font-bold text-xs md:text-sm text-slate-900 dark:text-slate-100">
                              {item.topic}
                            </span>
                            {itemAudit && (
                              <button
                                type="button"
                                onClick={() => navigate(`/fire-safety-control/audit/${itemAudit.id}?mode=view`)}
                                className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900"
                                title="Raporu görüntüle"
                              >
                                <FileText className="w-3 h-3" />
                                {itemAudit.title}
                              </button>
                            )}
                          </div>

                          <div className="text-xs text-slate-600 dark:text-slate-400 pl-7 space-y-0.5">
                            {item.action && (
                              <p className="line-clamp-2">
                                <strong className="text-slate-700 dark:text-slate-300">Karar / Plan:</strong> {item.action}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                              {item.responsible && (
                                <span className="text-teal-700 dark:text-teal-400 font-semibold px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800">
                                  {item.responsible}
                                </span>
                              )}
                              <span className="text-slate-400">
                                · {item.actions?.length || 0} aksiyon / müdahale kaydı
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 pl-7 md:pl-0">
                          {/* İlerleme Rozeti */}
                          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="w-14 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${itemPct === 100 ? 'bg-emerald-500' : itemPct > 0 ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: `${itemPct}%` }}
                              />
                            </div>
                            <span className={`text-xs font-black ${itemPct === 100 ? 'text-emerald-600' : itemPct > 0 ? 'text-amber-600' : 'text-red-500'}`}>
                              %{itemPct}
                            </span>
                          </div>

                          <Badge className={
                            isCompleted
                              ? 'bg-emerald-600 text-white font-semibold text-xs'
                              : isInProgress
                              ? 'bg-amber-500 text-white font-semibold text-xs'
                              : 'bg-red-500 text-white font-semibold text-xs'
                          }>
                            {isCompleted ? 'Tamamlandı' : isInProgress ? 'Devam Ediyor' : 'Bekliyor'}
                          </Badge>

                          <Button
                            size="sm"
                            onClick={() => handleOpenQuickAction(item, itemAudit?.title || 'Yangın Denetimi')}
                            className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 text-white text-xs h-8 px-3 shadow-sm flex items-center gap-1.5"
                          >
                            <MessageSquarePlus className="w-3.5 h-3.5 text-emerald-400" />
                            + Aksiyon Yaz
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* TOPLANTI VE DENETİM RAPORLARI LİSTESİ (Hızlı Erişim Tablosu) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-red-600" />
              Toplantı ve Denetim Raporları Listesi
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sisteme kayıtlı tüm denetim tutanakları, ilerleme barları ve doğrudan erişim bağlantıları
            </p>
          </div>

          <Button
            onClick={() => navigate('/fire-safety-control/audit/new')}
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white font-bold self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Yeni Tutanak Girişi
          </Button>
        </div>

        {audits.length > 0 && (
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3 w-28">Tarih</th>
                    <th className="p-3 w-40">Tesis</th>
                    <th className="p-3">Rapor Başlığı / Konu</th>
                    <th className="p-3 w-24 text-center">Toplam Madde</th>
                    <th className="p-3 w-44">İlerleme Durumu</th>
                    <th className="p-3 w-28 text-center">Durum</th>
                    <th className="p-3 w-52 text-right">Hızlı İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {audits.map((a: any) => {
                    const auditItems = a.items || [];
                    const completed = auditItems.filter((i: any) => i.status === 'TAMAMLANDI' || i.status === 'COMPLETED').length;
                    const inProgress = auditItems.filter((i: any) => i.status === 'DEVAM_EDIYOR' || i.status === 'IN_PROGRESS').length;
                    const open = auditItems.filter((i: any) => i.status === 'ACIK' || i.status === 'OPEN').length;
                    const completedPct = auditItems.length > 0 ? Math.round((completed / auditItems.length) * 100) : 0;
                    const inProgressPct = auditItems.length > 0 ? Math.round((inProgress / auditItems.length) * 100) : 0;
                    const openPct = auditItems.length > 0 ? Math.round((open / auditItems.length) * 100) : 0;
                    const weightedProgress = auditItems.length > 0
                      ? Math.round(auditItems.reduce((acc: number, cur: any) => acc + calculateItemProgress(cur).percent, 0) / auditItems.length)
                      : 0;

                    return (
                      <tr key={a.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {new Date(a.auditDate).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="p-3 font-medium text-slate-600 dark:text-slate-400">
                          {a.facility?.name || currentFacility?.name || 'Tesis'}
                        </td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => navigate(`/fire-safety-control/audit/${a.id}?mode=view`)}
                            className="font-bold text-slate-900 dark:text-slate-100 hover:text-red-600 text-left transition-colors line-clamp-1"
                          >
                            {a.title}
                          </button>
                          {a.subtitle && (
                            <span className="text-[11px] text-slate-400 block line-clamp-1 mt-0.5">
                              {a.subtitle}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                            {auditItems.length}
                          </span>
                        </td>
                        <td className="p-3 space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-slate-500">Tamamlanma</span>
                            <span className={weightedProgress >= 80 ? 'text-emerald-600' : weightedProgress >= 40 ? 'text-amber-600' : 'text-red-500'}>
                              %{weightedProgress}
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden flex">
                            <div className="bg-emerald-500 h-full" style={{ width: `${completedPct}%` }} title={`Tamamlandı: ${completed}`} />
                            <div className="bg-amber-500 h-full" style={{ width: `${inProgressPct}%` }} title={`Devam Eden: ${inProgress}`} />
                            <div className="bg-red-500 h-full" style={{ width: `${openPct}%` }} title={`Bekleyen: ${open}`} />
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          {getStatusBadge(a.status)}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/fire-safety-control/audit/${a.id}?mode=view`)}
                              className="text-xs h-7 px-2 text-blue-600 hover:bg-blue-50"
                              title="Raporu ve Baskı Görünümünü İncele"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              Rapor
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/fire-safety-control/audit/${a.id}?mode=edit`)}
                              className="text-xs h-7 px-2 text-amber-600 hover:bg-amber-50"
                              title="Tutanak ve Maddeleri Düzenle"
                            >
                              <Pencil className="w-3.5 h-3.5 mr-1" />
                              Düzenle
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteAuditId(a.id)}
                              className="text-xs h-7 px-2 text-slate-400 hover:text-red-600 hover:bg-red-50"
                              title="Tutanağı Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>



      {/* RAPOR YAŞAM DÖNGÜSÜ & SAHA OLAY GÜNLÜĞÜ (TIMELINE) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-600" />
              Rapor Yaşam Döngüsü & Olay Günlüğü
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Raporların açılışı, eklenen tespitler, sahada yürütülen aksiyonlar ve kanıt girişlerinin kronolojik günlüğü
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1 self-start sm:self-auto flex items-center gap-1">
            <History className="w-3.5 h-3.5 text-slate-500" />
            {auditTimelineLogs.length} Olay Kaydı
          </Badge>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : auditTimelineLogs.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800">
            <CardContent className="p-8 text-center space-y-2">
              <Clock className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-500">Henüz kayıtlı bir zaman çizelgesi olayı bulunmamaktadır.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-5 sm:ml-8 my-4 space-y-6 pr-4">
              {auditTimelineLogs.slice(0, 15).map((log) => {
                const isAuditCreation = log.type === 'AUDIT_CREATED';
                return (
                  <div key={log.id} className="relative pl-6 sm:pl-8 group">
                    {/* Timeline Rozet Noktası */}
                    <div className={`absolute -left-[11px] top-1.5 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-xs transition-transform group-hover:scale-125 ${
                      isAuditCreation ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
                    }`}>
                      {isAuditCreation ? <ClipboardList className="w-2.5 h-2.5" /> : <CheckCircle2 className="w-2.5 h-2.5" />}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5">
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                            {log.title}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${log.badgeColor}`}>
                            {log.badgeText}
                          </span>
                          {log.facilityName && (
                            <span className="text-[10px] font-medium px-2 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {log.facilityName}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {log.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 pt-1 sm:pt-0">
                        <span className="text-[11px] font-semibold text-slate-400">
                          {new Date(log.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        {log.auditId && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/fire-safety-control/audit/${log.auditId}?mode=view`)}
                            className="h-6 text-[10px] px-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 font-semibold"
                          >
                            Raporu Gör →
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      {/* DASHBOARD HIZLI AKSİYON MODALI */}
      <Dialog open={!!quickActionItem} onOpenChange={open => !open && setQuickActionItem(null)}>
        <DialogContent className="max-w-lg max-h-[92vh] flex flex-col p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Hızlı Aksiyon ve Kanıt Girişi
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {quickActionItem?.auditTitle} · Madde #{quickActionItem?.item?.orderNo}: {quickActionItem?.item?.topic?.slice(0, 60)}...
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
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
                onChange={e => {
                  const s = e.target.value;
                  setQuickStatus(s);
                  if (s === 'Tamamlandı') setQuickProgressPercent(100);
                  else if (s === 'Devam Ediyor' && quickProgressPercent === 100) setQuickProgressPercent(50);
                  else if (s === 'Başlamadı') setQuickProgressPercent(0);
                }}
                className="mt-1 w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 font-bold h-8"
              >
                <option value="Tamamlandı">Tamamlandı (Yeşil)</option>
                <option value="Devam Ediyor">Devam Ediyor (Turuncu)</option>
                <option value="Başlamadı">Bekliyor (Kırmızı)</option>
              </select>
            </div>

            {/* İLERLEME YÜZDESİ (PROGRESS BAR & HIZLI SEÇİM BUTONLARI) */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  Bu Aksiyon İşin Yüzde Kaçını Tamamladı?
                </span>
                <span className={`font-black text-sm ${quickProgressPercent === 100 ? 'text-emerald-600' : quickProgressPercent > 0 ? 'text-amber-600' : 'text-red-500'}`}>
                  %{quickProgressPercent}
                </span>
              </div>

              {/* Progress Slider */}
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={quickProgressPercent}
                onChange={e => {
                  const val = Number(e.target.value);
                  setQuickProgressPercent(val);
                  if (val === 100) setQuickStatus('Tamamlandı');
                  else if (val > 0) setQuickStatus('Devam Ediyor');
                  else setQuickStatus('Başlamadı');
                }}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />

              {/* Hızlı Seçim Butonları */}
              <div className="grid grid-cols-5 gap-1 pt-1">
                {[0, 25, 50, 75, 100].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => {
                      setQuickProgressPercent(pct);
                      if (pct === 100) setQuickStatus('Tamamlandı');
                      else if (pct > 0) setQuickStatus('Devam Ediyor');
                      else setQuickStatus('Başlamadı');
                    }}
                    className={`py-1 text-[11px] rounded font-bold border transition-colors ${
                      quickProgressPercent === pct
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    %{pct}
                  </button>
                ))}
              </div>
            </div>

            {/* Kanıt Belgeleri / Fotoğrafları Yükleme (Sürükle-Bırak, Kopyala-Yapıştır, Kamera ve Dosya Seçici) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Kanıt Fotoğrafları / Belgeler</label>
              
              <div
                tabIndex={0}
                onDrop={e => {
                  e.preventDefault();
                  const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                  if (droppedFiles.length > 0) uploadQuickFilesGeneric(droppedFiles);
                  else toast.error('Lütfen geçerli görsel dosyaları sürükleyin');
                }}
                onDragOver={e => e.preventDefault()}
                onPaste={e => {
                  const items = e.clipboardData?.items;
                  if (items) {
                    const files: File[] = [];
                    for (let i = 0; i < items.length; i++) {
                      if (items[i].type.indexOf('image') !== -1) {
                        const file = items[i].getAsFile();
                        if (file) files.push(file);
                      }
                    }
                    if (files.length > 0) {
                      e.preventDefault();
                      uploadQuickFilesGeneric(files);
                    }
                  }
                }}
                className="group relative border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-xl p-3 bg-slate-50/70 dark:bg-slate-800/40 text-center transition-all outline-hidden cursor-pointer"
              >
                <div className="flex flex-col items-center justify-center py-1">
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mb-1">
                    <Upload className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Görselleri buraya <span className="text-blue-600 underline">sürükleyip bırakın</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    veya panodan yapıştırın (<kbd className="px-1 py-0.2 bg-slate-200 dark:bg-slate-700 rounded text-[10px] font-mono">Ctrl+V</kbd> / <kbd className="px-1 py-0.2 bg-slate-200 dark:bg-slate-700 rounded text-[10px] font-mono">⌘+V</kbd>)
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-slate-200/80 dark:border-slate-700">
                  {/* Kamera ile Çek (Mobil için doğrudan kamera) */}
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs">
                    <Camera className="w-3.5 h-3.5" />
                    <span>Kamera</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleFileUploadQuickAction}
                      disabled={uploadingQuickFile}
                    />
                  </label>

                  {/* Dosya / Galeri Seç */}
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>{uploadingQuickFile ? 'Yükleniyor...' : 'Galeri / Dosya'}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUploadQuickAction}
                      disabled={uploadingQuickFile}
                    />
                  </label>
                </div>
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
                        className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 opacity-90 hover:opacity-100 transition-opacity z-10"
                        title="Kaldır"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2 text-center border border-dashed rounded-lg text-[11px] text-slate-400">
                  Henüz kanıt belgesi eklenmedi.
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="p-3.5 sm:px-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 shrink-0 flex flex-row items-center justify-end gap-2 m-0 rounded-b-xl">
            <Button variant="outline" size="sm" onClick={() => setQuickActionItem(null)}>
              Vazgeç / İptal
            </Button>
            <Button
              size="sm"
              onClick={handleSubmitQuickAction}
              disabled={submittingAction}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4"
            >
              {submittingAction ? 'Kaydediliyor...' : 'Aksiyonu Kaydet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SAHA KANIT & FOTOĞRAF YÜKLEME SİHİRBAZI (FIELD WIZARD MODAL)   */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Dialog open={isFieldWizardOpen} onOpenChange={open => !open && setIsFieldWizardOpen(false)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-base md:text-lg font-bold text-slate-900 dark:text-slate-100">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Saha Kanıt & Aksiyon Yükleme Sihirbazı
              </DialogTitle>
              <Badge variant="outline" className="font-bold text-xs bg-amber-50 text-amber-800 border-amber-300">
                Adım {wizardStep} / 3
              </Badge>
            </div>
            <DialogDescription className="text-xs">
              Sahada tespit edilen veya tamamlanan işlerin fotoğraflarını yükleyin, ilerleme yüzdesini belirleyin.
            </DialogDescription>
          </DialogHeader>

          {/* Adım İlerleme Çubuğu */}
          <div className="grid grid-cols-3 gap-2 py-1">
            <div className={`p-2 rounded-lg text-center text-xs font-bold transition-all border ${
              wizardStep === 1 
                ? 'bg-red-600 text-white border-red-600 shadow-xs' 
                : wizardStep > 1 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200'
            }`}>
              1. Tesis & Madde Seçimi
            </div>
            <div className={`p-2 rounded-lg text-center text-xs font-bold transition-all border ${
              wizardStep === 2 
                ? 'bg-red-600 text-white border-red-600 shadow-xs' 
                : wizardStep > 2 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200'
            }`}>
              2. Fotoğraf & Kanıt Yükle
            </div>
            <div className={`p-2 rounded-lg text-center text-xs font-bold transition-all border ${
              wizardStep === 3 
                ? 'bg-red-600 text-white border-red-600 shadow-xs' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200'
            }`}>
              3. İlerleme (%) & Açıklama
            </div>
          </div>

          {/* ADIM 1: Tesis, Tutanak ve Kategoriye Göre Madde Seçimi */}
          {wizardStep === 1 && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tesis Seçimi *</label>
                  <select
                    value={wizardFacilityId}
                    onChange={e => {
                      setWizardFacilityId(e.target.value);
                      setWizardAuditId('');
                      setWizardItemId('');
                    }}
                    className="mt-1 w-full text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 h-9"
                  >
                    {accessibleFacilities.map((f: any) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Toplantı Tutanağı *</label>
                  {(() => {
                    const facilityAudits = audits.filter((a: any) => a.facilityId === wizardFacilityId);
                    return (
                      <select
                        value={wizardAuditId}
                        onChange={e => {
                          setWizardAuditId(e.target.value);
                          setWizardItemId('');
                        }}
                        className="mt-1 w-full text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 h-9"
                      >
                        <option value="">-- Tutanak Seçin ({facilityAudits.length} Kayıtlı) --</option>
                        {facilityAudits.map((a: any) => (
                          <option key={a.id} value={a.id}>
                            {a.title} ({new Date(a.auditDate).toLocaleDateString('tr-TR')})
                          </option>
                        ))}
                      </select>
                    );
                  })()}
                </div>
              </div>

              {/* Kategori Filtresi */}
              {wizardAuditId && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Kategori Filtresi:</span>
                    {wizardSelectedCategory !== 'ALL' && (
                      <button
                        type="button"
                        onClick={() => setWizardSelectedCategory('ALL')}
                        className="text-[11px] text-red-600 hover:underline"
                      >
                        Tüm Kategoriler
                      </button>
                    )}
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                    <button
                      type="button"
                      onClick={() => setWizardSelectedCategory('ALL')}
                      className={`text-xs px-2.5 py-1 rounded-md font-semibold border ${
                        wizardSelectedCategory === 'ALL'
                          ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200'
                      }`}
                    >
                      Tümü
                    </button>
                    {categoriesList.map((cat: string) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setWizardSelectedCategory(cat)}
                        className={`text-xs px-2.5 py-1 rounded-md font-medium border ${
                          wizardSelectedCategory === cat
                            ? 'bg-red-600 text-white border-red-600 shadow-2xs font-bold'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Madde Listesi (Tıklanabilir Kartlar) */}
              {wizardAuditId && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    İşlem Yapılacak Tespit Maddesini Seçin *
                  </label>
                  {(() => {
                    const currentAudit = audits.find((a: any) => a.id === wizardAuditId);
                    const auditItems = currentAudit?.items || [];
                    const filtered = auditItems.filter((i: any) => {
                      if (wizardSelectedCategory === 'ALL') return true;
                      const c = (i.category || '').split(',').map((x: string) => x.trim());
                      return c.includes(wizardSelectedCategory);
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="p-4 text-center border border-dashed rounded-lg text-xs text-slate-400">
                          Bu kategoride tespit maddesi bulunamadı.
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {filtered.map((it: any) => {
                          const isSelected = wizardItemId === it.id;
                          const { percent } = calculateItemProgress(it);
                          return (
                            <div
                              key={it.id}
                              onClick={() => {
                                setWizardItemId(it.id);
                                const firstResp = it.responsible ? it.responsible.split(',')[0].trim() : '';
                                setWizardDepartment(firstResp);
                              }}
                              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-red-600 bg-red-50/40 dark:bg-red-950/30 ring-2 ring-red-500/20 shadow-xs'
                                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                      {it.orderNo}
                                    </span>
                                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                                      {it.topic}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 line-clamp-1 pl-7">
                                    Karar: {it.action || 'Belirtilmedi'}
                                  </div>
                                </div>

                                <div className="flex flex-col items-end shrink-0 gap-1">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    percent === 100
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : percent > 0
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    %{percent}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    {it.status || 'Bekliyor'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* ADIM 2: Fotoğraf ve Kanıt Yükleme */}
          {wizardStep === 2 && (
            <div className="space-y-4 py-2">
              <div
                tabIndex={0}
                onDrop={e => {
                  e.preventDefault();
                  const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                  if (droppedFiles.length > 0) uploadWizardFilesGeneric(droppedFiles);
                  else toast.error('Lütfen geçerli görsel dosyaları sürükleyin');
                }}
                onDragOver={e => e.preventDefault()}
                onPaste={e => {
                  const items = e.clipboardData?.items;
                  if (items) {
                    const files: File[] = [];
                    for (let i = 0; i < items.length; i++) {
                      if (items[i].type.indexOf('image') !== -1) {
                        const file = items[i].getAsFile();
                        if (file) files.push(file);
                      }
                    }
                    if (files.length > 0) {
                      e.preventDefault();
                      uploadWizardFilesGeneric(files);
                    }
                  }
                }}
                className="p-5 rounded-2xl border-2 border-dashed border-red-300 dark:border-red-900/60 bg-red-50/20 hover:bg-red-50/40 text-center space-y-3 transition-all outline-hidden cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center mx-auto shadow-xs">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Saha Kanıt Fotoğraflarını Ekleyin
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Görselleri buraya <span className="text-red-600 underline font-semibold">sürükleyip bırakın</span> veya panodan yapıştırın (<kbd className="px-1 py-0.2 bg-slate-200 dark:bg-slate-700 rounded text-[10px] font-mono">Ctrl+V</kbd> / <kbd className="px-1 py-0.2 bg-slate-200 dark:bg-slate-700 rounded text-[10px] font-mono">⌘+V</kbd>)
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Klasör: {wizardFacilityId ? facilities.find((f: any) => f.id === wizardFacilityId)?.name : 'Tesis'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2 border-t border-red-200/60 dark:border-red-900/40">
                  {/* Mobil Kamera Doğrudan Çekim */}
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md">
                    <Camera className="w-4 h-4" />
                    <span>📸 Kamera ile Çek</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleWizardFileUpload}
                      disabled={uploadingWizardFiles}
                    />
                  </label>

                  {/* Dosya / Galeri Seç */}
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md">
                    <Upload className="w-4 h-4" />
                    <span>{uploadingWizardFiles ? 'Yükleniyor...' : '📁 Galeri / Belge Seç'}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handleWizardFileUpload}
                      disabled={uploadingWizardFiles}
                    />
                  </label>
                </div>
              </div>

              {/* Yüklenen Fotoğraflar Galerisi */}
              {wizardFiles.length > 0 ? (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Yüklenen Kanıtlar ({wizardFiles.length})
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-2 border rounded-xl bg-slate-50 dark:bg-slate-900">
                    {wizardFiles.map((fUrl, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 bg-white">
                        <img src={fUrl} alt="Kanıt" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setWizardFiles(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow-md opacity-90 hover:opacity-100"
                          title="Sil"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center text-xs text-slate-400 italic">
                  Fotoğraf yüklemek zorunlu değildir ancak işin tamamlandığını kanıtlamak için önerilir.
                </div>
              )}
            </div>
          )}

          {/* ADIM 3: İlerleme Yüzdesi ve Faaliyet Açıklaması */}
          {wizardStep === 3 && (
            <div className="space-y-4 py-2">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Sahada Yapılan İşlem / Faaliyet Açıklaması *
                </label>
                <Textarea
                  rows={3}
                  value={wizardExplanation}
                  onChange={e => setWizardExplanation(e.target.value)}
                  placeholder="Örn: Yangın tüpü dolumu yapıldı, manometre kontrolü sağlandı..."
                  className="mt-1 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">İşlemi Yapan / Saha Sorumlusu</label>
                  <Input
                    value={wizardDoneBy}
                    onChange={e => setWizardDoneBy(e.target.value)}
                    placeholder="Ad Soyad veya Firma"
                    className="mt-1 text-xs h-8"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">İlgili Departman</label>
                  <select
                    value={wizardDepartment}
                    onChange={e => setWizardDepartment(e.target.value)}
                    className="mt-1 w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 h-8 font-medium"
                  >
                    <option value="">-- Departman Seçin --</option>
                    {responsiblesList.map((r: string) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Maddenin Yeni Durumu</label>
                <select
                  value={wizardStatus}
                  onChange={e => {
                    const s = e.target.value;
                    setWizardStatus(s);
                    if (s === 'Tamamlandı') setWizardProgressPercent(100);
                    else if (s === 'Devam Ediyor' && wizardProgressPercent === 100) setWizardProgressPercent(50);
                    else if (s === 'Başlamadı') setWizardProgressPercent(0);
                  }}
                  className="mt-1 w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 font-bold h-8"
                >
                  <option value="Tamamlandı">Tamamlandı (Eksiklik Giderildi - Yeşil)</option>
                  <option value="Devam Ediyor">Kısmen Yapıldı / Devam Ediyor (Turuncu)</option>
                  <option value="Başlamadı">Bekliyor (Kırmızı)</option>
                </select>
              </div>

              {/* İlerleme Yüzdesi Çubuğu ve Butonlar */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Bu Aksiyon İşin Yüzde Kaçını Tamamladı?
                  </span>
                  <span className={`font-black text-sm ${wizardProgressPercent === 100 ? 'text-emerald-600' : wizardProgressPercent > 0 ? 'text-amber-600' : 'text-red-500'}`}>
                    %{wizardProgressPercent}
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={wizardProgressPercent}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setWizardProgressPercent(val);
                    if (val === 100) setWizardStatus('Tamamlandı');
                    else if (val > 0) setWizardStatus('Devam Ediyor');
                    else setWizardStatus('Başlamadı');
                  }}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />

                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  {[0, 25, 50, 75, 100].map(pct => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => {
                        setWizardProgressPercent(pct);
                        if (pct === 100) setWizardStatus('Tamamlandı');
                        else if (pct > 0) setWizardStatus('Devam Ediyor');
                        else setWizardStatus('Başlamadı');
                      }}
                      className={`py-1 text-xs rounded-md font-bold border transition-colors ${
                        wizardProgressPercent === pct
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      %{pct}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-row items-center justify-between sm:justify-between pt-3 border-t">
            {wizardStep > 1 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWizardStep(prev => (prev - 1) as any)}
              >
                Geri
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setIsFieldWizardOpen(false)}>
                Vazgeç
              </Button>
            )}

            {wizardStep < 3 ? (
              <Button
                size="sm"
                onClick={() => {
                  if (wizardStep === 1 && !wizardItemId) {
                    toast.error('Lütfen bir tespit maddesi seçin');
                    return;
                  }
                  setWizardStep(prev => (prev + 1) as any);
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                İleri
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleSubmitWizard}
                disabled={submittingWizard}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {submittingWizard ? 'Kaydediliyor...' : 'Kanıtı Sisteme Kaydet'}
              </Button>
            )}
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

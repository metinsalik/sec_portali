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
  History,
  CheckSquare,
  RotateCcw,
  Search,
  Gauge,
  Target,
  ShieldCheck,
  Trophy,
  AlertOctagon,
  Briefcase,
  Zap,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';
import { toast } from 'sonner';
import { calculateItemProgress } from './FireSafetyAuditPage';

// Uzun tespit metinlerini kısa özet başlık ve detay gövdesi olarak ayıran akıllı yardımcı fonksiyon
export const splitItemTopic = (rawTopic: string = '', maxTitleLen: number = 80): { title: string; detail: string } => {
  const text = (rawTopic || '').trim();
  if (!text) return { title: 'Tespit Maddesi', detail: '' };

  // Eğer ilk satırda başlık gibi kısa bir metin veya noktalama varsa
  const firstLine = text.split('\n')[0].trim();
  if (firstLine && firstLine.length <= maxTitleLen && text.includes('\n')) {
    const detail = text.slice(firstLine.length).trim();
    return { title: firstLine, detail };
  }

  // İlk cümlenin sonunu (. veya : veya -) bul
  const sentenceEnd = text.search(/[.:;]\s/);
  if (sentenceEnd !== -1 && sentenceEnd <= maxTitleLen && sentenceEnd > 15) {
    const title = text.slice(0, sentenceEnd + 1).trim();
    const detail = text.slice(sentenceEnd + 1).trim();
    return { title, detail };
  }

  // Eğer metin kısa ise doğrudan başlık olarak ver
  if (text.length <= maxTitleLen) {
    return { title: text, detail: '' };
  }

  // Kelime sınırından böl
  const cut = text.lastIndexOf(' ', maxTitleLen);
  const splitIndex = cut > 20 ? cut : maxTitleLen;
  const title = text.slice(0, splitIndex).trim() + '...';
  const detail = text.slice(splitIndex).trim();
  return { title, detail };
};

export default function FireSafetyExecutiveSummary() {
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

  // Madde ve Aksiyonlarını İnceleme Dialog State'i
  const [viewItemDetail, setViewItemDetail] = useState<{
    item: any;
    auditTitle: string;
    facilityName: string;
  } | null>(null);

  // Fotoğraf Büyütme / Önizleme Modalı
  const [previewPhoto, setPreviewPhoto] = useState<{
    isOpen: boolean;
    title: string;
    currentIndex: number;
    photos: string[];
  }>({
    isOpen: false,
    title: '',
    currentIndex: 0,
    photos: []
  });

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
  // Kategori içi durum filtresi (ALL, TAMAMLANDI, DEVAM_EDIYOR, BASLAMADI)
  const [selectedCategoryStatusFilter, setSelectedCategoryStatusFilter] = useState<'ALL' | 'TAMAMLANDI' | 'DEVAM_EDIYOR' | 'BASLAMADI'>('ALL');
  // Dinamik tespit maddeleri arama ve tesis içi filtreleme
  const [itemSearchText, setItemSearchText] = useState<string>('');
  const [itemFacilityFilter, setItemFacilityFilter] = useState<string>('ALL');

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

  // Seçili tesis(ler) state'i ve localStorage ile aklında tutma
  const STORAGE_KEY = 'fsc_exec_selected_facility_ids';
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // ignore JSON parse error
    }
    return ['all'];
  });

  // Tesis kartlarından tekil bir tesise geçici olarak odaklanma (drilldown) state'i
  // Kullanıcı karta tıkladığında localStorage'daki ana seçimi kaybetmeyiz, temizle dediğinde ana seçimine geri döner
  const [drilldownFacilityId, setDrilldownFacilityId] = useState<string | null>(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [facilitySearchText, setFacilitySearchText] = useState('');

  // Tesis seçimini güncelleme ve kalıcı olarak kaydetme
  const updateSelectedFacilities = (newSelection: string[]) => {
    setDrilldownFacilityId(null); // Ana filtre değiştiğinde tekil odaklanmayı sıfırla
    setSelectedFacilityIds(newSelection);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSelection));
    } catch (e) {
      // ignore
    }
  };

  const toggleFacilitySelection = (fId: string) => {
    setDrilldownFacilityId(null);
    if (fId === 'all') {
      updateSelectedFacilities(['all']);
      return;
    }

    let next = selectedFacilityIds.filter(id => id !== 'all');
    if (next.includes(fId)) {
      next = next.filter(id => id !== fId);
    } else {
      next.push(fId);
    }

    updateSelectedFacilities(next);
  };

  const clearFacilitySelection = () => {
    setDrilldownFacilityId(null);
    updateSelectedFacilities([]);
  };

  const selectSingleFacility = (fId: string) => {
    updateSelectedFacilities([fId]);
  };

  const selectAllFacilities = () => {
    setDrilldownFacilityId(null);
    updateSelectedFacilities(['all']);
  };

  // Kartlardan tekil tesise odaklan veya seçili olanı kapatıp ana konsolide listeye dön
  const handleToggleCardDrilldown = (fId: string) => {
    if (drilldownFacilityId === fId) {
      setDrilldownFacilityId(null); // Geri dön (ana seçime)
    } else {
      setDrilldownFacilityId(fId); // Bu tesise odaklan
    }
  };

  const isAllSelected = selectedFacilityIds.includes('all') && !drilldownFacilityId;

  // Query anahtarı ve URL parametresi:
  // Eğer kullanıcı kartlardan bir tesise odaklandıysa o tesis çekilir.
  // Odaklanma yoksa kullanıcının konsolidasyon filtresindeki tesis(ler) çekilir.
  const queryParam = React.useMemo(() => {
    if (drilldownFacilityId) {
      return `facilityId=${drilldownFacilityId}`;
    }
    if (selectedFacilityIds.includes('all')) {
      return 'facilityId=all';
    }
    if (selectedFacilityIds.length === 0) {
      return 'facilityIds=none';
    }
    if (selectedFacilityIds.length === 1) {
      return `facilityId=${selectedFacilityIds[0]}`;
    }
    return `facilityIds=${selectedFacilityIds.join(',')}`;
  }, [selectedFacilityIds, drilldownFacilityId]);

  // Tutanakları getir
  const { data: audits = [], isLoading } = useQuery({
    queryKey: ['fire-safety-audits', queryParam],
    queryFn: async () => {
      const res = await api.get(`/fire-safety-control?${queryParam}`);
      if (!res.ok) throw new Error('Tutanaklar yüklenemedi');
      return res.json();
    }
  });

  // Tesis listesindeki tüm tutanakları (genel sol bar istatistikleri için) opsiyonel arka planda getir
  const { data: allGlobalAudits = [] } = useQuery({
    queryKey: ['fire-safety-audits-global-all'],
    queryFn: async () => {
      const res = await api.get('/fire-safety-control?facilityId=all');
      if (!res.ok) return [];
      return res.json();
    }
  });

  const effectiveFacId = isAllSelected ? 'all' : (selectedFacilityIds[0] || 'all');
  const currentFacility = !isAllSelected && selectedFacilityIds.length === 1
    ? facilities.find((f: any) => f.id === selectedFacilityIds[0])
    : null;

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

  // Kategori Bazlı İstatistik Hesaplamaları (Tamamlanan %100, Süreçteki İşler Ağırlıklı Katkı Sağlar)
  const categoryStats = React.useMemo(() => {
    const map: Record<string, { total: number; completed: number; inProgress: number; open: number; totalProgressSum: number }> = {};

    allItems.forEach((item: any) => {
      const cats = (item.category || 'Genel Yangın Güvenliği')
        .split(',')
        .map((c: string) => c.trim())
        .filter(Boolean);

      const status = (item.status || '').toUpperCase();
      const isComp = status === 'TAMAMLANDI' || status === 'COMPLETED';
      const isProg = status === 'DEVAM_EDIYOR' || status === 'IN_PROGRESS';

      // Madde bazında gerçek/ağırlıklı ilerleme yüzdesi
      const itemProgress = calculateItemProgress(item).percent;
      const progressWeight = isComp ? 100 : isProg ? Math.max(itemProgress, 50) : 0;

      cats.forEach((cat: string) => {
        if (!map[cat]) {
          map[cat] = { total: 0, completed: 0, inProgress: 0, open: 0, totalProgressSum: 0 };
        }
        map[cat].total += 1;
        map[cat].totalProgressSum += progressWeight;

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
      // Uyum Skoru: Kapatılanlar %100 + Süreçteki işlerin ilerleme katkısı
      const pct = stat.total > 0 ? Math.round(stat.totalProgressSum / stat.total) : 0;
      const rawCompletedPct = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
      const inProgPct = stat.total > 0 ? Math.round((stat.inProgress / stat.total) * 100) : 0;
      const openPct = stat.total > 0 ? Math.round((stat.open / stat.total) * 100) : 0;
      return { name, ...stat, pct, rawCompletedPct, inProgPct, openPct };
    }).sort((a, b) => b.total - a.total);
  }, [allItems]);

  // Tesis Bazlı İstatistik Hesaplamaları (Tüm Tesisler veya Filtrelenmiş Tesisler görünümü için)
  // drilldownFacilityId olsa bile kullanıcının localStorage'da kayıtlı olan tesis kartları korunur
  const facilityStats = React.useMemo(() => {
    const map: Record<string, { name: string; auditsCount: number; total: number; completed: number; inProgress: number; open: number; totalProgressSum: number }> = {};
    const sourceAudits = allGlobalAudits.length > 0 ? allGlobalAudits : audits;

    // Kullanıcının seçtiği tesisler (veya tümü)
    const allowedFacilityIds = selectedFacilityIds.includes('all')
      ? null
      : new Set(selectedFacilityIds);

    sourceAudits.forEach((audit: any) => {
      const fId = audit.facilityId || 'unknown';
      if (allowedFacilityIds && !allowedFacilityIds.has(fId)) {
        return; // Kullanıcının seçtiği tesis kümesinde değilse atla
      }

      const fName = audit.facility?.name || facilities.find((f: any) => f.id === fId)?.name || 'Bilinmeyen Tesis';

      if (!map[fId]) {
        map[fId] = { name: fName, auditsCount: 0, total: 0, completed: 0, inProgress: 0, open: 0, totalProgressSum: 0 };
      }
      map[fId].auditsCount += 1;

      const items = audit.items || [];
      items.forEach((item: any) => {
        map[fId].total += 1;
        const status = (item.status || '').toUpperCase();
        const isComp = status === 'TAMAMLANDI' || status === 'COMPLETED';
        const isProg = status === 'DEVAM_EDIYOR' || status === 'IN_PROGRESS';

        const itemProgress = calculateItemProgress(item).percent;
        const progressWeight = isComp ? 100 : isProg ? Math.max(itemProgress, 50) : 0;
        map[fId].totalProgressSum += progressWeight;

        if (isComp) {
          map[fId].completed += 1;
        } else if (isProg) {
          map[fId].inProgress += 1;
        } else {
          map[fId].open += 1;
        }
      });
    });

    return Object.entries(map).map(([id, stat]) => {
      // Uyum Skoru: Süreçteki işlerin sahada başlama ve ilerleme payı dahil
      const pct = stat.total > 0 ? Math.round(stat.totalProgressSum / stat.total) : 0;
      const rawCompletedPct = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
      const inProgPct = stat.total > 0 ? Math.round((stat.inProgress / stat.total) * 100) : 0;
      const openPct = stat.total > 0 ? Math.round((stat.open / stat.total) * 100) : 0;
      return { id, ...stat, pct, rawCompletedPct, inProgPct, openPct };
    }).sort((a, b) => b.total - a.total);
  }, [allGlobalAudits, audits, facilities, selectedFacilityIds]);

  // Sol Yönetici Menüsü için Tüm Tesislerin Güncel Global Durumları
  const globalFacilityStats = React.useMemo(() => {
    const listToProcess = allGlobalAudits.length > 0 ? allGlobalAudits : audits;
    const map: Record<string, { name: string; auditsCount: number; total: number; completed: number; inProgress: number; open: number; totalProgressSum: number }> = {};

    listToProcess.forEach((audit: any) => {
      const fId = audit.facilityId || 'unknown';
      const fName = audit.facility?.name || facilities.find((f: any) => f.id === fId)?.name || 'Bilinmeyen Tesis';

      if (!map[fId]) {
        map[fId] = { name: fName, auditsCount: 0, total: 0, completed: 0, inProgress: 0, open: 0, totalProgressSum: 0 };
      }
      map[fId].auditsCount += 1;

      const items = audit.items || [];
      items.forEach((item: any) => {
        map[fId].total += 1;
        const status = (item.status || '').toUpperCase();
        const isComp = status === 'TAMAMLANDI' || status === 'COMPLETED';
        const isProg = status === 'DEVAM_EDIYOR' || status === 'IN_PROGRESS';

        const itemProgress = calculateItemProgress(item).percent;
        const progressWeight = isComp ? 100 : isProg ? Math.max(itemProgress, 50) : 0;
        map[fId].totalProgressSum += progressWeight;

        if (isComp) {
          map[fId].completed += 1;
        } else if (isProg) {
          map[fId].inProgress += 1;
        } else {
          map[fId].open += 1;
        }
      });
    });

    return Object.entries(map).map(([id, stat]) => {
      const pct = stat.total > 0 ? Math.round(stat.totalProgressSum / stat.total) : 0;
      return { id, ...stat, pct };
    }).sort((a, b) => b.total - a.total);
  }, [allGlobalAudits, audits, facilities]);

  // 1. ÜST YÖNETİCİ KARAR DESTEK: EN KRİTİK 3 ZAFİYET ALANI (Düşük uyum ve bekleyen risk yükü en fazla olanlar)
  const topVulnerabilities = React.useMemo(() => {
    return [...categoryStats]
      .filter(c => c.total > 0)
      .sort((a, b) => {
        // Öncelik: Uyum oranı en düşük olan, eşitse açık madde sayısı en yüksek olan
        if (a.pct !== b.pct) return a.pct - b.pct;
        return b.open - a.open;
      })
      .slice(0, 3);
  }, [categoryStats]);

  // 2. ÜST YÖNETİCİ HESAP VERİLEBİLİRLİK: TESİS LİGİ & BENCHMARK (En hareketli ve en hareketsiz tesisler)
  const facilityBenchmark = React.useMemo(() => {
    if (facilityStats.length === 0) return { bestFacility: null, sluggishFacility: null };
    
    // En yüksek uyuma veya en çok tamamlanmış/sürece alınmış orana sahip lider tesis
    const sortedBySuccess = [...facilityStats].sort((a, b) => {
      if (b.pct !== a.pct) return b.pct - a.pct;
      return (b.completed + b.inProgress) - (a.completed + a.inProgress);
    });

    // En çok bekleyen riski ve en düşük aksiyon hareketliliği olan tesis
    const sortedBySluggish = [...facilityStats].sort((a, b) => {
      if (b.openPct !== a.openPct) return b.openPct - a.openPct;
      return b.open - a.open;
    });

    return {
      bestFacility: sortedBySuccess[0] || null,
      sluggishFacility: sortedBySluggish[0] || null
    };
  }, [facilityStats]);

  // 3. ÜST YÖNETİCİ KAYNAK VE TALİMAT: AKSİYONLAR KİMİN MASASINDA BEKLİYOR? (Departman / Birim Sorumluluk Dağılımı - Konsolide & Sade)
  const responsibleStats = React.useMemo(() => {
    // Karmaşık serbest metinleri net ana departmanlara eşleyen yardımcı fonksiyon
    const normalizeDept = (raw: string = ''): string => {
      const s = raw.toLowerCase().trim();
      if (!s) return 'Diğer / Tanımsız';
      if (s.includes('satın alma') || s.includes('satınalma')) return 'Satın Alma Direktörlüğü';
      if (s.includes('mimar') || s.includes('dizayn')) return 'Mimari & Dizayn';
      if (s.includes('isg') || s.includes('iş güvenliği')) return 'İSG & Saha Güvenliği';
      if (s.includes('teknik') || s.includes('bakım')) return 'Teknik Hizmetler';
      return 'Diğer / Genel İdari';
    };

    const map: Record<string, { total: number; completed: number; inProgress: number; open: number }> = {};

    allItems.forEach((item: any) => {
      const deptName = normalizeDept(item.responsible);
      
      const status = (item.status || '').toUpperCase();
      const isComp = status === 'TAMAMLANDI' || status === 'COMPLETED';
      const isProg = status === 'DEVAM_EDIYOR' || status === 'IN_PROGRESS';

      if (!map[deptName]) {
        map[deptName] = { total: 0, completed: 0, inProgress: 0, open: 0 };
      }
      map[deptName].total += 1;
      if (isComp) map[deptName].completed += 1;
      else if (isProg) map[deptName].inProgress += 1;
      else map[deptName].open += 1;
    });

    const COLOR_MAP: Record<string, string> = {
      'Teknik Hizmetler': '#ef4444',
      'Satın Alma Direktörlüğü': '#f59e0b',
      'Mimari & Dizayn': '#8b5cf6',
      'İSG & Saha Güvenliği': '#3b82f6',
      'Diğer / Genel İdari': '#64748b'
    };

    return Object.entries(map).map(([name, stat]) => {
      const pct = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
      const openPct = stat.total > 0 ? Math.round((stat.open / stat.total) * 100) : 0;
      return {
        name,
        ...stat,
        pct,
        openPct,
        color: COLOR_MAP[name] || '#64748b'
      };
    }).sort((a, b) => b.open - a.open); // En çok açık yükü olan en üstte
  }, [allItems]);

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
  // Doğrudan kapananlar
  const rawCompletedRate = totalFindings > 0 ? Math.round((completedCount / totalFindings) * 100) : 0;
  const overallInProgressRate = totalFindings > 0 ? Math.round((inProgressCount / totalFindings) * 100) : 0;
  const overallOpenRate = totalFindings > 0 ? Math.round((openCount / totalFindings) * 100) : 0;

  // YÖNETİCİ KONSOLİDE UYUM & AKSİYON BAŞARI SKORU:
  // Kapatılan maddeler %100, sahada süreci başlatılmış/montajda olan maddeler ağırlıklı katkı sağlar.
  const overallSuccessRate = React.useMemo(() => {
    if (totalFindings === 0) return 0;
    const totalWeightSum = allItems.reduce((acc: number, item: any) => {
      const s = (item.status || '').toUpperCase();
      if (s === 'TAMAMLANDI' || s === 'COMPLETED') return acc + 100;
      if (s === 'DEVAM_EDIYOR' || s === 'IN_PROGRESS') {
        const itemPct = calculateItemProgress(item).percent;
        return acc + Math.max(itemPct, 50); // Süreçte olan her işe en az %50 başarı/ilerleme katkısı
      }
      return acc;
    }, 0);
    return Math.round(totalWeightSum / totalFindings);
  }, [allItems, totalFindings]);

  // ─────────────────────────────────────────────────────────────
  // TÜM İÇERİKLERİ VE KATEGORİLERİ KONSOLİDE EXCEL'E DÖKME FONKSİYONU
  // ─────────────────────────────────────────────────────────────
  const handleExportComprehensiveExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      const exportDateStr = new Date().toISOString().split('T')[0];

      // 1. SAYFA: GENEL YÖNETİCİ ÖZETİ & KPI'LAR
      const generalSummaryData = [
        { 'Metrik': 'Rapor Tarihi', 'Değer': new Date().toLocaleDateString('tr-TR') },
        { 'Metrik': 'Kapsamdaki Tesis Sayısı', 'Değer': isAllSelected ? accessibleFacilities.length : selectedFacilityIds.length },
        { 'Metrik': 'Toplam Denetim / Tutanak Sayısı', 'Değer': audits.length },
        { 'Metrik': 'Toplam Tespit Maddesi Sayısı', 'Değer': totalFindings },
        { 'Metrik': 'Tamamlanan / Kapatılan Madde', 'Değer': completedCount },
        { 'Metrik': 'Devam Eden / Süreçteki Madde', 'Değer': inProgressCount },
        { 'Metrik': 'Açık / Bekleyen Risk Sayısı', 'Değer': openCount },
        { 'Metrik': 'Genel Konsolide Uyum Skoru', 'Değer': `%${overallSuccessRate}` },
        { 'Metrik': 'Doğrudan Kapanma Oranı', 'Değer': `%${rawCompletedRate}` },
        { 'Metrik': 'Devam Eden İşlem Oranı', 'Değer': `%${overallInProgressRate}` },
        { 'Metrik': 'Açık Risk Oranı', 'Değer': `%${overallOpenRate}` },
        { 'Metrik': 'Toplam Kanıt / Aksiyon Kaydı', 'Değer': totalEvidenceCount }
      ];
      const wsGeneral = XLSX.utils.json_to_sheet(generalSummaryData);
      wsGeneral['!cols'] = [{ wch: 35 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(wb, wsGeneral, 'Yönetici Özeti');

      // 2. SAYFA: KATEGORİ BAZLI ANALİZ & UYUM SKORLARI
      const categoryData = categoryStats.map((cat, idx) => ({
        'Sıra': idx + 1,
        'Kategori Adı': cat.name,
        'Toplam Tespit': cat.total,
        'Tamamlanan': cat.completed,
        'Devam Eden': cat.inProgress,
        'Bekleyen / Açık': cat.open,
        'Uyum Skoru (%)': `%${cat.pct}`,
        'Tamamlanma Oranı (%)': `%${cat.rawCompletedPct}`,
        'Süreçteki Oranı (%)': `%${cat.inProgPct}`,
        'Açık Risk Oranı (%)': `%${cat.openPct}`
      }));
      const wsCategory = XLSX.utils.json_to_sheet(categoryData);
      wsCategory['!cols'] = [
        { wch: 6 },
        { wch: 35 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 }
      ];
      XLSX.utils.book_append_sheet(wb, wsCategory, 'Kategori Dağılımı');

      // 3. SAYFA: TESİS BAZLI PERFORMANS & LİG KARNESİ
      const facilityData = facilityStats.map((fac, idx) => ({
        'Sıra': idx + 1,
        'Tesis Adı': fac.name,
        'Tutanak Sayısı': fac.auditsCount,
        'Toplam Tespit': fac.total,
        'Kapatılan': fac.completed,
        'Süreçte': fac.inProgress,
        'Bekleyen': fac.open,
        'Uyum Skoru (%)': `%${fac.pct}`,
        'Tamamlanma Oranı (%)': `%${fac.rawCompletedPct}`,
        'Açık Risk Oranı (%)': `%${fac.openPct}`
      }));
      const wsFacility = XLSX.utils.json_to_sheet(facilityData);
      wsFacility['!cols'] = [
        { wch: 6 },
        { wch: 32 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 20 },
        { wch: 20 }
      ];
      XLSX.utils.book_append_sheet(wb, wsFacility, 'Tesis Karnesi');

      // 4. SAYFA: DEPARTMAN & SORUMLU BİRİM DAĞILIMI
      const respData = responsibleStats.map((r, idx) => ({
        'Sıra': idx + 1,
        'Sorumlu Departman / Birim': r.name,
        'Toplam İş': r.total,
        'Tamamlanan': r.completed,
        'Devam Eden': r.inProgress,
        'Açık / Masada Bekleyen': r.open,
        'Tamamlama Başarısı (%)': `%${r.pct}`,
        'Açık Yük Payı (%)': `%${r.openPct}`
      }));
      const wsResp = XLSX.utils.json_to_sheet(respData);
      wsResp['!cols'] = [
        { wch: 6 },
        { wch: 30 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 25 },
        { wch: 22 },
        { wch: 20 }
      ];
      XLSX.utils.book_append_sheet(wb, wsResp, 'Departman Yükü');

      // 5. SAYFA: TÜM TESPİT MADDELERİ VE DETAYLAR (GENİŞ TABLO)
      const findingRows = allItems.map((item: any) => {
        const itemAudit = audits.find((a: any) => (a.items || []).some((i: any) => i.id === item.id));
        const itemFacilityName = itemAudit?.facility?.name || facilities.find((f: any) => f.id === itemAudit?.facilityId)?.name || 'Bilinmeyen Tesis';
        const progressInfo = calculateItemProgress(item);
        const { title: itemTitle, detail: itemDetail } = splitItemTopic(item.topic, 100);
        
        const rawStatus = (item.status || '').toUpperCase();
        let statusTr = 'Bekliyor / Başlamadı';
        if (rawStatus === 'TAMAMLANDI' || rawStatus === 'COMPLETED') statusTr = 'Tamamlandı';
        else if (rawStatus === 'DEVAM_EDIYOR' || rawStatus === 'IN_PROGRESS') statusTr = 'Devam Ediyor';

        const lastAction = item.actions && item.actions.length > 0 ? item.actions[item.actions.length - 1] : null;

        return {
          'Tesis Adı': itemFacilityName,
          'Denetim / Tutanak': itemAudit?.title || '',
          'Denetim Tarihi': itemAudit?.auditDate ? new Date(itemAudit.auditDate).toLocaleDateString('tr-TR') : '',
          'Madde No': item.orderNo || '',
          'Kategori': item.category || 'Genel Yangın Güvenliği',
          'Tespit / Konu Başlığı': itemTitle,
          'Tespit Detayı': itemDetail || item.topic || '',
          'Alınan Karar / Aksiyon Planı': item.action || '',
          'Sorumlu Birim / Kişi': item.responsible || '',
          'Termin / Hedef Tarih': item.dueDate ? new Date(item.dueDate).toLocaleDateString('tr-TR') : '',
          'Durum': statusTr,
          'İlerleme (%)': `%${progressInfo.percent}`,
          'Aksiyon Sayısı': item.actions?.length || 0,
          'Tespit Fotoğraf Sayısı': item.findingPhotos?.length || 0,
          'Son Aksiyon Açıklaması': lastAction?.explanation || '',
          'Son Aksiyonu Yapan': lastAction?.performedBy || '',
          'Son Aksiyon Tarihi': lastAction?.actionDate ? new Date(lastAction.actionDate).toLocaleDateString('tr-TR') : ''
        };
      });
      const wsFindings = XLSX.utils.json_to_sheet(findingRows);
      wsFindings['!cols'] = [
        { wch: 25 },
        { wch: 25 },
        { wch: 14 },
        { wch: 10 },
        { wch: 28 },
        { wch: 35 },
        { wch: 45 },
        { wch: 35 },
        { wch: 25 },
        { wch: 15 },
        { wch: 18 },
        { wch: 14 },
        { wch: 14 },
        { wch: 22 },
        { wch: 40 },
        { wch: 22 },
        { wch: 16 }
      ];
      XLSX.utils.book_append_sheet(wb, wsFindings, 'Tüm Tespit Maddeleri');

      // 6. SAYFA: TÜM SAHA AKSİYONLARI VE KANIT KAYITLARI
      const allActionRows: any[] = [];
      allItems.forEach((item: any) => {
        const itemAudit = audits.find((a: any) => (a.items || []).some((i: any) => i.id === item.id));
        const itemFacilityName = itemAudit?.facility?.name || facilities.find((f: any) => f.id === itemAudit?.facilityId)?.name || 'Tesis';
        const { title: itemTitle } = splitItemTopic(item.topic, 70);

        (item.actions || []).forEach((act: any, actIdx: number) => {
          allActionRows.push({
            'Tesis Adı': itemFacilityName,
            'Tutanak': itemAudit?.title || '',
            'Madde No': item.orderNo || '',
            'Madde Başlığı': itemTitle,
            'Kategori': item.category || '',
            'Aksiyon No': actIdx + 1,
            'Açıklama / Yapılan İşlem': act.explanation || '',
            'İşlemi Yürüten': act.performedBy || '',
            'Departman': act.department || '',
            'Aksiyon Tarihi': act.actionDate ? new Date(act.actionDate).toLocaleDateString('tr-TR') : '',
            'İşlem Durumu': act.status || '',
            'Katkı / İlerleme (%)': act.progressPercent !== undefined ? `%${act.progressPercent}` : '',
            'Kanıt Fotoğrafı Adedi': act.evidencePhotos?.length || 0,
            'Kanıt Bağlantıları': (act.evidencePhotos || []).join(' ; ')
          });
        });
      });

      if (allActionRows.length > 0) {
        const wsActions = XLSX.utils.json_to_sheet(allActionRows);
        wsActions['!cols'] = [
          { wch: 22 },
          { wch: 22 },
          { wch: 10 },
          { wch: 30 },
          { wch: 25 },
          { wch: 12 },
          { wch: 45 },
          { wch: 20 },
          { wch: 20 },
          { wch: 15 },
          { wch: 15 },
          { wch: 18 },
          { wch: 20 },
          { wch: 40 }
        ];
        XLSX.utils.book_append_sheet(wb, wsActions, 'Saha Aksiyonları ve Kanıtlar');
      }

      // Dosyayı indir
      const fileName = `Yangin_Guvenligi_Yonetici_Konsolu_${exportDateStr}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success('Yangın Güvenliği tüm verileri başarıyla Excel olarak indirildi!');
    } catch (err: any) {
      console.error('Excel indirme hatası:', err);
      toast.error('Excel dosyası oluşturulurken bir hata oluştu');
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* EXECUTIVE HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60 p-6 md:p-8 text-white shadow-xl">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-red-500/20 text-red-300 border border-red-500/30 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              Üst Yönetim Karar Destek & İzleme
            </div>
            
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                Yangın Güvenliği Yönetici Konsolu
                <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-white/10 text-slate-300 border border-white/10 hidden sm:inline-block">
                  Konsolide Görünüm
                </span>
              </h1>
              <p className="text-slate-300 text-sm md:text-base mt-1.5 max-w-2xl leading-relaxed">
                {isAllSelected 
                  ? `Bağlı tüm tesisler (${accessibleFacilities.length} Tesis) genelindeki denetim sonuçları, risk dağılımı ve kapatılmayı bekleyen aksiyonların üst düzey özeti.`
                  : selectedFacilityIds.length > 0
                  ? `Seçilen ${selectedFacilityIds.length} tesisin konsolide denetim durumları, risk görünürlüğü ve aksiyon tamamlama performansı.`
                  : 'Filtre uygulanmadı. Lütfen aşağıdaki kontrol çubuğundan tesis seçimi yapın.'
                }
              </p>
            </div>

            {/* Hızlı Kapsam Göstergeleri */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 shadow-xs">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <strong>{isAllSelected ? accessibleFacilities.length : selectedFacilityIds.length}</strong> Tesis Kapsamda
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 shadow-xs">
                <ClipboardList className="w-3.5 h-3.5 text-blue-400" />
                <strong>{audits.length}</strong> Denetim Tutanak
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 shadow-xs">
                <FileText className="w-3.5 h-3.5 text-slate-300" />
                <strong>{totalFindings}</strong> Toplam Madde
              </span>
            </div>
          </div>

          {/* Banner Sağ Üst: Hızlı Özet Rozeti & Excel Dışa Aktar Butonu */}
          <div className="shrink-0 flex items-center gap-3">
            <Button
              type="button"
              onClick={handleExportComprehensiveExcel}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-lg border border-emerald-400/40 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="Tüm yönetici özetini, kategorileri, tesisleri, tespit maddelerini ve aksiyonları Excel'e aktar"
            >
              <Download className="w-4 h-4 text-emerald-100" />
              <span>Tümünü Excel'e Aktar</span>
            </Button>

            <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4 hidden lg:flex flex-col items-center justify-center text-center min-w-[170px]">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Konsolide Başarı</span>
              <span className="text-3xl font-black text-emerald-400 mt-1">%{overallSuccessRate}</span>
              <span className="text-[11px] text-slate-300 mt-0.5">
                {completedCount} / {totalFindings} Tamamlandı
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* YÖNETİCİ KONTROL & TESİS FİLTRELEME ÇUBUĞU (HEADER DIŞINDA BAĞIMSIZ PANEL) */}
      {hasMultipleFacilities && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 md:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center shrink-0">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Konsolidasyon Filtresi
                </span>
                <Badge variant="secondary" className="text-[10px] font-semibold py-0 px-1.5 h-5">
                  {isAllSelected 
                    ? `Tüm Tesisler (${accessibleFacilities.length})` 
                    : `${selectedFacilityIds.length} Tesis Seçili`}
                </Badge>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                {isAllSelected 
                  ? 'Tüm bağlı tesislerin verileri birleştirilerek gösterilmektedir.' 
                  : selectedFacilityIds.length > 0 
                  ? `${selectedFacilityIds.length} tesisin verileri konsolide hesaplanıyor.` 
                  : 'Lütfen incelemek istediğiniz tesisleri seçin.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Çoklu Tesis Seçim Dropdown Tetikleyici */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(prev => !prev)}
                className="flex items-center justify-between gap-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition-all min-w-[240px] text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="w-4 h-4 text-red-600 shrink-0" />
                  <span className="truncate">
                    {isAllSelected
                      ? `Tüm Tesisler (${accessibleFacilities.length})`
                      : selectedFacilityIds.length === 0
                      ? 'Tesis Seçiniz'
                      : selectedFacilityIds.length === 1
                      ? accessibleFacilities.find((f: any) => f.id === selectedFacilityIds[0])?.name || '1 Tesis Seçili'
                      : `${selectedFacilityIds.length} Tesis Konsolide`
                    }
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Açılır Menü */}
              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
                    {/* Dropdown Header */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          Tesisleri Filtrele & Konsolide Et
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {isAllSelected 
                            ? 'Tüm tesisler seçili' 
                            : `${selectedFacilityIds.length} / ${accessibleFacilities.length} tesis seçili`}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={selectAllFacilities}
                          className="text-[11px] h-7 px-2 font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          Tümü
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={clearFacilitySelection}
                          className="text-[11px] h-7 px-2 font-bold text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Temizle
                        </Button>
                      </div>
                    </div>

                    {/* Arama Input */}
                    <div className="p-2.5 border-b border-slate-100 dark:border-slate-800">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <Input
                          type="text"
                          placeholder="Tesis adı ile ara..."
                          value={facilitySearchText}
                          onChange={e => setFacilitySearchText(e.target.value)}
                          className="h-8 text-xs pl-8 pr-3 bg-slate-50 dark:bg-slate-800/60"
                        />
                      </div>
                    </div>

                    {/* Tesis Listesi (Çoklu Checkbox) */}
                    <div className="max-h-72 overflow-y-auto p-1.5 space-y-1 divide-y divide-slate-100/50 dark:divide-slate-800/50">
                      {/* Tüm Tesisler Özel Seçeneği */}
                      <div
                        onClick={selectAllFacilities}
                        className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                          isAllSelected
                            ? 'bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200 font-bold'
                            : 'hover:bg-slate-100/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                            isAllSelected ? 'bg-red-600 text-white' : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                          }`}>
                            {isAllSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="text-xs">Tüm Tesisler (Konsolide)</span>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {accessibleFacilities.length} Tesis
                        </Badge>
                      </div>

                      {accessibleFacilities
                        .filter((f: any) => !facilitySearchText || f.name.toLowerCase().includes(facilitySearchText.toLowerCase()))
                        .map((fac: any) => {
                          const isChecked = !isAllSelected && selectedFacilityIds.includes(fac.id);
                          const stat = globalFacilityStats.find((s: any) => s.id === fac.id);

                          return (
                            <div
                              key={fac.id}
                              onClick={() => toggleFacilitySelection(fac.id)}
                              className={`p-2 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-2 ${
                                isChecked
                                  ? 'bg-red-50/80 dark:bg-red-950/40 text-red-900 dark:text-red-200'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${
                                  isChecked
                                    ? 'bg-red-600 text-white'
                                    : isAllSelected
                                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                                    : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                                }`}>
                                  {(isChecked || isAllSelected) && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <div className="min-w-0">
                                  <p className={`text-xs truncate ${isChecked ? 'font-bold' : 'font-medium'}`}>
                                    {fac.name}
                                  </p>
                                  <span className="text-[10px] text-slate-400">
                                    {stat?.total || 0} Tespit · %{stat?.pct || 0} Başarı
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  selectSingleFacility(fac.id);
                                }}
                                className="text-[10px] text-slate-400 hover:text-red-600 hover:underline px-1.5 py-0.5 rounded shrink-0 font-medium"
                                title="Sadece bu tesisi seç"
                              >
                                Tek Seç
                              </button>
                            </div>
                          );
                        })}
                    </div>

                    {/* Dropdown Footer */}
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">
                        {isAllSelected ? 'Tüm Tesisler devrede' : `${selectedFacilityIds.length} tesis birleştirildi`}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setIsDropdownOpen(false)}
                        className="text-xs h-7 px-3 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold"
                      >
                        Uygula
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Hızlı Tüm Tesisleri Sıfırla / Getir */}
            <button
              type="button"
              onClick={selectAllFacilities}
              title="Tüm tesisleri konsolide getir"
              className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
                isAllSelected
                  ? 'border-slate-200 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  : 'border-amber-400 bg-amber-400 text-slate-950 font-bold hover:bg-amber-300 shadow-xs'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* YÖNETİCİ STRATEJİK KPI KARTLARI (YÖNETİM BAKIŞI) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KART 1: UYUM VE BAŞARI ORANI */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Genel Uyum Skoru
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  %{overallSuccessRate}
                </span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                  {completedCount} / {totalFindings} Çözüldü
                </span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span>Uyum Seviyesi:</span>
            <span className={`font-bold ${overallSuccessRate >= 70 ? 'text-emerald-600' : overallSuccessRate >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>
              {overallSuccessRate >= 70 ? '● Yüksek Uyum' : overallSuccessRate >= 40 ? '● Orta Riskli' : '● Kritik Müdahale Gerekli'}
            </span>
          </div>
        </div>

        {/* KART 2: BEKLEYEN RİSK VE AKSİYONLAR */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                Müdahale Bekleyen
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-rose-600 tracking-tight">
                  {openCount}
                </span>
                <span className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
                  %{overallOpenRate} Açık Risk
                </span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span>Öncelik:</span>
            <span className="font-bold text-rose-600">
              Derhal aksiyon planlanmalı
            </span>
          </div>
        </div>

        {/* KART 3: DEVAM EDEN İŞLEMLER */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Süreçte Olanlar
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-600 tracking-tight">
                  {inProgressCount}
                </span>
                <span className="text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                  %{overallInProgressRate} Sahada
                </span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Clock className="w-6 h-6 stroke-[2.2]" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span>Saha Durumu:</span>
            <span className="font-bold text-amber-600">
              Satınalma / Teknik Devamda
            </span>
          </div>
        </div>

        {/* KART 4: DENETİM VE KAPSAM KAPASİTESİ */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Denetim Havuzu
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {audits.length}
                </span>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
                  {isAllSelected ? accessibleFacilities.length : selectedFacilityIds.length} Tesis
                </span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ClipboardList className="w-6 h-6 stroke-[2.2]" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span>Toplam İnceleme:</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {totalFindings} Risk / Madde Kaydı
            </span>
          </div>
        </div>

      </div>

      {/* YÖNETİCİ KONSOLİDE SAĞLIK VE RİSK GÖSTERGE PANELİ (RADYAL GAUGE & SAĞLIK MATRİSİ) */}
      {totalFindings > 0 && (
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-7 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            
            {/* SOL KISIM: YÖNETİM RADYAL GAUGE (YUVARLAK SAĞLIK GÖSTERGESİ) */}
            <div className="flex flex-col sm:flex-row items-center gap-6 lg:border-r lg:border-slate-100 dark:lg:border-slate-800 lg:pr-8">
              {/* Radial Gauge SVG */}
              <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  {/* Track Background */}
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    strokeWidth="11"
                    className="stroke-slate-100 dark:stroke-slate-800 fill-none"
                  />
                  {/* Success Arc (Emerald) */}
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    strokeWidth="11"
                    strokeDasharray={2 * Math.PI * 48}
                    strokeDashoffset={2 * Math.PI * 48 * (1 - overallSuccessRate / 100)}
                    strokeLinecap="round"
                    className="stroke-emerald-500 fill-none transition-all duration-1000 ease-out"
                  />
                </svg>
                {/* Gauge Inner Info */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    %{overallSuccessRate}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Uyum
                  </span>
                </div>
              </div>

              {/* Gauge Açıklama ve Durum */}
              <div className="space-y-2 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <Gauge className="w-3.5 h-3.5 text-red-600" />
                  Yangın Güvenliği İndeksi
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {overallSuccessRate >= 80 
                    ? 'Mükemmel Güvenlik Seviyesi' 
                    : overallSuccessRate >= 50 
                    ? 'Kabul Edilebilir Risk Düzeyi' 
                    : 'Yüksek Müdahale Önceliği'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                  Kapatılan bulgular ve sahada yürütülen aktif aksiyon süreçleri ağırlıklı olarak hesaplanmıştır.
                </p>
              </div>
            </div>

            {/* SAĞ KISIM: 3 BOYUTLU RİSK VE ÇÖZÜM MATRİSİ */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Tamamlanan / Kapatılan */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/40 dark:from-emerald-950/30 dark:to-emerald-900/10 border border-emerald-200/60 dark:border-emerald-800/40 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    Kapatılan Bulgular
                  </span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-emerald-700 dark:text-emerald-200">
                      {completedCount}
                    </span>
                    <span className="text-xs font-bold text-emerald-600">
                      (%{rawCompletedRate})
                    </span>
                  </div>
                  <div className="w-full bg-emerald-200/60 dark:bg-emerald-900/40 h-2 rounded-full overflow-hidden mt-2">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-700" 
                      style={{ width: `${rawCompletedRate}%` }} 
                    />
                  </div>
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                  Risk tamamen giderildi
                </p>
              </div>

              {/* Devam Edenler */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/40 dark:from-amber-950/30 dark:to-amber-900/10 border border-amber-200/60 dark:border-amber-800/40 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                    Süreçteki Aksiyonlar
                  </span>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-amber-700 dark:text-amber-200">
                      {inProgressCount}
                    </span>
                    <span className="text-xs font-bold text-amber-600">
                      (%{overallInProgressRate})
                    </span>
                  </div>
                  <div className="w-full bg-amber-200/60 dark:bg-amber-900/40 h-2 rounded-full overflow-hidden mt-2">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-700" 
                      style={{ width: `${overallInProgressRate}%` }} 
                    />
                  </div>
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                  Saha montaj & tedarikte
                </p>
              </div>

              {/* Açık Riskler */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100/40 dark:from-rose-950/30 dark:to-rose-900/10 border border-rose-200/60 dark:border-rose-800/40 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                    Açık / Bekleyen
                  </span>
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-rose-700 dark:text-rose-200">
                      {openCount}
                    </span>
                    <span className="text-xs font-bold text-rose-600">
                      (%{overallOpenRate})
                    </span>
                  </div>
                  <div className="w-full bg-rose-200/60 dark:bg-rose-900/40 h-2 rounded-full overflow-hidden mt-2">
                    <div 
                      className="bg-rose-500 h-full rounded-full transition-all duration-700" 
                      style={{ width: `${overallOpenRate}%` }} 
                    />
                  </div>
                </div>
                <p className="text-[11px] text-rose-700 dark:text-rose-400 font-medium">
                  Müdahale planlanmalı
                </p>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* TESİS BAZINDA KARŞILAŞTIRMA VE DURUMLAR (YÖNETİCİ VEYA ÇOKLU TESİS KULLANICISI) */}
      {(isAllFacilities || hasMultipleFacilities) && facilityStats.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

            {/* Tesis kartlarından birine odaklanıldığında veya filtre aktifken temizleme butonu */}
            {drilldownFacilityId ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDrilldownFacilityId(null)}
                className="self-start sm:self-auto text-xs h-8 px-3 font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800 flex items-center gap-1.5 shadow-xs transition-all"
                title="Seçili tesis filtresini temizle ve kayıtlı tesislerine geri dön"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
                <span>
                  {selectedFacilityIds.includes('all')
                    ? 'Filtreyi Temizle (Tüm Tesisler)'
                    : `Filtreyi Temizle (${selectedFacilityIds.length} Tesise Dön)`}
                </span>
              </Button>
            ) : !isAllSelected ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectAllFacilities}
                className="self-start sm:self-auto text-xs h-8 px-3 font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-xs transition-all"
                title="Tüm tesislerin konsolide görünümüne geri dön"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                <span>Tüm Tesislere Dön</span>
              </Button>
            ) : null}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {facilityStats.map(stat => {
              const isCardDrilldownActive = drilldownFacilityId === stat.id;
              const isSelectedInFilter = selectedFacilityIds.includes('all') || selectedFacilityIds.includes(stat.id);
              const complianceLevel = stat.pct >= 80 ? 'high' : stat.pct >= 40 ? 'medium' : 'low';

              return (
                <div
                  key={stat.id}
                  onClick={() => handleToggleCardDrilldown(stat.id)}
                  className={`group relative cursor-pointer rounded-2xl p-5 transition-all duration-200 border bg-white dark:bg-slate-900 shadow-sm hover:shadow-md ${
                    isCardDrilldownActive 
                      ? 'border-red-500 ring-2 ring-red-500/25 bg-red-50/15 dark:bg-red-950/20' 
                      : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Kart Başlığı ve Mini Radial Başarı Rozeti */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          <Building className="w-4 h-4 shrink-0" />
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {stat.name}
                        </h4>
                        {isCardDrilldownActive && (
                          <Badge className="bg-red-600 text-white text-[10px] px-1.5 py-0 h-4">
                            Odaklandı
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>{stat.auditsCount} Tutanak</span>
                        <span>•</span>
                        <span>{stat.total} Tespit Maddesi</span>
                      </div>
                    </div>

                    {/* Mini Radial Gauge Başarı Skoru */}
                    <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <circle
                          cx="18"
                          cy="18"
                          r="14"
                          strokeWidth="3.5"
                          className="stroke-slate-100 dark:stroke-slate-800 fill-none"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="14"
                          strokeWidth="3.5"
                          strokeDasharray={2 * Math.PI * 14}
                          strokeDashoffset={2 * Math.PI * 14 * (1 - stat.pct / 100)}
                          strokeLinecap="round"
                          className={`${
                            complianceLevel === 'high' 
                              ? 'stroke-emerald-500' 
                              : complianceLevel === 'medium' 
                              ? 'stroke-amber-500' 
                              : 'stroke-rose-500'
                          } fill-none transition-all duration-700`}
                        />
                      </svg>
                      <span className={`absolute text-[10px] font-black ${
                        complianceLevel === 'high' 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : complianceLevel === 'medium' 
                          ? 'text-amber-600 dark:text-amber-400' 
                          : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        %{stat.pct}
                      </span>
                    </div>
                  </div>

                  {/* 3'lü Yönetim Durum Kutucukları */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100/80 dark:border-emerald-900/30 text-center">
                      <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 block uppercase tracking-wider">
                        Kapatılan
                      </span>
                      <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-200">
                        {stat.completed}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100/80 dark:border-amber-900/30 text-center">
                      <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 block uppercase tracking-wider">
                        Süreçte
                      </span>
                      <span className="text-sm font-extrabold text-amber-700 dark:text-amber-200">
                        {stat.inProgress}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-100/80 dark:border-rose-900/30 text-center">
                      <span className="text-[10px] font-bold text-rose-800 dark:text-rose-300 block uppercase tracking-wider">
                        Bekleyen
                      </span>
                      <span className="text-sm font-extrabold text-rose-700 dark:text-rose-200">
                        {stat.open}
                      </span>
                    </div>
                  </div>

                  {/* Alt Durum Çizgisi ve Etiket */}
                  <div className="mt-3 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Uyum Karnesi:</span>
                    <span className={`font-bold flex items-center gap-1 ${
                      complianceLevel === 'high' 
                        ? 'text-emerald-600' 
                        : complianceLevel === 'medium' 
                        ? 'text-amber-600' 
                        : 'text-rose-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        complianceLevel === 'high' ? 'bg-emerald-500' : complianceLevel === 'medium' ? 'bg-amber-500' : 'bg-rose-500'
                      }`} />
                      {complianceLevel === 'high' ? 'Yüksek Uyum' : complianceLevel === 'medium' ? 'Orta Risk' : 'Kritik Müdahale'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ÜST DÜZEY YÖNETİCİ GRAFİK & GÖSTERGE ANALİZİ (RADAR DİYAGRAMI & TESİS ISI / RİSK HARİTASI) */}
      {categoryStats.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-red-600" />
                Üst Düzey Risk Haritası & Karşılaştırmalı Gösterge Analizi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Yangın güvenliği alanlarının radar yetkinlik dağılımı ve tesislerin risk/tamamlanma ısı matrisi
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Badge variant="outline" className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                {facilities.filter((f: any) => selectedFacilityIds.includes('all') || selectedFacilityIds.includes(f.id)).length} Tesis Konsolide
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            
            {/* SOL (lg:col-span-5): YANGIN GÜVENLİĞİ ÖRÜMCEK AĞI (RADAR DİYAGRAMI) */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Kategori Yetkinlik & Risk Radarı
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                  Hedef: %100 Uyum
                </span>
              </div>

              {/* Radar Grafiği */}
              <div className="w-full h-60 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="75%"
                    data={categoryStats.map(c => ({
                      kategori: c.name.length > 14 ? c.name.slice(0, 12) + '..' : c.name,
                      fullKategori: c.name,
                      uyumOrani: c.pct,
                      toplam: c.total
                    }))}
                  >
                    <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                    <PolarAngleAxis 
                      dataKey="kategori" 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} 
                    />
                    <PolarRadiusAxis 
                      angle={30} 
                      domain={[0, 100]} 
                      tick={{ fill: '#94a3b8', fontSize: 9 }} 
                      stroke="#cbd5e1" 
                    />
                    <Radar
                      name="Başarı Oranı (%)"
                      dataKey="uyumOrani"
                      stroke="#dc2626"
                      fill="#dc2626"
                      fillOpacity={0.35}
                    />
                    <RechartsTooltip
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs shadow-xl border border-slate-700 space-y-1">
                              <p className="font-bold text-slate-100">{d.fullKategori}</p>
                              <div className="flex items-center justify-between gap-4 text-[11px]">
                                <span className="text-slate-400">Uyum Başarısı:</span>
                                <span className="font-black text-emerald-400">%{d.uyumOrani}</span>
                              </div>
                              <div className="flex items-center justify-between gap-4 text-[11px]">
                                <span className="text-slate-400">Toplam Madde:</span>
                                <span className="font-bold text-slate-200">{d.toplam}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* EN KRİTİK 3 ZAFİYET ALANI ALARM LİSTESİ (YÖNETİCİ DARBOĞAZ GÖSTERGESİ) */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <AlertOctagon className="w-3.5 h-3.5" />
                    En Yüksek Müdahale Öncelikli 3 Alan
                  </span>
                  <span className="text-[10px] text-slate-400">Darboğaz Analizi</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {topVulnerabilities.map((v, i) => (
                    <div 
                      key={v.name}
                      onClick={() => setSelectedCategoryFilter(v.name)}
                      className="p-2 rounded-xl bg-rose-50/70 hover:bg-rose-100/70 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/40 cursor-pointer transition-all space-y-1"
                      title={`${v.name} kategorisini filtrelemek için tıklayın`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-rose-700 dark:text-rose-300">#{i + 1} Risk</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-200/60 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200">
                          %{v.pct} Uyum
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate" title={v.name}>
                        {v.name}
                      </p>
                      <div className="text-[10px] text-rose-600 dark:text-rose-400 flex items-center justify-between">
                        <span>Açık Risk:</span>
                        <span className="font-extrabold">{v.open} / {v.total}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SAĞ (lg:col-span-7): TESİSLERİN RİSK VE ÇÖZÜM ISI/BAR MATRİSİ & BENCHMARK */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Tesis Bazlı Aksiyon Yükü & Isı Dağılımı
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1 font-semibold text-emerald-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Kapatılan
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-amber-600">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Süreçte
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-rose-600">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> Bekleyen
                  </span>
                </div>
              </div>

              {/* Yatay Yığılmış Bar / Isı Grafiği */}
              <div className="w-full h-60 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={facilityStats.map(f => ({
                      name: f.name.length > 16 ? f.name.slice(0, 14) + '..' : f.name,
                      fullName: f.name,
                      kapali: f.completed,
                      surecte: f.inProgress,
                      bekleyen: f.open,
                      total: f.totalFindings,
                      pct: f.pct
                    }))}
                    layout="vertical"
                    margin={{ top: 10, right: 25, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }} 
                      width={90}
                    />
                    <RechartsTooltip
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-xl border border-slate-700 space-y-1.5 min-w-[180px]">
                              <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                                <span className="font-bold text-slate-100">{d.fullName}</span>
                                <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">%{d.pct} Başarı</span>
                              </div>
                              <div className="space-y-1 text-[11px]">
                                <div className="flex items-center justify-between text-emerald-400">
                                  <span>Kapatılan Bulgular:</span>
                                  <strong className="font-bold">{d.kapali}</strong>
                                </div>
                                <div className="flex items-center justify-between text-amber-400">
                                  <span>Süreçteki Aksiyonlar:</span>
                                  <strong className="font-bold">{d.surecte}</strong>
                                </div>
                                <div className="flex items-center justify-between text-rose-400">
                                  <span>Bekleyen Riskler:</span>
                                  <strong className="font-bold">{d.bekleyen}</strong>
                                </div>
                                <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-slate-300 font-bold">
                                  <span>Toplam Tespit:</span>
                                  <span>{d.total} Madde</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="kapali" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} name="Kapatılan" />
                    <Bar dataKey="surecte" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} name="Süreçte" />
                    <Bar dataKey="bekleyen" stackId="a" fill="#ef4444" radius={[0, 6, 6, 0]} name="Bekleyen Risk" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* TESİSLER ARASI HESAP VERİLEBİLİRLİK & BENCHMARK LİGİ */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {facilityBenchmark.bestFacility && (
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                          En Yüksek Uyum Lideri
                        </span>
                        <span className="text-xs font-black text-emerald-600">
                          %{facilityBenchmark.bestFacility.pct}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {facilityBenchmark.bestFacility.name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {facilityBenchmark.bestFacility.completed} Kapatılan / {facilityBenchmark.bestFacility.total} Toplam
                      </p>
                    </div>
                  </div>
                )}

                {facilityBenchmark.sluggishFacility && (
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-600 flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-300">
                          Acil Müdahale & Takip
                        </span>
                        <span className="text-xs font-black text-rose-600">
                          {facilityBenchmark.sluggishFacility.open} Bekleyen
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {facilityBenchmark.sluggishFacility.name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Açık Risk Oranı: %{facilityBenchmark.sluggishFacility.openPct}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* 3. BÖLÜM: YÖNETİCİ KAYNAK VE TALİMAT GÖSTERGESİ - AKSİYONLAR KİMİN MASASINDA BEKLİYOR? (SADE & TEMİZ YÖNETİM ÇİZELGESİ) */}
          {responsibleStats.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Sorumlu Birimlere Göre Aksiyon Yükü Dağılımı
                    </h3>
                    <p className="text-xs text-slate-400">
                      Bekleyen risklerin hangi ana direktörlük veya birimin inisiyatifinde olduğunu gösterir.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[11px] self-start sm:self-auto">
                  <span className="flex items-center gap-1 font-semibold text-emerald-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Tamamlanan
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-amber-600">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Süreçte
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-rose-600">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> Bekleyen
                  </span>
                </div>
              </div>

              {/* Sade, Çok Kolay Okunur Yatay Departman Çizelgesi */}
              <div className="space-y-3.5">
                {responsibleStats.map((resp) => {
                  const compPct = resp.total > 0 ? (resp.completed / resp.total) * 100 : 0;
                  const inProgPct = resp.total > 0 ? (resp.inProgress / resp.total) * 100 : 0;
                  const openPct = resp.total > 0 ? (resp.open / resp.total) * 100 : 0;

                  return (
                    <div 
                      key={resp.name}
                      className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/40 dark:hover:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800/70 transition-all space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: resp.color }} />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                            {resp.name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            ({resp.total} Tespit)
                          </span>
                        </div>

                        {/* Sayısal Özet Rozetleri */}
                        <div className="flex items-center gap-2 self-start sm:self-auto text-[11px]">
                          {resp.open > 0 ? (
                            <span className="font-extrabold text-rose-600 dark:text-rose-400 bg-rose-100/80 dark:bg-rose-950/60 px-2 py-0.5 rounded-md">
                              {resp.open} Bekliyor
                            </span>
                          ) : (
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                              Tamamı Kapatıldı
                            </span>
                          )}
                          {resp.inProgress > 0 && (
                            <span className="text-amber-600 dark:text-amber-400 font-medium bg-amber-100/70 dark:bg-amber-950/50 px-2 py-0.5 rounded-md">
                              {resp.inProgress} Süreçte
                            </span>
                          )}
                          {resp.completed > 0 && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-100/70 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                              {resp.completed} Çözüldü
                            </span>
                          )}
                          <span className="font-bold text-slate-600 dark:text-slate-300 ml-1">
                            %{resp.pct} Uyum
                          </span>
                        </div>
                      </div>

                      {/* İnce ve Şık Dağılım Çubuğu */}
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden flex">
                        <div 
                          className="bg-emerald-500 h-full transition-all duration-500" 
                          style={{ width: `${compPct}%` }}
                          title={`Kapatılan: ${resp.completed}`}
                        />
                        <div 
                          className="bg-amber-500 h-full transition-all duration-500" 
                          style={{ width: `${inProgPct}%` }}
                          title={`Süreçte: ${resp.inProgress}`}
                        />
                        <div 
                          className="bg-rose-500 h-full transition-all duration-500" 
                          style={{ width: `${openPct}%` }}
                          title={`Bekleyen Risk: ${resp.open}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      <div className="space-y-6">
        {/* Bölüm Başlığı & Filtre Kontrolleri */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-md">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-600/30 border border-red-500/40 flex items-center justify-center text-red-400">
                <Layers className="w-4 h-4" />
              </div>
              <h2 className="text-lg md:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Kategori Durumları & Tespit Maddeleri Filtresi
              </h2>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              {selectedCategoryFilter === 'ALL'
                ? 'Seçili tesislerinizin tüm kategorilerdeki tespitleri aşağıda listelenmektedir. Belirli bir alana odaklanmak için aşağıdaki kategori kartlarından birini seçebilirsiniz.'
                : `Şu an "${selectedCategoryFilter}" kategorisindeki tespitler filtreleniyor. Tüm listeye geri dönmek için "Tüm Maddeler" butonuna tıklayabilirsiniz.`
              }
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {selectedCategoryFilter !== 'ALL' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCategoryFilter('ALL')}
                className="text-xs h-8 px-3 font-bold bg-white/10 hover:bg-white/20 text-white border-white/20 shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1 text-red-400" />
                Tüm Maddelere Dön ({totalFindings})
              </Button>
            )}
            <Badge className="bg-red-600/80 text-white text-xs px-3 py-1 font-bold shadow-xs">
              {selectedCategoryFilter === 'ALL' ? 'Tüm Kategoriler' : selectedCategoryFilter}
            </Badge>
          </div>
        </div>

        {/* ETKİLEŞİMLİ KATEGORİ BAŞARI VE DAĞILIM PANELİ: DİNAMİK SEKMELER & GENİŞLETİLMİŞ KOKPİT */}
        {categoryStats.length === 0 ? (
          <Card className="border-dashed border border-slate-200 dark:border-slate-800">
            <CardContent className="p-8 text-center text-xs text-slate-500">
              Kapsamdaki tesisler için henüz kategori bazlı kayıtlı tespit maddesi bulunmamaktadır.
            </CardContent>
          </Card>
        ) : (() => {
          // Aktif seçili kategoriye ait veriler (seçili değilse konsolide veriler)
          const activeCat = selectedCategoryFilter === 'ALL'
            ? null
            : categoryStats.find(c => c.name === selectedCategoryFilter);

          const currentTotal = activeCat ? activeCat.total : totalFindings;
          const currentCompleted = activeCat ? activeCat.completed : completedCount;
          const currentInProgress = activeCat ? activeCat.inProgress : inProgressCount;
          const currentOpen = activeCat ? activeCat.open : openCount;
          const currentPct = activeCat ? activeCat.pct : overallSuccessRate;
          const currentInProgPct = activeCat ? activeCat.inProgPct : overallInProgressRate;
          const currentOpenPct = activeCat ? activeCat.openPct : overallOpenRate;

          // Gauge Başlık & Durum Belirleme
          const gaugeTitle = activeCat ? `${activeCat.name} İndeksi` : 'Yangın Güvenliği İndeksi';
          const gaugeStatus = currentPct >= 80 
            ? 'Mükemmel Güvenlik Seviyesi' 
            : currentPct >= 50 
            ? 'Kabul Edilebilir Risk Düzeyi' 
            : 'Yüksek Müdahale Önceliği';

          return (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-7">
              
              {/* ÜST BÖLÜM: DİNAMİK İNTERAKTİF KATEGORİ SEKMELERİ (Tıklanabilir Şık Hap Butonlar) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Kategorilere Göre İncele & Filtrele
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                      (Oranları görmek ve aşağıdaki tespitleri listelemek için kategoriye tıklayın)
                    </span>
                  </div>
                  {selectedCategoryFilter !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryFilter('ALL')}
                      className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Tümünü Göster</span>
                    </button>
                  )}
                </div>

                {/* Dinamik Yatay Kategori Çipleri */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Tümü / Konsolide Çipi */}
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryFilter('ALL')}
                    className={`group px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2.5 border cursor-pointer ${
                      selectedCategoryFilter === 'ALL'
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 shadow-md ring-2 ring-slate-900/10 dark:ring-white/20 scale-[1.02]'
                        : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${selectedCategoryFilter === 'ALL' ? 'bg-red-500 ring-2 ring-white/60' : 'bg-slate-400'}`} />
                    <span>Tüm Kategoriler</span>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                      selectedCategoryFilter === 'ALL'
                        ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                        : 'bg-slate-200/70 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      %{overallSuccessRate}
                    </span>
                  </button>

                  {/* Kategori Çipleri */}
                  {categoryStats.map((cat) => {
                    const isSelected = selectedCategoryFilter === cat.name;
                    const badgeTone = cat.pct >= 80
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : cat.pct >= 50
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';

                    return (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => setSelectedCategoryFilter(isSelected ? 'ALL' : cat.name)}
                        className={`group px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                          isSelected
                            ? 'bg-red-600 text-white border-red-600 shadow-md ring-4 ring-red-600/20 scale-[1.02]'
                            : 'bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-white' : 'bg-slate-400 dark:bg-slate-500'}`} />
                        <span className="truncate max-w-[170px] sm:max-w-none">{cat.name}</span>
                        <span className="text-[10px] font-semibold opacity-70">
                          ({cat.total})
                        </span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black shrink-0 ${
                          isSelected ? 'bg-white/20 text-white' : badgeTone
                        }`}>
                          %{cat.pct}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ALT BÖLÜM: GENİŞ, FERAH VE ŞIK YÖNETİCİ KOKPİTİ (DAİRESEL GAUGE + 3 RENKLİ DURUM KARTI) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-3 border-t border-slate-100 dark:border-slate-800">
                
                {/* SOL (lg:col-span-5): Dairesel Halka İndeksi & Başlık */}
                <div className="lg:col-span-5 flex items-center gap-6 p-2">
                  <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                      {/* Track Background */}
                      <circle
                        cx="60"
                        cy="60"
                        r="48"
                        strokeWidth="11"
                        className="stroke-slate-100 dark:stroke-slate-800 fill-none"
                      />
                      {/* Success Arc (Emerald) */}
                      <circle
                        cx="60"
                        cy="60"
                        r="48"
                        strokeWidth="11"
                        strokeDasharray={2 * Math.PI * 48}
                        strokeDashoffset={2 * Math.PI * 48 * (1 - currentPct / 100)}
                        strokeLinecap="round"
                        className="stroke-emerald-500 fill-none transition-all duration-700 ease-out"
                      />
                    </svg>
                    {/* Gauge Inner Info */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        %{currentPct}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        UYUM
                      </span>
                    </div>
                  </div>

                  {/* Gauge Açıklama ve Durum */}
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      <Gauge className="w-3.5 h-3.5 text-red-600" />
                      {gaugeTitle}
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
                      {gaugeStatus}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
                      {activeCat ? (
                        <span>
                          <strong className="text-slate-700 dark:text-slate-300">{activeCat.name}</strong> alanındaki toplam {currentTotal} tespitin {currentCompleted}'si giderildi.
                        </span>
                      ) : (
                        <span>
                          Toplam {currentTotal} kayıtlı maddenin {currentCompleted}'si standartlara uygun olarak giderildi.
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Dikey Çizgi (Masaüstü) */}
                <div className="hidden lg:block lg:col-span-1 h-32 w-px bg-slate-100 dark:bg-slate-800 mx-auto" />

                {/* SAĞ (lg:col-span-6): FERAH & ŞIK 3 RENKLİ DURUM KARTI */}
                <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  {/* 1. Kapatılan Bulgular (Yeşil) */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-emerald-50/90 to-emerald-50/40 dark:from-emerald-950/30 dark:to-emerald-950/10 border border-emerald-200/80 dark:border-emerald-900/40 flex flex-col justify-between space-y-3.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                        Kapatılan Bulgular
                      </span>
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-emerald-700 dark:text-emerald-300">
                          {currentCompleted}
                        </span>
                        <span className="text-xs font-bold text-emerald-600">
                          (%{currentPct})
                        </span>
                      </div>
                      <div className="w-full bg-emerald-200/60 dark:bg-emerald-900/40 h-1.5 rounded-full overflow-hidden mt-2.5">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all duration-700" 
                          style={{ width: `${currentPct}%` }} 
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                      Risk ortadan kaldırıldı
                    </p>
                  </div>

                  {/* 2. Süreçteki Aksiyonlar (Sarı / Turuncu) */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-amber-50/90 to-amber-50/40 dark:from-amber-950/30 dark:to-amber-950/10 border border-amber-200/80 dark:border-amber-900/40 flex flex-col justify-between space-y-3.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                        Süreçteki Aksiyonlar
                      </span>
                      <Clock className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-amber-700 dark:text-amber-300">
                          {currentInProgress}
                        </span>
                        <span className="text-xs font-bold text-amber-600">
                          (%{currentInProgPct})
                        </span>
                      </div>
                      <div className="w-full bg-amber-200/60 dark:bg-amber-900/40 h-1.5 rounded-full overflow-hidden mt-2.5">
                        <div 
                          className="bg-amber-500 h-full rounded-full transition-all duration-700" 
                          style={{ width: `${currentInProgPct}%` }} 
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                      Saha montaj & tedarikte
                    </p>
                  </div>

                  {/* 3. Açık / Bekleyen (Kırmızı) */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-rose-50/90 to-rose-50/40 dark:from-rose-950/30 dark:to-rose-950/10 border border-rose-200/80 dark:border-rose-900/40 flex flex-col justify-between space-y-3.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                        Açık / Bekleyen
                      </span>
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-rose-700 dark:text-rose-300">
                          {currentOpen}
                        </span>
                        <span className="text-xs font-bold text-rose-600">
                          (%{currentOpenPct})
                        </span>
                      </div>
                      <div className="w-full bg-rose-200/60 dark:bg-rose-900/40 h-1.5 rounded-full overflow-hidden mt-2.5">
                        <div 
                          className="bg-rose-500 h-full rounded-full transition-all duration-700" 
                          style={{ width: `${currentOpenPct}%` }} 
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-rose-700 dark:text-rose-400 font-medium">
                      Müdahale planlanmalı
                    </p>
                  </div>

                </div>

              </div>

            </div>
          );
        })()}

        {/* DİNAMİK TESPİT MADDELERİ LİSTESİ (HER ZAMAN GÖRÜNÜR: İLK AŞAMADA SEÇİLİ TESİSLERİN TÜM MADDELERİ, KATEGORİ SEÇİLİNCE O KATEGORİNİN MADDELERİ) */}
        {(() => {
          // Filtrelenecek ana havuz
          const filteredByCategory = selectedCategoryFilter === 'ALL'
            ? allItems
            : allItems.filter((it: any) => {
                const c = (it.category || '').split(',').map((x: string) => x.trim());
                return c.includes(selectedCategoryFilter);
              });

          // Tesis filtresi (liste içi hızlı süzme)
          const filteredByFacility = itemFacilityFilter === 'ALL'
            ? filteredByCategory
            : filteredByCategory.filter((it: any) => {
                const audit = audits.find((a: any) => (a.items || []).some((i: any) => i.id === it.id));
                return audit?.facilityId === itemFacilityFilter;
              });

          // Arama filtresi
          const filteredBySearch = filteredByFacility.filter((it: any) => {
            if (!itemSearchText.trim()) return true;
            const query = itemSearchText.toLowerCase();
            const topic = (it.topic || '').toLowerCase();
            const action = (it.action || '').toLowerCase();
            const resp = (it.responsible || '').toLowerCase();
            const order = String(it.orderNo || '');
            return topic.includes(query) || action.includes(query) || resp.includes(query) || order.includes(query);
          });

          // Durum sayaçları (aktif kategori ve arama filtresine göre)
          const countTotal = filteredByFacility.length;
          const countCompleted = filteredByFacility.filter((i: any) => i.status === 'TAMAMLANDI' || i.status === 'COMPLETED').length;
          const countInProgress = filteredByFacility.filter((i: any) => i.status === 'DEVAM_EDIYOR' || i.status === 'IN_PROGRESS').length;
          const countOpen = filteredByFacility.filter((i: any) => i.status !== 'TAMAMLANDI' && i.status !== 'COMPLETED' && i.status !== 'DEVAM_EDIYOR' && i.status !== 'IN_PROGRESS').length;

          // Son durum filtresine göre son liste
          const finalItems = filteredBySearch.filter((it: any) => {
            const s = (it.status || '').toUpperCase();
            const isComp = s === 'TAMAMLANDI' || s === 'COMPLETED';
            const isProg = s === 'DEVAM_EDIYOR' || s === 'IN_PROGRESS';
            if (selectedCategoryStatusFilter === 'TAMAMLANDI') return isComp;
            if (selectedCategoryStatusFilter === 'DEVAM_EDIYOR') return isProg;
            if (selectedCategoryStatusFilter === 'BASLAMADI') return !isComp && !isProg;
            return true;
          });

          // Listede mevcut olan tesislerin adları (hızlı süzgeç için)
          const availableFacilityOptions = Array.from(new Set(
            filteredByCategory.map((it: any) => {
              const audit = audits.find((a: any) => (a.items || []).some((i: any) => i.id === it.id));
              return audit?.facilityId;
            }).filter(Boolean)
          )).map(fId => {
            const fac = facilities.find((f: any) => f.id === fId);
            return { id: fId as string, name: fac?.name || 'Tesis' };
          });

          return (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              {/* Dinamik Liste Üst Kontrol & Filtre Çubuğu */}
              <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>Tespit Maddeleri & Saha Aksiyonları</span>
                        <Badge variant="outline" className="font-bold text-xs bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300">
                          {finalItems.length} / {countTotal} Madde
                        </Badge>
                      </h3>
                      {selectedCategoryFilter !== 'ALL' && (
                        <Badge className="bg-red-600 text-white font-semibold text-[11px]">
                          {selectedCategoryFilter}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedCategoryFilter === 'ALL'
                        ? 'Seçili tesislerin tüm tespitleri listelenmektedir. Karttan kategori seçerek filtreleyebilirsiniz.'
                        : `"${selectedCategoryFilter}" kategorisine ait tespitler görüntüleniyor.`
                      }
                    </p>
                  </div>

                  {/* Arama Inputu */}
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <Input
                        type="text"
                        placeholder="Maddelerde ara (konu, karar, sorumlu)..."
                        value={itemSearchText}
                        onChange={e => setItemSearchText(e.target.value)}
                        className="h-8 text-xs pl-8 pr-7 bg-white dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-700"
                      />
                      {itemSearchText && (
                        <button
                          type="button"
                          onClick={() => setItemSearchText('')}
                          className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Excel İndir Butonu */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportComprehensiveExcel}
                      className="text-xs h-8 px-2.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-bold shrink-0 flex items-center gap-1.5 shadow-2xs"
                      title="Tespit maddelerini ve tüm detayları Excel olarak indir"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="hidden sm:inline">Excel İndir</span>
                    </Button>

                    {/* Kategori Sıfırlama Butonu */}
                    {selectedCategoryFilter !== 'ALL' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCategoryFilter('ALL')}
                        className="text-xs h-8 px-2.5 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold shrink-0"
                        title="Tüm kategorilerin listesine dön"
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        Filtreyi Kaldır
                      </Button>
                    )}
                  </div>
                </div>

                {/* İkili Filtreleme Çubuğu: Durum Sekmeleri & Tesis İçi Hızlı Süzgeç */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  {/* Durum Sekmeleri */}
                  <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryStatusFilter('ALL')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        selectedCategoryStatusFilter === 'ALL'
                          ? 'bg-slate-900 text-white shadow-xs dark:bg-slate-100 dark:text-slate-900'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span>Tümü</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{countTotal}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedCategoryStatusFilter('TAMAMLANDI')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        selectedCategoryStatusFilter === 'TAMAMLANDI'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>Tamamlandı</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">{countCompleted}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedCategoryStatusFilter('DEVAM_EDIYOR')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        selectedCategoryStatusFilter === 'DEVAM_EDIYOR'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-300" />
                      <span>Devam Ediyor</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">{countInProgress}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedCategoryStatusFilter('BASLAMADI')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        selectedCategoryStatusFilter === 'BASLAMADI'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      <span>Bekleyen / Başlamadı</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-red-200">{countOpen}</span>
                    </button>
                  </div>

                  {/* Birden fazla tesis varsa liste içi tesis süzgeci */}
                  {availableFacilityOptions.length > 1 && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-400 font-medium">Tesis:</span>
                      <select
                        value={itemFacilityFilter}
                        onChange={e => setItemFacilityFilter(e.target.value)}
                        className="h-7 text-xs px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium"
                      >
                        <option value="ALL">Tüm Seçili Tesisler ({availableFacilityOptions.length})</option>
                        {availableFacilityOptions.map(fac => (
                          <option key={fac.id} value={fac.id}>{fac.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Madde Satırları Listesi */}
              <div className="p-4 md:p-5">
                {finalItems.length === 0 ? (
                  <div className="p-12 text-center space-y-3 border border-dashed rounded-2xl bg-slate-50/50 dark:bg-slate-800/30">
                    <Layers className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Filtre kriterlerine uygun tespit maddesi bulunamadı.
                    </p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Arama terimini değiştirebilir, durum filtresini &apos;Tümü&apos; yapabilir veya kategori filtresini kaldırabilirsiniz.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCategoryFilter('ALL');
                        setSelectedCategoryStatusFilter('ALL');
                        setItemSearchText('');
                        setItemFacilityFilter('ALL');
                      }}
                      className="text-xs font-bold"
                    >
                      Filtreleri Sıfırla
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 max-h-[640px] overflow-y-auto">
                    {finalItems.map((item: any) => {
                      const isCompleted = item.status === 'TAMAMLANDI' || item.status === 'COMPLETED';
                      const isInProgress = item.status === 'DEVAM_EDIYOR' || item.status === 'IN_PROGRESS';
                      const { percent: itemPct } = calculateItemProgress(item);
                      const itemAudit = audits.find((a: any) => (a.items || []).some((i: any) => i.id === item.id));
                      const itemFacilityName = itemAudit?.facility?.name || facilities.find((f: any) => f.id === itemAudit?.facilityId)?.name || 'Tesis';
                      const { title: itemTitle } = splitItemTopic(item.topic, 90);
                      const actionCount = item.actions?.length || 0;
                      const hasPhotos = (item.findingPhotos?.length || 0) > 0;

                      return (
                        <div
                          key={item.id}
                          onClick={() => setViewItemDetail({
                            item,
                            auditTitle: itemAudit?.title || 'Yangın Denetimi',
                            facilityName: itemFacilityName
                          })}
                          className="group p-3.5 sm:px-4 hover:bg-slate-50/80 dark:hover:bg-slate-850/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                        >
                          {/* Sol Kısım: Sıra No + Tesis / Kategori + Başlık & Karar */}
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5 group-hover:bg-red-600 group-hover:text-white transition-colors">
                              #{item.orderNo}
                            </span>

                            <div className="min-w-0 space-y-1 flex-1">
                              {/* Üst Meta: Tesis, Kategori, Varsa Karar Notu */}
                              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                <span className="font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.2 rounded-md">
                                  {itemFacilityName}
                                </span>
                                {item.category && (
                                  <span className="font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.2 rounded-md">
                                    {item.category}
                                  </span>
                                )}
                                {item.responsible && (
                                  <span className="text-teal-700 dark:text-teal-400 font-medium">
                                    • {item.responsible}
                                  </span>
                                )}
                                {hasPhotos && (
                                  <span className="text-slate-400 flex items-center gap-0.5 text-[10px]">
                                    <Camera className="w-3 h-3 text-slate-400" />
                                    {item.findingPhotos.length}
                                  </span>
                                )}
                              </div>

                              {/* Tespit Başlığı (Kısa, Net) */}
                              <h4 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-red-600 transition-colors">
                                {itemTitle}
                              </h4>

                              {/* Karar / Aksiyon Planı (Kısa Tek Satır İpucu) */}
                              {item.action && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                  <span className="font-semibold text-amber-700 dark:text-amber-400">Karar:</span> {item.action}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Sağ Kısım: Kompakt Durum / İlerleme Rozeti + Hızlı Butonlar */}
                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                            {/* İlerleme & Durum */}
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-black px-2 py-0.5 rounded-md ${
                                isCompleted
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : isInProgress
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              }`}>
                                %{itemPct}
                              </span>

                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                isCompleted
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                  : isInProgress
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                              }`}>
                                {isCompleted ? 'Tamamlandı' : isInProgress ? 'Devam Ediyor' : 'Bekliyor'}
                              </span>
                            </div>

                            {/* İncele & Aksiyon Ekle */}
                            <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setViewItemDetail({
                                  item,
                                  auditTitle: itemAudit?.title || 'Yangın Denetimi',
                                  facilityName: itemFacilityName
                                })}
                                className="h-7 px-2 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg"
                                title="Detay ve fotoğrafları gör"
                              >
                                <Eye className="w-3.5 h-3.5 mr-1 text-blue-500" />
                                <span>Detay</span>
                              </Button>

                              <Button
                                size="sm"
                                onClick={() => handleOpenQuickAction(item, itemAudit?.title || 'Yangın Denetimi')}
                                className="h-7 px-2.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-lg shadow-2xs"
                                title="Bu maddeye yeni saha aksiyonu veya kanıt ekle"
                              >
                                <Plus className="w-3.5 h-3.5 mr-0.5 text-emerald-400" />
                                <span>Aksiyon</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
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

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TESPİT MADDESİ VE AKSİYONLARI İNCELEME DIALOG PENCERESİ         */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Dialog open={!!viewItemDetail} onOpenChange={open => !open && setViewItemDetail(null)}>
        <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-red-600 text-white font-extrabold flex items-center justify-center text-xs shrink-0 shadow-xs">
                  {viewItemDetail?.item?.orderNo}
                </span>
                <Badge className="bg-indigo-600 text-white font-bold text-xs flex items-center gap-1 shadow-2xs">
                  <Building2 className="w-3.5 h-3.5 text-indigo-200" />
                  <span>{viewItemDetail?.facilityName}</span>
                </Badge>
                {viewItemDetail?.item?.source && (
                  <Badge variant="outline" className="bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 text-xs font-semibold">
                    {viewItemDetail.item.source}
                  </Badge>
                )}
              </div>

              {/* Durum & İlerleme Rozeti */}
              {viewItemDetail?.item && (() => {
                const s = (viewItemDetail.item.status || '').toUpperCase();
                const isCompleted = s === 'TAMAMLANDI' || s === 'COMPLETED';
                const isInProgress = s === 'DEVAM_EDIYOR' || s === 'IN_PROGRESS';
                const { percent } = calculateItemProgress(viewItemDetail.item);
                return (
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                      percent === 100 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                        : percent > 0 
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' 
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      %{percent} Uyum
                    </span>
                    <Badge className={
                      isCompleted
                        ? 'bg-emerald-600 text-white text-xs font-bold'
                        : isInProgress
                        ? 'bg-amber-500 text-white text-xs font-bold'
                        : 'bg-rose-500 text-white text-xs font-bold'
                    }>
                      {isCompleted ? 'Tamamlandı' : isInProgress ? 'Devam Ediyor' : 'Bekliyor'}
                    </Badge>
                  </div>
                );
              })()}
            </div>

            {(() => {
              const { title: dlgTitle } = splitItemTopic(viewItemDetail?.item?.topic, 85);
              return (
                <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 pt-2 leading-snug">
                  {dlgTitle}
                </DialogTitle>
              );
            })()}
            <DialogDescription className="text-xs text-slate-500">
              {viewItemDetail?.auditTitle} kapsamındaki tespit maddesi ve aksiyon süreci
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            
            {/* 1. KART: TESPİT VE ALINAN KARAR (Feraha Kavuşturulmuş İki Kolon / Grid) */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/50 p-4 sm:p-5 space-y-4">
              
              {/* Tespit Detayı */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-red-600" />
                    Saha Tespit Detayı
                  </span>
                  {viewItemDetail?.item?.deadlineDate && (
                    <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Termin: <strong className="text-slate-700 dark:text-slate-300">{new Date(viewItemDetail.item.deadlineDate).toLocaleDateString('tr-TR')}</strong>
                    </span>
                  )}
                </div>
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal whitespace-pre-wrap">
                  {viewItemDetail?.item?.topic}
                </div>
              </div>

              {/* Alınan Karar / Aksiyon Planı */}
              {viewItemDetail?.item?.action && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-amber-600" />
                    Alınan Karar / Yapılacak Aksiyon Planı
                  </span>
                  <div className="bg-amber-50/70 dark:bg-amber-950/20 p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-900/40 text-xs sm:text-sm text-amber-950 dark:text-amber-200 leading-relaxed font-medium whitespace-pre-wrap">
                    {viewItemDetail.item.action}
                  </div>
                </div>
              )}

              {/* Kategori & Sorumlu Rozetleri */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/70 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-medium">Kategori:</span>
                  <span className="px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300">
                    {viewItemDetail?.item?.category || 'Genel'}
                  </span>
                </div>
                {viewItemDetail?.item?.responsible && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium">Sorumlu:</span>
                    <span className="px-2.5 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 font-bold text-teal-800 dark:text-teal-300">
                      {viewItemDetail.item.responsible}
                    </span>
                  </div>
                )}
              </div>

              {/* Tespit Sırasında Çekilen Fotoğraflar */}
              {viewItemDetail?.item?.findingPhotos && viewItemDetail.item.findingPhotos.length > 0 && (
                <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                    <Camera className="w-3.5 h-3.5 text-red-600" />
                    <span>İlk Denetim Saha Fotoğrafları ({viewItemDetail.item.findingPhotos.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {viewItemDetail.item.findingPhotos.map((photoUrl: string, pIdx: number) => (
                      <div
                        key={pIdx}
                        onClick={() => setPreviewPhoto({
                          isOpen: true,
                          title: `Madde #${viewItemDetail.item.orderNo} Tespit Fotoğrafı #${pIdx + 1}`,
                          currentIndex: pIdx,
                          photos: viewItemDetail.item.findingPhotos
                        })}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative group cursor-pointer bg-white shadow-2xs hover:opacity-90 transition-opacity"
                        title="Fotoğrafı büyüt"
                      >
                        <img src={photoUrl} alt="Tespit" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <Maximize2 className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 2. KART: SAHA MÜDAHALE & AKSİYON GEÇMİŞİ */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Saha Müdahaleleri & Kanıt Belgeleri ({viewItemDetail?.item?.actions?.length || 0})
                  </h4>
                </div>

                <Button
                  size="sm"
                  onClick={() => {
                    const itm = viewItemDetail?.item;
                    const audTitle = viewItemDetail?.auditTitle || 'Yangın Denetimi';
                    setViewItemDetail(null);
                    handleOpenQuickAction(itm, audTitle);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-2.5 font-bold shadow-xs flex items-center gap-1 rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Aksiyon / Kanıt Ekle
                </Button>
              </div>

              {!viewItemDetail?.item?.actions || viewItemDetail.item.actions.length === 0 ? (
                <div className="p-8 text-center border border-dashed rounded-2xl bg-slate-50/50 dark:bg-slate-850/30 text-xs text-slate-400 space-y-1.5">
                  <Clock className="w-7 h-7 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="font-semibold text-slate-600 dark:text-slate-400">Bu madde için henüz saha aksiyonu girilmemiş.</p>
                  <p className="text-[11px]">Giderilen veya süreci devam eden çalışmalar için aksiyon ekleyebilirsiniz.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {viewItemDetail.item.actions.map((act: any, actIdx: number) => {
                    const isActCompleted = act.status === 'Tamamlandı';
                    const actPhotos = act.evidencePhotos || [];
                    return (
                      <div
                        key={act.id || actIdx}
                        className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center">
                              #{actIdx + 1}
                            </span>
                            <Badge className={
                              isActCompleted
                                ? 'bg-emerald-600 text-white text-[10px] font-bold'
                                : 'bg-amber-500 text-white text-[10px] font-bold'
                            }>
                              {act.status || 'Tamamlandı'}
                            </Badge>
                            {act.progressPercent !== undefined && act.progressPercent !== null && (
                              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                %{act.progressPercent} İlerleme
                              </span>
                            )}
                          </div>

                          <span className="text-[11px] text-slate-400">
                            {new Date(act.createdAt || act.actionDate).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </span>
                        </div>

                        {/* Açıklama */}
                        <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal whitespace-pre-wrap">
                          {act.explanation}
                        </p>

                        {/* Yapan ve Kanıt Fotoğrafları */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
                          <span>
                            İşlem: <strong className="text-slate-700 dark:text-slate-300">{act.performedBy || 'Yetkili'}</strong> {act.department && `(${act.department})`}
                          </span>

                          {actPhotos.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400 font-medium">Kanıtlar:</span>
                              <div className="flex items-center gap-1.5">
                                {actPhotos.map((photoUrl: string, pIdx: number) => (
                                  <div
                                    key={pIdx}
                                    onClick={() => setPreviewPhoto({
                                      isOpen: true,
                                      title: `Aksiyon #${actIdx + 1} Kanıt Fotoğrafı #${pIdx + 1}`,
                                      currentIndex: pIdx,
                                      photos: actPhotos
                                    })}
                                    className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs hover:opacity-80"
                                    title="Fotoğrafı büyüt"
                                  >
                                    <img src={photoUrl} alt="Kanıt" className="w-full h-full object-cover" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          <DialogFooter className="p-3.5 sm:px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 shrink-0 flex flex-row items-center justify-between m-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewItemDetail(null)}
              className="text-xs rounded-xl"
            >
              Kapat
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const itm = viewItemDetail?.item;
                const audTitle = viewItemDetail?.auditTitle || 'Yangın Denetimi';
                setViewItemDetail(null);
                handleOpenQuickAction(itm, audTitle);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 rounded-xl shadow-xs"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              Bu Maddeye Aksiyon Gir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* FOTOĞRAF TAM BOY ÖNİZLEME MODALI (LIGHTBOX)                    */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Dialog open={previewPhoto.isOpen} onOpenChange={open => !open && setPreviewPhoto(prev => ({ ...prev, isOpen: false }))}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 text-white border-0 shadow-2xl flex flex-col max-h-[95vh]">
          <div className="p-3 px-4 flex items-center justify-between border-b border-white/10 shrink-0">
            <span className="font-semibold text-xs sm:text-sm text-slate-200">
              {previewPhoto.title} {previewPhoto.photos.length > 1 ? `(${previewPhoto.currentIndex + 1} / ${previewPhoto.photos.length})` : ''}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreviewPhoto(prev => ({ ...prev, isOpen: false }))}
              className="text-white hover:bg-white/20 h-7 w-7 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 min-h-[300px] overflow-hidden relative">
            {previewPhoto.photos[previewPhoto.currentIndex] && (
              <img
                src={previewPhoto.photos[previewPhoto.currentIndex]}
                alt="Önizleme"
                className="max-h-[75vh] max-w-full object-contain rounded-md shadow-2xl"
              />
            )}

            {previewPhoto.photos.length > 1 && (
              <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewPhoto(prev => ({
                      ...prev,
                      currentIndex: prev.currentIndex > 0 ? prev.currentIndex - 1 : prev.photos.length - 1
                    }));
                  }}
                  className="pointer-events-auto bg-black/50 hover:bg-black/80 text-white rounded-full h-9 w-9 p-0"
                >
                  <ArrowRight className="w-5 h-5 rotate-180" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewPhoto(prev => ({
                      ...prev,
                      currentIndex: prev.currentIndex < prev.photos.length - 1 ? prev.currentIndex + 1 : 0
                    }));
                  }}
                  className="pointer-events-auto bg-black/50 hover:bg-black/80 text-white rounded-full h-9 w-9 p-0"
                >
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useActiveFacility } from '@/hooks/useActiveFacility';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Upload,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  Image as ImageIcon,
  Flame,
  MessageSquarePlus,
  Paperclip,
  CheckCircle,
  Eye,
  Pencil,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

// Maddeye ve aksiyonlarına göre dinamik % Tamamlanma Oranı Hesaplayıcı
export const calculateItemProgress = (item: any): { percent: number; completedActions: number; totalActions: number } => {
  const actions = item.actions || [];
  const completedActions = actions.filter((a: any) => a.status === 'Tamamlandı').length;
  const totalActions = actions.length;

  const s = (item.status || '').toUpperCase();
  if (s === 'TAMAMLANDI' || s === 'COMPLETED') {
    return { percent: 100, completedActions, totalActions };
  }

  if (totalActions > 0) {
    const actRatio = Math.round((completedActions / totalActions) * 100);
    // Eğer aksiyonların hepsi tamamlandıysa ama madde durumu henüz güncellenmediyse %90
    if (actRatio === 100 && s !== 'TAMAMLANDI') {
      return { percent: 90, completedActions, totalActions };
    }
    // Eğer devam ediyorsa en az %25 göster
    if (s === 'DEVAM_EDIYOR' || s === 'IN_PROGRESS' || s === 'DEVAM EDIYOR') {
      return { percent: Math.max(actRatio, 35), completedActions, totalActions };
    }
    return { percent: actRatio, completedActions, totalActions };
  }

  // Henüz aksiyon girilmemişse durum bazlı varsayılan yüzde
  if (s === 'DEVAM_EDIYOR' || s === 'IN_PROGRESS' || s === 'DEVAM EDIYOR') {
    return { percent: 40, completedActions: 0, totalActions: 0 };
  }
  return { percent: 0, completedActions: 0, totalActions: 0 };
};

export default function FireSafetyAuditPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const isNew = id === 'new';
  const initialMode = isNew ? 'edit' : (searchParams.get('mode') || 'view');
  
  const [mode, setMode] = useState<'view' | 'edit'>(initialMode as 'view' | 'edit');
  const facilityId = useActiveFacility();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const activeFacId = facilityId || localStorage.getItem('activeFacilityId') || '';

  // Header & Audit Info state
  const [title, setTitle] = useState('TOPLANTI TUTANAĞI');
  const [subtitle, setSubtitle] = useState('Teknik Hizmetler, Yangın Güvenliği ve Fiziki Alan Değerlendirme Toplantısı');
  const [auditDate, setAuditDate] = useState(new Date().toISOString().split('T')[0]);
  const [topic, setTopic] = useState('Yangın güvenliği, teknik altyapı, fiziki alanlar, bakım-onarım ihtiyaçları ve ilgili aksiyonların değerlendirilmesi');
  const [purpose, setPurpose] = useState('Hastane bünyesinde tespit edilen yangın güvenliği, teknik altyapı, bakım-onarım ve fiziki alan ihtiyaçlarını değerlendirmek; alınan kararları, oluşturulacak talepleri ve sorumlulukları kayıt altına almak.');
  const [status, setStatus] = useState('DEVAM_EDIYOR');
  const [preparedBy, setPreparedBy] = useState('Teknik Hizmetler');
  const [reviewedBy, setReviewedBy] = useState('İSG Yöneticisi');
  const [approvedBy, setApprovedBy] = useState('Genel Müdürlük');

  // Items State
  const [items, setItems] = useState<any[]>([]);

  // Item saving state (tracker for which item is currently being saved individually)
  const [savingItemOrderNo, setSavingItemOrderNo] = useState<number | null>(null);

  // Action / Evidence Modal state
  const [activeItemForAction, setActiveItemForAction] = useState<any | null>(null);
  const [actionDesc, setActionDesc] = useState('');
  const [actionDoneBy, setActionDoneBy] = useState('');
  const [actionDepartment, setActionDepartment] = useState('');
  const [actionStatus, setActionStatus] = useState('Tamamlandı');
  const [actionFiles, setActionFiles] = useState<string[]>([]);
  const [uploadingActionFile, setUploadingActionFile] = useState(false);

  // In-app Photo Preview Modal state (separate tab açmadan önizleme)
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

  // Finding photo upload tracker
  const [uploadingItemIndex, setUploadingItemIndex] = useState<number | null>(null);

  // Filter state
  const [filterSource, setFilterSource] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Facilities
  const { data: facilities = [] } = useQuery<any[]>({
    queryKey: ['user-facilities'],
    queryFn: async () => {
      const res = await api.get('/settings/facilities');
      if (!res.ok) return [];
      return res.json();
    }
  });
  const currentFacility = facilities.find((f: any) => f.id === activeFacId);

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

  const sourcesList = getArray(settingsData?.sources, ['İtfaiye Denetim Raporu', 'SEGEM Raporu', 'İç Süreç', 'Saha Turu', 'Yasal Denetim']);
  const categoriesList = getArray(settingsData?.categories, [
    'Yangın Kompartımanı & İzolasyon',
    'Elektrik & Pano Güvenliği',
    'Acil Durum Aydınlatma & Yönlendirme',
    'Kaçış Merdivenleri & Çıkışlar',
    'Algılama & Otomatik Söndürme',
    'İnşaat, Boya & Fiziki Alan Bakımı'
  ]);
  const responsiblesList = getArray(settingsData?.responsibles, [
    'Teknik Hizmetler – Hastane',
    'Teknik Hizmetler – Merkez',
    'Teknik Hizmetler & İSG – Hastane',
    'Satın Alma Direktörlüğü',
    'Dizayn Yöneticisi & Satınalma',
    'Merkez Satın Alma & Mimar'
  ]);

  // Fetch Existing Audit
  const { data: auditData, isLoading: loadingAudit } = useQuery({
    queryKey: ['fire-safety-audit', id],
    queryFn: async () => {
      if (isNew) return null;
      const res = await api.get(`/fire-safety-control/${id}`);
      if (!res.ok) throw new Error('Tutanak yüklenemedi');
      return res.json();
    },
    enabled: !isNew
  });

  useEffect(() => {
    if (auditData) {
      setTitle(auditData.title || 'TOPLANTI TUTANAĞI');
      setSubtitle(auditData.subtitle || '');
      setAuditDate(auditData.auditDate ? new Date(auditData.auditDate).toISOString().split('T')[0] : '');
      setTopic(auditData.topic || '');
      setPurpose(auditData.purpose || '');
      setStatus(auditData.status || 'DEVAM_EDIYOR');
      setPreparedBy(auditData.preparedBy || '');
      setReviewedBy(auditData.reviewedBy || '');
      setApprovedBy(auditData.approvedBy || '');
      setItems(auditData.items || []);
    } else if (isNew) {
      setMode('edit');
      setItems([
        {
          orderNo: 1,
          topic: '',
          source: sourcesList[0] || 'İtfaiye Denetim Raporu',
          category: categoriesList[0] || 'Yangın Kompartımanı & İzolasyon',
          action: '',
          responsible: responsiblesList[0] || 'Teknik Hizmetler – Hastane',
          deadlineDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'ACIK',
          riskLevel: 'Orta',
          findingPhotos: [],
          actions: []
        }
      ]);
    }
  }, [auditData, isNew]);

  // State for active tab in each item's action panel
  const [activeActionTabs, setActiveActionTabs] = useState<Record<number, number>>({});

  // Loading previous audit items tracker
  const [loadingPrevious, setLoadingPrevious] = useState(false);

  // Mod değişimi URL senkronu
  const toggleMode = (newMode: 'view' | 'edit') => {
    setMode(newMode);
    setSearchParams({ mode: newMode });
  };

  // Önceki toplantı maddelerini aktar
  const handleImportPreviousItems = async () => {
    if (!activeFacId) {
      toast.error('Lütfen bir tesis seçin');
      return;
    }
    try {
      setLoadingPrevious(true);
      const res = await api.get(`/fire-safety-control/facilities/${activeFacId}/latest-items?includeCompleted=true`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Önceki toplantı verisi getirilemedi');

      if (!data.items || data.items.length === 0) {
        toast.info('Bu tesis için daha önce girilmiş bir toplantı tutanağı bulunamadı.');
        return;
      }

      // Maddeleri yeni tutanağa kopyala (id ve auditId temizlenerek yeni madde olarak başlar, eski aksiyon geçmişi korunur)
      const importedItems = data.items.map((it: any, idx: number) => ({
        orderNo: idx + 1,
        topic: it.topic || '',
        source: it.source || 'İtfaiye Denetim Raporu',
        category: it.category || 'Yangın Kompartımanı & İzolasyon',
        action: it.action || '',
        responsible: it.responsible || 'Teknik Hizmetler – Hastane',
        deadlineDate: it.deadlineDate ? new Date(it.deadlineDate).toISOString().split('T')[0] : '',
        status: it.status || 'DEVAM_EDIYOR',
        riskLevel: it.riskLevel || 'Orta',
        findingPhotos: it.findingPhotos || [],
        actions: it.actions || [],
        notes: it.notes || ''
      }));

      setItems(importedItems);
      if (data.audit?.title) {
        setTitle(`${data.audit.title} - Değerlendirme & Takip`);
      }
      toast.success(`${importedItems.length} adet önceki toplantı maddesi ve aksiyonları başarıyla aktarıldı. Şimdi durum ve aksiyonları güncelleyebilir veya yeni madde ekleyebilirsiniz.`);
    } catch (err: any) {
      toast.error(err.message || 'Aktarma sırasında hata oluştu');
    } finally {
      setLoadingPrevious(false);
    }
  };

  // Dinamik Klasörlü Upload (uploads/fire_safety_control/<facilityId>/)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'ITEM' | 'ACTION', itemIndex?: number) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!activeFacId) {
      toast.error('Lütfen önce bir tesis seçin');
      return;
    }

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      if (target === 'ITEM') setUploadingItemIndex(itemIndex ?? null);
      else setUploadingActionFile(true);

      const res = await api.post(`/fire-safety-control/upload?facilityId=${activeFacId}`, formData);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Yükleme başarısız');

      const uploadedUrls = data.map((f: any) => f.url);

      if (target === 'ITEM' && itemIndex !== undefined) {
        setItems(prev => {
          const next = [...prev];
          const curPhotos = next[itemIndex].findingPhotos || [];
          next[itemIndex].findingPhotos = [...curPhotos, ...uploadedUrls];
          return next;
        });
        toast.success(`${uploadedUrls.length} fotoğraf eklendi`);
      } else if (target === 'ACTION') {
        setActionFiles(prev => [...prev, ...uploadedUrls]);
        toast.success(`${uploadedUrls.length} kanıt belgesi eklendi`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Dosya yüklenirken hata oluştu');
    } finally {
      setUploadingItemIndex(null);
      setUploadingActionFile(false);
      e.target.value = '';
    }
  };

  // Madde ekle
  const addItem = () => {
    const nextOrderNo = items.length > 0 ? Math.max(...items.map(i => i.orderNo || 0)) + 1 : 1;
    setItems(prev => [
      ...prev,
      {
        orderNo: nextOrderNo,
        topic: '',
        source: sourcesList[0] || 'İtfaiye Denetim Raporu',
        category: categoriesList[0] || 'Yangın Kompartımanı & İzolasyon',
        action: '',
        responsible: responsiblesList[0] || 'Teknik Hizmetler – Hastane',
        deadlineDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'ACIK',
        riskLevel: 'Orta',
        findingPhotos: [],
        actions: []
      }
    ]);
  };

  const removeItem = async (idx: number) => {
    const item = items[idx];
    if (item.id && !item.id.startsWith('temp_')) {
      try {
        const res = await api.delete(`/fire-safety-control/items/${item.id}`);
        if (!res.ok) throw new Error('Tespit maddesi silinemedi');
        toast.success(`Madde #${item.orderNo} silindi`);
      } catch (err: any) {
        toast.error(err.message || 'Silinemedi');
        return;
      }
    }
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updateItemField = (idx: number, field: string, val: any) => {
    setItems(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };

  const removeFindingPhoto = (itemIdx: number, photoIdx: number) => {
    setItems(prev => {
      const next = [...prev];
      const curPhotos = [...(next[itemIdx].findingPhotos || [])];
      curPhotos.splice(photoIdx, 1);
      next[itemIdx].findingPhotos = curPhotos;
      return next;
    });
  };

  // Save Entire Audit (Tutanak Kaydet)
  const saveAuditMutation = useMutation({
    mutationFn: async () => {
      if (!activeFacId || activeFacId === 'all') {
        throw new Error('Lütfen tutanağın ait olduğu tesisi üstten seçiniz');
      }

      const payload = {
        id: isNew ? undefined : id,
        facilityId: activeFacId,
        title,
        subtitle,
        auditDate,
        topic,
        purpose,
        status,
        preparedBy,
        reviewedBy,
        approvedBy,
        items
      };

      const res = await api.post('/fire-safety-control/save', payload);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Kaydetme işlemi başarısız');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fire-safety-audits'] });
      queryClient.invalidateQueries({ queryKey: ['fire-safety-audit', id] });
      toast.success('Tutanak ve tespitler başarıyla kaydedildi');
      if (isNew && data?.id) {
        navigate(`/fire-safety-control/audit/${data.id}?mode=edit`, { replace: true });
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Kayıt sırasında hata oluştu');
    }
  });

  // TEKİL MADDEYİ ANINDA KAYDET (Her bir tespiti ekledikten sonra kaydet)
  const handleSaveSingleItem = async (itemIndex: number) => {
    const item = items[itemIndex];
    if (!item.topic?.trim()) {
      toast.error('Lütfen tespit konusunu / açıklamasını giriniz');
      return;
    }

    // Eğer tutanak henüz yeni ve kaydedilmemişse önce tutanağı oluştur
    let currentAuditId = id;
    if (isNew || !currentAuditId || currentAuditId.startsWith('temp_')) {
      try {
        const auditPayload = {
          facilityId: activeFacId,
          title,
          subtitle,
          auditDate,
          topic,
          purpose,
          status,
          preparedBy,
          reviewedBy,
          approvedBy,
          items: []
        };
        const res = await api.post('/fire-safety-control/save', auditPayload);
        const createdAudit = await res.json();
        if (!res.ok) throw new Error(createdAudit.error || 'Önce tutanak kaydedilemedi');
        currentAuditId = createdAudit.id;
        navigate(`/fire-safety-control/audit/${createdAudit.id}?mode=edit`, { replace: true });
      } catch (err: any) {
        toast.error(err.message || 'Tutanak oluşturulamadı');
        return;
      }
    }

    try {
      setSavingItemOrderNo(item.orderNo);
      const itemPayload = {
        id: item.id,
        auditId: currentAuditId,
        orderNo: item.orderNo,
        topic: item.topic,
        source: item.source,
        category: item.category,
        action: item.action,
        responsible: item.responsible,
        deadlineDate: item.deadlineDate,
        status: item.status,
        riskLevel: item.riskLevel,
        findingPhotos: item.findingPhotos || [],
        notes: item.notes
      };

      const res = await api.post('/fire-safety-control/items/save', itemPayload);
      const saved = await res.json();
      if (!res.ok) throw new Error(saved.error || 'Madde kaydedilemedi');

      setItems(prev => {
        const next = [...prev];
        next[itemIndex] = { ...next[itemIndex], id: saved.id, actions: saved.actions || next[itemIndex].actions || [] };
        return next;
      });

      toast.success(`Madde #${item.orderNo} başarıyla kaydedildi! Artık aksiyon girişi yapabilirsiniz.`);
    } catch (err: any) {
      toast.error(err.message || 'Madde kaydedilirken hata oluştu');
    } finally {
      setSavingItemOrderNo(null);
    }
  };

  // Aksiyon Modalını Aç (Önce maddenin kaydedilmiş olması gerekir)
  const handleOpenActionModal = (item: any, itemIndex: number) => {
    if (!item.id || item.id.startsWith('temp_')) {
      toast.info('Lütfen önce bu maddeyi "Maddeyi Kaydet" butonu ile kaydediniz.');
      return;
    }
    setActiveItemForAction({ ...item, itemIndex });
    setActionDesc('');
    setActionDoneBy(user?.fullName || user?.username || '');

    // Maddede tanımlı sorumlu departmanlardan ilkini veya tamamını varsayılan yap
    const firstResp = item.responsible ? item.responsible.split(',')[0].trim() : '';
    setActionDepartment(firstResp);

    setActionStatus('Tamamlandı');
    setActionFiles([]);
  };

  // Aksiyonu Kaydet
  const handleSaveAction = async () => {
    if (!actionDesc.trim()) {
      toast.error('Lütfen yapılan işlem açıklamasını girin');
      return;
    }
    if (!activeItemForAction) return;

    try {
      const performedByText = actionDepartment
        ? (actionDoneBy ? `${actionDoneBy} (${actionDepartment})` : actionDepartment)
        : (actionDoneBy || 'Yetkili');

      const res = await api.post(`/fire-safety-control/items/${activeItemForAction.id}/actions`, {
        explanation: actionDesc,
        performedBy: performedByText,
        department: actionDepartment,
        evidencePhotos: actionFiles,
        status: actionStatus,
        actionDate: new Date().toISOString()
      });
      const newAction = await res.json();
      if (!res.ok) throw new Error(newAction.error || 'Aksiyon eklenemedi');

      // State'i güncelle
      setItems(prev => {
        const next = [...prev];
        const targetIdx = next.findIndex(i => i.id === activeItemForAction.id);
        if (targetIdx !== -1) {
          const curActions = next[targetIdx].actions || [];
          next[targetIdx].actions = [newAction, ...curActions];
          next[targetIdx].status = actionStatus === 'Tamamlandı' ? 'TAMAMLANDI' : 'DEVAM_EDIYOR';
        }
        return next;
      });

      // Yeni eklenen aksiyonun tabını aktif et (0. indeks)
      setActiveActionTabs(prev => ({
        ...prev,
        [activeItemForAction.orderNo]: 0
      }));

      toast.success('Aksiyon ve kanıtlar başarıyla eklendi');
      setActiveItemForAction(null);
    } catch (err: any) {
      toast.error(err.message || 'Aksiyon kaydedilirken hata oluştu');
    }
  };

  // In-App Fotoğraf Önizleme (Preview Modal)
  const openPhotoPreview = (title: string, photos: string[], startIndex: number = 0) => {
    setPreviewPhoto({
      isOpen: true,
      title,
      photos,
      currentIndex: startIndex
    });
  };

  const nextPreviewPhoto = () => {
    setPreviewPhoto(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.photos.length
    }));
  };

  const prevPreviewPhoto = () => {
    setPreviewPhoto(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex - 1 + prev.photos.length) % prev.photos.length
    }));
  };

  // Durum Rozet Yardımcısı: Devam Ediyor -> Turuncu, Tamamlandı -> Yeşil, Bekliyor -> Kırmızı
  const renderStatusBadge = (itemStatus: string) => {
    const s = (itemStatus || '').toUpperCase();
    if (s === 'TAMAMLANDI' || s === 'COMPLETED') {
      return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">Tamamlandı</Badge>;
    }
    if (s === 'DEVAM_EDIYOR' || s === 'IN_PROGRESS' || s === 'DEVAM EDIYOR') {
      return <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-semibold">Devam Ediyor</Badge>;
    }
    if (s === 'IPTAL') {
      return <Badge variant="secondary">İptal</Badge>;
    }
    return <Badge className="bg-red-500 hover:bg-red-600 text-white font-semibold">Bekliyor</Badge>;
  };

  // Filtrelenmiş maddeler
  const filteredItems = items.filter(item => {
    if (filterSource !== 'ALL' && item.source !== filterSource) return false;
    if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto space-y-5 pb-20 print:p-0 print:m-0 print:max-w-none">
      {/* Üst Eylem ve Mod Seçim Barı */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/fire-safety-control')}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Flame className="w-6 h-6 text-red-600" />
              {title}
            </h1>
            <p className="text-xs md:text-sm text-slate-500">
              {currentFacility?.name || 'Seçili Tesis'} · {new Date(auditDate).toLocaleDateString('tr-TR')}
            </p>
          </div>
        </div>

        {/* VIEW / EDIT / PRINT Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Yeni Toplantı ise Önceki Toplantı Maddelerini Aktar Butonu */}
          {isNew && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleImportPreviousItems}
              disabled={loadingPrevious}
              className="border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 text-xs h-8"
              title="Önceki toplantıdaki açık ve devam eden maddeleri bu yeni toplantıya taşır"
            >
              <Calendar className="w-3.5 h-3.5 mr-1 text-amber-600" />
              {loadingPrevious ? 'Aktarılıyor...' : 'Önceki Toplantı Maddelerini Aktar'}
            </Button>
          )}

          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex items-center gap-1 border border-slate-200 dark:border-slate-700">
            <Button
              size="sm"
              variant={mode === 'view' ? 'default' : 'ghost'}
              onClick={() => toggleMode('view')}
              className={`text-xs h-8 px-3 ${mode === 'view' ? 'bg-slate-900 text-white shadow' : 'text-slate-600'}`}
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              Tutanak Görünümü (View)
            </Button>
            <Button
              size="sm"
              variant={mode === 'edit' ? 'default' : 'ghost'}
              onClick={() => toggleMode('edit')}
              className={`text-xs h-8 px-3 ${mode === 'edit' ? 'bg-red-600 text-white shadow' : 'text-slate-600'}`}
            >
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              Düzenle / Ekle (Edit)
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={() => window.print()}
            className="border-slate-300 text-slate-700 dark:text-slate-300 h-8 text-xs"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Yazdır / PDF
          </Button>

          {mode === 'edit' && (
            <Button
              onClick={() => saveAuditMutation.mutate()}
              disabled={saveAuditMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs h-8 shadow-md"
            >
              <Save className="w-4 h-4 mr-1.5" />
              {saveAuditMutation.isPending ? 'Kaydediliyor...' : 'Tüm Tutanağı Kaydet'}
            </Button>
          )}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. VIEW MODU (Baskıya Hazır HTML Toplantı Tutanağı Şablonu)  */}
      {/* ───────────────────────────────────────────────────────────── */}
      {mode === 'view' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg p-6 md:p-10 space-y-6 print:shadow-none print:border-none print:p-0 print:m-0 text-slate-900 dark:text-slate-100 font-sans">
          
          {/* Top Line */}
          <div className="flex justify-between items-end pb-3 border-b-2 border-slate-200 dark:border-slate-700">
            <div className="font-bold text-teal-800 dark:text-teal-400 text-sm md:text-base">
              {currentFacility?.name || 'VM Medical Park Hastanesi'}
            </div>
            <div className="text-xs md:text-sm text-slate-500 font-medium">
              {new Date(auditDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>

          {/* Hero Header */}
          <div className="text-center space-y-1.5 py-2">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-wide text-slate-900 dark:text-slate-100">
              {title}
            </h1>
            <p className="text-sm md:text-base text-teal-700 dark:text-teal-400 font-semibold">
              {subtitle}
            </p>
          </div>

          {/* Meta Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 border border-slate-300 dark:border-slate-700 rounded-md overflow-hidden text-xs md:text-sm">
            <div className="p-3 bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 border-b md:border-b-0 border-r border-slate-300 dark:border-slate-700">
              Tarih
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 border-b md:border-b-0 border-r border-slate-300 dark:border-slate-700 font-medium">
              {new Date(auditDate).toLocaleDateString('tr-TR')}
            </div>
            <div className="p-3 bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 border-b md:border-b-0 border-r border-slate-300 dark:border-slate-700">
              Kurum
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 font-medium">
              {currentFacility?.name || 'Seçili Tesis'}
            </div>

            <div className="p-3 bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 border-t border-r border-slate-300 dark:border-slate-700">
              Toplantı Konusu
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-300 dark:border-slate-700 md:col-span-3 font-medium">
              {topic}
            </div>
          </div>

          {/* Purpose Box */}
          <div className="border border-slate-300 dark:border-slate-700 rounded-md overflow-hidden flex flex-col md:flex-row text-xs md:text-sm">
            <div className="p-3 bg-teal-800 text-white font-bold md:w-36 flex items-center shrink-0">
              Toplantının Amacı
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 font-medium flex-1 text-slate-800 dark:text-slate-200">
              {purpose}
            </div>
          </div>

          {/* Tutanak İlerleme & Tamamlanma Yüzdesi KPI Özeti */}
          {(() => {
            const totalItems = items.length;
            const completedItems = items.filter(i => (i.status || '').toUpperCase() === 'TAMAMLANDI' || (i.status || '').toUpperCase() === 'COMPLETED').length;
            const inProgressItems = items.filter(i => (i.status || '').toUpperCase() === 'DEVAM_EDIYOR' || (i.status || '').toUpperCase() === 'IN_PROGRESS' || (i.status || '').toUpperCase() === 'DEVAM EDIYOR').length;
            const openItems = totalItems - completedItems - inProgressItems;
            
            // Tüm aksiyonların toplamı
            const allActions = items.flatMap(i => i.actions || []);
            const completedActions = allActions.filter((a: any) => a.status === 'Tamamlandı').length;
            
            // Ağırlıklı Tamamlanma Yüzdesi
            const overallPct = totalItems > 0 
              ? Math.round(items.reduce((acc, curr) => acc + calculateItemProgress(curr).percent, 0) / totalItems)
              : 0;

            return (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-teal-50/30 to-emerald-50/20 dark:from-slate-800/60 dark:to-slate-800/20 space-y-3 print:border-slate-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                        Toplantı Tutanağı Aksiyon ve Tamamlanma Durumu
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {totalItems} Tespit Maddesi · {allActions.length} Girilen Aksiyon Süreci ({completedActions} tamamlandı)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[11px] text-slate-500 font-semibold block">Genel Başarı Oranı</span>
                      <span className={`text-xl font-black ${overallPct >= 80 ? 'text-emerald-600' : overallPct >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                        %{overallPct}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ana İlerleme Çubuğu */}
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden flex shadow-inner">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-500"
                      style={{ width: `${totalItems > 0 ? (completedItems / totalItems) * 100 : 0}%` }}
                      title={`Tamamlanan Maddeler: ${completedItems}`}
                    />
                    <div
                      className="bg-amber-500 h-full transition-all duration-500"
                      style={{ width: `${totalItems > 0 ? (inProgressItems / totalItems) * 100 : 0}%` }}
                      title={`Devam Eden Maddeler: ${inProgressItems}`}
                    />
                    <div
                      className="bg-red-500 h-full transition-all duration-500"
                      style={{ width: `${totalItems > 0 ? (openItems / totalItems) * 100 : 0}%` }}
                      title={`Bekleyen Maddeler: ${openItems}`}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-0.5">
                    <div className="flex items-center gap-4 text-[11px]">
                      <span className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        {completedItems} Tamamlandı (%{totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0})
                      </span>
                      <span className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        {inProgressItems} Devam Ediyor (%{totalItems > 0 ? Math.round((inProgressItems / totalItems) * 100) : 0})
                      </span>
                      <span className="flex items-center gap-1.5 font-bold text-red-600 dark:text-red-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        {openItems} Bekliyor (%{totalItems > 0 ? Math.round((openItems / totalItems) * 100) : 0})
                      </span>
                    </div>

                    <span className="text-[11px] font-medium text-slate-500">
                      Tüm maddeler ve saha aksiyonları eksiksiz takip altındadır.
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Table of Decisions & Actions */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="font-extrabold text-sm md:text-base uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Alınan Kararlar, Tespitler ve Aksiyon Süreçleri
              </h3>
              <div className="h-0.5 bg-teal-600 flex-1 opacity-80" />
            </div>

            <div className="border border-slate-300 dark:border-slate-700 rounded-md overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="p-3 w-12 text-center border-r border-slate-700">No</th>
                    <th className="p-3 w-5/12 border-r border-slate-700">Konu / Kaynak / Tespit</th>
                    <th className="p-3 w-4/12 border-r border-slate-700">Karar & Gerçekleştirilen Aksiyonlar</th>
                    <th className="p-3 w-3/12">Sorumlu & İlerleme</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {items.map((item, idx) => {
                    const photos = item.findingPhotos || [];
                    const actions = item.actions || [];
                    const { percent: itemPct, completedActions, totalActions } = calculateItemProgress(item);

                    return (
                      <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/70 dark:bg-slate-800/30' : 'bg-white dark:bg-slate-900'}>
                        <td className="p-3 text-center font-extrabold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800 align-top">
                          <span className="inline-block w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 leading-6 text-center font-black text-xs">
                            {item.orderNo || idx + 1}
                          </span>
                        </td>
                        
                        {/* Konu + Kaynak + Kategori + Tespit Fotoğrafları */}
                        <td className="p-3 border-r border-slate-200 dark:border-slate-800 align-top space-y-2">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                            {item.topic}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            {item.source && (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800">
                                {item.source}
                              </span>
                            )}
                            {item.category && item.category.split(',').map((c: string) => c.trim()).filter(Boolean).map((cat: string, cIdx: number) => (
                              <span key={cIdx} className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                                {cat}
                              </span>
                            ))}
                          </div>

                          {/* Fotoğraf Küçük Önizlemeleri */}
                          {photos.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1.5 print:hidden">
                              {photos.map((pUrl: string, pIdx: number) => (
                                <div
                                  key={pIdx}
                                  onClick={() => openPhotoPreview(`Madde #${item.orderNo} Tespit Fotoğrafı`, photos, pIdx)}
                                  className="w-12 h-12 rounded border border-slate-300 dark:border-slate-700 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity bg-slate-100 relative group"
                                  title="Büyük önizleme için tıklayın"
                                >
                                  <img src={pUrl} alt="Tespit" className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px]">
                                    <Maximize2 className="w-3.5 h-3.5" />
                                  </div>
                                </div>
                              ))}
                              <span className="text-[11px] text-slate-400 self-center">
                                ({photos.length} fotoğraf)
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Karar / Aksiyon ve Alt Alta Dökülen Kanıtlar (Yazdırıldığında da tam çıkar) */}
                        <td className="p-3 border-r border-slate-200 dark:border-slate-800 align-top space-y-2.5">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                            {item.action || 'Aksiyon planı bekleniyor.'}
                          </div>

                          {/* Maddenin Altına Eklenen Tüm Aksiyonlar (Print ve View İçin Net Liste) */}
                          {actions.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                              <span className="text-[11px] font-bold uppercase text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Uygulanan Aksiyonlar ({actions.length})
                              </span>
                              {actions.map((act: any, aIdx: number) => (
                                <div key={aIdx} className="text-xs p-2.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5 print:bg-white print:border-slate-300">
                                  <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                                    <span>#{aIdx + 1} {act.explanation}</span>
                                    <Badge className={act.status === 'Tamamlandı' ? 'bg-emerald-600 text-white text-[10px]' : 'bg-amber-500 text-white text-[10px]'}>
                                      {act.status || 'Tamamlandı'}
                                    </Badge>
                                  </div>
                                  <div className="flex justify-between items-center text-[10px] text-slate-500">
                                    <span>Sorumlu / Yapan: <strong>{act.performedBy || 'Yetkili'}</strong></span>
                                    <span>{new Date(act.createdAt || act.actionDate).toLocaleDateString('tr-TR')}</span>
                                  </div>

                                  {/* Kanıt Belgeleri / Fotoğrafları Önizleme */}
                                  {act.evidencePhotos && act.evidencePhotos.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                      <span className="text-[10px] text-slate-400">Kanıtlar:</span>
                                      {act.evidencePhotos.map((evUrl: string, evIdx: number) => (
                                        <div
                                          key={evIdx}
                                          onClick={() => openPhotoPreview(`Madde #${item.orderNo} Kanıt Fotoğrafı #${evIdx + 1}`, act.evidencePhotos, evIdx)}
                                          className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] text-blue-600 hover:text-blue-800 cursor-pointer shadow-2xs group"
                                          title="Kanıt önizlemesi için tıklayın"
                                        >
                                          <ImageIcon className="w-2.5 h-2.5 text-blue-500" />
                                          <span>Kanıt #{evIdx + 1}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Sorumlu & Durum & Tamamlanma Yüzdesi */}
                        <td className="p-3 align-top space-y-2.5">
                          {/* Yüzdelik İlerleme Çubuğu */}
                          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-slate-700 dark:text-slate-300">
                                Tamamlanma
                              </span>
                              <span className={`font-black ${itemPct === 100 ? 'text-emerald-600' : itemPct > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                                %{itemPct}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  itemPct === 100 ? 'bg-emerald-500' : itemPct > 0 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${itemPct}%` }}
                              />
                            </div>
                            {totalActions > 0 && (
                              <div className="text-[10px] text-slate-400 font-medium text-right">
                                {completedActions} / {totalActions} aksiyon tamamlandı
                              </div>
                            )}
                          </div>

                          <div className="space-y-1">
                            {item.responsible ? (
                              item.responsible.split(',').map((r: string) => r.trim()).filter(Boolean).map((r: string, rIdx: number) => (
                                <span key={rIdx} className="text-[11px] font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800 block w-fit">
                                  {r}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400 italic">Sorumlu Belirtilmedi</span>
                            )}
                          </div>

                          {item.deadlineDate && (
                            <div className="text-xs text-slate-500 font-medium">
                              Termin: {new Date(item.deadlineDate).toLocaleDateString('tr-TR')}
                            </div>
                          )}

                          <div>
                            {renderStatusBadge(item.status)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* İmzalar */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-300 dark:border-slate-700 text-xs md:text-sm">
            <div className="border border-slate-200 dark:border-slate-800 rounded p-4 text-center space-y-8 bg-slate-50/50">
              <span className="font-bold text-slate-600 block">Hazırlayan</span>
              <span className="text-slate-500 block border-t border-slate-300 pt-2">{preparedBy || 'Ad Soyad / İmza'}</span>
            </div>
            <div className="border border-slate-200 dark:border-slate-800 rounded p-4 text-center space-y-8 bg-slate-50/50">
              <span className="font-bold text-slate-600 block">Kontrol Eden</span>
              <span className="text-slate-500 block border-t border-slate-300 pt-2">{reviewedBy || 'Ad Soyad / İmza'}</span>
            </div>
            <div className="border border-slate-200 dark:border-slate-800 rounded p-4 text-center space-y-8 bg-slate-50/50">
              <span className="font-bold text-slate-600 block">Onaylayan</span>
              <span className="text-slate-500 block border-t border-slate-300 pt-2">{approvedBy || 'Ad Soyad / İmza'}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center text-xs text-slate-400 pt-3 border-t border-slate-200">
            <span>{currentFacility?.name || 'VM Medical Park'} · Yangın Güvenliği Kontrol Sistemi</span>
            <span>Toplantı Tutanağı · {new Date(auditDate).toLocaleDateString('tr-TR')}</span>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. EDIT / DİNAMİK YÖNETİM MODU (Kompakt Kartlar & Tablı Yapı) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {mode === 'edit' && (
        <div className="space-y-5">
          {/* Tutanak Üst Bilgileri Düzenleme */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>Toplantı Tutanağı Bilgileri</span>
                <Badge variant="outline" className="text-xs">Düzenleme Modu</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-600">Tutanak Başlığı</label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} className="mt-1 font-bold h-9 text-xs" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-600">Toplantı Tarihi</label>
                  <Input type="date" value={auditDate} onChange={e => setAuditDate(e.target.value)} className="mt-1 h-9 text-xs" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-600">Genel Tutanak Durumu</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="mt-1 w-full text-xs font-medium rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 h-9"
                  >
                    <option value="DRAFT">Taslak</option>
                    <option value="DEVAM_EDIYOR">Devam Ediyor</option>
                    <option value="TAMAMLANDI">Tamamlandı</option>
                    <option value="ARSIV">Arşiv</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-600">Alt Başlık</label>
                <Input value={subtitle} onChange={e => setSubtitle(e.target.value)} className="mt-1 text-xs text-teal-700 font-semibold h-8" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-600">Toplantı Konusu</label>
                  <Textarea rows={2} value={topic} onChange={e => setTopic(e.target.value)} className="mt-1 text-xs" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-600">Toplantının Amacı</label>
                  <Textarea rows={2} value={purpose} onChange={e => setPurpose(e.target.value)} className="mt-1 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="text-xs font-medium text-slate-500">Hazırlayan</label>
                  <Input value={preparedBy} onChange={e => setPreparedBy(e.target.value)} className="mt-1 text-xs h-8" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">Kontrol Eden</label>
                  <Input value={reviewedBy} onChange={e => setReviewedBy(e.target.value)} className="mt-1 text-xs h-8" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">Onaylayan</label>
                  <Input value={approvedBy} onChange={e => setApprovedBy(e.target.value)} className="mt-1 text-xs h-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filtre ve Yeni Madde Ekle Barı */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Kaynak:</span>
              <select
                value={filterSource}
                onChange={e => setFilterSource(e.target.value)}
                className="text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1"
              >
                <option value="ALL">Tüm Kaynaklar ({items.length})</option>
                {sourcesList.map((s: string) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <span className="text-xs font-semibold text-slate-500 ml-2">Durum:</span>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1"
              >
                <option value="ALL">Tümü</option>
                <option value="ACIK">Bekliyor</option>
                <option value="DEVAM_EDIYOR">Devam Ediyor</option>
                <option value="TAMAMLANDI">Tamamlandı</option>
              </select>
            </div>

            <Button
              onClick={addItem}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs h-8 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Yeni Tespit Maddesi Ekle
            </Button>
          </div>

          {/* Maddelerin Dinamik Listesi (Boşlukları Daraltılmış Kompakt Kartlar) */}
          <div className="space-y-4">
            {filteredItems.map((item, index) => {
              const originalIndex = items.findIndex(i => i.orderNo === item.orderNo);
              const isSaved = item.id && !item.id.startsWith('temp_');
              const photos = item.findingPhotos || [];
              const actions = item.actions || [];
              const isSavingThis = savingItemOrderNo === item.orderNo;
              const activeActionTab = activeActionTabs[item.orderNo] ?? 0;

              // Çoklu Kategori Listesi
              const itemCategories: string[] = item.category 
                ? item.category.split(',').map((c: string) => c.trim()).filter(Boolean)
                : [];

              // Çoklu Sorumlu Listesi
              const itemResponsibles: string[] = item.responsible
                ? item.responsible.split(',').map((r: string) => r.trim()).filter(Boolean)
                : [];

              const toggleCategory = (catName: string) => {
                let updated: string[];
                if (itemCategories.includes(catName)) {
                  updated = itemCategories.filter(c => c !== catName);
                } else {
                  updated = [...itemCategories, catName];
                }
                updateItemField(originalIndex, 'category', updated.join(', '));
              };

              const toggleResponsible = (respName: string) => {
                let updated: string[];
                if (itemResponsibles.includes(respName)) {
                  updated = itemResponsibles.filter(r => r !== respName);
                } else {
                  updated = [...itemResponsibles, respName];
                }
                updateItemField(originalIndex, 'responsible', updated.join(', '));
              };

              return (
                <div
                  key={item.orderNo || index}
                  className={`p-3.5 md:p-4 rounded-xl border transition-all ${
                    isSaved
                      ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs'
                      : 'border-amber-300 dark:border-amber-700/60 bg-amber-50/20 dark:bg-amber-950/10'
                  }`}
                >
                  {/* Item Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 font-extrabold flex items-center justify-center text-xs border border-teal-300 dark:border-teal-800">
                        {item.orderNo || index + 1}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isSaved ? (
                          <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Kayıtlı
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-300">
                            Kayıt Bekliyor
                          </span>
                        )}
                        <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800">
                          {item.source || 'Kaynak Belirtilmedi'}
                        </span>
                        {renderStatusBadge(item.status)}

                        {/* Yüzdelik Oran Rozeti */}
                        {(() => {
                          const { percent } = calculateItemProgress(item);
                          return (
                            <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded border ${
                              percent === 100
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                                : percent > 0
                                ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              <BarChart3 className="w-3 h-3" />
                              %{percent} Tamamlandı
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Tekil Maddeyi Kaydet Butonu */}
                      <Button
                        size="sm"
                        onClick={() => handleSaveSingleItem(originalIndex)}
                        disabled={isSavingThis}
                        className="bg-teal-700 hover:bg-teal-800 text-white text-xs h-7.5 px-2.5 shadow-2xs"
                      >
                        <Save className="w-3 h-3 mr-1" />
                        {isSavingThis ? 'Kaydediliyor...' : isSaved ? 'Maddeyi Güncelle' : 'Maddeyi Kaydet'}
                      </Button>

                      {/* Aksiyon Ekle Butonu */}
                      <Button
                        size="sm"
                        onClick={() => handleOpenActionModal(item, originalIndex)}
                        disabled={!isSaved}
                        className={`text-xs h-7.5 px-2.5 ${
                          isSaved 
                            ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900' 
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                        title={!isSaved ? 'Önce maddeyi kaydetmelisiniz' : 'Yeni aksiyon ve kanıt süreci girişi'}
                      >
                        <MessageSquarePlus className="w-3 h-3 mr-1" />
                        + Aksiyon Ekle
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(originalIndex)}
                        className="text-slate-400 hover:text-red-600 h-7.5 w-7.5 p-0"
                        title="Maddeyi Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Form Giriş Alanları (Kompakt grid ve daha dar padding) */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3">
                    {/* Sol Kısım: Konu + Aksiyon + Fotoğraflar */}
                    <div className="md:col-span-8 space-y-2.5">
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Saha Tespiti / İtfaiye Denetim Maddesi *
                        </label>
                        <Textarea
                          rows={2}
                          value={item.topic || ''}
                          onChange={e => updateItemField(originalIndex, 'topic', e.target.value)}
                          placeholder="Sahadaki tespit, eksiklik veya itfaiye raporundaki ilgili madde detayı..."
                          className="mt-1 text-xs font-medium"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-teal-800 dark:text-teal-400">
                          Karar / Aksiyon Planı
                        </label>
                        <Textarea
                          rows={1}
                          value={item.action || ''}
                          onChange={e => updateItemField(originalIndex, 'action', e.target.value)}
                          placeholder="Yapılması kararlaştırılan genel aksiyon ve düzeltici plan..."
                          className="mt-1 text-xs border-teal-200 bg-teal-50/20"
                        />
                      </div>

                      {/* Tespit Fotoğrafları Yükleme ve Önizleme */}
                      <div className="space-y-1.5 pt-0.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                            Tespit Fotoğrafları ({photos.length})
                          </label>
                          <label className="cursor-pointer text-xs font-semibold text-red-600 hover:text-red-700 inline-flex items-center gap-1">
                            <Upload className="w-3.5 h-3.5" />
                            {uploadingItemIndex === originalIndex ? 'Yükleniyor...' : 'Fotoğraf Seç / Ekle'}
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              className="hidden"
                              onChange={e => handleFileUpload(e, 'ITEM', originalIndex)}
                              disabled={uploadingItemIndex === originalIndex}
                            />
                          </label>
                        </div>

                        {photos.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {photos.map((photoUrl: string, pIdx: number) => (
                              <div key={pIdx} className="relative group w-14 h-14 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xs bg-slate-100">
                                <img 
                                  src={photoUrl} 
                                  alt="Tespit" 
                                  className="w-full h-full object-cover cursor-pointer"
                                  onClick={() => openPhotoPreview(`Madde #${item.orderNo} Fotoğraf #${pIdx + 1}`, photos, pIdx)}
                                />
                                <div 
                                  onClick={() => openPhotoPreview(`Madde #${item.orderNo} Fotoğraf #${pIdx + 1}`, photos, pIdx)}
                                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                                  title="Önizle"
                                >
                                  <Maximize2 className="w-3.5 h-3.5" />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeFindingPhoto(originalIndex, pIdx)}
                                  className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                  title="Fotoğrafı Kaldır"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic">Henüz tespit fotoğrafı yüklenmedi.</div>
                        )}
                      </div>
                    </div>

                    {/* Sağ Kısım: Kaynak, ÇOKLU Kategori, ÇOKLU Sorumlu, Termin, Durum */}
                    <div className="md:col-span-4 space-y-2 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 text-xs">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Kaynak Türü</label>
                        <select
                          value={item.source || ''}
                          onChange={e => updateItemField(originalIndex, 'source', e.target.value)}
                          className="mt-0.5 w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1"
                        >
                          {sourcesList.map((s: string) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      {/* ÇOKLU KATEGORİ SEÇİMİ */}
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Kategori (Çoklu Seçim - {itemCategories.length})
                          </label>
                          <span className="text-[10px] text-slate-400">Tıklayarak seçin/kaldırın</span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                          {categoriesList.map((c: string) => {
                            const isSelected = itemCategories.includes(c);
                            return (
                              <button
                                key={c}
                                type="button"
                                onClick={() => toggleCategory(c)}
                                className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                                  isSelected
                                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 font-semibold shadow-2xs'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                {isSelected ? '✓ ' : '+ '}{c}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* ÇOKLU SORUMLU BİRİM SEÇİMİ */}
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Sorumlu Birim (Çoklu Seçim - {itemResponsibles.length})
                          </label>
                          <span className="text-[10px] text-slate-400">Tıklayarak seçin/kaldırın</span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                          {responsiblesList.map((r: string) => {
                            const isSelected = itemResponsibles.includes(r);
                            return (
                              <button
                                key={r}
                                type="button"
                                onClick={() => toggleResponsible(r)}
                                className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                                  isSelected
                                    ? 'bg-teal-700 text-white border-teal-700 font-bold shadow-2xs'
                                    : 'bg-teal-50/50 dark:bg-slate-800 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-slate-700 hover:bg-teal-100/50'
                                }`}
                              >
                                {isSelected ? '✓ ' : '+ '}{r}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Termin Tarihi</label>
                          <Input
                            type="date"
                            value={item.deadlineDate ? new Date(item.deadlineDate).toISOString().split('T')[0] : ''}
                            onChange={e => updateItemField(originalIndex, 'deadlineDate', e.target.value)}
                            className="mt-0.5 text-xs bg-white dark:bg-slate-800 font-medium h-7 px-2"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Mevcut Durum</label>
                          <select
                            value={item.status}
                            onChange={e => updateItemField(originalIndex, 'status', e.target.value)}
                            className="mt-0.5 w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 font-bold"
                          >
                            <option value="ACIK">Bekliyor</option>
                            <option value="DEVAM_EDIYOR">Devam Ediyor (Turuncu)</option>
                            <option value="TAMAMLANDI">Tamamlandı (Yeşil)</option>
                            <option value="IPTAL">İptal</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ───────────────────────────────────────────────────────────── */}
                  {/* HER MADDENİN KENDİ İÇİNDE TAB'LI SEKME AKSİYON YAPISI         */}
                  {/* Aksiyon süreçleri çok fazla olabileceği için sekmeli yönetim  */}
                  {/* ───────────────────────────────────────────────────────────── */}
                  {actions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          Aksiyon Süreçleri ve Kanıt Geçmişi ({actions.length})
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Her bir aksiyon adımını sekmelerden inceleyebilirsiniz
                        </span>
                      </div>

                      {/* Tab Butonları */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                        {actions.map((act: any, aIdx: number) => {
                          const isActCompleted = act.status === 'Tamamlandı';
                          const isSelected = activeActionTab === aIdx;

                          return (
                            <button
                              key={aIdx}
                              type="button"
                              onClick={() => setActiveActionTabs(prev => ({ ...prev, [item.orderNo]: aIdx }))}
                              className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                                isSelected
                                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100 shadow-2xs'
                                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${isActCompleted ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                              <span>Aksiyon #{aIdx + 1}</span>
                              <span className="text-[10px] opacity-75">
                                ({act.performedBy?.split(' ')[0] || 'Yetkili'})
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Aktif Tab İçeriği */}
                      {actions[activeActionTab] && (
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                İşlemi Yapan: {actions[activeActionTab].performedBy || 'Yetkili'}
                              </span>
                              <Badge className={actions[activeActionTab].status === 'Tamamlandı' ? 'bg-emerald-600 text-white text-[10px]' : 'bg-amber-500 text-white text-[10px]'}>
                                {actions[activeActionTab].status || 'Tamamlandı'}
                              </Badge>
                            </div>
                            <span className="text-[11px] text-slate-500">
                              {new Date(actions[activeActionTab].createdAt || actions[activeActionTab].actionDate).toLocaleString('tr-TR')}
                            </span>
                          </div>

                          <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200/80 dark:border-slate-700">
                            {actions[activeActionTab].explanation}
                          </p>

                          {/* Kanıt Fotoğrafları Küçük Küçük Önizlemeli ve Tıklanabilir (Preview Modal) */}
                          {actions[activeActionTab].evidencePhotos && actions[activeActionTab].evidencePhotos.length > 0 && (
                            <div className="space-y-1 pt-1">
                              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                <Paperclip className="w-3 h-3 text-blue-500" />
                                Kanıt Fotoğrafları & Belgeleri ({actions[activeActionTab].evidencePhotos.length}) - Önizlemek için tıklayınız:
                              </span>
                              <div className="flex flex-wrap gap-2 pt-0.5">
                                {actions[activeActionTab].evidencePhotos.map((evUrl: string, evIdx: number) => {
                                  const isImg = evUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i) || !evUrl.includes('.');
                                  return (
                                    <div
                                      key={evIdx}
                                      onClick={() => openPhotoPreview(`Madde #${item.orderNo} Aksiyon #${activeActionTab + 1} Kanıtı`, actions[activeActionTab].evidencePhotos, evIdx)}
                                      className="relative group w-14 h-14 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-900 cursor-pointer shadow-2xs hover:opacity-90 transition-opacity"
                                      title="Önizlemek için tıklayınız"
                                    >
                                      {isImg ? (
                                        <img src={evUrl} alt="Kanıt" className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center p-1 text-[9px] text-slate-600 dark:text-slate-400 text-center">
                                          <Paperclip className="w-4 h-4 mb-0.5" />
                                          Belge #{evIdx + 1}
                                        </div>
                                      )}
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                        <Maximize2 className="w-3.5 h-3.5" />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. MODALLER: Aksiyon & Kanıt Girişi ve In-App Preview        */}
      {/* ───────────────────────────────────────────────────────────── */}

      {/* Aksiyon & Kanıt Giriş Modalı */}
      <Dialog open={!!activeItemForAction} onOpenChange={open => !open && setActiveItemForAction(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
              Aksiyon ve Kanıt Girişi
            </DialogTitle>
            <DialogDescription className="text-xs">
              Madde #{activeItemForAction?.orderNo}: {activeItemForAction?.topic?.slice(0, 60)}...
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Yapılan İşlem / Faaliyet *</label>
              <Textarea
                rows={3}
                value={actionDesc}
                onChange={e => setActionDesc(e.target.value)}
                placeholder="Örn: Yangın kapı fitilleri yenilendi, pano altı yanmaz köpük uygulaması tamamlandı..."
                className="mt-1 text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">İşlemi Yapan / Giren Kişi</label>
              <Input
                value={actionDoneBy}
                onChange={e => setActionDoneBy(e.target.value)}
                placeholder="İsim, Departman veya Firma"
                className="mt-1 text-xs h-8"
              />
            </div>

            {/* Sorumlu Departman Seçimi */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">İşlemi Yürüten / Sorumlu Departman</label>
              <select
                value={actionDepartment}
                onChange={e => setActionDepartment(e.target.value)}
                className="mt-1 w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 font-medium text-teal-800 dark:text-teal-300 h-8"
              >
                {activeItemForAction?.responsible && (
                  <optgroup label="Bu Maddede Atanmış Sorumlular">
                    {activeItemForAction.responsible.split(',').map((r: string) => r.trim()).filter(Boolean).map((r: string) => (
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
                value={actionStatus}
                onChange={e => setActionStatus(e.target.value)}
                className="mt-1 w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 font-bold h-8"
              >
                <option value="Tamamlandı">Tamamlandı (Eksiklik Giderildi - Yeşil)</option>
                <option value="Devam Ediyor">Kısmen Yapıldı / Devam Ediyor (Turuncu)</option>
                <option value="Başlamadı">Bekliyor (Kırmızı)</option>
              </select>
            </div>

            {/* Kanıt Belgeleri / Fotoğrafları Yükleme ve Küçük Önizlemeleri */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Kanıt Fotoğrafları / Belgeler</label>
                <label className="cursor-pointer text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  {uploadingActionFile ? 'Yükleniyor...' : 'Kanıt Seç / Yükle'}
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={e => handleFileUpload(e, 'ACTION')}
                    disabled={uploadingActionFile}
                  />
                </label>
              </div>

              {actionFiles.length > 0 ? (
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1 border rounded-lg bg-slate-50 dark:bg-slate-800/40">
                  {actionFiles.map((fileUrl, fIdx) => (
                    <div key={fIdx} className="relative group w-14 h-14 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 shadow-2xs">
                      <img 
                        src={fileUrl} 
                        alt="Kanıt" 
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => openPhotoPreview(`Yeni Kanıt Önizleme #${fIdx + 1}`, actionFiles, fIdx)}
                      />
                      <button
                        type="button"
                        onClick={() => setActionFiles(prev => prev.filter((_, i) => i !== fIdx))}
                        className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        title="Kaldır"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center border border-dashed rounded-lg text-xs text-slate-400">
                  Henüz kanıt belgesi eklenmedi. (Görsel veya belge seçebilirsiniz)
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setActiveItemForAction(null)}>İptal</Button>
            <Button size="sm" onClick={handleSaveAction} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              Kaydet ve Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* In-App Fotoğraf Önizleme (Preview Modal - Ayrı sekmede açmaz) */}
      <Dialog open={previewPhoto.isOpen} onOpenChange={open => !open && setPreviewPhoto(prev => ({ ...prev, isOpen: false }))}>
        <DialogContent className="max-w-3xl p-4 bg-slate-950 text-white border-slate-800">
          <DialogHeader className="pb-2 border-b border-slate-800 flex flex-row items-center justify-between">
            <DialogTitle className="text-sm font-semibold text-slate-200">
              {previewPhoto.title} ({previewPhoto.currentIndex + 1} / {previewPhoto.photos.length})
            </DialogTitle>
          </DialogHeader>

          <div className="relative flex items-center justify-center min-h-[380px] max-h-[75vh] py-2 bg-black rounded overflow-hidden">
            {previewPhoto.photos.length > 0 && (
              <img
                src={previewPhoto.photos[previewPhoto.currentIndex]}
                alt="Önizleme"
                className="max-h-[70vh] max-w-full object-contain"
              />
            )}

            {/* Önceki / Sonraki Butonları */}
            {previewPhoto.photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevPreviewPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={nextPreviewPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Küçük Galeri Çubuğu */}
          {previewPhoto.photos.length > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2 overflow-x-auto">
              {previewPhoto.photos.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPreviewPhoto(prev => ({ ...prev, currentIndex: idx }))}
                  className={`w-12 h-12 rounded overflow-hidden border-2 transition-all shrink-0 ${
                    previewPhoto.currentIndex === idx ? 'border-red-500 scale-105' : 'border-transparent opacity-50'
                  }`}
                >
                  <img src={url} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


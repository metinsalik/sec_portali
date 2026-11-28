import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Clock, MapPin, Wrench, Shield, User,
  FileText, Camera, CheckCircle2, AlertTriangle, AlertCircle,
  Download, ExternalLink, Printer, Edit3, MessageSquarePlus,
  Building2, TrendingUp, DollarSign, History,
  ChevronRight, ChevronDown, ChevronUp, ChevronsDown, ChevronsUp, RefreshCw, ZoomIn, Layers, FileCheck, Eye, Sparkles,
  Scale, ShoppingCart, HardHat, Package, MoreHorizontal, ArrowRight, Check, Trash2,
  ShieldCheck, Lock, XCircle, ClipboardCheck, Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import {
  type ImprovementRecord,
  type ImprovementRecordHistory,
  type ImprovementRecordVerification,
  type ImprovementFileAttachment,
  formatCurrency,
  getSheetLabel,
  formatAttachmentName
} from './types';
import { ImprovementMediaLightbox, formatBytes } from './ImprovementMediaManager';
import {
  ActionNoteDialog,
  EditRecordDialog,
  EditActionHistoryDialog,
  DeleteActionHistoryDialog
} from './ImprovementRecordDialogs';
import { VerificationDialog } from './VerificationDialog';

const API = import.meta.env.VITE_API_URL || '';

export const ImprovementDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [record, setRecord] = useState<ImprovementRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Aktif Sekme: 'OVERVIEW' (Tespit & Aksiyon) | 'HISTORY' (Geçmiş & Denetim İzi) | 'MEDIA' (Görseller & Belgeler) | 'BUDGET' (Bütçe & Maliyet)
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'HISTORY' | 'MEDIA' | 'BUDGET'>('OVERVIEW');

  // Modallar
  const [showActionModal, setShowActionModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDiscoveryModal, setShowDiscoveryModal] = useState<boolean>(false);
  const [discoveryNotesInput, setDiscoveryNotesInput] = useState<string>('');
  const [savingDiscovery, setSavingDiscovery] = useState<boolean>(false);
  const [editingHistory, setEditingHistory] = useState<ImprovementRecordHistory | null>(null);
  const [deletingHistory, setDeletingHistory] = useState<ImprovementRecordHistory | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState<boolean>(false);
  const [editingVerification, setEditingVerification] = useState<ImprovementRecordVerification | null>(null);
  const [deletingVerificationId, setDeletingVerificationId] = useState<string | null>(null);

  // Lightbox Önizleme
  const [lightboxState, setLightboxState] = useState<{
    photos: ImprovementFileAttachment[];
    index: number;
    title: string;
  } | null>(null);

  // Akordiyon Adım State (Varsayılan olarak en son girilen adım açık, önceki adımlar kapalı)
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const [allExpanded, setAllExpanded] = useState<boolean | null>(null);

  const toggleStep = (stepId: string, currentIsOpen: boolean) => {
    setExpandedSteps(prev => ({ ...prev, [stepId]: !currentIsOpen }));
    setAllExpanded(null);
  };

  const toggleAllSteps = () => {
    if (allExpanded === true) {
      setAllExpanded(false);
      setExpandedSteps({});
    } else {
      setAllExpanded(true);
    }
  };

  // Kayıt Detayı ve Tarihçesini Çek
  const fetchRecordDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/operations/improvements/records/${id}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Bulgu detayı yüklenemedi.');
      }
      setRecord(data.data);
    } catch (err: any) {
      console.error('Fetch record detail error:', err);
      setError(err.message || 'Bulgu detayı alınırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Departman Sorumlusuna E-posta Bildirimi & Outlook .eml Taslağı State ve Fonksiyonları
  const [notifyingOwner, setNotifyingOwner] = useState<boolean>(false);
  const [downloadingEml, setDownloadingEml] = useState<boolean>(false);

  const handleDownloadEml = async () => {
    if (!record || downloadingEml) return;
    setDownloadingEml(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/operations/improvements/records/${record.id}/eml-draft`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ origin: window.location.origin })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Outlook taslağı (.eml) oluşturulamadı.');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `iyilestirme-${record.rowNo || record.id.slice(0, 8)}.eml`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Outlook taslağı (.eml) indirildi. Açıp doğrudan gönderebilirsiniz.');
    } catch (err: any) {
      toast.error(err.message || 'Outlook taslağı indirilirken hata oluştu.');
    } finally {
      setDownloadingEml(false);
    }
  };

  const handleNotifyOwner = async () => {
    if (!record || notifyingOwner) return;
    setNotifyingOwner(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/operations/improvements/records/${record.id}/notify-owner`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ origin: window.location.origin })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Bildirim e-postası gönderilemedi.');
      }
      toast.success(data.message || 'Departman sorumlusuna bildirim e-postası gönderildi.');
    } catch (err: any) {
      toast.error(err.message || 'E-posta gönderilirken hata oluştu.');
    } finally {
      setNotifyingOwner(false);
    }
  };

  // Hızlı Durum Değiştirme State ve Fonksiyonu
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);

  const handleQuickStatusChange = async (newStatus: string) => {
    if (!record || record.status === newStatus || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/operations/improvements/records/${record.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Durum güncellenemedi.');
      }
      toast.success(`Durum "${newStatus}" olarak güncellendi.`);
      fetchRecordDetail();
    } catch (err: any) {
      toast.error('Hata: ' + err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openDiscoveryModal = () => {
    setDiscoveryNotesInput(record?.discoveryNotes || '');
    setShowDiscoveryModal(true);
  };

  const handleSaveDiscoveryNotes = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!record) return;
    setSavingDiscovery(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/operations/improvements/records/${record.id}/discovery-notes`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ discoveryNotes: discoveryNotesInput }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Saha keşif notu kaydedilemedi.');
      }
      toast.success('Saha keşif notu başarıyla güncellendi.');
      setShowDiscoveryModal(false);
      fetchRecordDetail();
    } catch (err: any) {
      toast.error('Hata: ' + err.message);
    } finally {
      setSavingDiscovery(false);
    }
  };

  useEffect(() => {
    fetchRecordDetail();
  }, [fetchRecordDetail]);

  // Anlık Gerçek Zamanlı Geri Sayım Durumu (Saniyelik Canlı Ticker)
  const [countdown, setCountdown] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isOverdue: boolean;
  } | null>(null);

  useEffect(() => {
    if (!record?.dueDate || record.status === 'Tamamlandı' || record.status === 'İptal Edildi') {
      setCountdown(null);
      return;
    }

    const updateCountdown = () => {
      const targetDate = new Date(record.dueDate!);
      // Tarihte saat belirtilmemişse o günün sonunu (23:59:59) baz al
      if (targetDate.getHours() === 0 && targetDate.getMinutes() === 0 && targetDate.getSeconds() === 0) {
        targetDate.setHours(23, 59, 59, 999);
      }
      const now = Date.now();
      const diffMs = targetDate.getTime() - now;
      const isOverdue = diffMs < 0;
      const absDiff = Math.abs(diffMs);

      const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((absDiff % (1000 * 60)) / 1000);

      setCountdown({
        days,
        hours,
        minutes,
        seconds,
        isOverdue,
      });
    };

    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);
    return () => clearInterval(intervalId);
  }, [record?.dueDate, record?.status]);

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          Bulgu ve aksiyon detayları yükleniyor...
        </p>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Geri Dön
        </Button>
        <div className="p-8 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h3 className="text-base font-bold text-red-700 dark:text-red-400">Kayıt Bulunamadı</h3>
          <p className="text-sm text-red-600 dark:text-red-300">{error || 'İstenen iyileştirme kaydı sistemde mevcut değil veya silinmiş.'}</p>
          <Button variant="outline" size="sm" onClick={() => navigate('/operations-management/improvements')}>
            İyileştirme Listesine Dön
          </Button>
        </div>
      </div>
    );
  }

  // Fotoğraflar ve Dokümanlar
  const findingPhotos: ImprovementFileAttachment[] = Array.isArray(record.findingPhotos) ? record.findingPhotos : [];
  const documents: ImprovementFileAttachment[] = Array.isArray(record.documents) ? record.documents : [];
  const histories: ImprovementRecordHistory[] = Array.isArray(record.histories) ? record.histories : [];
  const actionHistories: ImprovementRecordHistory[] = histories.filter(h => h.stepType !== 'DOGRULAMA');
  const verifications: ImprovementRecordVerification[] = Array.isArray(record.verifications) ? record.verifications : [];
  const canVerify = Boolean(record.canVerify);

  // Tüm Aksiyon Kanıt Fotoğrafları Havuzu
  const allEvidencePhotos: { photo: ImprovementFileAttachment; historyItem: ImprovementRecordHistory }[] = [];
  actionHistories.forEach(h => {
    if (Array.isArray(h.evidencePhotos)) {
      h.evidencePhotos.forEach(p => {
        allEvidencePhotos.push({ photo: p, historyItem: h });
      });
    }
  });

  // Tüm Doğrulama Fotoğrafları ve Belgeleri Havuzu
  const allVerificationPhotos: { photo: ImprovementFileAttachment; verification: ImprovementRecordVerification }[] = [];
  const allVerificationDocs: { doc: ImprovementFileAttachment; verification: ImprovementRecordVerification }[] = [];
  verifications.forEach(v => {
    if (Array.isArray(v.photos)) {
      v.photos.forEach(p => allVerificationPhotos.push({ photo: p, verification: v }));
    }
    if (Array.isArray(v.documents)) {
      v.documents.forEach(d => allVerificationDocs.push({ doc: d, verification: v }));
    }
  });

  const handleDeleteVerification = async (verificationId: string) => {
    if (!record || !window.confirm('Bu doğrulama kaydını silmek istediğinize emin misiniz?')) return;
    setDeletingVerificationId(verificationId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/operations/improvements/records/${record.id}/verifications/${verificationId}`, {
        method: 'DELETE',
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Doğrulama kaydı silinemedi.');
      }
      toast.success('Doğrulama kaydı silindi.');
      if (data.data) {
        setRecord(data.data);
      } else {
        fetchRecordDetail();
      }
    } catch (err: any) {
      toast.error(err.message || 'Silme sırasında hata oluştu.');
    } finally {
      setDeletingVerificationId(null);
    }
  };

  const getVerificationBadge = (status?: string | null) => {
    switch (status) {
      case 'DOGRULANDI':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-400/60 dark:border-emerald-700 text-xs px-2.5 py-1 font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Doğrulandı
          </Badge>
        );
      case 'KISMI':
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-400/60 dark:border-amber-700 text-xs px-2.5 py-1 font-bold flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Kısmen Doğrulandı
          </Badge>
        );
      case 'RED':
        return (
          <Badge className="bg-red-500/15 text-red-700 dark:text-red-300 border border-red-400/60 dark:border-red-700 text-xs px-2.5 py-1 font-bold flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5 text-red-600" /> Uygun Değil
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs px-2.5 py-1 font-semibold text-muted-foreground flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Doğrulama Bekliyor
          </Badge>
        );
    }
  };

  // Termin & Tarih Analizi
  const recordDateStr = record.recordDate
    ? new Date(record.recordDate).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;
  const dueDateObj = record.dueDate ? new Date(record.dueDate) : null;
  const dueDateStr = dueDateObj
    ? dueDateObj.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  // Bütçe Analizi
  const estBudget = record.estimatedBudget ?? null;
  const actBudget = record.actualBudget ?? null;
  const budgetVariance = (estBudget !== null && actBudget !== null) ? actBudget - estBudget : null;
  const variancePercentage = (estBudget && budgetVariance !== null) ? Math.round((budgetVariance / estBudget) * 100) : null;

  // İlerleme Yüzdesi
  const currentProgressVal = record.status === 'Tamamlandı'
    ? 100
    : (record.status === 'Devam Ediyor' ? Math.min(100, Math.max(0, record.progress ?? 0)) : 0);

  // Durum Rozetleri
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Tamamlandı':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 text-xs px-3 py-1 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Tamamlandı (%100)
          </Badge>
        );
      case 'Devam Ediyor':
        return (
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800 text-xs px-3 py-1 font-semibold flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" /> Devam Ediyor (%{record.progress ?? 0})
            </Badge>
            <div className="w-20 bg-muted rounded-full h-2 overflow-hidden hidden sm:block">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, record.progress ?? 0))}%` }}
                title={`İlerleme: %${record.progress ?? 0}`}
              />
            </div>
          </div>
        );
      case 'İptal Edildi':
        return <Badge variant="outline" className="text-muted-foreground line-through text-xs px-3 py-1">İptal Edildi</Badge>;
      default:
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 text-xs px-3 py-1 font-semibold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Başlamadı (%0)
          </Badge>
        );
    }
  };

  const getRiskBadge = (risk?: string | null) => {
    switch (risk) {
      case 'Kritik':
        return <Badge className="bg-red-500 text-white font-bold text-xs px-3 py-1 shadow-xs flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Kritik Risk</Badge>;
      case 'Yüksek':
        return <Badge className="bg-orange-500 text-white font-semibold text-xs px-3 py-1 shadow-xs flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Yüksek Risk</Badge>;
      case 'Önemli':
        return <Badge className="bg-amber-500 text-white font-medium text-xs px-3 py-1 shadow-xs">Önemli Risk</Badge>;
      case 'Olası':
        return <Badge className="bg-yellow-500 text-white font-normal text-xs px-3 py-1">Olası</Badge>;
      case 'Önemsiz':
        return <Badge className="bg-slate-500 text-white font-normal text-xs px-3 py-1">Önemsiz</Badge>;
      default:
        return <Badge variant="outline" className="text-xs text-muted-foreground">{risk || 'Tanımsız'}</Badge>;
    }
  };

  const formatFieldLabel = (key: string): string => {
    switch (key) {
      case 'talepNo': return 'Talep No';
      case 'tarih': return 'Tarih';
      case 'ihaleTarihi': return 'İhale Tarihi';
      case 'teklifSayisi': return 'Teklif Sayısı';
      case 'siparisNo': return 'Sipariş No';
      case 'firma': return 'Firma';
      case 'siparisTarihi': return 'Sipariş Tarihi';
      case 'beklenenTarih': return 'Beklenen Tarih';
      case 'malzeme': return 'Malzeme';
      case 'terminTarihi': return 'Termin Tarihi';
      case 'ekip': return 'Ekip / Servis';
      case 'yapilanIslem': return 'Yapılan İşlem';
      case 'tamamlanmaTarihi': return 'Tamamlanma Tarihi';
      case 'testSonucu': return 'Test Sonucu';
      case 'konu': return 'Konu';
      case 'aciklama': return 'Açıklama';
      default: return key;
    }
  };

  const getStepIcon = (stepType?: string | null) => {
    switch (stepType) {
      case 'TALEP_ACILDI': return <FileText className="w-3.5 h-3.5" />;
      case 'IHALE_SURECINDE': return <Scale className="w-3.5 h-3.5" />;
      case 'SS_VERILDI': return <ShoppingCart className="w-3.5 h-3.5" />;
      case 'FIRMA_BEKLENIYOR': return <HardHat className="w-3.5 h-3.5" />;
      case 'MALZEME_TEMINI': return <Package className="w-3.5 h-3.5" />;
      case 'SAHA_CALISMASI': return <Wrench className="w-3.5 h-3.5" />;
      case 'TAMAMLANDI': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      default: return <Sparkles className="w-3.5 h-3.5 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6">

      {/* ── 1. ÜST BREADCRUMB & BAŞLIK & AKSİYON BUTONLARI ─────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2 border-b pb-4">
        <div className="space-y-2">

          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
            <Link to="/operations-management/improvements" className="hover:text-foreground transition-colors font-medium">
              İyileştirme Takip
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
            <span className="font-semibold text-foreground flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              {record.facility?.name || record.facility?.shortName || record.facilityId}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
            <span>{getSheetLabel(record.sheetType)}</span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
            <span className="tabular-nums text-primary font-bold">#{record.rowNo || '-'}</span>
          </div>

          {/* Başlık ve Rozetler */}
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
              <span>Bulgu Detayı</span>
              <span className="text-base tabular-nums font-medium text-muted-foreground">
                (Kayıt #{record.rowNo || '-'})
              </span>
            </h1>

            <div className="flex items-center gap-2">
              {getRiskBadge(record.riskScore)}

              {/* Güvenli Açılır Dropdown (Yanlışlıkla Tıklanmayı Önler) */}
              <div className="relative inline-flex items-center">
                <select
                  value={record.status}
                  disabled={updatingStatus}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val !== record.status) {
                      handleQuickStatusChange(val);
                    }
                  }}
                  className="h-8 pl-3 pr-8 rounded-lg border bg-card text-foreground text-xs font-bold cursor-pointer outline-none shadow-2xs hover:border-primary transition-all appearance-none"
                  title="Durumu açılır listeden seçerek güncelleyebilirsiniz"
                >
                  <option value="Başlamadı">⏳ Başlamadı</option>
                  <option value="Devam Ediyor">🔄 Devam Ediyor</option>
                  <option value="Tamamlandı">✅ Tamamlandı</option>
                  <option value="İptal Edildi">🚫 İptal Edildi</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 pointer-events-none" />
              </div>
              {updatingStatus && (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary ml-0.5" />
              )}

              {record.verificationStatus && record.verificationStatus !== 'BEKLIYOR' && (
                getVerificationBadge(record.verificationStatus)
              )}
            </div>
          </div>
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-1.5 text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Tabloya Dön
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => setShowActionModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs font-bold shadow-sm"
          >
            <MessageSquarePlus className="w-4 h-4" />
            Aksiyon Gir
          </Button>

          {canVerify && (
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setEditingVerification(null);
                setShowVerificationModal(true);
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 text-xs font-bold shadow-sm"
            >
              <ShieldCheck className="w-4 h-4" />
              Doğrulama Gir
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleNotifyOwner}
            disabled={notifyingOwner || !record.assignedTo}
            title={
              record.assignedTo
                ? `${record.assignedTo} departmanı sorumlusuna SMTP ile e-posta gönder`
                : 'Önce kayda bir sorumlu departman atayın'
            }
            className="gap-1.5 text-xs font-semibold hover:border-primary text-foreground"
          >
            {notifyingOwner ? (
              <RefreshCw className="w-4 h-4 animate-spin text-primary" />
            ) : (
              <Mail className="w-4 h-4 text-primary" />
            )}
            Sorumluya Mail Gönder
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadEml}
            disabled={downloadingEml}
            title="HTML şablonu, aksiyon linki ve sorumlu alıcılarla hazır Outlook 365 taslağı (.eml) indir"
            className="gap-1.5 text-xs font-semibold hover:border-primary text-foreground"
          >
            {downloadingEml ? (
              <RefreshCw className="w-4 h-4 animate-spin text-primary" />
            ) : (
              <Download className="w-4 h-4 text-primary" />
            )}
            Outlook Taslağı (.eml)
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEditModal(true)}
            className="gap-1.5 text-xs font-semibold hover:border-primary text-foreground"
          >
            <Edit3 className="w-4 h-4 text-primary" />
            Düzenle
          </Button>
        </div>
      </div>

      {/* ── 1.5 BELİRGİN İLERLEME VE DURUM GÖSTERGESİ (PROGRESS HERO BANNER) ── */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs transition-all ${record.status === 'Tamamlandı'
          ? 'bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-950/20'
          : record.status === 'Devam Ediyor'
            ? 'bg-blue-500/10 border-blue-500/30 dark:bg-blue-950/20'
            : record.status === 'İptal Edildi'
              ? 'bg-slate-500/10 border-slate-500/30'
              : 'bg-amber-500/10 border-amber-500/30 dark:bg-amber-950/20'
        }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">

          {/* Sol: Büyük Durum Rozeti ve % Değeri */}
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center tabular-nums font-black border shadow-xs shrink-0 ${record.status === 'Tamamlandı'
                ? 'bg-emerald-500 text-white border-emerald-600'
                : record.status === 'Devam Ediyor'
                  ? 'bg-blue-600 text-white border-blue-700'
                  : record.status === 'İptal Edildi'
                    ? 'bg-slate-500 text-white border-slate-600'
                    : 'bg-amber-500 text-white border-amber-600'
              }`}>
              <span className="text-xl leading-none">%{currentProgressVal}</span>
              <span className="text-[9px] uppercase font-bold tracking-tight opacity-90 mt-0.5">
                {record.status === 'Tamamlandı' ? 'BİTTİ' : 'İLERLEME'}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md ${record.status === 'Tamamlandı'
                    ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                    : record.status === 'Devam Ediyor'
                      ? 'bg-blue-500/20 text-blue-800 dark:text-blue-300'
                      : record.status === 'İptal Edildi'
                        ? 'bg-slate-500/20 text-slate-800 dark:text-slate-300'
                        : 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                  }`}>
                  {record.status}
                </span>

                {record.status === 'Devam Ediyor' && (
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
                    • Aksiyon Süreci İşliyor
                  </span>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                {record.status === 'Tamamlandı'
                  ? 'Giderim ve testler başarıyla sonuçlandı, bulgu %100 kapatıldı.'
                  : record.status === 'Devam Ediyor'
                    ? `Süreç adımları kapsamında bu işin %${currentProgressVal}'lik kısmı tamamlandı; kalan %${100 - currentProgressVal} için aksiyonlar sürüyor.`
                    : record.status === 'İptal Edildi'
                      ? 'Bu bulgu veya aksiyon kaydı iptal edilmiştir.'
                      : 'Henüz bir aksiyon adımı girilmedi (%0). İlerleme başlatmak için yukarıdaki "Aksiyon Gir" butonunu kullanabilirsiniz.'}
              </p>
            </div>
          </div>

          {/* Orta / Sağ: Süreç İlerleme Çubuğu */}
          <div className="flex-1 max-w-md w-full space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-muted-foreground">Süreç Gerçekleşme Oranı</span>
              <span className="tabular-nums text-foreground font-black text-sm">
                %{currentProgressVal} / %100
              </span>
            </div>

            {/* İlerleme Çubuğu */}
            <div className="w-full bg-background/80 border rounded-full h-3 overflow-hidden p-0.5 shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-500 ${record.status === 'Tamamlandı'
                    ? 'bg-emerald-500'
                    : record.status === 'Devam Ediyor'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                      : 'bg-amber-500'
                  }`}
                style={{ width: `${currentProgressVal}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
              <span>%0 Başlangıç</span>
              <span>%25 Talep/İhale</span>
              <span>%50 Tedarik</span>
              <span>%75 Saha/Test</span>
              <span>%100 Tamamlandı</span>
            </div>
          </div>

        </div>
      </div>

      {/* ── 2. SEKME NAVİGASYONU (MODERN SEGMENTED PILLS - ÇİZGİSİZ & ZARİF) ── */}
      <div className="p-1.5 bg-muted/60 dark:bg-muted/30 rounded-2xl border border-border/70 inline-flex items-center gap-1.5 flex-wrap shadow-inner">

        {/* Sekme 1: Tespit & Aksiyon (2 Sütunlu Ana Görünüm) */}
        <button
          type="button"
          onClick={() => setActiveTab('OVERVIEW')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === 'OVERVIEW'
              ? 'bg-card text-foreground shadow-sm font-bold border border-border/60 scale-[1.01]'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
            }`}
        >
          <Layers className="w-4 h-4 text-primary" />
          <span>Tespit & Aksiyon Görünümü</span>
        </button>

        {/* Sekme 2: İşlem Geçmişi & Denetim İzi (Geçmiş) */}
        <button
          type="button"
          onClick={() => setActiveTab('HISTORY')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === 'HISTORY'
              ? 'bg-card text-foreground shadow-sm font-bold border border-border/60 scale-[1.01]'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
            }`}
        >
          <History className="w-4 h-4 text-blue-500" />
          <span>İşlem Geçmişi & Denetim İzi</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-primary/15 text-primary tabular-nums font-bold">
            {histories.length + 1}
          </span>
        </button>

        {/* Sekme 3: Görseller & Belgeler */}
        <button
          type="button"
          onClick={() => setActiveTab('MEDIA')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === 'MEDIA'
              ? 'bg-card text-foreground shadow-sm font-bold border border-border/60 scale-[1.01]'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
            }`}
        >
          <Camera className="w-4 h-4 text-purple-500" />
          <span>Görseller & Ekli Belgeler</span>
          {(findingPhotos.length + documents.length + allEvidencePhotos.length + allVerificationPhotos.length + allVerificationDocs.length > 0) && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-muted text-foreground tabular-nums font-bold">
              {findingPhotos.length + documents.length + allEvidencePhotos.length + allVerificationPhotos.length + allVerificationDocs.length}
            </span>
          )}
        </button>

        {/* Sekme 4: Bütçe & Maliyet Analizi */}
        <button
          type="button"
          onClick={() => setActiveTab('BUDGET')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === 'BUDGET'
              ? 'bg-card text-foreground shadow-sm font-bold border border-border/60 scale-[1.01]'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
            }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-500" />
          <span>Bütçe ve Maliyet</span>
          {(estBudget !== null || actBudget !== null) && (
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          )}
        </button>
      </div>

      {/* ── 3. SEKME İÇERİKLERİ ────────────────────────────────────────────── */}

      {/* ── SEKME 1: TESPİT & AKSİYON & SÜREÇ ADIMLARI ─────────────────── */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 1. TESPİT BÖLÜMÜ VE BİLGİLERİ (YATAY KART)                          */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="bg-card text-card-foreground border-2 border-amber-500/30 dark:border-amber-500/20 rounded-2xl shadow-sm overflow-hidden">
            {/* Tespit Başlık Bandı */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-500/20 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    1. Tespit Bölümü
                  </h2>
                  <p className="text-[11px] text-muted-foreground">Saha Bulgusu ve Uygunsuzluk Tanımı</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {record.facility && (
                  <Badge variant="outline" className="text-xs font-semibold bg-background/80 border-border">
                    <Building2 className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                    {record.facility.name}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800">
                  {record.category || 'Kategori Belirtilmemiş'}
                </Badge>
              </div>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Saha Parametreleri: 4'lü Yatay Izgara */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 bg-muted/30 border rounded-xl">
                <div className="space-y-1">
                  <span className="text-muted-foreground flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" /> Mahal:
                  </span>
                  <p className="font-bold text-foreground text-sm truncate" title={record.location || '-'}>
                    {record.location || '-'}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground flex items-center gap-1 font-medium">
                    <Wrench className="w-3.5 h-3.5 text-amber-600" /> Ekipman:
                  </span>
                  <p className="font-bold text-foreground text-sm truncate" title={record.equipmentName || record.equipment || '-'}>
                    {record.equipmentNo ? <span className="tabular-nums text-xs px-1.5 py-0.5 rounded bg-muted mr-1">{record.equipmentNo}</span> : ''}
                    {record.equipmentName || record.equipment || '-'}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" /> Tespit Tarihi:
                  </span>
                  <p className="tabular-nums font-bold text-foreground text-sm">
                    {recordDateStr || '-'}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground block font-medium">Risk Skoru:</span>
                  <div>{getRiskBadge(record.riskScore)}</div>
                </div>
              </div>

              {/* Tespit Metni / Uygunsuzluk Açıklaması */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Tespit Metni / Uygunsuzluk Açıklaması:
                </label>
                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl text-foreground text-sm leading-relaxed whitespace-pre-wrap font-sans font-medium">
                  {record.finding}
                </div>
              </div>

              {/* Bulgu Fotoğrafları & Ekli Belgeler (Yatay Alt Izgara) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
                {/* Bulgu Fotoğrafları */}
                <div className="space-y-2 p-3.5 bg-muted/20 border rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-blue-500" />
                      Bulgu Fotoğrafları ({findingPhotos.length}/3):
                    </span>
                    {findingPhotos.length === 0 && (
                      <span className="text-muted-foreground italic text-[11px]">Fotoğraf eklenmemiş</span>
                    )}
                  </div>

                  {findingPhotos.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2.5">
                      {findingPhotos.map((photo, pIdx) => (
                        <div
                          key={pIdx}
                          onClick={() => setLightboxState({ photos: findingPhotos, index: pIdx, title: `Bulgu Fotoğrafı ${pIdx + 1}` })}
                          className="group relative aspect-4/3 rounded-xl overflow-hidden border border-border/80 bg-muted cursor-pointer shadow-2xs hover:shadow-md transition-all hover:border-primary"
                        >
                          <img
                            src={photo.url}
                            alt={photo.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <ZoomIn className="w-5 h-5 drop-shadow" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 border border-dashed rounded-lg text-center text-muted-foreground text-xs">
                      Bu bulguya ait fotoğraf bulunmuyor. "Düzenle" butonundan yükleyebilirsiniz.
                    </div>
                  )}
                </div>

                {/* Ekli Belgeler */}
                <div className="space-y-2 p-3.5 bg-muted/20 border rounded-xl">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-500" />
                    Ekli Belgeler ({documents.length}):
                  </span>
                  {documents.length > 0 ? (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {documents.map((doc, dIdx) => (
                        <div
                          key={dIdx}
                          className="p-2 bg-background border rounded-lg flex items-center justify-between hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <FileText className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            <span className="font-semibold text-foreground truncate text-xs" title={doc.name}>
                              {formatAttachmentName(doc.name)}
                            </span>
                            <span className="text-[10px] text-muted-foreground tabular-nums">({formatBytes(doc.size)})</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-muted-foreground hover:text-foreground rounded"
                              title="Aç"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <a
                              href={doc.url}
                              download={formatAttachmentName(doc.name)}
                              className="p-1 text-muted-foreground hover:text-primary rounded"
                              title="İndir"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 border border-dashed rounded-lg text-center text-muted-foreground text-xs">
                      Ekli doküman bulunmuyor.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 2. AKSİYON BÖLÜMÜ VE BİLGİLERİ (YATAY KART)                         */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="bg-card text-card-foreground border-2 border-primary/30 dark:border-primary/20 rounded-2xl shadow-sm overflow-hidden">

            {/* Aksiyon Başlık Bandı */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/20 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wider text-primary">
                    2. Aksiyon Bölümü
                  </h2>
                  <p className="text-[11px] text-muted-foreground">İş Planı, Saha Keşif Notları ve Giderim Kanıtları</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={openDiscoveryModal}
                  className="text-xs font-semibold gap-1.5 h-8 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                >
                  <FileText className="w-3.5 h-3.5" />
                  {record.discoveryNotes ? 'Keşif Notu Düzenle' : '+ Keşif Notu Ekle'}
                </Button>

                <Button
                  size="sm"
                  onClick={() => setShowActionModal(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold gap-1.5 h-8 shadow-xs"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5" />
                  Aksiyon Güncelle
                </Button>
              </div>
            </div>

            <div className="p-5 space-y-4 text-xs">

              {/* Durum, Sorumlu, Termin ve Canlı Süre 4'lü Izgarası */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 bg-muted/30 border rounded-xl">
                <div className="space-y-1">
                  <span className="text-muted-foreground block font-medium">Güncel Durum:</span>
                  <div>{getStatusBadge(record.status)}</div>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground flex items-center gap-1 font-medium">
                    <User className="w-3.5 h-3.5 text-primary" /> Sorumlusu:
                  </span>
                  <p className="font-bold text-foreground text-sm truncate" title={record.assignedTo || '-'}>
                    {record.assignedTo || <span className="italic text-muted-foreground font-normal">Atanmamış</span>}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-primary" /> Termin Tarihi:
                  </span>
                  <p className="tabular-nums font-bold text-foreground text-sm">
                    {dueDateStr || <span className="italic text-muted-foreground font-normal">Termin Yok</span>}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground block font-medium">Kalan Süre / İlerleme:</span>
                  <div className="flex items-center gap-2">
                    {record.status === 'Tamamlandı' ? (
                      <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-300 font-semibold text-xs">
                        Tamamlandı (%100)
                      </Badge>
                    ) : countdown ? (
                      <Badge className={countdown.isOverdue ? 'bg-red-500/15 text-red-700 border-red-300 font-bold' : 'bg-emerald-500/15 text-emerald-700 border-emerald-300 font-bold'}>
                        {countdown.isOverdue ? `⚠️ ${countdown.days} gün gecikme` : `⏳ Son ${countdown.days} gün`}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground italic font-normal">Süreç Devam Ediyor</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Canlı Termin Geri Sayım Sayacı (Eğer aktifse) */}
              {countdown && (
                <div className={`p-3 rounded-xl border transition-all shadow-2xs ${countdown.isOverdue
                    ? 'bg-red-500/10 border-red-300 dark:border-red-900/60 text-red-700 dark:text-red-400'
                    : countdown.days <= 7
                      ? 'bg-amber-500/10 border-amber-300 dark:border-amber-900/60 text-amber-700 dark:text-amber-400'
                      : 'bg-emerald-500/10 border-emerald-300 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400'
                  }`}>
                  <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${countdown.isOverdue ? 'bg-red-500' : 'bg-emerald-500'
                          }`} />
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${countdown.isOverdue ? 'bg-red-600' : 'bg-emerald-600'
                          }`} />
                      </span>
                      <span className="text-[11px] font-black uppercase tracking-wider">
                        {countdown.isOverdue ? 'Termin Tarihi Aşıldı' : 'Kalan Canlı Süre'}
                      </span>
                    </div>
                    <span className="text-[10px] tabular-nums px-2 py-0.5 rounded-full bg-background/80 border">
                      Hedef Termin: {dueDateStr}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-background/90 border">
                    <div className="flex items-center gap-1.5 tabular-nums text-xs font-black text-foreground">
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary">{countdown.days} Gün</span>
                      <span>:</span>
                      <span className="px-2 py-0.5 rounded bg-muted">{String(countdown.hours).padStart(2, '0')} Saat</span>
                      <span>:</span>
                      <span className="px-2 py-0.5 rounded bg-muted">{String(countdown.minutes).padStart(2, '0')} Dk</span>
                      <span>:</span>
                      <span className="px-2 py-0.5 rounded bg-muted animate-pulse">{String(countdown.seconds).padStart(2, '0')} Sn</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium hidden sm:inline">
                      {countdown.isOverdue ? `⚠️ ${countdown.days} gün gecikme var` : `⏳ Kalan net çalışma süresi`}
                    </span>
                  </div>
                </div>
              )}

              {/* 2 Sütunlu Aksiyon & Keşif İçerik Izgarası */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* SOL SÜTUN: İş Planı & Güncel Aksiyon Açıklaması */}
                <div className="space-y-4">
                  {/* Planlanan İş Planı */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground block">
                      Planlanan Faaliyet (İş Planı):
                    </label>
                    <div className="p-3.5 bg-muted/30 border rounded-xl text-foreground text-xs leading-relaxed whitespace-pre-wrap min-h-[72px]">
                      {record.actionPlan || <span className="text-muted-foreground italic">Henüz bir iş planı belirtilmemiş.</span>}
                    </div>
                  </div>

                  {/* Güncel Aksiyon Açıklaması */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-primary block">
                      Güncel Durum & Alınan Aksiyon Açıklaması:
                    </label>
                    <div className="p-3.5 bg-primary/10 border border-primary/25 rounded-xl text-foreground text-sm leading-relaxed whitespace-pre-wrap font-medium min-h-[88px]">
                      {record.currentNote || <span className="text-muted-foreground italic font-normal text-xs">Henüz sahadan aksiyon notu girilmemiş. "Aksiyon Güncelle" butonundan not ekleyebilirsiniz.</span>}
                    </div>
                  </div>
                </div>

                {/* SAĞ SÜTUN: Yapılan Saha Keşif Notları & Teknik Müdür Değerlendirmesi */}
                <div className="space-y-4">
                  {/* 🔍 Yapılan Saha Keşif Notları (Aksiyon Bölümüne Taşındı) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-amber-600" />
                        Yapılan Saha Keşif Notları:
                      </label>
                      <button
                        type="button"
                        onClick={openDiscoveryModal}
                        className="text-[11px] text-amber-700 dark:text-amber-400 hover:underline font-bold flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        {record.discoveryNotes ? 'Düzenle' : '+ Keşif Notu Ekle'}
                      </button>
                    </div>
                    {record.discoveryNotes ? (
                      <div className="p-3.5 bg-amber-500/5 border border-amber-500/25 rounded-xl text-foreground text-xs leading-relaxed whitespace-pre-wrap font-medium min-h-[72px]">
                        {record.discoveryNotes}
                      </div>
                    ) : (
                      <div className="p-3 bg-muted/20 border border-dashed rounded-xl text-muted-foreground text-xs flex items-center justify-between min-h-[72px]">
                        <span className="italic">Henüz saha keşif notu girilmemiş.</span>
                        <Button variant="ghost" size="sm" onClick={openDiscoveryModal} className="h-7 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30">
                          + Not Ekle
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* 🛠️ Teknik Hizmetler Açıklaması (Teknik Müdür Değerlendirmesi) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-blue-600" />
                        Teknik Hizmetler Açıklaması (Teknik Müdür Değerlendirmesi):
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowEditModal(true)}
                        className="text-[11px] text-primary hover:text-primary/80 font-semibold"
                      >
                        {record.technicalManagerDesc ? 'Düzenle' : '+ Değerlendirme Ekle'}
                      </button>
                    </div>
                    {record.technicalManagerDesc ? (
                      <div className="p-3.5 bg-blue-500/5 border border-blue-500/25 rounded-xl text-foreground text-xs leading-relaxed whitespace-pre-wrap font-medium min-h-[88px]">
                        {record.technicalManagerDesc}
                      </div>
                    ) : (
                      <div className="p-3 bg-muted/20 border border-dashed rounded-xl text-muted-foreground text-xs flex items-center justify-between min-h-[88px]">
                        <span className="italic">Henüz teknik hizmetler değerlendirmesi girilmemiş.</span>
                        <Button variant="ghost" size="sm" onClick={() => setShowEditModal(true)} className="h-7 text-xs font-medium">
                          Açıklama Ekle
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Alt Izgara: Aksiyon Kanıt Fotoğrafları & Bütçe */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t">
                {/* Aksiyon Kanıt Fotoğrafları */}
                <div className="space-y-2 p-3.5 bg-muted/20 border rounded-xl">
                  <span className="font-bold text-foreground block">
                    Aksiyon Kanıt Fotoğrafları ({allEvidencePhotos.length}):
                  </span>
                  {allEvidencePhotos.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2.5">
                      {allEvidencePhotos.slice(0, 3).map((item, pIdx) => (
                        <div
                          key={pIdx}
                          onClick={() => setLightboxState({ photos: allEvidencePhotos.map(x => x.photo), index: pIdx, title: `Aksiyon Kanıtı ${pIdx + 1}` })}
                          className="group relative aspect-4/3 rounded-xl overflow-hidden border border-border/80 bg-muted cursor-pointer shadow-2xs hover:shadow-md transition-all hover:border-primary"
                        >
                          <img
                            src={item.photo.url}
                            alt={item.photo.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <ZoomIn className="w-5 h-5 drop-shadow" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 border border-dashed rounded-lg text-center text-muted-foreground text-xs">
                      Aksiyon adımı kanıt fotoğrafı eklenmemiş. "Aksiyon Güncelle" butonundan ekleyebilirsiniz.
                    </div>
                  )}
                </div>

                {/* Bütçe Mini Özet */}
                <div className="p-3.5 bg-muted/20 border rounded-xl flex flex-col justify-between">
                  <span className="font-bold text-foreground block mb-1">
                    Bütçe ve Maliyet Durumu:
                  </span>
                  {(estBudget !== null || actBudget !== null) ? (
                    <div className="flex items-center justify-between pt-1">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                          <span>Tahmini / Gerçekleşen</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 tabular-nums">
                            {record.currency || 'TRY'}
                          </Badge>
                        </div>
                        <span className="tabular-nums font-bold text-foreground text-sm">
                          {formatCurrency(estBudget, record.currency)} / {formatCurrency(actBudget, record.currency)}
                        </span>
                      </div>
                      {budgetVariance !== null && (
                        <Badge className={budgetVariance > 0 ? 'bg-red-500/15 text-red-700 border-red-300' : 'bg-emerald-500/15 text-emerald-700 border-emerald-300'}>
                          {budgetVariance > 0 ? `+${formatCurrency(budgetVariance, record.currency)} Aşım` : `${formatCurrency(Math.abs(budgetVariance), record.currency)} Tasarruf`}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 border border-dashed rounded-lg text-center text-muted-foreground text-xs">
                      Bütçe tahmini veya gerçekleşen maliyet girilmemiş.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 3. SÜREÇ & AKSİYON ADIMLARI (STEP-BY-STEP MİLESTONE TRACKER)       */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="bg-card text-card-foreground border-2 border-indigo-500/25 dark:border-indigo-500/20 rounded-2xl shadow-sm overflow-hidden">

            {/* 3. Bölüm Başlık Bandı */}
            <div className="px-5 py-4 bg-gradient-to-r from-indigo-500/10 via-indigo-500/5 to-transparent border-b border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                      3. Süreç ve Aksiyon Adımları
                    </h2>
                    <Badge variant="outline" className="text-xs bg-indigo-500/10 text-indigo-600 border-indigo-300 dark:border-indigo-800 font-bold">
                      Step-by-Step Takip
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Talepten tamamlanmaya kadar sahada gerçekleşen tüm süreç adımları, girilen parametreler ve kanıtlar akordiyon yapısıyla listelenir.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs tabular-nums font-bold">
                  {actionHistories.length > 0 ? `${actionHistories.length} Adım Gerçekleştirildi` : 'Henüz Adım Yok'}
                </Badge>
                {actionHistories.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={toggleAllSteps}
                    className="h-8 text-xs font-semibold gap-1.5 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                  >
                    {allExpanded === true ? (
                      <>
                        <ChevronsUp className="w-3.5 h-3.5" />
                        Tümünü Daralt
                      </>
                    ) : (
                      <>
                        <ChevronsDown className="w-3.5 h-3.5" />
                        Tümünü Genişlet
                      </>
                    )}
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => setShowActionModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1.5 h-8 shadow-xs"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5" />
                  + Yeni Adım / Aksiyon Ekle
                </Button>
              </div>
            </div>

            {/* 3. Bölüm İçerik Alanı */}
            <div className="p-5 sm:p-6">
              {actionHistories.length === 0 ? (
                <div className="py-12 px-4 text-center border-2 border-dashed border-border/80 rounded-2xl bg-muted/20 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 mx-auto flex items-center justify-center">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h4 className="text-sm font-bold text-foreground">Henüz Bir Süreç Adımı Girilmemiş</h4>
                    <p className="text-xs text-muted-foreground">
                      Bu bulguya ait satınalma talebi, ihale süreci, sipariş verme veya saha çalışması gibi adımları kaydetmek için ilk aksiyonu girin.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setShowActionModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1.5"
                  >
                    <MessageSquarePlus className="w-4 h-4" />
                    İlk Aksiyon Adımını Gir
                  </Button>
                </div>
              ) : (
                <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-indigo-500/20">
                  {/* En son girilen adım en üstte (en yeni başta ve varsayılan olarak açık) */}
                  {actionHistories.map((h, sIdx) => {
                    const stepNum = actionHistories.length - sIdx;
                    const isLatest = sIdx === 0;
                    const isStepOpen = allExpanded !== null
                      ? allExpanded
                      : (expandedSteps[h.id] !== undefined ? expandedSteps[h.id] : isLatest);
                    const evPhotos: ImprovementFileAttachment[] = Array.isArray(h.evidencePhotos) ? h.evidencePhotos : [];
                    const evDocs: ImprovementFileAttachment[] = Array.isArray(h.documents) ? h.documents : [];

                    return (
                      <div key={h.id} className="relative group">

                        {/* Sol Adım Rozeti / Daire (Tıklanabilir) */}
                        <div
                          onClick={() => toggleStep(h.id, isStepOpen)}
                          className={`absolute -left-6 sm:-left-8 top-3 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center text-xs font-black shadow-xs cursor-pointer transition-all group-hover:scale-110 z-10 ${isLatest
                              ? 'bg-indigo-600 border-white dark:border-card text-white ring-4 ring-indigo-500/20'
                              : isStepOpen
                                ? 'bg-indigo-100 dark:bg-indigo-950 border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                                : 'bg-card border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:border-indigo-500'
                            }`}
                          title={isStepOpen ? 'Adımı Kapat' : 'Adımı Aç'}
                        >
                          {stepNum}
                        </div>

                        {/* Adım Kartı (Akordiyon) */}
                        <div className={`rounded-2xl border transition-all shadow-2xs overflow-hidden ${isLatest
                            ? 'bg-card border-indigo-500/40 dark:border-indigo-500/30 ring-1 ring-indigo-500/15'
                            : isStepOpen
                              ? 'bg-card border-border shadow-xs'
                              : 'bg-card/70 border-border/80 hover:border-indigo-300 dark:hover:border-indigo-800'
                          }`}>

                          {/* Tıklanabilir Akordiyon Başlık Satırı */}
                          <div
                            onClick={() => toggleStep(h.id, isStepOpen)}
                            className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer select-none transition-colors ${isStepOpen
                                ? 'bg-muted/20 hover:bg-muted/30 border-b border-border/60'
                                : 'hover:bg-muted/40'
                              }`}
                          >
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="text-xs sm:text-sm font-black text-foreground flex items-center gap-2">
                                <span className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isStepOpen
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                  }`}>
                                  {getStepIcon(h.stepType)}
                                </span>
                                <span>Adım {stepNum}: {h.stepTitle || 'Aksiyon Girişi'}</span>
                              </span>

                              {isLatest && record.status !== 'Tamamlandı' && (
                                <Badge className="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-800 text-[10px] font-bold">
                                  Güncel Aşama
                                </Badge>
                              )}

                              {h.newStatus && (
                                <Badge variant="outline" className="text-[10px] font-medium tabular-nums">
                                  {h.previousStatus && h.previousStatus !== h.newStatus ? `${h.previousStatus} ➔ ${h.newStatus}` : h.newStatus}
                                </Badge>
                              )}

                              {h.progressAdded !== undefined && h.progressAdded !== null && h.progressAdded > 0 && (
                                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[10px] font-bold">
                                  +{h.progressAdded}% İlerleme
                                </Badge>
                              )}

                              {h.progress !== undefined && h.progress !== null && (
                                <Badge variant="outline" className="text-[10px] tabular-nums font-bold bg-primary/10 text-primary border-primary/20">
                                  Toplam %{h.progress}
                                </Badge>
                              )}

                              {/* Fotoğraf ve Belge Sayacı Rozetleri */}
                              {evPhotos.length > 0 && (
                                <span className="inline-flex items-center gap-1 text-[10px] tabular-nums font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/50">
                                  <Camera className="w-3 h-3 text-blue-500" /> {evPhotos.length}
                                </span>
                              )}

                              {evDocs.length > 0 && (
                                <span className="inline-flex items-center gap-1 text-[10px] tabular-nums font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/50">
                                  <FileText className="w-3 h-3 text-red-500" /> {evDocs.length}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 text-[11px] text-muted-foreground font-medium shrink-0">
                              <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1 text-foreground font-semibold">
                                  <User className="w-3.5 h-3.5 text-primary" />
                                  {h.changedByName || h.changedBy}
                                </span>
                                <span>•</span>
                                <span className="tabular-nums text-xs">
                                  {new Date(h.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>

                              {/* Hızlı Düzenle & Sil Butonları */}
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingHistory(h);
                                  }}
                                  title="Aksiyon Adımını Düzenle"
                                  className="p-1.5 rounded-lg text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingHistory(h);
                                  }}
                                  title="Aksiyon Adımını Sil"
                                  className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all duration-200 ${isStepOpen
                                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-800 rotate-180'
                                  : 'bg-muted/40 text-muted-foreground border-border/70 hover:bg-muted'
                                }`}>
                                <ChevronDown className="w-4 h-4" />
                              </div>
                            </div>
                          </div>

                          {/* Kapalıyken Hızlı Özet Alanı (Parametreler & Tek Satır Not) */}
                          {!isStepOpen && (
                            <div
                              onClick={() => toggleStep(h.id, isStepOpen)}
                              className="px-4 pb-3 pt-0.5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {h.stepFields && Object.keys(h.stepFields).length > 0 && (
                                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                                    {Object.entries(h.stepFields).slice(0, 2).map(([k, v]) => (
                                      <span key={k} className="px-1.5 py-0.5 rounded bg-muted/60 text-[10px] tabular-nums border text-foreground font-semibold">
                                        {formatFieldLabel(k)}: {String(v)}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <p className="line-clamp-1 italic text-[11px] truncate text-foreground/80">
                                  {h.newNote || 'Açıklama girilmemiş.'}
                                </p>
                              </div>
                              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold shrink-0">
                                Detayları Göster ▾
                              </span>
                            </div>
                          )}

                          {/* AÇIK İÇERİK (Tüm Detaylar, Alanlar, Fotoğraflar ve Belgeler) */}
                          {isStepOpen && (
                            <div className="p-4 sm:p-5 space-y-3.5 animate-in fade-in-50 duration-150">
                              {/* Dinamik Alan Rozetleri (Talep No, Firma, İhale Tarihi vb.) */}
                              {h.stepFields && Object.keys(h.stepFields).length > 0 && (
                                <div className="flex items-center gap-2 flex-wrap">
                                  {Object.entries(h.stepFields).map(([k, v]) => {
                                    if (!v) return null;
                                    return (
                                      <div key={k} className="px-2.5 py-1 rounded-lg bg-muted/60 border text-[11px] flex items-center gap-1.5 tabular-nums shadow-2xs">
                                        <span className="text-muted-foreground uppercase text-[10px] font-sans font-semibold">
                                          {formatFieldLabel(k)}:
                                        </span>
                                        <span className="font-bold text-foreground">
                                          {String(v)}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Aksiyon Açıklama Metni */}
                              <div className="p-3.5 bg-muted/30 border rounded-xl text-foreground text-xs leading-relaxed whitespace-pre-wrap font-medium">
                                {h.newNote}
                              </div>

                              {/* Adıma Ait Kanıt Fotoğrafları */}
                              {evPhotos.length > 0 && (
                                <div className="space-y-2 pt-1 border-t border-border/50">
                                  <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                                    <Camera className="w-3.5 h-3.5 text-blue-500" />
                                    Adım Kanıt Fotoğrafları ({evPhotos.length}):
                                  </span>
                                  <div className="flex items-center gap-2.5 flex-wrap">
                                    {evPhotos.map((photo, pIdx) => (
                                      <div
                                        key={pIdx}
                                        onClick={() => setLightboxState({ photos: evPhotos, index: pIdx, title: `Adım ${stepNum} Kanıt Fotoğrafı` })}
                                        className="group relative w-20 h-20 rounded-xl overflow-hidden border border-border bg-muted cursor-pointer shadow-2xs hover:shadow-md transition-all hover:border-primary"
                                      >
                                        <img
                                          src={photo.url}
                                          alt={photo.name}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                          <ZoomIn className="w-4 h-4" />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Adıma Ait Dokümanlar / PDF */}
                              {evDocs.length > 0 && (
                                <div className="space-y-2 pt-1 border-t border-border/50">
                                  <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-red-500" />
                                    Ekli Belgeler & Sözleşme / Tutanak ({evDocs.length}):
                                  </span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {evDocs.map((doc, dIdx) => (
                                      <div
                                        key={dIdx}
                                        className="p-2.5 bg-muted/40 border rounded-xl flex items-center justify-between gap-2 hover:bg-muted/70 transition-colors"
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <FileText className="w-4 h-4 text-red-500 shrink-0" />
                                          <div className="min-w-0">
                                            <span className="font-semibold text-foreground text-xs block truncate" title={doc.name}>
                                              {formatAttachmentName(doc.name)}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground tabular-nums">
                                              ({formatBytes(doc.size)})
                                            </span>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                          <a
                                            href={doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted"
                                            title="Aç"
                                          >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                          </a>
                                          <a
                                            href={doc.url}
                                            download={formatAttachmentName(doc.name)}
                                            className="p-1.5 text-muted-foreground hover:text-primary rounded-md hover:bg-muted"
                                            title="İndir"
                                          >
                                            <Download className="w-3.5 h-3.5" />
                                          </a>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Adım Alt Aksiyon Çubuğu (Düzenle & Sil) */}
                              <div className="pt-2.5 mt-2 border-t border-border/50 flex items-center justify-between gap-2 text-xs">
                                <span className="text-[11px] text-muted-foreground">
                                  Adım ID: <code className="tabular-nums text-foreground font-semibold">{h.id.slice(0, 8)}</code> • {new Date(h.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingHistory(h)}
                                    className="h-7 text-xs px-2.5 gap-1.5 border-border hover:border-indigo-500 hover:text-indigo-600 font-semibold"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                                    Adımı Düzenle
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDeletingHistory(h)}
                                    className="h-7 text-xs px-2.5 gap-1.5 border-border hover:border-red-500 hover:text-red-600 font-semibold"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                    Adımı Sil
                                  </Button>
                                </div>
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

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 4. DOĞRULAMA BÖLÜMÜ (SADECE DOĞRULAMA YETKİLİLERİ GİREBİLİR)        */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="bg-card text-card-foreground border-2 border-teal-500/30 dark:border-teal-500/20 rounded-2xl shadow-sm overflow-hidden">
            {/* 4. Bölüm Başlık Bandı */}
            <div className="px-5 py-4 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent border-b border-teal-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm font-black uppercase tracking-wider text-teal-700 dark:text-teal-400">
                      4. Doğrulama Bölümü
                    </h2>
                    {getVerificationBadge(record.verificationStatus)}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Yapılan aksiyonların kontrolü, yerinde doğrulama görselleri/dokümanları ve kapanış teyidi (Mevcut durumu &quot;Tamamlandı&quot; olsa bile doğrulanabilir).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {verifications.length > 0 && (
                  <Badge variant="secondary" className="text-xs tabular-nums font-bold">
                    {verifications.length} Doğrulama Kaydı
                  </Badge>
                )}

                {canVerify ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingVerification(null);
                      setShowVerificationModal(true);
                    }}
                    className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold gap-1.5 h-8 shadow-xs"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {verifications.length > 0 ? '+ Yeni Doğrulama Ekle' : '+ Doğrulama Gir'}
                  </Button>
                ) : (
                  <Badge variant="outline" className="text-[11px] px-2.5 py-1 bg-muted/60 text-muted-foreground border-border flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    Sadece Doğrulama Yetkilileri Girebilir
                  </Badge>
                )}
              </div>
            </div>

            {/* 4. Bölüm İçerik Alanı */}
            <div className="p-5 sm:p-6">
              {verifications.length === 0 ? (
                <div className="py-10 px-4 text-center border-2 border-dashed border-teal-500/25 rounded-2xl bg-teal-500/5 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400 mx-auto flex items-center justify-center">
                    {canVerify ? <ShieldCheck className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h4 className="text-sm font-bold text-foreground">
                      Henüz Doğrulama Kontrolü Yapılmamış
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {canVerify
                        ? 'Yapılan aksiyonları kontrol edip doğrulama değerlendirmesi, kanıt fotoğrafı ve doküman yükleyerek bu bulguyu doğrulayabilirsiniz.'
                        : 'Bu alana yalnızca Doğrulama Yetkisi tanımlanan kişiler veri girişi yapabilir. Doğrulama tamamlandığında sonuçlar burada görüntülenecektir.'}
                    </p>
                  </div>
                  {canVerify && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingVerification(null);
                        setShowVerificationModal(true);
                      }}
                      className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      İlk Doğrulamayı Gir
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {verifications.map((ver, vIdx) => {
                    const verPhotos: ImprovementFileAttachment[] = Array.isArray(ver.photos) ? ver.photos : [];
                    const verDocs: ImprovementFileAttachment[] = Array.isArray(ver.documents) ? ver.documents : [];
                    const verChecked = Array.isArray(ver.checkedActions) ? ver.checkedActions : [];
                    const checkedOnly = verChecked.filter((c) => c.checked);
                    const verNumber = verifications.length - vIdx;

                    return (
                      <div
                        key={ver.id}
                        className={`rounded-2xl border p-4 sm:p-5 space-y-3.5 transition-all ${ver.result === 'DOGRULANDI'
                            ? 'bg-emerald-500/5 border-emerald-500/30'
                            : ver.result === 'KISMI'
                              ? 'bg-amber-500/5 border-amber-500/30'
                              : 'bg-red-500/5 border-red-500/30'
                          }`}
                      >
                        {/* Üst Satır: Doğrulama Sonucu, Doğrulayan Kişi, Tarih ve İşlemler */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-border/60">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black px-2 py-0.5 rounded-md bg-teal-500/15 text-teal-700 dark:text-teal-300 tabular-nums">
                              Doğrulama #{verNumber}
                            </span>
                            {getVerificationBadge(ver.result)}
                            {vIdx === 0 && (
                              <Badge variant="outline" className="text-[10px] font-bold bg-background">
                                Güncel Doğrulama
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1 font-semibold text-foreground">
                              <User className="w-3.5 h-3.5 text-teal-600" />
                              {ver.verifiedByName || ver.verifiedBy}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 tabular-nums">
                              <Calendar className="w-3.5 h-3.5 text-teal-600" />
                              {new Date(ver.verificationDate).toLocaleDateString('tr-TR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </span>

                            {canVerify && (
                              <div className="flex items-center gap-1 ml-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingVerification(ver);
                                    setShowVerificationModal(true);
                                  }}
                                  title="Doğrulamayı Düzenle"
                                  className="p-1.5 rounded-lg text-muted-foreground hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={deletingVerificationId === ver.id}
                                  onClick={() => handleDeleteVerification(ver.id)}
                                  title="Doğrulamayı Sil"
                                  className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Kontrol Edilen Aksiyonlar (Tam Metin) */}
                        {verChecked.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                              <ClipboardCheck className="w-3.5 h-3.5 text-teal-600" />
                              Kontrol Edilen Aksiyonlar ({checkedOnly.length}/{verChecked.length}):
                            </span>
                            <div className="space-y-1.5">
                              {verChecked.map((act, aIdx) => (
                                <div
                                  key={act.id || aIdx}
                                  className={`flex items-start gap-2 px-3 py-2 rounded-xl border text-xs leading-relaxed ${act.checked
                                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                                      : 'bg-muted/40 border-border text-muted-foreground line-through opacity-75'
                                    }`}
                                >
                                  <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${act.checked ? 'text-emerald-600' : 'opacity-40'}`} />
                                  <span className="whitespace-pre-wrap break-words font-medium">{act.title}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Değerlendirme Notu */}
                        <div className="p-3.5 bg-background/90 border rounded-xl text-foreground text-xs leading-relaxed whitespace-pre-wrap font-medium">
                          {ver.notes}
                        </div>

                        {/* Doğrulama Fotoğrafları */}
                        {verPhotos.length > 0 && (
                          <div className="space-y-2 pt-1 border-t border-border/50">
                            <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                              <Camera className="w-3.5 h-3.5 text-teal-600" />
                              Doğrulama Kanıt Fotoğrafları ({verPhotos.length}):
                            </span>
                            <div className="flex items-center gap-2.5 flex-wrap">
                              {verPhotos.map((photo, pIdx) => (
                                <div
                                  key={pIdx}
                                  onClick={() =>
                                    setLightboxState({
                                      photos: verPhotos,
                                      index: pIdx,
                                      title: `Doğrulama #${verNumber} Kanıt Fotoğrafı`,
                                    })
                                  }
                                  className="group relative w-24 h-24 rounded-xl overflow-hidden border border-border bg-muted cursor-pointer shadow-2xs hover:shadow-md transition-all hover:border-teal-500"
                                >
                                  <img
                                    src={photo.url}
                                    alt={photo.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                    <ZoomIn className="w-4 h-4" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Doğrulama Dokümanları */}
                        {verDocs.length > 0 && (
                          <div className="space-y-2 pt-1 border-t border-border/50">
                            <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-red-500" />
                              Doğrulama Dokümanları ({verDocs.length}):
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {verDocs.map((doc, dIdx) => (
                                <div
                                  key={dIdx}
                                  className="p-2.5 bg-background border rounded-xl flex items-center justify-between gap-2 hover:bg-muted/50 transition-colors"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <FileText className="w-4 h-4 text-red-500 shrink-0" />
                                    <div className="min-w-0">
                                      <span className="font-semibold text-foreground text-xs block truncate" title={doc.name}>
                                        {formatAttachmentName(doc.name)}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground tabular-nums">
                                        ({formatBytes(doc.size)})
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <a
                                      href={doc.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted"
                                      title="Aç"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                    <a
                                      href={doc.url}
                                      download={formatAttachmentName(doc.name)}
                                      className="p-1.5 text-muted-foreground hover:text-primary rounded-md hover:bg-muted"
                                      title="İndir"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ── SEKME 2: İŞLEM GEÇMİŞİ & DENETİM İZİ (LOGLAMA) ────────────────── */}
      {activeTab === 'HISTORY' && (
        <div className="bg-card text-card-foreground border rounded-2xl shadow-sm overflow-hidden p-6 space-y-6 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                İşlem Geçmişi & Denetim İzi (Log Kayıtları)
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Kim ne zaman tespit etti, kim aksiyon notu girdi ve durumlar nasıl değişti adım adım listelenmektedir.
              </p>
            </div>
            <Badge variant="outline" className="tabular-nums text-xs">
              Toplam {histories.length + 1} Hareket
            </Badge>
          </div>

          <div className="relative pl-8 space-y-8 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border">

            {/* 1. Aksiyon Girişleri (En güncel en üstte) */}
            {histories.map((h, hIdx) => {
              const evPhotos: ImprovementFileAttachment[] = Array.isArray(h.evidencePhotos) ? h.evidencePhotos : [];
              return (
                <div key={h.id || hIdx} className="relative space-y-2 group">
                  {/* Çember İşaretçi */}
                  <div className="absolute -left-8 top-1 w-4 h-4 rounded-full border-2 border-background bg-primary ring-4 ring-primary/15 transition-transform group-hover:scale-125" />

                  <div className="p-4 bg-muted/20 border border-border/70 rounded-xl space-y-2.5 hover:bg-muted/30 transition-colors shadow-2xs">
                    <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                          {(h.changedByName || h.changedBy || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-foreground text-sm">
                            {h.changedByName || h.changedBy || 'Yetkili Kullanıcı'}
                          </span>
                          <Badge variant="outline" className="text-[11px] font-semibold bg-primary/10 text-primary border-primary/20">
                            {h.stepTitle || (
                              h.stepType === 'DUZENLEME' ? 'Bulgu ve Aksiyon Güncellendi' :
                                h.stepType === 'DURUM_DEGISIKLIGI' ? 'Durum Değişikliği' :
                                  h.stepType === 'KESIF_NOTU' ? 'Saha Keşif Notu Kaydı' :
                                    'Aksiyon Adımı'
                            )}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] tabular-nums text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(h.createdAt).toLocaleString('tr-TR')}</span>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            type="button"
                            onClick={() => setEditingHistory(h)}
                            title="Aksiyonu Düzenle"
                            className="p-1 rounded-md text-muted-foreground hover:text-indigo-600 hover:bg-muted transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingHistory(h)}
                            title="Aksiyonu Sil"
                            className="p-1 rounded-md text-muted-foreground hover:text-red-600 hover:bg-muted transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Yapılan İşlemler / Alan Değişiklikleri Detay Rozetleri */}
                    {h.stepFields?.changes && Array.isArray(h.stepFields.changes) && h.stepFields.changes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {h.stepFields.changes.map((changeText: string, cIdx: number) => (
                          <span
                            key={cIdx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-background text-foreground border border-border shadow-2xs"
                          >
                            <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                            {changeText}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Durum Değişimi Varsa */}
                    <div className="flex items-center gap-2 flex-wrap pt-0.5">
                      {h.newStatus && h.previousStatus && h.newStatus !== h.previousStatus && (
                        <div className="inline-flex items-center gap-2 text-xs bg-background p-1.5 px-3 rounded-lg border font-medium">
                          <span className="text-muted-foreground">Eski Durum: <strong className="text-foreground">{h.previousStatus}</strong></span>
                          <span className="text-primary font-bold">→</span>
                          <span className="text-emerald-600 font-bold">Yeni Durum: {h.newStatus}</span>
                        </div>
                      )}

                      {h.progress !== null && h.progress !== undefined && (
                        <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 tabular-nums">
                          İlerleme: %{h.progress} {h.progressAdded ? `(+%${h.progressAdded})` : ''}
                        </span>
                      )}
                    </div>

                    {/* Aksiyon Notu */}
                    {h.newNote && (
                      <div className="p-3 bg-background/90 rounded-lg border border-border/50 text-xs text-foreground whitespace-pre-wrap leading-relaxed font-sans">
                        {h.newNote}
                      </div>
                    )}

                    {/* Bu Adımda Yüklenen Kanıt Fotoğrafları */}
                    {evPhotos.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-semibold text-muted-foreground block flex items-center gap-1">
                          <Camera className="w-3.5 h-3.5 text-blue-500" />
                          Eklenen Kanıt Fotoğrafları ({evPhotos.length}):
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {evPhotos.map((p, pIdx) => (
                            <div
                              key={pIdx}
                              onClick={() => setLightboxState({ photos: evPhotos, index: pIdx, title: `Aksiyon Kanıtı - ${new Date(h.createdAt).toLocaleDateString('tr-TR')}` })}
                              className="w-16 h-16 rounded-lg overflow-hidden border border-border cursor-pointer hover:border-primary transition-all relative group shadow-2xs"
                            >
                              <img src={p.url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <ZoomIn className="w-4 h-4" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bu Adımda Yüklenen Dokümanlar */}
                    {Array.isArray(h.documents) && h.documents.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-red-500" />
                          Eklenen Belgeler ({h.documents.length}):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {h.documents.map((doc, dIdx) => (
                            <div key={dIdx} className="p-2 bg-background border rounded-lg flex items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                <span className="font-semibold text-foreground truncate block" title={doc.name}>
                                  {formatAttachmentName(doc.name)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-1 text-muted-foreground hover:text-foreground">
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                                <a href={doc.url} download={formatAttachmentName(doc.name)} className="p-1 text-muted-foreground hover:text-primary">
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* 2. İlk Bulgu Oluşturma Hareketi */}
            <div className="relative space-y-2 group">
              <div className="absolute -left-8 top-1 w-4 h-4 rounded-full border-2 border-background bg-slate-400 ring-4 ring-slate-400/15" />

              <div className="p-4 bg-muted/10 border border-border/50 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs">
                      {(record.createdByName || record.createdBy || 'S').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-foreground text-sm">
                        {record.createdByName || record.createdBy || 'Sistem / İçe Aktarım'}
                      </span>
                      <span className="text-muted-foreground text-xs ml-1.5 font-medium">ilk tespiti sisteme kaydetti</span>
                    </div>
                  </div>

                  <span className="tabular-nums text-[11px] text-muted-foreground">
                    {new Date(record.createdAt).toLocaleString('tr-TR')}
                  </span>
                </div>

                <div className="p-3 bg-background rounded-lg border border-border/50 text-xs text-foreground">
                  <p className="font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-500" />
                    İlk Kaydedilen Bulgu / Uygunsuzluk:
                  </p>
                  <p className="whitespace-pre-wrap leading-relaxed">{record.finding}</p>
                </div>

                <p className="text-muted-foreground italic pt-0.5">
                  Kaynak Dosya: <strong>{record.sourceFileName || 'Excel İçe Aktarımı'}</strong> ({getSheetLabel(record.sheetType)})
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── SEKME 3: GÖRSELLER & BELGELER (TAM MEDYA MERKEZİ) ─────────────── */}
      {activeTab === 'MEDIA' && (
        <div className="bg-card text-card-foreground border rounded-2xl shadow-sm overflow-hidden p-6 space-y-6 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                Medya ve Ekler Havuzu
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Bulguya ve aksiyonlara ait tüm optimize WebP fotoğrafları ve PDF dokümanları.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowEditModal(true)} className="gap-1.5 text-xs font-semibold">
              <Camera className="w-3.5 h-3.5" />
              Medya Ekle
            </Button>
          </div>

          {/* Bulgu Fotoğrafları Bölümü */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-500" />
              Bulgu / Tespit Fotoğrafları ({findingPhotos.length}/3)
            </h3>
            {findingPhotos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {findingPhotos.map((photo, pIdx) => (
                  <div
                    key={pIdx}
                    onClick={() => setLightboxState({ photos: findingPhotos, index: pIdx, title: `Bulgu Fotoğrafı ${pIdx + 1}` })}
                    className="group relative aspect-4/3 rounded-xl overflow-hidden border border-border bg-muted cursor-pointer shadow-xs hover:shadow-lg transition-all hover:border-primary"
                  >
                    <img src={photo.url} alt={photo.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 text-white">
                      <span className="text-[10px] truncate">{photo.name}</span>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="bg-black/60 px-1.5 py-0.5 rounded tabular-nums">{formatBytes(photo.size)}</span>
                        <ZoomIn className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 border border-dashed rounded-xl text-center text-xs text-muted-foreground">
                Bulgu fotoğrafı bulunmuyor.
              </div>
            )}
          </div>

          {/* Aksiyon Kanıt Fotoğrafları Bölümü */}
          <div className="space-y-3 pt-4 border-t">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Aksiyon & Giderim Kanıt Fotoğrafları ({allEvidencePhotos.length})
            </h3>
            {allEvidencePhotos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {allEvidencePhotos.map((item, pIdx) => (
                  <div
                    key={pIdx}
                    onClick={() => setLightboxState({ photos: allEvidencePhotos.map(x => x.photo), index: pIdx, title: `Aksiyon Kanıtı - ${new Date(item.historyItem.createdAt).toLocaleDateString('tr-TR')}` })}
                    className="group relative aspect-4/3 rounded-xl overflow-hidden border border-border bg-muted cursor-pointer shadow-xs hover:shadow-lg transition-all hover:border-primary"
                  >
                    <img src={item.photo.url} alt={item.photo.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 text-white">
                      <span className="text-[10px] truncate">{item.photo.name}</span>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="bg-black/60 px-1.5 py-0.5 rounded tabular-nums">{formatBytes(item.photo.size)}</span>
                        <ZoomIn className="w-4 h-4 text-emerald-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 border border-dashed rounded-xl text-center text-xs text-muted-foreground">
                Henüz aksiyon kanıt fotoğrafı eklenmemiş.
              </div>
            )}
          </div>

          {/* PDF ve Dokümanlar Bölümü */}
          <div className="space-y-3 pt-4 border-t">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              Ekli Dokümanlar ve Teknik Föyler ({documents.length})
            </h3>
            {documents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {documents.map((doc, dIdx) => (
                  <div key={dIdx} className="p-3.5 bg-muted/30 border rounded-xl flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3 truncate pr-2">
                      <FileText className="w-5 h-5 text-red-500 shrink-0" />
                      <div className="truncate text-xs">
                        <p className="font-bold text-foreground truncate" title={doc.name}>{formatAttachmentName(doc.name)}</p>
                        <span className="text-[10px] text-muted-foreground tabular-nums">{formatBytes(doc.size)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-muted rounded" title="Aç">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <a href={doc.url} download={formatAttachmentName(doc.name)} className="p-1.5 hover:bg-muted text-primary rounded" title="İndir">
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 border border-dashed rounded-xl text-center text-xs text-muted-foreground">
                Ekli doküman veya PDF bulunmuyor.
              </div>
            )}
          </div>

          {/* 4. Adım Doğrulama Kanıt Fotoğrafları ve Dokümanları */}
          {(allVerificationPhotos.length > 0 || allVerificationDocs.length > 0) && (
            <div className="space-y-3 pt-4 border-t">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                Doğrulama Kanıt Fotoğrafları &amp; Dokümanları ({allVerificationPhotos.length + allVerificationDocs.length})
              </h3>

              {allVerificationPhotos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {allVerificationPhotos.map((item, pIdx) => (
                    <div
                      key={pIdx}
                      onClick={() =>
                        setLightboxState({
                          photos: allVerificationPhotos.map(x => x.photo),
                          index: pIdx,
                          title: `Doğrulama Kanıtı - ${new Date(item.verification.verificationDate).toLocaleDateString('tr-TR')}`,
                        })
                      }
                      className="group relative aspect-4/3 rounded-xl overflow-hidden border border-teal-500/30 bg-muted cursor-pointer shadow-xs hover:shadow-lg transition-all hover:border-teal-500"
                    >
                      <img src={item.photo.url} alt={item.photo.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 text-white">
                        <span className="text-[10px] truncate">{item.photo.name}</span>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="bg-black/60 px-1.5 py-0.5 rounded tabular-nums">{formatBytes(item.photo.size)}</span>
                          <ZoomIn className="w-4 h-4 text-teal-400" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {allVerificationDocs.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {allVerificationDocs.map((item, dIdx) => (
                    <div key={dIdx} className="p-3.5 bg-teal-500/5 border border-teal-500/25 rounded-xl flex items-center justify-between hover:bg-teal-500/10 transition-colors">
                      <div className="flex items-center gap-3 truncate pr-2">
                        <FileText className="w-5 h-5 text-teal-600 shrink-0" />
                        <div className="truncate text-xs">
                          <p className="font-bold text-foreground truncate" title={item.doc.name}>{formatAttachmentName(item.doc.name)}</p>
                          <span className="text-[10px] text-muted-foreground tabular-nums">{formatBytes(item.doc.size)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a href={item.doc.url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-muted rounded" title="Aç">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <a href={item.doc.url} download={formatAttachmentName(item.doc.name)} className="p-1.5 hover:bg-muted text-primary rounded" title="İndir">
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── SEKME 4: BÜTÇE & MALİYET ANALİZİ ──────────────────────────────── */}
      {activeTab === 'BUDGET' && (
        <div className="bg-card text-card-foreground border rounded-2xl shadow-sm overflow-hidden p-6 space-y-6 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between border-b pb-4 flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                Finansal Yönetim ve Bütçe Takibi
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Bu bulgunun giderimi için öngörülen tahmini ve gerçekleşen harcama analizi.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs tabular-nums font-bold px-3 py-1 bg-muted border">
                Para Birimi: {record.currency || 'TRY'} ({record.currency === 'USD' ? '$' : record.currency === 'EUR' ? '€' : '₺'})
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Tahmini Bütçe */}
            <div className="p-4 bg-blue-500/10 border border-blue-200 dark:border-blue-900/50 rounded-2xl space-y-1">
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Tahmini Bütçe</span>
              <p className="text-2xl font-black tabular-nums text-foreground">
                {formatCurrency(estBudget, record.currency)}
              </p>
            </div>

            {/* Gerçekleşen Bütçe */}
            <div className="p-4 bg-emerald-500/10 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl space-y-1">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Gerçekleşen Bütçe</span>
              <p className="text-2xl font-black tabular-nums text-foreground">
                {formatCurrency(actBudget, record.currency)}
              </p>
            </div>

            {/* Varyans / Sapma */}
            <div className={`p-4 rounded-2xl border space-y-1 ${budgetVariance === null
                ? 'bg-muted/30'
                : budgetVariance > 0
                  ? 'bg-red-500/10 border-red-200 text-red-700 dark:text-red-400'
                  : 'bg-emerald-500/10 border-emerald-200 text-emerald-700 dark:text-emerald-400'
              }`}>
              <span className="text-xs font-semibold">
                {budgetVariance === null ? 'Sapma Durumu' : budgetVariance > 0 ? 'Bütçe Aşımı' : 'Bütçe Tasarrufu'}
              </span>
              <p className="text-2xl font-black tabular-nums">
                {budgetVariance !== null ? formatCurrency(Math.abs(budgetVariance), record.currency) : '-'}
              </p>
              {variancePercentage !== null && (
                <span className="text-[11px] block opacity-80">
                  {budgetVariance && budgetVariance > 0 ? `Tahmini %${Math.abs(variancePercentage)} aştı` : `Tahminden %${Math.abs(variancePercentage)} tasarruf edildi`}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 4. DİYALOGLAR (AKSIYON GİR & DÜZENLE & LIGHTBOX) ───────────────── */}
      {showActionModal && (
        <ActionNoteDialog
          record={record}
          onClose={() => setShowActionModal(false)}
          onSuccess={() => {
            fetchRecordDetail();
            toast.success('Aksiyon notu ve kanıtlar başarıyla güncellendi.');
          }}
        />
      )}

      {showEditModal && (
        <EditRecordDialog
          record={record}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            fetchRecordDetail();
            toast.success('Bulgu ve ekler başarıyla güncellendi.');
          }}
        />
      )}

      {/* Hızlı Saha Keşif Notu Modalı */}
      {showDiscoveryModal && record && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-background border rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-foreground text-sm">Saha Keşif Notu Girişi</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDiscoveryModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDiscoveryNotes} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Yapılan Saha Keşif Notları ve İnceleme Bulguları:
                </label>
                <textarea
                  rows={5}
                  value={discoveryNotesInput}
                  onChange={(e) => setDiscoveryNotesInput(e.target.value)}
                  placeholder="Sahada yapılan keşif, teknik tespitler, ölçümler veya inceleme notlarını giriniz..."
                  className="w-full p-3 rounded-xl border bg-background text-foreground text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDiscoveryModal(false)}
                  disabled={savingDiscovery}
                >
                  Vazgeç
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  disabled={savingDiscovery}
                >
                  {savingDiscovery ? 'Kaydediliyor...' : 'Keşif Notunu Kaydet'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingHistory && record && (
        <EditActionHistoryDialog
          record={record}
          history={editingHistory}
          onClose={() => setEditingHistory(null)}
          onSuccess={(updatedRecord) => {
            setEditingHistory(null);
            if (updatedRecord) {
              setRecord(updatedRecord);
            } else {
              fetchRecordDetail();
            }
          }}
        />
      )}

      {deletingHistory && record && (
        <DeleteActionHistoryDialog
          record={record}
          history={deletingHistory}
          onClose={() => setDeletingHistory(null)}
          onSuccess={(updatedRecord) => {
            setDeletingHistory(null);
            if (updatedRecord) {
              setRecord(updatedRecord);
            } else {
              fetchRecordDetail();
            }
          }}
        />
      )}

      {showVerificationModal && record && canVerify && (
        <VerificationDialog
          record={record}
          existingVerification={editingVerification}
          onClose={() => {
            setShowVerificationModal(false);
            setEditingVerification(null);
          }}
          onSuccess={(updatedRecord) => {
            setShowVerificationModal(false);
            setEditingVerification(null);
            if (updatedRecord) {
              setRecord(updatedRecord);
            } else {
              fetchRecordDetail();
            }
          }}
        />
      )}

      {lightboxState && (
        <ImprovementMediaLightbox
          photos={lightboxState.photos}
          initialIndex={lightboxState.index}
          title={lightboxState.title}
          onClose={() => setLightboxState(null)}
        />
      )}

    </div>
  );
};

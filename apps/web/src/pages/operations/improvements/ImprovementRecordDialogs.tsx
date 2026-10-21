import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Check, AlertCircle, Clock, Calendar, Building2, 
  MapPin, Wrench, Shield, User, FileText, CheckCircle2, Tag, Plus, Trash2, Camera, Eye, Download,
  Scale, ShoppingCart, HardHat, Package, Sparkles, Upload, Paperclip, ExternalLink, Loader2, MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import { 
  type ImprovementRecord, 
  type ImprovementRecordHistory, 
  type FacilityOption, 
  type ImprovementFileAttachment,
  type ImprovementActionTemplate,
  type ActionTemplateField,
  type GroundingStandardNote,
  GROUNDING_STANDARD_NOTES,
  formatAttachmentName,
  getModuleGroup 
} from './types';
import { ImprovementAttachmentManager, ImprovementMediaLightbox, uploadImprovementFiles, formatBytes } from './ImprovementMediaManager';

const API = import.meta.env.VITE_API_URL || '';

const isAuditSheet = (sheetType: string) => 
  ['DENETIMLER', 'HASTANE_IC_DENETIMLERI', 'MERKEZI_DENETIMLER', 'SAGLIK_DENETIMLERI', 'ITFAIYE_YANGIN_DENETIMLERI'].includes(sheetType);

// ─────────────────────────────────────────────────────────────────────────────
// 1. İNCELE (Salt Okunur Detay Penceresi)
// ─────────────────────────────────────────────────────────────────────────────
interface InspectProps {
  record: ImprovementRecord | null;
  onClose: () => void;
}

export const InspectRecordDialog: React.FC<InspectProps> = ({ record, onClose }) => {
  if (!record) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card text-card-foreground border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Başlık */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/40">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className="text-xs font-semibold">
                {record.sheetType} #{record.rowNo || '-'}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {record.category || 'Belirtilmemiş'}
              </Badge>
              <Badge 
                className={`text-xs ${
                  record.riskScore === 'Kritik' ? 'bg-red-500 text-white' :
                  record.riskScore === 'Yüksek' ? 'bg-orange-500 text-white' :
                  record.riskScore === 'Önemli' ? 'bg-amber-500 text-white' :
                  record.riskScore === 'Olası' ? 'bg-yellow-500 text-white' :
                  record.riskScore === 'Önemsiz' ? 'bg-slate-500 text-white' :
                  'bg-slate-500 text-white'
                }`}
              >
                {record.riskScore || 'Risk Belirtilmedi'}
              </Badge>
              <Badge 
                variant="outline"
                className={`text-xs ${
                  record.status === 'Tamamlandı' ? 'text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30' :
                  record.status === 'Devam Ediyor' ? 'text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-950/30' :
                  record.status === 'İptal Edildi' ? 'text-muted-foreground' :
                  'text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30'
                }`}
              >
                {record.status}
              </Badge>
            </div>
            <h3 className="text-base font-bold text-foreground">
              {record.facility?.name || 'Tesis Belirtilmedi'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gövde */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-muted/30 p-3 rounded-xl border">
            <div>
              <span className="text-muted-foreground font-semibold block">Tespit Tarihi</span>
              <span className="text-foreground font-mono font-medium">
                {record.recordDate ? new Date(record.recordDate).toLocaleDateString('tr-TR') : '-'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground font-semibold block text-primary">Termin Tarihi</span>
              <span className="text-foreground font-mono font-semibold">
                {record.dueDate ? new Date(record.dueDate).toLocaleDateString('tr-TR') : '-'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground font-semibold block">Mahal / Konum</span>
              <span className="text-foreground font-medium">{record.location || '-'}</span>
            </div>
            {isAuditSheet(record.sheetType) ? (
              <div>
                <span className="text-muted-foreground font-semibold block">Denetim Adı</span>
                <span className="text-foreground font-medium">{record.auditName || '-'}</span>
              </div>
            ) : (
              <>
                <div>
                  <span className="text-muted-foreground font-semibold block">Ekipman No</span>
                  <span className="text-foreground font-mono font-medium">{record.equipmentNo || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold block">Ekipman Adı</span>
                  <span className="text-foreground font-medium">{record.equipmentName || record.equipment || '-'}</span>
                </div>
              </>
            )}
            <div>
              <span className="text-muted-foreground font-semibold block">Sorumlu Kişi / Birim</span>
              <span className="text-foreground font-medium">{record.assignedTo || '-'}</span>
            </div>
            {record.applicationType && (
              <div>
                <span className="text-muted-foreground font-semibold block">Uygulama</span>
                <span className="text-foreground font-medium">{record.applicationType}</span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground font-semibold block">Kaynak Dosya</span>
              <span className="text-foreground truncate block font-mono text-[10px]" title={record.sourceFileName || ''}>
                {record.sourceFileName || 'Sistem İçi Kayıt'}
              </span>
            </div>
          </div>

          {/* Bütçe Bilgileri */}
          <div className="grid grid-cols-2 gap-3 bg-muted/20 p-3 rounded-xl border">
            <div>
              <span className="text-muted-foreground font-semibold block text-[11px]">Tahmini Bütçe</span>
              <span className="text-blue-600 dark:text-blue-400 font-mono font-bold text-sm">
                {record.estimatedBudget !== undefined && record.estimatedBudget !== null 
                  ? new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(record.estimatedBudget) + ' ₺'
                  : '-'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground font-semibold block text-[11px]">Gerçekleşen Bütçe</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold text-sm">
                {record.actualBudget !== undefined && record.actualBudget !== null 
                  ? new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(record.actualBudget) + ' ₺'
                  : '-'}
              </span>
            </div>
          </div>

          {/* Tespit */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground">Tespit Açıklaması:</label>
            <div className="p-3 bg-muted/40 border rounded-xl text-foreground whitespace-pre-wrap leading-relaxed">
              {record.finding}
            </div>
          </div>

          {/* İş Planı */}
          {record.actionPlan && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">İş Planı:</label>
              <div className="p-3 bg-muted/40 border rounded-xl text-foreground whitespace-pre-wrap leading-relaxed">
                {record.actionPlan}
              </div>
            </div>
          )}

          {/* Aksiyon / Açıklama */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-primary">Aksiyon / Güncel Durum Açıklaması:</label>
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-foreground whitespace-pre-wrap leading-relaxed">
              {record.currentNote || <span className="text-muted-foreground italic">Henüz bir aksiyon notu girilmemiş.</span>}
            </div>
          </div>

          {/* Teknik Müdür Açıklaması */}
          {record.technicalManagerDesc && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Teknik Müdür Açıklaması:</label>
              <div className="p-3 bg-muted/30 border rounded-xl text-foreground whitespace-pre-wrap leading-relaxed">
                {record.technicalManagerDesc}
              </div>
            </div>
          )}

          {/* Yapılan Keşif Notları */}
          {record.discoveryNotes && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Yapılan Keşif Notları:</label>
              <div className="p-3 bg-muted/30 border rounded-xl text-foreground whitespace-pre-wrap leading-relaxed">
                {record.discoveryNotes}
              </div>
            </div>
          )}

          {/* Bulgu Fotoğrafları & Dokümanlar (Varsa Görüntüleme) */}
          {((Array.isArray(record.findingPhotos) && record.findingPhotos.length > 0) ||
            (Array.isArray(record.documents) && record.documents.length > 0)) && (
            <div className="space-y-1 pt-2 border-t">
              <label className="text-xs font-bold text-foreground">Bulgu Fotoğrafları & Dokümanlar:</label>
              <ImprovementAttachmentManager
                facilityId={record.facilityId}
                facilityName={record.facility?.shortName || record.facility?.name}
                photos={Array.isArray(record.findingPhotos) ? record.findingPhotos : []}
                onPhotosChange={() => {}}
                documents={Array.isArray(record.documents) ? record.documents : []}
                onDocumentsChange={() => {}}
                isReadOnly={true}
              />
            </div>
          )}

        </div>

        {/* Alt Buton */}
        <div className="px-6 py-3 border-t flex justify-end bg-muted/40">
          <Button variant="outline" size="sm" onClick={onClose}>
            Kapat
          </Button>
        </div>

      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 1.1 HIZLI DURUM DEĞİŞTİR ("Durum Değiştir" Penceresi)
// ─────────────────────────────────────────────────────────────────────────────
interface QuickStatusProps {
  record: ImprovementRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const QuickStatusDialog: React.FC<QuickStatusProps> = ({ record, onClose, onSuccess }) => {
  if (!record) return null;
  const [selectedStatus, setSelectedStatus] = useState(record.status);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/operations/improvements/records/${record.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ 
          status: selectedStatus,
          note: note.trim() || undefined,
        })
      });

      const d = await res.json();
      if (!res.ok || !d.success) throw new Error(d.message || 'Durum güncellenemedi.');

      toast.success(`Durum başarıyla "${selectedStatus}" olarak güncellendi.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Hata: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card text-card-foreground border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Başlık */}
        <div className="px-5 py-4 border-b flex items-center justify-between bg-muted/40">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-primary" />
            <div>
              <h3 className="text-sm font-bold text-foreground">Durumu Değiştir</h3>
              <p className="text-[11px] text-muted-foreground">{record.facility?.shortName || record.facility?.name} - #{record.rowNo}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="text-xs font-semibold text-foreground block mb-2">
              Yeni Durum Seçiniz:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'Başlamadı', label: 'Başlamadı', icon: Clock, color: 'text-amber-600', desc: 'Henüz başlanmadı' },
                { id: 'Devam Ediyor', label: 'Devam Ediyor', icon: RefreshCw, color: 'text-blue-600', desc: 'İşlem sürüyor' },
                { id: 'Tamamlandı', label: 'Tamamlandı', icon: CheckCircle2, color: 'text-emerald-600', desc: 'Giderim tamamlandı' },
                { id: 'İptal Edildi', label: 'İptal Edildi', icon: AlertCircle, color: 'text-slate-500', desc: 'İptal / geçersiz' },
              ].map(({ id: stId, label, icon: Icon, color, desc }) => {
                const isSelected = selectedStatus === stId;
                return (
                  <button
                    key={stId}
                    type="button"
                    onClick={() => setSelectedStatus(stId)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/20 text-foreground font-bold shadow-xs'
                        : 'border-border/70 hover:bg-muted/40 text-muted-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon className={`w-3.5 h-3.5 ${color}`} />
                      <span className="text-xs font-bold text-foreground">{label}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Gerekçe / Not (Opsiyonel):
            </label>
            <textarea
              rows={2}
              placeholder="Durum değişikliğine dair kısa bir not ekleyebilirsiniz..."
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full p-2.5 rounded-lg border bg-background text-foreground text-xs outline-none resize-none"
            />
          </div>

          <div className="pt-2 border-t flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Vazgeç
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="bg-primary text-primary-foreground font-bold">
              {loading ? 'Kaydediliyor...' : 'Durumu Güncelle'}
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. HIZLI AKSİYON GİR ("Aksiyon Gir" Penceresi - Step-by-Step Kalıplı Sihirbaz)
// ─────────────────────────────────────────────────────────────────────────────
interface ActionNoteProps {
  record: ImprovementRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ActionNoteDialog: React.FC<ActionNoteProps> = ({ record, onClose, onSuccess }) => {
  if (!record) return null;

  const initialRecordDate = record.recordDate 
    ? new Date(record.recordDate).toISOString().split('T')[0]
    : '';
  const initialDueDate = record.dueDate 
    ? new Date(record.dueDate).toISOString().split('T')[0]
    : '';

  const [note, setNote] = useState(record.currentNote || '');
  const [actionPlan, setActionPlan] = useState(record.actionPlan || '');
  const [recordDate, setRecordDate] = useState(initialRecordDate);
  const [dueDate, setDueDate] = useState(initialDueDate);
  const [status, setStatus] = useState(record.status);
  const [evidencePhotos, setEvidencePhotos] = useState<ImprovementFileAttachment[]>([]);
  const [attachedDocs, setAttachedDocs] = useState<ImprovementFileAttachment[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);

  // Aksiyon Kalıpları State
  const [templates, setTemplates] = useState<ImprovementActionTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('TALEP_ACILDI');
  const [stepFields, setStepFields] = useState<Record<string, any>>({});
  const [customRemark, setCustomRemark] = useState<string>('');
  const [customProgress, setCustomProgress] = useState<number | null>(null);

  // 1. Şablonları API'den çek
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API}/api/operations/improvements/action-templates`, {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
        const d = await res.json();
        if (d.success && Array.isArray(d.data) && d.data.length > 0) {
          const activeList = d.data.filter((t: any) => t.isActive !== false);
          setTemplates(activeList);
          if (activeList.length > 0) {
            setSelectedTemplateId(activeList[0].id);
          }
        }
      } catch (e) {
        console.error('Error fetching action templates:', e);
      }
    };
    fetchTemplates();
  }, []);

  // Aktif Şablon
  const activeTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];

  // Şablon değişince
  const handleSelectTemplate = (tpl: ImprovementActionTemplate) => {
    setSelectedTemplateId(tpl.id);
    if (tpl.id === 'TAMAMLANDI') {
      setStatus('Tamamlandı');
    } else if (tpl.suggestedStatus) {
      setStatus(tpl.suggestedStatus);
    }
    setCustomProgress(null);
    const initialFields: Record<string, any> = {};
    if (tpl.fields) {
      tpl.fields.forEach(f => {
        if (f.type === 'date') {
          initialFields[f.key] = new Date().toISOString().split('T')[0];
        } else {
          initialFields[f.key] = '';
        }
      });
    }
    setStepFields(initialFields);
  };

  // İlerleme Yüzdesi Hesaplamaları (Kademeli Sistem)
  const baseProgress = record.progress || 0;
  const isCompletionStep = status === 'Tamamlandı' || selectedTemplateId === 'TAMAMLANDI';
  const isNotStartedStep = status === 'Başlamadı';

  let calcAdded = 0;
  let calcProgress = baseProgress;

  if (isCompletionStep) {
    calcProgress = 100;
    calcAdded = Math.max(0, 100 - baseProgress);
  } else if (isNotStartedStep) {
    calcProgress = 0;
    calcAdded = 0;
  } else if (customProgress !== null) {
    calcProgress = customProgress;
    calcAdded = Math.max(0, customProgress - baseProgress);
  } else {
    const weight = activeTemplate?.progressWeight !== undefined ? activeTemplate.progressWeight : 10;
    calcAdded = weight;
    calcProgress = Math.min(99, baseProgress + weight);
  }

  // Cümleyi otomatik oluştur
  useEffect(() => {
    if (!activeTemplate) return;

    let sentence = activeTemplate.sentenceTemplate || '';
    if (activeTemplate.fields) {
      activeTemplate.fields.forEach(f => {
        const val = stepFields[f.key];
        const strVal = (val !== undefined && val !== null && String(val).trim() !== '')
          ? (f.type === 'date' ? new Date(val).toLocaleDateString('tr-TR') : String(val).trim())
          : '';
        sentence = sentence.replace(new RegExp(`\\{${f.key}\\}`, 'g'), strVal);
      });
    }
    // Süslü parantezleri temizle
    sentence = sentence.replace(/\{[a-zA-Z0-9_-]+\}/g, '').replace(/\s+/g, ' ').trim();

    if (customRemark.trim()) {
      sentence = sentence ? `${sentence} (Not: ${customRemark.trim()})` : customRemark.trim();
    }

    setNote(sentence);
  }, [selectedTemplateId, stepFields, customRemark, activeTemplate]);

  // Doküman Yükleme
  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingDoc(true);
    try {
      const uploaded = await uploadImprovementFiles(
        Array.from(files),
        record.facilityId,
        record.facility?.shortName || record.facility?.name
      );
      setAttachedDocs(prev => [...prev, ...uploaded]);
      toast.success(`${uploaded.length} adet doküman eklendi.`);
    } catch (err: any) {
      toast.error('Doküman yüklenemedi: ' + err.message);
    } finally {
      setUploadingDoc(false);
      if (docInputRef.current) docInputRef.current.value = '';
    }
  };

  const handleRemoveDoc = (index: number) => {
    setAttachedDocs(prev => prev.filter((_, i) => i !== index));
  };

  const getStepIcon = (iconName?: string) => {
    switch (iconName) {
      case 'FileText': return <FileText className="w-3.5 h-3.5" />;
      case 'Scale': return <Scale className="w-3.5 h-3.5" />;
      case 'ShoppingCart': return <ShoppingCart className="w-3.5 h-3.5" />;
      case 'HardHat': return <HardHat className="w-3.5 h-3.5" />;
      case 'Package': return <Package className="w-3.5 h-3.5" />;
      case 'Wrench': return <Wrench className="w-3.5 h-3.5" />;
      case 'CheckCircle2': return <CheckCircle2 className="w-3.5 h-3.5" />;
      default: return <MoreHorizontal className="w-3.5 h-3.5" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim() && !actionPlan.trim() && evidencePhotos.length === 0 && attachedDocs.length === 0) {
      toast.error('Lütfen bir aksiyon açıklaması, kalıp alanı veya kanıt ekleyin.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/operations/improvements/records/${record.id}/action-note`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ 
          currentNote: note, 
          status,
          progress: calcProgress,
          progressAdded: calcAdded,
          actionPlan,
          recordDate: recordDate ? new Date(recordDate).toISOString() : null,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          evidencePhotos,
          documents: attachedDocs,
          stepType: activeTemplate?.id || 'DIGER',
          stepTitle: activeTemplate?.title || 'Aksiyon Notu',
          stepFields,
        })
      });

      const d = await res.json();
      if (!res.ok || !d.success) throw new Error(d.message || 'Güncellenemedi');

      toast.success('Aksiyon adımı ve kanıtlar başarıyla kaydedildi.');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Hata: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card text-card-foreground border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Başlık */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/40">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Süreç Adımı & Aksiyon Girişi
            </h3>
            <p className="text-xs text-muted-foreground truncate max-w-md">
              {record.facility?.shortName || record.facility?.name} — {record.sheetType} #{record.rowNo}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto text-xs">
          
          {/* İlgili Tespit Hatırlatması */}
          <div className="p-3 bg-muted/30 border rounded-xl text-xs space-y-1">
            <span className="text-muted-foreground font-semibold block">İlgili Tespit:</span>
            <p className="text-foreground line-clamp-2 italic">
              "{record.finding}"
            </p>
          </div>

          {/* 🎯 1. ADIM: AKSİYON KALIBI SEÇİMİ (ŞABLON LİSTESİ) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-black">1</span>
                Aksiyon Aşamasını / Kalıbını Seçin:
              </span>
              <span className="text-[11px] text-muted-foreground font-normal">
                {activeTemplate?.description || 'Uygun süreci seçin'}
              </span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {templates.map((tpl) => {
                const isSelected = selectedTemplateId === tpl.id;
                const isTamam = tpl.id === 'TAMAMLANDI';
                const isDiger = tpl.id === 'DIGER';
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? 'bg-primary/10 border-primary shadow-xs ring-1 ring-primary text-foreground font-bold scale-[1.01]'
                        : 'bg-card border-border/70 hover:border-border hover:bg-muted/40 text-muted-foreground'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isSelected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                        {getStepIcon(tpl.icon)}
                      </div>
                      {isTamam ? (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                          %100
                        </span>
                      ) : isDiger ? (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground border">
                          Serbest
                        </span>
                      ) : (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                          +{tpl.progressWeight ?? 10}%
                        </span>
                      )}
                    </div>
                    <span className="text-xs truncate block font-semibold leading-tight">
                      {tpl.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 📊 AŞAMALI İLERLEME VE YÜZDE GÖSTERGESİ */}
          <div className="p-3.5 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-emerald-500/10 border border-blue-500/20 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-foreground">Süreç İlerlemesi:</span>
                <span className="text-muted-foreground">
                  Mevcut: <strong className="text-foreground">%{baseProgress}</strong>
                </span>
                <span className="text-primary font-bold">
                  ➔ {calcAdded > 0 ? `+ %${calcAdded} Eklenecek` : 'Değişmedi'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] text-muted-foreground">Yeni Hedef:</span>
                <span className={`text-xs font-black px-2 py-0.5 rounded-lg font-mono ${
                  calcProgress === 100 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'bg-primary text-primary-foreground'
                }`}>
                  %{calcProgress}
                </span>
              </div>
            </div>

            {/* Çift Katmanlı İlerleme Çubuğu */}
            <div className="w-full bg-muted/60 h-2.5 rounded-full overflow-hidden flex relative">
              <div 
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, baseProgress)}%` }}
                title={`Mevcut İlerleme: %${baseProgress}`}
              />
              {calcAdded > 0 && (
                <div 
                  className="bg-emerald-500 h-full transition-all duration-300 animate-pulse"
                  style={{ width: `${Math.min(100 - baseProgress, calcAdded)}%` }}
                  title={`Bu Adımda Eklenecek: +%${calcAdded}`}
                />
              )}
            </div>

            {/* Bilgilendirme / Serbest Ayar Satırı */}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
              <span>
                {isCompletionStep
                  ? '✅ Giderim & Test Tamamlandı seçildiği için kalan yüzde eklenip %100 kapatılıyor.'
                  : activeTemplate?.id === 'DIGER'
                    ? '✏️ Serbest aksiyon: Serbest metin yazıp hedef yüzdeyi manuel belirleyebilirsiniz.'
                    : `⚡ "${activeTemplate?.title || 'Adım'}" için +%${calcAdded} ilerleme ekleniyor.`}
              </span>
              {activeTemplate?.id === 'DIGER' && (
                <div className="flex items-center gap-1 shrink-0">
                  <label className="text-[11px] font-semibold text-foreground">Hedef %:</label>
                  <input 
                    type="number" 
                    min={0} 
                    max={100} 
                    value={calcProgress}
                    onChange={(e) => setCustomProgress(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-14 h-6 text-center border rounded bg-background text-foreground text-xs font-bold"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 🎯 2. ADIM: SEÇİLEN KALIBIN DİNAMİK ALANLARI */}
          {activeTemplate && activeTemplate.fields && activeTemplate.fields.length > 0 && (
            <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-black">2</span>
                  "{activeTemplate.title}" İçin Detay Bilgileri:
                </span>
                <span className="text-[10px] text-muted-foreground">Alanlar değiştikçe cümle otomatik üretilir</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeTemplate.fields.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                      {field.label} {field.required ? <span className="text-red-500">*</span> : ''}
                    </label>
                    <input
                      type={field.type}
                      value={stepFields[field.key] || ''}
                      onChange={(e) => setStepFields({ ...stepFields, [field.key]: e.target.value })}
                      placeholder={field.placeholder || `${field.label} giriniz...`}
                      className="w-full h-8 px-2.5 rounded-lg border bg-background text-foreground text-xs outline-none focus:ring-1 focus:ring-primary"
                      required={field.required}
                    />
                  </div>
                ))}
              </div>

              {/* Ek Açıklama / Not */}
              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-medium text-muted-foreground block">
                  İlave Serbest Not (Opsiyonel):
                </label>
                <input
                  type="text"
                  value={customRemark}
                  onChange={(e) => setCustomRemark(e.target.value)}
                  placeholder="Sahadan eklemek istediğiniz diğer detaylar..."
                  className="w-full h-8 px-2.5 rounded-lg border bg-background text-foreground text-xs outline-none"
                />
              </div>
            </div>
          )}

          {/* 🎯 3. ADIM: OLUŞTURULAN CÜMLE & DÜZENLEME */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-black">3</span>
                Kaydedilecek Aksiyon Metni (Canlı Önizleme & Düzenleme):
              </span>
              <span className="text-[10px] text-muted-foreground font-normal">Gerektiğinde serbestçe değiştirebilirsiniz</span>
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Aksiyon açıklaması..."
              className="w-full p-2.5 rounded-lg border bg-background text-foreground text-xs focus:ring-1 focus:ring-primary outline-none resize-none font-medium leading-relaxed"
              required
            />
          </div>

          {/* Durum ve Termin Tarihi Satırı */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Kayıt Durumu (Otomatik Önerilen):
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary outline-none font-semibold"
              >
                <option value="Başlamadı">⏳ Başlamadı</option>
                <option value="Devam Ediyor">🔄 Devam Ediyor</option>
                <option value="Tamamlandı">✅ Tamamlandı</option>
                <option value="İptal Edildi">🚫 İptal Edildi</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-primary flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-primary" />
                Hedef Termin Tarihi:
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none font-mono font-medium border-primary/40 focus:border-primary"
              />
            </div>
          </div>

          {/* 🎯 4. ADIM: AKSİYON KANIT FOTOĞRAFLARI (WebP) */}
          <div className="space-y-1 pt-2 border-t">
            <span className="text-xs font-bold text-foreground block">
              Aksiyon Kanıt Fotoğrafları (Maksimum 3 Görsel):
            </span>
            <ImprovementAttachmentManager
              facilityId={record.facilityId}
              facilityName={record.facility?.shortName || record.facility?.name}
              photos={evidencePhotos}
              onPhotosChange={setEvidencePhotos}
              maxPhotos={3}
            />
          </div>

          {/* 🎯 5. ADIM: EKLİ BELGELER & TEKLİF / TUTANAK (PDF DOKÜMANLARI) */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                Aksiyona Ait Belgeler & PDF Ekleri ({attachedDocs.length}):
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadingDoc}
                onClick={() => docInputRef.current?.click()}
                className="h-7 text-[11px] gap-1"
              >
                {uploadingDoc ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                {uploadingDoc ? 'Yükleniyor...' : '+ PDF / Belge Ekle'}
              </Button>
              <input
                ref={docInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                className="hidden"
                onChange={handleDocUpload}
              />
            </div>

            {attachedDocs.length > 0 && (
              <div className="space-y-1.5">
                {attachedDocs.map((doc, dIdx) => (
                  <div key={dIdx} className="p-2 bg-muted/40 border rounded-lg flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <FileText className="w-4 h-4 text-red-500 shrink-0" />
                      <span className="font-semibold truncate text-foreground" title={doc.name}>
                        {formatAttachmentName(doc.name)}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">({formatBytes(doc.size)})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDoc(dIdx)}
                      className="text-muted-foreground hover:text-red-500 p-1"
                      title="Belgeyi Kaldır"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Butonlar */}
          <div className="pt-3 flex justify-end gap-2 border-t">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Vazgeç
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="bg-primary text-primary-foreground font-bold hover:bg-primary/90">
              {loading ? 'Kaydediliyor...' : `Aksiyonu ve İlerlemeyi (%${calcProgress}) Kaydet`}
            </Button>
          </div>

        </form>

      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. TAM DÜZENLE FORM MODALI (Tarih ve Ayarlardaki Kategoriler Dahil)
// ─────────────────────────────────────────────────────────────────────────────
interface EditProps {
  record: ImprovementRecord | null;
  onClose: () => void;
  onSuccess: () => void;
  onDelete?: (record: ImprovementRecord) => void;
}

export const EditRecordDialog: React.FC<EditProps> = ({ record, onClose, onSuccess, onDelete }) => {
  if (!record) return null;

  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  // Tarih stringlerini YYYY-MM-DD formatına çevir
  const initialDateStr = record.recordDate 
    ? new Date(record.recordDate).toISOString().split('T')[0]
    : '';
  const initialDueDateStr = record.dueDate
    ? new Date(record.dueDate).toISOString().split('T')[0]
    : '';

  const [formData, setFormData] = useState({
    location: record.location || '',
    equipment: record.equipment || '',
    equipmentNo: record.equipmentNo || '',
    equipmentName: record.equipmentName || '',
    finding: record.finding || '',
    riskScore: record.riskScore || 'Önemli',
    assignedTo: record.assignedTo || '',
    status: record.status || 'Başlamadı',
    progress: record.progress !== undefined && record.progress !== null ? record.progress : 0,
    actionPlan: record.actionPlan || '',
    currentNote: record.currentNote || '',
    auditName: record.auditName || '',
    category: record.category || 'Elektrik Güvenliği',
    recordDate: initialDateStr,
    dueDate: initialDueDateStr,
    technicalManagerDesc: record.technicalManagerDesc || '',
    discoveryNotes: record.discoveryNotes || '',
    estimatedBudget: record.estimatedBudget !== undefined && record.estimatedBudget !== null ? String(record.estimatedBudget) : '',
    actualBudget: record.actualBudget !== undefined && record.actualBudget !== null ? String(record.actualBudget) : '',
    currency: record.currency || 'TRY',
  });
  const [findingPhotos, setFindingPhotos] = useState<ImprovementFileAttachment[]>(
    Array.isArray(record.findingPhotos) ? record.findingPhotos : []
  );
  const [documents, setDocuments] = useState<ImprovementFileAttachment[]>(
    Array.isArray(record.documents) ? record.documents : []
  );
  const [loading, setLoading] = useState(false);

  const isGrounding = record.sheetType === 'TOPRAKLAMA_PK';
  const [standardNoteCode, setStandardNoteCode] = useState<string>(record.standardNoteCode || '');
  const [periodicReportId, setPeriodicReportId] = useState<string | null>(record.periodicReportId || null);

  const buildGroundingFinding = (noteCode: string, eqName: string, eqNo: string, loc: string) => {
    const note = GROUNDING_STANDARD_NOTES.find(n => n.code === noteCode);
    if (!note) return '';
    const locPart = loc.trim() ? `[${loc.trim()}] ` : '';
    const eqPart = [eqNo.trim(), eqName.trim()].filter(Boolean).join(' - ');
    const prefix = [locPart, eqPart].filter(Boolean).join(' ');
    if (prefix) {
      return `${prefix} - ${note.code}: ${note.text}`;
    }
    return `${note.code}: ${note.text}`;
  };

  const handleSelectStandardNote = (code: string) => {
    setStandardNoteCode(code);
    const note = GROUNDING_STANDARD_NOTES.find(n => n.code === code);
    if (!note) return;
    const generated = buildGroundingFinding(code, formData.equipmentName, formData.equipmentNo, formData.location);
    setFormData(prev => ({
      ...prev,
      finding: generated || prev.finding,
      riskScore: note.recommendedRisk,
      actionPlan: note.recommendedActionPlan || prev.actionPlan,
      category: 'Topraklama Tesisatı',
    }));
  };

  const handleRegenerateFinding = () => {
    if (!standardNoteCode) {
      toast.error('Lütfen standart periyodik kontrol notunu seçin.');
      return;
    }
    const generated = buildGroundingFinding(standardNoteCode, formData.equipmentName, formData.equipmentNo, formData.location);
    if (generated) {
      setFormData(prev => ({ ...prev, finding: generated }));
      toast.success('Tespit metni otomatik üretildi.');
    }
  };

  // Ayarlardan kategorileri yükle
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API}/api/operations/improvements/categories`, {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
        const d = await res.json();
        if (d.success && Array.isArray(d.data)) {
          setAvailableCategories(d.data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchCats();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/operations/improvements/records/${record.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          ...formData,
          equipment: (formData.equipmentNo || formData.equipmentName)
            ? [formData.equipmentNo, formData.equipmentName].filter(Boolean).join(' - ')
            : formData.equipment,
          estimatedBudget: formData.estimatedBudget ? parseFloat(formData.estimatedBudget) : null,
          actualBudget: formData.actualBudget ? parseFloat(formData.actualBudget) : null,
          technicalManagerDesc: formData.technicalManagerDesc || null,
          discoveryNotes: formData.discoveryNotes || null,
          recordDate: formData.recordDate ? new Date(formData.recordDate).toISOString() : null,
          dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
          findingPhotos,
          documents,
          standardNoteCode: standardNoteCode || null,
          periodicReportId: periodicReportId || null,
        })
      });

      const d = await res.json();
      if (!res.ok || !d.success) throw new Error(d.message || 'Kayıt güncellenemedi.');

      toast.success('Kayıt başarıyla güncellendi.');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Hata: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card text-card-foreground border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/40">
          <div>
            <h3 className="text-base font-bold text-foreground">
              Kaydı Düzenle ({record.sheetType} #{record.rowNo})
            </h3>
            <p className="text-xs text-muted-foreground">{record.facility?.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-sm">
          
          {/* Topraklama PK: Standart Periyodik Kontrol Kusur / Not Seçimi */}
          {isGrounding && (
            <div className="p-3.5 bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Topraklama Standart Periyodik Kontrol Notu
                </label>
                {periodicReportId && (
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                    Periyodik Raporla İlişkili
                  </Badge>
                )}
              </div>

              <select
                value={standardNoteCode}
                onChange={(e) => handleSelectStandardNote(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs font-medium outline-none"
              >
                <option value="">Standart Kusur / Not Seçiniz (Not-1 .. Not-11)...</option>
                {GROUNDING_STANDARD_NOTES.map(note => (
                  <option key={note.code} value={note.code}>
                    [{note.defectLevel}] {note.code}: {note.text.slice(0, 85)}{note.text.length > 85 ? '...' : ''}
                  </option>
                ))}
              </select>

              {standardNoteCode && (() => {
                const note = GROUNDING_STANDARD_NOTES.find(n => n.code === standardNoteCode);
                if (!note) return null;
                return (
                  <div className="p-2.5 bg-background/80 rounded-lg border text-xs space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge 
                        className={`text-[10px] font-bold ${
                          note.isHeavyDefect 
                            ? 'bg-red-500 text-white' 
                            : note.defectLevel === 'Uygun' 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-amber-600 text-white'
                        }`}
                      >
                        {note.defectLevel}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] font-semibold">
                        Önerilen Risk: {note.recommendedRisk}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground font-mono font-medium">
                        {note.code}
                      </span>
                    </div>
                    <p className="text-foreground text-[11px] leading-relaxed">
                      {note.text}
                    </p>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Kategori, Risk Skoru ve Tarih Satırları */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Kategori */}
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Kategori
              </label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none"
              >
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                {!availableCategories.includes(formData.category) && formData.category && (
                  <option value={formData.category}>{formData.category}</option>
                )}
              </select>
            </div>

            {/* Risk Skoru */}
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Risk Skoru
              </label>
              <select
                value={formData.riskScore}
                onChange={e => setFormData({ ...formData, riskScore: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none font-semibold"
              >
                <option value="Kritik">Kritik</option>
                <option value="Yüksek">Yüksek</option>
                <option value="Önemli">Önemli</option>
                <option value="Olası">Olası</option>
                <option value="Önemsiz">Önemsiz</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Tespit Tarihi */}
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                Tespit Tarihi
              </label>
              <input
                type="date"
                value={formData.recordDate}
                onChange={e => setFormData({ ...formData, recordDate: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none font-mono"
              />
            </div>

            {/* Termin Tarihi */}
            <div>
              <label className="text-xs font-semibold text-primary block mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-primary" />
                Termin Tarihi
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none font-mono border-primary/40 focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Durum
              </label>
              <select
                value={formData.status}
                onChange={e => {
                  const newSt = e.target.value;
                  const newP = newSt === 'Tamamlandı' ? 100 : (newSt === 'Başlamadı' ? 0 : (formData.progress || 10));
                  setFormData({ ...formData, status: newSt, progress: newP });
                }}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none font-semibold"
              >
                <option value="Başlamadı">⏳ Başlamadı</option>
                <option value="Devam Ediyor">🔄 Devam Ediyor</option>
                <option value="Tamamlandı">✅ Tamamlandı</option>
                <option value="İptal Edildi">🚫 İptal Edildi</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                İlerleme Yüzdesi (%{formData.progress || 0})
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={formData.progress ?? 0}
                onChange={e => setFormData({ ...formData, progress: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs font-bold font-mono outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Sorumlusu
              </label>
              <input
                type="text"
                value={formData.assignedTo}
                onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Mahal
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none"
              />
            </div>

            {isAuditSheet(record.sheetType) ? (
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Denetim Adı
                </label>
                <input
                  type="text"
                  value={formData.auditName}
                  onChange={e => setFormData({ ...formData, auditName: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none"
                />
              </div>
            ) : (
              <div className="col-span-2 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Ekipman No
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: TR-01, P-102"
                    value={formData.equipmentNo}
                    onChange={e => setFormData({ ...formData, equipmentNo: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Ekipman Adı
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Ana Dağıtım Panosu"
                    value={formData.equipmentName}
                    onChange={e => setFormData({ ...formData, equipmentName: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                Tespit Metni <span className="text-red-500">*</span>
              </label>
              {isGrounding && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRegenerateFinding}
                  className="h-6 px-2 text-[11px] text-primary hover:text-primary font-medium flex items-center gap-1"
                  title="Mahal, Ekipman ve Seçilen Not ile Tespit Metnini Otomatik Üret"
                >
                  <Sparkles className="w-3 h-3 text-primary" />
                  Metni Otomatik Oluştur
                </Button>
              )}
            </div>
            <textarea
              rows={3}
              value={formData.finding}
              onChange={e => setFormData({ ...formData, finding: e.target.value })}
              className="w-full p-3 rounded-lg border bg-background text-foreground text-xs outline-none resize-none"
              required
            />
          </div>

          {/* Bulgu Fotoğrafları & Dokümanlar (WebP & PDF) */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Bulgu Fotoğrafları & Belgeleri (Maks. 3 Fotoğraf)
            </label>
            <ImprovementAttachmentManager
              facilityId={record.facilityId}
              facilityName={record.facility?.shortName || record.facility?.name}
              photos={findingPhotos}
              onPhotosChange={setFindingPhotos}
              documents={documents}
              onDocumentsChange={setDocuments}
              maxPhotos={3}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              İş Planı
            </label>
            <textarea
              rows={2}
              value={formData.actionPlan}
              onChange={e => setFormData({ ...formData, actionPlan: e.target.value })}
              className="w-full p-3 rounded-lg border bg-background text-foreground text-xs outline-none resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-primary block mb-1">
              Aksiyon / Açıklama
            </label>
            <textarea
              rows={2}
              value={formData.currentNote}
              onChange={e => setFormData({ ...formData, currentNote: e.target.value })}
              className="w-full p-3 rounded-lg border bg-background text-foreground text-xs outline-none resize-none"
            />
          </div>

          {/* Teknik Müdür Açıklaması */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Teknik Müdür Açıklaması
            </label>
            <textarea
              rows={2}
              placeholder="Teknik müdür değerlendirmesi..."
              value={formData.technicalManagerDesc}
              onChange={e => setFormData({ ...formData, technicalManagerDesc: e.target.value })}
              className="w-full p-3 rounded-lg border bg-background text-foreground text-xs outline-none resize-none"
            />
          </div>

          {/* Yapılan Keşif Notları */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Yapılan Keşif Notları
            </label>
            <textarea
              rows={2}
              placeholder="Saha keşif notları ve tespit detayları..."
              value={formData.discoveryNotes}
              onChange={e => setFormData({ ...formData, discoveryNotes: e.target.value })}
              className="w-full p-3 rounded-lg border bg-background text-foreground text-xs outline-none resize-none"
            />
          </div>

          {/* Bütçe ve Para Birimi */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Para Birimi
              </label>
              <select
                value={formData.currency}
                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none font-medium"
              >
                <option value="TRY">₺ - Türk Lirası (TRY)</option>
                <option value="USD">$ - Dolar (USD)</option>
                <option value="EUR">€ - Euro (EUR)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Tahmini Bütçe
              </label>
              <input
                type="number"
                step="any"
                placeholder="Örn: 15000"
                value={formData.estimatedBudget}
                onChange={e => setFormData({ ...formData, estimatedBudget: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Gerçekleşen Bütçe
              </label>
              <input
                type="number"
                step="any"
                placeholder="Örn: 12500"
                value={formData.actualBudget}
                onChange={e => setFormData({ ...formData, actualBudget: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none font-mono"
              />
            </div>
          </div>

          <div className="pt-3 border-t flex items-center justify-between">
            {onDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(record)}
                disabled={loading}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Kaydı Sil
              </Button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
                Vazgeç
              </Button>
              <Button type="submit" size="sm" disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
              </Button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. YENİ KAYIT OLUŞTUR FORM MODALI (+ Yeni Kayıt Butonu İçin)
// ─────────────────────────────────────────────────────────────────────────────
interface CreateProps {
  sheetType: string;
  defaultFacilityId?: string;
  facilities: FacilityOption[];
  onClose: () => void;
  onSuccess: () => void;
  initialPeriodicReportId?: string;
}

export const CreateRecordDialog: React.FC<CreateProps> = ({
  sheetType,
  defaultFacilityId,
  facilities,
  onClose,
  onSuccess,
  initialPeriodicReportId,
}) => {
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const initialFacility = (defaultFacilityId && defaultFacilityId !== 'ALL') 
    ? defaultFacilityId 
    : (facilities[0]?.id || '');

  const isAudit = isAuditSheet(sheetType);
  const isGrounding = sheetType === 'TOPRAKLAMA_PK';

  const [standardNoteCode, setStandardNoteCode] = useState<string>('');
  const [periodicReportId, setPeriodicReportId] = useState<string | null>(initialPeriodicReportId || null);

  const [formData, setFormData] = useState({
    facilityId: initialFacility,
    location: '',
    equipment: '',
    equipmentNo: '',
    equipmentName: '',
    finding: '',
    riskScore: 'Önemli',
    assignedTo: '',
    status: 'Başlamadı',
    actionPlan: '',
    currentNote: '',
    auditName: isAudit ? 'İSG Yangın ve Teknik Alan Saha Turu' : '',
    category: isAudit ? 'İş Güvenliği / Fiziksel Riskler' : (isGrounding ? 'Topraklama Tesisatı' : 'Elektrik Güvenliği'),
    recordDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    technicalManagerDesc: '',
    discoveryNotes: '',
    estimatedBudget: '',
    actualBudget: '',
    currency: 'TRY',
  });
  const [findingPhotos, setFindingPhotos] = useState<ImprovementFileAttachment[]>([]);
  const [documents, setDocuments] = useState<ImprovementFileAttachment[]>([]);
  const [loading, setLoading] = useState(false);

  const buildGroundingFinding = (noteCode: string, eqName: string, eqNo: string, loc: string) => {
    const note = GROUNDING_STANDARD_NOTES.find(n => n.code === noteCode);
    if (!note) return '';
    const locPart = loc.trim() ? `[${loc.trim()}] ` : '';
    const eqPart = [eqNo.trim(), eqName.trim()].filter(Boolean).join(' - ');
    const prefix = [locPart, eqPart].filter(Boolean).join(' ');
    if (prefix) {
      return `${prefix} - ${note.code}: ${note.text}`;
    }
    return `${note.code}: ${note.text}`;
  };

  const handleSelectStandardNote = (code: string) => {
    setStandardNoteCode(code);
    const note = GROUNDING_STANDARD_NOTES.find(n => n.code === code);
    if (!note) return;
    const generated = buildGroundingFinding(code, formData.equipmentName, formData.equipmentNo, formData.location);
    setFormData(prev => ({
      ...prev,
      finding: generated || prev.finding,
      riskScore: note.recommendedRisk,
      actionPlan: note.recommendedActionPlan || prev.actionPlan,
      category: 'Topraklama Tesisatı',
    }));
  };

  const handleRegenerateFinding = () => {
    if (!standardNoteCode) {
      toast.error('Lütfen önce standart periyodik kontrol notunu seçin.');
      return;
    }
    const generated = buildGroundingFinding(standardNoteCode, formData.equipmentName, formData.equipmentNo, formData.location);
    if (generated) {
      setFormData(prev => ({ ...prev, finding: generated }));
      toast.success('Tespit metni otomatik üretildi.');
    }
  };

  const handleLocationChange = (loc: string) => {
    setFormData(prev => {
      const nextFinding = (isGrounding && standardNoteCode)
        ? buildGroundingFinding(standardNoteCode, prev.equipmentName, prev.equipmentNo, loc)
        : prev.finding;
      return { ...prev, location: loc, finding: nextFinding };
    });
  };

  const handleEquipmentNoChange = (no: string) => {
    setFormData(prev => {
      const nextFinding = (isGrounding && standardNoteCode)
        ? buildGroundingFinding(standardNoteCode, prev.equipmentName, no, prev.location)
        : prev.finding;
      return { ...prev, equipmentNo: no, finding: nextFinding };
    });
  };

  const handleEquipmentNameChange = (name: string) => {
    setFormData(prev => {
      const nextFinding = (isGrounding && standardNoteCode)
        ? buildGroundingFinding(standardNoteCode, name, prev.equipmentNo, prev.location)
        : prev.finding;
      return { ...prev, equipmentName: name, finding: nextFinding };
    });
  };

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API}/api/operations/improvements/categories`, {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
        const d = await res.json();
        if (d.success && Array.isArray(d.data)) {
          setAvailableCategories(d.data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchCats();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.facilityId) {
      toast.error('Lütfen bir hastane seçin.');
      return;
    }
    if (!formData.finding.trim()) {
      toast.error('Tespit metni zorunludur.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/operations/improvements/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          ...formData,
          sheetType,
          moduleGroup: getModuleGroup(sheetType),
          equipment: (formData.equipmentNo || formData.equipmentName)
            ? [formData.equipmentNo, formData.equipmentName].filter(Boolean).join(' - ')
            : formData.equipment,
          estimatedBudget: formData.estimatedBudget ? parseFloat(formData.estimatedBudget) : null,
          actualBudget: formData.actualBudget ? parseFloat(formData.actualBudget) : null,
          technicalManagerDesc: formData.technicalManagerDesc || null,
          discoveryNotes: formData.discoveryNotes || null,
          recordDate: formData.recordDate ? new Date(formData.recordDate).toISOString() : null,
          dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
          findingPhotos,
          documents,
          periodicReportId: periodicReportId || undefined,
          standardNoteCode: standardNoteCode || undefined,
        })
      });

      const d = await res.json();
      if (!res.ok || !d.success) throw new Error(d.message || 'Kayıt eklenemedi.');

      toast.success('Yeni kayıt başarıyla eklendi.');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Hata: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card text-card-foreground border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/40">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Yeni Kayıt Oluştur ({sheetType})
            </h3>
            <p className="text-xs text-muted-foreground">Sisteme yeni bir tespit ve aksiyon kaydı ekleyin.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-sm">
          
          {/* Hastane Seçimi */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Hastane <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.facilityId}
              onChange={e => setFormData({ ...formData, facilityId: e.target.value })}
              className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none"
              required
            >
              <option value="">Hastane Seçiniz...</option>
              {facilities.map(fac => (
                <option key={fac.id} value={fac.id}>{fac.name}</option>
              ))}
            </select>
          </div>

          {/* Topraklama PK: Standart Periyodik Kontrol Kusur / Not Seçimi */}
          {isGrounding && (
            <div className="p-3.5 bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Topraklama Standart Periyodik Kontrol Notu <span className="text-red-500">*</span>
                </label>
                {periodicReportId && (
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                    Periyodik Raporla İlişkili
                  </Badge>
                )}
              </div>

              <select
                value={standardNoteCode}
                onChange={(e) => handleSelectStandardNote(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs font-medium outline-none"
              >
                <option value="">Standart Kusur / Not Seçiniz (Not-1 .. Not-11)...</option>
                {GROUNDING_STANDARD_NOTES.map(note => (
                  <option key={note.code} value={note.code}>
                    [{note.defectLevel}] {note.code}: {note.text.slice(0, 85)}{note.text.length > 85 ? '...' : ''}
                  </option>
                ))}
              </select>

              {standardNoteCode && (() => {
                const note = GROUNDING_STANDARD_NOTES.find(n => n.code === standardNoteCode);
                if (!note) return null;
                return (
                  <div className="p-2.5 bg-background/80 rounded-lg border text-xs space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge 
                        className={`text-[10px] font-bold ${
                          note.isHeavyDefect 
                            ? 'bg-red-500 text-white' 
                            : note.defectLevel === 'Uygun' 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-amber-600 text-white'
                        }`}
                      >
                        {note.defectLevel}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] font-semibold">
                        Önerilen Risk: {note.recommendedRisk}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground font-mono font-medium">
                        {note.code}
                      </span>
                    </div>
                    <p className="text-foreground text-[11px] leading-relaxed">
                      {note.text}
                    </p>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Kategori ve Risk Skoru */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Kategori
              </label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none"
              >
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                {!availableCategories.includes(formData.category) && formData.category && (
                  <option value={formData.category}>{formData.category}</option>
                )}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Risk Skoru
              </label>
              <select
                value={formData.riskScore}
                onChange={e => setFormData({ ...formData, riskScore: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none font-semibold"
              >
                <option value="Kritik">Kritik</option>
                <option value="Yüksek">Yüksek</option>
                <option value="Önemli">Önemli</option>
                <option value="Olası">Olası</option>
                <option value="Önemsiz">Önemsiz</option>
              </select>
            </div>
          </div>

          {/* Tespit Tarihi ve Termin Tarihi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                Tespit Tarihi
              </label>
              <input
                type="date"
                value={formData.recordDate}
                onChange={e => setFormData({ ...formData, recordDate: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-primary block mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-primary" />
                Termin Tarihi
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none font-mono border-primary/40 focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Durum
              </label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none"
              >
                <option value="Başlamadı">Başlamadı</option>
                <option value="Devam Ediyor">Devam Ediyor</option>
                <option value="Tamamlandı">Tamamlandı</option>
                <option value="İptal Edildi">İptal Edildi</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Sorumlusu
              </label>
              <input
                type="text"
                placeholder="Örn: Teknik Müdürlük"
                value={formData.assignedTo}
                onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Mahal
              </label>
              <input
                type="text"
                placeholder="Örn: A Blok 4. Kat"
                value={formData.location}
                onChange={e => handleLocationChange(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none"
              />
            </div>

            {isAuditSheet(sheetType) ? (
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Denetim Adı
                </label>
                <input
                  type="text"
                  placeholder="Örn: Saha Turu"
                  value={formData.auditName}
                  onChange={e => setFormData({ ...formData, auditName: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none"
                />
              </div>
            ) : (
              <div className="col-span-2 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Ekipman No
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: TR-01, P-102"
                    value={formData.equipmentNo}
                    onChange={e => handleEquipmentNoChange(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Ekipman Adı
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Ana Dağıtım Panosu"
                    value={formData.equipmentName}
                    onChange={e => handleEquipmentNameChange(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                Tespit Metni <span className="text-red-500">*</span>
              </label>
              {isGrounding && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRegenerateFinding}
                  className="h-6 px-2 text-[11px] text-primary hover:text-primary font-medium flex items-center gap-1"
                  title="Mahal, Ekipman ve Seçilen Not ile Tespit Metnini Otomatik Üret"
                >
                  <Sparkles className="w-3 h-3 text-primary" />
                  Metni Otomatik Oluştur
                </Button>
              )}
            </div>
            <textarea
              rows={3}
              placeholder={isGrounding ? "Ekipman ve standart not seçildiğinde tespit metni otomatik oluşur..." : "Gözlemlenen uygunsuzluk ve tespit..."}
              value={formData.finding}
              onChange={e => setFormData({ ...formData, finding: e.target.value })}
              className="w-full p-3 rounded-lg border bg-background text-foreground text-xs outline-none resize-none"
              required
            />
            {isGrounding && standardNoteCode && (
              <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Mahal ve ekipman değiştikçe tespit metni otomatik güncellenir, dilerseniz metni serbestçe düzenleyebilirsiniz.
              </p>
            )}
          </div>

          {/* Bulgu Fotoğrafları & Dokümanlar (WebP & PDF) */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Bulgu Fotoğrafları & Belgeleri (Maks. 3 Fotoğraf)
            </label>
            <ImprovementAttachmentManager
              facilityId={formData.facilityId}
              facilityName={facilities.find(f => f.id === formData.facilityId)?.shortName || facilities.find(f => f.id === formData.facilityId)?.name}
              photos={findingPhotos}
              onPhotosChange={setFindingPhotos}
              documents={documents}
              onDocumentsChange={setDocuments}
              maxPhotos={3}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              İş Planı
            </label>
            <textarea
              rows={2}
              placeholder="Planlanan aksiyon ve giderim yöntemi..."
              value={formData.actionPlan}
              onChange={e => setFormData({ ...formData, actionPlan: e.target.value })}
              className="w-full p-3 rounded-lg border bg-background text-foreground text-xs outline-none resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-primary block mb-1">
              Aksiyon / Açıklama
            </label>
            <textarea
              rows={2}
              placeholder="Başlangıç açıklaması veya notu..."
              value={formData.currentNote}
              onChange={e => setFormData({ ...formData, currentNote: e.target.value })}
              className="w-full p-3 rounded-lg border bg-background text-foreground text-xs outline-none resize-none"
            />
          </div>

          {/* Teknik Müdür Açıklaması */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Teknik Müdür Açıklaması
            </label>
            <textarea
              rows={2}
              placeholder="Teknik müdür değerlendirmesi..."
              value={formData.technicalManagerDesc}
              onChange={e => setFormData({ ...formData, technicalManagerDesc: e.target.value })}
              className="w-full p-3 rounded-lg border bg-background text-foreground text-xs outline-none resize-none"
            />
          </div>

          {/* Yapılan Keşif Notları */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Yapılan Keşif Notları
            </label>
            <textarea
              rows={2}
              placeholder="Saha keşif notları ve tespit detayları..."
              value={formData.discoveryNotes}
              onChange={e => setFormData({ ...formData, discoveryNotes: e.target.value })}
              className="w-full p-3 rounded-lg border bg-background text-foreground text-xs outline-none resize-none"
            />
          </div>

          {/* Bütçe ve Para Birimi */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Para Birimi
              </label>
              <select
                value={formData.currency}
                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none font-medium"
              >
                <option value="TRY">₺ - Türk Lirası (TRY)</option>
                <option value="USD">$ - Dolar (USD)</option>
                <option value="EUR">€ - Euro (EUR)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Tahmini Bütçe
              </label>
              <input
                type="number"
                step="any"
                placeholder="Örn: 15000"
                value={formData.estimatedBudget}
                onChange={e => setFormData({ ...formData, estimatedBudget: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Gerçekleşen Bütçe
              </label>
              <input
                type="number"
                step="any"
                placeholder="Örn: 12500"
                value={formData.actualBudget}
                onChange={e => setFormData({ ...formData, actualBudget: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none font-mono"
              />
            </div>
          </div>

          <div className="pt-3 border-t flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Vazgeç
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {loading ? 'Kaydediliyor...' : 'Kaydı Oluştur'}
            </Button>
          </div>

        </form>

      </div>
    </div>
  );
};

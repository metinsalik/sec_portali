import React, { useRef, useState } from 'react';
import {
  Sparkles,
  X,
  Loader2,
  CheckCircle2,
  FileText,
  Scale,
  ShoppingCart,
  HardHat,
  Package,
  Wrench,
  MoreHorizontal,
  Camera,
  Paperclip,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { uploadImprovementFiles } from './ImprovementMediaManager';
import type { ImprovementFileAttachment } from './types';

const API = import.meta.env.VITE_API_URL || '';

interface BulkActionTemplate {
  id: string;
  title: string;
  progress: number;
  status: string;
  icon: string;
}

const BULK_TEMPLATES: BulkActionTemplate[] = [
  { id: 'TALEP_ACILDI', title: 'Talep Açıldı', progress: 50, status: 'Devam Ediyor', icon: 'FileText' },
  { id: 'TEKLIF_KARSILASTIRMA', title: 'Teklif / Karşılaştırma', progress: 60, status: 'Devam Ediyor', icon: 'Scale' },
  { id: 'SS_SIPARIS', title: 'SS / Sipariş', progress: 70, status: 'Devam Ediyor', icon: 'ShoppingCart' },
  { id: 'SAHA_MUTEAHHIT', title: 'Saha / Müteahhit', progress: 80, status: 'Devam Ediyor', icon: 'HardHat' },
  { id: 'MALZEME_BEKLENIYOR', title: 'Malzeme Bekleniyor', progress: 85, status: 'Devam Ediyor', icon: 'Package' },
  { id: 'MONTAJ_UYGULAMA', title: 'Montaj / Uygulama', progress: 90, status: 'Devam Ediyor', icon: 'Wrench' },
  { id: 'TAMAMLANDI', title: 'Giderim & Test Tamamlandı', progress: 100, status: 'Tamamlandı', icon: 'CheckCircle2' },
  { id: 'DIGER', title: 'Serbest Aksiyon / Not', progress: 25, status: 'Devam Ediyor', icon: 'MoreHorizontal' },
];

interface BulkActionNoteDialogProps {
  open: boolean;
  selectedIds: string[];
  facilityId?: string;
  facilityName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const BulkActionNoteDialog: React.FC<BulkActionNoteDialogProps> = ({
  open,
  selectedIds,
  facilityId,
  facilityName,
  onClose,
  onSuccess,
}) => {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('TALEP_ACILDI');
  const [status, setStatus] = useState<string>('Devam Ediyor');
  const [progress, setProgress] = useState<number>(50);
  const [note, setNote] = useState<string>('');
  const [actionPlan, setActionPlan] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [evidencePhotos, setEvidencePhotos] = useState<ImprovementFileAttachment[]>([]);
  const [attachedDocs, setAttachedDocs] = useState<ImprovementFileAttachment[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const activeTemplate = BULK_TEMPLATES.find((t) => t.id === selectedTemplateId) || BULK_TEMPLATES[0];

  const handleSelectTemplate = (tpl: BulkActionTemplate) => {
    setSelectedTemplateId(tpl.id);
    setStatus(tpl.status);
    setProgress(tpl.progress);
  };

  const getStepIcon = (iconName?: string) => {
    switch (iconName) {
      case 'FileText':
        return <FileText className="w-3.5 h-3.5" />;
      case 'Scale':
        return <Scale className="w-3.5 h-3.5" />;
      case 'ShoppingCart':
        return <ShoppingCart className="w-3.5 h-3.5" />;
      case 'HardHat':
        return <HardHat className="w-3.5 h-3.5" />;
      case 'Package':
        return <Package className="w-3.5 h-3.5" />;
      case 'Wrench':
        return <Wrench className="w-3.5 h-3.5" />;
      case 'CheckCircle2':
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      default:
        return <MoreHorizontal className="w-3.5 h-3.5" />;
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const remaining = Math.max(0, 3 - evidencePhotos.length);
    if (remaining === 0) {
      toast.error('En fazla 3 ortak kanıt fotoğrafı ekleyebilirsiniz.');
      return;
    }
    setUploadingPhoto(true);
    try {
      const uploaded = await uploadImprovementFiles(
        Array.from(files).slice(0, remaining),
        facilityId || 'ALL',
        facilityName || 'Toplu_Aksiyon'
      );
      setEvidencePhotos((prev) => [...prev, ...uploaded]);
      toast.success(`${uploaded.length} fotoğraf eklendi.`);
    } catch (err: any) {
      toast.error('Fotoğraf yüklenemedi: ' + (err?.message || 'Hata'));
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingDoc(true);
    try {
      const uploaded = await uploadImprovementFiles(
        Array.from(files),
        facilityId || 'ALL',
        facilityName || 'Toplu_Aksiyon'
      );
      setAttachedDocs((prev) => [...prev, ...uploaded]);
      toast.success(`${uploaded.length} doküman eklendi.`);
    } catch (err: any) {
      toast.error('Doküman yüklenemedi: ' + (err?.message || 'Hata'));
    } finally {
      setUploadingDoc(false);
      if (docInputRef.current) docInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim() && !actionPlan.trim() && evidencePhotos.length === 0 && attachedDocs.length === 0) {
      toast.error('Lütfen ortak aksiyon açıklaması, iş planı veya kanıt ekleyin.');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/operations/improvements/records/bulk-action-note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          ids: selectedIds,
          currentNote: note.trim(),
          status,
          progress: status === 'Tamamlandı' ? 100 : status === 'Başlamadı' ? 0 : progress,
          actionPlan: actionPlan.trim() || undefined,
          dueDate: dueDate || undefined,
          evidencePhotos,
          documents: attachedDocs,
          stepType: activeTemplate.id,
          stepTitle: activeTemplate.title,
        }),
      });

      const d = await res.json();
      if (!res.ok || !d.success) {
        throw new Error(d.message || 'Toplu aksiyon kaydedilemedi.');
      }

      toast.success(d.message || `${selectedIds.length} kayda toplu aksiyon işlendi.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Toplu aksiyon sırasında hata oluştu.');
    } finally {
      setSubmitting(false);
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
              Toplu Aksiyon Girişi
              <Badge className="bg-primary/15 text-primary border border-primary/30 text-xs tabular-nums">
                {selectedIds.length} Kayıt Seçili
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Gireceğiniz aksiyon adımı, durum ve ilerleme yüzdesi seçilen tüm kayıtlara ve geçmişlerine tek seferde işlenir.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto text-xs">
          {/* 1. AŞAMA / KALIP SEÇİMİ */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground block">
              1. Aksiyon Aşamasını Seçin:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BULK_TEMPLATES.map((tpl) => {
                const isSelected = selectedTemplateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl)}
                    className={cn(
                      'p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer',
                      isSelected
                        ? 'bg-primary/10 border-primary shadow-xs ring-1 ring-primary text-foreground font-bold'
                        : 'bg-card border-border/70 hover:border-border hover:bg-muted/40 text-muted-foreground'
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div
                        className={cn(
                          'w-6 h-6 rounded-lg flex items-center justify-center',
                          isSelected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {getStepIcon(tpl.icon)}
                      </div>
                      <span
                        className={cn(
                          'text-[10px] font-black px-1.5 py-0.5 rounded border tabular-nums',
                          tpl.id === 'TAMAMLANDI'
                            ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                            : 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30'
                        )}
                      >
                        %{tpl.progress}
                      </span>
                    </div>
                    <span className="text-xs truncate block font-semibold leading-tight">
                      {tpl.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. DURUM VE HEDEF İLERLEME */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/70">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground block">Yeni Durum</label>
              <select
                value={status}
                onChange={(e) => {
                  const val = e.target.value;
                  setStatus(val);
                  if (val === 'Tamamlandı') setProgress(100);
                  else if (val === 'Başlamadı') setProgress(0);
                }}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-foreground text-xs outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Başlamadı">Başlamadı</option>
                <option value="Devam Ediyor">Devam Ediyor</option>
                <option value="Tamamlandı">Tamamlandı</option>
                <option value="İptal Edildi">İptal Edildi</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Hedef İlerleme (%)</span>
                <span className="font-bold text-primary tabular-nums">
                  %{status === 'Tamamlandı' ? 100 : status === 'Başlamadı' ? 0 : progress}
                </span>
              </label>
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                {[25, 50, 70, 85, 90, 100].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setProgress(p);
                      setStatus(p === 100 ? 'Tamamlandı' : 'Devam Ediyor');
                    }}
                    className={cn(
                      'px-2 py-1 rounded border text-[11px] font-bold tabular-nums cursor-pointer',
                      progress === p
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted text-muted-foreground border-border'
                    )}
                  >
                    %{p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. ORTAK AKSİYON AÇIKLAMASI */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground block">
              Ortak Aksiyon Açıklaması / Notu *
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Seçili tüm maddelere eklenecek aksiyon açıklamasını yazın (örn. Talep No: 2026-1452 ile toplu satınalma süreci başlatıldı)..."
              className="w-full p-3 rounded-xl border border-input bg-background text-foreground text-xs outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* 4. OPSİYONEL İŞ PLANI & TERMİN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground block">
                İş Planı <span className="text-muted-foreground font-normal">(Boş bırakılırsa mevcut korunur)</span>
              </label>
              <input
                type="text"
                value={actionPlan}
                onChange={(e) => setActionPlan(e.target.value)}
                placeholder="Değiştirmek istemiyorsanız boş bırakın..."
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-foreground text-xs outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground block">
                Yeni Termin Tarihi <span className="text-muted-foreground font-normal">(Opsiyonel)</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-foreground text-xs outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* 5. OPSİYONEL ORTAK KANIT FOTOĞRAF & DOKÜMAN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl border border-dashed border-input bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-primary" /> Ortak Fotoğraf ({evidencePhotos.length}/3)
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingPhoto || evidencePhotos.length >= 3}
                  onClick={() => photoInputRef.current?.click()}
                  className="h-7 text-[11px] gap-1"
                >
                  {uploadingPhoto ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  Ekle
                </Button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </div>
              {evidencePhotos.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {evidencePhotos.map((p, idx) => (
                    <div key={idx} className="relative w-12 h-12 rounded border overflow-hidden">
                      <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEvidencePhotos((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute top-0 right-0 bg-red-600 text-white p-0.5 rounded-bl"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl border border-dashed border-input bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-primary" /> Ortak Doküman ({attachedDocs.length})
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
                  Ekle
                </Button>
                <input
                  ref={docInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                  multiple
                  className="hidden"
                  onChange={handleDocUpload}
                />
              </div>
              {attachedDocs.length > 0 && (
                <div className="space-y-1 max-h-16 overflow-y-auto">
                  {attachedDocs.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] bg-background px-2 py-0.5 rounded border">
                      <span className="truncate">{doc.name}</span>
                      <button
                        type="button"
                        onClick={() => setAttachedDocs((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-destructive ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ALT BUTONLAR */}
          <div className="pt-3 border-t flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={submitting}>
              Vazgeç
            </Button>
            <Button type="submit" size="sm" disabled={submitting} className="gap-1.5">
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              {selectedIds.length} Kayda Toplu Uygula
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

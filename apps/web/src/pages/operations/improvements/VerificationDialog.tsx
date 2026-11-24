import React, { useState, useMemo } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  ClipboardCheck,
  CheckSquare,
  Square,
  Loader2,
  RotateCcw,
  ChevronDown,
  FileText,
  Camera,
  User,
  ExternalLink,
  ChevronsDown,
  ChevronsUp,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import {
  type ImprovementRecord,
  type ImprovementRecordVerification,
  type ImprovementFileAttachment,
  type ImprovementCheckedAction,
  type VerificationResultType,
  formatAttachmentName,
} from './types';
import { ImprovementAttachmentManager } from './ImprovementMediaManager';

const API = import.meta.env.VITE_API_URL || '';

interface VerificationDialogProps {
  record: ImprovementRecord;
  existingVerification?: ImprovementRecordVerification | null;
  onClose: () => void;
  onSuccess: (updatedRecord?: ImprovementRecord) => void;
}

interface RichChecklistItem {
  id: string;
  headerTitle: string;
  fullText: string;
  meta?: string;
  statusBadge?: string | null;
  photos?: ImprovementFileAttachment[];
  documents?: ImprovementFileAttachment[];
}

export const VerificationDialog: React.FC<VerificationDialogProps> = ({
  record,
  existingVerification,
  onClose,
  onSuccess,
}) => {
  const isEditing = Boolean(existingVerification);

  // 3. Adımdaki aksiyon geçmişi (doğrulama logları hariç)
  const actionSteps = useMemo(() => {
    const raw = Array.isArray(record.histories) ? record.histories : [];
    return raw.filter((h) => h.stepType !== 'DOGRULAMA');
  }, [record.histories]);

  // Tüm kontrol maddelerini EKSİKSİZ (kırpmadan) oluştur
  const richChecklistItems = useMemo<RichChecklistItem[]>(() => {
    const items: RichChecklistItem[] = [];

    if (actionSteps.length > 0) {
      actionSteps.forEach((h, idx) => {
        const stepNum = actionSteps.length - idx;
        const dateStr = new Date(h.createdAt).toLocaleDateString('tr-TR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        const actor = h.changedByName || h.changedBy || 'Kullanıcı';
        items.push({
          id: h.id,
          headerTitle: `Adım ${stepNum}: ${h.stepTitle || 'Aksiyon Girişi'}`,
          fullText: h.newNote || 'Açıklama girilmemiş.',
          meta: `${actor} • ${dateStr}`,
          statusBadge: h.newStatus || null,
          photos: Array.isArray(h.evidencePhotos) ? h.evidencePhotos : [],
          documents: Array.isArray(h.documents) ? h.documents : [],
        });
      });
    } else {
      if (record.actionPlan && record.actionPlan.trim()) {
        items.push({
          id: 'action_plan',
          headerTitle: 'Planlanan Faaliyet (İş Planı) Kontrolü',
          fullText: record.actionPlan.trim(),
        });
      }
      if (record.currentNote && record.currentNote.trim()) {
        items.push({
          id: 'current_note',
          headerTitle: 'Güncel Durum & Alınan Aksiyon Açıklaması',
          fullText: record.currentNote.trim(),
        });
      }
      if (record.discoveryNotes && record.discoveryNotes.trim()) {
        items.push({
          id: 'discovery_notes',
          headerTitle: 'Yapılan Saha Keşif Notları',
          fullText: record.discoveryNotes.trim(),
        });
      }
      if (record.technicalManagerDesc && record.technicalManagerDesc.trim()) {
        items.push({
          id: 'tech_manager_desc',
          headerTitle: 'Teknik Hizmetler Açıklaması (Teknik Müdür Değerlendirmesi)',
          fullText: record.technicalManagerDesc.trim(),
        });
      }
      if (items.length === 0) {
        items.push({
          id: 'general_check',
          headerTitle: 'Genel Durum & Saha Uygunluk Kontrolü',
          fullText: `Mevcut durum (${record.status}) ve bulguya ilişkin saha uygunluğu yerinde kontrol edildi.`,
        });
      }
    }

    return items;
  }, [
    actionSteps,
    record.actionPlan,
    record.currentNote,
    record.discoveryNotes,
    record.technicalManagerDesc,
    record.status,
  ]);

  // Seçim durumları (düzenleme modundaysa kayıtlı seçimleri eşle)
  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    const saved = Array.isArray(existingVerification?.checkedActions)
      ? existingVerification!.checkedActions
      : [];
    richChecklistItems.forEach((item) => {
      const found = saved.find((s) => s.id === item.id);
      map[item.id] = found ? Boolean(found.checked) : false;
    });
    return map;
  });

  // Akordiyon aç/kapa durumları (2 veya daha az madde varsa varsayılan açık gelsin)
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    const defaultOpen = richChecklistItems.length <= 2;
    richChecklistItems.forEach((item, idx) => {
      map[item.id] = defaultOpen || idx === 0;
    });
    return map;
  });
  const [showFindingSummary, setShowFindingSummary] = useState<boolean>(false);

  const [result, setResult] = useState<VerificationResultType>(
    (existingVerification?.result as VerificationResultType) || 'DOGRULANDI'
  );
  const [verificationDate, setVerificationDate] = useState<string>(() => {
    if (existingVerification?.verificationDate) {
      return new Date(existingVerification.verificationDate).toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState<string>(existingVerification?.notes || '');
  const [photos, setPhotos] = useState<ImprovementFileAttachment[]>(
    Array.isArray(existingVerification?.photos) ? existingVerification.photos : []
  );
  const [documents, setDocuments] = useState<ImprovementFileAttachment[]>(
    Array.isArray(existingVerification?.documents) ? existingVerification.documents : []
  );
  const [reopenFinding, setReopenFinding] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const checkedCount = richChecklistItems.filter((item) => checkedMap[item.id]).length;
  const allChecked = richChecklistItems.length > 0 && checkedCount === richChecklistItems.length;
  const allExpanded = richChecklistItems.length > 0 && richChecklistItems.every((item) => expandedItems[item.id]);

  const toggleActionCheck = (id: string) => {
    setCheckedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAllActions = () => {
    const nextVal = !allChecked;
    const next: Record<string, boolean> = {};
    richChecklistItems.forEach((item) => {
      next[item.id] = nextVal;
    });
    setCheckedMap(next);
  };

  const toggleExpandItem = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleExpandAll = () => {
    const nextVal = !allExpanded;
    const next: Record<string, boolean> = {};
    richChecklistItems.forEach((item) => {
      next[item.id] = nextVal;
    });
    setExpandedItems(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      toast.error('Lütfen doğrulama kontrol açıklamasını giriniz.');
      return;
    }

    // Tam metinleri kırpmadan kaydet
    const checkedActionsPayload: ImprovementCheckedAction[] = richChecklistItems.map((item) => ({
      id: item.id,
      title: `${item.headerTitle}: ${item.fullText}`,
      checked: Boolean(checkedMap[item.id]),
    }));

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const url = isEditing && existingVerification
        ? `${API}/api/operations/improvements/records/${record.id}/verifications/${existingVerification.id}`
        : `${API}/api/operations/improvements/records/${record.id}/verifications`;

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          result,
          verificationDate,
          notes: notes.trim(),
          checkedActions: checkedActionsPayload,
          photos,
          documents,
          reopenFinding: !isEditing && result !== 'DOGRULANDI' ? reopenFinding : false,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Doğrulama kaydı kaydedilemedi.');
      }

      toast.success(isEditing ? 'Doğrulama kaydı güncellendi.' : 'Doğrulama kaydı başarıyla eklendi.');
      onSuccess(data.data);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Doğrulama kaydedilirken hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card text-card-foreground border rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-4">
        {/* Başlık */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-foreground">
                {isEditing ? 'Doğrulama Kaydını Düzenle' : '4. Adım — Doğrulama & Kapanış Kontrolü'}
              </h3>
              <p className="text-xs text-muted-foreground">
                Kayıt #{record.rowNo || '-'} • Mevcut Durum:{' '}
                <strong className="text-foreground">{record.status}</strong> (%{record.status === 'Tamamlandı' ? 100 : (record.progress ?? 0)})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto text-xs">
          {/* 0. Bulgu & Mevcut Durum Tam Özeti (Açılır/Kapanır Akordiyon) */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowFindingSummary((v) => !v)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between gap-2 text-left hover:bg-amber-500/10 transition-colors"
            >
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                Bulgu ve Mevcut Kayıt Bilgileri (Tam Metin)
              </span>
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1 shrink-0">
                {showFindingSummary ? 'Gizle' : 'Tamamını Göster'}
                <ChevronDown className={`w-4 h-4 transition-transform ${showFindingSummary ? 'rotate-180' : ''}`} />
              </span>
            </button>
            {showFindingSummary && (
              <div className="px-3.5 pb-3.5 pt-2 border-t border-amber-500/20 space-y-2.5 bg-background/80">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
                    Tespit / Uygunsuzluk:
                  </span>
                  <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                    {record.finding}
                  </p>
                </div>
                {record.actionPlan && (
                  <div className="pt-2 border-t border-border/50">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
                      Planlanan İş Planı:
                    </span>
                    <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                      {record.actionPlan}
                    </p>
                  </div>
                )}
                {record.currentNote && (
                  <div className="pt-2 border-t border-border/50">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary block mb-0.5">
                      Güncel Durum &amp; Aksiyon Açıklaması:
                    </span>
                    <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                      {record.currentNote}
                    </p>
                  </div>
                )}
                {record.discoveryNotes && (
                  <div className="pt-2 border-t border-border/50">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block mb-0.5">
                      Yapılan Saha Keşif Notları:
                    </span>
                    <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                      {record.discoveryNotes}
                    </p>
                  </div>
                )}
                {record.technicalManagerDesc && (
                  <div className="pt-2 border-t border-border/50">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 block mb-0.5">
                      Teknik Müdür Değerlendirmesi:
                    </span>
                    <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                      {record.technicalManagerDesc}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 1. Yapılan Aksiyonları Kontrol Et (Tam Metin Akordiyon Kartları) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                Yapılan Aksiyonların Kontrol Listesi ({checkedCount}/{richChecklistItems.length})
              </label>
              <div className="flex items-center gap-3">
                {richChecklistItems.length > 1 && (
                  <button
                    type="button"
                    onClick={toggleExpandAll}
                    className="text-[11px] font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  >
                    {allExpanded ? (
                      <>
                        <ChevronsUp className="w-3.5 h-3.5" /> Tümünü Daralt
                      </>
                    ) : (
                      <>
                        <ChevronsDown className="w-3.5 h-3.5" /> Tümünü Aç
                      </>
                    )}
                  </button>
                )}
                {richChecklistItems.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleAllActions}
                    className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    {allChecked ? 'Seçimleri Kaldır' : 'Tümünü Kontrol Edildi İşaretle'}
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2 p-2.5 rounded-xl bg-muted/30 border">
              {richChecklistItems.map((item) => {
                const isChecked = Boolean(checkedMap[item.id]);
                const isOpen = Boolean(expandedItems[item.id]);
                const photoCount = item.photos?.length || 0;
                const docCount = item.documents?.length || 0;

                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border transition-all overflow-hidden ${
                      isChecked
                        ? 'bg-emerald-500/10 border-emerald-500/40'
                        : 'bg-background border-border/80'
                    }`}
                  >
                    {/* Akordiyon Üst Satır */}
                    <div className="p-2.5 flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => toggleActionCheck(item.id)}
                        className="flex items-start gap-2.5 text-left flex-1 min-w-0 cursor-pointer"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <Square className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-foreground">{item.headerTitle}</span>
                            {item.statusBadge && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {item.statusBadge}
                              </Badge>
                            )}
                            {photoCount > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                                <Camera className="w-3 h-3 text-blue-500" /> {photoCount}
                              </span>
                            )}
                            {docCount > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                                <FileText className="w-3 h-3 text-red-500" /> {docCount}
                              </span>
                            )}
                          </div>
                          {item.meta && (
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <User className="w-3 h-3" /> {item.meta}
                            </p>
                          )}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleExpandItem(item.id)}
                        className="px-2 py-1 rounded-lg border border-border/70 bg-muted/40 hover:bg-muted text-[10px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 shrink-0 transition-colors"
                      >
                        <span>{isOpen ? 'Gizle' : 'Detay'}</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

                    {/* Akordiyon Açık İçerik: EKSİKSİZ TAM METİN & EKLER */}
                    {isOpen && (
                      <div className="px-3 pb-3 pt-2 border-t border-border/50 bg-background/80 space-y-2.5">
                        <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                          {item.fullText}
                        </p>

                        {photoCount > 0 && (
                          <div className="flex items-center gap-2 flex-wrap pt-1">
                            {item.photos!.map((p, idx) => (
                              <a
                                key={idx}
                                href={p.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-14 h-14 rounded-lg overflow-hidden border border-border hover:border-primary transition-colors block"
                                title={p.name}
                              >
                                <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                              </a>
                            ))}
                          </div>
                        )}

                        {docCount > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {item.documents!.map((doc, idx) => (
                              <a
                                key={idx}
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border bg-muted/40 hover:bg-muted text-[11px] font-medium text-foreground"
                              >
                                <FileText className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                <span>{formatAttachmentName(doc.name)}</span>
                                <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Doğrulama Sonucu */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground block">Doğrulama Sonucu *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                {
                  id: 'DOGRULANDI' as VerificationResultType,
                  label: 'Doğrulandı (Uygun)',
                  desc: 'Aksiyonlar sahada / belgeyle doğrulandı',
                  icon: CheckCircle2,
                  activeClass: 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20 text-emerald-800 dark:text-emerald-300',
                  iconClass: 'text-emerald-600',
                },
                {
                  id: 'KISMI' as VerificationResultType,
                  label: 'Kısmen Doğrulandı',
                  desc: 'Kısmi giderim var, ek takip gerekiyor',
                  icon: AlertTriangle,
                  activeClass: 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20 text-amber-800 dark:text-amber-300',
                  iconClass: 'text-amber-600',
                },
                {
                  id: 'RED' as VerificationResultType,
                  label: 'Uygun Değil',
                  desc: 'Yetersiz / tekrar aksiyon gerekli',
                  icon: XCircle,
                  activeClass: 'border-red-500 bg-red-500/10 ring-2 ring-red-500/20 text-red-800 dark:text-red-300',
                  iconClass: 'text-red-600',
                },
              ].map((opt) => {
                const Icon = opt.icon;
                const selected = result === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setResult(opt.id)}
                    className={`p-3 rounded-xl border text-left transition-all space-y-1 cursor-pointer ${
                      selected
                        ? opt.activeClass
                        : 'border-border/70 bg-background hover:bg-muted/40 text-muted-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Icon className={`w-4 h-4 shrink-0 ${opt.iconClass}`} />
                      <span>{opt.label}</span>
                    </div>
                    <p className="text-[10px] leading-tight opacity-85">{opt.desc}</p>
                  </button>
                );
              })}
            </div>

            {!isEditing && result !== 'DOGRULANDI' && record.status === 'Tamamlandı' && (
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 cursor-pointer mt-2">
                <input
                  type="checkbox"
                  checked={reopenFinding}
                  onChange={(e) => setReopenFinding(e.target.checked)}
                  className="rounded border-amber-400"
                />
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                <span className="font-semibold">
                  Bulgunun mevcut durumunu &quot;Tamamlandı&quot; yerine &quot;Devam Ediyor (%75)&quot; olarak yeniden aç
                </span>
              </label>
            )}
          </div>

          {/* 3. Doğrulama Tarihi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                Doğrulama Tarihi *
              </label>
              <input
                type="date"
                value={verificationDate}
                onChange={(e) => setVerificationDate(e.target.value)}
                required
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground block">Mevcut Kayıt Durumu</label>
              <div className="h-9 px-3 rounded-lg border bg-muted/40 flex items-center justify-between">
                <span className="font-semibold text-foreground">{record.status}</span>
                <Badge variant="outline" className="text-[10px]">
                  Tamamlandı olsa bile doğrulanabilir
                </Badge>
              </div>
            </div>
          </div>

          {/* 4. Doğrulama Değerlendirme Notu */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground block">
              Doğrulama Değerlendirme &amp; Saha Kontrol Açıklaması *
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Yapılan aksiyonların yerinde kontrolü, test/ölçüm sonuçları, eksik veya uygun görülen hususları detaylıca yazınız..."
              required
              className="w-full p-3 rounded-xl border bg-background text-foreground text-xs leading-relaxed outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>

          {/* 5. Doğrulama Görselleri ve Dokümanları */}
          <div className="space-y-2 pt-2 border-t">
            <label className="text-xs font-bold text-foreground block">
              Doğrulama Kanıt Görselleri ve Dokümanları
            </label>
            <ImprovementAttachmentManager
              facilityId={record.facilityId}
              facilityName={record.facility?.name || record.facilityId}
              photos={photos}
              onPhotosChange={setPhotos}
              documents={documents}
              onDocumentsChange={setDocuments}
              maxPhotos={6}
              photoLabel="Doğrulama Fotoğrafları"
            />
          </div>

          {/* Alt Butonlar */}
          <div className="pt-3 border-t flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={saving}>
              Vazgeç
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  {isEditing ? 'Doğrulamayı Güncelle' : 'Doğrulamayı Kaydet'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

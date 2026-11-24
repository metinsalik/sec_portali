import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  MapPin,
  Calendar,
  Building2,
  Tag,
  Camera,
  FileText,
  Download,
  Eye,
  MessageSquare,
  Plus,
  X,
  Upload,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useIRSC } from '../context/IRSCContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DepartmentSelect } from '@/components/shared/DepartmentSelect';
import {
  type ActionStep,
  type StepStatus,
  type ImprovementStatus,
  normalizeRiskLevel,
  getRiskBadgeClass,
  getRiskBorderClass,
} from '../types';
import { saveAudit, uploadAuditFiles } from '../services/auditApi';
import { formatCleanLocation } from '../components/AuditFindingsList';
import {
  ImprovementMediaLightbox,
  formatBytes,
} from '../../operations/improvements/ImprovementMediaManager';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function AuditFindingDetailPage() {
  const { id: auditId, findingId } = useParams<{ id: string; findingId: string }>();
  const navigate = useNavigate();
  const { audits, setAudits, facilities } = useIRSC();
  const { user } = useAuth();

  const isManager = !!(
    user?.isAdmin ||
    user?.isManagement ||
    user?.roles?.includes('admin') ||
    user?.roles?.includes('management') ||
    user?.roles?.includes('safety')
  );

  const audit = useMemo(() => audits.find((a) => a.id === auditId), [audits, auditId]);
  const finding = useMemo(
    () => audit?.findings.find((f) => f.id === findingId),
    [audit, findingId]
  );

  const facility = useMemo(
    () => facilities.find((f) => f.id === audit?.meta?.locationId),
    [facilities, audit]
  );

  const isPublished = audit?.status === 'PUBLISHED';

  const [showActionForm, setShowActionForm] = useState(false);
  const [savingAction, setSavingAction] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [newAction, setNewAction] = useState<Partial<ActionStep>>({
    department: '',
    status: 'Devam Ediyor',
    actionDate: new Date().toISOString().split('T')[0],
    explanation: '',
    files: [],
  });

  const [lightboxState, setLightboxState] = useState<{
    photos: { url: string; name: string; type: string; size?: number }[];
    index: number;
  } | null>(null);

  if (!audit || !finding) {
    return (
      <Card>
        <CardContent className="py-16 text-center space-y-3">
          <p className="text-sm font-semibold text-foreground">Bulgu bulunamadı</p>
          <p className="text-xs text-muted-foreground">
            Kayıt silinmiş olabilir veya veriler henüz yükleniyor.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              navigate(auditId ? `/renovation-report/workspace/${auditId}` : '/renovation-report/drafts')
            }
          >
            ← Çalışma Alanına Dön
          </Button>
        </CardContent>
      </Card>
    );
  }

  const normRisk = normalizeRiskLevel(finding.risk);
  const borderLeft = getRiskBorderClass(normRisk);
  const cleanLocation = formatCleanLocation(finding);
  const photos = (finding.files || []).filter((f) => f.type?.startsWith('image/'));
  const docs = (finding.files || []).filter((f) => !f.type?.startsWith('image/'));
  const allDepts = Array.from(
    new Set([...(finding.departments || []), ...(finding.steps?.map((s) => s.department) || [])])
  ).filter(Boolean);
  const isOverdue =
    finding.status !== 'Tamamlanan' &&
    Boolean(finding.targetDate) &&
    new Date(finding.targetDate!) < new Date();

  const persistFindings = async (updatedFindings: typeof audit.findings, successMsg: string) => {
    setSavingAction(true);
    try {
      const savedAudit = await saveAudit(
        {
          ...audit,
          findings: updatedFindings,
        },
        audit.meta.locationId
      );
      setAudits(audits.map((a) => (a.id === audit.id ? savedAudit : a)));
      toast.success(successMsg);
    } catch {
      toast.error('Değişiklik kaydedilemedi.');
    } finally {
      setSavingAction(false);
    }
  };

  const handleToggleStatus = () => {
    const nextStatus: ImprovementStatus =
      finding.status === 'Tamamlanan' ? 'Yeni Tespit Edilen' : 'Tamamlanan';
    const updated = audit.findings.map((f) =>
      f.id === finding.id ? { ...f, status: nextStatus } : f
    );
    persistFindings(
      updated,
      nextStatus === 'Tamamlanan' ? 'Bulgu kapatıldı.' : 'Bulgu tekrar açıldı.'
    );
  };

  const handleAddAction = async () => {
    if (!newAction.department || !newAction.explanation?.trim()) {
      toast.error('Lütfen sorumlu departman ve açıklama alanlarını doldurun.');
      return;
    }

    const step: ActionStep = {
      id: generateUUID(),
      department: newAction.department,
      title: newAction.title || '',
      order: (finding.steps?.length || 0) + 1,
      status: (newAction.status as StepStatus) || 'Devam Ediyor',
      actionDate: newAction.actionDate || new Date().toISOString().split('T')[0],
      files: newAction.files || [],
      explanation: newAction.explanation.trim(),
    };

    const nextFindingStatus: ImprovementStatus =
      step.status === 'Tamamlandı'
        ? 'Tamamlanan'
        : step.status === 'Devam Ediyor'
        ? 'Kısmen İyileştirilen'
        : finding.status;

    const updated = audit.findings.map((f) =>
      f.id === finding.id
        ? { ...f, status: nextFindingStatus, steps: [...(f.steps || []), step] }
        : f
    );

    await persistFindings(updated, 'Aksiyon adımı eklendi.');
    setShowActionForm(false);
    setNewAction({
      department: '',
      status: 'Devam Ediyor',
      actionDate: new Date().toISOString().split('T')[0],
      explanation: '',
      files: [],
    });
  };

  return (
    <div className="space-y-4">
      {/* Sticky / Compact Page Header */}
      <Card>
        <CardContent className="p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => navigate(`/renovation-report/workspace/${audit.id}`)}
              aria-label="Rapor çalışma alanına dön"
              className="h-8 w-8 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground tabular-nums">
                  {finding.no}
                </h1>
                <Badge className={`text-xs border ${getRiskBadgeClass(normRisk)}`}>{normRisk}</Badge>
                <Badge
                  variant="outline"
                  className={`text-xs gap-1 ${
                    finding.status === 'Tamamlanan'
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                      : finding.status === 'Kısmen İyileştirilen'
                      ? 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30'
                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                  }`}
                >
                  {finding.status === 'Tamamlanan' ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <AlertTriangle className="w-3 h-3" />
                  )}
                  {finding.status || 'Yeni Tespit Edilen'}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap mt-0.5">
                <span>{audit.meta.reportNo || 'Denetim Raporu'}</span>
                {facility && (
                  <>
                    <span>•</span>
                    <span>{facility.name}</span>
                  </>
                )}
                <span>•</span>
                <span className="font-mono text-[11px]">{finding.id}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isPublished && isManager && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={savingAction}
                  onClick={handleToggleStatus}
                  className="h-8 text-xs gap-1.5"
                >
                  {finding.status === 'Tamamlanan' ? (
                    <>
                      <X className="w-3.5 h-3.5" /> Tekrar Aç
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Bulguyu Kapat
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    navigate(`/renovation-report/workspace/${audit.id}/findings/${finding.id}/edit`)
                  }
                  className="h-8 text-xs gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Düzenle
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid (2-column on desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 8 Cols: Finding Details + Media + Action History */}
        <div className="lg:col-span-8 space-y-4">
          <Card className={`border-l-4 ${borderLeft}`}>
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-semibold">Bulgu Detayları</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Tespit (Mevcut Durum)
                </span>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {finding.findingDesc || 'Belirtilmemiş.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-red-700 dark:text-red-400 block mb-1">
                    Risk (Etki ve Sonuçları)
                  </span>
                  <p className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {finding.riskDesc || 'Belirtilmemiş.'}
                  </p>
                </div>

                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-primary block mb-1">
                    Öneri / Düzeltici Faaliyet
                  </span>
                  <p className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {finding.recommendation || 'Belirtilmemiş.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Media & Documents Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Camera className="w-4 h-4 text-primary" />
                Fotoğraflar &amp; Dokümanlar
                <Badge variant="secondary" className="text-[10px] tabular-nums">
                  {photos.length} foto · {docs.length} doküman
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4">
              {photos.length === 0 && docs.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border rounded-lg">
                  Bu bulguya henüz fotoğraf veya doküman eklenmemiş.
                </p>
              ) : (
                <>
                  {photos.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {photos.map((photo, idx) => (
                        <button
                          key={photo.url || idx}
                          type="button"
                          onClick={() => setLightboxState({ photos, index: idx })}
                          className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <img
                            src={photo.url}
                            alt={photo.name}
                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                          />
                          <span className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-white">
                            <Eye className="w-5 h-5" />
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {docs.length > 0 && (
                    <div className="space-y-1.5">
                      {docs.map((doc, idx) => (
                        <a
                          key={doc.url || idx}
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between gap-2 px-3 py-2 rounded-md border border-border bg-muted/20 hover:bg-muted/50 transition-colors text-xs"
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-primary shrink-0" />
                            <span className="truncate font-medium text-foreground">{doc.name}</span>
                            {doc.size ? (
                              <span className="text-[11px] text-muted-foreground tabular-nums">
                                ({formatBytes(doc.size)})
                              </span>
                            ) : null}
                          </span>
                          <Download className="w-4 h-4 text-muted-foreground shrink-0" />
                        </a>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Action History & Updates */}
          <Card>
            <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                Aksiyon Geçmişi ve Güncellemeler
                <Badge variant="secondary" className="text-[10px] tabular-nums">
                  {finding.steps?.length || 0}
                </Badge>
              </CardTitle>
              <Button
                type="button"
                size="sm"
                variant={showActionForm ? 'outline' : 'default'}
                onClick={() => setShowActionForm((v) => !v)}
                className="h-7 text-xs gap-1"
              >
                {showActionForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {showActionForm ? 'Vazgeç' : 'Aksiyon Ekle'}
              </Button>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4">
              {showActionForm && (
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Sorumlu Departman *
                      </label>
                      <DepartmentSelect
                        value={newAction.department || ''}
                        onChange={(val) => setNewAction({ ...newAction, department: val })}
                        placeholder="Departman seçin..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Durum
                      </label>
                      <select
                        value={newAction.status}
                        onChange={(e) =>
                          setNewAction({ ...newAction, status: e.target.value as StepStatus })
                        }
                        className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground"
                      >
                        <option value="Başlamadı">Başlamadı</option>
                        <option value="Devam Ediyor">Devam Ediyor</option>
                        <option value="Tamamlandı">Tamamlandı</option>
                        <option value="İptal Edildi">İptal Edildi</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        İşlem Tarihi
                      </label>
                      <Input
                        type="date"
                        value={newAction.actionDate || ''}
                        onChange={(e) => setNewAction({ ...newAction, actionDate: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Açıklama *
                    </label>
                    <textarea
                      rows={3}
                      value={newAction.explanation || ''}
                      onChange={(e) => setNewAction({ ...newAction, explanation: e.target.value })}
                      placeholder="Yapılan veya planlanan aksiyonu açıklayın..."
                      className="w-full p-2.5 rounded-md border border-input bg-background text-xs text-foreground"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-dashed border-input bg-background text-xs text-muted-foreground hover:text-foreground cursor-pointer">
                      {uploadingFiles ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      {newAction.files?.length
                        ? `${newAction.files.length} kanıt eklendi`
                        : 'Kanıt Foto/PDF Ekle'}
                      <input
                        type="file"
                        multiple
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={async (e) => {
                          if (!e.target.files?.length) return;
                          setUploadingFiles(true);
                          try {
                            const uploaded = await uploadAuditFiles(
                              Array.from(e.target.files),
                              audit.meta.locationId,
                              facility?.name
                            );
                            setNewAction((prev) => ({
                              ...prev,
                              files: [...(prev.files || []), ...uploaded],
                            }));
                            toast.success('Kanıt yüklendi.');
                          } catch {
                            toast.error('Dosya yüklenemedi.');
                          } finally {
                            setUploadingFiles(false);
                          }
                        }}
                      />
                    </label>

                    <Button
                      type="button"
                      size="sm"
                      disabled={savingAction || !newAction.department || !newAction.explanation?.trim()}
                      onClick={handleAddAction}
                      className="h-8 text-xs"
                    >
                      {savingAction && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                      Aksiyonu Kaydet
                    </Button>
                  </div>
                </div>
              )}

              {finding.steps && finding.steps.length > 0 ? (
                <div className="space-y-3">
                  {finding.steps.map((step, idx) => {
                    const stepPhotos = (step.files || []).filter((fl) => fl.type?.startsWith('image/'));
                    return (
                      <div
                        key={step.id || idx}
                        className="rounded-lg border border-border bg-card p-3.5 space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-semibold text-foreground">Adım {idx + 1}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="font-medium text-primary">{step.department}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {step.actionDate && (
                              <span className="text-[11px] text-muted-foreground tabular-nums">
                                {new Date(step.actionDate).toLocaleDateString('tr-TR')}
                              </span>
                            )}
                            <Badge variant="outline" className="text-[10px]">
                              {step.status}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                          {step.explanation || 'Açıklama girilmemiş.'}
                        </p>
                        {stepPhotos.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {stepPhotos.map((sp, spIdx) => (
                              <button
                                key={sp.url || spIdx}
                                type="button"
                                onClick={() => setLightboxState({ photos: stepPhotos, index: spIdx })}
                                className="w-12 h-12 rounded overflow-hidden border border-border"
                              >
                                <img src={sp.url} alt={sp.name} className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border rounded-lg">
                  Bu bulgu için henüz aksiyon veya güncelleme girilmemiş.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 4 Cols: Metadata Summary Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-semibold">Özet Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5 text-xs">
              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-primary" /> Lokasyon / Mahal
                </span>
                <p className="font-semibold text-foreground">{cleanLocation}</p>
              </div>

              <div className="space-y-1 pt-2.5 border-t border-border/60">
                <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                  <Tag className="w-3.5 h-3.5 text-primary" /> Kategori
                </span>
                <p className="font-medium text-foreground">
                  {[finding.mainCategory, finding.category, finding.subcategory]
                    .filter(Boolean)
                    .join(' › ') || 'Belirtilmemiş'}
                </p>
              </div>

              <div className="space-y-1 pt-2.5 border-t border-border/60">
                <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-primary" /> Sorumlu Departmanlar
                </span>
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {allDepts.length > 0 ? (
                    allDepts.map((d) => (
                      <Badge key={d} variant="secondary" className="text-[11px] font-normal">
                        {d}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">Atanmadı</span>
                  )}
                </div>
              </div>

              <div className="space-y-1 pt-2.5 border-t border-border/60">
                <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-primary" /> Termin Tarihi
                </span>
                <p className={`font-semibold tabular-nums ${isOverdue ? 'text-destructive' : 'text-foreground'}`}>
                  {finding.targetDate
                    ? new Date(finding.targetDate).toLocaleDateString('tr-TR')
                    : 'Belirtilmemiş'}
                  {isOverdue && ' (Gecikti)'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {lightboxState && (
        <ImprovementMediaLightbox
          photos={lightboxState.photos}
          initialIndex={lightboxState.index}
          onClose={() => setLightboxState(null)}
        />
      )}
    </div>
  );
}

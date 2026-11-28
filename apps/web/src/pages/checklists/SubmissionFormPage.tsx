import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Upload,
  MessageSquare,
  Info,
  Check,
  X,
  Save,
} from 'lucide-react';
import api, { BASE_URL } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { isChecklistItemVisible } from '@/utils/checklistConditions';

const getGradeAndColor = (percentScore: number | undefined | null) => {
  if (percentScore === undefined || percentScore === null || isNaN(percentScore))
    return { grade: '-', color: 'text-muted-foreground bg-muted' };
  if (percentScore >= 90)
    return { grade: 'A', color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/15' };
  if (percentScore >= 80)
    return { grade: 'B', color: 'text-blue-700 dark:text-blue-400 bg-blue-500/15' };
  if (percentScore >= 70)
    return { grade: 'C', color: 'text-amber-700 dark:text-amber-400 bg-amber-500/15' };
  if (percentScore >= 60)
    return { grade: 'D', color: 'text-orange-700 dark:text-orange-400 bg-orange-500/15' };
  return { grade: 'F', color: 'text-destructive bg-destructive/15 font-bold' };
};

export default function SubmissionFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [submission, setSubmission] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<Record<string, boolean>>({});
  const [expandedExtras, setExpandedExtras] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id && id !== 'new') {
      api
        .get(`/checklists/submissions/${id}`)
        .then(async (res) => {
          if (!res.ok) throw new Error('Denetim yüklenemedi');
          const data = await res.json();
          setSubmission(data);
          if (data.answers) {
            setAnswers(data.answers);
          }
        })
        .catch((err) => {
          console.error(err);
          toast.error('Denetim yüklenemedi.');
        });
    }
  }, [id]);

  const allTemplateItems = useMemo(
    () => (submission?.template?.sections || []).flatMap((s: any) => s.items || []),
    [submission]
  );

  const { earnedScore, maxScore, percentScore } = useMemo(() => {
    if (!submission?.template?.sections) return { earnedScore: 0, maxScore: 0, percentScore: 0 };
    let earned = 0;
    let max = 0;
    submission.template.sections.forEach((sec: any) => {
      sec.items.forEach((item: any) => {
        if (
          !isChecklistItemVisible(
            item,
            allTemplateItems,
            (itemId) => answers.find((a) => a.itemId === itemId),
            submission.template.scaleSet?.options || []
          )
        ) {
          return;
        }
        const ans = answers.find((a) => a.itemId === item.id);
        if (!ans || ans.notApplicable) return;
        if (item.questionType === 'SCALE' || item.questionType === 'YES_NO') {
          max += Number(item.weight) || 0;
          if (ans.earnedScore !== undefined && ans.earnedScore !== null) {
            earned += Number(ans.earnedScore);
          }
        }
      });
    });
    const percent = max > 0 ? (earned / max) * 100 : 0;
    return { earnedScore: earned, maxScore: max, percentScore: percent };
  }, [answers, submission, allTemplateItems]);

  if (id === 'new') {
    return (
      <div className="max-w-3xl mx-auto p-6 text-xs text-muted-foreground">
        Yeni denetim başlatmak için Şablonlar veya Denetimlerim sayfasını kullanın.
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="max-w-5xl mx-auto space-y-4 py-6">
        <div className="h-16 rounded-lg bg-muted animate-pulse" />
        <div className="h-48 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  const template = submission.template;
  const isViewMode =
    (submission.status === 'TAMAMLANDI' ||
      submission.status === 'ONAY_BEKLIYOR' ||
      submission.status === 'ONAYLANDI') &&
    searchParams.get('mode') !== 'edit';

  const hasManagerRole =
    user?.isAdmin ||
    user?.isManagement ||
    user?.roles?.includes('admin') ||
    user?.roles?.includes('management') ||
    user?.roles?.includes('specialist');

  const upsertAnswer = (itemId: string, patch: Record<string, any>) => {
    setAnswers((prev) => {
      const next = [...prev];
      const idx = next.findIndex((a) => a.itemId === itemId);
      if (idx >= 0) {
        next[idx] = { ...next[idx], ...patch };
      } else {
        next.push({ itemId, ...patch });
      }
      return next;
    });
  };

  const handleScaleChange = (item: any, scaleOptionId: string | null, multiplier: number | null) => {
    if (isViewMode) return;
    const weight = Number(item.weight) || 0;
    const mult = Number(multiplier) || 0;
    upsertAnswer(item.id, {
      scaleOptionId,
      notApplicable: multiplier === null,
      earnedScore: multiplier !== null ? weight * mult : 0,
    });
  };

  const handleYesNoChange = (item: any, val: boolean | null) => {
    if (isViewMode) return;
    const weight = Number(item.weight) || 0;
    upsertAnswer(item.id, {
      yesNoValue: val,
      notApplicable: val === null,
      earnedScore: val === true ? weight : 0,
    });
  };

  const validateSubmission = () => {
    const errors: string[] = [];
    template.sections.forEach((section: any) => {
      section.items.forEach((item: any) => {
        if (
          !isChecklistItemVisible(
            item,
            allTemplateItems,
            (itemId) => answers.find((a) => a.itemId === itemId),
            template.scaleSet?.options || []
          )
        ) {
          return;
        }
        const currentAnswer = answers.find((a) => a.itemId === item.id);
        if (!currentAnswer) {
          if (item.isRequired !== false) errors.push(`Soru yanıtlanmadı: #${item.itemNo}`);
          return;
        }
        if (currentAnswer.notApplicable) return;

        if (item.questionType === 'SCALE') {
          if (!currentAnswer.scaleOptionId) {
            errors.push(`Seçenek seçilmedi: #${item.itemNo}`);
            return;
          }
          const selectedOption = template.scaleSet?.options?.find(
            (o: any) => o.id === currentAnswer.scaleOptionId
          );
          const labelLower = selectedOption?.label?.toLowerCase().trim() || '';
          const isKarsiliyor =
            labelLower === 'karşılıyor' ||
            labelLower === 'uygun' ||
            labelLower === 'tamamen karşılıyor';
          if (
            selectedOption?.requiresExplanation &&
            !isKarsiliyor &&
            (!currentAnswer.note || currentAnswer.note.trim() === '')
          ) {
            errors.push(`Açıklama zorunlu: #${item.itemNo}`);
          }
          if (
            selectedOption?.requiresAttachment &&
            !isKarsiliyor &&
            (!currentAnswer.attachments || currentAnswer.attachments.length === 0)
          ) {
            errors.push(`Görsel zorunlu: #${item.itemNo}`);
          }
        } else if (item.questionType === 'YES_NO' && currentAnswer.yesNoValue == null) {
          errors.push(`Evet/Hayır seçilmedi: #${item.itemNo}`);
        }
      });
    });
    return { isValid: errors.length === 0, errors };
  };

  const handleSave = async (status: string) => {
    if (status === 'ONAY_BEKLIYOR' || status === 'TAMAMLANDI') {
      const validationResult = validateSubmission();
      if (!validationResult.isValid) {
        toast.error(`Eksik alanlar var: ${validationResult.errors.slice(0, 3).join(', ')}`);
        return;
      }
    }
    setSaving(true);
    try {
      const res = await api.put(`/checklists/submissions/${id}`, {
        status,
        answers,
        totalScore: earnedScore,
        maxScore,
        percentScore,
      });
      if (!res.ok) throw new Error('Kaydedilemedi');
      if (status === 'ONAY_BEKLIYOR') toast.success('Denetim onaya gönderildi.');
      else if (status === 'TAMAMLANDI') toast.success('Denetim onaylandı.');
      else toast.success('Taslak olarak kaydedildi.');
      navigate('/checklists/submissions');
    } catch {
      toast.error('Kaydedilirken hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const toggleExtras = (itemId: string) => {
    setExpandedExtras((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const gradeInfo = getGradeAndColor(percentScore);

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-24">
      {/* Sticky Header */}
      <Card className="rounded-lg border-border/80 sticky top-3 z-30 bg-card/95 backdrop-blur-md">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/checklists/submissions')}
              className="h-8 w-8 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-bold text-foreground truncate">{template.title}</h1>
                <Badge variant="outline" className="text-[10px]">
                  {submission.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {submission.facility?.name} • {submission.conductedBy?.fullName || 'Denetçi'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground">Skor</span>
              <div className="w-28 h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(percentScore, 100)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="text-right tabular-nums">
                <div className="text-sm font-bold text-foreground">
                  {earnedScore}
                  <span className="text-muted-foreground text-xs font-medium">/{maxScore}</span>
                </div>
                <div className="text-[10px] text-muted-foreground">%{percentScore.toFixed(0)}</div>
              </div>
              <div
                className={cn(
                  'w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm',
                  gradeInfo.color
                )}
              >
                {gradeInfo.grade}
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 border-l border-border pl-4">
              {isViewMode ? (
                hasManagerRole && submission.status === 'ONAY_BEKLIYOR' ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={saving}
                      className="h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => handleSave('BEKLEYEN')}
                    >
                      Reddet
                    </Button>
                    <Button
                      size="sm"
                      disabled={saving}
                      className="h-8 text-xs"
                      onClick={() => handleSave('TAMAMLANDI')}
                    >
                      Onayla
                    </Button>
                  </>
                ) : (
                  hasManagerRole && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => navigate(`/checklists/submissions/${id}?mode=edit`)}
                    >
                      Düzenle
                    </Button>
                  )
                )
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={saving}
                    className="h-8 text-xs gap-1"
                    onClick={() => handleSave('TASLAK')}
                  >
                    <Save className="w-3.5 h-3.5" /> Taslak Kaydet
                  </Button>
                  <Button
                    size="sm"
                    disabled={saving}
                    className="h-8 text-xs gap-1"
                    onClick={() => handleSave('TAMAMLANDI')}
                  >
                    <Send className="w-3.5 h-3.5" /> Tamamla &amp; Gönder
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sections & Questions */}
      <div className="space-y-5">
        {template.sections.map((section: any, sIdx: number) => (
          <Card key={section.id} className="rounded-lg border-border/80 overflow-hidden">
            <CardHeader className="py-3 px-4 border-b border-border bg-muted/20">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] uppercase">
                    Bölüm {sIdx + 1}
                  </Badge>
                  <span>{section.title}</span>
                </CardTitle>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {section.items?.length || 0} soru
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-0 divide-y divide-border">
              {[...(section.items || [])]
                .sort((a, b) => a.itemNo - b.itemNo)
                .filter((item: any) =>
                  isChecklistItemVisible(
                    item,
                    allTemplateItems,
                    (itemId) => answers.find((a) => a.itemId === itemId),
                    template.scaleSet?.options || []
                  )
                )
                .map((item: any) => {
                  const currentAnswer = answers.find((a) => a.itemId === item.id) || {};
                  const selectedOption = template.scaleSet?.options?.find(
                    (o: any) => o.id === currentAnswer.scaleOptionId
                  );
                  const labelLowerUI = selectedOption?.label?.toLowerCase().trim() || '';
                  const isKarsiliyorUI =
                    labelLowerUI === 'karşılıyor' ||
                    labelLowerUI === 'uygun' ||
                    labelLowerUI === 'tamamen karşılıyor';
                  const requiresExplanation = selectedOption?.requiresExplanation && !isKarsiliyorUI;
                  const requiresAttachment = selectedOption?.requiresAttachment && !isKarsiliyorUI;

                  const hasNote = !!currentAnswer.note;
                  const hasAttachment =
                    currentAnswer.attachments && currentAnswer.attachments.length > 0;
                  const shouldForceExpand =
                    (requiresExplanation && !hasNote) || (requiresAttachment && !hasAttachment);
                  const isExpanded =
                    expandedExtras[item.id] ||
                    item.questionType === 'PHOTO' ||
                    shouldForceExpand ||
                    hasNote ||
                    hasAttachment ||
                    isViewMode;

                  const catPath = [
                    item.config?.mainCategoryName,
                    item.config?.categoryName,
                    item.config?.subCategoryName,
                  ]
                    .filter(Boolean)
                    .join(' › ');

                  const refImgSrc = item.config?.imageUrl
                    ? item.config.imageUrl.startsWith('/uploads')
                      ? `${BASE_URL}${item.config.imageUrl}`
                      : item.config.imageUrl
                    : null;

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'p-4 sm:p-5 flex flex-col md:flex-row gap-5 transition-colors',
                        currentAnswer.notApplicable ? 'bg-muted/20 opacity-75' : 'hover:bg-muted/10'
                      )}
                    >
                      {/* Sol: Soru */}
                      <div className="md:w-5/12 space-y-2.5">
                        <div className="flex items-start gap-2.5">
                          <span
                            className={cn(
                              'w-6 h-6 rounded-md shrink-0 flex items-center justify-center text-xs font-bold font-mono mt-0.5',
                              selectedOption ||
                                currentAnswer.yesNoValue != null ||
                                currentAnswer.notApplicable
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {item.itemNo}
                          </span>
                          <p
                            className={cn(
                              'text-xs sm:text-sm font-medium leading-snug',
                              currentAnswer.notApplicable
                                ? 'text-muted-foreground line-through'
                                : 'text-foreground'
                            )}
                          >
                            {item.questionText}
                          </p>
                        </div>

                        {item.config?.description && (
                          <div className="ml-8 flex items-start gap-1.5 text-[11px] text-muted-foreground bg-muted/40 p-2 rounded-md border border-border/50">
                            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
                            <p>{item.config.description}</p>
                          </div>
                        )}

                        {refImgSrc && (
                          <div className="ml-8">
                            <img
                              src={refImgSrc}
                              alt="Soru Referansı"
                              className="h-20 w-auto object-contain rounded-md border border-border cursor-pointer hover:opacity-90"
                              onClick={() => setPreviewImage(refImgSrc)}
                            />
                          </div>
                        )}

                        <div className="ml-8 flex flex-wrap items-center gap-1.5">
                          <Badge variant="secondary" className="text-[10px]">
                            Ağırlık: {item.weight}
                          </Badge>
                          {catPath && (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">
                              {catPath}
                            </Badge>
                          )}
                          {(selectedOption || currentAnswer.yesNoValue != null) &&
                            !currentAnswer.notApplicable && (
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-[10px] font-bold',
                                  currentAnswer.earnedScore > 0
                                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                                    : 'bg-destructive/10 text-destructive border-destructive/30'
                                )}
                              >
                                {currentAnswer.earnedScore > 0 ? '+' : ''}
                                {currentAnswer.earnedScore || 0} Puan
                              </Badge>
                            )}
                        </div>
                      </div>

                      {/* Sağ: Dinamik Cevap & Not/Kanıt */}
                      <div className="md:w-7/12 flex flex-col gap-3">
                        {item.questionType === 'SCALE' && (
                          <div className="flex flex-wrap gap-1.5 bg-muted/40 p-1.5 rounded-lg border border-border w-fit">
                            {template.scaleSet?.options?.map((opt: any) => {
                              const isSelected = currentAnswer.scaleOptionId === opt.id;
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  disabled={isViewMode}
                                  onClick={() =>
                                    handleScaleChange(item, opt.id, opt.multiplier)
                                  }
                                  className={cn(
                                    'px-3 py-1.5 text-xs font-semibold rounded-md transition-all',
                                    isSelected
                                      ? 'text-white shadow-xs'
                                      : 'text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-50'
                                  )}
                                  style={
                                    isSelected ? { backgroundColor: opt.color || '#3b82f6' } : {}
                                  }
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                            <button
                              type="button"
                              disabled={isViewMode}
                              onClick={() => handleScaleChange(item, null, null)}
                              className={cn(
                                'px-3 py-1.5 text-xs font-semibold rounded-md transition-all',
                                currentAnswer.notApplicable
                                  ? 'bg-secondary text-secondary-foreground'
                                  : 'text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-50'
                              )}
                            >
                              Kapsam Dışı
                            </button>
                          </div>
                        )}

                        {item.questionType === 'YES_NO' && (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              disabled={isViewMode}
                              variant={currentAnswer.yesNoValue === true ? 'default' : 'outline'}
                              onClick={() => handleYesNoChange(item, true)}
                              className="h-8 text-xs gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Evet
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              disabled={isViewMode}
                              variant={
                                currentAnswer.yesNoValue === false ? 'destructive' : 'outline'
                              }
                              onClick={() => handleYesNoChange(item, false)}
                              className="h-8 text-xs gap-1"
                            >
                              <X className="w-3.5 h-3.5" /> Hayır
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              disabled={isViewMode}
                              variant={currentAnswer.notApplicable ? 'secondary' : 'outline'}
                              onClick={() => handleYesNoChange(item, null)}
                              className="h-8 text-xs"
                            >
                              Kapsam Dışı
                            </Button>
                          </div>
                        )}

                        {item.questionType === 'TEXT' && (
                          <Textarea
                            disabled={isViewMode}
                            value={currentAnswer.textValue || ''}
                            onChange={(e) => upsertAnswer(item.id, { textValue: e.target.value })}
                            placeholder="Yanıtınızı yazınız..."
                            className="text-xs min-h-[70px]"
                          />
                        )}

                        {item.questionType === 'NUMBER' && (
                          <Input
                            type="number"
                            disabled={isViewMode}
                            value={currentAnswer.numberValue ?? ''}
                            onChange={(e) =>
                              upsertAnswer(item.id, {
                                numberValue: e.target.value ? parseFloat(e.target.value) : null,
                              })
                            }
                            placeholder="Sayısal değer..."
                            className="h-8 w-48 text-xs tabular-nums"
                          />
                        )}

                        {item.questionType === 'DATE' && (
                          <Input
                            type="date"
                            disabled={isViewMode}
                            value={
                              currentAnswer.dateValue
                                ? String(currentAnswer.dateValue).substring(0, 10)
                                : ''
                            }
                            onChange={(e) => upsertAnswer(item.id, { dateValue: e.target.value })}
                            className="h-8 w-48 text-xs tabular-nums"
                          />
                        )}

                        {!currentAnswer.notApplicable && !isViewMode && (
                          <div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => toggleExtras(item.id)}
                              className="h-7 px-2.5 text-[11px] gap-1.5"
                            >
                              <MessageSquare className="w-3 h-3" />
                              {hasNote || hasAttachment
                                ? 'Notlar & Kanıtlar'
                                : 'Not veya Kanıt Ekle'}
                              {(requiresExplanation || requiresAttachment) && (
                                <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                              )}
                            </Button>
                          </div>
                        )}

                        {!currentAnswer.notApplicable && isExpanded && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                Değerlendirme Notu
                                {requiresExplanation && (
                                  <span className="text-destructive">*Zorunlu</span>
                                )}
                              </label>
                              {isViewMode ? (
                                <div className="text-xs bg-muted/30 p-2.5 rounded-md border border-border min-h-[70px] text-foreground">
                                  {currentAnswer.note || (
                                    <span className="text-muted-foreground italic">
                                      Not girilmemiş.
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <Textarea
                                  placeholder="İsteğe bağlı açıklama..."
                                  className="min-h-[70px] text-xs resize-none"
                                  value={currentAnswer.note || ''}
                                  onChange={(e) => upsertAnswer(item.id, { note: e.target.value })}
                                />
                              )}
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                Kanıt Dosyaları
                                {requiresAttachment && (
                                  <span className="text-destructive">*Zorunlu</span>
                                )}
                              </label>

                              <div className="flex flex-wrap gap-2">
                                {!isViewMode && (
                                  <label className="w-16 h-16 bg-muted/30 border border-dashed border-border rounded-md flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 cursor-pointer transition-colors">
                                    {isUploading[item.id] ? (
                                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <>
                                        <Upload className="w-4 h-4 mb-0.5" />
                                        <span className="text-[9px] font-medium">Yükle</span>
                                      </>
                                    )}
                                    <input
                                      type="file"
                                      className="hidden"
                                      multiple
                                      accept="image/*"
                                      onChange={async (e) => {
                                        if (!e.target.files?.length) return;
                                        setIsUploading((prev) => ({ ...prev, [item.id]: true }));
                                        const uploadedPaths: string[] = [];
                                        for (const file of Array.from(e.target.files).slice(0, 3)) {
                                          const formData = new FormData();
                                          formData.append('file', file);
                                          try {
                                            const uploadUrl = `/checklists/submissions/upload?facilityId=${encodeURIComponent(
                                              submission.facilityId || ''
                                            )}&facilityName=${encodeURIComponent(
                                              submission.facility?.name || ''
                                            )}`;
                                            const uploadRes = await api.customFetch(uploadUrl, {
                                              method: 'POST',
                                              body: formData,
                                            });
                                            if (uploadRes.ok) {
                                              uploadedPaths.push((await uploadRes.json()).url);
                                            }
                                          } catch {
                                            // ignore single upload failure
                                          }
                                        }
                                        setIsUploading((prev) => ({ ...prev, [item.id]: false }));
                                        upsertAnswer(item.id, {
                                          attachments: [
                                            ...(currentAnswer.attachments || []),
                                            ...uploadedPaths,
                                          ].slice(0, 10),
                                        });
                                      }}
                                    />
                                  </label>
                                )}

                                {currentAnswer.attachments?.map((att: any, aIdx: number) => {
                                  const urlStr = typeof att === 'string' ? att : att.filePath;
                                  const fullUrl = urlStr?.startsWith('/uploads')
                                    ? `${BASE_URL}${urlStr}`
                                    : urlStr;
                                  return (
                                    <div
                                      key={aIdx}
                                      className="relative group w-16 h-16 rounded-md border border-border overflow-hidden bg-muted shrink-0"
                                    >
                                      <img
                                        src={fullUrl}
                                        alt="Kanıt"
                                        className="w-full h-full object-cover cursor-pointer"
                                        onClick={() => setPreviewImage(fullUrl)}
                                      />
                                      {!isViewMode && (
                                        <button
                                          type="button"
                                          className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px]"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            upsertAnswer(item.id, {
                                              attachments: (currentAnswer.attachments || []).filter(
                                                (_: any, i: number) => i !== aIdx
                                              ),
                                            });
                                          }}
                                        >
                                          &times;
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mobil Alt Aksiyon Barı */}
      {!isViewMode && (
        <div className="fixed sm:hidden bottom-0 left-0 right-0 p-3 bg-card/95 backdrop-blur-md border-t border-border z-40 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={saving}
            className="flex-1 text-xs"
            onClick={() => handleSave('TASLAK')}
          >
            Taslak Kaydet
          </Button>
          <Button
            size="sm"
            disabled={saving}
            className="flex-1 text-xs gap-1"
            onClick={() => handleSave('TAMAMLANDI')}
          >
            <Send className="w-3.5 h-3.5" /> Tamamla
          </Button>
        </div>
      )}

      {/* Görsel Önizleme Modal */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-4xl w-full p-2 rounded-lg">
          <img
            src={previewImage || ''}
            alt="Büyük Önizleme"
            className="w-full h-auto max-h-[82vh] object-contain rounded-md"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

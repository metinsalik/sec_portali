import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit2, Info, Camera, Check, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import api, { BASE_URL } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
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

export default function TemplatePreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchTemplateDetails();
    }
  }, [id]);

  const fetchTemplateDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/checklists/templates/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTemplate(data);
      }
    } catch (error) {
      console.error('Error fetching template details for preview:', error);
    } finally {
      setLoading(false);
    }
  };

  const allTemplateItems = useMemo(
    () => (template?.sections || []).flatMap((s: any) => s.items || []),
    [template]
  );

  const { earnedScore, maxScore, percentScore } = useMemo(() => {
    if (!template?.sections) return { earnedScore: 0, maxScore: 0, percentScore: 0 };

    let earned = 0;
    let max = 0;

    template.sections.forEach((sec: any) => {
      sec.items.forEach((item: any) => {
        if (
          !isChecklistItemVisible(
            item,
            allTemplateItems,
            (itemId) => answers[itemId],
            template.scaleSet?.options || []
          )
        ) {
          return;
        }
        const ans = answers[item.id];
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
  }, [answers, template, allTemplateItems]);

  const setAnswer = (itemId: string, patch: Record<string, any>) => {
    setAnswers((prev) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] || {}), ...patch },
    }));
  };

  const handleScaleChange = (item: any, scaleOptionId: string | null, multiplier: number | null) => {
    const weight = Number(item.weight) || 0;
    const mult = Number(multiplier) || 0;
    setAnswer(item.id, {
      scaleOptionId,
      notApplicable: multiplier === null,
      earnedScore: multiplier !== null ? weight * mult : 0,
    });
  };

  const handleYesNoChange = (item: any, val: boolean | null) => {
    const weight = Number(item.weight) || 0;
    setAnswer(item.id, {
      yesNoValue: val,
      notApplicable: val === null,
      earnedScore: val === true ? weight : 0,
    });
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4 py-6">
        <div className="h-16 rounded-lg bg-muted animate-pulse" />
        <div className="h-48 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground text-sm">
        Şablon bulunamadı.
      </div>
    );
  }

  const canEdit =
    user?.isAdmin ||
    user?.roles?.includes('admin') ||
    user?.roles?.includes('specialist');

  const gradeInfo = getGradeAndColor(percentScore);

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-16">
      {/* Simülasyon Bilgi Şeridi */}
      <div className="rounded-lg border border-primary/30 bg-primary/10 text-primary px-4 py-2 text-xs font-medium flex items-center justify-between gap-2">
        <span>Önizleme / Simülasyon Modu — Girdiğiniz yanıtlar veritabanına kaydedilmez.</span>
        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
          v{template.version}
        </Badge>
      </div>

      {/* Üst Başlık ve Canlı Puan Kartı */}
      <Card className="rounded-lg border-border/80 sticky top-3 z-30 bg-card/95 backdrop-blur-md">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-8 w-8 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-bold text-foreground truncate">{template.title}</h1>
                {template.group?.name && (
                  <Badge variant="secondary" className="text-[10px]">
                    {template.group.name}
                  </Badge>
                )}
              </div>
              {template.description && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">{template.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                Simülasyon Skoru
              </span>
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

            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => navigate(`/checklists/templates/${id}/edit`)}
              >
                <Edit2 className="w-3.5 h-3.5" />
                Düzenle
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dinamik Bölümler ve Sorular */}
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
                    (itemId) => answers[itemId],
                    template.scaleSet?.options || []
                  )
                )
                .map((item: any) => {
                  const currentAnswer = answers[item.id] || {};
                  const catPath = [
                    item.config?.mainCategoryName,
                    item.config?.categoryName,
                    item.config?.subCategoryName,
                  ]
                    .filter(Boolean)
                    .join(' › ');
                  const imgSrc = item.config?.imageUrl
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
                      {/* Sol: Soru Metni & Meta */}
                      <div className="md:w-5/12 space-y-2.5">
                        <div className="flex items-start gap-2.5">
                          <span className="w-6 h-6 rounded-md bg-muted text-foreground shrink-0 flex items-center justify-center text-xs font-bold font-mono">
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

                        {imgSrc && (
                          <div className="ml-8">
                            <img
                              src={imgSrc}
                              alt="Soru Referansı"
                              className="h-20 w-auto object-contain rounded-md border border-border cursor-pointer hover:opacity-90"
                              onClick={() => setPreviewImage(imgSrc)}
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
                        </div>
                      </div>

                      {/* Sağ: Soru Tipine Göre Dinamik Giriş Alanı */}
                      <div className="md:w-7/12 flex flex-col justify-center gap-2">
                        {item.questionType === 'SCALE' && (
                          <div className="flex flex-wrap gap-1.5 bg-muted/40 p-1.5 rounded-lg border border-border w-fit">
                            {template.scaleSet?.options?.map((opt: any) => {
                              const isSelected = currentAnswer.scaleOptionId === opt.id;
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => handleScaleChange(item, opt.id, opt.multiplier)}
                                  className={cn(
                                    'px-3 py-1.5 text-xs font-semibold rounded-md transition-all',
                                    isSelected
                                      ? 'text-white shadow-xs'
                                      : 'text-muted-foreground hover:bg-background hover:text-foreground'
                                  )}
                                  style={isSelected ? { backgroundColor: opt.color || '#3b82f6' } : {}}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                            <button
                              type="button"
                              onClick={() => handleScaleChange(item, null, null)}
                              className={cn(
                                'px-3 py-1.5 text-xs font-semibold rounded-md transition-all',
                                currentAnswer.notApplicable
                                  ? 'bg-secondary text-secondary-foreground'
                                  : 'text-muted-foreground hover:bg-background hover:text-foreground'
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
                              variant={currentAnswer.yesNoValue === true ? 'default' : 'outline'}
                              onClick={() => handleYesNoChange(item, true)}
                              className="h-8 text-xs gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Evet
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={currentAnswer.yesNoValue === false ? 'destructive' : 'outline'}
                              onClick={() => handleYesNoChange(item, false)}
                              className="h-8 text-xs gap-1"
                            >
                              <X className="w-3.5 h-3.5" /> Hayır
                            </Button>
                            <Button
                              type="button"
                              size="sm"
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
                            value={currentAnswer.textValue || ''}
                            onChange={(e) => setAnswer(item.id, { textValue: e.target.value })}
                            placeholder="Önizleme metin yanıtı..."
                            className="text-xs min-h-[60px]"
                          />
                        )}

                        {item.questionType === 'NUMBER' && (
                          <Input
                            type="number"
                            value={currentAnswer.numberValue || ''}
                            onChange={(e) => setAnswer(item.id, { numberValue: e.target.value })}
                            placeholder="Sayısal değer..."
                            className="h-8 w-44 text-xs tabular-nums"
                          />
                        )}

                        {item.questionType === 'DATE' && (
                          <Input
                            type="date"
                            value={currentAnswer.dateValue || ''}
                            onChange={(e) => setAnswer(item.id, { dateValue: e.target.value })}
                            className="h-8 w-44 text-xs tabular-nums"
                          />
                        )}

                        {item.questionType === 'PHOTO' && (
                          <div className="flex items-center gap-2 p-2.5 rounded-md border border-dashed border-border text-xs text-muted-foreground w-fit">
                            <Camera className="w-4 h-4" />
                            <span>Saha denetiminde fotoğraf yükleme alanı</span>
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

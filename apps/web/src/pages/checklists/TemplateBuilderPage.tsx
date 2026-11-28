import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Save, ArrowLeft, Plus, Trash2, Upload, Loader2, GitBranch, X } from 'lucide-react';
import { toast } from 'sonner';
import api, { BASE_URL } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const makeClientId = () => `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export default function TemplateBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scaleSetId, setScaleSetId] = useState<string>('');
  const [groupId, setGroupId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  const [sections, setSections] = useState<any[]>([
    {
      title: 'Genel Kontroller',
      items: [
        {
          questionText: 'Örnek Soru 1',
          questionType: 'SCALE',
          weight: 1,
          isRequired: true,
          config: { clientId: makeClientId() },
        },
      ],
    },
  ]);

  const { data: scaleSets = [] } = useQuery<any[]>({
    queryKey: ['checklist-scales'],
    queryFn: async () => {
      const res = await api.get('/checklists/scales');
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: defCategories = [] } = useQuery<
    { id: number; name: string; parentId: number | null }[]
  >({
    queryKey: ['definition-categories'],
    queryFn: async () => {
      const res = await api.get('/settings/definitions/categories');
      if (!res.ok) return [];
      return res.json();
    },
  });

  const mainCategories = defCategories.filter((c) => c.parentId === null);

  const { data: groups = [] } = useQuery<any[]>({
    queryKey: ['checklist-groups'],
    queryFn: async () => {
      const res = await api.get('/checklists/groups');
      if (!res.ok) return [];
      return res.json();
    },
  });

  useEffect(() => {
    if (isEdit) {
      api
        .get(`/checklists/templates/${id}`)
        .then(async (res) => {
          if (!res.ok) throw new Error('Şablon yüklenemedi');
          const data = await res.json();
          setTitle(data.title);
          setDescription(data.description || '');
          if (data.scaleSetId) setScaleSetId(data.scaleSetId);
          if (data.groupId) setGroupId(data.groupId);
          if (data.sections && data.sections.length > 0) {
            setSections(
              data.sections.map((sec: any) => ({
                ...sec,
                items: (sec.items || []).map((it: any) => ({
                  ...it,
                  config: {
                    ...(it.config || {}),
                    clientId: it.config?.clientId || makeClientId(),
                  },
                })),
              }))
            );
          }
        })
        .catch(() => toast.error('Şablon detayları yüklenemedi.'));
    }
  }, [id, isEdit]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Lütfen şablon başlığı girin.');
      return;
    }
    if (!scaleSetId) {
      toast.error('Lütfen bir değerlendirme ölçeği seçin.');
      return;
    }
    if (sections.length === 0 || sections.some((s) => !s.items || s.items.length === 0)) {
      toast.error('Lütfen en az bir bölüm ve her bölüm için en az bir soru ekleyin.');
      return;
    }

    setSaving(true);
    try {
      const payload = { title: title.trim(), description, scaleSetId, groupId, sections };
      const res = isEdit
        ? await api.put(`/checklists/templates/${id}`, payload)
        : await api.post(`/checklists/templates`, payload);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Şablon kaydedilemedi.');
      }
      toast.success(isEdit ? 'Şablon güncellendi.' : 'Şablon oluşturuldu.');
      navigate('/checklists/templates');
    } catch (error: any) {
      toast.error(error?.message || 'Kaydetme sırasında hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const addSection = () => {
    setSections([...sections, { title: 'Yeni Bölüm', items: [] }]);
  };

  const addItem = (sectionIndex: number) => {
    const newSections = [...sections];
    newSections[sectionIndex].items.push({
      questionText: '',
      questionType: 'SCALE',
      weight: 1,
      isRequired: true,
      config: { clientId: makeClientId() },
    });
    setSections(newSections);
  };

  const selectedScaleSet = scaleSets.find((s) => s.id === scaleSetId);

  // Koşullu görünürlük için tüm soruları düzleştir
  const flatQuestionOptions = sections.flatMap((sec, sIdx) =>
    (sec.items || []).map((it: any, iIdx: number) => ({
      clientId: it.config?.clientId || '',
      label: `B${sIdx + 1}.${iIdx + 1} — ${(it.questionText || 'Adsız soru').slice(0, 48)}`,
      questionType: it.questionType,
    }))
  );

  return (
    <div className="max-w-[1400px] mx-auto space-y-5 pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/checklists/templates')}
            className="h-8 px-2 text-xs"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Geri
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {isEdit ? 'Şablon Düzenle' : 'Yeni Şablon Oluştur'}
            </h1>
            <p className="text-xs text-muted-foreground">
              Bölümler, soru tipleri, 3 seviyeli kategoriler, referans görseller ve adımlı (koşullu) sorular tanımlayın.
            </p>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} size="sm" className="h-9 px-4 text-xs gap-1.5">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {saving ? 'Kaydediliyor...' : 'Şablonu Kaydet'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* SOL 4 KOLON: ŞABLON AYARLARI */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-4">
          <Card className="rounded-lg border-border/80">
            <CardHeader className="pb-3 border-b border-border bg-muted/20">
              <CardTitle className="text-sm font-semibold">Şablon Detayları</CardTitle>
              <CardDescription className="text-xs">Genel ad, açıklama ve grup seçimi.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Başlık <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn: Yangın Güvenliği Saha Denetimi"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Açıklama</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Kısa açıklama..."
                  className="text-xs min-h-[72px]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Şablon Grubu (Opsiyonel)</Label>
                <select
                  className="w-full h-9 px-2.5 text-xs border border-border rounded-md bg-background"
                  value={groupId || ''}
                  onChange={(e) => setGroupId(e.target.value)}
                >
                  <option value="">-- Grup Yok --</option>
                  {groups.map((g: any) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-border/80">
            <CardHeader className="pb-3 border-b border-border bg-muted/20">
              <CardTitle className="text-sm font-semibold">Değerlendirme Ölçeği</CardTitle>
              <CardDescription className="text-xs">Ölçekli sorularda kullanılacak puanlama seti.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Ölçek Seti <span className="text-destructive">*</span>
                </Label>
                <select
                  className="w-full h-9 px-2.5 text-xs border border-border rounded-md bg-background"
                  value={scaleSetId || ''}
                  onChange={(e) => setScaleSetId(e.target.value)}
                >
                  <option value="">-- Seçiniz --</option>
                  {scaleSets.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedScaleSet && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(selectedScaleSet.options || []).map((opt: any) => (
                    <Badge key={opt.id} variant="secondary" className="text-[10px]">
                      {opt.label}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* SAĞ 8 KOLON: BÖLÜMLER & SORULAR */}
        <div className="lg:col-span-8 space-y-4">
          {sections.map((section, sIndex) => (
            <Card key={sIndex} className="rounded-lg border-border/80 overflow-hidden">
              <CardHeader className="py-3 px-4 border-b border-border bg-muted/20 flex flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    Bölüm {sIndex + 1}
                  </Badge>
                  <Input
                    value={section.title}
                    onChange={(e) => {
                      const newSections = [...sections];
                      newSections[sIndex].title = e.target.value;
                      setSections(newSections);
                    }}
                    placeholder="Bölüm başlığı..."
                    className="h-8 text-xs font-semibold max-w-sm"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSections(sections.filter((_, idx) => idx !== sIndex))}
                  className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                  title="Bölümü Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                {(section.items || []).map((item: any, iIndex: number) => {
                  const selectedMainId = item.config?.mainCategoryId
                    ? Number(item.config.mainCategoryId)
                    : null;
                  const selectedMidId = item.config?.categoryId
                    ? Number(item.config.categoryId)
                    : null;
                  const selectedSubId = item.config?.subCategoryId
                    ? Number(item.config.subCategoryId)
                    : null;

                  const midOptions = selectedMainId
                    ? defCategories.filter((c) => c.parentId === selectedMainId)
                    : [];
                  const subOptions = selectedMidId
                    ? defCategories.filter((c) => c.parentId === selectedMidId)
                    : [];

                  const updateItemConfig = (patch: Record<string, any>) => {
                    const newSections = [...sections];
                    if (!newSections[sIndex].items[iIndex].config) {
                      newSections[sIndex].items[iIndex].config = {};
                    }
                    Object.assign(newSections[sIndex].items[iIndex].config, patch);
                    setSections(newSections);
                  };

                  const cond = item.config?.condition || null;
                  const parentCandidates = flatQuestionOptions.filter(
                    (q) => q.clientId && q.clientId !== item.config?.clientId
                  );
                  const selectedParentOpt = cond?.parentClientId
                    ? parentCandidates.find((p) => p.clientId === cond.parentClientId)
                    : null;

                  const itemUploadKey = `${sIndex}-${iIndex}`;
                  const imgSrc = item.config?.imageUrl
                    ? item.config.imageUrl.startsWith('/uploads')
                      ? `${BASE_URL}${item.config.imageUrl}`
                      : item.config.imageUrl
                    : null;

                  return (
                    <div
                      key={item.config?.clientId || iIndex}
                      className="border border-border/80 rounded-lg p-4 bg-muted/10 space-y-3.5 relative"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[11px] font-mono">
                            Soru #{iIndex + 1}
                          </Badge>
                          {cond?.parentClientId && (
                            <Badge
                              variant="outline"
                              className="text-[10px] gap-1 bg-primary/10 text-primary border-primary/25"
                            >
                              <GitBranch className="w-3 h-3" /> Koşullu Adım
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newSections = [...sections];
                            newSections[sIndex].items = newSections[sIndex].items.filter(
                              (_: any, idx: number) => idx !== iIndex
                            );
                            setSections(newSections);
                          }}
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          title="Soruyu Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        {/* Sol 8 Kolon: Soru Metni, Açıklama, Görsel, Koşullu Adım */}
                        <div className="md:col-span-8 space-y-3">
                          <div className="space-y-1">
                            <Label className="text-[11px] font-medium">Soru Metni</Label>
                            <Textarea
                              value={item.questionText}
                              onChange={(e) => {
                                const newSections = [...sections];
                                newSections[sIndex].items[iIndex].questionText = e.target.value;
                                setSections(newSections);
                              }}
                              placeholder="Denetim sorusunu yazın..."
                              className="min-h-[60px] text-xs"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-[11px] text-muted-foreground">
                                Yardımcı Açıklama (Opsiyonel)
                              </Label>
                              <Textarea
                                value={item.config?.description || ''}
                                onChange={(e) =>
                                  updateItemConfig({ description: e.target.value })
                                }
                                placeholder="Denetçiye ipucu veya mevzuat notu..."
                                className="min-h-[58px] text-xs"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-[11px] text-muted-foreground">
                                Referans Görsel (WebP)
                              </Label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  id={`file-${itemUploadKey}`}
                                  onChange={async (e) => {
                                    if (!e.target.files?.length) return;
                                    setUploadingKey(itemUploadKey);
                                    const formData = new FormData();
                                    formData.append('file', e.target.files[0]);
                                    try {
                                      const uploadRes = await api.customFetch(
                                        '/checklists/submissions/upload?facilityName=sablonlar',
                                        { method: 'POST', body: formData }
                                      );
                                      if (!uploadRes.ok) throw new Error('Yüklenemedi');
                                      const { url } = await uploadRes.json();
                                      updateItemConfig({ imageUrl: url });
                                      toast.success('Görsel WebP olarak yüklendi.');
                                    } catch {
                                      toast.error('Görsel yüklenemedi.');
                                    } finally {
                                      setUploadingKey(null);
                                      e.target.value = '';
                                    }
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={uploadingKey === itemUploadKey}
                                  onClick={() =>
                                    document.getElementById(`file-${itemUploadKey}`)?.click()
                                  }
                                  className="h-8 text-xs gap-1.5"
                                >
                                  {uploadingKey === itemUploadKey ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Upload className="w-3.5 h-3.5" />
                                  )}
                                  Görsel Yükle
                                </Button>
                                {imgSrc && (
                                  <div className="relative group w-12 h-12 rounded-md border border-border overflow-hidden bg-muted shrink-0">
                                    <img
                                      src={imgSrc}
                                      alt="Önizleme"
                                      className="w-full h-full object-cover cursor-pointer"
                                      onClick={() => setPreviewImg(imgSrc)}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => updateItemConfig({ imageUrl: '' })}
                                      className="absolute top-0 right-0 w-4 h-4 bg-black/60 text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100"
                                      title="Görseli Kaldır"
                                    >
                                      <X className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Adımlı / Koşullu Soru Akışı */}
                          {parentCandidates.length > 0 && (
                            <div className="p-2.5 rounded-md border border-border/70 bg-background/60 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold flex items-center gap-1.5 text-foreground">
                                  <GitBranch className="w-3.5 h-3.5 text-primary" />
                                  Koşullu Gösterim (Adımlı Soru)
                                </span>
                                {cond && (
                                  <button
                                    type="button"
                                    onClick={() => updateItemConfig({ condition: null })}
                                    className="text-[10px] text-destructive hover:underline"
                                  >
                                    Koşulu Kaldır
                                  </button>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <select
                                  className="h-8 px-2 text-[11px] border border-border rounded-md bg-background"
                                  value={cond?.parentClientId || ''}
                                  onChange={(e) => {
                                    const pid = e.target.value;
                                    if (!pid) {
                                      updateItemConfig({ condition: null });
                                      return;
                                    }
                                    const pOpt = parentCandidates.find((p) => p.clientId === pid);
                                    const defaultVal =
                                      pOpt?.questionType === 'YES_NO'
                                        ? 'YES'
                                        : selectedScaleSet?.options?.[0]?.label || '';
                                    updateItemConfig({
                                      condition: {
                                        parentClientId: pid,
                                        operator: cond?.operator || 'EQUALS',
                                        expectedValue: defaultVal,
                                      },
                                    });
                                  }}
                                >
                                  <option value="">Her zaman göster</option>
                                  {parentCandidates.map((p) => (
                                    <option key={p.clientId} value={p.clientId}>
                                      {p.label}
                                    </option>
                                  ))}
                                </select>

                                {cond?.parentClientId && (
                                  <>
                                    <select
                                      className="h-8 px-2 text-[11px] border border-border rounded-md bg-background"
                                      value={cond.operator}
                                      onChange={(e) =>
                                        updateItemConfig({
                                          condition: {
                                            ...cond,
                                            operator: e.target.value as 'EQUALS' | 'NOT_EQUALS',
                                          },
                                        })
                                      }
                                    >
                                      <option value="EQUALS">Cevap şuna eşitse</option>
                                      <option value="NOT_EQUALS">Cevap şuna eşit değilse</option>
                                    </select>

                                    {selectedParentOpt?.questionType === 'YES_NO' ? (
                                      <select
                                        className="h-8 px-2 text-[11px] border border-border rounded-md bg-background"
                                        value={cond.expectedValue}
                                        onChange={(e) =>
                                          updateItemConfig({
                                            condition: { ...cond, expectedValue: e.target.value },
                                          })
                                        }
                                      >
                                        <option value="YES">Evet</option>
                                        <option value="NO">Hayır</option>
                                        <option value="NA">Kapsam Dışı</option>
                                      </select>
                                    ) : selectedParentOpt?.questionType === 'SCALE' &&
                                      selectedScaleSet?.options?.length ? (
                                      <select
                                        className="h-8 px-2 text-[11px] border border-border rounded-md bg-background"
                                        value={cond.expectedValue}
                                        onChange={(e) =>
                                          updateItemConfig({
                                            condition: { ...cond, expectedValue: e.target.value },
                                          })
                                        }
                                      >
                                        {selectedScaleSet.options.map((o: any) => (
                                          <option key={o.id} value={o.label}>
                                            {o.label}
                                          </option>
                                        ))}
                                        <option value="NA">Kapsam Dışı</option>
                                      </select>
                                    ) : (
                                      <Input
                                        value={cond.expectedValue}
                                        onChange={(e) =>
                                          updateItemConfig({
                                            condition: { ...cond, expectedValue: e.target.value },
                                          })
                                        }
                                        placeholder="Beklenen yanıt..."
                                        className="h-8 text-[11px]"
                                      />
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Sağ 4 Kolon: Tip, 3 Seviyeli Kategori, Ağırlık */}
                        <div className="md:col-span-4 space-y-2.5">
                          <div>
                            <Label className="text-[11px]">Soru Tipi</Label>
                            <select
                              className="w-full mt-1 h-8 px-2 text-xs border border-border rounded-md bg-background"
                              value={item.questionType}
                              onChange={(e) => {
                                const newSections = [...sections];
                                newSections[sIndex].items[iIndex].questionType = e.target.value;
                                setSections(newSections);
                              }}
                            >
                              <option value="SCALE">Ölçekli Seçim</option>
                              <option value="YES_NO">Evet / Hayır</option>
                              <option value="TEXT">Metin</option>
                              <option value="PHOTO">Fotoğraf</option>
                              <option value="NUMBER">Sayı</option>
                              <option value="DATE">Tarih</option>
                            </select>
                          </div>

                          <div>
                            <Label className="text-[11px]">1. Ana Kategori</Label>
                            <select
                              className="w-full mt-1 h-8 px-2 text-xs border border-border rounded-md bg-background"
                              value={selectedMainId ?? ''}
                              onChange={(e) => {
                                const idNum = e.target.value ? Number(e.target.value) : null;
                                const found = defCategories.find((c) => c.id === idNum);
                                updateItemConfig({
                                  mainCategoryId: idNum,
                                  mainCategoryName: found?.name || null,
                                  categoryId: null,
                                  categoryName: null,
                                  subCategoryId: null,
                                  subCategoryName: null,
                                });
                              }}
                            >
                              <option value="">-- Ana Kategori --</option>
                              {mainCategories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <Label className="text-[11px]">2. Kategori</Label>
                            <select
                              className="w-full mt-1 h-8 px-2 text-xs border border-border rounded-md bg-background disabled:opacity-50"
                              value={selectedMidId ?? ''}
                              disabled={!selectedMainId}
                              onChange={(e) => {
                                const idNum = e.target.value ? Number(e.target.value) : null;
                                const found = defCategories.find((c) => c.id === idNum);
                                updateItemConfig({
                                  categoryId: idNum,
                                  categoryName: found?.name || null,
                                  subCategoryId: null,
                                  subCategoryName: null,
                                });
                              }}
                            >
                              <option value="">-- Kategori --</option>
                              {midOptions.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <Label className="text-[11px]">3. Alt Kategori</Label>
                            <select
                              className="w-full mt-1 h-8 px-2 text-xs border border-border rounded-md bg-background disabled:opacity-50"
                              value={selectedSubId ?? ''}
                              disabled={!selectedMidId}
                              onChange={(e) => {
                                const idNum = e.target.value ? Number(e.target.value) : null;
                                const found = defCategories.find((c) => c.id === idNum);
                                updateItemConfig({
                                  subCategoryId: idNum,
                                  subCategoryName: found?.name || null,
                                });
                              }}
                            >
                              <option value="">-- Alt Kategori --</option>
                              {subOptions.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <Label className="text-[11px]">Ağırlık (Puan)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.5"
                              className="mt-1 h-8 text-xs tabular-nums"
                              value={item.weight}
                              onChange={(e) => {
                                const newSections = [...sections];
                                newSections[sIndex].items[iIndex].weight =
                                  parseFloat(e.target.value) || 0;
                                setSections(newSections);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addItem(sIndex)}
                  className="h-8 text-xs gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Soru Ekle
                </Button>
              </CardContent>
            </Card>
          ))}

          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed h-10 text-xs gap-1.5"
            onClick={addSection}
          >
            <Plus className="w-4 h-4" /> Yeni Bölüm Ekle
          </Button>
        </div>
      </div>

      {/* Görsel Önizleme Modal */}
      <Dialog open={!!previewImg} onOpenChange={(o) => !o && setPreviewImg(null)}>
        <DialogContent className="max-w-3xl p-2 rounded-lg">
          <img
            src={previewImg || ''}
            alt="Referans Görsel"
            className="w-full h-auto max-h-[80vh] object-contain rounded-md"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

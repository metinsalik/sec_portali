import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function TemplateBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scaleSetId, setScaleSetId] = useState<string>('');
  const [groupId, setGroupId] = useState<string>('');
  
  const [sections, setSections] = useState<any[]>([
    {
      title: 'Genel Kontroller',
      items: [
        { questionText: 'Örnek Soru 1', questionType: 'SCALE', weight: 1, isRequired: true, categoryId: '' }
      ]
    }
  ]);

  const { data: scaleSets = [] } = useQuery({
    queryKey: ['checklist-scales'],
    queryFn: async () => (await api.get('/checklists/scales')).json(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['checklist-categories'],
    queryFn: async () => (await api.get('/checklists/categories')).json(),
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['checklist-groups'],
    queryFn: async () => (await api.get('/checklists/groups')).json(),
  });

  useEffect(() => {
    if (isEdit) {
      api.get(`/checklists/templates/${id}`).then(async (res) => {
        const data = await res.json();
        setTitle(data.title);
        setDescription(data.description || '');
        if (data.scaleSetId) setScaleSetId(data.scaleSetId);
        if (data.groupId) setGroupId(data.groupId);
        if (data.sections && data.sections.length > 0) setSections(data.sections);
      }).catch(err => console.error(err));
    }
  }, [id, isEdit]);

  const handleSave = async () => {
    try {
      if (!title.trim()) {
        toast.error('Lütfen şablon başlığı girin.');
        return;
      }
      if (!scaleSetId) {
        toast.error('Lütfen bir değerlendirme ölçeği seçin.');
        return;
      }
      if (sections.length === 0 || sections.some(s => s.items.length === 0)) {
        toast.error('Lütfen en az bir bölüm ve her bölüm için en az bir soru ekleyin.');
        return;
      }

      const payload = { title, description, scaleSetId, groupId, sections };
      if (isEdit) {
        await api.put(`/checklists/templates/${id}`, payload);
        toast.success('Şablon güncellendi');
      } else {
        await api.post(`/checklists/templates`, payload);
        toast.success('Şablon oluşturuldu');
      }
      navigate('/checklists');
    } catch (error) {
      console.error('Error saving template', error);
      toast.error('Kaydetme hatası!');
    }
  };

  const addSection = () => {
    setSections([...sections, { title: 'Yeni Bölüm', items: [] }]);
  };

  const addItem = (sectionIndex: number) => {
    const newSections = [...sections];
    newSections[sectionIndex].items.push({
      questionText: 'Yeni Soru',
      questionType: 'SCALE',
      weight: 1,
      isRequired: true,
      categoryId: ''
    });
    setSections(newSections);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/checklists')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Geri
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEdit ? 'Şablon Düzenle' : 'Yeni Şablon Oluştur'}
          </h1>
        </div>
        <Button onClick={handleSave} className="gap-2">
          <Save className="w-4 h-4" />
          Kaydet
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Şablon Detayları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Başlık</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Şablon Adı" />
              </div>
              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Kısa açıklama..." />
              </div>
              <div className="space-y-2">
                <Label>Şablon Grubu (Opsiyonel)</Label>
                <select
                  className="w-full p-2 border rounded bg-background"
                  value={groupId || ''}
                  onChange={(e) => setGroupId(e.target.value)}
                >
                  <option value="">-- Grup Yok --</option>
                  {groups.map((g: any) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Değerlendirme Ölçeği</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Label>Uygulanacak Ölçek Seti</Label>
              <select
                className="w-full p-2 border rounded bg-background"
                value={scaleSetId || ''}
                onChange={(e) => setScaleSetId(e.target.value)}
              >
                <option value="">-- Seçiniz --</option>
                {scaleSets.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {scaleSetId && scaleSets.find((s: any) => s.id === scaleSetId) && (
                <div className="text-sm mt-2 text-muted-foreground bg-muted p-2 rounded">
                  {scaleSets.find((s: any) => s.id === scaleSetId).options.map((opt: any) => opt.label).join(' / ')}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="col-span-2 space-y-6">
          {sections.map((section, sIndex) => (
            <Card key={sIndex}>
              <CardHeader className="flex flex-row items-center justify-between">
                <Input 
                  value={section.title} 
                  onChange={(e) => {
                    const newSections = [...sections];
                    newSections[sIndex].title = e.target.value;
                    setSections(newSections);
                  }} 
                  className="w-1/2 font-semibold text-lg"
                />
                <Button variant="ghost" size="sm" onClick={() => {
                  const newSections = sections.filter((_, idx) => idx !== sIndex);
                  setSections(newSections);
                }}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {section.items.map((item: any, iIndex: number) => (
                  <div key={iIndex} className="flex flex-col gap-4 border p-4 rounded-xl bg-accent/5 relative">
                    <div className="absolute top-2 right-2">
                      <Button variant="ghost" size="sm" onClick={() => {
                        const newSections = [...sections];
                        newSections[sIndex].items = newSections[sIndex].items.filter((_: any, idx: number) => idx !== iIndex);
                        setSections(newSections);
                      }}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="flex gap-3 items-start pr-10">
                      <span className="font-medium min-w-[24px] pt-2">{iIndex + 1}.</span>
                      <div className="flex-1 space-y-4">
                        <Textarea 
                          value={item.questionText} 
                          onChange={(e) => {
                            const newSections = [...sections];
                            newSections[sIndex].items[iIndex].questionText = e.target.value;
                            setSections(newSections);
                          }} 
                          placeholder="Soru metni..." 
                          className="min-h-[60px]"
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Soru Açıklaması (Opsiyonel)</Label>
                            <Textarea
                              value={item.config?.description || ''}
                              onChange={(e) => {
                                const newSections = [...sections];
                                if (!newSections[sIndex].items[iIndex].config) newSections[sIndex].items[iIndex].config = {};
                                newSections[sIndex].items[iIndex].config.description = e.target.value;
                                setSections(newSections);
                              }}
                              placeholder="Kullanıcıya yardımcı olacak ek açıklamalar..."
                              className="min-h-[60px] text-sm"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Soru Görseli (Opsiyonel)</Label>
                            <div className="flex gap-2">
                              <Input 
                                value={item.config?.imageUrl || ''}
                                onChange={(e) => {
                                  const newSections = [...sections];
                                  if (!newSections[sIndex].items[iIndex].config) newSections[sIndex].items[iIndex].config = {};
                                  newSections[sIndex].items[iIndex].config.imageUrl = e.target.value;
                                  setSections(newSections);
                                }}
                                placeholder="Görsel URL'si veya yükle"
                                className="text-sm"
                              />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                id={`file-${sIndex}-${iIndex}`}
                                onChange={async (e) => {
                                  if (!e.target.files?.length) return;
                                  const formData = new FormData();
                                  formData.append('file', e.target.files[0]);
                                  try {
                                    const uploadRes = await api.customFetch('/checklists/submissions/upload', {
                                      method: 'POST',
                                      body: formData
                                    });
                                    if (uploadRes.ok) {
                                      const { url } = await uploadRes.json();
                                      const newSections = [...sections];
                                      if (!newSections[sIndex].items[iIndex].config) newSections[sIndex].items[iIndex].config = {};
                                      newSections[sIndex].items[iIndex].config.imageUrl = url;
                                      setSections(newSections);
                                    }
                                  } catch(err) {
                                    toast.error('Görsel yüklenemedi.');
                                  }
                                }}
                              />
                              <Button variant="outline" type="button" onClick={() => document.getElementById(`file-${sIndex}-${iIndex}`)?.click()}>
                                Yükle
                              </Button>
                            </div>
                            {item.config?.imageUrl && (
                              <div className="w-24 h-24 border rounded-md overflow-hidden bg-slate-100">
                                <img 
                                  src={item.config.imageUrl.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${item.config.imageUrl}` : item.config.imageUrl} 
                                  alt="Soru Görseli" 
                                  className="w-full h-full object-cover" 
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 w-48 shrink-0">
                        <div>
                          <Label className="text-xs">Soru Tipi</Label>
                          <select 
                            className="w-full mt-1 p-2 text-sm border rounded bg-background"
                            value={item.questionType}
                            onChange={(e) => {
                              const newSections = [...sections];
                              newSections[sIndex].items[iIndex].questionType = e.target.value;
                              setSections(newSections);
                            }}
                          >
                            <option value="SCALE">Ölçekli Seçim</option>
                            <option value="YES_NO">Evet/Hayır</option>
                            <option value="TEXT">Metin</option>
                            <option value="PHOTO">Fotoğraf</option>
                            <option value="NUMBER">Sayı</option>
                            <option value="DATE">Tarih</option>
                          </select>
                        </div>
                        
                        {item.questionType === 'SCALE' && (
                          <div>
                            <Label className="text-xs">Kategori</Label>
                            <select
                              className="w-full mt-1 p-2 text-sm border rounded bg-background"
                              value={item.categoryId || ''}
                              onChange={(e) => {
                                const newSections = [...sections];
                                newSections[sIndex].items[iIndex].categoryId = e.target.value;
                                setSections(newSections);
                              }}
                            >
                              <option value="">-- Seçiniz --</option>
                              {categories.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div>
                          <Label className="text-xs">Ağırlık (TW)</Label>
                          <Input 
                            type="number" 
                            className="mt-1"
                            value={item.weight} 
                            onChange={(e) => {
                              const newSections = [...sections];
                              newSections[sIndex].items[iIndex].weight = parseFloat(e.target.value);
                              setSections(newSections);
                            }} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => addItem(sIndex)}>
                  <Plus className="w-4 h-4 mr-2" /> Soru Ekle
                </Button>
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" className="w-full border-dashed" onClick={addSection}>
            <Plus className="w-4 h-4 mr-2" /> Yeni Bölüm Ekle
          </Button>
        </div>
      </div>
    </div>
  );
}

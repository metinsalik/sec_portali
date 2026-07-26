import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react';
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

  useEffect(() => {
    if (isEdit) {
      api.get(`/checklists/templates/${id}`).then(async (res) => {
        const data = await res.json();
        setTitle(data.title);
        setDescription(data.description || '');
        if (data.scaleSetId) setScaleSetId(data.scaleSetId);
        if (data.sections && data.sections.length > 0) setSections(data.sections);
      }).catch(err => console.error(err));
    }
  }, [id, isEdit]);

  const handleSave = async () => {
    try {
      const payload = { title, description, scaleSetId, sections };
      if (isEdit) {
        await api.put(`/checklists/templates/${id}`, payload);
      } else {
        await api.post(`/checklists/templates`, payload);
      }
      navigate('/checklists');
    } catch (error) {
      console.error('Error saving template', error);
      alert('Kaydetme hatası!');
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
                  <div key={iIndex} className="flex gap-2 items-start border p-3 rounded bg-accent/20">
                    <span className="font-medium min-w-[24px] pt-2">{iIndex + 1}.</span>
                    <Textarea 
                      value={item.questionText} 
                      onChange={(e) => {
                        const newSections = [...sections];
                        newSections[sIndex].items[iIndex].questionText = e.target.value;
                        setSections(newSections);
                      }} 
                      placeholder="Soru..." 
                      className="flex-1"
                    />
                    <div className="flex flex-col gap-2 w-48">
                      <Label className="text-xs">Soru Tipi</Label>
                      <select 
                        className="p-2 text-sm border rounded bg-background"
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
                      
                      {item.questionType === 'SCALE' && (
                        <>
                          <Label className="text-xs">Kategori</Label>
                          <select
                            className="p-2 text-sm border rounded bg-background"
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
                        </>
                      )}

                      <Label className="text-xs">Ağırlık (TW)</Label>
                      <Input 
                        type="number" 
                        value={item.weight} 
                        onChange={(e) => {
                          const newSections = [...sections];
                          newSections[sIndex].items[iIndex].weight = parseFloat(e.target.value);
                          setSections(newSections);
                        }} 
                      />
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

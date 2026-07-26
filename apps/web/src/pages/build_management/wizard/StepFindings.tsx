import React, { useState } from 'react';
import type { RenovationReportInput, RenovationReportFinding, RiskLevel } from '@/types/renovationReport';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Upload, X } from 'lucide-react';
import { uploadRenovationImages } from '@/services/renovationReportApi';
import { toast } from 'sonner';

interface Props {
  data: Partial<RenovationReportInput>;
  updateData: (data: React.SetStateAction<Partial<RenovationReportInput>>) => void;
}

const FINDING_CATEGORIES = [
  { id: 'altyapi', title: 'Altyapı Sistemleri ve Bileşenlerine Yönelik Bulgular', prefix: 'A' },
  { id: 'yangin', title: 'Yangın Güvenliğine Yönelik Bulgular', prefix: 'Y' },
  { id: 'acildurum', title: 'Acil Durum ve Afet Yönetimi Süreçlerine Yönelik Bulgular', prefix: 'H' },
  { id: 'calisanhasta', title: 'Çalışan ve Hasta Güvenliği Süreçlerine Yönelik Bulgular', prefix: 'G' },
  { id: 'mimari', title: 'Mimari Perspektifle Düzeltilmesi Gereken Bulgular', prefix: 'M' }
];

export default function StepFindings({ data, updateData }: Props) {
  const findings = data.findings || { intros: {}, items: [] };
  const items = findings.items || [];
  
  const [activeCategory, setActiveCategory] = useState(FINDING_CATEGORIES[0].id);
  const [isUploading, setIsUploading] = useState(false);

  const handleIntroChange = (categoryId: string, text: string) => {
    updateData(prev => ({
      ...prev,
      findings: {
        ...prev.findings,
        intros: { ...(prev.findings?.intros || {}), [categoryId]: text },
        items: prev.findings?.items || []
      }
    }));
  };

  const handleAddItem = (categoryPrefix: string, categoryTitle: string) => {
    // Generate a temporary ID and NO. Proper sorting and numbering will happen when saving/reporting.
    const newId = 'f_' + Date.now();
    updateData(prev => ({
      ...prev,
      findings: {
        intros: prev.findings?.intros || {},
        items: [...(prev.findings?.items || []), {
          id: newId,
          no: `${categoryPrefix}-NEW`, // placeholder
          categoryName: categoryTitle,
          riskLevel: 'ORTA',
          category: '',
          definition: '',
          findingText: '',
          riskText: '',
          suggestionText: '',
          images: []
        }]
      }
    }));
  };

  const handleRemoveItem = (id: string) => {
    updateData(prev => ({
      ...prev,
      findings: {
        intros: prev.findings?.intros || {},
        items: (prev.findings?.items || []).filter(item => item.id !== id)
      }
    }));
  };

  const handleUpdateItem = (id: string, field: keyof RenovationReportFinding, value: any) => {
    updateData(prev => ({
      ...prev,
      findings: {
        intros: prev.findings?.intros || {},
        items: (prev.findings?.items || []).map(item => item.id === id ? { ...item, [field]: value } : item)
      }
    }));
  };

  const handleImageUpload = async (id: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    // Check if adding these files exceeds the limit of 4
    const item = items.find(i => i.id === id);
    if (item && item.images.length + files.length > 4) {
      toast.error('En fazla 4 fotoğraf yükleyebilirsiniz.');
      return;
    }

    try {
      setIsUploading(true);
      const urls = await uploadRenovationImages(Array.from(files));
      
      updateData(prev => ({
        ...prev,
        findings: {
          intros: prev.findings?.intros || {},
          items: (prev.findings?.items || []).map(i => {
            if (i.id === id) {
              return { ...i, images: [...i.images, ...urls] };
            }
            return i;
          })
        }
      }));
      toast.success('Fotoğraflar başarıyla yüklendi.');
    } catch (error) {
      toast.error('Fotoğraf yüklenirken hata oluştu.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (itemId: string, imageUrl: string) => {
    updateData(prev => ({
      ...prev,
      findings: {
        intros: prev.findings?.intros || {},
        items: (prev.findings?.items || []).map(i => {
          if (i.id === itemId) {
            return { ...i, images: i.images.filter(url => url !== imageUrl) };
          }
          return i;
        })
      }
    }));
  };

  const getRiskColor = (level: string) => {
    if (level === 'COK_YUKSEK') return 'bg-red-500 text-white';
    if (level === 'YUKSEK') return 'bg-orange-500 text-white';
    if (level === 'ORTA') return 'bg-amber-400 text-white';
    return '';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h3 className="text-lg font-medium">4. Saha Gözlemleri ve Bulgular</h3>
        <p className="text-sm text-slate-500">Kategorilere göre saha gözlemlerini, riskleri ve önerileri ekleyin.</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b pb-4">
        {FINDING_CATEGORIES.map(cat => (
          <Button
            key={cat.id}
            variant={activeCategory === cat.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory(cat.id)}
            className="text-xs"
          >
            {cat.title}
          </Button>
        ))}
      </div>

      <div className="space-y-6">
        {FINDING_CATEGORIES.filter(c => c.id === activeCategory).map(category => {
          const categoryItems = items.filter(item => item.categoryName === category.title);
          
          return (
            <div key={category.id} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Bölüm Açıklaması (Giriş Metni)</label>
                <Textarea 
                  value={findings.intros?.[category.id] || ''} 
                  onChange={(e) => handleIntroChange(category.id, e.target.value)}
                  placeholder={`${category.title} için genel durumu anlatan giriş metnini buraya yazın...`}
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex justify-between items-center pt-4">
                <h4 className="font-medium text-slate-700 dark:text-slate-300">Bulgular ({categoryItems.length})</h4>
                <Button onClick={() => handleAddItem(category.prefix, category.title)} size="sm" className="gap-2">
                  <Plus className="w-4 h-4" /> Bulgu Ekle
                </Button>
              </div>

              <div className="space-y-6">
                {categoryItems.map((item, index) => (
                  <div key={item.id} className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-800/50 relative shadow-sm">
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="absolute -top-3 -right-3 h-8 w-8 rounded-full shadow-md"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500">Risk Düzeyi</label>
                        <Select value={item.riskLevel} onValueChange={(val) => handleUpdateItem(item.id, 'riskLevel', val)}>
                          <SelectTrigger className={`h-9 ${getRiskColor(item.riskLevel)}`}>
                            <SelectValue placeholder="Risk Seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="COK_YUKSEK">Çok Yüksek</SelectItem>
                            <SelectItem value="YUKSEK">Yüksek</SelectItem>
                            <SelectItem value="ORTA">Orta</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500">Tespit Kategorisi</label>
                        <Input 
                          value={item.category} 
                          onChange={(e) => handleUpdateItem(item.id, 'category', e.target.value)} 
                          placeholder="Örn: Elektrik Altyapısı" 
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-semibold text-slate-500">Tespit Tanımı</label>
                        <Input 
                          value={item.definition} 
                          onChange={(e) => handleUpdateItem(item.id, 'definition', e.target.value)} 
                          placeholder="Örn: Altyapı Sistemlerine Dair Projelerin Bulunmaması" 
                          className="h-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500">Tespit (Detaylı Açıklama)</label>
                        <Textarea 
                          value={item.findingText} 
                          onChange={(e) => handleUpdateItem(item.id, 'findingText', e.target.value)} 
                          className="min-h-[80px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500">Risk (Olası Sonuçlar)</label>
                        <Textarea 
                          value={item.riskText} 
                          onChange={(e) => handleUpdateItem(item.id, 'riskText', e.target.value)} 
                          className="min-h-[80px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500">Öneri (Giderilmesi İçin Gerekenler)</label>
                        <Textarea 
                          value={item.suggestionText} 
                          onChange={(e) => handleUpdateItem(item.id, 'suggestionText', e.target.value)} 
                          className="min-h-[80px]"
                        />
                      </div>
                      
                      <div className="space-y-2 pt-2">
                        <label className="text-xs font-semibold text-slate-500 flex justify-between items-center">
                          <span>Ek (Form, fotoğraf vb. dokümanlar)</span>
                          <span className="text-slate-400">{item.images.length}/4 Fotoğraf</span>
                        </label>
                        
                        <div className="flex flex-wrap gap-4">
                          {item.images.map((url, imgIdx) => (
                            <div key={imgIdx} className="relative w-24 h-24 border rounded-md overflow-hidden group">
                              <img src={url} alt={`Ek ${imgIdx}`} className="w-full h-full object-cover" />
                              <button 
                                onClick={() => handleRemoveImage(item.id, url)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          
                          {item.images.length < 4 && (
                            <label className={`w-24 h-24 border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                              <Upload className="w-6 h-6 text-slate-400 mb-1" />
                              <span className="text-[10px] text-slate-500 font-medium">Yükle</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                multiple 
                                className="hidden" 
                                onChange={(e) => handleImageUpload(item.id, e.target.files)}
                                disabled={isUploading}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {categoryItems.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-500">Bu kategoride henüz bulgu eklenmemiş.</p>
                    <Button onClick={() => handleAddItem(category.prefix, category.title)} variant="link" size="sm" className="mt-2">
                      İlk Bulguyu Ekle
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload, Loader2, Save } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const api = {
  get: async (url: string) => {
    const res = await fetch(`/api${url}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    if (!res.ok) throw new Error('API Error');
    return res;
  },
  post: async (url: string, data: any) => {
    const res = await fetch(`/api${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('API Error');
    return res;
  },
  upload: async (url: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`/api${url}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: formData
    });
    if (!res.ok) throw new Error('Upload Error');
    return res.json();
  }
};

const FINE_KINNEY_PROBABILITY = [
  { value: 10, label: '10 - Beklenir, kesin' },
  { value: 6, label: '6 - Yüksek, oldukça mümkün' },
  { value: 3, label: '3 - Olası' },
  { value: 1, label: '1 - Mümkün fakat düşük' },
  { value: 0.5, label: '0.5 - Beklenmez fakat mümkün' },
  { value: 0.2, label: '0.2 - Beklenmez' },
];

const FINE_KINNEY_FREQUENCY = [
  { value: 10, label: '10 - Hemen Hemen Sürekli (bir saatte birkaç defa)' },
  { value: 6, label: '6 - Sık (günde bir veya birkaç defa)' },
  { value: 3, label: '3 - Ara Sıra (haftada bir veya birkaç defa)' },
  { value: 2, label: '2 - Sık Değil (ayda bir veya birkaç defa)' },
  { value: 1, label: '1 - Seyrek (yılda birkaç defa)' },
  { value: 0.5, label: '0.5 - Çok Seyrek (yılda bir veya daha seyrek)' },
];

const FINE_KINNEY_SEVERITY = [
  { value: 100, label: '100 - Birden Fazla Ölümlü Kaza / Çevresel Felaket' },
  { value: 40, label: '40 - Öldürücü Kaza / Ciddi Çevresel Zarar' },
  { value: 15, label: '15 - Kalıcı Hasar / Yaralanma, İş Kaybı' },
  { value: 7, label: '7 - Önemli Hasar / Yaralanma, Dış İlkyardım İhtiyacı' },
  { value: 3, label: '3 - Küçük Hasar / Yaralanma, Dahili İlk Yardım' },
  { value: 1, label: '1 - Ucuz Atlatma / Çevresel Zarar Yok' },
];

const getFineKinneyResult = (score: number) => {
  if (score > 400) return { label: 'Tolerans Gösterilemez Risk', color: 'bg-red-600 text-white', points: 5 };
  if (score > 200) return { label: 'Yüksek Risk', color: 'bg-red-500 text-white', points: 4 };
  if (score > 70) return { label: 'Önemli Risk', color: 'bg-orange-500 text-white', points: 3 };
  if (score > 20) return { label: 'Olası Risk', color: 'bg-yellow-500 text-black', points: 2 };
  return { label: 'Önemsiz Risk', color: 'bg-green-500 text-white', points: 1 };
};

export default function EyewashRiskAnalysisFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const facilityId = localStorage.getItem('activeFacilityId');
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<any>({
    analysisDate: new Date().toISOString().split('T')[0],
    chemicalDetails: { yanici: 0, asindirici: 0, tahrisEdici: 0, oksitleyici: 0, toksik: 0, kanserojen: 0, bulasici: 0 },
    chemProbability: 0, chemFrequency: 0, chemSeverity: 0, chemScore: 0,
    bioProbability: 0, bioFrequency: 0, bioSeverity: 0, bioScore: 0,
    eyewashRequirementLevel: 'Düşük Riskli Alanlar'
  });
  const [isUploading, setIsUploading] = useState(false);

  // Düzenleme modu için veriyi çek
  const { data: analyses, isLoading: isFetching } = useQuery({
    queryKey: ['eyewash-risk', facilityId],
    queryFn: async () => {
      const res = await api.get(`/hazmat/eyewash-risk?facilityId=${facilityId}`);
      return res.json();
    },
    enabled: !!facilityId && !!id,
  });

  useEffect(() => {
    if (analyses && id) {
      const existing = analyses.find((x: any) => x.id === id);
      if (existing) {
        setFormData(existing);
      }
    }
  }, [analyses, id]);

  const { data: departments = [] } = useQuery({
    queryKey: ['hazmat-departments', facilityId],
    queryFn: async () => {
      if (!facilityId) return [];
      const res = await api.get(`/hazmat/inventory/departments?facilityId=${facilityId}`);
      return res.json();
    },
    enabled: !!facilityId
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/hazmat/eyewash-risk', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eyewash-risk'] });
      toast.success('Analiz başarıyla kaydedildi.');
      navigate('/hazmat/eyewash-risk');
    },
    onError: () => {
      toast.error('Kayıt sırasında bir hata oluştu.');
    }
  });

  const calculateScore = (p: number, f: number, s: number) => {
    return (p || 0) * (f || 0) * (s || 0);
  };

  const calculateTotalLiters = (details: any) => {
    if (!details) return 0;
    return Object.values(details).reduce((sum: number, val: any) => sum + (parseFloat(val) || 0), 0);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploading(true);
    try {
      const { url } = await api.upload('/hazmat/upload', file);
      setFormData({ ...formData, improvementImageUrl: url });
      toast.success('Görsel başarıyla yüklendi.');
    } catch (err) {
      toast.error('Görsel yüklenirken hata oluştu.');
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    const chemPoints = getFineKinneyResult(formData.chemScore || 0).points;
    const bioPoints = getFineKinneyResult(formData.bioScore || 0).points;
    const avg = (chemPoints + bioPoints) / 2;
    
    let computedLevel = 'Düşük Riskli Alanlar';
    if (avg >= 4.5) computedLevel = 'Yüksek Riskli Alanlar';
    else if (avg >= 3.0) computedLevel = 'Orta Riskli Alanlar';
    
    if (formData.eyewashRequirementLevel !== computedLevel) {
      setFormData((prev: any) => ({ ...prev, eyewashRequirementLevel: computedLevel }));
    }
  }, [formData.chemScore, formData.bioScore]);

  if (id && isFetching) return <div className="p-6">Yükleniyor...</div>;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/hazmat/eyewash-risk')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{id ? 'Risk Analizini Düzenle' : 'Yeni Risk Analizi'}</h1>
            <p className="text-muted-foreground">Departmanın göz duşu ihtiyaç analizini Fine-Kinney yöntemi ile belirleyin.</p>
          </div>
        </div>
        <Button onClick={() => saveMutation.mutate({ ...formData, facilityId })} disabled={saveMutation.isPending}>
          {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          <Save className="w-4 h-4 mr-2" />
          Kaydet
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-8 pt-6">
          {/* Temel Bilgiler */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/30 p-6 rounded-xl border border-border/50">
            <div className="space-y-3">
              <Label>Analiz Tarihi</Label>
              <Input type="date" value={formData.analysisDate?.split('T')[0] || ''} onChange={e => setFormData({...formData, analysisDate: e.target.value})} className="h-11" />
            </div>
            <div className="space-y-3">
              <Label>Departman</Label>
              <Select value={formData.department || ''} onValueChange={val => setFormData({...formData, department: val})}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Departman Seçiniz" /></SelectTrigger>
                <SelectContent>
                  {departments.length === 0 && <SelectItem value="none" disabled>Kayıtlı departman bulunamadı</SelectItem>}
                  {departments.map((dept: any) => (
                    <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label>Alan Yüz ölçümü (m²)</Label>
              <Input type="number" value={formData.areaSquareMeters || ''} onChange={e => setFormData({...formData, areaSquareMeters: e.target.value})} className="h-11" />
            </div>
            <div className="space-y-3">
              <Label>Alanda Bulunabilecek Personel Sayısı (Maks)</Label>
              <Input type="number" value={formData.maxPersonnel || ''} onChange={e => setFormData({...formData, maxPersonnel: e.target.value})} className="h-11" />
            </div>
          </div>

          {/* Kimyasal Madde Türleri */}
          <div className="space-y-4 bg-muted/30 p-6 rounded-xl border border-border/50">
            <h3 className="font-semibold text-lg">Alanda Bulunan Kimyasal Madde Türleri ve Miktarları (Litre)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {['Yanıcı', 'Aşındırıcı', 'Tahriş Edici', 'Oksitleyici', 'Toksik', 'Kanserojen', 'Bulaşıcı'].map(type => {
                const key = type.toLowerCase().replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ /g, '');
                return (
                  <div key={key} className="space-y-2">
                    <Label className="text-sm">{type} Madde</Label>
                    <Input type="number" value={formData.chemicalDetails?.[key] || 0} onChange={e => {
                      const newDetails = { ...formData.chemicalDetails, [key]: parseFloat(e.target.value) || 0 };
                      setFormData({
                        ...formData,
                        chemicalDetails: newDetails,
                        chemicalTotalLiters: calculateTotalLiters(newDetails)
                      });
                    }} className="h-11" />
                  </div>
                );
              })}
              <div className="space-y-2">
                <Label className="text-sm font-bold text-primary">Toplam (Litre)</Label>
                <Input type="number" readOnly className="bg-muted font-bold h-11 border-primary/50 text-primary" value={formData.chemicalTotalLiters || 0} />
              </div>
            </div>
          </div>

          {/* Kaza Bilgileri */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/30 p-6 rounded-xl border border-border/50">
            <div className="space-y-3">
              <Label className="text-sm">Son 1 Yılda Gerçekleşen Kimyasal / Kan-Vücut Sıvısı Maruziyet Sayısı</Label>
              <div className="flex gap-4">
                <Input type="number" placeholder="Kimyasal" value={formData.chemExposureCount || ''} onChange={e => setFormData({...formData, chemExposureCount: e.target.value})} className="h-11" />
                <Input type="number" placeholder="Biyolojik" value={formData.bioExposureCount || ''} onChange={e => setFormData({...formData, bioExposureCount: e.target.value})} className="h-11" />
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-sm">Son 1 Yılda Yaşanan Kimyasal / Kan-Vücut Sıvısı Ramak Kala Olay Sayısı</Label>
              <div className="flex gap-4">
                <Input type="number" placeholder="Kimyasal" value={formData.chemNearMissCount || ''} onChange={e => setFormData({...formData, chemNearMissCount: e.target.value})} className="h-11" />
                <Input type="number" placeholder="Biyolojik" value={formData.bioNearMissCount || ''} onChange={e => setFormData({...formData, bioNearMissCount: e.target.value})} className="h-11" />
              </div>
            </div>
          </div>

          {/* Fine Kinney Kimyasal */}
          <div className="space-y-5 border rounded-xl p-6 border-l-4 border-l-blue-500 bg-card shadow-sm">
            <h3 className="font-semibold text-lg text-blue-700 dark:text-blue-400">Kimyasal Maruziyet Risk Analizi (Fine Kinney)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label>Olasılık</Label>
                <Select value={formData.chemProbability?.toString() || ''} onValueChange={(val) => {
                  const p = parseFloat(val);
                  const score = calculateScore(p, formData.chemFrequency, formData.chemSeverity);
                  setFormData({...formData, chemProbability: p, chemScore: score});
                }}>
                  <SelectTrigger className="h-12"><SelectValue placeholder="Seçiniz"/></SelectTrigger>
                  <SelectContent className="min-w-[350px]">{FINE_KINNEY_PROBABILITY.map(x => <SelectItem key={x.value} value={x.value.toString()}>{x.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label>Frekans</Label>
                <Select value={formData.chemFrequency?.toString() || ''} onValueChange={(val) => {
                  const f = parseFloat(val);
                  const score = calculateScore(formData.chemProbability, f, formData.chemSeverity);
                  setFormData({...formData, chemFrequency: f, chemScore: score});
                }}>
                  <SelectTrigger className="h-12"><SelectValue placeholder="Seçiniz"/></SelectTrigger>
                  <SelectContent className="min-w-[350px]">{FINE_KINNEY_FREQUENCY.map(x => <SelectItem key={x.value} value={x.value.toString()}>{x.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label>Şiddet</Label>
                <Select value={formData.chemSeverity?.toString() || ''} onValueChange={(val) => {
                  const s = parseFloat(val);
                  const score = calculateScore(formData.chemProbability, formData.chemFrequency, s);
                  setFormData({...formData, chemSeverity: s, chemScore: score});
                }}>
                  <SelectTrigger className="h-12"><SelectValue placeholder="Seçiniz"/></SelectTrigger>
                  <SelectContent className="min-w-[350px]">{FINE_KINNEY_SEVERITY.map(x => <SelectItem key={x.value} value={x.value.toString()}>{x.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-muted/50 p-4 rounded-lg border">
              <div className="font-bold text-lg">Risk Puanı: <span className="text-2xl ml-2">{formData.chemScore || 0}</span></div>
              <Badge className={cn("text-sm px-4 py-1", getFineKinneyResult(formData.chemScore || 0).color)}>{getFineKinneyResult(formData.chemScore || 0).label}</Badge>
            </div>
          </div>

          {/* Fine Kinney Biyolojik */}
          <div className="space-y-5 border rounded-xl p-6 border-l-4 border-l-rose-500 bg-card shadow-sm">
            <h3 className="font-semibold text-lg text-rose-700 dark:text-rose-400">Kan-Vücut Sıvısı Maruziyet Risk Analizi (Fine Kinney)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label>Olasılık</Label>
                <Select value={formData.bioProbability?.toString() || ''} onValueChange={(val) => {
                  const p = parseFloat(val);
                  const score = calculateScore(p, formData.bioFrequency, formData.bioSeverity);
                  setFormData({...formData, bioProbability: p, bioScore: score});
                }}>
                  <SelectTrigger className="h-12"><SelectValue placeholder="Seçiniz"/></SelectTrigger>
                  <SelectContent className="min-w-[350px]">{FINE_KINNEY_PROBABILITY.map(x => <SelectItem key={x.value} value={x.value.toString()}>{x.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label>Frekans</Label>
                <Select value={formData.bioFrequency?.toString() || ''} onValueChange={(val) => {
                  const f = parseFloat(val);
                  const score = calculateScore(formData.bioProbability, f, formData.bioSeverity);
                  setFormData({...formData, bioFrequency: f, bioScore: score});
                }}>
                  <SelectTrigger className="h-12"><SelectValue placeholder="Seçiniz"/></SelectTrigger>
                  <SelectContent className="min-w-[350px]">{FINE_KINNEY_FREQUENCY.map(x => <SelectItem key={x.value} value={x.value.toString()}>{x.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label>Şiddet</Label>
                <Select value={formData.bioSeverity?.toString() || ''} onValueChange={(val) => {
                  const s = parseFloat(val);
                  const score = calculateScore(formData.bioProbability, formData.bioFrequency, s);
                  setFormData({...formData, bioSeverity: s, bioScore: score});
                }}>
                  <SelectTrigger className="h-12"><SelectValue placeholder="Seçiniz"/></SelectTrigger>
                  <SelectContent className="min-w-[350px]">{FINE_KINNEY_SEVERITY.map(x => <SelectItem key={x.value} value={x.value.toString()}>{x.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-muted/50 p-4 rounded-lg border">
              <div className="font-bold text-lg">Risk Puanı: <span className="text-2xl ml-2">{formData.bioScore || 0}</span></div>
              <Badge className={cn("text-sm px-4 py-1", getFineKinneyResult(formData.bioScore || 0).color)}>{getFineKinneyResult(formData.bioScore || 0).label}</Badge>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-lg font-semibold">Genel Değerlendirme</Label>
            <Textarea value={formData.evaluationNotes || ''} onChange={e => setFormData({...formData, evaluationNotes: e.target.value})} rows={4} placeholder="Analiz sonuçlarına dair genel değerlendirmenizi buraya yazabilirsiniz..." className="text-base" />
          </div>

          {/* İhtiyaç Seviyesi Seçimi */}
          <div className="space-y-4 bg-muted/30 p-6 rounded-xl border border-border/50">
            <div>
              <Label className="text-xl font-bold">Göz Duşu İhtiyacı Bakımından Risk Seviyesi Sonucu</Label>
              <p className="text-sm text-muted-foreground mt-1">Bu seviye Kimyasal ve Biyolojik risk analizi ortalamasına göre otomatik hesaplanmaktadır.</p>
            </div>
            {(() => {
              const level = formData.eyewashRequirementLevel || 'Düşük Riskli Alanlar';
              let colorClass = 'bg-green-100 text-green-950 border-green-300 dark:bg-green-950/50 dark:text-green-200 dark:border-green-800';
              let desc = 'Yeterli sayıda Göz Solüsyonu bulunmalıdır. Koruyucu ekipman kullanımı zorunlu değildir.';
              
              if (level === 'Yüksek Riskli Alanlar') {
                colorClass = 'bg-red-100 text-red-950 border-red-300 dark:bg-red-950/50 dark:text-red-200 dark:border-red-800';
                desc = 'Şebekeye bağlı en az bir Göz Duşu İstasyonu bulunmalıdır. Çalışanlar ve ziyaretçiler için koruyucu ekipman (gözlük, eldiven, önlük) kullanımı zorunludur.';
              } else if (level === 'Orta Riskli Alanlar') {
                colorClass = 'bg-yellow-100 text-yellow-950 border-yellow-300 dark:bg-yellow-950/50 dark:text-yellow-200 dark:border-yellow-800';
                desc = 'Şebekeye bağlı bir Göz Duşu veya yeterli Göz Solüsyonu bulunmalıdır. Asgari koruyucu gözlük zorunludur.';
              }

              return (
                <div className={cn("p-4 rounded-xl border-2", colorClass)}>
                  <div className="font-bold text-xl">{level}</div>
                  <div className="text-base mt-2 opacity-90 leading-relaxed">{desc}</div>
                </div>
              );
            })()}
          </div>

          <div className="space-y-3">
            <Label className="text-lg font-semibold">Aksiyon Planı</Label>
            <Textarea value={formData.actionPlan || ''} onChange={e => setFormData({...formData, actionPlan: e.target.value})} rows={3} placeholder="Risklerin azaltılması için alınacak aksiyonlar..." />
          </div>

          <div className="border-t pt-8 space-y-6">
            <div>
              <h3 className="font-bold text-xl text-primary">İyileştirme Takibi ve Etkinlik Ölçümü</h3>
              <p className="text-sm text-muted-foreground mt-1">(Bu alan iyileştirme çalışması planlandığı veya tamamlandığı durumlarda daha sonra da doldurulabilir.)</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/10 p-6 rounded-xl border border-border/50">
              <div className="space-y-3">
                <Label>İyileştirme Açıklaması</Label>
                <Input value={formData.improvementDescription || ''} onChange={e => setFormData({...formData, improvementDescription: e.target.value})} className="h-11" />
              </div>
              <div className="space-y-3">
                <Label>İyileştirme Tamamlanma Tarihi</Label>
                <Input type="date" value={formData.improvementTargetDate?.split('T')[0] || ''} onChange={e => setFormData({...formData, improvementTargetDate: e.target.value})} className="h-11" />
              </div>
              <div className="space-y-3">
                <Label>Etkinlik Ölçüm Yöntemi</Label>
                <Select value={formData.effectivenessMethod || ''} onValueChange={val => setFormData({...formData, effectivenessMethod: val})}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Seçiniz"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gösterge Takibi">Gösterge Takibi</SelectItem>
                    <SelectItem value="Belgelendirme (Rapor, Tatbikat, Kayıt vb.)">Belgelendirme (Rapor, Tatbikat, Kayıt vb.)</SelectItem>
                    <SelectItem value="Sınav / Değerlendirme">Sınav / Değerlendirme</SelectItem>
                    <SelectItem value="Diğer">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label>İyileştirme Kontrol Sorumlusu</Label>
                <Input value={formData.improvementController || ''} onChange={e => setFormData({...formData, improvementController: e.target.value})} className="h-11" />
              </div>

              {/* Görsel Yükleme */}
              <div className="space-y-3 col-span-1 md:col-span-2 border-t pt-4 border-dashed mt-2">
                <Label>İyileştirme Sonrası Görseli</Label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Button variant="outline" type="button" disabled={isUploading} className="h-11 px-6 border-dashed border-2 hover:bg-accent/50 cursor-pointer">
                      {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                      {isUploading ? 'Yükleniyor...' : 'Görsel Seç ve Yükle'}
                    </Button>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileUpload} 
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                      disabled={isUploading}
                    />
                  </div>
                  {formData.improvementImageUrl && (
                    <div className="flex items-center gap-4">
                      <a href={formData.improvementImageUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-500 hover:underline">
                        Yüklenen Görseli Görüntüle
                      </a>
                      <Button variant="ghost" size="sm" onClick={() => setFormData({...formData, improvementImageUrl: null})} className="text-red-500">Kaldır</Button>
                    </div>
                  )}
                </div>
                {formData.improvementImageUrl && (
                  <div className="mt-4">
                    <img src={formData.improvementImageUrl} alt="İyileştirme" className="h-32 object-contain rounded border bg-white p-1" />
                  </div>
                )}
              </div>

              <div className="space-y-3 col-span-1 md:col-span-2">
                <Label>Sonuç</Label>
                <Textarea value={formData.improvementResult || ''} onChange={e => setFormData({...formData, improvementResult: e.target.value})} rows={3} placeholder="İyileştirme sonucuna dair bilgiler..." className="text-base" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

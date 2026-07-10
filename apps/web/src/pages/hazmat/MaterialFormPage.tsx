import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { API_URL, BASE_URL } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Search, Check, Save, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function MaterialFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const returnTo = location.state?.returnTo || '/hazmat/materials';
  const isEditMode = !!id;
  const queryClient = useQueryClient();
  const activeFacilityId = localStorage.getItem('activeFacilityId');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGlobalMaterial, setSelectedGlobalMaterial] = useState<any>(null);

  // Miktar Cinsleri
  const { data: units = [] } = useQuery<any[]>({
    queryKey: ['hazmat-units'],
    queryFn: async () => {
      const res = await api.get('/hazmat/settings/units');
      if (!res.ok) throw new Error('Hata');
      return res.json();
    }
  });

  // GHS Etiketleri
  const { data: hazardLabels = [] } = useQuery<any[]>({
    queryKey: ['hazmat-hazard-labels'],
    queryFn: async () => {
      const res = await api.get('/hazmat/settings/hazard-labels');
      if (!res.ok) throw new Error('Hata');
      return res.json();
    }
  });

  // ADR Etiketleri
  const { data: adrLabels = [] } = useQuery<any[]>({
    queryKey: ['hazmat-adr-labels'],
    queryFn: async () => {
      const res = await api.get('/hazmat/settings/adr-labels');
      if (!res.ok) throw new Error('Hata');
      return res.json();
    }
  });

  // KKD'ler
  const { data: ppes = [] } = useQuery<any[]>({
    queryKey: ['hazmat-ppes'],
    queryFn: async () => {
      const res = await api.get('/hazmat/settings/ppes');
      if (!res.ok) throw new Error('Hata');
      return res.json();
    }
  });

  // Kategoriler
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['hazmat-categories'],
    queryFn: async () => {
      const res = await api.get('/hazmat/settings/categories');
      if (!res.ok) throw new Error('Hata');
      return res.json();
    }
  });

  // Akıllı Arama
  const { data: searchResults = [], isFetching: isSearching } = useQuery<any[]>({
    queryKey: ['hazmat-search', searchQuery],
    queryFn: async () => {
      if (searchQuery.length < 2) return [];
      const res = await api.get(`/hazmat/materials/search?q=${searchQuery}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: searchQuery.length >= 2,
  });

  const [formData, setFormData] = useState({
    productName: '', brandName: '', amountValue: '', unitId: '', categoryId: '',
    usageMethod: '', composition: '', hazardDescription: '',
    firstAid: '', fireFightingMeasures: '', accidentalReleaseMeasures: '',
    handlingAndStorage: '', exposureControls: '', physicalProperties: '',
    stabilityAndReactivity: '', toxicologicalInfo: '', ecologicalInfo: '',
    disposalConsiderations: '', transportInfo: '', regulatoryInfo: '',
    hazardLabelIds: [] as string[],
    adrLabelIds: [] as string[],
    ppeIds: [] as string[],
    imageUrl: '',
    sdsUrl: '',
    sdsExpiryDate: ''
  });

  // Fetch data if edit mode
  useQuery({
    queryKey: ['material-edit', id],
    queryFn: async () => {
      if (!isEditMode) return null;
      const res = await api.get(`/hazmat/materials/${id}?facilityId=${activeFacilityId}`);
      if (!res.ok) throw new Error('Hata');
      const data = await res.json();
      const mat = data.material;
      const fac = data.facilityItem;
      setFormData({
        productName: mat.productName || '',
        brandName: mat.brandName || '',
        amountValue: fac?.amountValue || '',
        unitId: fac?.unitId || '',
        categoryId: mat.categoryId || '',
        usageMethod: mat.usageMethod || '',
        composition: mat.composition || '',
        hazardDescription: mat.hazardDescription || '',
        firstAid: mat.firstAid || '',
        fireFightingMeasures: mat.fireFightingMeasures || '',
        accidentalReleaseMeasures: mat.accidentalReleaseMeasures || '',
        handlingAndStorage: mat.handlingAndStorage || '',
        exposureControls: mat.exposureControlsPpe || '',
        physicalProperties: mat.physicalAndChemicalProperties || '',
        stabilityAndReactivity: mat.stabilityAndReactivity || '',
        toxicologicalInfo: mat.toxicologicalInformation || '',
        ecologicalInfo: mat.ecologicalInformation || '',
        disposalConsiderations: mat.disposalConsiderations || '',
        transportInfo: mat.transportInfo || '',
        regulatoryInfo: mat.regulatoryInfo || '',
        hazardLabelIds: mat.hazardLabels?.map((hl: any) => hl.labelId) || [],
        adrLabelIds: mat.adrLabels?.map((al: any) => al.labelId) || [],
        ppeIds: mat.ppes?.map((p: any) => p.ppeId) || [],
        imageUrl: mat.imageUrl || '',
        sdsUrl: mat.sdsUrl || '',
        sdsExpiryDate: mat.sdsExpiryDate ? new Date(mat.sdsExpiryDate).toISOString().split('T')[0] : ''
      });
      return data;
    },
    enabled: isEditMode && !!activeFacilityId
  });

  const handleSelectGlobal = (mat: any) => {
    setSelectedGlobalMaterial(mat);
    setSearchQuery('');
    setFormData({
      ...formData,
      productName: mat.productName || '',
      brandName: mat.brandName || '',
      categoryId: mat.categoryId || '',
      usageMethod: mat.usageMethod || '',
      composition: mat.composition || '',
      hazardDescription: mat.hazardDescription || '',
      firstAid: mat.firstAid || '',
      fireFightingMeasures: mat.fireFightingMeasures || '',
      accidentalReleaseMeasures: mat.accidentalReleaseMeasures || '',
      handlingAndStorage: mat.handlingAndStorage || '',
      exposureControls: mat.exposureControls || '',
      physicalProperties: mat.physicalProperties || '',
      stabilityAndReactivity: mat.stabilityAndReactivity || '',
      toxicologicalInfo: mat.toxicologicalInfo || '',
      ecologicalInfo: mat.ecologicalInfo || '',
      disposalConsiderations: mat.disposalConsiderations || '',
      transportInfo: mat.transportInfo || '',
      regulatoryInfo: mat.regulatoryInfo || '',
      hazardLabelIds: mat.hazardLabels?.map((hl: any) => hl.labelId) || [],
      adrLabelIds: mat.adrLabels?.map((hl: any) => hl.labelId) || [],
      ppeIds: mat.ppes?.map((p: any) => p.ppeId) || [],
      imageUrl: mat.imageUrl || '',
      sdsUrl: mat.sdsUrl || '',
      sdsExpiryDate: mat.sdsExpiryDate ? new Date(mat.sdsExpiryDate).toISOString().split('T')[0] : ''
    });
    toast.success('Kütüphaneden bilgiler başarıyla çekildi. Sadece Miktar bilgisini girip kaydedebilirsiniz.');
  };

  const handleResetGlobal = () => {
    setSelectedGlobalMaterial(null);
    setFormData({
      productName: searchQuery, brandName: '', amountValue: '', unitId: '', categoryId: '',
      usageMethod: '', composition: '', hazardDescription: '',
      firstAid: '', fireFightingMeasures: '', accidentalReleaseMeasures: '',
      handlingAndStorage: '', exposureControls: '', physicalProperties: '',
      stabilityAndReactivity: '', toxicologicalInfo: '', ecologicalInfo: '',
      disposalConsiderations: '', transportInfo: '', regulatoryInfo: '',
      hazardLabelIds: [], adrLabelIds: [], ppeIds: [],
      imageUrl: '', sdsUrl: '', sdsExpiryDate: ''
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'imageUrl' | 'sdsUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    const uploadToast = toast.loading('Dosya yükleniyor...');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/hazmat/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataUpload
      });

      if (!res.ok) throw new Error('Yükleme başarısız');
      const data = await res.json();
      setFormData(prev => ({ ...prev, [fieldName]: data.url }));
      toast.success('Dosya yüklendi.', { id: uploadToast });
    } catch (error) {
      console.error(error);
      toast.error('Dosya yüklenirken hata oluştu.', { id: uploadToast });
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { hazardLabelIds, adrLabelIds, ppeIds, amountValue, unitId, ...materialData } = data;
      
      if (isEditMode) {
        const res = await api.put(`/hazmat/materials/${id}`, {
          facilityId: activeFacilityId,
          amountValue,
          unitId,
          ...materialData,
          hazardLabels: hazardLabelIds,
          adrLabels: adrLabelIds,
          ppes: ppeIds
        });
        if (!res.ok) throw new Error('Sunucu hatası');
        return res.json();
      }

      if (selectedGlobalMaterial) {
        const res = await api.post('/hazmat/materials/facility', {
          facilityId: activeFacilityId,
          materialId: selectedGlobalMaterial.id,
          amountValue: data.amountValue,
          unitId: data.unitId
        });
        if (!res.ok) throw new Error('Sunucu hatası');
        return res.json();
      } else {
        const res = await api.post('/hazmat/materials', {
          facilityId: activeFacilityId,
          amountValue,
          unitId,
          ...materialData,
          hazardLabels: hazardLabelIds,
          adrLabels: adrLabelIds,
          ppes: ppeIds
        });
        if (!res.ok) throw new Error('Sunucu hatası');
        return res.json();
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['facility-materials'] });
      await queryClient.invalidateQueries({ queryKey: ['material-details'] });
      await queryClient.invalidateQueries({ queryKey: ['global-materials'] });
      toast.success(isEditMode ? 'Tehlikeli Madde güncellendi!' : 'Tehlikeli Madde başarıyla tesise eklendi!');
      navigate(returnTo);
    },
    onError: (err: any) => {
      toast.error('Bir hata oluştu. Veritabanı bağlantınızı kontrol edin.');
    }
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productName) {
      toast.error('Ürün Adı zorunludur.');
      return;
    }
    
    let finalProductName = formData.productName.trim();
    // Sıfırdan ekleme yapılıyorsa otomatik olarak (Miktar Birim) ekle
    if (!isEditMode && !selectedGlobalMaterial && formData.amountValue && formData.unitId) {
      const selectedUnit = units.find(u => u.id === formData.unitId);
      if (selectedUnit) {
        const suffix = `(${formData.amountValue} ${selectedUnit.symbol})`;
        if (!finalProductName.includes(suffix)) {
          finalProductName = `${finalProductName} ${suffix}`;
        }
      }
    }

    createMutation.mutate({ ...formData, productName: finalProductName });
  };

  const toggleArrayItem = (listName: 'hazardLabelIds'|'adrLabelIds'|'ppeIds', id: string) => {
    if (selectedGlobalMaterial) return;
    setFormData(prev => ({
      ...prev,
      [listName]: prev[listName].includes(id) 
        ? prev[listName].filter((x: string) => x !== id) 
        : [...prev[listName], id]
    }));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/hazmat/materials')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isEditMode ? 'Maddeyi Düzenle' : 'Yeni Madde Ekle'}</h1>
          <p className="text-muted-foreground">{isEditMode ? 'Bu maddedeki içerik güncellemeleri tüm tesisleri etkiler.' : 'Kütüphanede arama yapın veya yeni oluşturun.'}</p>
        </div>
      </div>

      {isEditMode && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg flex flex-col gap-2">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-semibold">
            <AlertTriangle className="w-5 h-5" />
            Önemli Uyarı
          </div>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Miktar ve Birim bilgisi sadece sizin tesisiniz için güncellenir. Ancak ürünün <b>diğer 18 alanında</b> (İlk yardım, Tehlike Tanımı vb.) yapacağınız tüm değişiklikler ortak veritabanını günceller ve <b>bu maddeyi kullanan diğer tesisleri de etkiler.</b> Lütfen güncellemelerinizi dikkatli yapın.
          </p>
        </div>
      )}

      {!selectedGlobalMaterial && !isEditMode && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-6 rounded-lg relative">
          <Label className="text-blue-800 dark:text-blue-200 font-semibold mb-2 block">Akıllı Kütüphane Araması</Label>
          <p className="text-sm text-blue-600 dark:text-blue-300 mb-4">
            Eklemek istediğiniz maddenin ürün adını veya markasını yazın. Sistemde kayıtlıysa özelliklerini otomatik getirebiliriz.
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Ürün adı veya marka yazın (Örn: Aseton, Merbolin...)" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-6 text-lg shadow-sm"
            />
            {isSearching && <span className="absolute right-4 top-3 text-sm text-muted-foreground">Aranıyor...</span>}
          </div>

          {searchQuery.length >= 2 && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
              {searchResults.map((res: any) => (
                <div 
                  key={res.id} 
                  className="p-3 hover:bg-muted cursor-pointer border-b last:border-0"
                  onClick={() => handleSelectGlobal(res)}
                >
                  <div className="font-semibold">{res.productName}</div>
                  <div className="text-sm text-muted-foreground">Marka: {res.brandName || '-'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedGlobalMaterial && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-green-800 dark:text-green-200">Kütüphaneden Seçildi: {selectedGlobalMaterial.productName}</h3>
            <p className="text-sm text-green-700 dark:text-green-300">Özellikler kilitlendi. Sadece tesisiniz için miktar bilgisini girip kaydedebilirsiniz.</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleResetGlobal} className="border-green-300 text-green-700 hover:bg-green-100">
            Vazgeç ve Yeni Oluştur
          </Button>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-8">
        
        <div className="bg-card border rounded-lg p-6 shadow-sm">
          <div className="space-y-6">
            {/* 1. Ürün Adı */}
            <div className="space-y-2">
              <Label className="text-base">1. Ürün Adı <span className="text-red-500">*</span></Label>
              <Input required value={formData.productName} onChange={e => setFormData({...formData, productName: e.target.value})} disabled={!!selectedGlobalMaterial && !isEditMode} />
            </div>

            {/* 2. Markası */}
            <div className="space-y-2">
              <Label className="text-base">2. Markası</Label>
              <Input value={formData.brandName} onChange={e => setFormData({...formData, brandName: e.target.value})} disabled={!!selectedGlobalMaterial && !isEditMode} />
            </div>

            {/* 2.5. Kategori */}
            <div className="space-y-2">
              <Label className="text-base">Tehlikeli Madde Kategorisi</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:opacity-50" 
                value={formData.categoryId} 
                onChange={e => setFormData({...formData, categoryId: e.target.value})}
                disabled={!!selectedGlobalMaterial && !isEditMode}
              >
                <option value="">Seçiniz (Opsiyonel)</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id} title={c.scope}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* 3. Miktarı ve Birimi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-base">3. Miktarı <span className="text-red-500">*</span></Label>
                <Input type="number" step="0.01" required value={formData.amountValue} onChange={e => setFormData({...formData, amountValue: e.target.value})} placeholder="Örn: 50" />
              </div>
              <div className="space-y-2">
                <Label className="text-base">Miktar Cinsi (Birim) <span className="text-red-500">*</span></Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" required value={formData.unitId} onChange={e => setFormData({...formData, unitId: e.target.value})}>
                  <option value="">Seçiniz...</option>
                  {units.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4. Kullanım Şekli */}
            <div className="space-y-2">
              <Label className="text-base">4. Kullanım Şekli</Label>
              <Textarea value={formData.usageMethod} onChange={e => setFormData({...formData, usageMethod: e.target.value})} disabled={!!selectedGlobalMaterial && !isEditMode} />
            </div>

            {/* 5. Bileşimi / İçeriği */}
            <div className="space-y-2">
              <Label className="text-base">5. Bileşimi / İçeriği</Label>
              <Textarea value={formData.composition} onChange={e => setFormData({...formData, composition: e.target.value})} disabled={!!selectedGlobalMaterial && !isEditMode} />
            </div>

            {/* 6. Tehlike Tanımı */}
            <div className="space-y-2">
              <Label className="text-base">6. Tehlike Tanımı</Label>
              <Textarea value={formData.hazardDescription} onChange={e => setFormData({...formData, hazardDescription: e.target.value})} disabled={!!selectedGlobalMaterial && !isEditMode} />
            </div>

            {/* 7. Tehlike Etiketleri (ADR) */}
            <div className="space-y-2">
              <Label className="text-base block mb-3">7. Tehlike Etiketleri (ADR)</Label>
              <div className="flex flex-wrap gap-4">
                {hazardLabels.map(hl => {
                  const isSelected = formData.hazardLabelIds.includes(hl.id);
                  return (
                    <div key={hl.id} onClick={() => toggleArrayItem('hazardLabelIds', hl.id)} className={`w-24 h-24 border rounded-lg flex flex-col items-center justify-center p-2 cursor-pointer transition-all ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md ring-2 ring-blue-500' : 'border-dashed hover:bg-muted'} ${!!selectedGlobalMaterial && !isEditMode && 'opacity-60 cursor-not-allowed'}`}>
                      {hl.imageUrl ? <img src={hl.imageUrl} alt={hl.name} className="w-12 h-12 object-contain mb-1" /> : <div className="w-12 h-12 bg-muted rounded flex items-center justify-center mb-1 text-xs">Yok</div>}
                      <span className="text-[10px] font-semibold text-center leading-tight">{hl.name}</span>
                      {isSelected && <Check className="w-4 h-4 text-blue-500 absolute top-1 right-1" />}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 8. İlkyardım Önlemleri */}
            <div className="space-y-2">
              <Label className="text-base">8. İlkyardım Önlemleri</Label>
              <Textarea value={formData.firstAid} onChange={e => setFormData({...formData, firstAid: e.target.value})} disabled={!!selectedGlobalMaterial && !isEditMode} />
            </div>

            {/* 9. Yangınla Mücadele Tedbirleri */}
            <div className="space-y-2">
              <Label className="text-base">9. Yangınla Mücadele Tedbirleri</Label>
              <Textarea value={formData.fireFightingMeasures} onChange={e => setFormData({...formData, fireFightingMeasures: e.target.value})} disabled={!!selectedGlobalMaterial && !isEditMode} />
            </div>

            {/* 10. Kaza Sonucu Serbest Kalması Durumunda Alınacak Tedbirler */}
            <div className="space-y-2">
              <Label className="text-base">10. Kaza Sonucu Serbest Kalması Durumunda Alınacak Tedbirler</Label>
              <Textarea value={formData.accidentalReleaseMeasures} onChange={e => setFormData({...formData, accidentalReleaseMeasures: e.target.value})} disabled={!!selectedGlobalMaterial && !isEditMode} />
            </div>

            {/* 11. Kullanım ve Depolama */}
            <div className="space-y-2">
              <Label className="text-base">11. Kullanım ve Depolama</Label>
              <Textarea value={formData.handlingAndStorage} onChange={e => setFormData({...formData, handlingAndStorage: e.target.value})} disabled={!!selectedGlobalMaterial && !isEditMode} />
            </div>

            {/* 12. Maruz Kalma Kontrolü ve Kişisel Korunma */}
            <div className="space-y-2">
              <Label className="text-base">12. Maruz Kalma Kontrolü ve Kişisel Korunma</Label>
              <Textarea value={formData.exposureControls} onChange={e => setFormData({...formData, exposureControls: e.target.value})} disabled={!!selectedGlobalMaterial && !isEditMode} />
            </div>

            {/* 13. Fiziksel ve Kimyasal Özellikleri */}
            <div className="space-y-2">
              <Label className="text-base">13. Fiziksel ve Kimyasal Özellikleri</Label>
              <Textarea value={formData.physicalProperties} onChange={e => setFormData({...formData, physicalProperties: e.target.value})} disabled={!!selectedGlobalMaterial && !isEditMode} />
            </div>

            {/* 14. Stabilite ve Reaktivite */}
            <div className="space-y-2">
              <Label className="text-base">14. Stabilite ve Reaktivite</Label>
              <Textarea value={formData.stabilityAndReactivity} onChange={e => setFormData({...formData, stabilityAndReactivity: e.target.value})} disabled={!!selectedGlobalMaterial && !isEditMode} />
            </div>

            {/* 15. Toksikolojik Bilgi */}
            <div className="space-y-2">
              <Label className="text-base">15. Toksikolojik Bilgi</Label>
              <Textarea value={formData.toxicologicalInfo} onChange={e => setFormData({...formData, toxicologicalInfo: e.target.value})} disabled={!!selectedGlobalMaterial && !isEditMode} />
            </div>

            {/* 16. Ekolojik Bilgi */}
            <div className="space-y-2">
              <Label className="text-base">16. Ekolojik Bilgi</Label>
              <Textarea value={formData.ecologicalInfo} onChange={e => setFormData({...formData, ecologicalInfo: e.target.value})} disabled={!!selectedGlobalMaterial && !isEditMode} />
            </div>

            {/* 17. Temizlik/ İmha Yöntemi */}
            <div className="space-y-2">
              <Label className="text-base">17. Temizlik/ İmha Yöntemi</Label>
              <Textarea value={formData.disposalConsiderations} onChange={e => setFormData({...formData, disposalConsiderations: e.target.value})} disabled={!!selectedGlobalMaterial && !isEditMode} />
            </div>

            {/* 18. Taşıma Bilgisi */}
            <div className="space-y-2">
              <Label className="text-base">18. Taşıma Bilgisi</Label>
              <Textarea value={formData.transportInfo} onChange={e => setFormData({...formData, transportInfo: e.target.value})} disabled={!!selectedGlobalMaterial && !isEditMode} />
            </div>

            {/* 19. Tehlike Etiketleri (GHS) */}
            <div className="space-y-2">
              <Label className="text-base block mb-3">19. Tehlike Etiketleri (GHS)</Label>
              <div className="flex flex-wrap gap-4">
                {adrLabels.map(hl => {
                  const isSelected = formData.adrLabelIds.includes(hl.id);
                  return (
                    <div key={hl.id} onClick={() => toggleArrayItem('adrLabelIds', hl.id)} className={`w-24 h-24 border rounded-lg flex flex-col items-center justify-center p-2 cursor-pointer transition-all ${isSelected ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-md ring-2 ring-orange-500' : 'border-dashed hover:bg-muted'} ${!!selectedGlobalMaterial && !isEditMode && 'opacity-60 cursor-not-allowed'}`}>
                      {hl.imageUrl ? <img src={hl.imageUrl} alt={hl.name} className="w-12 h-12 object-contain mb-1" /> : <div className="w-12 h-12 bg-muted rounded flex items-center justify-center mb-1 text-xs">Yok</div>}
                      <span className="text-[10px] font-semibold text-center leading-tight">{hl.name}</span>
                      {isSelected && <Check className="w-4 h-4 text-orange-500 absolute top-1 right-1" />}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 20. Yönetmelik Bilgisi */}
            <div className="space-y-2">
              <Label className="text-base">20. Yönetmelik Bilgisi</Label>
              <Textarea value={formData.regulatoryInfo} onChange={e => setFormData({...formData, regulatoryInfo: e.target.value})} disabled={!!selectedGlobalMaterial && !isEditMode} />
            </div>

            {/* 21. Kullanılması Gereken Kişisel Koruyucu Donanımlar */}
            <div className="space-y-2">
              <Label className="text-base block mb-3">21. Kullanılması Gereken Kişisel Koruyucu Donanımlar</Label>
              <div className="flex flex-wrap gap-4">
                {ppes.map(ppe => {
                  const isSelected = formData.ppeIds.includes(ppe.id);
                  return (
                    <div key={ppe.id} onClick={() => toggleArrayItem('ppeIds', ppe.id)} className={`w-28 h-28 border rounded-lg flex flex-col items-center justify-center p-2 cursor-pointer transition-all ${isSelected ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md ring-2 ring-green-500' : 'border-dashed hover:bg-muted'} ${!!selectedGlobalMaterial && !isEditMode && 'opacity-60 cursor-not-allowed'}`}>
                      {ppe.imageUrl ? <img src={ppe.imageUrl} alt={ppe.name} className="w-14 h-14 object-contain mb-2" /> : <div className="w-14 h-14 bg-muted rounded flex items-center justify-center mb-2 text-xs">Görsel Yok</div>}
                      <span className="text-[10px] font-medium text-center leading-tight">{ppe.name}</span>
                      {isSelected && <Check className="w-4 h-4 text-green-500 absolute top-1 right-1" />}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* SDS ve Görsel Yükleme */}
            <div className="pt-6 mt-6 border-t">
              <h3 className="text-lg font-semibold mb-4 flex items-center"><Search className="w-5 h-5 mr-2" /> Görsel ve Güvenlik Bilgi Formu (SDS)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-base">Ürün Görseli</Label>
                  {formData.imageUrl && (
                    <div className="mb-2 relative w-32 h-32 border rounded-lg overflow-hidden flex items-center justify-center">
                      <img src={`${BASE_URL}${formData.imageUrl}`} alt="Görsel" className="max-w-full max-h-full object-contain" />
                    </div>
                  )}
                  <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'imageUrl')} disabled={!!selectedGlobalMaterial && !isEditMode} />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-base">SDS Belgesi (PDF)</Label>
                  {formData.sdsUrl && (
                    <div className="mb-2 text-sm text-blue-600 dark:text-blue-400">
                      <a href={`${BASE_URL}${formData.sdsUrl}`} target="_blank" rel="noreferrer" className="underline">Belgeyi Görüntüle</a>
                    </div>
                  )}
                  <Input type="file" accept="application/pdf" onChange={(e) => handleFileUpload(e, 'sdsUrl')} disabled={!!selectedGlobalMaterial && !isEditMode} />
                </div>

                <div className="space-y-2">
                  <Label className="text-base">Geçerlilik Tarihi (Opsiyonel)</Label>
                  <Input type="date" value={formData.sdsExpiryDate} onChange={e => setFormData({...formData, sdsExpiryDate: e.target.value})} disabled={!!selectedGlobalMaterial && !isEditMode} />
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="flex justify-end gap-4 pb-12">
          <Button variant="outline" type="button" onClick={() => navigate(returnTo)}>İptal</Button>
          <Button type="submit" disabled={createMutation.isLoading} className="px-8">
            <Save className="w-4 h-4 mr-2" />
            {createMutation.isLoading ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </form>
    </div>
  );
}

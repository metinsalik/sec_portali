import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Save, Wrench, Camera, Check } from 'lucide-react';
import { format, add } from 'date-fns';

export default function FireEquipmentMaintenancePage() {
  const { id } = useParams();
  const facilityId = localStorage.getItem('activeFacilityId');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<any>({
    maintenanceDate: format(new Date(), 'yyyy-MM-dd'),
    companyId: 'none',
    technician: '',
    result: 'UYGUN',
    description: '',
    nextMaintenanceDate: format(add(new Date(), { years: 1 }), 'yyyy-MM-dd'),
    equipmentStatus: ''
  });

  const [maintenanceData, setMaintenanceData] = useState<any>({});
  const [file, setFile] = useState<File | null>(null);

  const { data: companies } = useQuery({
    queryKey: ['fire-companies', facilityId],
    queryFn: async () => {
      const res = await api.get(`/fire-equipment/companies/${facilityId}`);
      return res.json();
    },
    enabled: !!facilityId
  });

  const { data: responsibles } = useQuery({
    queryKey: ['fire-responsibles', facilityId],
    queryFn: async () => {
      const res = await api.get(`/fire-equipment/responsibles/${facilityId}`);
      return res.json();
    },
    enabled: !!facilityId
  });

  const { data: equipment } = useQuery({
    queryKey: ['fire-equipment', id],
    queryFn: async () => {
      const res = await api.get(`/fire-equipment/equipment/detail/${id}`);
      return res.json();
    },
    enabled: !!id
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      return api.customFetch(`/fire-equipment/equipment/${id}/maintenance`, {
        method: 'POST',
        body: data
      });
    },
    onSuccess: () => {
      toast.success('Bakım kaydı başarıyla oluşturuldu.');
      queryClient.invalidateQueries({ queryKey: ['fire-equipment', id] });
      navigate(`/fire-equipment/view/${id}`);
    },
    onError: (error: any) => {
      toast.error('İşlem sırasında bir hata oluştu: ' + error.message);
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleMaintenanceDataChange = (name: string, value: any) => {
    setMaintenanceData((prev: any) => ({ ...prev, [name]: value }));
  };

  const maintenanceParams = equipment?.category?.maintenanceParameters || [];

  useEffect(() => {
    if (maintenanceParams.length > 0) {
      const statusParams = maintenanceParams.filter((p: any) => p.type === 'checkbox');
      if (statusParams.length > 0) {
        const total = statusParams.length;
        // Count how many are explicitly answered 'UYGUN'
        const uygunCount = statusParams.filter((p: any) => maintenanceData[p.id] === 'UYGUN').length;
        // Count how many questions are answered (any value)
        const answeredCount = statusParams.filter((p: any) => maintenanceData[p.id] !== undefined).length;
        
        // Only calculate final result if all questions are answered, otherwise assume UYGUN or wait.
        // Actually the user wants it to auto-calculate. If 4/5 is SARTLI_UYGUN, ratio is 0.8.
        const ratio = uygunCount / total;
        let newResult = 'UYGUN';
        if (ratio < 1 && ratio >= 0.8) newResult = 'SARTLI_UYGUN';
        else if (ratio < 0.8) newResult = 'UYGUN_DEGIL';
        
        if (formData.result !== newResult) {
          setFormData((prev: any) => ({ ...prev, result: newResult }));
        }
      }
    }
  }, [maintenanceData, equipment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.result !== 'UYGUN' && (!formData.description || formData.description.trim() === '')) {
      toast.error('Uygun olmayan durumlar için lütfen açıklama giriniz.');
      return;
    }

    if (formData.result === 'UYGUN_DEGIL' && !formData.equipmentStatus) {
      toast.error('Lütfen Bakım Sonrası Ekipman Durumu seçiniz.');
      return;
    }

    const payload = new FormData();
    payload.append('maintenanceDate', formData.maintenanceDate);
    payload.append('result', formData.result);
    if (formData.equipmentStatus) {
      payload.append('equipmentStatus', formData.equipmentStatus);
    }
    if (formData.companyId !== 'none') {
      payload.append('companyId', formData.companyId);
    }
    payload.append('technician', formData.technician);
    payload.append('description', formData.description);
    payload.append('nextMaintenanceDate', formData.nextMaintenanceDate);
    payload.append('maintenanceData', JSON.stringify(maintenanceData));
    
    if (file) {
      payload.append('attachment', file);
    }

    mutation.mutate(payload);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <Wrench className="w-6 h-6 text-orange-500" /> Bakım Kaydı Ekle
          </h1>
          {equipment && <p className="text-sm text-muted-foreground mt-1">{equipment.equipmentNo} - {equipment.category?.name}</p>}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-lg">Bakım Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="maintenanceDate">Bakım Tarihi *</Label>
                <Input type="date" id="maintenanceDate" name="maintenanceDate" value={formData.maintenanceDate} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label>Genel Sonuç</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.result} 
                  onChange={(e) => handleSelectChange('result', e.target.value)} 
                  disabled
                >
                  <option value="UYGUN">Uygun</option>
                  <option value="SARTLI_UYGUN">Şartlı Uygun</option>
                  <option value="UYGUN_DEGIL">Uygun Değil</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">Sonuç, işaretlenen kontrollere göre otomatik hesaplanır.</p>
              </div>

              {formData.result === 'UYGUN_DEGIL' && (
                <div className="space-y-2 md:col-span-2 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <Label className="text-orange-800 font-bold">Bakım Sonrası Ekipman Durumu *</Label>
                  <p className="text-xs text-orange-700 mb-2">Bu ekipman uygun değil. Peki şimdi ne olacak? Seçtiğiniz durum ekipmana otomatik atanacaktır.</p>
                  <select 
                    className="flex h-10 w-full rounded-md border border-orange-300 bg-white px-3 py-2 text-sm ring-offset-background"
                    value={formData.equipmentStatus} 
                    onChange={(e) => handleSelectChange('equipmentStatus', e.target.value)} 
                    required
                  >
                    <option value="">-- Durum Seçin --</option>
                    <option value="DEGISIME_GIDEN">Değişime Giden (Depodan yenisi takılacak)</option>
                    <option value="HURDA">Hurda (Kullanılamaz)</option>
                    <option value="ARIZALI">Arızalı (Tamir Bekliyor)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Dinamik Bakım Parametreleri (Check UI) */}
            {maintenanceParams.length > 0 && (
              <div className="p-5 bg-muted/20 rounded-xl space-y-5 border shadow-sm">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">✅ Bakım Kontrol Listesi</h3>
                  {maintenanceParams.filter((p:any) => p.type === 'checkbox').length > 0 && (
                    <span className="text-xs font-medium px-3 py-1 bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900/30 dark:text-blue-400">
                      {maintenanceParams.filter((p:any) => p.type === 'checkbox' && maintenanceData[p.id] !== undefined).length} / {maintenanceParams.filter((p:any) => p.type === 'checkbox').length} Yanıtlandı
                    </span>
                  )}
                </div>
                
                {/* Progress Bar (Answered Ratio) */}
                {maintenanceParams.filter((p:any) => p.type === 'checkbox').length > 0 && (
                  <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-800">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${(maintenanceParams.filter((p:any) => p.type === 'checkbox' && maintenanceData[p.id] !== undefined).length / maintenanceParams.filter((p:any) => p.type === 'checkbox').length) * 100}%` }}
                    ></div>
                  </div>
                )}

                <div className="space-y-4 mt-4">
                  {maintenanceParams.map((param: any, idx: number) => {
                    if (param.type === 'date') {
                      return (
                        <div key={idx} className="space-y-2 pt-4 border-t mt-4">
                          <Label className="text-sm font-medium">{param.label}</Label>
                          <Input 
                            type="date"
                            value={maintenanceData[param.id] || ''}
                            onChange={(e) => handleMaintenanceDataChange(param.id, e.target.value)}
                          />
                        </div>
                      );
                    }
                    
                    const value = maintenanceData[param.id];
                    return (
                      <div key={idx} className="flex flex-col gap-2 p-3 rounded-lg border bg-background/50 hover:bg-background transition-colors">
                        <Label className="text-sm font-medium">{param.label}</Label>
                        <div className="grid grid-cols-3 gap-2 mt-1">
                          <button
                            type="button"
                            onClick={() => handleMaintenanceDataChange(param.id, 'UYGUN')}
                            className={`px-2 py-2 text-xs font-semibold rounded-md border transition-all ${
                              value === 'UYGUN' 
                                ? 'bg-green-500 text-white border-green-600 shadow-sm' 
                                : 'bg-muted hover:bg-green-100 hover:text-green-800'
                            }`}
                          >
                            Uygun
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMaintenanceDataChange(param.id, 'KISMEN_UYGUN')}
                            className={`px-2 py-2 text-xs font-semibold rounded-md border transition-all ${
                              value === 'KISMEN_UYGUN' 
                                ? 'bg-orange-500 text-white border-orange-600 shadow-sm' 
                                : 'bg-muted hover:bg-orange-100 hover:text-orange-800'
                            }`}
                          >
                            Kısmen
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMaintenanceDataChange(param.id, 'UYGUN_DEGIL')}
                            className={`px-2 py-2 text-xs font-semibold rounded-md border transition-all ${
                              value === 'UYGUN_DEGIL' 
                                ? 'bg-red-500 text-white border-red-600 shadow-sm' 
                                : 'bg-muted hover:bg-red-100 hover:text-red-800'
                            }`}
                          >
                            Uygun Değil
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Firma</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.companyId} 
                  onChange={(e) => handleSelectChange('companyId', e.target.value)}
                >
                  <option value="none">Seçilmedi</option>
                  {companies?.map((comp: any) => (
                    <option key={comp.id} value={comp.id}>{comp.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Nezaret Eden Sorumlu</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.technician} 
                  onChange={(e) => handleSelectChange('technician', e.target.value)}
                >
                  <option value="">Seçilmedi</option>
                  {responsibles?.map((resp: any) => (
                    <option key={resp.id} value={resp.name}>
                      {resp.department ? `${resp.department} - ` : ''}{resp.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Fotoğraf / Dosya Yükle</Label>
              <div className="flex items-center gap-4">
                <Input 
                  type="file" 
                  accept="image/*,application/pdf"
                  capture="environment"
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Camera className="w-4 h-4 mr-2" /> {file ? 'Dosyayı Değiştir' : 'Fotoğraf Çek / Yükle'}
                </Button>
                {file && <span className="text-sm text-muted-foreground">{file.name}</span>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Açıklama {formData.result !== 'UYGUN' && <span className="text-red-500">*</span>}</Label>
              <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Bakım notları..." required={formData.result !== 'UYGUN'} />
            </div>

            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="nextMaintenanceDate">Sonraki Bakım Tarihi</Label>
              <Input type="date" id="nextMaintenanceDate" name="nextMaintenanceDate" value={formData.nextMaintenanceDate} onChange={handleChange} />
              <p className="text-xs text-muted-foreground">Ekipmanın sonraki bakım tarihi otomatik olarak bu tarih ile güncellenecektir.</p>
            </div>

            <div className="flex justify-end gap-3 pt-6">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>İptal</Button>
              <Button type="submit" disabled={mutation.isPending} className="bg-orange-600 hover:bg-orange-700 text-white border-0">
                <Save className="w-4 h-4 mr-2" /> Kaydet
              </Button>
            </div>

          </CardContent>
        </Card>
      </form>
    </div>
  );
}

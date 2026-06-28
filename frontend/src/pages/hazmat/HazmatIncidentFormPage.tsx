import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import LocationSelector from '@/components/hazmat/LocationSelector';

interface HazmatIncidentFormPageProps {
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const HazmatIncidentFormPage = ({ initialData, onSuccess, onCancel }: HazmatIncidentFormPageProps) => {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('management');

  const [materialSearch, setMaterialSearch] = useState('');
  const [kitLocationId, setKitLocationId] = useState('');
  const [formData, setFormData] = useState<any>({
    facilityId: initialData?.facilityId || '',
    incidentTypeId: '',
    rootCause: '',
    departmentId: '',
    materialIds: [],
    incidentMode: '',
    incidentDate: '',
    interventionRequired: false,
    interventionTime: '',
    controlTime: '',
    supportReceived: false,
    supportUnitId: '',
    announcementMade: false,
    emergencyCodeId: '',
    serviceInterrupted: false,
    interruptionDuration: '0',
    evacuatedStaffCount: '0',
    evacuatedPatientCount: '0',
    injuredCount: '0',
    deceasedCount: '0',
    causeDetail: '',
    detectedEffect: '',
    observations: '',
    actionsTaken: '',
    resultEvaluation: '',
    kitUsed: false,
    spillKitId: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        facilityId: initialData.facilityId,
        categoryId: initialData.categoryId || '',
        rootCause: initialData.rootCause || '',
        departmentId: initialData.departmentId,
        materialIds: initialData.materials?.map((m: any) => m.id) || [],
        supportUnitId: initialData.supportUnitId?.toString() || '',
        emergencyCodeId: initialData.emergencyCodeId?.toString() || '',
        incidentDate: initialData.incidentDate ? new Date(initialData.incidentDate).toISOString().slice(0, 16) : '',
        interventionTime: initialData.interventionTime ? new Date(initialData.interventionTime).toISOString().slice(0, 16) : '',
        controlTime: initialData.controlTime ? new Date(initialData.controlTime).toISOString().slice(0, 16) : '',
        interruptionDuration: initialData.interruptionDuration?.toString(),
        evacuatedStaffCount: initialData.evacuatedStaffCount?.toString(),
        evacuatedPatientCount: initialData.evacuatedPatientCount?.toString(),
        injuredCount: initialData.injuredCount?.toString(),
        deceasedCount: initialData.deceasedCount?.toString(),
        kitUsed: initialData.kitUsed || false,
        spillKitId: initialData.spillKitId || '',
      });
    } else if (!isAdmin && user?.facilities?.[0]) {
      setFormData((prev: any) => ({ ...prev, facilityId: user.facilities[0] }));
    }
  }, [initialData, isAdmin, user]);

  // Queries for definitions
  const { data: facilities = [] } = useQuery<any[]>({ queryKey: ['facilities'], queryFn: async () => (await api.get('/settings/facilities')).json() });
  const { data: incidentTypes = [] } = useQuery<any[]>({ queryKey: ['hazmat-incident-types'], queryFn: async () => (await api.get('/hazmat/settings/incident-types')).json() });
  
  const { data: departments = [] } = useQuery<any[]>({ 
    queryKey: ['hazmat-departments', formData.facilityId], 
    queryFn: async () => {
      if (!formData.facilityId) return [];
      return (await api.get(`/hazmat/settings/departments?facilityId=${formData.facilityId}`)).json();
    },
    enabled: !!formData.facilityId
  });

  const { data: supportUnits = [] } = useQuery<any[]>({ queryKey: ['incident-support-units'], queryFn: async () => (await api.get('/settings/definitions/incident-support-units')).json() });
  const { data: emergencyCodes = [] } = useQuery<any[]>({ queryKey: ['emergency-codes'], queryFn: async () => (await api.get('/settings/definitions/emergency-codes')).json() });

  // Get kits for the facility to filter placements
  const { data: kits = [] } = useQuery<any[]>({
    queryKey: ['hazmat-spill-kits', formData.facilityId],
    queryFn: async () => {
      if (!formData.facilityId) return [];
      return (await api.get(`/hazmat/spill-kits?facilityId=${formData.facilityId}`)).json();
    },
    enabled: !!formData.facilityId
  });

  const { data: facilityItems = [] } = useQuery<any[]>({
    queryKey: ['hazmat-materials', formData.facilityId],
    queryFn: async () => {
      if (!formData.facilityId) return [];
      return (await api.get(`/hazmat/materials?facilityId=${formData.facilityId}`)).json();
    },
    enabled: !!formData.facilityId
  });
  const materials = facilityItems.map((item: any) => item.material);

  // Extract relevant placements
  const availableKits: { placementId: string, departmentId: string, kitName: string, location: string, code: string }[] = [];
  
  kits.forEach(kit => {
    if (kit.placements) {
      kit.placements.forEach((p: any) => {
        if (p.status === 'Aktif' || p.status === 'Sahada') {
          availableKits.push({
            placementId: p.id,
            departmentId: p.departmentId,
            kitName: kit.kitName,
            location: p.unit || p.location || p.area,
            code: kit.code || ''
          });
        }
      });
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = initialData 
        ? await api.put(`/hazmat/incidents/${initialData.id}`, data)
        : await api.post(`/hazmat/incidents`, data);
      
      if (!res.ok) { 
        const e = await res.json(); 
        throw new Error(e.error || 'Bir hata oluştu'); 
      }
      return res.json();
    },
    onSuccess: () => onSuccess()
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const isDefinitionsLoading = !facilities.length || !incidentTypes.length;

  const currentLocString = useMemo(() => {
    if (!kitLocationId) return '';
    const loc = departments.find((d: any) => d.id === kitLocationId);
    if (!loc) return '';
    return `Blok: ${loc.building || '-'} / Kat: ${loc.floor || '-'} / Birim: ${loc.name || '-'}${loc.description ? ` / Mahal: ${loc.description}` : ''}`;
  }, [kitLocationId, departments]);

  const filteredKits = availableKits.filter(k => 
    (k.departmentId && k.departmentId === kitLocationId) || 
    k.location === currentLocString
  );

  if (isDefinitionsLoading && !initialData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground italic">Tanımlamalar yükleniyor...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold border-b pb-2 text-purple-600 uppercase tracking-wider">Temel Bilgiler</h3>
          
          <div className="space-y-2">
            <Label>Tesis *</Label>
            <Select 
              value={formData.facilityId} 
              onValueChange={v => { updateField('facilityId', v); updateField('departmentId', ''); }} 
              disabled={!isAdmin && !!initialData}
            >
              <SelectTrigger>
                <SelectValue>
                  {facilities.find(f => f.id === formData.facilityId)?.name || "Tesis seçin"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {facilities
                  .filter(f => isAdmin || user?.facilities?.includes(f.id))
                  .map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)
                }
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Olay Türü *</Label>
            <Select 
              value={String(formData.incidentTypeId || '')} 
              onValueChange={v => updateField('incidentTypeId', v)}
            >
              <SelectTrigger>
                <SelectValue>
                  {incidentTypes.find(c => String(c.id) === String(formData.incidentTypeId))?.name || "Olay Türü seçin"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {incidentTypes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Kök Neden *</Label>
            <Input 
              value={formData.rootCause} 
              onChange={e => updateField('rootCause', e.target.value)} 
              required 
              placeholder="Tehlikeli Madde kaynaklı kök nedeni girin"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Lokasyon *</Label>
            <LocationSelector
              departments={departments}
              value={String(formData.departmentId || '')}
              onChange={v => {
                updateField('departmentId', v);
                if (formData.kitUsed) {
                  setKitLocationId(v);
                  updateField('spillKitId', '');
                }
              }}
              disabled={!formData.facilityId}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>İlgili Tehlikeli Madde(ler) (Opsiyonel)</Label>
            <Input 
              placeholder="Tehlikeli madde ara..." 
              value={materialSearch}
              onChange={(e) => setMaterialSearch(e.target.value)}
              className="mb-2"
            />
            <div className="border rounded-md p-2 max-h-48 overflow-y-auto bg-background space-y-1">
              {materials.length === 0 ? (
                <p className="text-xs text-muted-foreground p-2">Bu tesise tanımlı tehlikeli madde bulunamadı.</p>
              ) : (
                materials.filter((m: any) => m.productName?.toLowerCase().includes(materialSearch.toLowerCase())).length === 0 ? (
                  <p className="text-xs text-muted-foreground p-2">Aramaya uygun madde bulunamadı.</p>
                ) : (
                  materials.filter((m: any) => m.productName?.toLowerCase().includes(materialSearch.toLowerCase())).map((m: any) => (
                    <div key={m.id} className="flex items-center space-x-2 p-1.5 hover:bg-muted/50 rounded transition-colors">
                      <Checkbox 
                        id={`mat-${m.id}`}
                        checked={formData.materialIds?.includes(m.id)}
                        onCheckedChange={(checked) => {
                          const current = formData.materialIds || [];
                          if (checked) {
                            updateField('materialIds', [...current, m.id]);
                          } else {
                            updateField('materialIds', current.filter((id: string) => id !== m.id));
                          }
                        }}
                      />
                      <Label htmlFor={`mat-${m.id}`} className="text-sm cursor-pointer flex-1">{m.productName}</Label>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Olay Tarihi / Saati *</Label>
            <Input type="datetime-local" value={formData.incidentDate} onChange={e => updateField('incidentDate', e.target.value)} required />
          </div>

          {/* Döküntü Kiti Alanı */}
          <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30 space-y-3 md:col-span-2">
             <div className="flex items-center space-x-2">
                <Checkbox 
                  id="kitUsed" 
                  checked={formData.kitUsed} 
                  onCheckedChange={v => {
                    updateField('kitUsed', !!v);
                    if (!!v && formData.departmentId) {
                      setKitLocationId(formData.departmentId);
                    } else {
                      setKitLocationId('');
                    }
                    updateField('spillKitId', '');
                  }} 
                />
                <Label htmlFor="kitUsed" className="text-sm font-semibold text-blue-800 dark:text-blue-300">Döküntü Kiti Kullanıldı Mı?</Label>
              </div>
              {formData.kitUsed && (
                <div className="space-y-4 pl-6 border-l-2 border-blue-200 ml-2 mt-2">
                  <div className="space-y-2">
                    <Label className="text-xs text-blue-700 dark:text-blue-400">Kitin Bulunduğu Lokasyon</Label>
                    <LocationSelector
                      departments={departments}
                      value={kitLocationId}
                      onChange={v => {
                        setKitLocationId(v);
                        updateField('spillKitId', '');
                      }}
                      disabled={!formData.facilityId}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-blue-700 dark:text-blue-400">Kullanılan Kiti Seçin *</Label>
                    <Select 
                      value={formData.spillKitId} 
                      onValueChange={v => updateField('spillKitId', v)}
                      disabled={!kitLocationId}
                    >
                      <SelectTrigger className="h-8 border-blue-200 dark:border-blue-800">
                        <SelectValue>
                          {availableKits.find(k => k.placementId === formData.spillKitId) 
                            ? `${availableKits.find(k => k.placementId === formData.spillKitId)?.code} - ${availableKits.find(k => k.placementId === formData.spillKitId)?.kitName}`
                            : "Kit seçin"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {filteredKits.length === 0 ? (
                          <div className="p-2 text-xs text-muted-foreground text-center">Bu lokasyonda aktif kit bulunamadı.</div>
                        ) : (
                          filteredKits.map(k => (
                            <SelectItem key={k.placementId} value={k.placementId}>
                              {k.code} - {k.kitName}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-[10px] text-blue-600/70 italic">Not: Kit kullanıldığında, kiti yeniden tamamlamak için otomatik eksik kontrol kaydı oluşturulacaktır.</p>
                </div>
              )}
          </div>
        </div>

        {/* Status & Response */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold border-b pb-2 text-purple-600 uppercase tracking-wider">Müdahale & Durum</h3>
          
          <div className="grid grid-cols-2 gap-6 p-4 bg-muted/30 rounded-xl border border-border/50">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="interventionRequired" 
                  checked={formData.interventionRequired} 
                  onCheckedChange={v => updateField('interventionRequired', !!v)} 
                />
                <Label htmlFor="interventionRequired" className="text-xs">Müdahale Gerekti mi?</Label>
              </div>
              {formData.interventionRequired && (
                <div className="space-y-2">
                  <Label className="text-[10px]">Müdahale Saati</Label>
                  <Input type="datetime-local" size={1} className="h-8 text-xs" value={formData.interventionTime} onChange={e => updateField('interventionTime', e.target.value)} />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Kontrol Altına Alındığı Saat *</Label>
              <Input type="datetime-local" className="h-8 text-xs" value={formData.controlTime} onChange={e => updateField('controlTime', e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3 p-3 bg-muted/20 rounded-lg border border-border/50">
              <div className="flex items-center space-x-2">
                <Checkbox id="supportReceived" checked={formData.supportReceived} onCheckedChange={v => updateField('supportReceived', !!v)} />
                <Label htmlFor="supportReceived" className="text-xs">Destek Alındı mı?</Label>
              </div>
              {formData.supportReceived && (
                <Select 
                  value={String(formData.supportUnitId || '')} 
                  onValueChange={v => updateField('supportUnitId', v)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue>
                      {supportUnits.find(su => String(su.id) === String(formData.supportUnitId))?.name || "Birim seçin"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {supportUnits.map(su => <SelectItem key={su.id} value={String(su.id)}>{su.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-3 p-3 bg-muted/20 rounded-lg border border-border/50">
              <div className="flex items-center space-x-2">
                <Checkbox id="announcementMade" checked={formData.announcementMade} onCheckedChange={v => updateField('announcementMade', !!v)} />
                <Label htmlFor="announcementMade" className="text-xs">Acil Durum Anonsu?</Label>
              </div>
              {formData.announcementMade && (
                <Select 
                  value={String(formData.emergencyCodeId || '')} 
                  onValueChange={v => updateField('emergencyCodeId', v)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue>
                      {emergencyCodes.find(ec => String(ec.id) === String(formData.emergencyCodeId))?.name || "Kod seçin"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {emergencyCodes.map(ec => <SelectItem key={ec.id} value={String(ec.id)}>{ec.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="space-y-3 p-3 bg-muted/20 rounded-lg border border-border/50">
            <div className="flex items-center space-x-2">
              <Checkbox id="serviceInterrupted" checked={formData.serviceInterrupted} onCheckedChange={v => updateField('serviceInterrupted', !!v)} />
              <Label htmlFor="serviceInterrupted" className="text-xs">Hizmet Kesintiye Uğradı mı?</Label>
            </div>
            {formData.serviceInterrupted && (
              <div className="flex items-center gap-2">
                <Input type="number" className="h-8 text-xs w-24" value={formData.interruptionDuration} onChange={e => updateField('interruptionDuration', e.target.value)} />
                <span className="text-[10px] text-muted-foreground">saat kesinti</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold border-b pb-2 text-purple-600 uppercase tracking-wider">Etki & İstatistikler</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Tahliye Personel</Label>
            <Input type="number" value={formData.evacuatedStaffCount} onChange={e => updateField('evacuatedStaffCount', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Tahliye Hasta</Label>
            <Input type="number" value={formData.evacuatedPatientCount} onChange={e => updateField('evacuatedPatientCount', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-orange-600 font-semibold">Yaralı Sayısı</Label>
            <Input type="number" className="border-orange-200" value={formData.injuredCount} onChange={e => updateField('injuredCount', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-red-600 font-semibold">Ölü Sayısı</Label>
            <Input type="number" className="border-red-200" value={formData.deceasedCount} onChange={e => updateField('deceasedCount', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Details (Text Areas) */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold border-b pb-2 text-purple-600 uppercase tracking-wider">Olay Detayları</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Olayın Gerçekleşme Şekli (Özet) *</Label>
            <Textarea value={formData.incidentMode} onChange={e => updateField('incidentMode', e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Olayın Nedeni Detay</Label>
            <Textarea value={formData.causeDetail} onChange={e => updateField('causeDetail', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Tespit Edilebilen Etki</Label>
            <Textarea value={formData.detectedEffect} onChange={e => updateField('detectedEffect', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Olaya İlişkin Tespitler</Label>
            <Textarea value={formData.observations} onChange={e => updateField('observations', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Alınan Aksiyonlar</Label>
            <Textarea value={formData.actionsTaken} onChange={e => updateField('actionsTaken', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Sonuç / Değerlendirme</Label>
            <Textarea value={formData.resultEvaluation} onChange={e => updateField('resultEvaluation', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>İptal</Button>
        <Button type="submit" disabled={mutation.isPending} className="bg-purple-600 hover:bg-purple-700 text-white">
          {mutation.isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Kaydediliyor...</>
          ) : (
            initialData ? 'Güncelle' : 'Olayı Bildir'
          )}
        </Button>
      </div>
    </form>
  );
};

export default HazmatIncidentFormPage;

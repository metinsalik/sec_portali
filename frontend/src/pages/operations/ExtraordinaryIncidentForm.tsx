import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, FileText, Plus, XCircle } from 'lucide-react';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface ExtraordinaryIncidentFormProps {
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const ExtraordinaryIncidentForm = ({ initialData, onSuccess, onCancel }: ExtraordinaryIncidentFormProps) => {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('management');

  const [formData, setFormData] = useState<any>({
    facilityId: '',
    categoryId: '',
    rootCauseId: '',
    departmentId: '',
    locationDetail: '',
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
    summary: '',
    causeDetail: '',
    detectedEffect: '',
    observations: '',
    actionsTaken: '',
    resultEvaluation: '',
  });

  const [files, setFiles] = useState<File[]>([]);
  
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        facilityId: initialData.facilityId,
        categoryId: initialData.categoryId?.toString(),
        rootCauseId: initialData.rootCauseId?.toString(),
        departmentId: initialData.departmentId?.toString(),
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
      });
    } else if (!isAdmin && user?.facilities?.[0]) {
      setFormData((prev: any) => ({ ...prev, facilityId: user.facilities[0] }));
    }
  }, [initialData, isAdmin, user]);

  // Queries for definitions
  const { data: facilities = [] } = useQuery<any[]>({ queryKey: ['facilities'], queryFn: async () => (await api.get('/settings/facilities')).json() });
  const { data: categories = [] } = useQuery<any[]>({ queryKey: ['incident-categories'], queryFn: async () => (await api.get('/settings/definitions/incident-categories')).json() });
  const { data: rootCauses = [] } = useQuery<any[]>({ queryKey: ['incident-root-causes'], queryFn: async () => (await api.get('/settings/definitions/incident-root-causes')).json() });
  const { data: departments = [] } = useQuery<any[]>({ queryKey: ['departments'], queryFn: async () => (await api.get('/settings/definitions/departments')).json() });
  const { data: supportUnits = [] } = useQuery<any[]>({ queryKey: ['incident-support-units'], queryFn: async () => (await api.get('/settings/definitions/incident-support-units')).json() });
  const { data: emergencyCodes = [] } = useQuery<any[]>({ queryKey: ['emergency-codes'], queryFn: async () => (await api.get('/settings/definitions/emergency-codes')).json() });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = initialData 
        ? await api.put(`/incidents/${initialData.id}`, data) // Note: backend needs to handle multipart for PUT too or we use JSON if no new files
        : await fetch(`${api.baseUrl}/incidents`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: data
          });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => onSuccess()
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });
    files.forEach(file => {
      data.append('files', file);
    });
    mutation.mutate(data);
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles].slice(0, 4));
    }
  };

  const isDefinitionsLoading = !facilities.length || !categories.length || !rootCauses.length || !departments.length;

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
          <h3 className="text-sm font-semibold border-b pb-2 text-primary uppercase tracking-wider">Temel Bilgiler</h3>
          
          <div className="space-y-2">
            <Label>Tesis *</Label>
            <Select 
              value={formData.facilityId} 
              onValueChange={v => updateField('facilityId', v)} 
              disabled={!isAdmin && !!initialData}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tesis seçin" />
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
              value={formData.categoryId} 
              onValueChange={v => updateField('categoryId', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={categories.length > 0 ? "Kategori seçin" : "Yükleniyor..."} />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Kök Neden *</Label>
            <Select 
              value={formData.rootCauseId} 
              onValueChange={v => updateField('rootCauseId', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={rootCauses.length > 0 ? "Kök neden seçin" : "Yükleniyor..."} />
              </SelectTrigger>
              <SelectContent>
                {rootCauses.map(rc => <SelectItem key={rc.id} value={rc.id.toString()}>{rc.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bölüm (Sorumluluk) *</Label>
              <Select 
                value={formData.departmentId} 
                onValueChange={v => updateField('departmentId', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={departments.length > 0 ? "Bölüm" : "..."} />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Yer/Alan Detayı</Label>
              <Input value={formData.locationDetail} onChange={e => updateField('locationDetail', e.target.value)} placeholder="Örn: 2. Kat Koridor" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Olay Tarihi / Saati *</Label>
            <Input type="datetime-local" value={formData.incidentDate} onChange={e => updateField('incidentDate', e.target.value)} required />
          </div>
        </div>

        {/* Status & Response */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold border-b pb-2 text-primary uppercase tracking-wider">Müdahale & Durum</h3>
          
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
                <Select value={formData.supportUnitId} onValueChange={v => updateField('supportUnitId', v)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder={supportUnits.length > 0 ? "Birim seçin" : "..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {supportUnits.map(su => <SelectItem key={su.id} value={su.id.toString()}>{su.name}</SelectItem>)}
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
                <Select value={formData.emergencyCodeId} onValueChange={v => updateField('emergencyCodeId', v)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder={emergencyCodes.length > 0 ? "Kod seçin" : "..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {emergencyCodes.map(ec => <SelectItem key={ec.id} value={ec.id.toString()}>{ec.name}</SelectItem>)}
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
        <h3 className="text-sm font-semibold border-b pb-2 text-primary uppercase tracking-wider">Etki & İstatistikler</h3>
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
        <h3 className="text-sm font-semibold border-b pb-2 text-primary uppercase tracking-wider">Olay Detayları</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Olayın Gerçekleşme Şekli (Özet) *</Label>
            <Textarea value={formData.summary} onChange={e => updateField('summary', e.target.value)} required />
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

      {/* Attachments Section */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4" /> Dosya ve Fotoğraf Ekleri (Opsiyonel)
          </h3>
          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full border">
            {files.length} / 4 Dosya
          </span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {files.map((file, index) => (
            <div key={index} className="relative group aspect-square rounded-xl border-2 border-dashed border-primary/20 bg-muted/10 flex flex-col items-center justify-center p-2 text-center overflow-hidden transition-all hover:border-primary/40 hover:bg-muted/20">
              <div className="absolute top-1 right-1 z-10">
                <Button 
                  type="button"
                  variant="destructive" 
                  size="sm" 
                  className="h-6 w-6 p-0 rounded-full shadow-lg"
                  onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== index))}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {file.type.startsWith('image/') ? (
                <img 
                  src={URL.createObjectURL(file)} 
                  alt="preview" 
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="w-8 h-8 text-primary/40" />
                  <span className="text-[10px] font-medium truncate max-w-full px-2">{file.name}</span>
                </div>
              )}
            </div>
          ))}

          {files.length < 4 && (
            <label className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/5 flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all hover:border-primary/40 hover:bg-primary/5 group">
              <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors mb-2">
                <Plus className="w-5 h-5 text-primary/60 group-hover:text-primary transition-colors" />
              </div>
              <p className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">Dosya Ekle</p>
              <p className="text-[9px] text-muted-foreground/60 mt-1">JPEG, PNG veya PDF</p>
              <input 
                type="file" 
                multiple 
                accept=".jpg,.jpeg,.png,.pdf" 
                className="hidden" 
                onChange={handleFileChange}
              />
            </label>
          )}
        </div>

        {initialData?.attachments && initialData.attachments.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50/50 dark:bg-blue-950/10 rounded-lg border border-blue-100 dark:border-blue-900/30">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">Mevcut Ekler:</p>
            <div className="flex flex-wrap gap-2">
              {initialData.attachments.map((att: any, i: number) => (
                <div key={i} className="flex items-center gap-2 px-2 py-1 bg-white dark:bg-background border rounded text-[10px]">
                  <FileText className="w-3 h-3 text-primary" />
                  <span className="truncate max-w-[100px]">{att.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>İptal</Button>
        <Button type="submit" disabled={mutation.isPending}>
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

export default ExtraordinaryIncidentForm;

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useActiveFacility } from '@/hooks/useActiveFacility';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  ArrowLeft, Loader2, Save, X, ShieldAlert, Calendar, 
  MapPin, Clock, HeartPulse, Search, Plus, CheckCircle2, Paperclip, Camera, Check
} from 'lucide-react';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import LocationSelector from '@/components/hazmat/LocationSelector';
import { SearchableSelect } from '@/components/hazmat/SearchableSelect';
import { HazmatMaterialMultiSelect } from '@/components/hazmat/HazmatMaterialMultiSelect';
import { HazmatAttachmentManager } from '@/components/hazmat/HazmatAttachmentManager';
import { toast } from 'sonner';

interface HazmatIncidentFormPageProps {
  initialData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function HazmatIncidentFormPage({ initialData, onSuccess, onCancel }: HazmatIncidentFormPageProps) {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const activeFacilityId = useActiveFacility();

  const isEditing = Boolean(id || initialData?.id);
  const editId = id || initialData?.id;
  const isAdmin = Boolean(user?.isAdmin || user?.isManagement || user?.roles?.includes('admin') || user?.roles?.includes('management'));

  const [kitLocationId, setKitLocationId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState<any>({
    facilityId: '',
    incidentTypeId: '',
    rootCause: '',
    rootCauseId: '',
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
    photos: [],
    documents: [],
    hasAction: false,
    actionStatus: 'Aksiyon Alınmadı',
    actionPlan: '',
    actionDate: '',
    actionResponsible: '',
    actionResult: '',
  });

  // Query incident detail if in edit mode and no initialData provided
  const { data: fetchedIncident, isLoading: loadingIncident } = useQuery({
    queryKey: ['hazmat-incident', editId],
    queryFn: async () => {
      if (!editId) return null;
      const res = await api.get(`/hazmat/incidents/${editId}`);
      if (!res.ok) throw new Error('Olay bilgileri yüklenemedi.');
      return res.json();
    },
    enabled: Boolean(isEditing && !initialData && editId),
  });

  const activeData = initialData || fetchedIncident;

  useEffect(() => {
    if (activeData) {
      const actionSet = Boolean(activeData.actionStatus && activeData.actionStatus !== 'Aksiyon Alınmadı') || Boolean(activeData.actionPlan || activeData.actionResponsible || activeData.actionResult);
      setFormData({
        facilityId: activeData.facilityId || '',
        categoryId: activeData.categoryId || '',
        incidentTypeId: activeData.incidentTypeId?.toString() || '',
        rootCause: activeData.rootCause || '',
        rootCauseId: activeData.rootCauseId?.toString() || '',
        departmentId: activeData.locationId || activeData.departmentId || '',
        materialIds: activeData.materials?.map((m: any) => m.id) || [],
        incidentMode: activeData.incidentMode || '',
        incidentDate: activeData.incidentDate ? new Date(activeData.incidentDate).toISOString().slice(0, 16) : '',
        interventionRequired: Boolean(activeData.interventionRequired),
        interventionTime: activeData.interventionTime ? new Date(activeData.interventionTime).toISOString().slice(0, 16) : '',
        controlTime: activeData.controlTime ? new Date(activeData.controlTime).toISOString().slice(0, 16) : '',
        supportReceived: Boolean(activeData.supportReceived),
        supportUnitId: activeData.supportUnitId?.toString() || '',
        announcementMade: Boolean(activeData.announcementMade),
        emergencyCodeId: activeData.emergencyCodeId?.toString() || '',
        serviceInterrupted: Boolean(activeData.serviceInterrupted),
        interruptionDuration: activeData.interruptionDuration?.toString() || '0',
        evacuatedStaffCount: activeData.evacuatedStaffCount?.toString() || '0',
        evacuatedPatientCount: activeData.evacuatedPatientCount?.toString() || '0',
        injuredCount: activeData.injuredCount?.toString() || '0',
        deceasedCount: activeData.deceasedCount?.toString() || '0',
        causeDetail: activeData.causeDetail || '',
        detectedEffect: activeData.detectedEffect || '',
        observations: activeData.observations || '',
        actionsTaken: activeData.actionsTaken || '',
        resultEvaluation: activeData.resultEvaluation || '',
        kitUsed: Boolean(activeData.kitUsed),
        spillKitId: activeData.spillKitId || '',
        photos: Array.isArray(activeData.photos) ? activeData.photos : [],
        documents: Array.isArray(activeData.documents) ? activeData.documents : [],
        hasAction: actionSet,
        actionStatus: activeData.actionStatus || (actionSet ? 'Tamamlandı' : 'Aksiyon Alınmadı'),
        actionPlan: activeData.actionPlan || '',
        actionDate: activeData.actionDate ? new Date(activeData.actionDate).toISOString().slice(0, 10) : '',
        actionResponsible: activeData.actionResponsible || '',
        actionResult: activeData.actionResult || '',
      });
      if (activeData.locationId || activeData.departmentId) {
        setKitLocationId(activeData.locationId || activeData.departmentId);
      }
    } else {
      // Default to user's facility or active facility
      const fallbackFac =
        (activeFacilityId && activeFacilityId !== 'ALL' && activeFacilityId !== 'all' ? activeFacilityId : '') ||
        user?.facilities?.[0] ||
        '';
      if (fallbackFac) {
        setFormData((prev: any) => ({ ...prev, facilityId: fallbackFac }));
      }
    }
  }, [activeData, activeFacilityId, user]);

  // Queries for definitions
  const { data: facilities = [], isLoading: loadingFacilities } = useQuery<any[]>({
    queryKey: ['facilities'],
    queryFn: async () => {
      const res = await api.get('/settings/facilities');
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Olay Türleri (/hazmat/settings/events kaynağından gelir)
  const { data: incidentTypes = [], isLoading: loadingIncidentTypes } = useQuery<any[]>({
    queryKey: ['hazmat-incident-types'],
    queryFn: async () => {
      const res = await api.get('/hazmat/settings/incident-types');
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Kök Nedenler (/hazmat/settings/root-causes kaynağından gelir)
  const { data: rootCauses = [], isLoading: loadingRootCauses } = useQuery<any[]>({
    queryKey: ['hazmat-root-causes'],
    queryFn: async () => {
      const res = await api.get('/hazmat/settings/root-causes');
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: departments = [] } = useQuery<any[]>({
    queryKey: ['facility-locations', formData.facilityId],
    queryFn: async () => {
      if (!formData.facilityId) return [];
      const res = await api.get(`/risks/facilities/${formData.facilityId}/locations`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: Boolean(formData.facilityId),
  });

  const { data: supportUnits = [] } = useQuery<any[]>({
    queryKey: ['incident-support-units'],
    queryFn: async () => {
      const res = await api.get('/settings/definitions/incident-support-units');
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: emergencyCodes = [] } = useQuery<any[]>({
    queryKey: ['emergency-codes'],
    queryFn: async () => {
      const res = await api.get('/settings/definitions/emergency-codes');
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: kits = [] } = useQuery<any[]>({
    queryKey: ['hazmat-spill-kits', formData.facilityId],
    queryFn: async () => {
      if (!formData.facilityId) return [];
      const res = await api.get(`/hazmat/spill-kits?facilityId=${formData.facilityId}`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: Boolean(formData.facilityId),
  });

  const { data: facilityItems = [] } = useQuery<any[]>({
    queryKey: ['hazmat-materials', formData.facilityId],
    queryFn: async () => {
      if (!formData.facilityId) return [];
      const res = await api.get(`/hazmat/materials?facilityId=${formData.facilityId}`);
      if (!res.ok) return [];
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
      const globalRes = await api.get(`/hazmat/materials/global?facilityId=${formData.facilityId}`);
      if (!globalRes.ok) return [];
      const globalData = await globalRes.json();
      return Array.isArray(globalData) ? globalData : [];
    },
    enabled: Boolean(formData.facilityId),
  });

  const materials = Array.isArray(facilityItems)
    ? facilityItems.map((item: any) => item.material || item).filter(Boolean)
    : [];

  const availableKits: { placementId: string; kitName: string; location: string; code: string }[] = [];
  kits.forEach((kit) => {
    if (kit.placements) {
      kit.placements.forEach((p: any) => {
        if (p.status === 'Aktif' || p.status === 'Sahada' || p.status === 'Kurulumda') {
          availableKits.push({
            placementId: p.id,
            kitName: kit.kitName,
            location: p.unit || p.location || p.area,
            code: kit.code || '',
          });
        }
      });
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        locationId: data.departmentId || data.locationId || null,
      };
      const res = isEditing
        ? await api.put(`/hazmat/incidents/${editId}`, payload)
        : await api.post(`/hazmat/incidents`, payload);

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || 'Olay kaydedilirken bir hata oluştu.');
      }
      return res.json();
    },
    onSuccess: (savedIncident) => {
      queryClient.invalidateQueries({ queryKey: ['hazmat-incidents'] });
      queryClient.invalidateQueries({ queryKey: ['hazmat-incident', editId] });
      toast.success(isEditing ? 'Olay kaydı başarıyla güncellendi.' : 'Olağan dışı olay bildirimi başarıyla oluşturuldu.');
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(`/hazmat/incidents/view/${savedIncident?.id || editId || ''}`);
      }
    },
    onError: (err: any) => {
      setFormError(err?.message || 'Olay kaydedilemedi.');
      toast.error(err?.message || 'Olay kaydedilemedi.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.facilityId) {
      setFormError('Lütfen bir tesis seçiniz.');
      toast.error('Lütfen bir tesis seçiniz.');
      return;
    }
    if (!formData.incidentTypeId) {
      setFormError('Lütfen olay türünü seçiniz.');
      toast.error('Lütfen olay türünü seçiniz.');
      return;
    }
    if (!formData.incidentDate) {
      setFormError('Lütfen olay tarih ve saatini giriniz.');
      toast.error('Lütfen olay tarih ve saatini giriniz.');
      return;
    }
    if (!formData.controlTime) {
      setFormError('Lütfen kontrol altına alınma tarih ve saatini giriniz.');
      toast.error('Lütfen kontrol altına alınma tarih ve saatini giriniz.');
      return;
    }
    mutation.mutate(formData);
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/hazmat/incidents');
    }
  };

  if (loadingIncident) {
    return (
      <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span>Olay bilgileri yükleniyor...</span>
      </div>
    );
  }

  const selectedFacilityObj = facilities.find((f) => f.id === formData.facilityId);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 font-sans antialiased">
      {/* Üst Başlık & Eylem Çubuğu */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleCancel}
            className="h-9 w-9 rounded-lg shrink-0 shadow-2xs"
            title="Geri Dön"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {isEditing ? 'Olağan Dışı Olayı Düzenle' : 'Yeni TM Olağan Dışı Olay Bildirimi'}
              </h1>
              <Badge variant="outline" className="text-xs font-semibold">
                {isEditing ? 'Düzenleme' : 'Yeni Bildirim'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tehlikeli madde sızıntı, döküntü, maruziyet ve kaza bildirim formu.
            </p>
          </div>
        </div>

        {/* Üst Aksiyon Butonları */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="h-9 px-3.5 text-xs font-medium"
          >
            <X className="w-3.5 h-3.5 mr-1.5" /> İptal
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="h-9 px-4 text-xs font-semibold gap-1.5 shadow-sm"
          >
            {mutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {isEditing ? 'Değişiklikleri Güncelle' : 'Kaydı Tamamla'}
          </Button>
        </div>
      </div>

      {formError && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3 rounded-lg flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* KART 1: TEMEL BİLGİLER & LOKASYON */}
        <Card className="border-border/70 shadow-2xs overflow-visible">
          <CardHeader className="p-4 pb-2 border-b border-border/60 bg-muted/20">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              1. Temel Bilgiler ve Lokasyon
            </CardTitle>
            <CardDescription className="text-xs">
              Olayın meydana geldiği tesis, olay türü ve detaylı fiziksel konum.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tesis Seçimi */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Tesis *</Label>
                {isAdmin ? (
                  <Select
                    value={formData.facilityId}
                    onValueChange={(v) => {
                      updateField('facilityId', v);
                      updateField('departmentId', '');
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Tesis seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      {facilities.map((f) => (
                        <SelectItem key={f.id} value={f.id} className="text-xs">
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={selectedFacilityObj?.name || 'Tesis Belirleniyor...'}
                    disabled
                    className="h-9 text-xs bg-muted/50 cursor-not-allowed font-medium text-foreground"
                  />
                )}
                {!isAdmin && (
                  <p className="text-[11px] text-muted-foreground">
                    Tesis bilginiz yetkili olduğunuz tesisten otomatik alınmıştır.
                  </p>
                )}
              </div>

              {/* Olay Türü (/hazmat/settings/events) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Olay Türü *</Label>
                <SearchableSelect
                  value={String(formData.incidentTypeId || '')}
                  onChange={(val) => updateField('incidentTypeId', val)}
                  options={incidentTypes.map((c: any) => ({
                    id: String(c.id),
                    name: c.name,
                    description: c.description,
                  }))}
                  placeholder="Olay Türü seçiniz..."
                  searchPlaceholder="Olay türü ara (Sızıntı, Dökülme, Yangın vb.)..."
                  emptyMessage="Eşleşen olay türü bulunamadı."
                />
              </div>

              {/* Kök Neden (/hazmat/settings/root-causes) */}
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-medium">Kök Neden *</Label>
                <SearchableSelect
                  value={String(formData.rootCauseId || '')}
                  onChange={(val, opt) => {
                    updateField('rootCauseId', val);
                    updateField('rootCause', opt?.name || '');
                  }}
                  options={rootCauses.map((r: any) => ({
                    id: String(r.id),
                    name: r.name,
                    description: r.description,
                  }))}
                  placeholder="Kök Neden seçiniz..."
                  searchPlaceholder="Kök neden ara (Ekipman arızası, Bakım eksikliği vb.)..."
                  emptyMessage="Eşleşen kök neden bulunamadı."
                />
                {(formData.rootCause === 'Diğer' ||
                  rootCauses.find((r) => String(r.id) === String(formData.rootCauseId))?.name === 'Diğer') && (
                  <div className="pt-2">
                    <Label className="text-[11px] text-muted-foreground">Diğer Kök Neden Açıklaması *</Label>
                    <Input
                      placeholder="Belirtilen nedenler haricindeki kök nedeni detaylandırın..."
                      value={formData.causeDetail || ''}
                      onChange={(e) => updateField('causeDetail', e.target.value)}
                      className="h-8 text-xs mt-1"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Fiziksel Lokasyon Seçici */}
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-medium">Fiziksel Lokasyon *</Label>
                <LocationSelector
                  departments={departments}
                  value={String(formData.departmentId || '')}
                  onChange={(v) => {
                    updateField('departmentId', v);
                    if (formData.kitUsed) {
                      setKitLocationId(v);
                      updateField('spillKitId', '');
                    }
                  }}
                  disabled={!formData.facilityId}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KART 2: ZAMAN & MÜDAHALE SÜRELERİ */}
        <Card className="border-border/70 shadow-2xs overflow-visible">
          <CardHeader className="p-4 pb-2 border-b border-border/60 bg-muted/20">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              2. Zaman ve Müdahale Bilgileri
            </CardTitle>
            <CardDescription className="text-xs">
              Olayın gerçekleştiği an ve kontrol altına alınma süreci.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Olay Tarihi ve Saati *</Label>
                <Input
                  type="datetime-local"
                  value={formData.incidentDate}
                  onChange={(e) => updateField('incidentDate', e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Müdahale Başlangıç Saati</Label>
                <Input
                  type="datetime-local"
                  value={formData.interventionTime}
                  onChange={(e) => updateField('interventionTime', e.target.value)}
                  disabled={!formData.interventionRequired}
                  className="h-9 text-xs disabled:opacity-50"
                />
                <div className="flex items-center space-x-2 pt-1">
                  <Checkbox
                    id="interventionRequired"
                    checked={formData.interventionRequired}
                    onCheckedChange={(checked) => updateField('interventionRequired', Boolean(checked))}
                  />
                  <label htmlFor="interventionRequired" className="text-xs text-muted-foreground cursor-pointer">
                    Müdahale gerçekleştirildi
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Kontrol Altına Alınma Saati *</Label>
                <Input
                  type="datetime-local"
                  value={formData.controlTime}
                  onChange={(e) => updateField('controlTime', e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KART 3: DESTEK, ANONS & DÖKÜNTÜ KİTİ */}
        <Card className="border-border/70 shadow-2xs overflow-visible">
          <CardHeader className="p-4 pb-2 border-b border-border/60 bg-muted/20">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-purple-600" />
              3. Destek, Acil Durum Kodu ve Döküntü Kiti
            </CardTitle>
            <CardDescription className="text-xs">
              Müdahale sürecinde alınan harici destek, acil durum anonsu ve kullanılan kitler.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. Destek Birimi */}
              <div className="space-y-2 p-3 bg-muted/20 rounded-lg border border-border/50">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground">
                    Destek Alındı mı?
                  </Label>
                  <div className="flex items-center bg-muted/70 p-0.5 rounded-md border border-border/60">
                    <button
                      type="button"
                      onClick={() => updateField('supportReceived', true)}
                      className={`px-3 py-1 text-xs font-medium rounded transition-all cursor-pointer ${
                        formData.supportReceived
                          ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Evet
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateField('supportReceived', false);
                        updateField('supportUnitId', '');
                      }}
                      className={`px-3 py-1 text-xs font-medium rounded transition-all cursor-pointer ${
                        !formData.supportReceived
                          ? 'bg-muted-foreground/20 text-foreground font-semibold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Hayır
                    </button>
                  </div>
                </div>

                {formData.supportReceived ? (
                  <div className="pt-1.5 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Alınan Destek Birimi *</Label>
                    <SearchableSelect
                      value={String(formData.supportUnitId || '')}
                      onChange={(val) => updateField('supportUnitId', val)}
                      options={supportUnits.map((u: any) => ({
                        id: String(u.id),
                        name: u.name,
                      }))}
                      placeholder="Destek birimi seçiniz..."
                      searchPlaceholder="Destek birimi ara (İtfaiye, AFAD vb.)..."
                      emptyMessage="Destek birimi bulunamadı."
                    />
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground italic pt-1">
                    Herhangi bir harici destek birimi çağrılmadı.
                  </p>
                )}
              </div>

              {/* 2. Anons / Acil Durum Kodu */}
              <div className="space-y-2 p-3 bg-muted/20 rounded-lg border border-border/50">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground">
                    Anons Yapıldı mı?
                  </Label>
                  <div className="flex items-center bg-muted/70 p-0.5 rounded-md border border-border/60">
                    <button
                      type="button"
                      onClick={() => updateField('announcementMade', true)}
                      className={`px-3 py-1 text-xs font-medium rounded transition-all cursor-pointer ${
                        formData.announcementMade
                          ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Evet
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateField('announcementMade', false);
                        updateField('emergencyCodeId', '');
                      }}
                      className={`px-3 py-1 text-xs font-medium rounded transition-all cursor-pointer ${
                        !formData.announcementMade
                          ? 'bg-muted-foreground/20 text-foreground font-semibold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Hayır
                    </button>
                  </div>
                </div>

                {formData.announcementMade ? (
                  <div className="pt-1.5 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Verilen Acil Durum Kodu *</Label>
                    <SearchableSelect
                      value={String(formData.emergencyCodeId || '')}
                      onChange={(val) => updateField('emergencyCodeId', val)}
                      options={emergencyCodes.map((c: any) => ({
                        id: String(c.id),
                        name: c.code ? `${c.code} - ${c.name}` : c.name,
                      }))}
                      placeholder="Acil durum kodu seçiniz..."
                      searchPlaceholder="Acil durum kodu ara (Kırmızı Kod, Mavi Kod vb.)..."
                      emptyMessage="Acil durum kodu bulunamadı."
                    />
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground italic pt-1">
                    Tesis genelinde acil durum anonsu verilmedi.
                  </p>
                )}
              </div>

              {/* 3. Döküntü Kiti */}
              <div className="space-y-2 p-3 bg-muted/20 rounded-lg border border-border/50">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground">
                    Döküntü Kiti Kullanıldı mı?
                  </Label>
                  <div className="flex items-center bg-muted/70 p-0.5 rounded-md border border-border/60">
                    <button
                      type="button"
                      onClick={() => updateField('kitUsed', true)}
                      className={`px-3 py-1 text-xs font-medium rounded transition-all cursor-pointer ${
                        formData.kitUsed
                          ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Evet
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateField('kitUsed', false);
                        updateField('spillKitId', '');
                      }}
                      className={`px-3 py-1 text-xs font-medium rounded transition-all cursor-pointer ${
                        !formData.kitUsed
                          ? 'bg-muted-foreground/20 text-foreground font-semibold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Hayır
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground italic pt-1">
                  {formData.kitUsed
                    ? 'Olay müdahalesinde kimyasal döküntü kiti kullanılmıştır.'
                    : 'Olay müdahalesinde döküntü kiti kullanılmamıştır.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KART 4: İLGİLİ TEHLİKELİ MADDELER */}
        <Card className="border-border/70 shadow-2xs overflow-visible">
          <CardHeader className="p-4 pb-2 border-b border-border/60 bg-muted/20">
            <CardTitle className="text-sm font-bold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                4. İlgili Tehlikeli Madde(ler)
              </span>
              <Badge variant="secondary" className="text-[11px] font-normal">
                {formData.materialIds?.length || 0} Madde Seçili
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Olaya karışan kimyasal maddeleri seçiniz.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <HazmatMaterialMultiSelect
              materials={materials}
              selectedIds={formData.materialIds || []}
              onChange={(ids) => updateField('materialIds', ids)}
            />
          </CardContent>
        </Card>

        {/* KART 5: ETKİ VE ZARAR BİLGİLERİ */}
        <Card className="border-border/70 shadow-2xs overflow-visible">
          <CardHeader className="p-4 pb-2 border-b border-border/60 bg-muted/20">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-rose-500" />
              5. Etki ve Zarar Bilgileri
            </CardTitle>
            <CardDescription className="text-xs">
              Personel, hasta tahliyesi ve yaralanma/can kaybı verileri.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Yaralı Sayısı</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.injuredCount}
                  onChange={(e) => updateField('injuredCount', e.target.value)}
                  className="h-8 text-xs font-semibold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Vefat Sayısı</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.deceasedCount}
                  onChange={(e) => updateField('deceasedCount', e.target.value)}
                  className="h-8 text-xs font-semibold text-rose-600"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Tahliye Personel</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.evacuatedStaffCount}
                  onChange={(e) => updateField('evacuatedStaffCount', e.target.value)}
                  className="h-8 text-xs font-semibold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Tahliye Hasta</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.evacuatedPatientCount}
                  onChange={(e) => updateField('evacuatedPatientCount', e.target.value)}
                  className="h-8 text-xs font-semibold"
                />
              </div>
            </div>

            {/* Hizmet Kesintisi */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-muted/20 rounded-lg border border-border/50">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="serviceInterrupted"
                  checked={formData.serviceInterrupted}
                  onCheckedChange={(checked) => updateField('serviceInterrupted', Boolean(checked))}
                />
                <Label htmlFor="serviceInterrupted" className="text-xs font-semibold cursor-pointer">
                  Hizmet Kesintiye Uğradı mı?
                </Label>
              </div>
              {formData.serviceInterrupted && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">Kesinti Süresi (Saat):</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.interruptionDuration}
                    onChange={(e) => updateField('interruptionDuration', e.target.value)}
                    className="h-8 w-24 text-xs font-semibold bg-background"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* KART 6: DETAYLI AÇIKLAMALAR VE DEĞERLENDİRME */}
        <Card className="border-border/70 shadow-2xs overflow-visible">
          <CardHeader className="p-4 pb-2 border-b border-border/60 bg-muted/20">
            <CardTitle className="text-sm font-bold text-foreground">
              6. Detaylı Açıklamalar ve Değerlendirme
            </CardTitle>
            <CardDescription className="text-xs">
              Olayın seyri, alınan aksiyonlar ve nihai durum özeti.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Olay Şekli / Oluş Biçimi</Label>
              <Input
                value={formData.incidentMode}
                onChange={(e) => updateField('incidentMode', e.target.value)}
                placeholder="Örn: 5L Asit bidonunun taşınırken kırılması sonucu zemin döküntüsü..."
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Neden Detay</Label>
                <Textarea
                  value={formData.causeDetail}
                  onChange={(e) => updateField('causeDetail', e.target.value)}
                  placeholder="Kaza veya sızıntıya neden olan faktörler..."
                  rows={2}
                  className="text-xs resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Tespit Edilen Etki</Label>
                <Textarea
                  value={formData.detectedEffect}
                  onChange={(e) => updateField('detectedEffect', e.target.value)}
                  placeholder="Koku yayılımı, duman, cilt teması vb..."
                  rows={2}
                  className="text-xs resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Olaya İlişkin Tespitler / Gözlemler</Label>
                <Textarea
                  value={formData.observations}
                  onChange={(e) => updateField('observations', e.target.value)}
                  placeholder="Sahada tespit edilen durumlar..."
                  rows={2}
                  className="text-xs resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Alınan Aksiyonlar / Müdahaleler</Label>
                <Textarea
                  value={formData.actionsTaken}
                  onChange={(e) => updateField('actionsTaken', e.target.value)}
                  placeholder="Bölge emniyete alındı, absorban uygulandı vb..."
                  rows={2}
                  className="text-xs resize-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Sonuç ve Genel Değerlendirme</Label>
              <Textarea
                value={formData.resultEvaluation}
                onChange={(e) => updateField('resultEvaluation', e.target.value)}
                placeholder="Olay sonrası normale dönüş, atık bertarafı ve genel sonuç..."
                rows={2}
                className="text-xs resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* KART 7: FOTOĞRAFLAR VE BELGELER */}
        <Card className="border-border/70 shadow-2xs overflow-visible">
          <CardHeader className="p-4 pb-2 border-b border-border/60 bg-muted/20">
            <CardTitle className="text-sm font-bold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-primary" />
                7. Fotoğraf ve Belge Ekleri
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">
                  {formData.photos?.length || 0} Fotoğraf
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {formData.documents?.length || 0} Belge
                </Badge>
              </div>
            </CardTitle>
            <CardDescription className="text-xs">
              Olay yeri fotoğrafları, kaza tutanakları, inceleme raporları ve ilgili belgeleri yükleyebilirsiniz.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <HazmatAttachmentManager
              facilityId={formData.facilityId}
              facilityName={selectedFacilityObj?.name}
              photos={formData.photos || []}
              onPhotosChange={(photos) => updateField('photos', photos)}
              documents={formData.documents || []}
              onDocumentsChange={(docs) => updateField('documents', docs)}
            />
          </CardContent>
        </Card>

        {/* KART 8: OLAY SONRASI AKSİYON VE İYİLEŞTİRME BİLGİLERİ */}
        <Card className="border-border/70 shadow-2xs overflow-visible">
          <CardHeader className="p-4 pb-2 border-b border-border/60 bg-muted/20">
            <CardTitle className="text-sm font-bold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                8. Olay Sonrası Aksiyon ve İyileştirme Bilgileri
              </span>
              <div className="flex items-center bg-muted/70 p-0.5 rounded-md border border-border/60">
                <button
                  type="button"
                  onClick={() => {
                    updateField('hasAction', true);
                    if (!formData.actionStatus || formData.actionStatus === 'Aksiyon Alınmadı') {
                      updateField('actionStatus', 'Tamamlandı');
                    }
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded transition-all cursor-pointer ${
                    formData.hasAction
                      ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Aksiyon Alındı
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateField('hasAction', false);
                    updateField('actionStatus', 'Aksiyon Alınmadı');
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded transition-all cursor-pointer ${
                    !formData.hasAction
                      ? 'bg-muted-foreground/20 text-foreground font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Henüz Alınmadı
                </button>
              </div>
            </CardTitle>
            <CardDescription className="text-xs">
              Bu olay kapsamında alınan önleyici ve düzeltici aksiyonlar (DÖF / İyileştirme).
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {formData.hasAction ? (
              <div className="space-y-4 animate-in fade-in-0 duration-150">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Aksiyon Durumu */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Aksiyon Durumu *</Label>
                    <Select
                      value={formData.actionStatus}
                      onValueChange={(v) => updateField('actionStatus', v)}
                    >
                      <SelectTrigger className="h-9 text-xs bg-background">
                        <SelectValue placeholder="Durum seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tamamlandı" className="text-xs">
                          Tamamlandı (Aksiyon Kapatıldı)
                        </SelectItem>
                        <SelectItem value="Devam Ediyor" className="text-xs">
                          Devam Ediyor (Süreç Sürüyor)
                        </SelectItem>
                        <SelectItem value="Planlandı" className="text-xs">
                          Planlandı (Termin Belirlendi)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Aksiyon Sorumlusu */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Aksiyon Sorumlusu</Label>
                    <Input
                      value={formData.actionResponsible || ''}
                      onChange={(e) => updateField('actionResponsible', e.target.value)}
                      placeholder="Örn: Ahmet Yılmaz - İSG Uzmanı / Tesis Müdürü"
                      className="h-9 text-xs"
                    />
                  </div>

                  {/* Aksiyon / Kapatma Tarihi */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Aksiyon Tarihi / Hedef</Label>
                    <Input
                      type="date"
                      value={formData.actionDate || ''}
                      onChange={(e) => updateField('actionDate', e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                {/* Yapılan İşlemler / Aksiyon Detayı */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Alınan Aksiyon ve Yapılan İyileştirmeler *</Label>
                  <Textarea
                    value={formData.actionPlan || ''}
                    onChange={(e) => updateField('actionPlan', e.target.value)}
                    placeholder="Olayın tekrarını önlemek için yapılan teknik veya idari düzenlemeler..."
                    rows={3}
                    className="text-xs resize-none"
                    required={formData.hasAction}
                  />
                </div>

                {/* Aksiyon Sonucu ve Kapatma Değerlendirmesi */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Aksiyon Sonucu ve Kapatma Değerlendirmesi</Label>
                  <Textarea
                    value={formData.actionResult || ''}
                    onChange={(e) => updateField('actionResult', e.target.value)}
                    placeholder="Aksiyonun sahadaki etkisi, doğrulama ölçümleri ve kapanış notu..."
                    rows={2}
                    className="text-xs resize-none"
                  />
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-border/70 rounded-lg p-4 text-center text-xs text-muted-foreground bg-background/50">
                <p>Bu olay bildirimi için henüz düzeltici aksiyon tanımlanmadı.</p>
                <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                  Aksiyon alındığında yukarıdaki "Aksiyon Alındı" butonuna tıklayarak yapılan işlemleri ve sorumluları kaydedebilirsiniz.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ALT BUTON ÇUBUĞU - Sağ Tarafa Yaslı, Belirgin Sınırlar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="h-9 px-4 text-xs font-semibold border-border/80 hover:bg-muted"
          >
            İptal
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="h-9 px-5 text-xs font-semibold gap-1.5 shadow-sm"
          >
            {mutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isEditing ? 'Değişiklikleri Güncelle' : 'Kaydı Tamamla'}
          </Button>
        </div>
      </form>
    </div>
  );
}

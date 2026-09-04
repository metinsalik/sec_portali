import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, PlusCircle, FileText, Upload, Save, X, Edit, ExternalLink, ChevronDown } from 'lucide-react';
import { elevatorService } from '@/services/elevator.service';
import { elevatorSettingsService } from '@/services/elevator-settings.service';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import CountdownTimer from './components/CountdownTimer';

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';


const getWatermarkClass = (label: string) => {
  if (!label) return '';
  const l = label.toLowerCase();
  if (l.includes('kırmızı')) return 'bg-red-50/40';
  if (l.includes('mavi')) return 'bg-blue-50/40';
  if (l.includes('sarı')) return 'bg-yellow-50/40';
  if (l.includes('yeşil')) return 'bg-green-50/40';
  return '';
};

export default function ElevatorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const returnUrl = `/safety-management/elevator-tracking${location.state?.search ? '?' + location.state.search : ''}`;
  const isNew = id === 'new';
  
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;
  const initialFacilityId = localStorage.getItem('activeFacilityId') || (isAdmin ? 'all' : user?.facilities?.[0]?.facilityId || '');

  const [facilityId, setFacilityId] = useState(initialFacilityId);
  const [elevator, setElevator] = useState<any>(null);
  const [loading, setLoading] = useState(!isNew);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newInspection, setNewInspection] = useState({
    inspectionDate: '',
    nextInspectionDate: '',
    label: '',
    notes: '',
    inspectorName: '',
    reportUrl: ''
  });

  const [isUploading, setIsUploading] = useState(false);
  const [pdfReportUrl, setPdfReportUrl] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(isNew);
  const [editForm, setEditForm] = useState<any>({ facilityId: initialFacilityId });
  const [isSaving, setIsSaving] = useState(false);

  const [brands, setBrands] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [labels, setLabels] = useState<any[]>([]);

  const { data: facilities = [] } = useQuery<any[]>({
    queryKey: ['facilities'],
    queryFn: async () => (await api.get('/settings/facilities')).json(),
    enabled: isNew && isAdmin
  });

  const targetFacilityForSettings = editForm.facilityId && editForm.facilityId !== 'all' ? editForm.facilityId : facilityId;

  useEffect(() => {
    if (targetFacilityForSettings && targetFacilityForSettings !== 'all') {
      Promise.all([
        elevatorSettingsService.getBrands(targetFacilityForSettings),
        elevatorSettingsService.getMaintenanceCompanies(targetFacilityForSettings),
        elevatorSettingsService.getTypes(targetFacilityForSettings),
        elevatorSettingsService.getStatuses(targetFacilityForSettings),
        elevatorSettingsService.getLabels(targetFacilityForSettings)
      ]).then(([b, c, t, s, l]) => {
        setBrands(b.filter((x: any) => x.isActive));
        setCompanies(c.filter((x: any) => x.isActive));
        setTypes(t.filter((x: any) => x.isActive));
        setStatuses(s.filter((x: any) => x.isActive));
        setLabels(l.filter((x: any) => x.isActive));
      }).catch(console.error);
    }
  }, [targetFacilityForSettings]);

  const fetchElevator = async () => {
    if (isNew || !id) return;
    setLoading(true);
    try {
      const data = await elevatorService.getElevatorById(id);
      setElevator(data);
      const formData = { ...data };
      if (formData.lastInspectionDate) formData.lastInspectionDate = new Date(formData.lastInspectionDate).toISOString().split('T')[0];
      if (formData.nextInspectionDate) formData.nextInspectionDate = new Date(formData.nextInspectionDate).toISOString().split('T')[0];
      if (formData.contractEndDate) formData.contractEndDate = new Date(formData.contractEndDate).toISOString().split('T')[0];
      setEditForm(formData);
    } catch (error) {
      console.error(error);
      toast.error('Asansör bilgileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isNew) fetchElevator();
  }, [id, isNew]);

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      if (isNew) {
        if (!editForm.elevatorNo) {
          toast.error('Asansör No zorunludur');
          setIsSaving(false);
          return;
        }
        if (!editForm.facilityId || editForm.facilityId === 'all') {
          toast.error('Lütfen bir tesis seçin');
          setIsSaving(false);
          return;
        }
      }

      const payload = { ...editForm };
      if (payload.lastInspectionDate) payload.lastInspectionDate = new Date(payload.lastInspectionDate).toISOString();
      if (payload.nextInspectionDate) payload.nextInspectionDate = new Date(payload.nextInspectionDate).toISOString();
      if (payload.contractEndDate) payload.contractEndDate = new Date(payload.contractEndDate).toISOString();

      if (isNew) {
        const created = await elevatorService.createElevator(payload);
        toast.success('Asansör oluşturuldu');
        navigate(`/safety-management/elevator-tracking/${created.id}`, { replace: true });
      } else {
        delete payload.id;
        delete payload.inspections;
        delete payload.facility;
        delete payload.createdAt;
        delete payload.updatedAt;

        await elevatorService.updateElevator(id!, payload);
        toast.success('Asansör bilgileri güncellendi');
        setIsEditing(false);
        fetchElevator();
      }
    } catch (error) {
      console.error(error);
      toast.error(isNew ? 'Asansör oluşturulamadı' : 'Güncelleme başarısız oldu');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, isMainReport: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const { url } = await elevatorService.uploadReport(file);
      if (isMainReport) {
        setEditForm((prev: any) => ({ ...prev, reportUrl: url }));
      } else {
        setNewInspection(prev => ({ ...prev, reportUrl: url }));
      }
      toast.success('Rapor yüklendi');
    } catch (error) {
      console.error(error);
      toast.error('Rapor yüklenemedi');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddInspection = async () => {
    if (!newInspection.inspectionDate) {
      toast.error('Muayene tarihi zorunludur');
      return;
    }
    try {
      const payload: any = {
        inspectionDate: new Date(newInspection.inspectionDate).toISOString(),
        label: newInspection.label,
        notes: newInspection.notes,
        inspectorName: newInspection.inspectorName,
        reportUrl: newInspection.reportUrl
      };

      if (newInspection.nextInspectionDate) {
        payload.nextInspectionDate = new Date(newInspection.nextInspectionDate).toISOString();
      }

      await elevatorService.addInspection(id!, payload);
      toast.success('Muayene başarıyla eklendi');
      setIsModalOpen(false);
      setNewInspection({ inspectionDate: '', nextInspectionDate: '', label: '', notes: '', inspectorName: '', reportUrl: '' });
      fetchElevator();
    } catch (error) {
      console.error(error);
      toast.error('Muayene eklenemedi');
    }
  };

  const getLabelColor = (label: string) => {
    if (!label) return 'bg-gray-500';
    const l = label.toLowerCase();
    if (l.includes('yeşil')) return 'bg-green-500';
    if (l.includes('mavi')) return 'bg-blue-500';
    if (l.includes('sarı')) return 'bg-yellow-500';
    if (l.includes('kırmızı')) return 'bg-red-500';
    return 'bg-gray-500';
  };

  const getWatermarkStyle = (label: string) => {
    if (!label) return {};
    const l = label.toLowerCase();
    if (l.includes('kırmızı')) return { backgroundColor: 'rgba(239, 68, 68, 0.03)' };
    if (l.includes('sarı')) return { backgroundColor: 'rgba(234, 179, 8, 0.03)' };
    if (l.includes('yeşil')) return { backgroundColor: 'rgba(16, 185, 129, 0.03)' };
    if (l.includes('mavi')) return { backgroundColor: 'rgba(59, 130, 246, 0.03)' };
    return {};
  };

  if (loading) return <div className="p-8 text-center">Yükleniyor...</div>;
  if (!isNew && !elevator) return <div className="p-8 text-center text-red-500">Asansör bulunamadı</div>;

  const currentLabel = isEditing ? editForm?.label : elevator?.label;

  return (
    <div className="space-y-6 min-h-full rounded-xl transition-colors duration-500 p-4 -m-4 relative overflow-hidden" style={getWatermarkStyle(currentLabel)}>
      {/* Watermark Icon */}
      {currentLabel && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.03] rotate-12">
          {currentLabel.toLowerCase().includes('kırmızı') && <div className="text-[400px] text-red-600 font-black">RİSKLİ</div>}
          {currentLabel.toLowerCase().includes('sarı') && <div className="text-[400px] text-yellow-600 font-black">KUSURLU</div>}
          {currentLabel.toLowerCase().includes('mavi') && <div className="text-[400px] text-blue-600 font-black">HAFİF</div>}
          {currentLabel.toLowerCase().includes('yeşil') && <div className="text-[400px] text-green-600 font-black">UYGUN</div>}
        </div>
      )}
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => navigate(returnUrl)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">
              {isNew ? 'Yeni Asansör Ekle' : `Asansör #${elevator.elevatorNo} - Detaylar`}
            </h2>
            {!isNew && elevator?.facility && (
              <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-200 text-sm px-3 py-1 shadow-sm">
                {elevator.facility.name}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" /> Düzenle
            </Button>
          ) : (
            <>
              {!isNew && <Button variant="outline" onClick={() => { setIsEditing(false); setEditForm(elevator); }}>İptal</Button>}
              <Button onClick={handleSaveEdit} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" /> {isNew ? 'Kaydet' : 'Değişiklikleri Kaydet'}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Kimlik Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(isNew && isAdmin && (initialFacilityId === 'all' || facilityId === 'all')) && (
              <div className="space-y-2 mb-4">
                <Label>Tesis Seçimi *</Label>
                <Select value={editForm.facilityId || ''} onValueChange={(val) => setEditForm({ ...editForm, facilityId: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tesis Seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {facilities.filter((f: any) => isAdmin || user?.facilities?.some(uf => uf.facilityId === f.id)).map((f: any) => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 block mb-1">Asansör No *</span>
                {isEditing ? (
                  <Input value={editForm.elevatorNo || ''} onChange={(e) => setEditForm({ ...editForm, elevatorNo: e.target.value })} className="h-8" placeholder="Örn: 1" />
                ) : (
                  <span className="font-medium">{elevator.elevatorNo || '-'}</span>
                )}
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Asansör Adı/Konum</span>
                {isEditing ? (
                  <Input value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="h-8" />
                ) : (
                  <span className="font-medium">{elevator.name || '-'}</span>
                )}
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Marka</span>
                {isEditing ? (
                  <Select value={editForm.brand || ''} onValueChange={(val) => setEditForm({ ...editForm, brand: val })}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map(b => (
                        <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="font-medium">{elevator.brand || '-'}</span>
                )}
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Tür</span>
                {isEditing ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between h-auto min-h-8 py-1 px-2 text-xs font-normal text-left"
                      >
                        <div className="flex flex-wrap gap-1 items-center max-w-[90%]">
                          {editForm.type && editForm.type !== '-' ? (
                            editForm.type.split(',').map((t: string) => t.trim()).filter(Boolean).map((t: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                                {t}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground">Tür seçiniz...</span>
                          )}
                        </div>
                        <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2 bg-popover" align="start">
                      <div className="space-y-1 max-h-56 overflow-y-auto">
                        {types.map((t) => {
                          const currentList = (editForm.type && editForm.type !== '-')
                            ? editForm.type.split(',').map((x: string) => x.trim()).filter(Boolean)
                            : [];
                          const isChecked = currentList.includes(t.name);
                          return (
                            <label
                              key={t.id}
                              className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted cursor-pointer text-xs transition-colors"
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={(checked) => {
                                  let updated: string[];
                                  if (checked) {
                                    updated = [...currentList, t.name];
                                  } else {
                                    updated = currentList.filter((x: string) => x !== t.name);
                                  }
                                  setEditForm({
                                    ...editForm,
                                    type: updated.length > 0 ? updated.join(', ') : '-'
                                  });
                                }}
                              />
                              <span>{t.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <div className="flex flex-wrap gap-1.5 mt-0.5">
                    {elevator.type && elevator.type !== '-' ? (
                      elevator.type.split(',').map((t: string, idx: number) => (
                        <Badge 
                          key={idx} 
                          variant="outline" 
                          className="px-2.5 py-0.5 text-xs font-medium bg-slate-100/90 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 shadow-2xs"
                        >
                          {t.trim()}
                        </Badge>
                      ))
                    ) : (
                      <span className="font-medium text-muted-foreground">-</span>
                    )}
                  </div>
                )}
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Model</span>
                {isEditing ? (
                  <Input value={editForm.model || ''} onChange={(e) => setEditForm({ ...editForm, model: e.target.value })} className="h-8" />
                ) : (
                  <span className="font-medium">{elevator.model || '-'}</span>
                )}
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Seri No</span>
                {isEditing ? (
                  <Input value={editForm.serialNo || ''} onChange={(e) => setEditForm({ ...editForm, serialNo: e.target.value })} className="h-8" />
                ) : (
                  <span className="font-medium">{elevator.serialNo || '-'}</span>
                )}
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Kapasite (kg)</span>
                {isEditing ? (
                  <Input value={editForm.capacityKg || ''} onChange={(e) => setEditForm({ ...editForm, capacityKg: e.target.value })} className="h-8" type="number" />
                ) : (
                  <span className="font-medium">{elevator.capacityKg || '-'}</span>
                )}
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Kapasite (Kişi)</span>
                {isEditing ? (
                  <Input value={editForm.capacityPerson || ''} onChange={(e) => setEditForm({ ...editForm, capacityPerson: e.target.value })} className="h-8" type="number" />
                ) : (
                  <span className="font-medium">{elevator.capacityPerson || '-'}</span>
                )}
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Durak Sayısı</span>
                {isEditing ? (
                  <Input value={editForm.stopsCount || ''} onChange={(e) => setEditForm({ ...editForm, stopsCount: e.target.value })} className="h-8" type="number" />
                ) : (
                  <span className="font-medium">{elevator.stopsCount || '-'}</span>
                )}
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Montaj Yılı</span>
                {isEditing ? (
                  <Input value={editForm.installationYear || ''} onChange={(e) => setEditForm({ ...editForm, installationYear: e.target.value })} className="h-8" type="number" />
                ) : (
                  <span className="font-medium">{elevator.installationYear || '-'}</span>
                )}
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Periyodik Kontrolü Yapan Firma</span>
                {isEditing ? (
                  <Input value={editForm.source || ''} onChange={(e) => setEditForm({ ...editForm, source: e.target.value })} className="h-8" />
                ) : (
                  <span className="font-medium">{elevator.source || '-'}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {!isNew && elevator?.nextInspectionDate && (
            <CountdownTimer targetDate={elevator.nextInspectionDate} />
          )}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Yönetim & Muayene Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 block mb-1">Durum</span>
                  {isEditing ? (
                    <Select value={editForm.status || ''} onValueChange={(val) => setEditForm({ ...editForm, status: val })}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map(s => (
                          <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="font-medium">{elevator.status || '-'}</span>
                  )}
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Etiket Rengi</span>
                  {isEditing ? (
                    <Select value={editForm.label || ''} onValueChange={(val) => setEditForm({ ...editForm, label: val })}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        {labels.map(l => (
                          <SelectItem key={l.id} value={l.name}>
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }}></div>
                              <span>{l.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={getLabelColor(elevator.label)}>{elevator.label || 'Belirsiz'}</Badge>
                  )}
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Bakım Firması</span>
                  {isEditing ? (
                    <Select value={editForm.maintenanceCompany || ''} onValueChange={(val) => setEditForm({ ...editForm, maintenanceCompany: val })}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map(c => (
                          <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="font-medium">{elevator.maintenanceCompany || '-'}</span>
                  )}
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Firma İletişim</span>
                  {isEditing ? (
                    <Input value={editForm.maintenanceContact || ''} onChange={(e) => setEditForm({ ...editForm, maintenanceContact: e.target.value })} className="h-8" />
                  ) : (
                    <span className="font-medium">{elevator.maintenanceContact || '-'}</span>
                  )}
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Bina Yöneticisi</span>
                  {isEditing ? (
                    <Input value={editForm.manager || ''} onChange={(e) => setEditForm({ ...editForm, manager: e.target.value })} className="h-8" />
                  ) : (
                    <span className="font-medium">{elevator.manager || '-'}</span>
                  )}
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Yönetici İletişim</span>
                  {isEditing ? (
                    <Input value={editForm.managerPhone || ''} onChange={(e) => setEditForm({ ...editForm, managerPhone: e.target.value })} className="h-8" />
                  ) : (
                    <span className="font-medium">{elevator.managerPhone || '-'}</span>
                  )}
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Son Muayene</span>
                  {isEditing ? (
                    <Input type="date" value={editForm.lastInspectionDate || ''} onChange={(e) => setEditForm({ ...editForm, lastInspectionDate: e.target.value })} className="h-8" />
                  ) : (
                    <span className="font-medium">{elevator.lastInspectionDate ? format(new Date(elevator.lastInspectionDate), 'dd.MM.yyyy') : '-'}</span>
                  )}
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Sonraki Muayene</span>
                  {isEditing ? (
                    <Input type="date" value={editForm.nextInspectionDate || ''} onChange={(e) => setEditForm({ ...editForm, nextInspectionDate: e.target.value })} className="h-8" />
                  ) : (
                    <span className="font-medium">{elevator.nextInspectionDate ? format(new Date(elevator.nextInspectionDate), 'dd.MM.yyyy') : '-'}</span>
                  )}
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500 block mb-1">Notlar</span>
                  {isEditing ? (
                    <Textarea value={editForm.notes || ''} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} className="h-16 resize-none" />
                  ) : (
                    <span className="font-medium">{elevator.notes || '-'}</span>
                  )}
                </div>
                
                {/* İlk Kayıt Rapor Yükleme (Sadece Yeni Asansör) */}
                {isNew && (
                  <div className="col-span-2 mt-4 p-3 border rounded-lg bg-slate-50 dark:bg-slate-900">
                    <span className="text-gray-700 dark:text-gray-300 font-semibold block mb-2">İlk Muayene Raporu / Asansör Dosyası</span>
                    <div className="flex items-center space-x-2">
                      <Input type="file" onChange={(e) => handleUpload(e, true)} disabled={isUploading} className="text-xs" />
                      {isUploading && <span className="text-xs text-blue-500">Yükleniyor...</span>}
                      {editForm.reportUrl && !isUploading && (
                        <span className="text-xs text-green-600 flex items-center"><FileText className="w-3 h-3 mr-1" /> Yüklendi</span>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {!isNew && (
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Periyodik Kontrol ve Bakım Geçmişi</CardTitle>
              <CardDescription>Asansöre ait tüm muayene kayıtları</CardDescription>
            </div>
            <Button onClick={() => setIsModalOpen(true)} size="sm">
              <PlusCircle className="mr-2 h-4 w-4" /> Muayene Ekle
            </Button>
          </CardHeader>
          <CardContent>
            {elevator.inspections && elevator.inspections.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Etiket</TableHead>
                      <TableHead>Muayene Eden</TableHead>
                      <TableHead>Notlar</TableHead>
                      <TableHead>Rapor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {elevator.inspections.map((insp: any) => (
                      <TableRow key={insp.id}>
                        <TableCell className="font-medium">
                          {format(new Date(insp.inspectionDate), 'dd.MM.yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge className={getLabelColor(insp.label)}>{insp.label}</Badge>
                        </TableCell>
                        <TableCell>{insp.inspectorName || '-'}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={insp.notes}>{insp.notes || '-'}</TableCell>
                        <TableCell>
                          {insp.reportUrl ? (
                            <Button variant="ghost" size="icon" onClick={() => setPdfReportUrl(BASE_URL + insp.reportUrl)} className="text-blue-500 hover:text-blue-700">
                              <FileText className="h-5 w-5" />
                            </Button>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                Henüz muayene kaydı bulunmuyor.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Muayene Ekleme Modalı */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Muayene Kaydı Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Muayene Tarihi *</Label>
                <Input type="date" value={newInspection.inspectionDate} onChange={(e) => setNewInspection({ ...newInspection, inspectionDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Sonraki Muayene</Label>
                <Input type="date" value={newInspection.nextInspectionDate} onChange={(e) => setNewInspection({ ...newInspection, nextInspectionDate: e.target.value })} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Yeni Etiket (Durum)</Label>
              <Select value={newInspection.label} onValueChange={(val) => setNewInspection({ ...newInspection, label: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Etiket Seçin" />
                </SelectTrigger>
                <SelectContent>
                  {labels.map(l => (
                    <SelectItem key={l.id} value={l.name}>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }}></div>
                        <span>{l.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Muayene Eden Firma/Kişi</Label>
              <Input value={newInspection.inspectorName} onChange={(e) => setNewInspection({ ...newInspection, inspectorName: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Notlar</Label>
              <Textarea value={newInspection.notes} onChange={(e) => setNewInspection({ ...newInspection, notes: e.target.value })} className="resize-none" />
            </div>

            <div className="space-y-2">
              <Label>Rapor/Belge Yükle</Label>
              <div className="flex items-center space-x-2">
                <Input type="file" onChange={(e) => handleUpload(e, false)} disabled={isUploading} />
                {isUploading && <span className="text-sm text-blue-500">Yükleniyor...</span>}
              </div>
              {newInspection.reportUrl && (
                <div className="text-sm text-green-600 flex items-center mt-1">
                  <FileText className="w-4 h-4 mr-1" /> Dosya eklendi
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>İptal</Button>
            <Button onClick={handleAddInspection} disabled={isUploading}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Viewer Dialog */}
      <Dialog open={!!pdfReportUrl} onOpenChange={(open) => !open && setPdfReportUrl(null)}>
        <DialogContent className="max-w-5xl w-[90vw] h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b flex flex-row items-center justify-between flex-none bg-white">
            <DialogTitle>Muayene Raporu</DialogTitle>
            <div className="mr-8 mt-0 pt-0">
              <Button variant="outline" size="sm" onClick={() => window.open(pdfReportUrl || '', '_blank')} className="hidden sm:flex">
                <ExternalLink className="w-4 h-4 mr-2" />
                Yeni Sekmede Aç
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 bg-gray-100 overflow-hidden relative">
            {pdfReportUrl && (
              <iframe src={pdfReportUrl} className="w-full h-full border-0 absolute inset-0" title="PDF Raporu" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

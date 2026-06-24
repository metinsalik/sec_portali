import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const calculateICRAClass = (buildType: string, riskGroup: string): string => {
  const matrix: Record<string, Record<string, string>> = {
    '1': { 'A': 'Sınıf I', 'B': 'Sınıf II', 'C': 'Sınıf II', 'D': 'Sınıf IV' },
    '2': { 'A': 'Sınıf I', 'B': 'Sınıf II', 'C': 'Sınıf III', 'D': 'Sınıf IV' },
    '3': { 'A': 'Sınıf I', 'B': 'Sınıf II', 'C': 'Sınıf IV', 'D': 'Sınıf IV' },
    '4': { 'A': 'Sınıf II', 'B': 'Sınıf IV', 'C': 'Sınıf IV', 'D': 'Sınıf IV' },
  };
  return matrix[riskGroup]?.[buildType] || 'Bilinmiyor';
};

export default function BuildProjectForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [facilityId, setFacilityId] = useState<string>(localStorage.getItem('activeFacilityId') || '');

  useEffect(() => {
    const handleFacilityChange = () => {
      setFacilityId(localStorage.getItem('activeFacilityId') || '');
    };
    window.addEventListener('facilityChanged', handleFacilityChange);
    return () => window.removeEventListener('facilityChanged', handleFacilityChange);
  }, []);

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm();
  
  const buildType = useWatch({ control, name: 'buildType' });
  const riskGroup = useWatch({ control, name: 'riskGroup' });
  const [icraClass, setIcraClass] = useState('Seçim bekleniyor...');

  useEffect(() => {
    if (buildType && riskGroup) {
      setIcraClass(calculateICRAClass(buildType, riskGroup));
    } else {
      setIcraClass('Seçim bekleniyor...');
    }
  }, [buildType, riskGroup]);

  // --- Queries ---

  const { data: locations } = useQuery({
    queryKey: ['build-locations', facilityId],
    queryFn: async () => {
      const res = await api.get(`/build-management/settings/locations?facilityId=${facilityId}`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!facilityId
  });

  const { data: contractors } = useQuery({
    queryKey: ['build-contractors', facilityId],
    queryFn: async () => {
      const res = await api.get(`/build-management/settings/contractors?facilityId=${facilityId}`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!facilityId
  });

  const { data: workTypes } = useQuery({
    queryKey: ['build-work-types', facilityId],
    queryFn: async () => {
      const res = await api.get(`/build-management/settings/work-types?facilityId=${facilityId}`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!facilityId
  });

  // --- Inline Contractor Adding ---
  const [showAddContractor, setShowAddContractor] = useState(false);
  const [newContractorName, setNewContractorName] = useState('');

  const addContractorMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await api.post('/build-management/settings/contractors', { facilityId, name });
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['build-contractors'] });
      setValue('contractorId', data.id);
      setShowAddContractor(false);
      setNewContractorName('');
      toast.success('Firma eklendi ve seçildi');
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = { 
        ...data, 
        facilityId, 
        status: 'Başlatılmaz',
        plannedStartDate: data.plannedStartDate ? new Date(data.plannedStartDate).toISOString() : undefined,
        plannedEndDate: data.plannedEndDate ? new Date(data.plannedEndDate).toISOString() : undefined
      };
      const res = await api.post('/build-management/projects', payload);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Projeyi oluştururken sunucu hatası oluştu');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success('Proje başarıyla oluşturuldu');
      queryClient.invalidateQueries({ queryKey: ['buildProjects'] });
      navigate(`/build-management/project/${data.id}`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Proje oluşturulurken bir hata oluştu');
    }
  });

  const onSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Yeni İnşaat / Renovasyon Projesi</h2>
        <Button variant="outline" onClick={() => navigate('/build-management/dashboard')}>İptal</Button>
      </div>

      <div className="bg-card p-6 rounded-xl border shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Proje Adı *</label>
              <input 
                {...register('name', { required: true })} 
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Örn: 2. Kat Yenidoğan Yoğun Bakım Tadilatı"
              />
              {errors.name && <span className="text-red-500 text-xs mt-1 block">Bu alan zorunludur</span>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Lokasyon *</label>
              <select 
                {...register('locationId', { required: true })} 
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Seçiniz...</option>
                {locations?.map((l: any) => (
                  <option key={l.id} value={l.id}>{l.block} - {l.floor} - {l.unit} {l.room ? `(${l.room})` : ''}</option>
                ))}
              </select>
              {errors.locationId && <span className="text-red-500 text-xs mt-1 block">Zorunlu</span>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Çalışma Türü *</label>
              <select 
                {...register('workTypeId', { required: true })} 
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Seçiniz...</option>
                {workTypes?.map((w: any) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
              {errors.workTypeId && <span className="text-red-500 text-xs mt-1 block">Zorunlu</span>}
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Yüklenici Firma *</label>
              <div className="flex gap-2">
                <select 
                  {...register('contractorId', { required: true })} 
                  className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Seçiniz...</option>
                  {contractors?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <Button type="button" variant="outline" size="icon" onClick={() => setShowAddContractor(!showAddContractor)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {errors.contractorId && <span className="text-red-500 text-xs mt-1 block">Zorunlu</span>}

              {showAddContractor && (
                <div className="mt-2 p-3 bg-muted/50 rounded-md border flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-semibold">Yeni Firma Ekle</label>
                    <Input 
                      value={newContractorName} 
                      onChange={(e) => setNewContractorName(e.target.value)} 
                      placeholder="Firma adını girin..." 
                    />
                  </div>
                  <Button 
                    type="button" 
                    onClick={() => addContractorMutation.mutate(newContractorName)}
                    disabled={!newContractorName || addContractorMutation.isPending}
                  >
                    {addContractorMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Plus className="w-4 h-4 mr-2"/>} Kaydet
                  </Button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Planlanan Başlangıç</label>
              <input 
                type="date"
                {...register('plannedStartDate')} 
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Planlanan Bitiş</label>
              <input 
                type="date"
                {...register('plannedEndDate')} 
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* ICRA Inputs */}
            <div className="col-span-2 border-t pt-4 mt-2">
               <h3 className="font-bold mb-4">ICRA Sınıflandırma Verileri</h3>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Çalışma Tipi (İnşaat Etkisi) *</label>
              <select {...register('buildType', { required: true })} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Seçiniz...</option>
                <option value="A">Tip A (Küçük çaplı, tozsuz, denetimli faaliyet)</option>
                <option value="B">Tip B (Kısa süreli, az tozlu, küçük alan kesme/delme)</option>
                <option value="C">Tip C (Orta çaplı, tozlu, kısmi yıkım gerektiren)</option>
                <option value="D">Tip D (Büyük çaplı, çok tozlu, geniş kapsamlı yıkım/inşaat)</option>
              </select>
              {errors.buildType && <span className="text-red-500 text-xs mt-1 block">Zorunlu</span>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Risk Grubu (Etkilenen Alan) *</label>
              <select {...register('riskGroup', { required: true })} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Seçiniz...</option>
                <option value="1">Düşük Risk (Ofisler, Koridorlar)</option>
                <option value="2">Orta Risk (Poliklinikler, Yemekhaneler)</option>
                <option value="3">Yüksek Risk (Acil Servis, Laboratuvar, Görüntüleme)</option>
                <option value="4">En Yüksek Risk (Ameliyathane, Yoğun Bakım, İzolasyon Odaları)</option>
              </select>
              {errors.riskGroup && <span className="text-red-500 text-xs mt-1 block">Zorunlu</span>}
            </div>

            <div className="col-span-2">
              <div className="p-4 bg-muted/30 border rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm">Hesaplanan ICRA Sınıfı</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Seçtiğiniz Çalışma Tipi ve Risk Grubuna göre otomatik belirlenir.</p>
                </div>
                <div className="text-xl font-bold text-primary">{icraClass}</div>
              </div>
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Proje Açıklaması</label>
              <textarea 
                {...register('description')} 
                rows={3}
                className="w-full p-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Projeyi Oluştur
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

const API = import.meta.env.VITE_API_URL || '';

export default function BuildSettings() {
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const queryClient = useQueryClient();
  // ── Facility Selection ───────────────────────────────────────
  const [facilityId, setFacilityId] = useState<string>(localStorage.getItem('activeFacilityId') || '');

  useEffect(() => {
    const handleFacilityChange = () => {
      setFacilityId(localStorage.getItem('activeFacilityId') || '');
    };
    window.addEventListener('facilityChanged', handleFacilityChange);
    return () => window.removeEventListener('facilityChanged', handleFacilityChange);
  }, []);

  const [activeTab, setActiveTab] = useState('locations');
  const [newLocation, setNewLocation] = useState({ block: '', floor: '', unit: '', room: '', description: '' });
  const [newContractor, setNewContractor] = useState({ name: '', contactName: '', phone: '', email: '' });
  const [newWorkType, setNewWorkType] = useState({ name: '', description: '' });
  const [newDepartment, setNewDepartment] = useState({ name: '' });
  const [newPerson, setNewPerson] = useState({ name: '', title: '' });

  // --- Queries ---

  const { data: locations, isLoading: locLoading } = useQuery({
    queryKey: ['build-locations', facilityId],
    queryFn: async () => {
      const res = await fetch(`${API}/api/build-management/settings/locations?facilityId=${facilityId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!facilityId
  });

  const { data: contractors, isLoading: conLoading } = useQuery({
    queryKey: ['build-contractors', facilityId],
    queryFn: async () => {
      const res = await fetch(`${API}/api/build-management/settings/contractors?facilityId=${facilityId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!facilityId
  });

  const { data: workTypes, isLoading: wtLoading } = useQuery({
    queryKey: ['build-work-types', facilityId],
    queryFn: async () => {
      const res = await fetch(`${API}/api/build-management/settings/work-types?facilityId=${facilityId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!facilityId
  });

  const { data: departments, isLoading: deptLoading } = useQuery({
    queryKey: ['build-departments', facilityId],
    queryFn: async () => {
      const res = await fetch(`${API}/api/build-management/settings/departments?facilityId=${facilityId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!facilityId
  });

  const { data: persons, isLoading: personLoading } = useQuery({
    queryKey: ['build-persons', facilityId],
    queryFn: async () => {
      const res = await fetch(`${API}/api/build-management/settings/persons?facilityId=${facilityId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!facilityId
  });

  // --- Mutations ---

  const addLocation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API}/api/build-management/settings/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ facilityId, ...newLocation })
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['build-locations'] });
      setNewLocation({ block: '', floor: '', unit: '', room: '', description: '' });
      toast.success('Lokasyon eklendi');
    },
    onError: (err: any) => toast.error(err.message || 'Lokasyon eklenemedi')
  });

  const deleteLocation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API}/api/build-management/settings/locations/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['build-locations'] });
      toast.success('Lokasyon silindi');
    },
    onError: (err: any) => toast.error(err.message || 'Lokasyon silinemedi')
  });

  const addContractor = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API}/api/build-management/settings/contractors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ facilityId, ...newContractor })
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['build-contractors'] });
      setNewContractor({ name: '', contactName: '', phone: '', email: '' });
      toast.success('Firma eklendi');
    },
    onError: (err: any) => toast.error(err.message || 'Firma eklenemedi')
  });

  const deleteContractor = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API}/api/build-management/settings/contractors/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['build-contractors'] });
      toast.success('Firma silindi');
    },
    onError: (err: any) => toast.error(err.message || 'Firma silinemedi')
  });

  const addWorkType = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API}/api/build-management/settings/work-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ facilityId, ...newWorkType })
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['build-work-types'] });
      setNewWorkType({ name: '', description: '' });
      toast.success('Çalışma türü eklendi');
    },
    onError: (err: any) => toast.error(err.message || 'Çalışma türü eklenemedi')
  });

  const deleteWorkType = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API}/api/build-management/settings/work-types/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['build-work-types'] });
      toast.success('Çalışma türü silindi');
    },
    onError: (err: any) => toast.error(err.message || 'Çalışma türü silinemedi')
  });

  const addDepartment = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API}/api/build-management/settings/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ facilityId, ...newDepartment })
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['build-departments'] });
      setNewDepartment({ name: '' });
      toast.success('Departman eklendi');
    },
    onError: (err: any) => toast.error(err.message || 'Departman eklenemedi')
  });

  const deleteDepartment = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API}/api/build-management/settings/departments/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['build-departments'] });
      toast.success('Departman silindi');
    },
    onError: (err: any) => toast.error(err.message || 'Departman silinemedi')
  });

  const addPerson = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API}/api/build-management/settings/persons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ facilityId, ...newPerson })
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['build-persons'] });
      setNewPerson({ name: '', title: '' });
      toast.success('Sorumlu kişi eklendi');
    },
    onError: (err: any) => toast.error(err.message || 'Kişi eklenemedi')
  });

  const deletePerson = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API}/api/build-management/settings/persons/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['build-persons'] });
      toast.success('Sorumlu kişi silindi');
    },
    onError: (err: any) => toast.error(err.message || 'Kişi silinemedi')
  });


  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Modül Ayarları</h1>
        <p className="text-muted-foreground text-sm mt-1">İnşaat ve Renovasyon modülü için temel tanımlamaları yönetin.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="locations">Lokasyonlar</TabsTrigger>
          <TabsTrigger value="contractors">Yüklenici Firmalar</TabsTrigger>
          <TabsTrigger value="worktypes">Çalışma Türleri</TabsTrigger>
          <TabsTrigger value="departments">Departmanlar</TabsTrigger>
          <TabsTrigger value="persons">Sorumlular</TabsTrigger>
        </TabsList>

        <TabsContent value="locations">
          <Card>
            <CardHeader>
              <CardTitle>Lokasyon Tanımları</CardTitle>
              <CardDescription>Projelerde kullanılacak Blok, Kat, Birim ve Mahal tanımlarını ekleyin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-5 gap-2 items-end">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Blok</label>
                  <Input value={newLocation.block} onChange={e => setNewLocation({...newLocation, block: e.target.value})} placeholder="Örn: A Blok" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Kat</label>
                  <Input value={newLocation.floor} onChange={e => setNewLocation({...newLocation, floor: e.target.value})} placeholder="Örn: Zemin" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Birim</label>
                  <Input value={newLocation.unit} onChange={e => setNewLocation({...newLocation, unit: e.target.value})} placeholder="Örn: Poliklinik" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Mahal</label>
                  <Input value={newLocation.room} onChange={e => setNewLocation({...newLocation, room: e.target.value})} placeholder="Örn: Bekleme Salonu" />
                </div>
                <Button onClick={() => addLocation.mutate()} disabled={!newLocation.block || addLocation.isPending}>
                  <Plus className="w-4 h-4 mr-2" /> Ekle
                </Button>
              </div>

              <div className="border rounded-md mt-6">
                <div className="grid grid-cols-5 bg-muted p-3 font-semibold text-sm border-b">
                  <div>Blok</div>
                  <div>Kat</div>
                  <div>Birim</div>
                  <div>Mahal</div>
                  <div className="text-right">İşlem</div>
                </div>
                {locLoading ? <div className="p-4 text-center text-sm text-muted-foreground">Yükleniyor...</div> : 
                 locations?.map((l: any) => (
                  <div key={l.id} className="grid grid-cols-5 p-3 text-sm border-b last:border-0 items-center">
                    <div>{l.block}</div>
                    <div>{l.floor}</div>
                    <div>{l.unit}</div>
                    <div>{l.room}</div>
                    <div className="text-right">
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteLocation.mutate(l.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contractors">
          <Card>
            <CardHeader>
              <CardTitle>Yüklenici Firmalar</CardTitle>
              <CardDescription>Çalıştığınız inşaat/renovasyon firmalarını ekleyin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-5 gap-2 items-end">
                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-semibold">Firma Adı *</label>
                  <Input value={newContractor.name} onChange={e => setNewContractor({...newContractor, name: e.target.value})} placeholder="Örn: ABC Yapı A.Ş." />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Yetkili Kişi</label>
                  <Input value={newContractor.contactName} onChange={e => setNewContractor({...newContractor, contactName: e.target.value})} placeholder="Ad Soyad" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Telefon</label>
                  <Input value={newContractor.phone} onChange={e => setNewContractor({...newContractor, phone: e.target.value})} placeholder="0555..." />
                </div>
                <Button onClick={() => addContractor.mutate()} disabled={!newContractor.name || addContractor.isPending}>
                  <Plus className="w-4 h-4 mr-2" /> Ekle
                </Button>
              </div>

              <div className="border rounded-md mt-6">
                <div className="grid grid-cols-4 bg-muted p-3 font-semibold text-sm border-b">
                  <div className="col-span-2">Firma Adı</div>
                  <div>Yetkili / Telefon</div>
                  <div className="text-right">İşlem</div>
                </div>
                {conLoading ? <div className="p-4 text-center text-sm text-muted-foreground">Yükleniyor...</div> : 
                 contractors?.map((c: any) => (
                  <div key={c.id} className="grid grid-cols-4 p-3 text-sm border-b last:border-0 items-center">
                    <div className="col-span-2 font-medium">{c.name}</div>
                    <div className="text-muted-foreground">{c.contactName} {c.phone && `(${c.phone})`}</div>
                    <div className="text-right">
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteContractor.mutate(c.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="worktypes">
          <Card>
            <CardHeader>
              <CardTitle>Çalışma Türleri</CardTitle>
              <CardDescription>Renovasyon, İnşaat, Yıkım vb. çalışma türlerini tanımlayın.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-2 items-end">
                <div className="space-y-1 col-span-1">
                  <label className="text-xs font-semibold">Tür Adı *</label>
                  <Input value={newWorkType.name} onChange={e => setNewWorkType({...newWorkType, name: e.target.value})} placeholder="Örn: Renovasyon" />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-semibold">Açıklama</label>
                  <Input value={newWorkType.description} onChange={e => setNewWorkType({...newWorkType, description: e.target.value})} placeholder="Açıklama (Opsiyonel)" />
                </div>
                <Button onClick={() => addWorkType.mutate()} disabled={!newWorkType.name || addWorkType.isPending}>
                  <Plus className="w-4 h-4 mr-2" /> Ekle
                </Button>
              </div>

              <div className="border rounded-md mt-6">
                <div className="grid grid-cols-3 bg-muted p-3 font-semibold text-sm border-b">
                  <div>Tür Adı</div>
                  <div>Açıklama</div>
                  <div className="text-right">İşlem</div>
                </div>
                {wtLoading ? <div className="p-4 text-center text-sm text-muted-foreground">Yükleniyor...</div> : 
                 workTypes?.map((w: any) => (
                  <div key={w.id} className="grid grid-cols-3 p-3 text-sm border-b last:border-0 items-center">
                    <div className="font-medium">{w.name}</div>
                    <div className="text-muted-foreground">{w.description || '-'}</div>
                    <div className="text-right">
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteWorkType.mutate(w.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments">
          <Card>
            <CardHeader>
              <CardTitle>Departmanlar (Bölümler)</CardTitle>
              <CardDescription>Hizmet tasarım formunda "Talep Sahibi" ve "İlgili Bölümler" için seçilecek departmanları tanımlayın.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 items-end">
                <div className="space-y-1 flex-1">
                  <label className="text-xs font-semibold">Departman Adı</label>
                  <Input value={newDepartment.name} onChange={e => setNewDepartment({...newDepartment, name: e.target.value})} placeholder="Örn: Hasta Bakım Hizmetleri" />
                </div>
                <Button onClick={() => addDepartment.mutate()} disabled={!newDepartment.name || addDepartment.isPending}>
                  <Plus className="w-4 h-4 mr-2" /> Ekle
                </Button>
              </div>

              <div className="border rounded-md mt-4">
                {deptLoading ? (
                  <div className="p-4 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>
                ) : departments?.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">Kayıtlı departman bulunamadı.</div>
                ) : (
                  <div className="divide-y">
                    {departments?.map((d: any) => (
                      <div key={d.id} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800">
                        <div className="font-medium text-sm">{d.name}</div>
                        <Button variant="ghost" size="sm" onClick={() => deleteDepartment.mutate(d.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="persons">
          <Card>
            <CardHeader>
              <CardTitle>Sorumlu Kişiler</CardTitle>
              <CardDescription>Hizmet tasarım formunda "Proje Yöneticisi" ve "Ekip Üyeleri" olarak atanabilecek kişileri tanımlayın.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 items-end">
                <div className="space-y-1 flex-1">
                  <label className="text-xs font-semibold">Kişi Adı Soyadı</label>
                  <Input value={newPerson.name} onChange={e => setNewPerson({...newPerson, name: e.target.value})} placeholder="Örn: Ahmet Yılmaz" />
                </div>
                <div className="space-y-1 flex-1">
                  <label className="text-xs font-semibold">Unvanı / Rolü</label>
                  <Input value={newPerson.title} onChange={e => setNewPerson({...newPerson, title: e.target.value})} placeholder="Örn: Proje Yöneticisi" />
                </div>
                <Button onClick={() => addPerson.mutate()} disabled={!newPerson.name || addPerson.isPending}>
                  <Plus className="w-4 h-4 mr-2" /> Ekle
                </Button>
              </div>

              <div className="border rounded-md mt-4">
                {personLoading ? (
                  <div className="p-4 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>
                ) : persons?.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">Kayıtlı kişi bulunamadı.</div>
                ) : (
                  <div className="divide-y">
                    {persons?.map((p: any) => (
                      <div key={p.id} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800">
                        <div>
                          <div className="font-medium text-sm">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.title || '-'}</div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => deletePerson.mutate(p.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { Upload, Trash2, Plus } from 'lucide-react';

export default function HazmatSettingsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine active tab based on URL path
  const getTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/departments')) return 'departments';
    if (path.includes('/units')) return 'units';
    if (path.includes('/labels')) return 'ghs';
    if (path.includes('/ppe')) return 'ppe';
    if (path.includes('/categories')) return 'categories';
    return 'categories';
  };

  const [activeTab, setActiveTab] = useState(getTabFromPath());

  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'units') navigate('/hazmat/settings/units');
    else if (value === 'departments') navigate('/hazmat/settings/departments');
    else if (value === 'ghs' || value === 'adr') navigate('/hazmat/settings/labels');
    else if (value === 'ppe') navigate('/hazmat/settings/ppe');
    else if (value === 'categories') navigate('/hazmat/settings/categories');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tehlikeli Madde Ayarları</h1>
        <p className="text-muted-foreground">Birimler, Bölümler ve Görsel Etiket tanımlamaları.</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-6 h-auto py-2">
          <TabsTrigger value="categories" className="py-2">Kategoriler</TabsTrigger>
          <TabsTrigger value="units" className="py-2">Miktar Cinsleri</TabsTrigger>
          <TabsTrigger value="departments" className="py-2">Bölüm - Departman</TabsTrigger>
          <TabsTrigger value="ghs" className="py-2">GHS Etiketleri</TabsTrigger>
          <TabsTrigger value="adr" className="py-2">ADR Etiketleri</TabsTrigger>
          <TabsTrigger value="ppe" className="py-2">KKD'ler</TabsTrigger>
        </TabsList>
        
        <TabsContent value="categories">
          <CategoriesTab />
        </TabsContent>
        <TabsContent value="units">
          <UnitsTab />
        </TabsContent>
        <TabsContent value="departments">
          <DeptsTab />
        </TabsContent>
        <TabsContent value="ghs">
          <ImageItemsTab type="hazard-labels" title="GHS Tehlike Etiketleri" queryKey="hazmat-hazard-labels" hasCode={true} />
        </TabsContent>
        <TabsContent value="adr">
          <ImageItemsTab type="adr-labels" title="ADR Tehlike Etiketleri" queryKey="hazmat-adr-labels" hasCode={true} />
        </TabsContent>
        <TabsContent value="ppe">
          <ImageItemsTab type="ppes" title="Kişisel Koruyucu Donanımlar (KKD)" queryKey="hazmat-ppes" hasCode={false} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UnitsTab() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');

  const { data: units = [] } = useQuery({
    queryKey: ['hazmat-units'],
    queryFn: async () => {
      const res = await api.get('/hazmat/settings/units');
      if (!res.ok) throw new Error('Hata');
      return res.json();
    }
  });

  const createUnit = useMutation({
    mutationFn: async () => await api.post('/hazmat/settings/units', { name, symbol }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hazmat-units'] });
      setName(''); setSymbol('');
      toast.success('Birim eklendi.');
    }
  });

  const deleteUnit = useMutation({
    mutationFn: async (id: string) => await api.delete(`/hazmat/settings/units/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hazmat-units'] })
  });

  return (
    <div className="bg-card border rounded-lg p-6 mt-4">
      <h3 className="text-lg font-semibold mb-4">Miktar Cinsleri (Birimler)</h3>
      <div className="flex gap-4 mb-6">
        <Input placeholder="Adı (Örn: Kilogram)" value={name} onChange={e => setName(e.target.value)} />
        <Input placeholder="Sembol (Örn: kg)" value={symbol} onChange={e => setSymbol(e.target.value)} />
        <Button onClick={() => createUnit.mutate()} disabled={!name || !symbol}>Ekle</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {units.map((u: any) => (
          <div key={u.id} className="border p-3 rounded flex justify-between items-center bg-muted/20">
            <div>
              <div className="font-semibold text-sm">{u.name}</div>
              <div className="text-xs text-muted-foreground">{u.symbol}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => deleteUnit.mutate(u.id)} className="text-red-500 h-6 w-6"><Trash2 className="w-4 h-4" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeptsTab() {
  const queryClient = useQueryClient();
  const activeFacilityId = localStorage.getItem('activeFacilityId');
  const [deptName, setDeptName] = useState('');

  const { data: depts = [] } = useQuery({
    queryKey: ['hazmat-departments', activeFacilityId],
    queryFn: async () => {
      if (!activeFacilityId) return [];
      const res = await api.get(`/hazmat/settings/departments?facilityId=${activeFacilityId}`);
      if (!res.ok) throw new Error('Hata');
      return res.json();
    },
    enabled: !!activeFacilityId
  });

  const { data: globalDepartments = [] } = useQuery({
    queryKey: ['global-departments'],
    queryFn: async () => {
      const res = await api.get('/settings/definitions/departments');
      if (!res.ok) return [];
      return res.json();
    },
  });

  const createDept = useMutation({
    mutationFn: async () => await api.post('/hazmat/settings/departments', { facilityId: activeFacilityId, name: deptName.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hazmat-departments', activeFacilityId] });
      setDeptName('');
      toast.success('Departman eklendi.');
    }
  });

  const deleteDept = useMutation({
    mutationFn: async (id: string) => await api.delete(`/hazmat/settings/departments/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hazmat-departments', activeFacilityId] })
  });

  return (
    <div className="bg-card border rounded-lg p-6 mt-4">
      <h3 className="text-lg font-semibold mb-4">Seçili Tesisin Departmanları</h3>
      {!activeFacilityId ? (
        <p className="text-sm text-red-500">Lütfen üst kısımdan bir tesis seçin.</p>
      ) : (
        <>
          <div className="flex gap-4 mb-6">
            <Input 
              list="hazmat-global-departments"
              placeholder="Departman seçin veya yazın (Örn: Acil Servis)" 
              value={deptName} 
              onChange={e => setDeptName(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && deptName.trim() && createDept.mutate()}
            />
            <datalist id="hazmat-global-departments">
              {globalDepartments.map((d: any) => (
                <option key={d.id} value={d.name} />
              ))}
            </datalist>
            <Button onClick={() => createDept.mutate()} disabled={!deptName.trim() || createDept.isPending}>
              {createDept.isPending ? 'Ekleniyor...' : 'Departman Ekle'}
            </Button>
          </div>
          {depts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Bu tesise ait departman bulunmuyor. Yeni ekleyebilirsiniz.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {depts.map((d: any) => (
                <div key={d.id} className="border p-3 rounded flex justify-between items-center bg-muted/20">
                  <div className="font-semibold text-sm">{d.name}</div>
                  <Button variant="ghost" size="icon" onClick={() => deleteDept.mutate(d.id)} className="text-red-500 h-6 w-6"><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ImageItemsTab({ type, title, queryKey, hasCode }: { type: string, title: string, queryKey: string, hasCode: boolean }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const { data: items = [] } = useQuery({
    queryKey: [queryKey],
    queryFn: async () => {
      const res = await api.get(`/hazmat/settings/${type}`);
      if (!res.ok) throw new Error('Hata');
      return res.json();
    }
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/hazmat/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setImageUrl(data.url);
        toast.success('Görsel yüklendi!');
      } else {
        toast.error(data.error || 'Yükleme hatası');
      }
    } catch (err) {
      toast.error('Görsel yüklenemedi.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const createItem = useMutation({
    mutationFn: async () => await api.post(`/hazmat/settings/${type}`, { code, name, imageUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      setCode(''); setName(''); setImageUrl('');
      toast.success('Başarıyla eklendi.');
    }
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => await api.delete(`/hazmat/settings/${type}/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] })
  });

  return (
    <div className="bg-card border rounded-lg p-6 mt-4">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 bg-muted/30 p-4 rounded-lg border">
        {hasCode && (
          <div className="space-y-1">
            <Label>Kod</Label>
            <Input placeholder="Örn: GHS01" value={code} onChange={e => setCode(e.target.value)} />
          </div>
        )}
        <div className={`space-y-1 ${hasCode ? 'md:col-span-2' : 'md:col-span-3'}`}>
          <Label>Adı / Açıklama</Label>
          <Input placeholder="Örn: Patlayıcı Madde" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Görsel (İsteğe Bağlı)</Label>
          <div className="flex gap-2 items-center">
            <Button variant="outline" type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Yükleniyor...' : 'Seç'}
            </Button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
          </div>
          {imageUrl && <img src={imageUrl} alt="preview" className="h-8 object-contain mt-1" />}
        </div>
        <div className="flex items-end">
          <Button className="w-full" onClick={() => createItem.mutate()} disabled={!name || (hasCode && !code)}>
            <Plus className="w-4 h-4 mr-2" /> Ekle
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.map((item: any) => (
          <div key={item.id} className="border rounded-lg p-4 flex flex-col items-center justify-between text-center relative group">
            <Button 
              variant="destructive" 
              size="icon" 
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => deleteItem.mutate(item.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
            
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-contain mb-2" />
            ) : (
              <div className="w-16 h-16 bg-muted rounded flex items-center justify-center mb-2 text-xs">Görsel Yok</div>
            )}
            
            {hasCode && <div className="text-[9px] font-bold text-muted-foreground mb-1">{item.code}</div>}
            <div className="text-xs font-semibold leading-tight text-foreground">{item.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoriesTab() {
  const [name, setName] = useState('');
  const [scope, setScope] = useState('');
  const [examples, setExamples] = useState('');
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['hazmat-categories'],
    queryFn: async () => {
      const res = await api.get('/hazmat/settings/categories');
      if (!res.ok) throw new Error('Hata');
      return res.json();
    }
  });

  const createCategory = useMutation({
    mutationFn: async () => {
      const res = await api.post('/hazmat/settings/categories', { name, scope, examples });
      if (!res.ok) throw new Error('Hata');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hazmat-categories'] });
      setName(''); setScope(''); setExamples('');
      toast.success('Kategori eklendi');
    }
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/hazmat/settings/categories/${id}`);
      if (!res.ok) throw new Error('Hata');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hazmat-categories'] });
      toast.success('Kategori silindi');
    }
  });

  return (
    <div className="space-y-6">
      <div className="bg-muted/30 p-4 rounded-lg border grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
        <div className="space-y-2">
          <Label>Kategori Adı</Label>
          <Input placeholder="Örn: Laboratuvar Kimyasalları" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Kapsam</Label>
          <Input placeholder="Örn: Laboratuvar testlerinde..." value={scope} onChange={e => setScope(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Örnekler</Label>
          <Input placeholder="Örn: Biyokimya kitleri..." value={examples} onChange={e => setExamples(e.target.value)} />
        </div>
        <div className="flex items-end h-[68px]">
          <Button className="w-full" onClick={() => createCategory.mutate()} disabled={!name}>
            <Plus className="w-4 h-4 mr-2" /> Ekle
          </Button>
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Kategori Adı</th>
              <th className="px-4 py-3 font-medium">Kapsam</th>
              <th className="px-4 py-3 font-medium">Örnekler</th>
              <th className="px-4 py-3 font-medium text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {categories.map((c: any) => (
              <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.scope || '-'}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.examples || '-'}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => deleteCategory.mutate(c.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && !isLoading && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Henüz kategori eklenmemiş.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

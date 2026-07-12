import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from 'sonner';
import { Upload, Trash2, Plus, ChevronDown, ChevronRight, MapPin, Pencil, Check, FolderTree, List } from 'lucide-react';

export default function HazmatSettingsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine active tab based on URL path
  const getTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/departments')) return 'departments';
    if (path.includes('/units')) return 'units';
    if (path.includes('/ghs')) return 'ghs';
    if (path.includes('/adr')) return 'adr';
    if (path.includes('/ppe')) return 'ppe';
    if (path.includes('/events')) return 'events';
    if (path.includes('/categories')) return 'categories';
    return 'events';
  };

  const [activeTab, setActiveTab] = useState(getTabFromPath());

  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'units') navigate('/hazmat/settings/units');
    else if (value === 'ghs') navigate('/hazmat/settings/ghs');
    else if (value === 'adr') navigate('/hazmat/settings/adr');
    else if (value === 'ppe') navigate('/hazmat/settings/ppe');
    else if (value === 'events') navigate('/hazmat/settings/events');
    else if (value === 'categories') navigate('/hazmat/settings/categories');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tehlikeli Madde Ayarları</h1>
        <p className="text-muted-foreground">Birimler, Bölümler ve Görsel Etiket tanımlamaları.</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-7 h-auto py-2">
          <TabsTrigger value="events" className="py-2">Olay Türleri</TabsTrigger>
          <TabsTrigger value="categories" className="py-2">Kategoriler</TabsTrigger>
          <TabsTrigger value="units" className="py-2">Miktar Cinsleri</TabsTrigger>
          {/* <TabsTrigger value="departments" className="py-2">Bölüm - Departman</TabsTrigger> */}
          <TabsTrigger value="ghs" className="py-2">GHS Etiketleri</TabsTrigger>
          <TabsTrigger value="adr" className="py-2">ADR (Kategori)</TabsTrigger>
          <TabsTrigger value="ppe" className="py-2">KKD'ler</TabsTrigger>
        </TabsList>
        
        <TabsContent value="events">
          <EventsTab />
        </TabsContent>
        <TabsContent value="categories">
          <CategoriesTab />
        </TabsContent>
        <TabsContent value="units">
          <UnitsTab />
        </TabsContent>
        <TabsContent value="ghs">
          <ImageItemsTab type="adr-labels" title="GHS Tehlike Etiketleri" queryKey="hazmat-adr-labels" hasCode={true} />
        </TabsContent>
        <TabsContent value="adr">
          <ImageItemsTab type="hazard-labels" title="ADR Tehlike Etiketleri" queryKey="hazmat-hazard-labels" hasCode={true} />
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

function ImageItemsTab({ type, title, queryKey, hasCode }: { type: string, title: string, queryKey: string, hasCode: boolean }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
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
    mutationFn: async () => {
      if (editingId) {
        return await api.put(`/hazmat/settings/${type}/${editingId}`, { code, name, imageUrl });
      } else {
        return await api.post(`/hazmat/settings/${type}`, { code, name, imageUrl });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      setCode(''); setName(''); setImageUrl(''); setEditingId(null);
      toast.success(editingId ? 'Başarıyla güncellendi.' : 'Başarıyla eklendi.');
    }
  });

  const handleEditClick = (item: any) => {
    setEditingId(item.id);
    setCode(item.code || '');
    setName(item.name || '');
    setImageUrl(item.imageUrl || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setCode('');
    setName('');
    setImageUrl('');
  };

  const deleteItem = useMutation({
    mutationFn: async (id: string) => await api.delete(`/hazmat/settings/${type}/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] })
  });

  return (
    <div className="bg-card border rounded-lg p-6 mt-4">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      
      <div className="flex flex-col gap-4 mb-6 bg-muted/10 p-5 rounded-xl border border-border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {hasCode && (
            <div className="space-y-1.5 md:col-span-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kod</Label>
              <Input placeholder="Örn: GHS01" value={code} onChange={e => setCode(e.target.value)} className="bg-background" />
            </div>
          )}
          <div className={`space-y-1.5 ${hasCode ? 'md:col-span-5' : 'md:col-span-8'}`}>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Adı / Açıklama</Label>
            <Input placeholder="Örn: Patlayıcı Madde" value={name} onChange={e => setName(e.target.value)} className="bg-background" />
          </div>
          <div className="space-y-1.5 md:col-span-4">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Görsel (İsteğe Bağlı)</Label>
            <div className="flex gap-3 items-center">
              {imageUrl && (
                <div className="w-10 h-10 shrink-0 bg-white border rounded-md flex items-center justify-center p-1 shadow-sm">
                  <img src={imageUrl} alt="preview" className="w-full h-full object-contain" />
                </div>
              )}
              <div className="flex-1">
                <Button variant="outline" type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-full bg-background hover:bg-muted/50">
                  <Upload className="w-4 h-4 mr-2 text-muted-foreground" />
                  {isUploading ? 'Yükleniyor...' : (imageUrl ? 'Değiştir' : 'Görsel Seç')}
                </Button>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-2 border-t pt-4">
          {editingId && (
            <Button variant="outline" onClick={handleCancelEdit} className="px-6">
              İptal
            </Button>
          )}
          <Button onClick={() => createItem.mutate()} disabled={!name || (hasCode && !code)} className="px-6 shadow-sm">
            {editingId ? <Check className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {editingId ? 'Değişiklikleri Kaydet' : 'Yeni Ekle'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.map((item: any) => (
          <div key={item.id} className="border rounded-lg p-4 flex flex-col items-center justify-between text-center relative group">
            <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button 
                variant="secondary" 
                size="icon" 
                className="w-6 h-6 rounded-full shadow-sm"
                onClick={() => handleEditClick(item)}
              >
                <Pencil className="w-3 h-3 text-blue-600" />
              </Button>
              <Button 
                variant="destructive" 
                size="icon" 
                className="w-6 h-6 rounded-full shadow-sm"
                onClick={() => deleteItem.mutate(item.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
            
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

function EventsTab() {
  const [name, setName] = useState('');
  const queryClient = useQueryClient();

  const { data: types = [], isLoading } = useQuery({
    queryKey: ['hazmat-incident-types'],
    queryFn: async () => {
      const res = await api.get('/hazmat/settings/incident-types');
      if (!res.ok) throw new Error('Hata');
      return res.json();
    }
  });

  const createType = useMutation({
    mutationFn: async () => {
      const res = await api.post('/hazmat/settings/incident-types', { name });
      if (!res.ok) throw new Error('Hata');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hazmat-incident-types'] });
      setName('');
      toast.success('Olay Türü eklendi');
    }
  });

  const deleteType = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/hazmat/settings/incident-types/${id}`);
      if (!res.ok) throw new Error('Hata');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hazmat-incident-types'] });
      toast.success('Olay Türü silindi');
    }
  });

  return (
    <div className="space-y-6">
      <div className="bg-muted/30 p-4 rounded-lg border flex gap-4 items-end">
        <div className="space-y-2 flex-1 max-w-sm">
          <Label>Olay Türü Adı</Label>
          <Input placeholder="Örn: Kimyasal dökülme" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <Button onClick={() => createType.mutate()} disabled={!name}>
          <Plus className="w-4 h-4 mr-2" /> Ekle
        </Button>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Olay Türü</th>
              <th className="px-4 py-3 font-medium text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {types.map((t: any) => (
              <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{t.name}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => deleteType.mutate(t.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {types.length === 0 && !isLoading && (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">Henüz olay türü eklenmemiş.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import {
  Upload,
  Trash2,
  Plus,
  Pencil,
  Check,
  FolderTree,
  AlertTriangle,
  Truck,
  Shield,
  Scale,
  AlertCircle,
  Search,
  X,
  FileText,
  Tag
} from 'lucide-react';

export default function HazmatSettingsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab based on URL path
  const getTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/categories')) return 'categories';
    if (path.includes('/units')) return 'units';
    if (path.includes('/ghs')) return 'ghs';
    if (path.includes('/adr')) return 'adr';
    if (path.includes('/ppe')) return 'ppe';
    if (path.includes('/root-causes')) return 'root-causes';
    if (path.includes('/events')) return 'events';
    return 'categories';
  };

  const [activeTab, setActiveTab] = useState(getTabFromPath());

  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'categories') navigate('/hazmat/settings/categories');
    else if (value === 'units') navigate('/hazmat/settings/units');
    else if (value === 'ghs') navigate('/hazmat/settings/ghs');
    else if (value === 'adr') navigate('/hazmat/settings/adr');
    else if (value === 'ppe') navigate('/hazmat/settings/ppe');
    else if (value === 'events') navigate('/hazmat/settings/events');
    else if (value === 'root-causes') navigate('/hazmat/settings/root-causes');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-8 font-sans antialiased">
      {/* Header - Compact */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/80 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Tehlikeli Madde Ayarları
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kategoriler, miktar birimleri, tehlike piktogramları ve olay tanımlamaları.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-3.5">
        <TabsList className="bg-muted/60 p-0.5 border border-border/60 rounded-lg h-9 w-full sm:w-auto inline-flex overflow-x-auto">
          <TabsTrigger value="categories" className="gap-1.5 text-xs font-semibold py-1 px-3 rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">
            <FolderTree className="w-3.5 h-3.5 text-primary" />
            Kategoriler
          </TabsTrigger>
          <TabsTrigger value="ghs" className="gap-1.5 text-xs font-semibold py-1 px-3 rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            GHS Etiketleri
          </TabsTrigger>
          <TabsTrigger value="adr" className="gap-1.5 text-xs font-semibold py-1 px-3 rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">
            <Truck className="w-3.5 h-3.5 text-amber-500" />
            ADR Sınıfları
          </TabsTrigger>
          <TabsTrigger value="ppe" className="gap-1.5 text-xs font-semibold py-1 px-3 rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">
            <Shield className="w-3.5 h-3.5 text-blue-500" />
            KKD'ler
          </TabsTrigger>
          <TabsTrigger value="units" className="gap-1.5 text-xs font-semibold py-1 px-3 rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">
            <Scale className="w-3.5 h-3.5 text-emerald-500" />
            Miktar Cinsleri
          </TabsTrigger>
          <TabsTrigger value="events" className="gap-1.5 text-xs font-semibold py-1 px-3 rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            Olay Türleri
          </TabsTrigger>
          <TabsTrigger value="root-causes" className="gap-1.5 text-xs font-semibold py-1 px-3 rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">
            <Tag className="w-3.5 h-3.5 text-orange-500" />
            Kök Nedenler
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="mt-0">
          <CategoriesTab />
        </TabsContent>
        <TabsContent value="ghs" className="mt-0">
          <ImageItemsTab type="adr-labels" title="GHS Tehlike Etiketleri" queryKey="hazmat-adr-labels" hasCode={true} />
        </TabsContent>
        <TabsContent value="adr" className="mt-0">
          <ImageItemsTab type="hazard-labels" title="ADR Tehlike Etiketleri" queryKey="hazmat-hazard-labels" hasCode={true} />
        </TabsContent>
        <TabsContent value="ppe" className="mt-0">
          <ImageItemsTab type="ppes" title="Kişisel Koruyucu Donanımlar (KKD)" queryKey="hazmat-ppes" hasCode={false} />
        </TabsContent>
        <TabsContent value="units" className="mt-0">
          <UnitsTab />
        </TabsContent>
        <TabsContent value="events" className="mt-0">
          <EventsTab />
        </TabsContent>
        <TabsContent value="root-causes" className="mt-0">
          <RootCausesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// KATEGORİLER SEKMESİ (Tasarım Sistemine Tam Uyumlu)
// ─────────────────────────────────────────────────────────────
function CategoriesTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formScope, setFormScope] = useState('');
  const [formExamples, setFormExamples] = useState('');

  // Delete modal state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['hazmat-categories'],
    queryFn: async () => {
      const res = await api.get('/hazmat/settings/categories');
      if (!res.ok) throw new Error('Kategoriler yüklenemedi');
      return res.json();
    }
  });

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase().trim();
    return categories.filter((c: any) =>
      c.name?.toLowerCase().includes(q) ||
      c.scope?.toLowerCase().includes(q) ||
      c.examples?.toLowerCase().includes(q)
    );
  }, [categories, search]);

  const openAddModal = () => {
    setEditingCategory(null);
    setFormName('');
    setFormScope('');
    setFormExamples('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: any) => {
    setEditingCategory(cat);
    setFormName(cat.name || '');
    setFormScope(cat.scope || '');
    setFormExamples(cat.examples || '');
    setIsModalOpen(true);
  };

  // Create / Update mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!formName.trim()) throw new Error('Kategori adı zorunludur');
      if (editingCategory) {
        const res = await api.put(`/hazmat/settings/categories/${editingCategory.id}`, {
          name: formName.trim(),
          scope: formScope.trim() || null,
          examples: formExamples.trim() || null
        });
        if (!res.ok) throw new Error('Kategori güncellenemedi');
        return res.json();
      } else {
        const res = await api.post('/hazmat/settings/categories', {
          name: formName.trim(),
          scope: formScope.trim() || null,
          examples: formExamples.trim() || null
        });
        if (!res.ok) throw new Error('Kategori eklenemedi');
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hazmat-categories'] });
      setIsModalOpen(false);
      toast.success(editingCategory ? 'Kategori başarıyla güncellendi.' : 'Yeni kategori eklendi.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'İşlem sırasında bir hata oluştu.');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/hazmat/settings/categories/${id}`);
      if (!res.ok) throw new Error('Kategori silinemedi');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hazmat-categories'] });
      setDeletingId(null);
      toast.success('Kategori silindi.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Silinirken bir hata oluştu.');
    }
  });

  return (
    <div className="space-y-3.5">
      {/* Control Card - Compact */}
      <Card className="border border-border/70 shadow-2xs rounded-lg overflow-hidden">
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Kategori adı, kapsam veya örnek ara..."
                className="pl-8 h-8 text-xs bg-background"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5 h-7">
                {filteredCategories.length} / {categories.length} Kategori
              </Badge>
              <Button
                onClick={openAddModal}
                className="h-8 gap-1.5 text-xs font-semibold shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Yeni Kategori Ekle
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Card - Compact & Clean */}
      <Card className="border border-border/70 shadow-2xs rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 border-b border-border/60 text-muted-foreground">
              <tr>
                <th className="px-3.5 py-2.5 font-semibold text-[11px] uppercase tracking-wider w-[260px]">
                  Kategori Adı
                </th>
                <th className="px-3.5 py-2.5 font-semibold text-[11px] uppercase tracking-wider">
                  Kapsam
                </th>
                <th className="px-3.5 py-2.5 font-semibold text-[11px] uppercase tracking-wider">
                  Örnekler
                </th>
                <th className="px-3.5 py-2.5 font-semibold text-[11px] uppercase tracking-wider text-right w-[100px]">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredCategories.map((c: any) => (
                <tr key={c.id} className="hover:bg-muted/20 transition-colors group">
                  <td className="px-3.5 py-2.5 font-semibold text-foreground">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <FolderTree className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-3.5 py-2.5 text-muted-foreground leading-relaxed">
                    {c.scope || <span className="italic text-muted-foreground/60">-</span>}
                  </td>
                  <td className="px-3.5 py-2.5 text-muted-foreground leading-relaxed">
                    {c.examples ? (
                      <div className="flex flex-wrap gap-1">
                        {c.examples.split(',').map((ex: string, idx: number) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 h-4.5 font-normal bg-muted/60"
                          >
                            {ex.trim()}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="italic text-muted-foreground/60">-</span>
                    )}
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(c)}
                        className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                        title="Düzenle"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingId(c.id)}
                        className="h-7 w-7 rounded-md text-destructive hover:bg-destructive/10"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredCategories.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    <FolderTree className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-xs font-medium">
                      {search ? 'Aramanıza uygun kategori bulunamadı.' : 'Henüz kategori tanımlanmamış.'}
                    </p>
                    {search && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSearch('')}
                        className="mt-2 text-xs h-7"
                      >
                        Aramayı Temizle
                      </Button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Category Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md sm:rounded-xl p-5">
          <DialogHeader className="space-y-1 pb-2 border-b">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-primary" />
              {editingCategory ? 'Kategoriyi Düzenle' : 'Yeni Kategori Ekle'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Tehlikeli maddelerin sınıflandırılmasında kullanılacak kategori bilgilerini giriniz.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground">
                Kategori Adı <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Örn: Laboratuvar Kimyasalları"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="h-8 text-xs bg-background"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground">Kapsam Açıklaması</Label>
              <Textarea
                placeholder="Örn: Laboratuvar analizlerinde ve test kitlerinde kullanılan solüsyonlar..."
                value={formScope}
                onChange={(e) => setFormScope(e.target.value)}
                className="text-xs bg-background min-h-[60px] resize-none"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground">Örnek Maddeler (Virgülle ayırın)</Label>
              <Input
                placeholder="Örn: Biyokimya kitleri, Reaktifler, Boyalar"
                value={formExamples}
                onChange={(e) => setFormExamples(e.target.value)}
                className="h-8 text-xs bg-background"
              />
            </div>
          </div>

          <DialogFooter className="pt-2 border-t flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="text-xs h-8"
            >
              İptal
            </Button>
            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={!formName.trim() || saveMutation.isPending}
              className="text-xs h-8 gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              {saveMutation.isPending ? 'Kaydediliyor...' : (editingCategory ? 'Güncelle' : 'Kaydet')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <DialogContent className="max-w-sm sm:rounded-xl p-5">
          <DialogHeader className="space-y-1 pb-2">
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Kategoriyi Sil
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Bu kategoriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingId(null)}
              className="text-xs h-8"
            >
              Vazgeç
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
              disabled={deleteMutation.isPending}
              className="text-xs h-8"
            >
              {deleteMutation.isPending ? 'Siliniyor...' : 'Evet, Sil'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MİKTAR CİNSLERİ (BİRİMLER) - Kompakt
// ─────────────────────────────────────────────────────────────
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
      setName('');
      setSymbol('');
      toast.success('Birim eklendi.');
    }
  });

  const deleteUnit = useMutation({
    mutationFn: async (id: string) => await api.delete(`/hazmat/settings/units/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hazmat-units'] });
      toast.success('Birim silindi.');
    }
  });

  return (
    <Card className="border border-border/70 shadow-2xs rounded-lg overflow-hidden">
      <CardHeader className="p-3 px-4 border-b border-border/60 bg-muted/15">
        <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
          <Scale className="w-3.5 h-3.5 text-primary" />
          Miktar Cinsleri (Birimler)
        </CardTitle>
        <CardDescription className="text-[11px] text-muted-foreground mt-0.5">
          Tehlikeli maddelerin envanter miktarlarında kullanılacak birimler (kg, Litre, Varil vb.).
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 px-4 space-y-3">
        {/* Add Form */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Birim Adı (Örn: Kilogram)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 text-xs bg-background flex-1"
          />
          <Input
            placeholder="Sembol (Örn: kg)"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="h-8 text-xs bg-background w-full sm:w-28"
          />
          <Button
            size="sm"
            onClick={() => createUnit.mutate()}
            disabled={!name.trim() || !symbol.trim()}
            className="h-8 text-xs gap-1 font-semibold"
          >
            <Plus className="w-3.5 h-3.5" /> Ekle
          </Button>
        </div>

        {/* Units Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1">
          {units.map((u: any) => (
            <div
              key={u.id}
              className="border border-border/70 p-2.5 rounded-lg flex items-center justify-between bg-card hover:bg-muted/30 transition-colors shadow-2xs"
            >
              <div>
                <div className="font-semibold text-xs text-foreground">{u.name}</div>
                <div className="text-[10px] text-muted-foreground font-mono">{u.symbol}</div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteUnit.mutate(u.id)}
                className="text-destructive hover:bg-destructive/10 h-6 w-6 rounded-md"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// RESİMLİ ETİKETLER (GHS, ADR, KKD) - Kompakt
// ─────────────────────────────────────────────────────────────
function ImageItemsTab({
  type,
  title,
  queryKey,
  hasCode
}: {
  type: string;
  title: string;
  queryKey: string;
  hasCode: boolean;
}) {
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

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      const res = await api.post('/hazmat/upload', formData);
      if (!res.ok) throw new Error('Görsel yüklenemedi');
      const data = await res.json();
      setImageUrl(data.url);
      toast.success('Görsel başarıyla yüklendi.');
    } catch (err: any) {
      toast.error(err.message || 'Yükleme başarısız');
    } finally {
      setIsUploading(false);
    }
  };

  const createItem = useMutation({
    mutationFn: async () => {
      if (editingId) {
        const payload: any = { name, imageUrl };
        if (hasCode) payload.code = code;
        const res = await api.put(`/hazmat/settings/${type}/${editingId}`, payload);
        if (!res.ok) throw new Error('Güncellenemedi');
        return res.json();
      } else {
        const payload: any = { name, imageUrl };
        if (hasCode) payload.code = code;
        const res = await api.post(`/hazmat/settings/${type}`, payload);
        if (!res.ok) throw new Error('Eklenemedi');
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      handleCancelEdit();
      toast.success(editingId ? 'Güncellendi.' : 'Yeni kayıt eklendi.');
    }
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/hazmat/settings/${type}/${id}`);
      if (!res.ok) throw new Error('Silinemedi');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success('Kayıt silindi.');
    }
  });

  const handleEditClick = (item: any) => {
    setEditingId(item.id);
    setName(item.name || '');
    setCode(item.code || '');
    setImageUrl(item.imageUrl || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setCode('');
    setImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-3.5">
      {/* Edit / Add Card - Compact */}
      <Card className="border border-border/70 shadow-2xs rounded-lg overflow-hidden">
        <CardHeader className="p-3 px-4 border-b border-border/60 bg-muted/15">
          <CardTitle className="text-xs sm:text-sm font-bold flex items-center justify-between">
            <span>{editingId ? `${title} Düzenle` : `Yeni ${title} Ekle`}</span>
            {editingId && (
              <Badge variant="outline" className="text-[10px] text-blue-600 font-semibold">
                Düzenleme Modu
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
            {hasCode && (
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-muted-foreground">Etiket Kodu</Label>
                <Input
                  placeholder="Örn: GHS02, Sınıf 3"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
              </div>
            )}
            <div className={`space-y-1 ${hasCode ? '' : 'sm:col-span-2'}`}>
              <Label className="text-[11px] font-semibold text-muted-foreground">Tanım / Ad</Label>
              <Input
                placeholder="Örn: Alevlenir Sıvı, Koruyucu Gözlük"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8 text-xs bg-background"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-muted-foreground">Piktogram Görseli</Label>
              <div className="flex items-center gap-2">
                {imageUrl && (
                  <div className="w-8 h-8 rounded border bg-white p-0.5 shrink-0 shadow-2xs">
                    <img src={imageUrl} alt="preview" className="w-full h-full object-contain" />
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex-1 h-8 text-xs font-semibold gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5 text-muted-foreground" />
                  {isUploading ? 'Yükleniyor...' : (imageUrl ? 'Değiştir' : 'Görsel Seç')}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-3 pt-2.5 border-t border-border/50">
            {editingId && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
                className="h-7 text-xs"
              >
                İptal
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => createItem.mutate()}
              disabled={!name.trim() || (hasCode && !code.trim())}
              className="h-7 text-xs font-semibold gap-1"
            >
              <Check className="w-3 h-3" />
              {editingId ? 'Değişiklikleri Kaydet' : 'Listeye Ekle'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid of items - Compact & Clean Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-2.5">
        {items.map((item: any) => (
          <div
            key={item.id}
            className="border border-border/70 rounded-lg p-2.5 flex flex-col items-center justify-between text-center relative group bg-card hover:bg-muted/20 transition-all shadow-2xs"
          >
            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="secondary"
                size="icon"
                className="w-5 h-5 rounded-md shadow-2xs"
                onClick={() => handleEditClick(item)}
              >
                <Pencil className="w-2.5 h-2.5 text-primary" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                className="w-5 h-5 rounded-md shadow-2xs"
                onClick={() => deleteItem.mutate(item.id)}
              >
                <Trash2 className="w-2.5 h-2.5" />
              </Button>
            </div>

            <div className="w-12 h-12 flex items-center justify-center mb-1.5 p-1 bg-white rounded-md border border-border/50">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="max-w-full max-h-full object-contain" />
              ) : (
                <span className="text-[9px] text-muted-foreground">Yok</span>
              )}
            </div>

            {hasCode && (
              <span className="text-[9px] font-bold text-muted-foreground uppercase mb-0.5">
                {item.code}
              </span>
            )}
            <span className="text-[11px] font-semibold leading-tight text-foreground line-clamp-2">
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// OLAY TÜRLERİ (Olay Kategorileri - EDIT / NEW / DELETE)
// ─────────────────────────────────────────────────────────────
function EventsTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: string; name: string; description: string } | null>(null);

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');

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
      const res = await api.post('/hazmat/settings/incident-types', { 
        name: formName.trim(), 
        description: formDescription.trim() || null 
      });
      if (!res.ok) throw new Error('Hata');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hazmat-incident-types'] });
      setFormName('');
      setFormDescription('');
      setIsAddOpen(false);
      toast.success('Olay Türü başarıyla eklendi.');
    },
    onError: () => toast.error('Olay Türü eklenemedi.')
  });

  const updateType = useMutation({
    mutationFn: async () => {
      if (!editingItem) return;
      const res = await api.put(`/hazmat/settings/incident-types/${editingItem.id}`, { 
        name: formName.trim(), 
        description: formDescription.trim() || null 
      });
      if (!res.ok) throw new Error('Hata');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hazmat-incident-types'] });
      setEditingItem(null);
      setFormName('');
      setFormDescription('');
      toast.success('Olay Türü güncellendi.');
    },
    onError: () => toast.error('Olay Türü güncellenemedi.')
  });

  const deleteType = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/hazmat/settings/incident-types/${id}`);
      if (!res.ok) throw new Error('Hata');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hazmat-incident-types'] });
      toast.success('Olay Türü silindi.');
    },
    onError: () => toast.error('Olay Türü silinemedi.')
  });

  const filteredTypes = useMemo(() => {
    if (!searchTerm.trim()) return types;
    const q = searchTerm.toLowerCase();
    return types.filter((t: any) => 
      (t.name || '').toLowerCase().includes(q) || 
      (t.description || '').toLowerCase().includes(q)
    );
  }, [types, searchTerm]);

  return (
    <Card className="border border-border/70 shadow-2xs rounded-lg overflow-hidden">
      <CardHeader className="p-3 px-4 border-b border-border/60 bg-muted/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            Olağan Dışı Olay Kategorileri
          </CardTitle>
          <CardDescription className="text-[11px] text-muted-foreground mt-0.5">
            Tehlikeli madde sızıntı, dökülme ve maruziyet olaylarında seçilecek kategoriler ve açıklamaları ({types.length} Tanımlı).
          </CardDescription>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setFormName('');
            setFormDescription('');
            setIsAddOpen(true);
          }}
          className="h-8 text-xs gap-1.5 font-semibold shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Yeni Olay Türü Ekle
        </Button>
      </CardHeader>

      <CardContent className="p-3 px-4 space-y-3">
        {/* Arama */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Olay türü adı veya kapsam ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-xs bg-background"
          />
        </div>

        {/* Liste Izgarası */}
        {isLoading ? (
          <div className="p-6 text-center text-xs text-muted-foreground">Yükleniyor...</div>
        ) : filteredTypes.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">Kayıt bulunamadı.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
            {filteredTypes.map((t: any) => (
              <div
                key={t.id}
                className="border border-border/70 p-3 rounded-lg flex items-start justify-between gap-2 bg-card hover:bg-muted/20 transition-colors shadow-2xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">{t.name}</span>
                  </div>
                  {t.description && (
                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                      {t.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0 pt-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingItem(t);
                      setFormName(t.name || '');
                      setFormDescription(t.description || '');
                    }}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                    title="Düzenle"
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (window.confirm(`${t.name} kategorisini silmek istediğinize emin misiniz?`)) {
                        deleteType.mutate(t.id);
                      }
                    }}
                    className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-md"
                    title="Sil"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* YENİ EKLEME DİYALOĞU */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              Yeni Olay Türü Tanımla
            </DialogTitle>
            <DialogDescription className="text-xs">
              Olay bildirimlerinde seçilebilecek yeni bir olağan dışı olay türü ekleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Olay Türü Adı *</Label>
              <Input
                placeholder="Örn: Sızıntı, Dökülme, Yangın..."
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Tanım / Kapsam Açıklaması</Label>
              <Textarea
                placeholder="Maddenin kap veya borudan kontrolsüz çıkması..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
                className="text-xs resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setIsAddOpen(false)} className="text-xs h-8">
              İptal
            </Button>
            <Button 
              size="sm" 
              onClick={() => createType.mutate()} 
              disabled={!formName.trim() || createType.isPending}
              className="text-xs h-8 font-semibold"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DÜZENLEME DİYALOĞU */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Pencil className="w-4 h-4 text-primary" />
              Olay Türünü Düzenle
            </DialogTitle>
            <DialogDescription className="text-xs">
              Mevcut olay türü adı ve kapsam açıklamasını güncelleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Olay Türü Adı *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Tanım / Kapsam Açıklaması</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
                className="text-xs resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setEditingItem(null)} className="text-xs h-8">
              İptal
            </Button>
            <Button 
              size="sm" 
              onClick={() => updateType.mutate()} 
              disabled={!formName.trim() || updateType.isPending}
              className="text-xs h-8 font-semibold"
            >
              Değişiklikleri Güncelle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// KÖK NEDENLER (Kök Neden Seçenekleri - EDIT / NEW / DELETE)
// ─────────────────────────────────────────────────────────────
function RootCausesTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: string; name: string; description: string } | null>(null);

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const queryClient = useQueryClient();

  const { data: causes = [], isLoading } = useQuery({
    queryKey: ['hazmat-root-causes'],
    queryFn: async () => {
      const res = await api.get('/hazmat/settings/root-causes');
      if (!res.ok) throw new Error('Hata');
      return res.json();
    }
  });

  const createCause = useMutation({
    mutationFn: async () => {
      const res = await api.post('/hazmat/settings/root-causes', { 
        name: formName.trim(), 
        description: formDescription.trim() || null 
      });
      if (!res.ok) throw new Error('Hata');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hazmat-root-causes'] });
      setFormName('');
      setFormDescription('');
      setIsAddOpen(false);
      toast.success('Kök Neden başarıyla eklendi.');
    },
    onError: () => toast.error('Kök Neden eklenemedi.')
  });

  const updateCause = useMutation({
    mutationFn: async () => {
      if (!editingItem) return;
      const res = await api.put(`/hazmat/settings/root-causes/${editingItem.id}`, { 
        name: formName.trim(), 
        description: formDescription.trim() || null 
      });
      if (!res.ok) throw new Error('Hata');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hazmat-root-causes'] });
      setEditingItem(null);
      setFormName('');
      setFormDescription('');
      toast.success('Kök Neden güncellendi.');
    },
    onError: () => toast.error('Kök Neden güncellenemedi.')
  });

  const deleteCause = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/hazmat/settings/root-causes/${id}`);
      if (!res.ok) throw new Error('Hata');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hazmat-root-causes'] });
      toast.success('Kök Neden silindi.');
    },
    onError: () => toast.error('Kök Neden silinemedi.')
  });

  const filteredCauses = useMemo(() => {
    if (!searchTerm.trim()) return causes;
    const q = searchTerm.toLowerCase();
    return causes.filter((c: any) => 
      (c.name || '').toLowerCase().includes(q) || 
      (c.description || '').toLowerCase().includes(q)
    );
  }, [causes, searchTerm]);

  return (
    <Card className="border border-border/70 shadow-2xs rounded-lg overflow-hidden">
      <CardHeader className="p-3 px-4 border-b border-border/60 bg-muted/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-orange-500" />
            Olağan Dışı Olay Kök Nedenleri
          </CardTitle>
          <CardDescription className="text-[11px] text-muted-foreground mt-0.5">
            Olay bildirimlerinde seçilecek standart kök neden sınıfları ve kapsam tanımları ({causes.length} Tanımlı).
          </CardDescription>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setFormName('');
            setFormDescription('');
            setIsAddOpen(true);
          }}
          className="h-8 text-xs gap-1.5 font-semibold shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Yeni Kök Neden Ekle
        </Button>
      </CardHeader>

      <CardContent className="p-3 px-4 space-y-3">
        {/* Arama */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Kök neden adı veya açıklama ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-xs bg-background"
          />
        </div>

        {/* Liste Izgarası */}
        {isLoading ? (
          <div className="p-6 text-center text-xs text-muted-foreground">Yükleniyor...</div>
        ) : filteredCauses.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">Kayıt bulunamadı.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
            {filteredCauses.map((c: any) => (
              <div
                key={c.id}
                className="border border-border/70 p-3 rounded-lg flex items-start justify-between gap-2 bg-card hover:bg-muted/20 transition-colors shadow-2xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">{c.name}</span>
                  </div>
                  {c.description && (
                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                      {c.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0 pt-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingItem(c);
                      setFormName(c.name || '');
                      setFormDescription(c.description || '');
                    }}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                    title="Düzenle"
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (window.confirm(`${c.name} kök nedenini silmek istediğinize emin misiniz?`)) {
                        deleteCause.mutate(c.id);
                      }
                    }}
                    className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-md"
                    title="Sil"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* YENİ EKLEME DİYALOĞU */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              Yeni Kök Neden Tanımla
            </DialogTitle>
            <DialogDescription className="text-xs">
              Olay bildirimlerinde seçilebilecek yeni bir kök neden sınıfı ekleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Kök Neden Adı *</Label>
              <Input
                placeholder="Örn: Ekipman / tesisat arızası, Hatalı işlem..."
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Örnek Kapsam / Açıklama</Label>
              <Textarea
                placeholder="Vana arızası, conta arızası, hortum hasarı..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
                className="text-xs resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setIsAddOpen(false)} className="text-xs h-8">
              İptal
            </Button>
            <Button 
              size="sm" 
              onClick={() => createCause.mutate()} 
              disabled={!formName.trim() || createCause.isPending}
              className="text-xs h-8 font-semibold"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DÜZENLEME DİYALOĞU */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Pencil className="w-4 h-4 text-primary" />
              Kök Nedeni Düzenle
            </DialogTitle>
            <DialogDescription className="text-xs">
              Mevcut kök neden adı ve kapsam açıklamasını güncelleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Kök Neden Adı *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Örnek Kapsam / Açıklama</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
                className="text-xs resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setEditingItem(null)} className="text-xs h-8">
              İptal
            </Button>
            <Button 
              size="sm" 
              onClick={() => updateCause.mutate()} 
              disabled={!formName.trim() || updateCause.isPending}
              className="text-xs h-8 font-semibold"
            >
              Değişiklikleri Güncelle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, PackageSearch, Search, LayoutGrid, List, Plus, MapPin, Edit2, Check, ChevronsUpDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { toast } from 'sonner';
import { cn } from "@/lib/utils";

export default function HazmatCleaningCartsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const activeFacilityId = localStorage.getItem('activeFacilityId');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Create / Edit state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCartId, setEditingCartId] = useState<number | null>(null);
  const [cartForm, setCartForm] = useState({ name: '', building: '', floor: '' });
  
  const [openLocCombo, setOpenLocCombo] = useState(false);

  const { data: carts = [], isLoading } = useQuery({
    queryKey: ['hazmat-cleaning-carts', activeFacilityId],
    queryFn: async () => {
      if (!activeFacilityId) return [];
      const res = await api.get(`/hazmat/inventory/departments?facilityId=${activeFacilityId}&isCleaningCart=true`);
      if (!res.ok) throw new Error('Hata');
      return res.json();
    },
    enabled: !!activeFacilityId
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['hazmat-departments-locations', activeFacilityId],
    queryFn: async () => {
      if (!activeFacilityId) return [];
      const res = await api.get(`/hazmat/inventory/departments?facilityId=${activeFacilityId}&isCleaningCart=false`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!activeFacilityId
  });

  const uniqueLocations = useMemo(() => {
    const locs: any[] = [];
    const seen = new Set<string>();
    locations.forEach((l: any) => {
      const b = l.building || '';
      const f = l.floor || '';
      if (!b) return;
      const key = `${b}|${f}`;
      if (!seen.has(key)) {
        seen.add(key);
        locs.push({ building: b, floor: f, label: `${b}${f ? ' / ' + f : ''}` });
      }
    });
    return locs.sort((a, b) => a.label.localeCompare(b.label));
  }, [locations]);

  const createCart = useMutation({
    mutationFn: async () => await api.post('/hazmat/settings/departments', { 
      facilityId: activeFacilityId, 
      name: cartForm.name,
      building: cartForm.building,
      floor: cartForm.floor,
      isCleaningCart: true
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hazmat-cleaning-carts', activeFacilityId] });
      setIsDialogOpen(false);
      toast.success('Temizlik Arabası başarıyla eklendi.');
    }
  });

  const updateCart = useMutation({
    mutationFn: async () => await api.put(`/hazmat/settings/departments/${editingCartId}`, { 
      name: cartForm.name,
      building: cartForm.building,
      floor: cartForm.floor,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hazmat-cleaning-carts', activeFacilityId] });
      setIsDialogOpen(false);
      toast.success('Temizlik Arabası başarıyla güncellendi.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => await api.delete(`/hazmat/settings/departments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hazmat-cleaning-carts', activeFacilityId] });
      toast.success('Temizlik Arabası silindi.');
    }
  });

  const handleSave = () => {
    if (editingCartId) {
      updateCart.mutate();
    } else {
      createCart.mutate();
    }
  };

  const openNewDialog = () => {
    setEditingCartId(null);
    setCartForm({ name: '', building: '', floor: '' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (cart: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCartId(cart.id);
    setCartForm({ name: cart.name || '', building: cart.building || '', floor: cart.floor || '' });
    setIsDialogOpen(true);
  };

  if (!activeFacilityId) {
    return <div className="p-8 text-center text-muted-foreground">Lütfen önce bir tesis seçin.</div>;
  }

  const filteredCarts = carts.filter((cart: any) => 
    cart.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    cart.building?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Temizlik Arabaları</h1>
          <p className="text-muted-foreground">
            Tesisteki temizlik arabalarını tanımlayın, konumlarını yönetin ve tehlikeli madde ataması yapın.
          </p>
        </div>
        <Button onClick={openNewDialog} className="shadow-md">
          <Plus className="w-4 h-4 mr-2" />
          Araba Ekle
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/20 p-4 rounded-lg border">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Araba adı veya blok ara..." 
            className="pl-9 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Toplam {filteredCarts.length} araba
          </div>
          <div className="flex bg-muted p-1 rounded-md">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-2"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'card' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-2"
              onClick={() => setViewMode('card')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>
      ) : carts.length === 0 ? (
        <div className="text-center p-12 bg-muted/20 border rounded-lg">
          <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Temizlik Arabası Bulunamadı</h3>
          <p className="text-muted-foreground mb-4">Bu tesise henüz hiçbir temizlik arabası eklenmemiş.</p>
          <Button onClick={openNewDialog}>İlk Arabayı Ekle</Button>
        </div>
      ) : filteredCarts.length === 0 ? (
        <div className="text-center p-12 bg-muted/20 border rounded-lg">
          <p className="text-muted-foreground">Aradığınız kritere uygun araba bulunamadı.</p>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCarts.map((cart: any) => (
            <Card 
              key={cart.id} 
              className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50 group"
              onClick={() => navigate(`/hazmat/departments/${cart.id}`)}
            >
              <CardHeader className="pb-3 relative">
                <CardTitle className="text-lg flex items-center gap-2 group-hover:text-primary transition-colors">
                  <ShoppingCart className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                  {cart.name || 'İsimsiz Araba'}
                </CardTitle>
                <CardDescription className="flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5" /> 
                  {cart.building ? `${cart.building} ${cart.floor ? '/ ' + cart.floor : ''}` : 'Lokasyon belirtilmemiş'}
                </CardDescription>
                <div className="absolute top-3 right-3 flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={(e) => { e.stopPropagation(); openEditDialog(cart, e); }}
                    title="Konumu veya Adı Düzenle"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-red-500"
                    onClick={(e) => { e.stopPropagation(); if(window.confirm('Silmek istediğinize emin misiniz?')) deleteMutation.mutate(cart.id); }}
                    title="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm pt-2 border-t">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <PackageSearch className="w-4 h-4" />
                    <span>Tehlikeli Madde Sayısı:</span>
                  </div>
                  <span className="font-semibold text-base">{cart._count?.inventory || 0}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="border rounded-lg bg-card overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 font-medium text-sm text-muted-foreground border-b bg-muted/30">
            <div className="col-span-4">Araba Adı</div>
            <div className="col-span-4">Lokasyon (Blok / Kat)</div>
            <div className="col-span-2 text-center">Envanter</div>
            <div className="col-span-2 text-right">İşlemler</div>
          </div>
          <div className="divide-y">
            {filteredCarts.map((cart: any) => (
              <div 
                key={cart.id} 
                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/10 cursor-pointer transition-colors"
                onClick={() => navigate(`/hazmat/departments/${cart.id}`)}
              >
                <div className="col-span-4 font-medium flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  {cart.name || 'İsimsiz Araba'}
                </div>
                <div className="col-span-4 text-muted-foreground text-sm flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {cart.building ? `${cart.building} ${cart.floor ? '/ ' + cart.floor : ''}` : '-'}
                </div>
                <div className="col-span-2 text-center flex items-center justify-center gap-2 text-muted-foreground">
                  <PackageSearch className="w-4 h-4" />
                  <span className="font-semibold text-foreground">{cart._count?.inventory || 0}</span>
                </div>
                <div className="col-span-2 text-right flex justify-end">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={(e) => openEditDialog(cart, e)}
                  >
                    Konum Değiştir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingCartId ? 'Temizlik Arabasını Güncelle' : 'Yeni Temizlik Arabası Ekle'}</DialogTitle>
            <DialogDescription>
              Arabanın adını ve bulunduğu güncel lokasyonu seçin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Araba Adı / No</Label>
              <Input 
                value={cartForm.name} 
                onChange={e => setCartForm({...cartForm, name: e.target.value})} 
                placeholder="Örn: Araba 01" 
              />
            </div>
            
            <div className="space-y-2 flex flex-col">
              <Label>Tesis Lokasyonu (Blok / Kat)</Label>
              <Popover open={openLocCombo} onOpenChange={setOpenLocCombo}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openLocCombo}
                    className="w-full justify-between"
                  >
                    {cartForm.building 
                      ? `${cartForm.building}${cartForm.floor ? ' / ' + cartForm.floor : ''}`
                      : "Lokasyon seçiniz..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[380px] p-0">
                  <Command>
                    <CommandInput placeholder="Lokasyon ara..." />
                    <CommandList>
                      <CommandEmpty>Konum bulunamadı.</CommandEmpty>
                      <CommandGroup>
                        {uniqueLocations.map((loc) => (
                          <CommandItem
                            key={loc.label}
                            value={loc.label}
                            onSelect={() => {
                              setCartForm({ ...cartForm, building: loc.building, floor: loc.floor });
                              setOpenLocCombo(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                cartForm.building === loc.building && cartForm.floor === loc.floor ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {loc.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground mt-1">Eğer listede bulunmuyorsa önce Ayarlar &gt; Bölüm-Departman ekranından eklemelisiniz.</p>
            </div>

            <Button 
              className="w-full mt-4" 
              onClick={handleSave} 
              disabled={!cartForm.name || createCart.isPending || updateCart.isPending}
            >
              {createCart.isPending || updateCart.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

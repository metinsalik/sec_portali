import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  Plus, Search, Briefcase, Edit, Loader2, Phone, Mail, 
  MapPin, User, LayoutGrid, List as ListIcon, 
  ChevronRight, Eye, MoreHorizontal, Globe, X, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { IL_ILCE_DATA, type City } from '@/data/turkiye';
import { toast } from 'sonner';

interface OSGBCompany {
  id: number;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  city?: string;
  district?: string;
  isActive: boolean;
}

const emptyForm = { 
  name: '', 
  contact: '', 
  phone: '', 
  email: '', 
  city: '' as City | '', 
  district: '' 
};

export default function OSGBPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── URL SEARCH PARAMS ─────────────────────────────────────────────────────
  const search = searchParams.get('q') || '';
  const viewMode = (searchParams.get('view') as 'grid' | 'list') || 'list';
  const selectedCity = searchParams.get('city') || 'all';

  const updateSearchParam = useCallback((key: string, value: string | null) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value && value !== '' && value !== 'all' && (key !== 'view' || value !== 'list')) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const setSearch = (val: string) => updateSearchParam('q', val);
  const setViewMode = (val: string) => updateSearchParam('view', val);
  const setSelectedCity = (val: string) => updateSearchParam('city', val);

  // ── SCROLL RESTORATION ────────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem('panel_osgb_scrollY', window.scrollY.toString());
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<OSGBCompany | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: companies = [], isLoading, refetch, isFetching } = useQuery<OSGBCompany[]>({
    queryKey: ['osgb'],
    queryFn: async () => {
      const res = await api.get('/panel/osgb');
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json();
    },
  });

  // Restore scroll
  useEffect(() => {
    if (!isLoading) {
      const savedY = sessionStorage.getItem('panel_osgb_scrollY');
      if (savedY) {
        const scrollY = parseInt(savedY, 10);
        if (!isNaN(scrollY) && scrollY > 0) {
          requestAnimationFrame(() => {
            window.scrollTo({ top: scrollY, behavior: 'instant' });
          });
        }
      }
    }
  }, [isLoading]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof emptyForm) => {
      const res = editItem
        ? await api.put(`/panel/osgb/${editItem.id}`, data)
        : await api.post('/panel/osgb', data);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['osgb'] });
      toast.success(editItem ? 'OSGB firması güncellendi.' : 'Yeni OSGB firması eklendi.');
      setModalOpen(false); setEditItem(null); setForm(emptyForm);
    },
    onError: (err: any) => toast.error(err.message || 'İşlem başarısız.')
  });

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (c: OSGBCompany) => {
    setEditItem(c);
    setForm({ 
      name: c.name, 
      contact: c.contact ?? '', 
      phone: c.phone ?? '', 
      email: c.email ?? '',
      city: (c.city as City) ?? '',
      district: c.district ?? ''
    });
    setModalOpen(true);
  };

  const handleCityChange = (city: string) => {
    setForm(prev => ({ ...prev, city: city as City, district: '' }));
  };

  const citiesInList = useMemo(() => {
    const set = new Set<string>();
    companies.forEach(c => { if (c.city) set.add(c.city); });
    return Array.from(set).sort();
  }, [companies]);

  const filtered = useMemo(() => {
    return companies.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                            (c.contact && c.contact.toLowerCase().includes(search.toLowerCase())) ||
                            (c.city && c.city.toLowerCase().includes(search.toLowerCase()));
      const matchesCity = selectedCity === 'all' || c.city === selectedCity;
      return matchesSearch && matchesCity;
    });
  }, [companies, search, selectedCity]);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              OSGB Firmaları
            </h1>
            <Badge variant="outline" className="h-6 px-2.5 text-xs font-semibold bg-primary/5 text-primary border-primary/20">
              {companies.length} Firma
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Hizmet alınan Ortak Sağlık ve Güvenlik Birimlerini ve sözleşme detaylarını yönetin.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border">
            <Button 
              variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
              size="sm" 
              className={cn("h-7 px-2.5 text-xs rounded-md", viewMode === 'list' && "bg-background shadow-xs font-semibold")}
              onClick={() => setViewMode('list')}
            >
              <ListIcon className="w-3.5 h-3.5 mr-1" /> Liste
            </Button>
            <Button 
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
              size="sm" 
              className={cn("h-7 px-2.5 text-xs rounded-md", viewMode === 'grid' && "bg-background shadow-xs font-semibold")}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="w-3.5 h-3.5 mr-1" /> Kart
            </Button>
          </div>

          <Button 
            size="sm" 
            onClick={openAdd} 
            className="h-9 px-3.5 rounded-lg text-xs font-semibold gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Yeni OSGB
          </Button>
        </div>
      </div>

      {/* ── FILTER BAR ────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card/80 backdrop-blur-md p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input 
              placeholder="Firma adı, yetkili veya şehir ile ara..." 
              className="pl-9 pr-8 h-9 text-sm rounded-lg bg-background/80 border-border focus-visible:ring-1" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                title="Temizle"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="min-w-[150px]">
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger size="sm" className="h-9 w-full rounded-lg bg-background/80 border-border text-xs font-medium">
                  <SelectValue placeholder="Şehir Filtresi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Şehirler</SelectItem>
                  {citiesInList.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {(search || selectedCity !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setSearch(''); setSelectedCity('all'); }}
                className="h-9 px-2.5 rounded-lg border-dashed text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <X className="w-3.5 h-3.5" /> Sıfırla
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-9 px-2 rounded-lg text-muted-foreground hover:text-foreground"
              title="Yenile"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-primary' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
          <span>Toplam <strong>{filtered.length}</strong> / {companies.length} OSGB listeleniyor</span>
        </div>
      </div>

      {/* ── CONTENT AREA ──────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="rounded-xl border-border/60 p-5 space-y-4">
              <div className="flex justify-between items-start">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-5 w-36 rounded-md" />
              <Skeleton className="h-3 w-48 rounded-md" />
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 rounded-xl border border-dashed border-border bg-card/40 space-y-2">
          <Briefcase className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <p className="font-semibold text-sm text-foreground">OSGB Firması Bulunamadı</p>
          <p className="text-xs text-muted-foreground">Filtre kriterlerine uygun OSGB kaydı bulunamadı.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Card key={c.id} className={cn(
              "rounded-xl border border-border bg-card shadow-xs hover:border-primary/50 transition-all duration-200 group flex flex-col justify-between",
              !c.isActive && 'opacity-60 grayscale'
            )}>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center border border-primary/20 group-hover:scale-105 transition-transform">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => navigate(`/panel/osgb/${c.id}`)} title="Yaşam Kartı">
                      <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => openEdit(c)} title="Düzenle">
                      <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 
                    className="font-bold text-sm text-foreground hover:text-primary transition-colors cursor-pointer line-clamp-1"
                    onClick={() => navigate(`/panel/osgb/${c.id}`)}
                  >
                    {c.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{c.city ? `${c.city}${c.district ? ` / ${c.district}` : ''}` : 'Konum Belirtilmedi'}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground pt-2 border-t border-border/40">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span>{c.contact || 'Yetkili Belirtilmedi'}</span>
                  </div>
                  {c.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>{c.phone}</span>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={() => navigate(`/panel/osgb/${c.id}`)}
                  variant="outline"
                  size="sm"
                  className="w-full h-8 rounded-lg text-xs font-semibold gap-1 hover:bg-primary hover:text-primary-foreground transition-all"
                >
                  Yaşam Kartını Aç <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-muted/40 border-b border-border/50">
                  <th className="px-5 py-3 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">OSGB Firması</th>
                  <th className="px-5 py-3 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Lokasyon</th>
                  <th className="px-5 py-3 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Yetkili / İletişim</th>
                  <th className="px-5 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((c) => (
                  <tr key={c.id} className={cn("hover:bg-muted/30 transition-colors group", !c.isActive && 'opacity-60')}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <span 
                          className="font-semibold text-foreground text-sm hover:text-primary cursor-pointer transition-colors" 
                          onClick={() => navigate(`/panel/osgb/${c.id}`)}
                        >
                          {c.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{c.city || '—'}</span>
                        <span className="text-[10px]">{c.district || ''}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5"><User className="w-3 h-3 opacity-60" /> {c.contact || '—'}</span>
                        {c.phone && <span className="flex items-center gap-1.5"><Phone className="w-3 h-3 opacity-60" /> {c.phone}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => navigate(`/panel/osgb/${c.id}`)} title="Yaşam Kartı">
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => openEdit(c)} title="Düzenle">
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ADD / EDIT DIALOG ─────────────────────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={(v) => { setModalOpen(v); if (!v) setEditItem(null); }}>
        <DialogContent className="sm:max-w-md rounded-xl border border-border bg-card p-0 overflow-hidden shadow-lg">
          <DialogHeader className="p-6 bg-muted/40 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
              <DialogTitle className="text-lg font-bold text-foreground">
                {editItem ? 'OSGB Bilgilerini Düzenle' : 'Yeni OSGB Tanımla'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Ortak Sağlık Güvenlik Birimi firma ve iletişim bilgilerini girin.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(ev) => { ev.preventDefault(); saveMutation.mutate(form); }} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Firma Adı *</label>
              <Input 
                value={form.name} 
                onChange={(ev) => setForm({ ...form, name: ev.target.value })} 
                className="h-9 rounded-lg"
                placeholder="Örn: Ege Güvenlik OSGB"
                required 
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">İl</label>
                <Select value={form.city} onValueChange={handleCityChange}>
                  <SelectTrigger className="h-9 rounded-lg text-xs font-medium"><SelectValue placeholder="İl Seçin" /></SelectTrigger>
                  <SelectContent className="max-h-[220px]">
                    {Object.keys(IL_ILCE_DATA).map((city) => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">İlçe</label>
                <Select 
                  value={form.district} 
                  onValueChange={(val) => setForm({ ...form, district: val })}
                  disabled={!form.city}
                >
                  <SelectTrigger className="h-9 rounded-lg text-xs font-medium"><SelectValue placeholder="İlçe Seçin" /></SelectTrigger>
                  <SelectContent className="max-h-[220px]">
                    {form.city && (IL_ILCE_DATA as any)[form.city]?.map((dist: string) => (
                      <SelectItem key={dist} value={dist}>{dist}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Yetkili Kişi</label>
              <Input 
                value={form.contact} 
                onChange={(ev) => setForm({ ...form, contact: ev.target.value })} 
                placeholder="Örn: Mehmet Özkan" 
                className="h-9 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Telefon</label>
                <Input 
                  value={form.phone} 
                  onChange={(ev) => setForm({ ...form, phone: ev.target.value })} 
                  placeholder="0212 XXX XX XX"
                  className="h-9 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">E-posta</label>
                <Input 
                  type="email" 
                  value={form.email} 
                  onChange={(ev) => setForm({ ...form, email: ev.target.value })} 
                  placeholder="info@osgb.com"
                  className="h-9 rounded-lg"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)} className="rounded-lg">
                Vazgeç
              </Button>
              <Button type="submit" size="sm" disabled={saveMutation.isPending} className="rounded-lg gap-1.5">
                {saveMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editItem ? 'Güncelle' : 'Kaydet'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, Search, UserCheck, Edit, Archive, Loader2, 
  Phone, Mail, AlertTriangle, LayoutGrid, List as ListIcon, 
  Building2, X, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Employer {
  id: number; 
  fullName: string; 
  title?: string; 
  phone?: string; 
  email?: string; 
  username?: string; 
  isActive: boolean;
  appointments?: { facility: { name: string } }[];
}

const emptyForm = { fullName: '', title: '', phone: '', email: '', username: '' };

export default function EmployersPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── URL SEARCH PARAMS ─────────────────────────────────────────────────────
  const search = searchParams.get('q') || '';
  const viewMode = (searchParams.get('view') as 'grid' | 'list') || 'list';

  const updateSearchParam = useCallback((key: string, value: string | null) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value && value !== '' && (key !== 'view' || value !== 'list')) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const setSearch = (val: string) => updateSearchParam('q', val);
  const setViewMode = (val: string) => updateSearchParam('view', val);

  // ── SCROLL RESTORATION ────────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem('panel_employers_scrollY', window.scrollY.toString());
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Employer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [archiveId, setArchiveId] = useState<number | null>(null);

  const { data: employers = [], isLoading, refetch, isFetching } = useQuery<Employer[]>({
    queryKey: ['employers'],
    queryFn: async () => {
      const res = await api.get('/panel/employers');
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json();
    },
  });

  // Restore scroll
  useEffect(() => {
    if (!isLoading) {
      const savedY = sessionStorage.getItem('panel_employers_scrollY');
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
        ? await api.put(`/panel/employers/${editItem.id}`, data)
        : await api.post('/panel/employers', data);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employers'] });
      toast.success(editItem ? 'İşveren vekili güncellendi.' : 'Yeni işveren vekili başarıyla eklendi.');
      setModalOpen(false); setEditItem(null); setForm(emptyForm);
    },
    onError: (err: any) => toast.error(err.message || 'İşlem başarısız.')
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/panel/employers/${id}/archive`, {});
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['employers'] }); 
      toast.success('İşveren vekili arşive alındı.');
      setArchiveId(null); 
    },
    onError: (err: any) => toast.error(err.message || 'Arşive alınamadı.')
  });

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (e: Employer) => {
    setEditItem(e);
    setForm({ 
      fullName: e.fullName, 
      title: e.title ?? '', 
      phone: e.phone ?? '', 
      email: e.email ?? '',
      username: e.username ?? ''
    });
    setModalOpen(true);
  };

  const filtered = useMemo(() => {
    return employers.filter((e) => {
      const term = search.toLowerCase();
      const facilityMatch = e.appointments?.some(a => a.facility?.name.toLowerCase().includes(term));
      return e.fullName.toLowerCase().includes(term) ||
             (e.title && e.title.toLowerCase().includes(term)) ||
             facilityMatch;
    });
  }, [employers, search]);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              İşveren Vekilleri
            </h1>
            <Badge variant="outline" className="h-6 px-2.5 text-xs font-semibold bg-primary/5 text-primary border-primary/20">
              {employers.length} Kayıtlı Vekil
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            İSG süreçlerinde işveren adına yetkilendirilmiş vekil ve temsilcileri yönetin.
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
            <Plus className="w-3.5 h-3.5" /> Yeni Vekil
          </Button>
        </div>
      </div>

      {/* ── FILTER BAR ────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card/80 backdrop-blur-md p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input 
              placeholder="Ad, unvan veya tesis adı ile ara..." 
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

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
          <span>Toplam <strong>{filtered.length}</strong> / {employers.length} vekil listeleniyor</span>
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
              <Skeleton className="h-3 w-44 rounded-md" />
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 rounded-xl border border-dashed border-border bg-card/40 space-y-2">
          <UserCheck className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <p className="font-semibold text-sm text-foreground">İşveren Vekili Bulunamadı</p>
          <p className="text-xs text-muted-foreground">Arama kriterlerine uygun vekil kaydı bulunamadı.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((e) => (
            <Card key={e.id} className={cn(
              "rounded-xl border border-border bg-card shadow-xs hover:border-primary/50 transition-all duration-200 group flex flex-col justify-between",
              !e.isActive && 'opacity-60 grayscale'
            )}>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center text-sm font-bold">
                    {e.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => openEdit(e)} title="Düzenle">
                      <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:text-destructive" onClick={() => setArchiveId(e.id)} title="Arşive Al">
                      <Archive className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-foreground line-clamp-1">{e.fullName}</h3>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">{e.title || 'Unvan Belirtilmedi'}</p>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground pt-2 border-t border-border/40">
                  {e.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>{e.phone}</span>
                    </div>
                  )}
                  {e.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{e.email}</span>
                    </div>
                  )}
                  {e.appointments && e.appointments.length > 0 && (
                    <div className="pt-1.5">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">Yetkili Tesisler</span>
                      <div className="flex flex-wrap gap-1">
                        {e.appointments.map((a, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] font-medium py-0 px-1.5">
                            {a.facility?.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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
                  <th className="px-5 py-3 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">İşveren Vekili</th>
                  <th className="px-5 py-3 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Unvan</th>
                  <th className="px-5 py-3 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">İletişim</th>
                  <th className="px-5 py-3 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Yetkili Olduğu Tesisler</th>
                  <th className="px-5 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((e) => (
                  <tr key={e.id} className={cn("hover:bg-muted/30 transition-colors group", !e.isActive && 'opacity-60')}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center text-xs font-bold shrink-0">
                          {e.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-foreground text-sm">{e.fullName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground font-medium">{e.title || '—'}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                        {e.phone && <span className="flex items-center gap-1.5"><Phone className="w-3 h-3 opacity-60" /> {e.phone}</span>}
                        {e.email && <span className="flex items-center gap-1.5 truncate"><Mail className="w-3 h-3 opacity-60" /> {e.email}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {e.appointments && e.appointments.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[280px]">
                          {e.appointments.map((a, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] py-0 px-1.5 font-medium">
                              {a.facility?.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => openEdit(e)} title="Düzenle">
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => setArchiveId(e.id)} title="Arşive Al">
                          <Archive className="w-3.5 h-3.5" />
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
                <UserCheck className="w-4 h-4" />
              </div>
              <DialogTitle className="text-lg font-bold text-foreground">
                {editItem ? 'Vekil Bilgilerini Düzenle' : 'Yeni İşveren Vekili Tanımla'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              İşveren temsilcisi yetki ve iletişim bilgilerini girin.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(ev) => { ev.preventDefault(); saveMutation.mutate(form); }} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Ad Soyad *</label>
              <Input 
                value={form.fullName} 
                onChange={(ev) => setForm({ ...form, fullName: ev.target.value })} 
                className="h-9 rounded-lg"
                placeholder="Örn: Metin Salik"
                required 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Unvan</label>
              <Input 
                value={form.title} 
                onChange={(ev) => setForm({ ...form, title: ev.target.value })} 
                placeholder="Örn: Genel Müdür Yardımcısı" 
                className="h-9 rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Telefon</label>
                <Input 
                  value={form.phone} 
                  onChange={(ev) => setForm({ ...form, phone: ev.target.value })} 
                  placeholder="05XX XXX XX XX"
                  className="h-9 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">E-posta</label>
                <Input 
                  type="email" 
                  value={form.email} 
                  onChange={(ev) => setForm({ ...form, email: ev.target.value })} 
                  placeholder="vekil@firma.com"
                  className="h-9 rounded-lg"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Kullanıcı Adı (İSG-KATİP)</label>
              <Input 
                value={form.username} 
                onChange={(ev) => setForm({ ...form, username: ev.target.value })} 
                placeholder="TC Kimlik No veya kullanıcı adı"
                className="h-9 rounded-lg"
              />
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

      {/* ── ARCHIVE CONFIRMATION DIALOG ──────────────────────────────────── */}
      <Dialog open={archiveId !== null} onOpenChange={(v) => !v && setArchiveId(null)}>
        <DialogContent className="sm:max-w-md rounded-xl border border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> İşveren Vekilini Arşive Al
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Bu vekil kaydı pasife alınacaktır. Devam etmek istiyor musunuz?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setArchiveId(null)} className="rounded-lg">
              İptal
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => archiveId && archiveMutation.mutate(archiveId)}
              disabled={archiveMutation.isPending}
              className="rounded-lg gap-1.5"
            >
              {archiveMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Arşive Al
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

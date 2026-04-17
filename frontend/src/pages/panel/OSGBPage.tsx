import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Search, Briefcase, Edit, Loader2, Phone, Mail, User } from 'lucide-react';

interface OSGBCompany {
  id: number; name: string; contact?: string; phone?: string; email?: string; isActive: boolean;
}

const emptyForm = { name: '', contact: '', phone: '', email: '' };

export default function OSGBPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<OSGBCompany | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: companies = [], isLoading } = useQuery<OSGBCompany[]>({
    queryKey: ['osgb'],
    queryFn: async () => {
      const res = await api.get('/panel/osgb');
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json();
    },
  });

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
      setModalOpen(false); setEditItem(null); setForm(emptyForm);
    },
  });

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (c: OSGBCompany) => {
    setEditItem(c);
    setForm({ name: c.name, contact: c.contact ?? '', phone: c.phone ?? '', email: c.email ?? '' });
    setModalOpen(true);
  };

  const filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.contact?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">OSGB Firmaları</h1>
          <p className="text-sm text-muted-foreground">{companies.length} firma</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" /> Yeni Firma
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Firma veya yetkili ara..." className="pl-9 bg-background" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-background rounded-xl border border-dashed">
          <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">OSGB firması bulunamadı.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 bg-secondary rounded flex items-center justify-center shrink-0">
                      <Briefcase className="w-5 h-5 text-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-base truncate">{c.name}</p>
                      <div className="flex flex-col gap-1 mt-1.5">
                        {c.contact && (
                          <span className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="w-3.5 h-3.5" /> {c.contact}
                          </span>
                        )}
                        {c.phone && (
                          <span className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-3.5 h-3.5" /> {c.phone}
                          </span>
                        )}
                        {c.email && (
                          <span className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="w-3.5 h-3.5" /> {c.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                    <Edit className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={(v) => { setModalOpen(v); if (!v) setEditItem(null); }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Firma Düzenle' : 'Yeni OSGB Firması'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Firma Adı *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Yetkili Kişi</label>
              <Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefon</label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">E-posta</label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            {saveMutation.isError && <p className="text-sm text-destructive font-medium">{(saveMutation.error as Error).message}</p>}
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Vazgeç</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Kaydet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

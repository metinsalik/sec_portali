import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Search, UserCheck, Edit, Archive, Loader2, Phone, Mail, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Employer {
  id: number; fullName: string; title?: string; phone?: string; email?: string; isActive: boolean;
}

const emptyForm = { fullName: '', title: '', phone: '', email: '' };

export default function EmployersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Employer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [archiveId, setArchiveId] = useState<number | null>(null);

  const { data: employers = [], isLoading } = useQuery<Employer[]>({
    queryKey: ['employers'],
    queryFn: async () => {
      const res = await api.get('/panel/employers');
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json();
    },
  });

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
      setModalOpen(false); setEditItem(null); setForm(emptyForm);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/panel/employers/${id}/archive`, {});
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['employers'] }); setArchiveId(null); },
  });

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (e: Employer) => {
    setEditItem(e);
    setForm({ fullName: e.fullName, title: e.title ?? '', phone: e.phone ?? '', email: e.email ?? '' });
    setModalOpen(true);
  };

  const filtered = employers.filter((e) =>
    e.fullName.toLowerCase().includes(search.toLowerCase()) ||
    e.title?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">İşveren Vekilleri</h1>
          <p className="text-sm text-muted-foreground">{employers.length} kişi</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" /> Yeni Vekil
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Ad veya unvan ara..." className="pl-9 bg-background" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-background rounded-xl border border-dashed">
          <UserCheck className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">İşveren vekili bulunamadı.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((e) => (
            <Card key={e.id} className={cn(!e.isActive && 'opacity-60')}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 bg-secondary rounded flex items-center justify-center shrink-0 text-sm font-semibold text-foreground">
                      {e.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground text-base truncate">{e.fullName}</p>
                      {e.title && <p className="text-sm text-muted-foreground truncate">{e.title}</p>}
                      <div className="flex flex-col gap-1 mt-1.5">
                        {e.phone && <span className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="w-3.5 h-3.5" />{e.phone}</span>}
                        {e.email && <span className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="w-3.5 h-3.5" />{e.email}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 flex-col md:flex-row border-l pl-3 ml-3 md:border-0 md:pl-0 md:ml-0">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(e)}>
                      <Edit className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setArchiveId(e.id)} className="hover:text-destructive">
                      <Archive className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={(v) => { setModalOpen(v); if (!v) setEditItem(null); }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>{editItem ? 'Vekil Düzenle' : 'Yeni İşveren Vekili'}</DialogTitle></DialogHeader>
          <form onSubmit={(ev) => { ev.preventDefault(); saveMutation.mutate(form); }} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ad Soyad *</label>
              <Input value={form.fullName} onChange={(ev) => setForm({ ...form, fullName: ev.target.value })} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Unvan</label>
              <Input value={form.title} onChange={(ev) => setForm({ ...form, title: ev.target.value })} placeholder="Örn: Genel Müdür Yardımcısı" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefon</label>
                <Input value={form.phone} onChange={(ev) => setForm({ ...form, phone: ev.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">E-posta</label>
                <Input type="email" value={form.email} onChange={(ev) => setForm({ ...form, email: ev.target.value })} />
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

      <Dialog open={archiveId !== null} onOpenChange={() => setArchiveId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>İşveren Vekilini Arşivle</DialogTitle></DialogHeader>
          <div className="flex items-start gap-4 py-4">
            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
            <p className="text-sm text-muted-foreground">Bu işveren vekili arşivlenecek. Devam edilsin mi?</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveId(null)}>İptal</Button>
            <Button variant="destructive" disabled={archiveMutation.isPending} onClick={() => archiveId && archiveMutation.mutate(archiveId)}>
              {archiveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Arşivle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

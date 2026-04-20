import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Search, UserCheck, Edit, Archive, Loader2, Phone, Mail, AlertTriangle, LayoutGrid, List as ListIcon, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Employer {
  id: number; fullName: string; title?: string; phone?: string; email?: string; username?: string; isActive: boolean;
}

const emptyForm = { fullName: '', title: '', phone: '', email: '', username: '' };

export default function EmployersPage() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
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
    setForm({ 
      fullName: e.fullName, 
      title: e.title ?? '', 
      phone: e.phone ?? '', 
      email: e.email ?? '',
      username: e.username ?? ''
    });
    setModalOpen(true);
  };

  const filtered = employers.filter((e) =>
    e.fullName.toLowerCase().includes(search.toLowerCase()) ||
    e.title?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">İşveren Vekilleri</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Sistemde kayıtlı işveren temsilcilerini yönetin.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-50/50 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("h-8 w-8 rounded-lg transition-all", viewMode === 'list' && "bg-white dark:bg-slate-700 shadow-sm text-primary")}
              onClick={() => setViewMode('list')}
            >
              <ListIcon className="w-3.5 h-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("h-8 w-8 rounded-lg transition-all", viewMode === 'grid' && "bg-white dark:bg-slate-700 shadow-sm text-primary")}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </Button>
          </div>
          <Button onClick={openAdd} className="rounded-xl h-10 px-5 font-semibold text-sm bg-slate-900 hover:bg-slate-800 shadow-sm gap-2 text-white">
            <Plus className="w-4 h-4" /> Yeni Vekil
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input 
            placeholder="Ad veya unvan ile hızlı ara..." 
            className="pl-10 h-11 bg-slate-50/50 border-none rounded-xl text-sm font-medium focus-visible:ring-primary/10" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <div key={i} className="h-48 bg-slate-50/50 rounded-2xl animate-pulse border border-slate-100" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-slate-50/30 rounded-2xl border border-dashed border-slate-200">
          <UserCheck className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-semibold text-xs tracking-wide">İşveren vekili bulunamadı</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((e) => (
            <Card key={e.id} className={cn(
              "border-none shadow-sm rounded-2xl bg-white dark:bg-slate-900 overflow-hidden hover:ring-1 hover:ring-primary/20 transition-all duration-300 group",
              !e.isActive && 'opacity-60 grayscale'
            )}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl flex items-center justify-center text-lg font-bold group-hover:bg-primary group-hover:text-white transition-all">
                    {e.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => openEdit(e)}>
                      <Edit className="w-4 h-4 text-slate-400" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-rose-500" onClick={() => setArchiveId(e.id)}>
                      <Archive className="w-4 h-4 text-slate-400" />
                    </Button>
                  </div>
                </div>
                <div className="mb-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-base mb-1 group-hover:text-primary transition-colors">{e.fullName}</h3>
                  <p className="text-[10px] font-bold text-slate-400 tracking-wide">{e.title || 'Unvan Belirtilmedi'}</p>
                </div>
                <div className="space-y-2.5 pt-4 border-t border-slate-50 dark:border-slate-800">
                  {e.phone && (
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{e.phone}</span>
                    </div>
                  )}
                  {e.email && (
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{e.email}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500">İşveren Vekili</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500">Unvan</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500">İletişim</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {filtered.map((e) => (
                  <tr key={e.id} className={cn("hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors group", !e.isActive && 'opacity-60')}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                          {e.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-white text-sm">{e.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">{e.title || '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2"><Phone className="w-3 h-3 opacity-50" /> {e.phone || '—'}</span>
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2"><Mail className="w-3 h-3 opacity-50" /> {e.email || '—'}</span>
                        {e.username && (
                          <span className="text-[10px] text-primary font-bold flex items-center gap-2 mt-1">
                            <UserCheck className="w-3 h-3" />
                            {e.username}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/5 hover:text-primary transition-colors" onClick={() => openEdit(e)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-colors" onClick={() => setArchiveId(e.id)}>
                          <Archive className="w-4 h-4" />
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
      <Dialog open={modalOpen} onOpenChange={(v) => { setModalOpen(v); if (!v) setEditItem(null); }}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl bg-white dark:bg-slate-950">
          <DialogHeader className="px-8 py-6 bg-slate-900 text-white">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                <UserCheck className="w-5 h-5 text-white/70" />
              </div>
              <DialogTitle className="text-lg font-semibold tracking-tight">
                {editItem ? 'Vekil Bilgilerini Düzenle' : 'Yeni İşveren Vekili Tanımla'}
              </DialogTitle>
            </div>
          </DialogHeader>
          <form onSubmit={(ev) => { ev.preventDefault(); saveMutation.mutate(form); }} className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1">Ad Soyad *</label>
                <Input 
                  value={form.fullName} 
                  onChange={(ev) => setForm({ ...form, fullName: ev.target.value })} 
                  className="rounded-xl border-slate-100 h-11 text-sm font-medium focus-visible:ring-primary/10 bg-slate-50/50"
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1">Unvan</label>
                <Input 
                  value={form.title} 
                  onChange={(ev) => setForm({ ...form, title: ev.target.value })} 
                  placeholder="Örn: Genel Müdür Yardımcısı" 
                  className="rounded-xl border-slate-100 h-11 text-sm font-medium focus-visible:ring-primary/10 bg-slate-50/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1">Telefon</label>
                  <Input 
                    value={form.phone} 
                    onChange={(ev) => setForm({ ...form, phone: ev.target.value })} 
                    className="rounded-xl border-slate-100 h-11 text-sm font-medium focus-visible:ring-primary/10 bg-slate-50/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1">E-posta</label>
                  <Input 
                    type="email" 
                    value={form.email} 
                    onChange={(ev) => setForm({ ...form, email: ev.target.value })} 
                    className="rounded-xl border-slate-100 h-11 text-sm font-medium focus-visible:ring-primary/10 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="space-y-2 bg-primary/5 p-4 rounded-2xl border border-primary/10 mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                    <UserCheck className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <label className="text-[10px] font-black text-primary tracking-widest uppercase">Uygulama Erişimi (Kullanıcı Adı)</label>
                </div>
                <Input 
                  placeholder="Örn: vekil.isminiz" 
                  value={form.username} 
                  onChange={(ev) => setForm({ ...form, username: ev.target.value })} 
                  className="rounded-xl border-white bg-white/50 h-11 text-sm font-medium focus-visible:ring-primary/20" 
                />
                <p className="text-[10px] text-slate-500 font-medium mt-2 leading-relaxed">
                  Kullanıcı adı girdiğinizde bu vekil için otomatik olarak bir kullanıcı hesabı oluşturulacaktır.
                </p>
              </div>
            </div>
            
            {saveMutation.isError && (
              <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold border border-rose-100 flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {(saveMutation.error as Error).message}
              </div>
            )}
            
            <DialogFooter className="gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} className="rounded-xl h-11 px-6 font-bold text-xs text-slate-400">Vazgeç</Button>
              <Button type="submit" disabled={saveMutation.isPending} className="rounded-xl h-11 px-8 font-bold text-xs bg-slate-900 hover:bg-slate-800 shadow-lg text-white">
                {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Kaydet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={archiveId !== null} onOpenChange={() => setArchiveId(null)}>
        <DialogContent className="sm:max-w-[425px] p-0 border-none shadow-2xl rounded-2xl overflow-hidden bg-white dark:bg-slate-950">
          <DialogHeader className="px-8 py-6 bg-slate-900 text-white">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                <Archive className="w-5 h-5 text-white/70" />
              </div>
              <DialogTitle className="text-lg font-semibold tracking-tight">Arşivle</DialogTitle>
            </div>
          </DialogHeader>
          <div className="p-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Bu işveren vekilini arşivlemek istediğinize emin misiniz? Bu işlem geri alınabilir ancak vekil listede görünmeyecektir.
              </p>
            </div>
            <DialogFooter className="gap-3 mt-8">
              <Button variant="ghost" onClick={() => setArchiveId(null)} className="rounded-xl font-bold text-xs text-slate-400">İptal</Button>
              <Button
                variant="destructive"
                disabled={archiveMutation.isPending}
                onClick={() => archiveId && archiveMutation.mutate(archiveId)}
                className="rounded-xl px-6 font-bold text-xs bg-rose-500 hover:bg-rose-600 text-white"
              >
                {archiveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Archive className="w-4 h-4 mr-2" />}
                Arşivle
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

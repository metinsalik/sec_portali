import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Plus, Search, Users, AlertTriangle, ShieldAlert, Archive, Edit, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CertStatus { isExpired: boolean; isCritical: boolean; isWarning: boolean; daysLeft: number | null }
interface Professional {
  id: number; fullName: string; employmentType: string; osgbName?: string;
  titleClass: string; certificateNo?: string; certificateDate?: string;
  phone?: string; email?: string; unitPrice?: number; isActive: boolean;
  certificateStatus: CertStatus;
  assignments: { facility: { name: string } }[];
}

const TITLE_CLASSES = ['A Sınıfı IGU', 'B Sınıfı IGU', 'C Sınıfı IGU', 'İşyeri Hekimi', 'DSP'];
const EMPLOYMENT_TYPES = ['Tesis Kadrosu', 'OSGB Kadrosu'];

const emptyForm = {
  fullName: '', employmentType: 'Tesis Kadrosu', osgbName: '',
  titleClass: 'A Sınıfı IGU', certificateNo: '', certificateDate: '',
  phone: '', email: '', unitPrice: '',
};

function CertBadge({ status }: { status: CertStatus }) {
  if (status.isExpired) return <Badge variant="destructive">Süresi Dolmuş</Badge>;
  if (status.isCritical) return <Badge variant="destructive">{status.daysLeft} gün</Badge>;
  if (status.isWarning) return <Badge variant="secondary" className="text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50">{status.daysLeft} gün</Badge>;
  if (status.daysLeft !== null) return <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50">Geçerli</Badge>;
  return <Badge variant="secondary">Belge yok</Badge>;
}

export default function ProfessionalsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Professional | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [archiveId, setArchiveId] = useState<number | null>(null);

  const { data: professionals = [], isLoading } = useQuery<Professional[]>({
    queryKey: ['professionals'],
    queryFn: async () => {
      const res = await api.get('/panel/professionals');
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof emptyForm) => {
      const payload = { ...data, unitPrice: data.unitPrice ? parseFloat(data.unitPrice) : null };
      const res = editItem
        ? await api.put(`/panel/professionals/${editItem.id}`, payload)
        : await api.post('/panel/professionals', payload);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      setModalOpen(false);
      setEditItem(null);
      setForm(emptyForm);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/panel/professionals/${id}/archive`, {});
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      setArchiveId(null);
    },
  });

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (p: Professional) => {
    setEditItem(p);
    setForm({
      fullName: p.fullName, employmentType: p.employmentType, osgbName: p.osgbName ?? '',
      titleClass: p.titleClass, certificateNo: p.certificateNo ?? '',
      certificateDate: p.certificateDate ? p.certificateDate.substring(0, 10) : '',
      phone: p.phone ?? '', email: p.email ?? '',
      unitPrice: p.unitPrice?.toString() ?? '',
    });
    setModalOpen(true);
  };

  const filtered = professionals.filter((p) => {
    const matchSearch = p.fullName.toLowerCase().includes(search.toLowerCase())
      || p.email?.toLowerCase().includes(search.toLowerCase())
      || p.osgbName?.toLowerCase().includes(search.toLowerCase());
    const matchClass = filterClass === 'all' || p.titleClass === filterClass;
    return matchSearch && matchClass;
  });

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">İSG Profesyonelleri</h1>
          <p className="text-sm text-muted-foreground">{professionals.length} kayıt</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" /> Yeni Profesyonel
        </Button>
      </div>

      {/* Filtreler */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Ad, e-posta veya OSGB ara..."
            className="pl-9 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterClass} onValueChange={setFilterClass}>
          <SelectTrigger className="w-48 bg-background">
            <SelectValue placeholder="Tüm Sınıflar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Sınıflar</SelectItem>
            {TITLE_CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-background rounded-xl border border-dashed">
          <Users className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Kayıt bulunamadı.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => (
            <Card key={p.id} className={cn(!p.isActive && 'opacity-60')}>
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start md:items-center gap-4 min-w-0 w-full">
                    <div className="w-12 h-12 bg-secondary rounded flex items-center justify-center shrink-0 text-sm font-semibold text-foreground">
                      {p.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground text-base">{p.fullName}</span>
                        <Badge variant="outline" className="font-normal">{p.titleClass}</Badge>
                        <Badge variant="secondary" className="font-normal">
                          {p.employmentType === 'OSGB Kadrosu' ? `OSGB${p.osgbName ? ': ' + p.osgbName : ''}` : 'Tesis Kadrosu'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground">
                        {p.email && <span>{p.email}</span>}
                        {p.phone && <span>{p.phone}</span>}
                        <span>{p.assignments.length} aktif atama</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 w-full md:w-auto justify-end border-t md:border-0 pt-4 md:pt-0 mt-2 md:mt-0">
                    <div className="text-right flex items-center gap-3 md:block">
                      <p className="text-xs text-muted-foreground mb-1 hidden md:block">Sertifika</p>
                      <CertBadge status={p.certificateStatus} />
                    </div>
                    <div className="flex gap-1 ml-4 border-l pl-4">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setArchiveId(p.id)}
                        className="hover:text-destructive"
                      >
                        <Archive className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Ekle / Düzenle Modal */}
      <Dialog open={modalOpen} onOpenChange={(v) => { setModalOpen(v); if (!v) setEditItem(null); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Profesyonel Düzenle' : 'Yeni Profesyonel Ekle'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }}
            className="space-y-4 pt-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium">Ad Soyad *</label>
                <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">İstihdam Tipi *</label>
                <Select value={form.employmentType} onValueChange={(v) => setForm({ ...form, employmentType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{EMPLOYMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Unvan / Sınıf *</label>
                <Select value={form.titleClass} onValueChange={(v) => setForm({ ...form, titleClass: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TITLE_CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {form.employmentType === 'OSGB Kadrosu' && (
                <div className="col-span-2 space-y-2">
                  <label className="text-sm font-medium">OSGB Firma Adı</label>
                  <Input value={form.osgbName} onChange={(e) => setForm({ ...form, osgbName: e.target.value })} />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">Sertifika No</label>
                <Input value={form.certificateNo} onChange={(e) => setForm({ ...form, certificateNo: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Sertifika Tarihi</label>
                <Input type="date" value={form.certificateDate} onChange={(e) => setForm({ ...form, certificateDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefon</label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">E-posta</label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              {form.employmentType === 'OSGB Kadrosu' && (
                <div className="col-span-2 space-y-2">
                  <label className="text-sm font-medium">Birim Ücret (₺/ay)</label>
                  <Input type="number" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} />
                </div>
              )}
            </div>
            {saveMutation.isError && (
              <p className="text-sm text-destructive font-medium">{(saveMutation.error as Error).message}</p>
            )}
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Vazgeç</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Kaydet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Arşivle Onay */}
      <Dialog open={archiveId !== null} onOpenChange={() => setArchiveId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Profesyoneli Arşivle</DialogTitle>
          </DialogHeader>
          <div className="flex items-start gap-4 py-4">
            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Bu profesyonelin aktif atamaları da sonlandırılacak. Devam etmek istiyor musunuz?
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveId(null)}>İptal</Button>
            <Button
              variant="destructive"
              disabled={archiveMutation.isPending}
              onClick={() => archiveId && archiveMutation.mutate(archiveId)}
            >
              {archiveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Arşivle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

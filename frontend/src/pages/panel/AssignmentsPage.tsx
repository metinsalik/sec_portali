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
  Plus, Search, ClipboardList, StopCircle, Loader2, AlertTriangle,
  Building2, Clock, CheckCircle2, XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Facility { id: string; name: string; dangerClass: string; employeeCount: number }
interface Professional { id: number; fullName: string; titleClass: string; isActive: boolean }
interface Employer { id: number; fullName: string; title?: string }
interface Assignment {
  id: number;
  facilityId: string;
  facility: Facility;
  professionalId?: number;
  professional?: Professional;
  employerRep?: Employer;
  type: string;
  durationMinutes: number;
  isFullTime: boolean;
  startDate: string;
  endDate?: string;
  status: string;
  costType?: string;
  unitPrice?: number;
  updatedAt: string;
}

const ASSIGNMENT_TYPES = ['IGU', 'Hekim', 'DSP', 'İşveren Vekili'];
const COST_TYPES = ['Sabit', 'Saatlik'];

const emptyForm = {
  facilityId: '', type: 'IGU', professionalId: '', employerRepId: '',
  durationMinutes: '', isFullTime: false, startDate: '', costType: '', unitPrice: '',
};

function StatusBadge({ status }: { status: string }) {
  return status === 'Aktif'
    ? <Badge variant="outline" className="border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/20 gap-1"><CheckCircle2 className="w-3 h-3" />Aktif</Badge>
    : <Badge variant="secondary" className="gap-1"><XCircle className="w-3 h-3 text-muted-foreground" />Sona Erdi</Badge>;
}

export default function AssignmentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Aktif');
  const [modalOpen, setModalOpen] = useState(false);
  const [terminateId, setTerminateId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [capacityError, setCapacityError] = useState('');

  const { data: assignments = [], isLoading } = useQuery<Assignment[]>({
    queryKey: ['assignments', filterStatus],
    queryFn: async () => {
      const res = await api.get(`/panel/assignments?status=${filterStatus}`);
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json();
    },
  });

  const { data: facilities = [] } = useQuery<Facility[]>({
    queryKey: ['panel-facilities'],
    queryFn: async () => {
      const res = await api.get('/panel/facilities');
      if (!res.ok) throw new Error();
      return res.json();
    },
  });

  const { data: professionals = [] } = useQuery<Professional[]>({
    queryKey: ['professionals'],
    queryFn: async () => {
      const res = await api.get('/panel/professionals');
      if (!res.ok) throw new Error();
      return res.json();
    },
  });

  const { data: employers = [] } = useQuery<Employer[]>({
    queryKey: ['employers'],
    queryFn: async () => {
      const res = await api.get('/panel/employers');
      if (!res.ok) throw new Error();
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof emptyForm) => {
      setCapacityError('');
      const res = await api.post('/panel/assignments', {
        ...data,
        isFullTime: data.isFullTime,
        professionalId: data.professionalId || undefined,
        employerRepId: data.employerRepId || undefined,
      });
      if (!res.ok) {
        const e = await res.json();
        if (res.status === 409) { setCapacityError(e.error); return; }
        throw new Error(e.error);
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (!data) return; // capacity error — stay open
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      setModalOpen(false);
      setForm(emptyForm);
      setCapacityError('');
    },
  });

  const terminateMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/panel/assignments/${id}/terminate`, {});
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      setTerminateId(null);
    },
  });

  const filtered = assignments.filter((a) =>
    a.facility?.name.toLowerCase().includes(search.toLowerCase()) ||
    a.professional?.fullName.toLowerCase().includes(search.toLowerCase()) ||
    a.type.toLowerCase().includes(search.toLowerCase()),
  );

  const isIGU = ['IGU', 'Hekim', 'DSP'].includes(form.type);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Atama Yönetimi</h1>
          <p className="text-sm text-muted-foreground">{assignments.length} atama</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setCapacityError(''); setModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Yeni Atama
        </Button>
      </div>

      {/* Filtreler */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Tesis, profesyonel veya tip ara..." className="pl-9 bg-background" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Aktif">Aktif</SelectItem>
            <SelectItem value="Sona Erdi">Sona Erdi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="space-y-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-background rounded-xl border border-dashed">
          <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Atama bulunamadı.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start md:items-center gap-4 min-w-0 flex-1">
                    <div className="w-12 h-12 bg-secondary rounded flex items-center justify-center shrink-0 text-sm font-semibold text-foreground">
                      {a.type}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-semibold text-foreground text-base">
                          {a.professional?.fullName ?? a.employerRep?.fullName ?? '—'}
                        </span>
                        <StatusBadge status={a.status} />
                        {a.isFullTime && <Badge variant="secondary" className="font-normal">Tam Zamanlı</Badge>}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-4 h-4" /> {a.facility?.name}
                        </span>
                        {!a.isFullTime && (
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" /> {a.durationMinutes} dk/ay
                          </span>
                        )}
                        <span className="text-muted-foreground">
                          {new Date(a.startDate).toLocaleDateString('tr-TR')}
                          {a.endDate && ` — ${new Date(a.endDate).toLocaleDateString('tr-TR')}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  {a.status === 'Aktif' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTerminateId(a.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 mt-2 md:mt-0 md:ml-4 border-t pt-4 md:border-0 md:pt-0"
                    >
                      <StopCircle className="w-4 h-4 mr-2" /> Sonlandır
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Yeni Atama Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Yeni Atama Oluştur</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }}
            className="space-y-4 pt-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium">Tesis *</label>
                <Select value={form.facilityId} onValueChange={(v) => setForm({ ...form, facilityId: v })}>
                  <SelectTrigger><SelectValue placeholder="Tesis seçin..." /></SelectTrigger>
                  <SelectContent>
                    {facilities.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name} <span className="text-muted-foreground text-xs ml-1">({f.dangerClass})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Atama Tipi *</label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v, professionalId: '', employerRepId: '' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASSIGNMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {isIGU ? 'Profesyonel' : 'İşveren Vekili'}
                </label>
                {isIGU ? (
                  <Select value={form.professionalId} onValueChange={(v) => setForm({ ...form, professionalId: v })}>
                    <SelectTrigger><SelectValue placeholder="Seçin..." /></SelectTrigger>
                    <SelectContent>
                      {professionals
                        .filter((p) =>
                          form.type === 'IGU' ? p.titleClass.includes('IGU')
                            : form.type === 'Hekim' ? p.titleClass === 'İşyeri Hekimi'
                              : p.titleClass === 'DSP'
                        )
                        .map((p) => (
                          <SelectItem key={p.id} value={p.id.toString()}>
                            {p.fullName} <span className="text-muted-foreground text-xs ml-1">({p.titleClass})</span>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select value={form.employerRepId} onValueChange={(v) => setForm({ ...form, employerRepId: v })}>
                    <SelectTrigger><SelectValue placeholder="Seçin..." /></SelectTrigger>
                    <SelectContent>
                      {employers.map((e) => (
                        <SelectItem key={e.id} value={e.id.toString()}>{e.fullName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Süre (dk/ay)</label>
                <Input
                  type="number"
                  min={0}
                  value={form.durationMinutes}
                  onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                  disabled={form.isFullTime}
                  placeholder="Örn: 480"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Başlangıç Tarihi *</label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  required
                />
              </div>

              <div className="col-span-2 flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isFullTime"
                  checked={form.isFullTime}
                  onChange={(e) => setForm({ ...form, isFullTime: e.target.checked, durationMinutes: '' })}
                  className="rounded border-muted w-4 h-4 accent-primary cursor-pointer"
                />
                <label htmlFor="isFullTime" className="text-sm font-medium cursor-pointer">
                  Tam Zamanlı (11.700 dk/ay)
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Maliyet Tipi</label>
                <Select value={form.costType} onValueChange={(v) => setForm({ ...form, costType: v })}>
                  <SelectTrigger><SelectValue placeholder="Opsiyonel" /></SelectTrigger>
                  <SelectContent>
                    {COST_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Birim Fiyat (₺)</label>
                <Input
                  type="number"
                  value={form.unitPrice}
                  onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                  placeholder="Opsiyonel"
                />
              </div>
            </div>

            {capacityError && (
              <div className="flex items-start gap-3 p-4 bg-destructive/10 rounded-lg mt-4">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
                <p className="text-sm text-destructive font-medium">{capacityError}</p>
              </div>
            )}

            {createMutation.isError && (
              <p className="text-sm text-destructive font-medium mt-2">{(createMutation.error as Error).message}</p>
            )}

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => { setModalOpen(false); setCapacityError(''); }}>Vazgeç</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Atamayı Oluştur
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sonlandır Onay */}
      <Dialog open={terminateId !== null} onOpenChange={() => setTerminateId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Atamayı Sonlandır</DialogTitle></DialogHeader>
          <div className="flex items-start gap-4 py-4">
            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Bu atama sonlandırılacak. Tesisin yasal süre uyumluluk durumu etkilenebilir. Devam edilsin mi?
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTerminateId(null)}>İptal</Button>
            <Button
              variant="destructive"
              disabled={terminateMutation.isPending}
              onClick={() => terminateId && terminateMutation.mutate(terminateId)}
            >
              {terminateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Sonlandır
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

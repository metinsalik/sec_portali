import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Plus, FileText, Loader2, Building2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Facility { id: string; name: string }
interface OSGBCompany { id: number; name: string }
interface Reconciliation {
  id: number; facilityId: string; facility: Facility; osgbCompanyId: number;
  osgbCompany: OSGBCompany; month: string; amount?: number; note?: string; status: string;
  createdAt: string;
}

const emptyForm = { facilityId: '', osgbCompanyId: '', month: '', amount: '', note: '' };

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  'Beklemede': 'secondary',
  'Onaylandı': 'outline',
  'Reddedildi': 'destructive',
};

const statusExtraClasses: Record<string, string> = {
  'Beklemede': 'text-amber-600 dark:text-amber-400',
  'Onaylandı': 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50',
  'Reddedildi': '',
};

export default function ReconciliationPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data: items = [], isLoading } = useQuery<Reconciliation[]>({
    queryKey: ['reconciliation'],
    queryFn: async () => {
      const res = await api.get('/panel/reconciliation');
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

  const { data: osgbList = [] } = useQuery<OSGBCompany[]>({
    queryKey: ['osgb'],
    queryFn: async () => {
      const res = await api.get('/panel/osgb');
      if (!res.ok) throw new Error();
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof emptyForm) => {
      const res = await api.post('/panel/reconciliation', data);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation'] });
      setModalOpen(false);
      setForm(emptyForm);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mutabakat</h1>
          <p className="text-sm text-muted-foreground">{items.length} kayıt</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Yeni Mutabakat
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-background rounded-xl border border-dashed">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Henüz mutabakat kaydı yok.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 bg-secondary rounded flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-semibold text-foreground text-base">{item.osgbCompany?.name}</span>
                        <Badge 
                          variant={statusVariants[item.status] ?? 'secondary'} 
                          className={cn("font-normal", statusExtraClasses[item.status])}
                        >
                          {item.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-4 h-4" /> {item.facility?.name}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" /> {item.month}
                        </span>
                        {item.amount && (
                          <span className="font-medium text-foreground">
                            ₺{item.amount.toLocaleString('tr-TR')}
                          </span>
                        )}
                      </div>
                      {item.note && <p className="text-sm text-muted-foreground mt-2 truncate max-w-2xl">{item.note}</p>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Yeni Mutabakat Oluştur</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tesis *</label>
              <Select value={form.facilityId} onValueChange={(v) => setForm({ ...form, facilityId: v })}>
                <SelectTrigger><SelectValue placeholder="Tesis seçin..." /></SelectTrigger>
                <SelectContent>
                  {facilities.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">OSGB Firması *</label>
              <Select value={form.osgbCompanyId} onValueChange={(v) => setForm({ ...form, osgbCompanyId: v })}>
                <SelectTrigger><SelectValue placeholder="Firma seçin..." /></SelectTrigger>
                <SelectContent>
                  {osgbList.map((o) => <SelectItem key={o.id} value={o.id.toString()}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Dönem (YYYY-MM) *</label>
                <Input
                  type="month"
                  value={form.month}
                  onChange={(e) => setForm({ ...form, month: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tutar (₺)</label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Opsiyonel" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Not</label>
              <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Opsiyonel açıklama" />
            </div>
            {createMutation.isError && <p className="text-sm text-destructive font-medium">{(createMutation.error as Error).message}</p>}
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Vazgeç</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Oluştur
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

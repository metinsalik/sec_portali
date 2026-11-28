import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar, Search, Send, Repeat, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string | null;
  templateTitle: string;
}

export function AssignmentModal({
  open,
  onOpenChange,
  templateId,
  templateTitle,
}: AssignmentModalProps) {
  const queryClient = useQueryClient();
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [facilitySearch, setFacilitySearch] = useState('');
  const [facilityTypeFilter, setFacilityTypeFilter] = useState<'HOSPITAL_DIALYSIS' | 'HOSPITAL' | 'DIALYSIS' | 'ALL'>('HOSPITAL_DIALYSIS');
  const [isPeriodic, setIsPeriodic] = useState(false);
  const [periodValue, setPeriodValue] = useState<number>(1);
  const [periodType, setPeriodType] = useState('MONTH');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: facilities = [] } = useQuery<any[]>({
    queryKey: ['facilities'],
    queryFn: async () => {
      const res = await api.get('/settings/facilities');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: open,
  });

  const activeFacilities = useMemo(() => {
    return facilities.filter((f) => {
      if (f.isActive === false) return false;
      const t = String(f.type || '').trim();
      if (facilityTypeFilter === 'HOSPITAL_DIALYSIS') {
        return t === 'Hastane' || t === 'Diyaliz Merkezi';
      }
      if (facilityTypeFilter === 'HOSPITAL') return t === 'Hastane';
      if (facilityTypeFilter === 'DIALYSIS') return t === 'Diyaliz Merkezi';
      return true;
    });
  }, [facilities, facilityTypeFilter]);

  const filteredFacilities = useMemo(() => {
    const q = facilitySearch.trim().toLowerCase();
    if (!q) return activeFacilities;
    return activeFacilities.filter((f) => f.name.toLowerCase().includes(q));
  }, [activeFacilities, facilitySearch]);

  const { data: existingAssignments = [], refetch: refetchAssignments } = useQuery<any[]>({
    queryKey: ['checklist-template-assignments', templateId],
    queryFn: async () => {
      if (!templateId) return [];
      const res = await api.get(`/checklists/assignments/template/${templateId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: open && !!templateId,
  });

  const assignMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/checklists/assignments', data);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Görevlendirme oluşturulamadı.');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(
        isPeriodic
          ? `${selectedFacilities.length} tesise periyodik kontrol listesi tanımlandı.`
          : `${selectedFacilities.length} tesise anlık kontrol listesi gönderildi.`
      );
      queryClient.invalidateQueries({ queryKey: ['checklist-template-assignments', templateId] });
      queryClient.invalidateQueries({ queryKey: ['checklist-consolidated'] });
      setSelectedFacilities([]);
      setIsPeriodic(false);
      setPeriodValue(1);
      setPeriodType('MONTH');
      setStartDate('');
      setEndDate('');
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Görevlendirme sırasında hata oluştu.');
    },
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/checklists/assignments/${id}`);
      if (!res.ok) throw new Error('Silinemedi');
    },
    onSuccess: () => {
      toast.success('Görevlendirme kaldırıldı.');
      refetchAssignments();
    },
    onError: () => toast.error('Görevlendirme silinemedi.'),
  });

  const handleSelectAll = () => {
    const visibleIds = filteredFacilities.map((f) => f.id);
    const allVisibleSelected =
      visibleIds.length > 0 && visibleIds.every((id) => selectedFacilities.includes(id));

    if (allVisibleSelected) {
      setSelectedFacilities((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedFacilities((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const toggleFacility = (id: string) => {
    setSelectedFacilities((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    if (!templateId) return;
    if (selectedFacilities.length === 0) {
      toast.error('Lütfen en az bir tesis seçin.');
      return;
    }

    assignMutation.mutate({
      templateId,
      facilityIds: selectedFacilities,
      isPeriodic,
      periodValue: isPeriodic ? periodValue : null,
      periodType: isPeriodic ? periodType : null,
      startDate: isPeriodic && startDate ? startDate : null,
      endDate: isPeriodic && endDate ? endDate : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Tesislere Gönder / Görevlendir: {templateTitle}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Kontrol listesini seçili tesislere anlık olarak gönderebilir veya rutin periyodik kontrol olarak tanımlayabilirsiniz.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Gönderim Türü Seçimi */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setIsPeriodic(false)}
              className={`p-3 rounded-lg border text-left transition-all ${
                !isPeriodic
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                  : 'border-border bg-card hover:bg-muted/40'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Send className="w-3.5 h-3.5 text-primary" />
                Anlık Gönderim (Tek Seferlik)
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Seçili tüm tesislere hemen bekleyen denetim açar ve bildirim gönderir.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setIsPeriodic(true)}
              className={`p-3 rounded-lg border text-left transition-all ${
                isPeriodic
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                  : 'border-border bg-card hover:bg-muted/40'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Repeat className="w-3.5 h-3.5 text-primary" />
                Rutin / Periyodik Görevlendirme
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Belirlenen gün, hafta veya ay periyodunda düzenli tekrarlar.
              </p>
            </button>
          </div>

          {isPeriodic && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-lg border border-border bg-muted/20">
              <div className="space-y-1.5">
                <Label className="text-xs">Tekrar Sıklığı</Label>
                <div className="flex gap-1.5">
                  <Input
                    type="number"
                    min="1"
                    value={periodValue}
                    onChange={(e) => setPeriodValue(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-16 h-8 text-xs tabular-nums"
                  />
                  <select
                    className="flex-1 h-8 px-2 border border-border rounded-md bg-background text-xs"
                    value={periodType}
                    onChange={(e) => setPeriodType(e.target.value)}
                  >
                    <option value="DAY">Gün</option>
                    <option value="WEEK">Hafta</option>
                    <option value="MONTH">Ay</option>
                    <option value="YEAR">Yıl</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Başlangıç Tarihi</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-8 text-xs tabular-nums"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Bitiş Tarihi (Opsiyonel)</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-8 text-xs tabular-nums"
                />
              </div>

              <div className="sm:col-span-3 text-[11px] flex items-center gap-2 bg-primary/10 text-primary px-3 py-2 rounded-md">
                <Calendar className="w-4 h-4 shrink-0" />
                <span>
                  Seçili {selectedFacilities.length} tesise, {startDate || 'bugünden'} itibaren her {periodValue}{' '}
                  {periodType === 'MONTH'
                    ? 'ayda'
                    : periodType === 'WEEK'
                    ? 'haftada'
                    : periodType === 'DAY'
                    ? 'günde'
                    : 'yılda'}{' '}
                  bir denetim tanımlanacaktır.
                </span>
              </div>
            </div>
          )}

          {/* Tesis Seçimi */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="text-xs font-semibold">
                Hedef Tesisler ({selectedFacilities.length} / {activeFacilities.length} Seçili)
              </Label>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <Input
                    value={facilitySearch}
                    onChange={(e) => setFacilitySearch(e.target.value)}
                    placeholder="Tesis ara..."
                    className="h-8 pl-8 w-44 text-xs"
                  />
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleSelectAll} className="h-8 text-xs">
                  {filteredFacilities.length > 0 &&
                  filteredFacilities.every((f) => selectedFacilities.includes(f.id))
                    ? 'Seçimi Kaldır'
                    : 'Tümünü Seç'}
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'HOSPITAL_DIALYSIS', label: 'Hastane & Diyaliz Merkezi' },
                  { id: 'HOSPITAL', label: 'Sadece Hastane' },
                  { id: 'DIALYSIS', label: 'Sadece Diyaliz Merkezi' },
                  { id: 'ALL', label: 'Tümü' },
                ] as const
              ).map((opt) => (
                <Button
                  key={opt.id}
                  type="button"
                  size="sm"
                  variant={facilityTypeFilter === opt.id ? 'default' : 'outline'}
                  onClick={() => setFacilityTypeFilter(opt.id)}
                  className="h-7 px-2.5 text-[11px]"
                >
                  {opt.label}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 border border-border rounded-lg p-3 max-h-48 overflow-y-auto bg-muted/20">
              {filteredFacilities.map((fac) => (
                <label
                  key={fac.id}
                  className="flex items-center justify-between gap-2 p-1.5 hover:bg-muted rounded-md cursor-pointer"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <Checkbox
                      checked={selectedFacilities.includes(fac.id)}
                      onCheckedChange={() => toggleFacility(fac.id)}
                    />
                    <span className="text-xs truncate">{fac.name}</span>
                  </span>
                  {fac.type && (
                    <Badge variant="secondary" className="text-[9px] shrink-0 font-normal">
                      {fac.type}
                    </Badge>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Mevcut Atamalar */}
          {existingAssignments.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border">
              <Label className="text-xs font-semibold text-muted-foreground">
                Bu Şablona Ait Aktif Görevlendirmeler ({existingAssignments.length})
              </Label>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {existingAssignments.map((asg: any) => (
                  <div
                    key={asg.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-md border border-border/70 bg-muted/20 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="outline" className="text-[10px]">
                        {asg.isPeriodic
                          ? `Periyodik (${asg.periodValue || 1} ${asg.periodType || ''})`
                          : 'Anlık Gönderim'}
                      </Badge>
                      <span className="text-muted-foreground tabular-nums">
                        {asg.facilityIds?.length || 0} tesis
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteAssignmentMutation.mutate(asg.id)}
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      title="Görevlendirmeyi Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button size="sm" onClick={handleSave} disabled={assignMutation.isPending} className="gap-1.5">
            {assignMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            {assignMutation.isPending ? 'Gönderiliyor...' : 'Tesislere Gönder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

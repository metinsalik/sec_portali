import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from 'lucide-react';

interface AssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string | null;
  templateTitle: string;
}

export function AssignmentModal({ open, onOpenChange, templateId, templateTitle }: AssignmentModalProps) {
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [isPeriodic, setIsPeriodic] = useState(false);
  const [periodValue, setPeriodValue] = useState<number>(1);
  const [periodType, setPeriodType] = useState('MONTH');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: facilities = [] } = useQuery({
    queryKey: ['facilities'],
    queryFn: async () => {
      const res = await api.get('/settings/facilities');
      return res.json();
    }
  });

  const assignMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/checklists/assignments', data);
      return res.json();
    },
    onSuccess: () => {
      onOpenChange(false);
      alert('Görevlendirme başarıyla oluşturuldu!');
      // Reset form
      setSelectedFacilities([]);
      setIsPeriodic(false);
      setPeriodValue(1);
      setPeriodType('MONTH');
      setStartDate('');
      setEndDate('');
    },
    onError: (err) => {
      console.error(err);
      alert('Görevlendirme sırasında hata oluştu.');
    }
  });

  const handleSelectAll = () => {
    if (selectedFacilities.length === facilities.length) {
      setSelectedFacilities([]);
    } else {
      setSelectedFacilities(facilities.map((f: any) => f.id));
    }
  };

  const toggleFacility = (id: string) => {
    if (selectedFacilities.includes(id)) {
      setSelectedFacilities(selectedFacilities.filter(f => f !== id));
    } else {
      setSelectedFacilities([...selectedFacilities, id]);
    }
  };

  const handleSave = () => {
    if (!templateId) return;
    if (selectedFacilities.length === 0) {
      alert('Lütfen en az bir tesis seçin.');
      return;
    }

    assignMutation.mutate({
      templateId,
      facilityIds: selectedFacilities,
      isPeriodic,
      periodValue: isPeriodic ? periodValue : null,
      periodType: isPeriodic ? periodType : null,
      startDate: isPeriodic && startDate ? startDate : null,
      endDate: isPeriodic && endDate ? endDate : null
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Görevlendirme: {templateTitle}</DialogTitle>
          <DialogDescription>
            Bu kontrol listesini tesislere atayın. Periyodik olarak tekrarlanmasını sağlayabilirsiniz.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">Tesis Seçimi ({selectedFacilities.length} Seçili)</Label>
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {selectedFacilities.length === facilities.length ? 'Tümünü Kaldır' : 'Tümünü Seç'}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 border rounded-md p-4 max-h-48 overflow-y-auto bg-muted/20">
              {facilities.map((fac: any) => (
                <label key={fac.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer">
                  <Checkbox checked={selectedFacilities.includes(fac.id)} onCheckedChange={() => toggleFacility(fac.id)} />
                  <span className="text-sm">{fac.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4 border rounded-md p-4 bg-muted/20">
            <label className="flex items-center gap-2 cursor-pointer font-medium">
              <Checkbox checked={isPeriodic} onCheckedChange={(c) => setIsPeriodic(!!c)} />
              Periyodik Olarak Tekrarla
            </label>

            {isPeriodic && (
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Tekrar Sıklığı</Label>
                  <div className="flex gap-2">
                    <Input type="number" min="1" value={periodValue} onChange={e => setPeriodValue(parseInt(e.target.value))} className="w-20" />
                    <select className="flex-1 p-2 border rounded bg-background" value={periodType} onChange={e => setPeriodType(e.target.value)}>
                      <option value="DAY">Gün</option>
                      <option value="WEEK">Hafta</option>
                      <option value="MONTH">Ay</option>
                      <option value="YEAR">Yıl</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Başlangıç Tarihi</Label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Bitiş Tarihi (Opsiyonel)</Label>
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
                
                <div className="col-span-2 text-sm text-muted-foreground flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 p-3 rounded-lg">
                  <Calendar className="w-5 h-5" />
                  <span>Seçili {selectedFacilities.length} tesise, {startDate || 'bugünden'} itibaren her {periodValue} {periodType === 'MONTH' ? 'ayda' : periodType === 'WEEK' ? 'haftada' : periodType === 'DAY' ? 'günde' : 'yılda'} bir taslak değerlendirme otomatik oluşturulacaktır.</span>
                </div>
              </div>
            )}
          </div>

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
          <Button onClick={handleSave} disabled={assignMutation.isPending}>
            {assignMutation.isPending ? 'Kaydediliyor...' : 'Görevlendir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

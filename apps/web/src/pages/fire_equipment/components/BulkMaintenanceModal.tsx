import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { format } from 'date-fns';

interface BulkMaintenanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentIds: string[];
  facilityId: string;
  onSuccess: () => void;
}

export function BulkMaintenanceModal({ open, onOpenChange, equipmentIds, facilityId, onSuccess }: BulkMaintenanceModalProps) {
  const queryClient = useQueryClient();
  const [maintenanceDate, setMaintenanceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [companyId, setCompanyId] = useState('none');
  const [technician, setTechnician] = useState('');
  
  const { data: companies } = useQuery({
    queryKey: ['fire-companies', facilityId],
    queryFn: async () => {
      const res = await api.get(`/fire-equipment/companies/${facilityId}`);
      return res.json();
    },
    enabled: !!facilityId && open
  });

  const { data: responsibles } = useQuery({
    queryKey: ['fire-responsibles', facilityId],
    queryFn: async () => {
      const res = await api.get(`/fire-equipment/responsibles/${facilityId}`);
      return res.json();
    },
    enabled: !!facilityId && open
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        equipmentIds,
        maintenanceDate,
        companyId: companyId !== 'none' ? companyId : null,
        company: companyId !== 'none' ? companies?.find((c: any) => c.id === companyId)?.name : '',
        technician,
        description: 'Toplu Bakım'
      };

      return api.post('/fire-equipment/maintenance/bulk', payload);
    },
    onSuccess: async () => {
      toast.success(`${equipmentIds.length} adet ekipmana toplu bakım girildi.`);
      await queryClient.invalidateQueries({ queryKey: ['fire-equipment', facilityId] });
      await queryClient.invalidateQueries({ queryKey: ['fire-equipment'] });
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setMaintenanceDate(format(new Date(), 'yyyy-MM-dd'));
      setCompanyId('none');
      setTechnician('');
    },
    onError: (error: any) => {
      toast.error('Toplu bakım sırasında bir hata oluştu: ' + error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (equipmentIds.length === 0) {
      toast.error('Seçili ekipman bulunamadı.');
      return;
    }
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Toplu Bakım Gir</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          
          <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 p-3 rounded-lg text-sm mb-4">
            <strong>{equipmentIds.length}</strong> adet ekipman seçildi. Bu işlem ile seçilen tüm ekipmanların kontrol listesindeki maddeleri otomatik olarak "UYGUN" işaretlenip kaydedilecektir.
          </div>

          <div className="space-y-2">
            <Label>Bakım Tarihi</Label>
            <Input 
              type="date" 
              value={maintenanceDate} 
              onChange={(e) => setMaintenanceDate(e.target.value)} 
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Bakımı Yapan Firma</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
            >
              <option value="none">-- Firma Seçin --</option>
              {companies?.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Bakımı Kontrol Eden / Teknisyen</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={technician}
              onChange={(e) => setTechnician(e.target.value)}
              required
            >
              <option value="">-- Seçilmedi --</option>
              {responsibles?.map((resp: any) => (
                <option key={resp.id} value={resp.name}>
                  {resp.department ? `${resp.department} - ` : ''}{resp.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

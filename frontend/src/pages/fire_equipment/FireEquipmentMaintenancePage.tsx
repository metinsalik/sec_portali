import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Save, Wrench } from 'lucide-react';
import { format, add } from 'date-fns';

export default function FireEquipmentMaintenancePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    maintenanceDate: format(new Date(), 'yyyy-MM-dd'),
    company: '',
    technician: '',
    result: 'UYGUN',
    description: '',
    nextMaintenanceDate: format(add(new Date(), { years: 1 }), 'yyyy-MM-dd')
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post(`/fire-equipment/equipment/${id}/maintenance`, data);
    },
    onSuccess: () => {
      toast.success('Bakım kaydı başarıyla oluşturuldu.');
      queryClient.invalidateQueries({ queryKey: ['fire-equipment', id] });
      navigate(`/fire-equipment/view/${id}`);
    },
    onError: (error: any) => {
      toast.error('İşlem sırasında bir hata oluştu: ' + error.message);
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (value: string) => {
    setFormData({ ...formData, result: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <Wrench className="w-6 h-6 text-orange-500" /> Bakım Kaydı Ekle
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-lg">Bakım Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="maintenanceDate">Bakım Tarihi *</Label>
                <Input type="date" id="maintenanceDate" name="maintenanceDate" value={formData.maintenanceDate} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label>Sonuç *</Label>
                <Select value={formData.result} onValueChange={handleSelectChange} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seçiniz..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UYGUN">Uygun</SelectItem>
                    <SelectItem value="SARTLI_UYGUN">Şartlı Uygun</SelectItem>
                    <SelectItem value="UYGUN_DEGIL">Uygun Değil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="company">Firma</Label>
                <Input id="company" name="company" value={formData.company} onChange={handleChange} placeholder="Bakımı yapan firma" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="technician">Teknisyen</Label>
                <Input id="technician" name="technician" value={formData.technician} onChange={handleChange} placeholder="İşlemi yapan kişi" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Bakım notları..." />
            </div>

            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="nextMaintenanceDate">Sonraki Bakım Tarihi</Label>
              <Input type="date" id="nextMaintenanceDate" name="nextMaintenanceDate" value={formData.nextMaintenanceDate} onChange={handleChange} />
              <p className="text-xs text-muted-foreground">Ekipmanın sonraki bakım tarihi otomatik olarak bu tarih ile güncellenecektir.</p>
            </div>

            <div className="flex justify-end gap-3 pt-6">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>İptal</Button>
              <Button type="submit" disabled={mutation.isPending} className="bg-orange-600 hover:bg-orange-700 text-white border-0">
                <Save className="w-4 h-4 mr-2" /> Kaydet
              </Button>
            </div>

          </CardContent>
        </Card>
      </form>
    </div>
  );
}

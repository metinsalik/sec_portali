import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PenTool, CheckCircle, AlertTriangle, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function FireEquipmentMaintenanceDashboardPage() {
  const facilityId = localStorage.getItem('activeFacilityId');
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('ALL'); // ALL, OVERDUE, UPCOMING
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [maintenanceForm, setMaintenanceForm] = useState({
    maintenanceDate: new Date().toISOString().split('T')[0],
    company: '',
    technician: '',
    result: 'UYGUN',
    description: ''
  });

  const { data: equipmentList, isLoading } = useQuery({
    queryKey: ['fire-equipment', facilityId],
    queryFn: async () => {
      if (!facilityId) return [];
      const res = await api.get(`/fire-equipment/equipment/${facilityId}`);
      if (!res.ok) throw new Error('Failed to fetch equipment');
      return res.json();
    },
    enabled: !!facilityId
  });

  const addMaintenanceMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/fire-equipment/maintenances', data);
    },
    onSuccess: () => {
      toast.success('Bakım kaydı başarıyla eklendi.');
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['fire-equipment', facilityId] });
      setMaintenanceForm({
        maintenanceDate: new Date().toISOString().split('T')[0],
        company: '',
        technician: '',
        result: 'UYGUN',
        description: ''
      });
    }
  });

  const handleAddMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipmentId) return;
    addMaintenanceMutation.mutate({
      equipmentId: selectedEquipmentId,
      ...maintenanceForm
    });
  };

  const getMaintenanceStatus = (dateString: string | null) => {
    if (!dateString) return { status: 'UNKNOWN', text: 'Tarih Yok', color: 'text-gray-500' };
    const nextDate = new Date(dateString);
    const today = new Date();
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: 'OVERDUE', text: `Süresi Geçti (${Math.abs(diffDays)} gün)`, color: 'text-red-600 bg-red-50' };
    if (diffDays <= 30) return { status: 'UPCOMING', text: `Yaklaşıyor (${diffDays} gün)`, color: 'text-orange-600 bg-orange-50' };
    return { status: 'OK', text: nextDate.toLocaleDateString('tr-TR'), color: 'text-green-600 bg-green-50' };
  };

  const activeEquipment = equipmentList?.filter((e: any) => e.status !== 'HURDA' && e.status !== 'KULLANIM_DISI') || [];

  const filteredEquipment = activeEquipment.filter((item: any) => {
    const matchesSearch = 
      item.equipmentNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (item.category?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    const status = getMaintenanceStatus(item.nextMaintenanceDate).status;
    if (filter === 'OVERDUE' && status !== 'OVERDUE') return false;
    if (filter === 'UPCOMING' && status !== 'UPCOMING') return false;

    return true;
  });

  if (!facilityId) {
    return <div className="p-8 text-center text-muted-foreground">Lütfen bir tesis seçin.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <PenTool className="w-8 h-8 text-blue-500" /> Bakım ve Kontroller
          </h1>
          <p className="text-muted-foreground mt-1">Ekipmanların periyodik bakım tarihlerini takip edin ve kayıt girin.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2">
          <Button variant={filter === 'ALL' ? 'default' : 'outline'} onClick={() => setFilter('ALL')}>Tümü</Button>
          <Button variant={filter === 'OVERDUE' ? 'destructive' : 'outline'} onClick={() => setFilter('OVERDUE')}>
            <AlertTriangle className="w-4 h-4 mr-2" /> Süresi Geçenler
          </Button>
          <Button variant={filter === 'UPCOMING' ? 'secondary' : 'outline'} className={filter === 'UPCOMING' ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : ''} onClick={() => setFilter('UPCOMING')}>
            Yaklaşanlar
          </Button>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ekipman No veya Kategori..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="shadow-sm border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="w-full h-16" />)}
            </div>
          ) : filteredEquipment.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <p>Belirtilen kriterlere uygun ekipman bulunamadı.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-4 font-medium">Ekipman No</th>
                    <th className="px-6 py-4 font-medium">Kategori</th>
                    <th className="px-6 py-4 font-medium">Lokasyon</th>
                    <th className="px-6 py-4 font-medium">Sonraki Bakım</th>
                    <th className="px-6 py-4 font-medium text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredEquipment.map((item: any) => {
                    const statusInfo = getMaintenanceStatus(item.nextMaintenanceDate);
                    return (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-medium">{item.equipmentNo}</td>
                        <td className="px-6 py-4">{item.category?.name || '-'}</td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {item.location ? `${item.location.building} / ${item.location.floor}` : 'Lokasyon Yok'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Dialog open={isModalOpen && selectedEquipmentId === item.id} onOpenChange={(open) => {
                            setIsModalOpen(open);
                            if (open) setSelectedEquipmentId(item.id);
                            else setSelectedEquipmentId('');
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="h-8">
                                <Plus className="w-4 h-4 mr-1" /> Bakım Gir
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Bakım Kaydı Ekle - {item.equipmentNo}</DialogTitle>
                              </DialogHeader>
                              <form onSubmit={handleAddMaintenance} className="space-y-4 mt-4">
                                <div className="space-y-2">
                                  <Label>Bakım Tarihi *</Label>
                                  <Input type="date" required value={maintenanceForm.maintenanceDate} onChange={e => setMaintenanceForm({...maintenanceForm, maintenanceDate: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>Firma (Opsiyonel)</Label>
                                    <Input placeholder="Bakımı Yapan Firma" value={maintenanceForm.company} onChange={e => setMaintenanceForm({...maintenanceForm, company: e.target.value})} />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Teknisyen (Opsiyonel)</Label>
                                    <Input placeholder="Ad Soyad" value={maintenanceForm.technician} onChange={e => setMaintenanceForm({...maintenanceForm, technician: e.target.value})} />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label>Sonuç *</Label>
                                  <Select value={maintenanceForm.result} onValueChange={val => setMaintenanceForm({...maintenanceForm, result: val})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="UYGUN">Uygun</SelectItem>
                                      <SelectItem value="SARTLI_UYGUN">Şartlı Uygun</SelectItem>
                                      <SelectItem value="UYGUN_DEGIL">Uygun Değil</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>Açıklama (Opsiyonel)</Label>
                                  <Input placeholder="Yapılan işlemler, değişen parçalar vb." value={maintenanceForm.description} onChange={e => setMaintenanceForm({...maintenanceForm, description: e.target.value})} />
                                </div>
                                <div className="pt-4 flex justify-end gap-2">
                                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>İptal</Button>
                                  <Button type="submit" disabled={addMaintenanceMutation.isPending}>Kaydet</Button>
                                </div>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

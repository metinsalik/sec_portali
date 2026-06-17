import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Flame, Plus, QrCode, ArrowRight } from 'lucide-react';

export default function FireEquipmentListPage() {
  const facilityId = localStorage.getItem('activeFacilityId');
  const navigate = useNavigate();

  const { data: equipment, isLoading } = useQuery({
    queryKey: ['fire-equipment', facilityId],
    queryFn: async () => {
      if (!facilityId) return [];
      const res = await api.get(`/fire-equipment/equipment/${facilityId}`);
      if (!res.ok) throw new Error('Failed to fetch fire equipment');
      return res.json();
    },
    enabled: !!facilityId
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AKTIF': return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Aktif</Badge>;
      case 'DEPODA': return <Badge variant="secondary">Depoda</Badge>;
      case 'ARIZALI': return <Badge variant="destructive">Arızalı</Badge>;
      case 'HURDA': return <Badge variant="outline" className="bg-slate-200">Hurda</Badge>;
      case 'KULLANIM_DISI': return <Badge variant="outline">Kullanım Dışı</Badge>;
      case 'DEGISIME_GIDEN': return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Değişime Giden</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getMaintenanceWarning = (dateString: string | null) => {
    if (!dateString) return null;
    const nextDate = new Date(dateString);
    const today = new Date();
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <span className="text-red-600 font-medium text-xs block">Süresi Geçti ({Math.abs(diffDays)} gün)</span>;
    } else if (diffDays <= 30) {
      return <span className="text-orange-600 font-medium text-xs block">Yaklaşıyor ({diffDays} gün)</span>;
    }
    return <span className="text-muted-foreground text-xs block">{nextDate.toLocaleDateString('tr-TR')}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <Flame className="w-8 h-8 text-red-500" /> Yangın Ekipmanı Envanteri
          </h1>
          <p className="text-muted-foreground mt-1">Tüm ekipmanlarınızı listeleyin ve detaylarını görüntüleyin.</p>
        </div>
        <Button onClick={() => navigate('/fire-equipment/new')} className="bg-red-600 hover:bg-red-700">
          <Plus className="w-4 h-4 mr-2" /> Yeni Ekle
        </Button>
      </div>

      <Card className="shadow-sm border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="w-full h-16" />)}
            </div>
          ) : !equipment || equipment.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-4">
              <Flame className="w-12 h-12 text-gray-300" />
              <p>Henüz bu tesise ait yangın ekipmanı bulunmamaktadır.</p>
              <Button onClick={() => navigate('/fire-equipment/new')} variant="outline">
                İlk Ekipmanı Ekle
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-4 font-medium">Ekipman No</th>
                    <th className="px-6 py-4 font-medium">Kategori</th>
                    <th className="px-6 py-4 font-medium">Marka / Model</th>
                    <th className="px-6 py-4 font-medium">Lokasyon</th>
                    <th className="px-6 py-4 font-medium">Sorumlu</th>
                    <th className="px-6 py-4 font-medium">Durum</th>
                    <th className="px-6 py-4 font-medium">Sonraki Bakım</th>
                    <th className="px-6 py-4 font-medium text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {equipment.map((item: any) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium flex items-center gap-2">
                        {item.qrCode && <QrCode className="w-4 h-4 text-blue-500" />}
                        {item.equipmentNo}
                      </td>
                      <td className="px-6 py-4">{item.category?.name || '-'}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {item.brand || '-'} {item.model ? `/ ${item.model}` : ''}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {item.location ? `${item.location.building} / ${item.location.floor}` : 'Lokasyon Yok'}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {item.responsible ? item.responsible.name : (item.responsibleUnit || '-')}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-6 py-4">
                        {item.nextMaintenanceDate ? getMaintenanceWarning(item.nextMaintenanceDate) : <span className="text-muted-foreground text-xs">-</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => navigate(`/fire-equipment/view/${item.id}`)}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          Detay <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

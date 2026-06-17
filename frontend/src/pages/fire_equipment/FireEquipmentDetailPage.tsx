import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Edit, MapPin, Wrench, FileText, Activity } from 'lucide-react';
import { format } from 'date-fns';

export default function FireEquipmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: equipment, isLoading } = useQuery({
    queryKey: ['fire-equipment', id],
    queryFn: async () => {
      const res = await api.get(`/fire-equipment/equipment/detail/${id}`);
      if (!res.ok) throw new Error('Ekipman bulunamadı');
      return res.json();
    }
  });

  if (isLoading) {
    return <div className="p-8"><Skeleton className="h-[400px] w-full max-w-4xl mx-auto" /></div>;
  }

  if (!equipment) return <div className="p-8 text-center">Bulunamadı.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              {equipment.equipmentNo}
              <Badge variant="outline" className="text-xs font-normal bg-white dark:bg-slate-800">{equipment.category?.name}</Badge>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Ekipman Detayları ve Geçmişi</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/fire-equipment/maintenance/${id}`)} variant="secondary">
            <Wrench className="w-4 h-4 mr-2" /> Bakım Ekle
          </Button>
          <Button onClick={() => navigate(`/fire-equipment/edit/${id}`)} variant="outline">
            <Edit className="w-4 h-4 mr-2" /> Düzenle
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-500" /> Teknik Özellikler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-6 text-sm">
                <div>
                  <dt className="text-muted-foreground font-medium mb-1">Durum</dt>
                  <dd className="font-semibold">{equipment.status}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground font-medium mb-1">QR Kod / Barkod</dt>
                  <dd>{equipment.qrCode || '-'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground font-medium mb-1">Marka / Model</dt>
                  <dd>{equipment.brand || '-'} / {equipment.model || '-'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground font-medium mb-1">Üretim Yılı</dt>
                  <dd>{equipment.productionYear || '-'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground font-medium mb-1">Kapasite</dt>
                  <dd>{equipment.capacity || '-'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground font-medium mb-1">Sorumlu Birim</dt>
                  <dd>{equipment.responsibleUnit || '-'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wrench className="w-5 h-5 text-orange-500" /> Bakım Geçmişi
              </CardTitle>
            </CardHeader>
            <CardContent>
              {equipment.maintenances && equipment.maintenances.length > 0 ? (
                <div className="space-y-4">
                  {equipment.maintenances.map((m: any) => (
                    <div key={m.id} className="p-3 bg-muted/30 rounded-lg text-sm border">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold">{format(new Date(m.maintenanceDate), 'dd.MM.yyyy')}</span>
                        <Badge variant={m.result === 'UYGUN' ? 'default' : 'destructive'} className={m.result === 'UYGUN' ? 'bg-green-500 hover:bg-green-600' : ''}>
                          {m.result}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">Firma: {m.company || '-'} | Teknisyen: {m.technician || '-'}</p>
                      {m.description && <p className="mt-1">{m.description}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Henüz bakım kaydı bulunmuyor.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" /> Gelecek Bakım
              </CardTitle>
            </CardHeader>
            <CardContent>
              {equipment.nextMaintenanceDate ? (
                <div className="text-xl font-bold text-center p-4 bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 rounded-xl border border-orange-100 dark:border-orange-900">
                  {format(new Date(equipment.nextMaintenanceDate), 'dd.MM.yyyy')}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center">Planlanmış bakım yok.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500" /> Hareket & Lokasyon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-muted-foreground mb-1 uppercase">Mevcut Konum</h4>
                <p className="text-sm font-medium">
                  {equipment.location ? `${equipment.location.building} / ${equipment.location.floor} - ${equipment.location.description}` : 'Lokasyon Belirtilmemiş'}
                </p>
              </div>

              <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase border-t pt-4">Hareket Geçmişi</h4>
              {equipment.movements && equipment.movements.length > 0 ? (
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                  {equipment.movements.map((m: any, i: number) => (
                    <div key={m.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-white bg-slate-300 group-[.is-active]:bg-emerald-500 text-slate-500 group-[.is-active]:text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"></div>
                      <div className="w-[calc(100%-1.5rem)] md:w-[calc(50%-1.5rem)] p-3 rounded border border-slate-200 bg-white dark:bg-slate-800 shadow">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs">{format(new Date(m.movementDate), 'dd.MM.yy')}</span>
                        </div>
                        <p className="text-xs text-slate-500">{m.reason || 'Yer Değişikliği'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center">Hareket kaydı yok.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

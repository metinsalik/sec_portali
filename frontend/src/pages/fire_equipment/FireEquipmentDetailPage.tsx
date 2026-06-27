import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { FileText, ArrowLeft, Edit, Copy, Trash2, MapPin, Activity, Download, Wrench, Printer, RefreshCcw, Check, Search } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { QRCodeCanvas } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
// removed default imports, handled above

export default function FireEquipmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return api.delete(`/fire-equipment/equipment/${id}`);
    },
    onSuccess: () => {
      toast.success('Ekipman başarıyla silindi');
      navigate('/fire-equipment');
    },
    onError: () => toast.error('Ekipman silinirken bir hata oluştu')
  });

  const [isSwapModalOpen, setSwapModalOpen] = useState(false);
  const [replacementEquipmentId, setReplacementEquipmentId] = useState<string>('');
  const [brokenStatus, setBrokenStatus] = useState<string>('ARIZALI'); // Default for swap
  const [swapSearch, setSwapSearch] = useState<string>('');

  const swapMutation = useMutation({
    mutationFn: async () => {
      const isReverseSwap = equipment?.status === 'DEPODA';
      return api.post(`/fire-equipment/equipment/${id}/swap`, {
        replacementEquipmentId,
        brokenStatus,
        isReverseSwap
      });
    },
    onSuccess: () => {
      toast.success('Değişim işlemi başarıyla tamamlandı');
      setSwapModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['fire-equipment', id] });
    },
    onError: () => toast.error('Değişim sırasında bir hata oluştu')
  });

  const returnFromServiceMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/fire-equipment/equipment/${id}/return-from-service`, {});
    },
    onSuccess: () => {
      toast.success('Cihaz depoya alındı.');
      queryClient.invalidateQueries({ queryKey: ['fire-equipment', id] });
    },
    onError: () => toast.error('İşlem sırasında bir hata oluştu')
  });

  const handleDelete = () => {
    if (window.confirm('Bu ekipmanı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      deleteMutation.mutate();
    }
  };

  const { data: equipment, isLoading } = useQuery({
    queryKey: ['fire-equipment', id],
    queryFn: async () => {
      const res = await api.get(`/fire-equipment/equipment/detail/${id}`);
      if (!res.ok) throw new Error('Ekipman bulunamadı');
      return res.json();
    }
  });

  const { data: facilities } = useQuery({
    queryKey: ['facilities'],
    queryFn: async () => {
      const res = await api.get('/settings/facilities');
      if (!res.ok) return [];
      return res.json();
    }
  });

  const { data: availableEquipment, isLoading: isAvailableLoading } = useQuery({
    queryKey: ['available-equipment', equipment?.categoryId],
    queryFn: async () => {
      if (!equipment?.categoryId || !equipment?.facilityId) return [];
      const res = await api.get(`/fire-equipment/equipment/${equipment.facilityId}`);
      if (!res.ok) return [];
      const list = await res.json();
      
      if (equipment.status === 'DEPODA' || equipment.equipmentNo?.toUpperCase().includes('YSC-YDK-')) {
        return list.filter((e: any) => e.status === 'AKTIF' && e.categoryId === equipment.categoryId && e.id !== equipment.id);
      }

      return list.filter((e: any) => {
        const isDepo = e.status === 'DEPODA' || e.equipmentNo?.toUpperCase().includes('YSC-YDK-');
        return isDepo && e.id !== equipment.id;
      });
    },
    enabled: isSwapModalOpen && !!equipment?.categoryId
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
            <h1 className="text-2xl font-bold tracking-tight flex flex-wrap items-center gap-3">
              {equipment.equipmentNo}
              <Badge variant="outline" className="text-xs font-normal bg-white dark:bg-slate-800">{equipment.category?.name}</Badge>
              {equipment.maintenances && equipment.maintenances.length > 0 && (
                <Badge variant={equipment.maintenances[0].result === 'UYGUN' ? 'default' : equipment.maintenances[0].result === 'SARTLI_UYGUN' ? 'outline' : 'destructive'} 
                       className={equipment.maintenances[0].result === 'UYGUN' ? 'bg-green-500 hover:bg-green-600' : equipment.maintenances[0].result === 'SARTLI_UYGUN' ? 'bg-orange-500 text-white hover:bg-orange-600 border-none' : ''}>
                  {equipment.maintenances[0].result === 'UYGUN' ? '✅ Uygun' : equipment.maintenances[0].result === 'SARTLI_UYGUN' ? '⚠️ Şartlı Uygun' : '❌ Uygun Değil'}
                </Badge>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Ekipman Detayları ve Geçmişi</p>
          </div>
        </div>
        <div className="flex gap-2">
          {['ARIZALI', 'HURDA', 'DEGISIME_GIDEN'].includes(equipment.status) && (
            <Button onClick={() => {
              if (window.confirm('Bu cihazın servisten tamir edilip geldiğini onaylıyor musunuz? Durumu DEPODA (Sağlam) olarak güncellenecektir.')) {
                returnFromServiceMutation.mutate();
              }
            }} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Check className="w-4 h-4 mr-2" /> Servisten Döndü
            </Button>
          )}
          {['AKTIF', 'DEPODA'].includes(equipment.status) && (
            <Button onClick={() => setSwapModalOpen(true)} variant="outline" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200">
              <RefreshCcw className="w-4 h-4 mr-2" /> {equipment.status === 'DEPODA' ? 'Sahaya Gönder (Takas)' : 'Değişim Yap'}
            </Button>
          )}
          <Button onClick={() => navigate(`/fire-equipment/maintenance/${id}`)} variant="secondary">
            <Wrench className="w-4 h-4 mr-2" /> Bakım Ekle
          </Button>
          <Button onClick={() => navigate(`/fire-equipment/new?cloneId=${id}`)} variant="outline">
            <Copy className="w-4 h-4 mr-2" /> Çoğalt
          </Button>
          <Button onClick={() => navigate(`/fire-equipment/edit/${id}`)} variant="outline">
            <Edit className="w-4 h-4 mr-2" /> Düzenle
          </Button>
          <Button onClick={handleDelete} variant="destructive" disabled={deleteMutation.isPending}>
            <Trash2 className="w-4 h-4 mr-2" /> Sil
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
                  <dd className="break-all">{equipment.qrCode || '-'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground font-medium mb-1">Marka / Model</dt>
                  <dd>{equipment.brand || '-'} / {equipment.model || '-'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Üretim Tarihi</dt>
                  <dd>{equipment.productionDate ? format(new Date(equipment.productionDate), 'dd.MM.yyyy') : '-'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground font-medium mb-1">Kapasite</dt>
                  <dd>{equipment.capacity || '-'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground font-medium mb-1">Sorumlu Departman</dt>
                  <dd>{equipment.responsibleUnit || '-'}</dd>
                </div>
                {equipment.inventoryData && Object.entries(equipment.inventoryData).map(([key, value]: any) => {
                  let displayKey = key;
                  let displayValue = value;

                  if (key === 'lastMaintenanceDate') {
                    displayKey = 'Son Bakım Tarihi';
                    displayValue = value ? format(new Date(value), 'yyyy-MM') : '-';
                  }

                  if (key === 'Kapasite' || key === 'kapasite') return null;

                  return (
                    <div key={key}>
                      <dt className="text-muted-foreground font-medium mb-1">{displayKey}</dt>
                      <dd>{displayValue}</dd>
                    </div>
                  );
                })}
              </dl>
              
              {equipment.qrCode && (
                <div className="mt-8 pt-6 border-t flex flex-col items-center justify-center">
                  <h4 className="text-sm font-medium text-muted-foreground mb-4">Ekipman QR Kodu</h4>
                  <div className="p-4 bg-white rounded-xl border shadow-sm">
                    <QRCodeSVG value={`${window.location.origin}/fire-equipment/view/${equipment.id}`} size={150} level="M" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">{equipment.qrCode}</p>
                  <Button variant="outline" size="sm" className="mt-4 print:hidden" onClick={() => window.print()}>
                    <Printer className="w-4 h-4 mr-2" /> Yazdır
                  </Button>
                </div>
              )}
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
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold">{format(new Date(m.maintenanceDate), 'dd.MM.yyyy')}</span>
                        <Badge variant={m.result === 'UYGUN' ? 'default' : 'destructive'} className={m.result === 'UYGUN' ? 'bg-green-500 hover:bg-green-600' : ''}>
                          {m.result}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-2">
                        Firma: {m.companyRel?.name || m.company || '-'} | Teknisyen: {m.technician || '-'}
                      </p>
                      
                      {m.maintenanceData && Object.keys(m.maintenanceData).length > 0 && (
                        <div className="mt-3 mb-3 bg-background rounded p-3 text-xs border grid grid-cols-2 gap-2">
                          {Object.entries(m.maintenanceData).map(([key, val]: any) => (
                            <div key={key}>
                              <span className="text-muted-foreground block">{key}</span>
                              <span className="font-medium">{val}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {m.description && <p className="mt-1">{m.description}</p>}
                      
                      {m.attachmentUrl && (
                        <div className="mt-3 pt-3 border-t">
                          <a href={api.defaults.baseURL?.replace('/api', '') + m.attachmentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-xs text-blue-600 hover:underline">
                            <Download className="w-3 h-3 mr-1" /> Ekli Dosyayı / Fotoğrafı Gör
                          </a>
                        </div>
                      )}
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
                  {equipment.location ? `${equipment.location.building}${equipment.location.floor ? ` / ${equipment.location.floor}` : ''}${equipment.location.department ? ` - ${equipment.location.department}` : ''}${equipment.location.description ? ` (${equipment.location.description})` : ''}` : 'Lokasyon Belirtilmemiş'}
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

      {/* Yazdırma Alanı (Sadece @media print ile görünür) */}
      <div className="hidden print:flex print:items-center print:justify-center print:h-screen print:w-full print:fixed print:top-0 print:left-0 print:bg-white print:z-50">
        <div className="border-2 border-black p-4 flex flex-col items-center justify-center text-center space-y-3 bg-white w-[250px]">
          <h2 className="font-bold text-sm uppercase leading-tight">
            {facilities?.find((f: any) => f.id === equipment.facilityId)?.name || 'Tesis'}
          </h2>
          <p className="font-bold text-lg bg-slate-100 px-3 py-1 rounded w-full">{equipment.equipmentNo}</p>
          <div className="p-2 bg-white border border-slate-200 rounded-lg">
            <QRCodeSVG value={`${window.location.origin}/fire-equipment/view/${equipment.id}`} size={150} level="M" includeMargin={false} />
          </div>
          <p className="text-xs text-muted-foreground">{equipment.category?.name || ''}</p>
        </div>
      </div>

      {/* Değişim Modal (Swap) */}
      <Dialog open={isSwapModalOpen} onOpenChange={setSwapModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ekipman Değişimi Yap</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 text-orange-800 text-sm">
              <p>
                {equipment.status === 'DEPODA' 
                  ? `Mevcut depodaki ${equipment.equipmentNo} cihazını sahadaki aktif bir cihazla yer değiştirebilirsiniz. Sahadaki cihaz Merkez Depoya alınacaktır.`
                  : `Mevcut ${equipment.equipmentNo} ekipmanını arızalı/hurda olarak işaretleyip yerine depodan sağlam bir ekipman yerleştirebilirsiniz. Eski ekipman otomatik olarak Arıza Deposuna taşınacaktır.`
                }
              </p>
            </div>

            {equipment.status !== 'DEPODA' && (
              <div className="space-y-3">
                <label className="text-sm font-medium">Bu ekipmanın yeni durumu ne olacak?</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="brokenStatus" value="ARIZALI" checked={brokenStatus === 'ARIZALI'} onChange={() => setBrokenStatus('ARIZALI')} className="w-4 h-4" />
                    <span>Arızalı</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="brokenStatus" value="HURDA" checked={brokenStatus === 'HURDA'} onChange={() => setBrokenStatus('HURDA')} className="w-4 h-4" />
                    <span>Hurda</span>
                  </label>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-sm font-medium">
                {equipment.status === 'DEPODA' ? 'Değiştirilecek Sahadaki Ekipmanı Seçin' : 'Yerine Takılacak Ekipmanı Seçin (Sadece Depodakiler)'}
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ekipman No ile ara..."
                  className="pl-9 h-9 w-full shadow-sm"
                  value={swapSearch}
                  onChange={(e) => setSwapSearch(e.target.value)}
                />
              </div>
              {isAvailableLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : !availableEquipment || availableEquipment.length === 0 ? (
                <div className="p-4 border rounded-md text-center text-muted-foreground bg-muted/20">
                  {equipment.status === 'DEPODA' ? 'Sahada değiştirilebilecek aktif ekipman bulunmuyor.' : `Depoda bekleyen müsait bir yedek ekipman bulunmuyor.`}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2">
                  {availableEquipment
                    .filter((eq: any) => eq.equipmentNo.toLowerCase().includes(swapSearch.toLowerCase()))
                    .map((eq: any) => (
                    <div 
                      key={eq.id} 
                      onClick={() => setReplacementEquipmentId(eq.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${replacementEquipmentId === eq.id ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' : 'hover:border-slate-300 hover:bg-slate-50'}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold">{eq.equipmentNo}</span>
                        {replacementEquipmentId === eq.id && <Check className="w-4 h-4 text-orange-600" />}
                      </div>
                      <div className="text-xs text-muted-foreground">{eq.brand || '-'} / {eq.model || '-'}</div>
                      {equipment.status === 'DEPODA' && eq.location && (
                        <div className="mt-1 text-xs font-semibold text-blue-600 break-words">Lokasyon: {eq.location.building} {eq.location.floor ? `/ ${eq.location.floor}` : ''} {eq.location.department ? `- ${eq.location.department}` : ''}</div>
                      )}
                      <div className="mt-2 text-xs font-medium text-emerald-600 flex justify-between">
                        <span>Üretim: {eq.productionDate ? format(new Date(eq.productionDate), 'yyyy') : '-'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSwapModalOpen(false)}>İptal</Button>
            <Button 
              disabled={!replacementEquipmentId || swapMutation.isPending} 
              onClick={() => swapMutation.mutate()}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {swapMutation.isPending ? 'İşleniyor...' : 'Değişimi Onayla'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

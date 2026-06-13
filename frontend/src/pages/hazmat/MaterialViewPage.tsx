import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, User, Edit, FileText } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { PrintCardModal } from '@/components/hazmat/PrintCardModal';
import { BASE_URL } from '@/lib/api';

export default function MaterialViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const activeFacilityId = localStorage.getItem('activeFacilityId');
  const [printModalOpen, setPrintModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['material-details', id, activeFacilityId],
    queryFn: async () => {
      const res = await api.get(`/hazmat/materials/${id}?facilityId=${activeFacilityId}`);
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json();
    },
    enabled: !!id
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>
      </AppLayout>
    );
  }

  if (!data?.material) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-red-500">Kayıt bulunamadı.</div>
      </AppLayout>
    );
  }

  const { material, facilityItem } = data;

  const renderSection = (title: string, content: string | null | undefined) => {
    if (!content) return null;
    return (
      <div className="mb-6 bg-card border rounded-lg p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">{title}</h3>
        <p className="text-sm whitespace-pre-wrap">{content}</p>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/hazmat/materials')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{material.productName}</h1>
              <p className="text-muted-foreground">{material.brandName || 'Marka Belirtilmemiş'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => setPrintModalOpen(true)} variant="outline" className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              <FileText className="w-4 h-4" /> Bilgi Kartı Yazdır
            </Button>
            <Button onClick={() => navigate(`/hazmat/materials/edit/${id}`)} className="gap-2">
              <Edit className="w-4 h-4" /> Düzenle
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            {renderSection("Kullanım Şekli", material.usageMethod)}
            {renderSection("Bileşimi / İçeriği", material.composition)}
            {renderSection("Tehlike Tanımı", material.hazardDescription)}
            {renderSection("İlkyardım Önlemleri", material.firstAid)}
            {renderSection("Yangınla Mücadele Tedbirleri", material.fireFightingMeasures)}
            {renderSection("Kaza Sonucu Serbest Kalması Durumunda Alınacak Tedbirler", material.accidentalReleaseMeasures)}
            {renderSection("Kullanım ve Depolama", material.handlingAndStorage)}
            {renderSection("Maruz Kalma Kontrolü ve Kişisel Korunma", material.exposureControlsPpe)}
            {renderSection("Fiziksel ve Kimyasal Özellikleri", material.physicalAndChemicalProperties)}
            {renderSection("Stabilite ve Reaktivite", material.stabilityAndReactivity)}
            {renderSection("Toksikolojik Bilgi", material.toxicologicalInformation)}
            {renderSection("Ekolojik Bilgi", material.ecologicalInformation)}
            {renderSection("Bertaraf Etme Bilgileri", material.disposalConsiderations)}
            {renderSection("Taşımacılık Bilgisi", material.transportInfo)}
            {renderSection("Mevzuat Bilgisi", material.regulatoryInfo)}
          </div>

          <div className="space-y-6">
            <div className="bg-card border rounded-lg p-5 flex flex-col items-center justify-center min-h-[150px]">
              {material.imageUrl ? (
                <img src={`${BASE_URL}${material.imageUrl}`} alt={material.productName} className="max-w-full max-h-48 object-contain" />
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-muted rounded-full mx-auto flex items-center justify-center mb-3">
                    <span className="text-xl font-bold text-muted-foreground">{material.productName.charAt(0)}</span>
                  </div>
                  <h3 className="font-semibold text-lg">{material.productName}</h3>
                  <p className="text-sm text-muted-foreground">Görsel Yüklenmemiş</p>
                </div>
              )}
            </div>

            <div className="bg-muted/30 border rounded-lg p-5">
              <h3 className="font-semibold mb-4">Tesis Bilgisi</h3>
              <div className="text-sm">
                <span className="text-muted-foreground">Miktar: </span>
                <span className="font-medium">
                  {facilityItem?.amountValue ? `${facilityItem.amountValue} ${facilityItem.unit?.symbol || ''}` : 'Belirtilmemiş'}
                </span>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-5">
              <h3 className="font-semibold mb-4">Tehlike Etiketleri (GHS)</h3>
              {material.hazardLabels?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {material.hazardLabels.map((hl: any) => (
                    <div key={hl.id} title={hl.label.name} className="border rounded p-1">
                      {hl.label.imageUrl ? (
                        <img src={hl.label.imageUrl} alt={hl.label.name} className="w-10 h-10 object-contain" />
                      ) : (
                        <span className="text-xs">{hl.label.name}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Etiket bulunmuyor</p>
              )}
            </div>

            <div className="bg-card border rounded-lg p-5">
              <h3 className="font-semibold mb-4">Tehlike Etiketleri (ADR)</h3>
              {material.adrLabels?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {material.adrLabels.map((al: any) => (
                    <div key={al.id} title={al.label.name} className="border rounded p-1">
                      {al.label.imageUrl ? (
                        <img src={al.label.imageUrl} alt={al.label.name} className="w-10 h-10 object-contain" />
                      ) : (
                        <span className="text-xs">{al.label.name}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Etiket bulunmuyor</p>
              )}
            </div>

            <div className="bg-card border rounded-lg p-5">
              <h3 className="font-semibold mb-4">Kişisel Koruyucu Donanımlar</h3>
              {material.ppes?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {material.ppes.map((p: any) => (
                    <div key={p.id} title={p.ppe.name} className="border rounded p-1">
                      {p.ppe.imageUrl ? (
                        <img src={p.ppe.imageUrl} alt={p.ppe.name} className="w-10 h-10 object-contain" />
                      ) : (
                        <span className="text-xs">{p.ppe.name}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">KKD bulunmuyor</p>
              )}
            </div>

            <div className="bg-card border rounded-lg p-5">
              <h3 className="font-semibold mb-4 text-blue-600 dark:text-blue-400">Güvenlik Bilgi Formu (SDS)</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground block mb-1">Geçerlilik Tarihi:</span>
                  <span className="font-medium text-sm">
                    {material.sdsExpiryDate ? new Date(material.sdsExpiryDate).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground block mb-1">Doküman:</span>
                  {material.sdsUrl ? (
                    <Button variant="outline" size="sm" className="w-full justify-start text-blue-600 border-blue-200 hover:bg-blue-50" asChild>
                      <a href={`${BASE_URL}${material.sdsUrl}`} target="_blank" rel="noreferrer">
                        PDF Belgesini Görüntüle
                      </a>
                    </Button>
                  ) : (
                    <span className="text-sm font-medium">Yüklenmemiş</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-card border rounded-lg p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" /> İşlem Geçmişi
              </h3>
              <div className="space-y-4">
                {material.auditLogs?.length > 0 ? (
                  material.auditLogs.map((log: any) => (
                    <div key={log.id} className="text-sm border-l-2 border-primary pl-3 pb-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <User className="w-3 h-3" /> {log.username}
                        <span>•</span>
                        <span>{new Date(log.createdAt).toLocaleString('tr-TR')}</span>
                      </div>
                      <p className="font-medium">{log.action === 'CREATE' ? 'Oluşturuldu' : 'Güncellendi'}</p>
                      {log.details && <p className="text-muted-foreground text-xs">{log.details}</p>}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Kayıt bulunmuyor.</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {material && (
          <PrintCardModal 
            isOpen={printModalOpen} 
            onClose={() => setPrintModalOpen(false)} 
            material={material} 
          />
        )}
      </div>
    </AppLayout>
  );
}

import { useRef } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Printer, ShieldAlert, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface HazmatIncidentReportPageProps {
  incident: any;
  onCancel: () => void;
}

const HazmatIncidentReportPage = ({ incident, onCancel }: HazmatIncidentReportPageProps) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!incident) return null;

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    const originalContent = document.body.innerHTML;

    if (printContent) {
      document.body.innerHTML = `
        <div style="padding: 20px; font-family: sans-serif; max-width: 800px; margin: 0 auto; color: #000; background: #fff;">
          ${printContent}
        </div>
      `;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload(); // Reload to restore React state bindings after print
    }
  };

  const safeFormatDate = (date: any, formatStr: string) => {
    if (!date) return '-';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '-';
      return format(d, formatStr, { locale: tr });
    } catch (e) {
      return '-';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-background">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-white dark:bg-muted/20 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-purple-700" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Rapor Önizleme</h2>
            <p className="text-xs text-muted-foreground">Tehlikeli Madde Olağan Dışı Olay Raporu</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" /> Kapat
          </Button>
          <Button onClick={handlePrint} className="bg-purple-600 hover:bg-purple-700 text-white">
            <Printer className="w-4 h-4 mr-2" /> Yazdır
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6 flex justify-center overflow-y-auto">
        {/* Printable Area */}
        <div 
          ref={printRef} 
          className="bg-white text-black p-8 shadow-xl border rounded-lg max-w-4xl mx-auto"
          style={{ minHeight: '1123px', width: '100%', maxWidth: '794px' }} // Approximate A4
        >
          {/* Print Header */}
          <div className="border-b-2 border-purple-800 pb-4 mb-6 flex justify-between items-start">
            <div className="flex gap-4 items-center">
              {incident.facility?.logoUrl && (
                <img src={incident.facility.logoUrl} alt="Logo" className="h-16 w-16 object-contain rounded" />
              )}
              <div>
                <h1 className="text-2xl font-black text-purple-900 mb-1 uppercase">Tehlikeli Madde</h1>
                <h2 className="text-lg font-bold text-gray-700">Olağan Dışı Olay Bildirim Raporu</h2>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">
                {incident.facility?.commercialTitle ? `${incident.facility.commercialTitle} - ${incident.facility.name}` : incident.facility?.name}
              </p>
              <p className="text-xs text-gray-600">Rapor Tarihi: {safeFormatDate(incident.incidentDate, 'dd.MM.yyyy HH:mm')}</p>
              <p className="text-xs text-gray-500 mt-1">Olay ID: #{incident.id.substring(0, 8)}</p>
            </div>
          </div>

          <div className="space-y-6">
            
            {/* Section 1: Temel Bilgiler */}
            <section>
              <h3 className="text-sm font-bold bg-purple-100 text-purple-900 py-1.5 px-3 uppercase border-l-4 border-purple-700 mb-3">
                1. Temel Bilgiler
              </h3>
              <table className="w-full text-sm border-collapse">
                <tbody>
                  <tr className="border-b">
                    <td className="w-1/3 py-2 font-semibold text-gray-700 bg-gray-50 px-2">Olay Tarihi / Saati</td>
                    <td className="py-2 px-2">{safeFormatDate(incident.incidentDate, 'dd MMMM yyyy, HH:mm')}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-semibold text-gray-700 bg-gray-50 px-2">Olay Türü</td>
                    <td className="py-2 px-2">{incident.category?.name || '-'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-semibold text-gray-700 bg-gray-50 px-2">Kök Neden</td>
                    <td className="py-2 px-2">{incident.rootCause || '-'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-semibold text-gray-700 bg-gray-50 px-2">Departman / Bölüm</td>
                    <td className="py-2 px-2">{incident.department?.name || '-'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-semibold text-gray-700 bg-gray-50 px-2">İlgili Tehlikeli Madde(ler)</td>
                    <td className="py-2 px-2">
                      {incident.materials && incident.materials.length > 0
                        ? incident.materials.map((m: any) => m.productName).join(', ')
                        : '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>

            {/* Section 2: Müdahale Bilgileri */}
            <section>
              <h3 className="text-sm font-bold bg-purple-100 text-purple-900 py-1.5 px-3 uppercase border-l-4 border-purple-700 mb-3">
                2. Müdahale Bilgileri
              </h3>
              <table className="w-full text-sm border-collapse">
                <tbody>
                  <tr className="border-b">
                    <td className="w-1/3 py-2 font-semibold text-gray-700 bg-gray-50 px-2">Müdahale Gerekti mi?</td>
                    <td className="py-2 px-2 font-bold text-purple-700">
                      {incident.interventionRequired ? 'EVET' : 'HAYIR'}
                    </td>
                  </tr>
                  {incident.interventionRequired && (
                    <tr className="border-b">
                      <td className="py-2 font-semibold text-gray-700 bg-gray-50 px-2">Müdahale Saati</td>
                      <td className="py-2 px-2">{safeFormatDate(incident.interventionTime, 'HH:mm')}</td>
                    </tr>
                  )}
                  <tr className="border-b">
                    <td className="py-2 font-semibold text-gray-700 bg-gray-50 px-2">Kontrol Altına Alma</td>
                    <td className="py-2 px-2 font-bold">{safeFormatDate(incident.controlTime, 'HH:mm')}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-semibold text-gray-700 bg-gray-50 px-2">Destek Alındı Mı?</td>
                    <td className="py-2 px-2">
                      {incident.supportReceived ? `Evet - ${incident.supportUnit?.name}` : 'Hayır'}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-semibold text-gray-700 bg-gray-50 px-2">Acil Durum Anonsu</td>
                    <td className="py-2 px-2">
                      {incident.announcementMade ? `Evet - ${incident.emergencyCode?.name}` : 'Hayır'}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-semibold text-gray-700 bg-gray-50 px-2">Döküntü Kiti Kullanımı</td>
                    <td className="py-2 px-2 font-bold text-blue-700">
                      {incident.kitUsed ? 'EVET (Eksik Kaydı Oluşturuldu)' : 'HAYIR'}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-semibold text-gray-700 bg-gray-50 px-2">Hizmet Kesintisi</td>
                    <td className="py-2 px-2 text-red-700 font-semibold">
                      {incident.serviceInterrupted ? `EVET - ${incident.interruptionDuration} saat` : 'HAYIR'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>

            {/* Section 3: Etki & İstatistikler */}
            <section>
              <h3 className="text-sm font-bold bg-purple-100 text-purple-900 py-1.5 px-3 uppercase border-l-4 border-purple-700 mb-3">
                3. Etki ve İstatistikler
              </h3>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="border rounded p-3 bg-gray-50">
                  <div className="text-xs font-bold text-gray-500 uppercase">Tahliye Personel</div>
                  <div className="text-xl font-black mt-1">{incident.evacuatedStaffCount || 0}</div>
                </div>
                <div className="border rounded p-3 bg-gray-50">
                  <div className="text-xs font-bold text-gray-500 uppercase">Tahliye Hasta</div>
                  <div className="text-xl font-black mt-1">{incident.evacuatedPatientCount || 0}</div>
                </div>
                <div className="border rounded p-3 bg-orange-50 border-orange-200">
                  <div className="text-xs font-bold text-orange-600 uppercase">Yaralı</div>
                  <div className="text-xl font-black text-orange-700 mt-1">{incident.injuredCount || 0}</div>
                </div>
                <div className="border rounded p-3 bg-red-50 border-red-200">
                  <div className="text-xs font-bold text-red-600 uppercase">Ölü</div>
                  <div className="text-xl font-black text-red-700 mt-1">{incident.deceasedCount || 0}</div>
                </div>
              </div>
            </section>

            {/* Section 4: Detaylı Açıklamalar */}
            <section>
              <h3 className="text-sm font-bold bg-purple-100 text-purple-900 py-1.5 px-3 uppercase border-l-4 border-purple-700 mb-3">
                4. Olay Detayları ve Değerlendirme
              </h3>
              
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-bold text-gray-800 border-b pb-1 mb-2">Olayın Gerçekleşme Şekli (Özet)</h4>
                  <p className="text-gray-700 italic bg-gray-50 p-3 rounded border">
                    "{incident.incidentMode || '-'}"
                  </p>
                </div>

                {incident.causeDetail && (
                  <div>
                    <h4 className="font-bold text-gray-800 border-b pb-1 mb-2">Olayın Nedeni Detay</h4>
                    <p className="text-gray-700">{incident.causeDetail}</p>
                  </div>
                )}

                {incident.detectedEffect && (
                  <div>
                    <h4 className="font-bold text-gray-800 border-b pb-1 mb-2">Tespit Edilebilen Etki</h4>
                    <p className="text-gray-700">{incident.detectedEffect}</p>
                  </div>
                )}

                {incident.observations && (
                  <div>
                    <h4 className="font-bold text-gray-800 border-b pb-1 mb-2">Olaya İlişkin Tespitler</h4>
                    <p className="text-gray-700">{incident.observations}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-bold text-gray-800 border-b pb-1 mb-2">Alınan Aksiyonlar</h4>
                  <p className="text-gray-700 font-medium whitespace-pre-wrap">{incident.actionsTaken || '-'}</p>
                </div>

                <div className="bg-purple-50 p-3 border border-purple-100 rounded">
                  <h4 className="font-bold text-purple-900 border-b border-purple-200 pb-1 mb-2">Sonuç / Değerlendirme</h4>
                  <p className="text-purple-800 whitespace-pre-wrap">{incident.resultEvaluation || '-'}</p>
                </div>
              </div>
            </section>

            {/* Footer / Signatures */}
            <div className="pt-12 mt-12 border-t flex justify-between px-10">
              <div className="text-center">
                <p className="text-xs font-bold uppercase mb-8">Bildirimi Yapan</p>
                <p className="text-sm border-t border-gray-400 pt-1 min-w-[150px] inline-block mx-auto">{incident.creator?.fullName || incident.createdBy || 'Bilinmiyor'}</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-bold uppercase mb-8">Onaylayan Yöneticisi</p>
                <p className="text-sm border-t border-gray-400 pt-1 w-32 mx-auto">İmza</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default HazmatIncidentReportPage;

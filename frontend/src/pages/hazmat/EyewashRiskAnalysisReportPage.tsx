import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Download, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

const api = {
  get: async (url: string) => {
    const res = await fetch(`/api${url}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    if (!res.ok) throw new Error('API Error');
    return res;
  }
};

const getFineKinneyResult = (score: number) => {
  if (score > 400) return { label: 'TOLERANS GÖSTERİLEMEZ RİSK', color: 'bg-red-600 text-white', points: 5 };
  if (score > 200) return { label: 'YÜKSEK RİSK', color: 'bg-red-500 text-white', points: 4 };
  if (score > 70) return { label: 'ÖNEMLİ RİSK', color: 'bg-orange-500 text-white', points: 3 };
  if (score > 20) return { label: 'OLASI RİSK', color: 'bg-yellow-500 text-black', points: 2 };
  return { label: 'ÖNEMSİZ RİSK', color: 'bg-green-500 text-white', points: 1 };
};

export default function EyewashRiskAnalysisReportPage() {
  const navigate = useNavigate();
  const facilityId = localStorage.getItem('activeFacilityId');
  const [isExporting, setIsExporting] = useState(false);

  const { data: analyses, isLoading } = useQuery({
    queryKey: ['eyewash-risk', facilityId],
    queryFn: async () => {
      const res = await api.get(`/hazmat/eyewash-risk?facilityId=${facilityId}`);
      return res.json();
    },
    enabled: !!facilityId
  });

  const { data: facilities } = useQuery({
    queryKey: ['facilities'],
    queryFn: async () => {
      try {
        const res = await api.get('/settings/facilities');
        return res.json();
      } catch {
        return [];
      }
    }
  });

  const facilityName = facilities?.find((f: any) => f.id === facilityId)?.name || 'Tesis Bilinmiyor';

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      const element = document.getElementById('pdf-report-content');
      if (!element) return;

      // Tablonun sağ tarafının kesilmemesi için geçici olarak genişliği tam açıyoruz
      const originalOverflow = element.style.overflowX;
      const originalWidth = element.style.width;
      const originalMinWidth = element.style.minWidth;
      
      element.style.overflowX = 'visible';
      element.style.width = 'fit-content';
      element.style.minWidth = 'min-content';

      // Convert HTML table to high-quality PNG image natively
      const dataUrl = await toPng(element, { 
        quality: 1, 
        pixelRatio: 2, 
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight
      });
      
      // Eski haline geri alıyoruz
      element.style.overflowX = originalOverflow;
      element.style.width = originalWidth;
      element.style.minWidth = originalMinWidth;
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a3'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (element.scrollHeight * pdfWidth) / element.scrollWidth;
      
      pdf.addImage(dataUrl, 'PNG', 5, 5, pdfWidth - 10, pdfHeight - 10);
      pdf.save('Goz_Yikama_Risk_Raporu.pdf');
    } catch (err) {
      console.error("PDF oluşturma hatası:", err);
      alert("PDF oluşturulurken bir hata meydana geldi.");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) return <div className="p-6">Yükleniyor...</div>;

  return (
    <div className="bg-white min-h-screen text-black">
      <style>
        {`
          @media print {
            @page { size: landscape; margin: 5mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: sans-serif; }
            .print-hide { display: none !important; }
            .print-container { width: 100%; max-width: none; padding: 0; margin: 0; }
            table { border-collapse: collapse; width: 100%; table-layout: fixed; }
            th, td { border: 1px solid #000; padding: 2px; font-size: 8px; text-align: center; vertical-align: middle; word-wrap: break-word; }
            .col-no { width: 1.5%; }
            .col-date { width: 4%; }
            .col-dept { width: 6%; }
            .col-chem { width: 2.5%; }
            .col-incident { width: 3%; }
            .col-risk { width: 2%; }
            .col-eval { width: 12%; }
            .col-req { width: 4%; }
            .col-action { width: 10%; }
            .col-improve { width: 5%; }
          }
          
          /* Ekran görünümü için varsayılan ayarlar */
          @media screen {
            table { border-collapse: collapse; width: 100%; min-width: 1800px; }
            th, td { border: 1px solid #d1d5db; padding: 4px; font-size: 11px; text-align: center; vertical-align: middle; }
          }
          
          /* html-to-image export sırasında yazıcı ayarlarının bir kısmını taklit etmek için container içi css */
          #pdf-report-content {
            background: white;
            padding: 20px;
          }
          #pdf-report-content table {
             min-width: max-content;
          }
          #pdf-report-content table th, #pdf-report-content table td {
            font-size: 14px;
            padding: 8px;
            border: 1px solid #000;
            text-align: center;
            vertical-align: middle;
            word-wrap: break-word;
          }
          #pdf-report-content h1 { font-size: 28px; }
          #pdf-report-content h2 { font-size: 22px; }
        `}
      </style>

      <div className="p-6 print-hide flex justify-between items-center bg-gray-50 border-b">
        <Button variant="ghost" onClick={() => navigate('/hazmat/eyewash-risk')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Geri Dön
        </Button>
        <div className="flex gap-2">
          <Button onClick={() => window.print()} variant="outline" className="bg-white">
            <Printer className="w-4 h-4 mr-2" /> Yazdır
          </Button>
          <Button onClick={handleDownloadPDF} disabled={isExporting} className="bg-red-600 hover:bg-red-700 text-white">
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            {isExporting ? 'Hazırlanıyor...' : 'PDF İndir'}
          </Button>
        </div>
      </div>

      <div className="p-4 overflow-x-auto print-container" id="pdf-report-content">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black uppercase tracking-wide">{facilityName}</h1>
          <h2 className="text-xl font-bold text-gray-700 uppercase tracking-widest mt-2">Göz Yıkama / Boy Duşu Risk Analizi Raporu</h2>
        </div>

        <table className="border-black">
          <thead>
            <tr>
              <th rowSpan={2} className="bg-gray-200 border-black border font-bold w-12">No</th>
              <th rowSpan={2} className="bg-gray-200 border-black border font-bold w-24">Analiz Tarihi</th>
              <th rowSpan={2} className="bg-gray-200 border-black border font-bold w-32">Birim / Bölüm</th>
              
              <th colSpan={8} className="bg-[#fce4d6] border-black border font-bold">Madde Türleri ve Miktarları (Litre)</th>
              <th colSpan={2} className="bg-[#e6b8b7] border-black border font-bold">İş Kazası ve Ramak Kala Olay Bilgileri</th>
              
              <th colSpan={5} className="bg-[#d9e1f2] border-black border font-bold">Kimyasal Maruziyet Risk Analizi</th>
              <th colSpan={5} className="bg-[#e2efda] border-black border font-bold">Kan-Vücut Sıvısı Maruziyet Risk Analizi</th>
              
              <th rowSpan={2} className="bg-gray-200 border-black border font-bold w-48">Değerlendirme</th>
              <th rowSpan={2} className="bg-gray-200 border-black border font-bold w-32">Göz Duşu İhtiyacı Bakımından Seviyesi</th>
              <th rowSpan={2} className="bg-gray-200 border-black border font-bold w-48">Aksiyon Planı</th>
              
              <th colSpan={6} className="bg-[#fff2cc] border-black border font-bold">İyileştirme Takibi ve Etkinlik Ölçümü</th>
            </tr>
            <tr>
              {/* Madde Türleri */}
              <th className="bg-[#fce4d6] border-black border font-bold w-20">Yanıcı</th>
              <th className="bg-[#fce4d6] border-black border font-bold w-20">Aşındırıcı</th>
              <th className="bg-[#fce4d6] border-black border font-bold w-20">Tahriş</th>
              <th className="bg-[#fce4d6] border-black border font-bold w-20">Oksitleyici</th>
              <th className="bg-[#fce4d6] border-black border font-bold w-20">Toksik</th>
              <th className="bg-[#fce4d6] border-black border font-bold w-20">Kanserojen</th>
              <th className="bg-[#fce4d6] border-black border font-bold w-20">Bulaşıcı</th>
              <th className="bg-[#fce4d6] border-black border font-bold w-24">Toplam</th>
              
              {/* İş Kazası */}
              <th className="bg-[#e6b8b7] border-black border font-bold w-32">Son 1 Yılda Gerçekleşen Kimyasal / Kan-Vücut Sıvısı Maruziyeti Sayısı</th>
              <th className="bg-[#e6b8b7] border-black border font-bold w-32">Son 1 Yılda Yaşanan Kimyasal / Kan-Vücut Sıvısı Ramak Kala Olay Sayısı</th>
              
              {/* Kimyasal */}
              <th className="bg-[#d9e1f2] border-black border font-bold w-12">O</th>
              <th className="bg-[#d9e1f2] border-black border font-bold w-12">F</th>
              <th className="bg-[#d9e1f2] border-black border font-bold w-12">Ş</th>
              <th className="bg-[#d9e1f2] border-black border font-bold w-20">Risk Puanı</th>
              <th className="bg-[#d9e1f2] border-black border font-bold w-24">Risk Sınıfı</th>
              
              {/* Biyolojik */}
              <th className="bg-[#e2efda] border-black border font-bold w-12">O</th>
              <th className="bg-[#e2efda] border-black border font-bold w-12">F</th>
              <th className="bg-[#e2efda] border-black border font-bold w-12">Ş</th>
              <th className="bg-[#e2efda] border-black border font-bold w-20">Risk Puanı</th>
              <th className="bg-[#e2efda] border-black border font-bold w-24">Risk Sınıfı</th>
              
              {/* İyileştirme */}
              <th className="bg-[#fff2cc] border-black border font-bold w-40">İyileştirme Açıklaması</th>
              <th className="bg-[#fff2cc] border-black border font-bold w-32">İyileştirme Tamamlanma Tarihi</th>
              <th className="bg-[#fff2cc] border-black border font-bold w-32">Etkinlik Ölçüm Yöntemi</th>
              <th className="bg-[#fff2cc] border-black border font-bold w-32">İyileştirme Kontrol Sorumlusu</th>
              <th className="bg-[#fff2cc] border-black border font-bold w-24">İyileştirme Sonrası Görsel</th>
              <th className="bg-[#fff2cc] border-black border font-bold w-32">Sonuç</th>
            </tr>
          </thead>
          <tbody>
            {analyses?.map((row: any, i: number) => {
              const chemRes = getFineKinneyResult(row.chemScore || 0);
              const bioRes = getFineKinneyResult(row.bioScore || 0);
              const details = row.chemicalDetails || {};
              const totalLiters = Object.values(details).reduce((sum: number, val: any) => sum + (parseFloat(val) || 0), 0);
              
              let reqColor = "bg-[#e2efda]"; // Default Green-ish
              if (row.eyewashRequirementLevel === 'Yüksek Riskli Alanlar') reqColor = "bg-[#e6b8b7]"; // Red-ish
              else if (row.eyewashRequirementLevel === 'Orta Riskli Alanlar') reqColor = "bg-[#fff2cc]"; // Yellow-ish

              const exposureSum = (row.chemExposureCount || 0) + (row.bioExposureCount || 0);
              const nearMissSum = (row.chemNearMissCount || 0) + (row.bioNearMissCount || 0);

              return (
                <tr key={row.id}>
                  <td className="border-black border">{i + 1}</td>
                  <td className="border-black border">{new Date(row.analysisDate).toLocaleDateString('tr-TR')}</td>
                  <td className="border-black border font-bold">{row.department}</td>
                  
                  {/* Chemicals */}
                  <td className="border-black border">{details.yanici || 0}</td>
                  <td className="border-black border">{details.asindirici || 0}</td>
                  <td className="border-black border">{details.tahrisedici || 0}</td>
                  <td className="border-black border">{details.oksitleyici || 0}</td>
                  <td className="border-black border">{details.toksik || 0}</td>
                  <td className="border-black border">{details.kanserojen || 0}</td>
                  <td className="border-black border">{details.bulasici || 0}</td>
                  <td className="border-black border font-bold">{totalLiters}</td>
                  
                  {/* Accidents */}
                  <td className="border-black border">{exposureSum}</td>
                  <td className="border-black border">{nearMissSum}</td>
                  
                  {/* Chem Risk */}
                  <td className="border-black border">{row.chemProbability || 0}</td>
                  <td className="border-black border">{row.chemFrequency || 0}</td>
                  <td className="border-black border">{row.chemSeverity || 0}</td>
                  <td className="border-black border font-bold">{row.chemScore || 0}</td>
                  <td className="border-black border font-bold leading-tight px-2 py-2 text-xs">{chemRes.label}</td>
                  
                  {/* Bio Risk */}
                  <td className="border-black border">{row.bioProbability || 0}</td>
                  <td className="border-black border">{row.bioFrequency || 0}</td>
                  <td className="border-black border">{row.bioSeverity || 0}</td>
                  <td className="border-black border font-bold">{row.bioScore || 0}</td>
                  <td className="border-black border font-bold leading-tight px-2 py-2 text-xs">{bioRes.label}</td>
                  
                  {/* Evaluation */}
                  <td className="border-black border text-left px-2 py-2 leading-tight text-sm">{row.evaluationNotes || '-'}</td>
                  
                  {/* Requirement Level */}
                  <td className={`border-black border font-bold px-2 py-2 text-sm ${reqColor}`}>{row.eyewashRequirementLevel || '-'}</td>
                  
                  {/* Action Plan */}
                  <td className="border-black border text-left px-2 py-2 leading-tight text-sm">{row.actionPlan || '-'}</td>
                  
                  {/* Improvement Tracking */}
                  <td className="border-black border text-left px-2 py-2 leading-tight text-sm">{row.improvementDescription || '-'}</td>
                  <td className="border-black border text-sm">{row.improvementTargetDate ? new Date(row.improvementTargetDate).toLocaleDateString('tr-TR') : '-'}</td>
                  <td className="border-black border leading-tight text-sm">{row.effectivenessMethod || '-'}</td>
                  <td className="border-black border leading-tight text-sm">{row.improvementController || '-'}</td>
                  <td className="border-black border leading-tight px-2 py-2 text-sm">
                    {row.improvementImageUrl ? <a href={row.improvementImageUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">Görsel</a> : '-'}
                  </td>
                  <td className="border-black border text-left px-2 py-2 leading-tight text-sm">{row.improvementResult || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

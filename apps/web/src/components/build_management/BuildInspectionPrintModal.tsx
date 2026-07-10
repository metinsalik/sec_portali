import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

interface BuildInspectionPrintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inspection: any;
  project: any;
}

const OHS_QUESTIONS = [
  "Çalışma alanı yetkisiz girişe karşı kapatıldı mı?",
  "Yalnızca önceden bildirilen ve evrakları eksiksiz olan kişiler mi çalıştırılıyor?",
  "Yetkilendirilen alan ve iş dışında herhangi bir çalışma yapılıyor mu?",
  "Çalışanların KKD'leri işe uygun ve eksiksiz şekilde kullanılıyor mu?",
  "Alanda uyarı/ikaz levhaları uygun mu? Eksiksiz şekilde bulunuyor mu?",
  "Çalışma alanında yangın söndürme cihazları kullanıma hazır şekilde bulunuyor mu?",
  "El aletleri çalışma için uygun mu? Güvenli şekilde muhafaza ediliyor ve kullanılıyor mu?",
  "Elektrikli el aletleri çalışma için uygun mu? Güvenli şekilde muhafaza ediliyor ve kullanılıyor mu?",
  "Taşıma - istifleme aletleri uygun mu? Güvenli şekilde muhafaza ediliyor ve kullanılıyor mu?",
  "Tehlikeli maddeler çalışma için uygun mu? Güvenli şekilde muhafaza ediliyor ve kullanılıyor mu?",
  "Aydınlatma uygun ve yeterli mi? Aydınlatma sistemleri çalışıyor mu?",
  "Sıcaklık ve nem uygun mu? Havalandırma yeterli mi?",
  "Gürültü koşulları uygun mu?",
  "Altyapı Sistemlerini korumaya yönelik önlemler alınmış ve yetkisiz müdahaleden kaçınılıyor mu?",
  "Düşmeye neden olacak boşluklara yönelik tedbirler alınmış mı? Bu tedbirler uygulanıyor mu?",
  "İstifleme alanlarında malzeme düşmesi / devrilmesi gibi durumlara karşı önlemler alınmış mı?",
  "Acil Kaçış Yolları ve Acil Çıkışlar yabancı malzemeden arındırılmış ve kullanılabilir durumda mı?",
  "Atıklar belirlenen alanlarda düzenli şekilde depolanıyor mu?"
];

const INFECTION_CLASS_QUESTIONS: Record<string, string[]> = {
  "Sınıf I": [
    "İnşaat operasyonlarından toz kalkmasını en aza indirgeyecek metodlarla çalışma yürütülür.",
    "Görsel olarak inceleme için çıkarılan tavan kapağı hemen yerleştirilir."
  ],
  "Sınıf II": [
    "Tozun atmosfere yayılmasını engellemek için aktif yollar bulunur.",
    "Keserken tozu kontrol etmek için çalışma yüzeyi nemlendirilir.",
    "Kanal bantları ile kullanılmayan kapıların açıklıkları kapatılır.",
    "Hava girişleri ve açıklıklarıda kapatılır.",
    "Çalışma bölgesinin giriş ve çıkışına toz tutucu bir materyal yerleştirilir.",
    "Çalışmanın uygulandığı bölgede mevcut havalandırma sistemi kaldırılır veya izole edilir.",
    "İnşaat atığı transport edilmeden önce kapağı sıkı kapalı kaplarda toplanır."
  ],
  "Sınıf III": [
    "Mevcut havalandırma sistemi kanalın kontaminasyonunu engellemek için çalışma yapılan bölgede kaldırılır veya izole edilir.",
    "Çalışma bölgesini çalışma dışı bölgelere kapatmak için bariyerler tamamlanır.",
    "HEPA ile donanımlı hava filtrasyon birimleri kullanılarak çalışma bölgesi içinde negatif basıncı idame ettirilir.",
    "İnşaat işçileri çalışma bölgesinden hasta bakım bölgelerine giderken koruyucu elbise (örn; önlük, galoş) giyilir."
  ],
  "Sınıf IV": [
    "Delik, kanal ve kablo girişleri uygun olarak kapatılır.",
    "Çalışma bölgesine giren tüm personel galoş giyer. İşçilerin çalışma alanından çıktığı her seferde galoş değiştirilir."
  ]
};

const getQuestionsForClass = (icraClass: string) => {
  let classesToInclude: string[] = [];
  if (icraClass === 'Sınıf I') classesToInclude = ['Sınıf I'];
  else if (icraClass === 'Sınıf II') classesToInclude = ['Sınıf I', 'Sınıf II'];
  else if (icraClass === 'Sınıf III') classesToInclude = ['Sınıf I', 'Sınıf II', 'Sınıf III'];
  else if (icraClass === 'Sınıf IV') classesToInclude = ['Sınıf I', 'Sınıf II', 'Sınıf III', 'Sınıf IV'];
  else classesToInclude = ['Sınıf I', 'Sınıf II', 'Sınıf III', 'Sınıf IV']; 

  return classesToInclude.flatMap(c => INFECTION_CLASS_QUESTIONS[c]);
};

export function BuildInspectionPrintModal({ open, onOpenChange, inspection, project }: BuildInspectionPrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printRef.current) return;
    
    const printWindow = document.createElement('iframe');
    printWindow.style.position = 'absolute';
    printWindow.style.top = '-10000px';
    printWindow.style.left = '-10000px';
    document.body.appendChild(printWindow);

    const doc = printWindow.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <html>
          <head>
            <title>İSG Kontrol Formu</title>
            <style>
              @page { size: auto; margin: 5mm; }
              body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 0; 
                background: white; 
                color: black;
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact; 
                font-size: 9px;
              }
              .print-container { 
                width: 100%; 
                margin: 0 auto; 
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                min-height: 95vh;
              }
              
              /* Reset tables */
              table { width: 100%; border-collapse: collapse; margin-bottom: 4px; table-layout: fixed; }
              th, td { border: 1px solid #000; padding: 2px 3px; }
              th { background-color: #f1f2f5; font-weight: bold; text-align: center; font-size: 9px; }
              .bg-gray { background-color: #f1f2f5; font-weight: bold; }
              
              /* Header Section */
              .title-box { text-align: center; font-size: 12px; font-weight: bold; padding: 4px 0; display: flex; align-items: center; justify-content: center; position: relative; margin-bottom: 4px;}
              .title-box img { position: absolute; left: 0; top: 50%; transform: translateY(-50%); height: 24px; width: auto; }
              
              /* Info Table */
              .info-table td { font-size: 9px; padding: 2px 4px; }
              .info-table td:nth-child(odd) { width: 20%; background-color: #f1f2f5; font-weight: bold; }
              .info-table td:nth-child(even) { width: 80%; }
              
              /* Checklist Table */
              .checklist-table th:nth-child(1) { width: 5%; }
              .checklist-table th:nth-child(2) { width: 80%; }
              .checklist-table th:nth-child(3),
              .checklist-table th:nth-child(4),
              .checklist-table th:nth-child(5) { width: 5%; text-align: center; }
              
              .checklist-table td { font-size: 8.5px; padding: 2px 3px; }
              .checklist-table td.center { text-align: center; font-size: 10px; line-height: 1; }
              .checklist-table td.number { text-align: center; font-weight: bold; }
              
              /* Notes Table */
              .notes-table th { text-align: center; background-color: #f1f2f5; }
              .notes-table td { height: 25px; vertical-align: top; }
              
              /* Result Table */
              .result-table th { background-color: #f1f2f5; text-align: center; }
              .result-table .result-text { text-align: center; padding: 2px; border-bottom: none; font-size: 8.5px; }
              .result-table .result-options { text-align: center; padding: 4px; border-top: none; font-weight: bold; font-size: 10px; }
              .result-options span { display: inline-flex; align-items: center; margin: 0 15px; }
              .text-green { color: #00b050; }
              .text-red { color: #ff0000; }
              .checkbox-icon { font-size: 14px; margin-right: 4px; color: #000; }
              
              /* Signatures Table */
              .sig-table { margin-bottom: 0; }
              .sig-table th { width: 40%; background-color: #f1f2f5; }
              .sig-table td { font-size: 8.5px; padding: 2px 4px; }
              .sig-table td.label-col { width: 20%; background-color: #f1f2f5; font-weight: bold; }
              .sig-table td.val-col { width: 40%; }
              
              /* Footer */
              .footer { display: flex; justify-content: space-between; font-size: 8px; margin-top: auto; padding-top: 4px; }
              
            </style>
          </head>
          <body>
            <div class="print-container">
              ${printRef.current.innerHTML}
            </div>
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        printWindow.contentWindow?.focus();
        printWindow.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(printWindow);
        }, 1000);
      }, 500);
    }
  };

  if (!inspection || !project) return null;

  const isUygun = inspection.result === 'UYGUNDUR';
  const isInfection = inspection.type === 'infection';
  
  const formTitle = isInfection 
    ? 'İNŞAAT BAŞLANGIÇ ONAY VE İNŞAAT SÜRESİNCE ENFEKSİYON KONTROL FORMU'
    : 'İNŞAAT ALANLARI İSG GÜNLÜK KONTROL FORMU';
    
  const formCode = isInfection ? 'ENF-F15/02' : 'İSG-F56/00';
  const unvan = isInfection ? 'Enfeksiyon Kontrol Hemşiresi' : 'İSG Uzmanı';
  
  const activeQuestions = isInfection 
    ? getQuestionsForClass(project.icraClass || 'Sınıf IV')
    : OHS_QUESTIONS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-100">
        
        <div className="flex justify-between items-center mb-4 border-b border-slate-300 pb-4">
          <h2 className="text-xl font-bold">Denetim Raporu Ön İzleme</h2>
          <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white">
            <span className="material-symbols-outlined mr-2">print</span>
            Yazdır / PDF
          </Button>
        </div>

        {/* PRINTABLE AREA (Hidden from actual DOM styling, handled via iframe) */}
        <div className="bg-white mx-auto shadow-lg" style={{ width: '210mm', minHeight: '297mm', padding: '10mm' }}>
          <div ref={printRef}>
            
            {/* Header / Logo */}
            <div className="title-box">
              <img src="/mlpcare.jpg" alt="Logo" />
              ${formTitle}
            </div>

            {/* Info Table */}
            <table className="info-table">
              <tbody>
                <tr>
                  <td>Proje Adı:</td>
                  <td>{project.name}</td>
                </tr>
                <tr>
                  <td>Çalışma Alanı:</td>
                  <td>{project.workArea || ''}</td>
                </tr>
              </tbody>
            </table>

            {/* Checklist Table */}
            <table className="checklist-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Kontrol Kriterleri</th>
                  <th>U</th>
                  <th>UD</th>
                  <th>KD</th>
                </tr>
              </thead>
              <tbody>
                {activeQuestions.map((q, idx) => {
                  const answer = inspection.checklistData[(idx + 1).toString()];
                  const U = answer === 'U' ? '☑' : '☐';
                  const UD = answer === 'UD' ? '☑' : '☐';
                  const KD = answer === 'KD' ? '☑' : '☐';

                  return (
                    <tr key={idx}>
                      <td className="number">{idx + 1}.</td>
                      <td>{q}</td>
                      <td className="center">{U}</td>
                      <td className="center">{UD}</td>
                      <td className="center">{KD}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Notes Table */}
            <table className="notes-table">
              <thead>
                <tr>
                  <th>Notlar</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td></td>
                </tr>
              </tbody>
            </table>

            {/* Result Table */}
            <table className="result-table">
              <thead>
                <tr>
                  <th>Kontrol Sonucu</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="result-text">Yukarıdaki şartlar altında kontrolü gerçekleştirilmiş bölge çalışmaya;</td>
                </tr>
                <tr>
                  <td className="result-options">
                    <span className="text-green"><span className="checkbox-icon">{isUygun ? '☑' : '☐'}</span> UYGUNDUR</span>
                    <span className="text-red"><span className="checkbox-icon">{!isUygun ? '☑' : '☐'}</span> UYGUN DEĞİLDİR</span>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Signatures Table */}
            <table className="sig-table">
              <thead>
                <tr>
                  <th style={{width: '20%'}}></th>
                  <th>Kontrol Eden</th>
                  <th>İşin Sorumlusu</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="label-col">Adı Soyadı:</td>
                  <td className="val-col">{inspection.inspector}</td>
                  <td className="val-col"></td>
                </tr>
                <tr>
                  <td className="label-col">Unvan:</td>
                  <td className="val-col">{unvan}</td>
                  <td className="val-col"></td>
                </tr>
                <tr>
                  <td className="label-col">Tarih:</td>
                  <td className="val-col">{new Date(inspection.inspectionDate).toLocaleDateString('tr-TR')}</td>
                  <td className="val-col"></td>
                </tr>
                <tr>
                  <td className="label-col">İmza:</td>
                  <td className="val-col" style={{height: '30px'}}></td>
                  <td className="val-col"></td>
                </tr>
              </tbody>
            </table>

            {/* Footer */}
            <div className="footer">
              <span>{formCode}</span>
              <span>1/1</span>
            </div>

          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}

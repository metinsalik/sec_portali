import React from 'react';
import type { RenovationReport, RenovationReportFinding } from '@/types/renovationReport';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Props {
  report: RenovationReport;
}

const CATEGORIES = [
  { id: 'altyapi', title: '4.3.1. Altyapı Sistemleri ve Bileşenlerine Yönelik Bulgular', prefix: 'A' },
  { id: 'yangin', title: '4.3.2. Yangın Güvenliğine Yönelik Bulgular', prefix: 'Y' },
  { id: 'acildurum', title: '4.3.3. Acil Durum ve Afet Yönetimi Süreçlerine Yönelik Bulgular', prefix: 'H' },
  { id: 'calisanhasta', title: '4.3.4. Çalışan ve Hasta Güvenliği Süreçlerine Yönelik Bulgular', prefix: 'G' },
  { id: 'mimari', title: '4.3.5. Mimari Perspektifle Düzeltilmesi Gereken Bulgular', prefix: 'M' }
];

export default function RenovationReportPDF({ report }: Props) {
  const getRiskColor = (level: string) => {
    if (level === 'COK_YUKSEK') return '#dc2626'; // bg-red-600
    if (level === 'YUKSEK') return '#f97316';    // bg-orange-500
    if (level === 'ORTA') return '#eab308';      // bg-yellow-500
    return '#64748b';
  };

  const getRiskText = (level: string) => {
    if (level === 'COK_YUKSEK') return 'Çok Yüksek';
    if (level === 'YUKSEK') return 'Yüksek';
    if (level === 'ORTA') return 'Orta';
    return '';
  };

  // Group findings by category and sort by risk level
  const findingsByCategory = CATEGORIES.map(cat => {
    const items = (report.findings?.items || [])
      .filter(item => item.no.startsWith(cat.prefix)) // simplistic matching, or check categoryName
      .sort((a, b) => {
        const order = { 'COK_YUKSEK': 1, 'YUKSEK': 2, 'ORTA': 3 };
        return (order[a.riskLevel] || 99) - (order[b.riskLevel] || 99);
      })
      // re-number them based on sorted order
      .map((item, index) => ({
        ...item,
        no: `${cat.prefix}-${String(index + 1).padStart(3, '0')}`
      }));
    
    return { ...cat, items, intro: report.findings?.intros?.[cat.id] };
  });

  return (
    <div className="pdf-container font-sans text-sm" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', backgroundColor: 'white' }}>
      <style>
        {`
          @media print {
            @page { size: A4 portrait; margin: 0; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .page-break { page-break-before: always; }
          }
          .pdf-page {
            width: 210mm;
            min-height: 297mm;
            padding: 20mm;
            box-sizing: border-box;
            position: relative;
            background: white;
            border: 1px solid #eee;
            margin-bottom: 20px;
          }
          @media print {
            .pdf-page { border: none; margin-bottom: 0; }
          }
        `}
      </style>

      {/* PAGE 1: COVER */}
      <div className="pdf-page bg-white relative overflow-hidden flex flex-col justify-between" style={{ padding: '0' }}>
        <div style={{ position: 'absolute', top: 0, right: '30mm', width: '25mm', height: '40mm', backgroundColor: '#f59e0b', zIndex: 10, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '5mm', color: 'white', fontWeight: 'bold' }}>
          {report.reportDate ? new Date(report.reportDate).getFullYear() : '2026'}
        </div>
        
        <div style={{ height: '65%', backgroundColor: '#475569', borderBottomLeftRadius: '50% 10%', borderBottomRightRadius: '50% 10%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20mm', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '20mm', left: '20mm', right: '20mm', border: '5px solid white', bottom: '-80mm', pointerEvents: 'none', zIndex: 1 }} />
          
          <div style={{ textAlign: 'center', marginBottom: '40mm', zIndex: 2 }}>
            <img src="/mlpcare.jpg" alt="MLPCARE" style={{ maxWidth: '300px', margin: '0 auto', filter: 'brightness(0) invert(1)' }} />
          </div>
          
          <div style={{ zIndex: 2 }}>
            <h1 style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', textTransform: 'uppercase', lineHeight: '1.2' }}>
              İNŞAAT/RENOVASYON ÇALIŞMASI<br/>SONRASI TESLİM ALMA RAPORU
            </h1>
          </div>
        </div>
        
        <div style={{ padding: '20mm', paddingTop: '10mm', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ marginBottom: 'auto', paddingTop: '10mm' }}>
            <p style={{ color: '#475569', fontSize: '16px' }}>{report.reportDate ? format(new Date(report.reportDate), 'dd MMMM yyyy', { locale: tr }).toUpperCase() : ''}</p>
            <h2 style={{ color: '#334155', fontSize: '18px', fontWeight: 'bold' }}>{report.projectName?.toUpperCase() || ''}</h2>
          </div>
          
          <div>
            <p style={{ color: '#475569', fontSize: '12px', fontWeight: 'bold' }}>MLPCARE | SAĞLIK EMNİYET ÇEVRE DİREKTÖRLÜĞÜ</p>
          </div>
        </div>
      </div>

      {/* PAGE 2: İÇİNDEKİLER */}
      <div className="pdf-page page-break flex flex-col">
        <div className="flex-1">
          <h2 className="text-xl font-bold mb-6">İçindekiler</h2>
          <div className="space-y-3 font-medium">
            <div className="flex justify-between"><span>1. ÖZET</span> <span>2</span></div>
            <div className="flex justify-between"><span>2. PROJE BİLGİLERİ</span> <span>3</span></div>
            <div className="flex justify-between"><span>3. KAPSAM</span> <span>3</span></div>
            <div className="flex justify-between"><span>4. İNCELEME VE UYGUNLUK DEĞERLENDİRMESİ</span> <span>4</span></div>
            <div className="flex justify-between pl-4"><span>4.1. Test ve Fonksiyon Kontrolleri</span> <span>6</span></div>
            <div className="flex justify-between pl-4"><span>4.2. Sertifika ve Uygunluk Beyanları</span> <span>8</span></div>
            <div className="flex justify-between pl-4"><span>4.3. Saha Gözlemleri ve Bulgular</span> <span>9</span></div>
            <div className="flex justify-between pl-8"><span>4.3.1. Altyapı Sistemleri ve Bileşenlerine Yönelik Bulgular</span> <span>9</span></div>
            <div className="flex justify-between pl-8"><span>4.3.2. Yangın Güvenliğine Yönelik Bulgular</span> <span>14</span></div>
            <div className="flex justify-between pl-8"><span>4.3.3. Acil Durum ve Afet Yönetimi Süreçlerine Yönelik Bulgular</span> <span>30</span></div>
            <div className="flex justify-between pl-8"><span>4.3.4. Çalışan ve Hasta Güvenliği Süreçlerine Yönelik Bulgular</span> <span>32</span></div>
            <div className="flex justify-between pl-8"><span>4.3.5. Mimari Perspektifle Düzeltilmesi Gereken Bulgular</span> <span>41</span></div>
            <div className="flex justify-between"><span>5. DEĞERLENDİRME VE SONUÇ</span> <span>72</span></div>
          </div>
        </div>
        <div className="border-t pt-2 flex justify-between font-bold text-xs">
          <span>MLPCARE | HSE</span>
        </div>
      </div>

      {/* PAGE 3: ÖZET */}
      <div className="pdf-page page-break flex flex-col">
        <div className="flex-1">
          <h2 className="text-lg font-bold mb-4">1. ÖZET</h2>
          <div className="space-y-4 text-justify leading-relaxed">
            <p>
              {report.projectName} inşaat ve renovasyon çalışmaları sonrası 
              hazırlanan bu teslim alma raporu, tesisin teknik, güvenlik ve işlevsellik açısından yürürlükteki 
              mevzuatlar, ulusal/uluslararası standartlar ve kurum içi prosedürlere uygunluğunu kapsamlı 
              şekilde değerlendirmek amacıyla hazırlanmıştır. Rapor; elektrik ve mekanik altyapıdan yangın 
              güvenliği ve medikal gaz tesisatına, acil durum yönetiminden mimari düzenlemelere kadar tüm 
              sistemlerin bütünsel denetimini içermektedir.
            </p>
            <p>
              Raporda öne çıkan bulgular; eksik test ve fonksiyon kontrolleri, yangına dayanımı belirsiz
              malzemeler (yangın kapıları, şaft kapakları, kaplama malzemeleri vb.), hasta ve çalışan 
              güvenliğini tehdit eden mimari ve ergonomik eksikliklerdir. Bu uygunsuzluklar; hasta güvenliği
              ve çalışan sağlığı ve güvenliği, hizmet sürekliliği, mevzuata uyum ve kurum itibarı üzerinde 
              doğrudan tehdit oluşturmaktadır.
            </p>
            <p>
              Sonuç olarak, teslim öncesi tespit edilen eksikliklerin yüklenici firma tarafından ivedilikle 
              giderilmesi, tüm test raporları ve sertifikaların eksiksiz şekilde teslim edilmesi ve mevzuata tam 
              uyum sağlanmadan alanın teslim edilmemesi zorunludur. Aksi halde; olası arızalar, yangın, gaz 
              sızıntısı veya elektriksel kazalar gibi en kötü senaryoların gerçekleşmesi halinde can kaybı, 
              hizmetin durması, idari yaptırımlar ve kurum itibar kaybı gibi geri dönülmez sonuçlarla 
              karşılaşılabilecektir.
            </p>
          </div>
        </div>
        <div className="border-t pt-2 flex justify-between font-bold text-xs">
          <span>MLPCARE | HSE</span>
        </div>
      </div>

      {/* PAGE 4: PROJE BİLGİLERİ VE KAPSAM */}
      <div className="pdf-page page-break flex flex-col">
        <div className="flex-1">
          <h2 className="text-lg font-bold mb-4">2. PROJE BİLGİLERİ</h2>
          <table className="w-full border-collapse mb-8 text-sm">
            <tbody>
              <tr><td className="border p-2 bg-slate-50 w-1/3">Proje Adı</td><td className="border p-2">: {report.projectName}</td></tr>
              <tr><td className="border p-2 bg-slate-50">Lokasyon</td><td className="border p-2">: {report.location}</td></tr>
              <tr><td className="border p-2 bg-slate-50">Proje Başlangıç Tarihi</td><td className="border p-2">: {report.startDate ? format(new Date(report.startDate), 'MMMM yyyy', { locale: tr }) : '-'}</td></tr>
              <tr><td className="border p-2 bg-slate-50">Proje Bitiş Tarihi</td><td className="border p-2">: {report.endDate ? format(new Date(report.endDate), 'MMMM yyyy', { locale: tr }) : '-'}</td></tr>
              <tr><td className="border p-2 bg-slate-50">Kontrol Eden Birim</td><td className="border p-2">: {report.controlledBy}</td></tr>
              <tr><td className="border p-2 bg-slate-50">Değerlendirme Tarihi</td><td className="border p-2">: {report.assessmentDate ? format(new Date(report.assessmentDate), 'dd.MM.yyyy') : '-'}</td></tr>
              <tr><td className="border p-2 bg-slate-50">Rapor Tarihi</td><td className="border p-2">: {report.reportDate ? format(new Date(report.reportDate), 'dd.MM.yyyy') : '-'}</td></tr>
            </tbody>
          </table>

          <h2 className="text-lg font-bold mb-4">3. KAPSAM</h2>
          <div className="space-y-4 text-justify leading-relaxed">
            <p>
              İşbu rapor, {report.projectName} renovasyon çalışmalarında 
              tamamlanmasının ardından, binanın teknik, güvenlik ve işlevsellik 
              açısından uygunluğunun teslim öncesi multidisipliner olarak değerlendirilmesini kapsamaktadır. 
              Değerlendirme, yürürlükteki yasal mevzuatlar, sağlık tesislerine özel standartlar, teknik 
              şartnameler ve kullanıcı güvenliği kriterlerine göre gerçekleştirilmiştir.
            </p>
            <p>
              Kapsam dâhilinde yapılan kontroller; elektrik tesisatı, mekanik sistemler (HVAC, sıhhi tesisat, 
              medikal gaz sistemleri), yangın algılama ve söndürme sistemleri, aydınlatma, zayıf akım 
              sistemleri, donanım sabitlemeleri, mobilya ve geçiş alanları, ortam fiziksel güvenliği, etiketleme 
              ve yönlendirme, hijyen ve temizlik durumu gibi tüm teknik bileşenleri içermektedir. Her bir 
              sistem, hem görsel uygunluk hem de işlevsel performans açısından değerlendirilmiş; 
              gerektiğinde test ve fonksiyon kontrolleri yapılmıştır.
            </p>
            <p>
              Ayrıca, tesisatta kullanılan malzeme ve sistemlere ait test raporları, uygunluk sertifikaları, CE 
              belgeleri, yangın ve gaz sızdırmazlık raporları gibi teknik dokümanların kontrolü sağlanmış; 
              eksik veya beklenen belgeler raporda belirtilmiştir.
            </p>
            <p>
              Değerlendirme sürecinde; yangın güvenliğini riske atabilecek eksiklikler, kullanıcı güvenliğini 
              tehdit eden düzenleme eksiklikleri detaylı şekilde raporlanmış; her biri için öneriler 
              geliştirilmiştir.
            </p>
            <p>
              Sonuç olarak bu rapor, teslim alınacak alanın yapısal, sistemsel ve işlevsel bütünlüğünün 
              incelenerek, alanın hastane hizmetlerine entegre şekilde güvenli ve sürdürülebilir olarak 
              kullanılabilirliğini belgelemeyi amaçlamaktadır.
            </p>
          </div>
        </div>
        <div className="border-t pt-2 flex justify-between font-bold text-xs">
          <span>MLPCARE | HSE</span>
        </div>
      </div>

      {/* PAGE 5: İNCELEME VE UYGUNLUK */}
      <div className="pdf-page page-break flex flex-col">
        <div className="flex-1">
          <h2 className="text-lg font-bold mb-4">4. İNCELEME VE UYGUNLUK DEĞERLENDİRMESİ</h2>
          <div className="mb-4 text-justify leading-relaxed">
            <p>
              İnceleme ve Uygunluk Değerlendirmesi teslim alınması planlanan binanın yürürlükteki 
              mevzuat, teknik şartnameler, tasarım kriterleri ve güvenlik standartlarına uygunluğunu tespit 
              etmek amacıyla gerçekleştirilmiştir. Bu bağlamda değerlendirme sırasında incelenen konular aşağıdaki gibidir.
            </p>
          </div>
          
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="bg-slate-100">
                <th className="border p-2 w-8 text-center">No</th>
                <th className="border p-2">İnceleme Alanı</th>
                <th className="border p-2">Kontrol Kapsamı</th>
                <th className="border p-2 w-16 text-center">Uygunluk<br/>(✓/✖)</th>
              </tr>
            </thead>
            <tbody>
              {report.checks?.map((check, index) => (
                <tr key={check.id}>
                  <td className="border p-2 text-center font-medium">{index + 1}</td>
                  <td className="border p-2">{check.field}</td>
                  <td className="border p-2">{check.scope}</td>
                  <td className="border p-2 text-center font-bold text-base">
                    {check.status === 'UYGUN' ? '✓' : check.status === 'UYGUN_DEGIL' ? '✖' : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t pt-2 flex justify-between font-bold text-xs">
          <span>MLPCARE | HSE</span>
        </div>
      </div>

      {/* PAGE 6: Test ve Fonksiyon Kontrolleri */}
      <div className="pdf-page page-break flex flex-col">
        <div className="flex-1">
          <h2 className="text-lg font-bold mb-4">4.1. Test ve Fonksiyon Kontrolleri</h2>
          <div className="mb-4 text-justify leading-relaxed text-[12px]">
            Bu bölüm, inşaat çalışmaları sonucunda sistemlerin, donanımların ve altyapı bileşenlerinin 
            tasarlandığı şekilde işlev gösterip göstermediğini doğrulamak ve birbirleri ile entegre/ uyumlu 
            çalışıp çalışmadığını incelemek amacıyla yapılan kontrolleri içermektedir.
          </div>
          
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="bg-slate-50">
                <th className="border p-2 text-left w-[20%]">Tesisat</th>
                <th className="border p-2 text-left w-[40%]">Kontrol</th>
                <th className="border p-2 text-center w-[20%]">Durum</th>
                <th className="border p-2 text-left w-[20%]">Açıklama</th>
              </tr>
            </thead>
            <tbody>
              {report.tests?.map((test) => (
                <tr key={test.id}>
                  <td className="border p-2">{test.installation}</td>
                  <td className="border p-2">{test.control}</td>
                  <td className={`border p-2 text-center font-medium ${test.status === 'RAPOR_GORULEMEDI' ? 'text-red-600' : test.status === 'UYGUN' ? 'text-green-600' : ''}`}>
                    {test.status === 'RAPOR_GORULEMEDI' ? 'Rapor Görülemedi' : test.status === 'UYGUN' ? 'Uygun' : 'Uygun Değil'}
                  </td>
                  <td className="border p-2">{test.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t pt-2 flex justify-between font-bold text-xs">
          <span>MLPCARE | HSE</span>
        </div>
      </div>

      {/* PAGE 7: Sertifika ve Uygunluk Beyanları */}
      <div className="pdf-page page-break flex flex-col">
        <div className="flex-1">
          <h2 className="text-lg font-bold mb-4">4.2. Sertifika ve Uygunluk Beyanları</h2>
          <div className="mb-4 text-justify leading-relaxed text-[12px]">
            Bu bölüm, renovasyon kapsamında kullanılan malzeme, ekipman ve sistemlerin ulusal ve/veya 
            uluslararası standartlara uygunluğunu belgeleyen teknik sertifikaları içermektedir.
          </div>
          
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="bg-slate-50">
                <th className="border p-2 text-left w-[20%]">Tesisat/Alan</th>
                <th className="border p-2 text-left w-[40%]">Kontrol</th>
                <th className="border p-2 text-center w-[20%]">Durum</th>
                <th className="border p-2 text-left w-[20%]">Açıklama</th>
              </tr>
            </thead>
            <tbody>
              {report.certificates?.map((cert) => (
                <tr key={cert.id}>
                  <td className="border p-2">{cert.area}</td>
                  <td className="border p-2">{cert.control}</td>
                  <td className={`border p-2 text-center font-medium ${cert.status === 'SERTIFIKA_GORULEMEDI' ? 'text-red-600' : cert.status === 'UYGUN' ? 'text-green-600' : ''}`}>
                    {cert.status === 'SERTIFIKA_GORULEMEDI' ? 'Sertifika / Belge Görülemedi' : cert.status === 'UYGUN' ? 'Uygun' : 'Uygun Değil'}
                  </td>
                  <td className="border p-2">{cert.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t pt-2 flex justify-between font-bold text-xs">
          <span>MLPCARE | HSE</span>
        </div>
      </div>

      {/* FINDINGS INTRO & ITEMS */}
      {findingsByCategory.map((category) => (
        <React.Fragment key={category.id}>
          {/* Category Intro Page */}
          <div className="pdf-page page-break flex flex-col">
            <div className="flex-1">
              <h2 className="text-lg font-bold mb-4">{category.title}</h2>
              {category.intro && (
                <div className="text-justify leading-relaxed text-sm mb-6 whitespace-pre-wrap">
                  {category.intro}
                </div>
              )}
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-xs">
              <span>MLPCARE | HSE</span>
            </div>
          </div>

          {/* Finding Cards */}
          {category.items.map((item) => (
            <div key={item.id} className="pdf-page page-break flex flex-col">
              <div className="flex-1">
                <table className="w-full border-collapse mb-4 text-[12px]">
                  <tbody>
                    <tr>
                      <td className="border p-2 font-bold bg-slate-50 w-1/4">Tespit No:</td>
                      <td className="border p-2 w-1/4">{item.no}</td>
                      <td className="border p-2 font-bold bg-slate-50 w-1/4">Risk Düzeyi:</td>
                      <td className="border p-2 text-center font-bold text-white w-1/4" style={{ backgroundColor: getRiskColor(item.riskLevel) }}>
                        {getRiskText(item.riskLevel)}
                      </td>
                    </tr>
                    <tr>
                      <td className="border p-2 font-bold bg-slate-50">Tespit Kategorisi:</td>
                      <td className="border p-2" colSpan={3}>{item.category}</td>
                    </tr>
                    <tr>
                      <td className="border p-2 font-bold bg-slate-50">Tespit Tanımı:</td>
                      <td className="border p-2" colSpan={3}>{item.definition}</td>
                    </tr>
                    <tr>
                      <td className="border p-2 font-bold bg-slate-100 text-center" colSpan={4}>Tespit Detayları</td>
                    </tr>
                    <tr>
                      <td className="border p-2 font-bold bg-slate-50 text-center">Tespit:</td>
                      <td className="border p-4 text-justify align-top" colSpan={3}>{item.findingText}</td>
                    </tr>
                    <tr>
                      <td className="border p-2 font-bold bg-slate-50 text-center">Risk:</td>
                      <td className="border p-4 text-justify align-top bg-slate-50/50" colSpan={3}>{item.riskText}</td>
                    </tr>
                    <tr>
                      <td className="border p-2 font-bold bg-slate-50 text-center">Öneri:</td>
                      <td className="border p-4 text-justify align-top" colSpan={3}>{item.suggestionText}</td>
                    </tr>
                    <tr>
                      <td className="border p-2 font-bold bg-slate-100 text-center" colSpan={4}>Ek (Form, fotoğraf, vb. doküman)</td>
                    </tr>
                    <tr>
                      <td className="border p-4" colSpan={4}>
                        {item.images && item.images.length > 0 ? (
                          <div className="flex flex-wrap justify-center gap-4">
                            {item.images.map((img, i) => (
                              <img key={i} src={img} style={{ maxWidth: '45%', maxHeight: '250px', objectFit: 'contain' }} alt="Bulgu görseli" />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-10 text-slate-400">Görsel bulunmamaktadır.</div>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-xs">
                <span>MLPCARE | HSE</span>
              </div>
            </div>
          ))}
        </React.Fragment>
      ))}

      {/* FINAL EVALUATION PAGE */}
      <div className="pdf-page page-break flex flex-col">
        <div className="flex-1">
          <h2 className="text-lg font-bold mb-4">5. DEĞERLENDİRME VE SONUÇ</h2>
          <p className="mb-6">
            Çalışmalar yerinde incelenmiş olup, teknik şartnameye, yönetim taleplerine ve kullanıcı 
            beklentilerine <b>uygun / kısmen uygun / uygun değil</b> olarak değerlendirilmiştir.
          </p>
          
          <div className="space-y-2 mb-10 pl-4">
            <div>{report.evaluation?.decision === 'KABUL_EDILDI' ? '☑' : '☐'} Koşulsuz kabul edilmiştir.</div>
            <div>{report.evaluation?.decision === 'KISMI_KABUL' ? '☑' : '☐'} Kısmi eksiklerle birlikte kabul edilmiştir.</div>
            <div>{report.evaluation?.decision === 'GECICI_KABUL' ? '☑' : '☐'} Eksikliklerin tamamlanması şartı ile geçici kabul yapılmıştır.</div>
            <div>{report.evaluation?.decision === 'REDDEDILDI' ? '☑' : '☐'} Kabul edilmemiştir. Yeni düzenleme istenmektedir.</div>
          </div>

          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="border p-3 text-left w-1/3">Unvan / Birim</th>
                <th className="border p-3 text-left w-2/3">Değerlendirme ve Onay</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-3 font-medium">Teknik<br/>Hizmetler<br/>Direktörlüğü</td>
                <td className="border p-0">
                  <div className="h-10 border-b p-2">Not :</div>
                  <div className="h-16 p-2 flex">
                    <div className="w-1/2">Adı Soyadı:<br/>{report.evaluation?.signatures?.teknikHizmetler?.name}</div>
                    <div className="w-1/2 border-l pl-2">İmza/Tarih:<br/>{report.evaluation?.signatures?.teknikHizmetler?.date ? format(new Date(report.evaluation.signatures.teknikHizmetler.date), 'dd.MM.yyyy') : ''}</div>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border p-3 font-medium">İdari İşler<br/>Direktörlüğü</td>
                <td className="border p-0">
                  <div className="h-10 border-b p-2">Not :</div>
                  <div className="h-16 p-2 flex">
                    <div className="w-1/2">Adı Soyadı:<br/>{report.evaluation?.signatures?.idariIsler?.name}</div>
                    <div className="w-1/2 border-l pl-2">İmza/Tarih:<br/>{report.evaluation?.signatures?.idariIsler?.date ? format(new Date(report.evaluation.signatures.idariIsler.date), 'dd.MM.yyyy') : ''}</div>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border p-3 font-medium">Sağlık<br/>Emniyet Çevre<br/>Direktörlüğü</td>
                <td className="border p-0">
                  <div className="h-10 border-b p-2">Not :</div>
                  <div className="h-16 p-2 flex">
                    <div className="w-1/2">Adı Soyadı:<br/>{report.evaluation?.signatures?.sec?.name}</div>
                    <div className="w-1/2 border-l pl-2">İmza/Tarih:<br/>{report.evaluation?.signatures?.sec?.date ? format(new Date(report.evaluation.signatures.sec.date), 'dd.MM.yyyy') : ''}</div>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border p-3 font-medium">Dizayn<br/>Yöneticisi</td>
                <td className="border p-0">
                  <div className="h-10 border-b p-2">Not :</div>
                  <div className="h-16 p-2 flex">
                    <div className="w-1/2">Adı Soyadı:<br/>{report.evaluation?.signatures?.dizayn?.name}</div>
                    <div className="w-1/2 border-l pl-2">İmza/Tarih:<br/>{report.evaluation?.signatures?.dizayn?.date ? format(new Date(report.evaluation.signatures.dizayn.date), 'dd.MM.yyyy') : ''}</div>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border p-3 font-medium">Hastane<br/>İdari Yöneticisi</td>
                <td className="border p-0">
                  <div className="h-10 border-b p-2">Not :</div>
                  <div className="h-16 p-2 flex">
                    <div className="w-1/2">Adı Soyadı:<br/>{report.evaluation?.signatures?.hastaneIdari?.name}</div>
                    <div className="w-1/2 border-l pl-2">İmza/Tarih:<br/>{report.evaluation?.signatures?.hastaneIdari?.date ? format(new Date(report.evaluation.signatures.hastaneIdari.date), 'dd.MM.yyyy') : ''}</div>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border p-3 font-medium">Yüklenici Proje<br/>Sorumlusu</td>
                <td className="border p-0">
                  <div className="h-10 border-b p-2">Not :</div>
                  <div className="h-16 p-2 flex">
                    <div className="w-1/2">Adı Soyadı:<br/>{report.evaluation?.signatures?.yuklenici?.name}</div>
                    <div className="w-1/2 border-l pl-2">İmza/Tarih:<br/>{report.evaluation?.signatures?.yuklenici?.date ? format(new Date(report.evaluation.signatures.yuklenici.date), 'dd.MM.yyyy') : ''}</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mt-8 italic text-xs text-justify">
            İşbu rapor yetmiş iki (72) sayfa olarak hazırlanmış, tüm sayfaları numaralandırılmış ve tarafların 
            imzası ile hüküm ve sonuç doğuracak şekilde imzalanmıştır.
          </div>
        </div>
        <div className="border-t pt-2 flex justify-between font-bold text-xs">
          <span>MLPCARE | HSE</span>
        </div>
      </div>
    </div>
  );
}

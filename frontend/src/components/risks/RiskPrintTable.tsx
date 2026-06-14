import React, { forwardRef } from 'react';
import { format, addYears } from 'date-fns';
import { tr } from 'date-fns/locale';

interface RiskPrintTableProps {
  risks: any[];
  department: any;
  deptCode: string;
}

const LEVEL_COLORS: Record<string, string> = {
  'Tolere Gösterilmez Risk': '#7f1d1d', // Koyu Kırmızı
  'Yüksek Risk':             '#b91c1c', // Kırmızı
  'Önemli Risk':             '#c2410c', // Turuncu
  'Olası Risk':              '#b45309', // Sarı
  'Önemsiz Risk':            '#047857', // Yeşil
  'Bilinmiyor':              '#9ca3af'  // Gri
};

export const RiskPrintTable = forwardRef<HTMLDivElement, RiskPrintTableProps>(
  ({ risks, department, deptCode }, ref) => {
    const facility = department?.facility || {};
    
    // Sort risks: highest initialScore first
    const sortedRisks = [...risks].sort((a, b) => {
      const scoreA = Number(a.initialScore) || 0;
      const scoreB = Number(b.initialScore) || 0;
      return scoreB - scoreA;
    });

    const currentDate = format(new Date(), 'dd.MM.yyyy');
    const validUntilDate = format(addYears(new Date(), 2), 'dd.MM.yyyy');

    return (
      <div ref={ref} style={{ padding: '10px', fontFamily: 'Arial, sans-serif', color: '#000', backgroundColor: '#fff', width: '100%', boxSizing: 'border-box' }}>
        
        {/* HEADER TITLE */}
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <h1 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0' }}>TEHLİKE BELİRLEME VE RİSK DEĞERLENDİRME TABLOSU (FINE KINNEY METODU)</h1>
        </div>

        {/* HEADER INFO TABLE */}
        <table style={{ width: '100%', marginBottom: '10px', borderCollapse: 'collapse', fontSize: '8px', border: '1px solid #000' }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', width: '15%', backgroundColor: '#f3f4f6' }}>Değerlendirilen Birim / Bölüm</td>
              <td style={{ border: '1px solid #000', padding: '4px', width: '15%' }}>{department?.name || '-'}</td>
              <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', width: '5%', backgroundColor: '#f3f4f6' }}>Diğer</td>
              <td style={{ border: '1px solid #000', padding: '4px', width: '5%' }}>-</td>
              <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', width: '10%', backgroundColor: '#f3f4f6' }}>Diğer ise belirtiniz;</td>
              <td style={{ border: '1px solid #000', padding: '4px', width: '20%' }}>-</td>
              <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', width: '10%', backgroundColor: '#f3f4f6' }}>Risk Değ. Güncelleme Tarihi</td>
              <td style={{ border: '1px solid #000', padding: '4px', width: '5%' }}>{currentDate}</td>
              <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', width: '10%', backgroundColor: '#f3f4f6' }}>Geçerlilik Tarihi</td>
              <td style={{ border: '1px solid #000', padding: '4px', width: '5%' }}>{validUntilDate}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', backgroundColor: '#f3f4f6' }}>İşyeri Unvanı, Adresi</td>
              <td colSpan={5} style={{ border: '1px solid #000', padding: '4px' }}>
                {facility.commercialTitle || facility.name || '-'}, {facility.fullAddress || ''} {facility.district ? `${facility.district}/` : ''}{facility.city || ''}
              </td>
              <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', backgroundColor: '#f3f4f6' }} colSpan={2}>Kullanılan Metod</td>
              <td style={{ border: '1px solid #000', padding: '4px' }} colSpan={2}>Fine-Kinney Metodu</td>
            </tr>
          </tbody>
        </table>

        {/* MAIN TABLE */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '6px', textAlign: 'center', tableLayout: 'fixed', wordWrap: 'break-word' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              <th style={{ border: '1px solid #000', padding: '2px', width: '2%' }} rowSpan={2}>No</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '3%' }} rowSpan={2}>Tespit Tarihi</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '4%' }} rowSpan={2}>Risk Kategorisi</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '4%' }} rowSpan={2}>Alt Risk Kategorisi</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '4%' }} rowSpan={2}>Alan</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '4%' }} rowSpan={2}>Faaliyet</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '4%' }} rowSpan={2}>Tehlike</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '4%' }} rowSpan={2}>Risk</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '4%' }} rowSpan={2}>Sonuç/ Olası Etki Zarar</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '4%' }} rowSpan={2}>Riskten Etkilenecek Kişiler</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '5%' }} rowSpan={2}>Mevcut Durum Açıklaması<br/><span style={{fontSize: '4px'}}>(Tespit edilen riske ilişkin mevcut önlemler)</span></th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '4%' }} rowSpan={2}>Mevcut Durum Görseli<br/><span style={{fontSize: '4px'}}>(Varsa tespit edilen riske ilişkin görsel)</span></th>
              
              <th style={{ border: '1px solid #000', padding: '2px' }} colSpan={5}>Mevcut Risk Skoru</th>
              
              <th style={{ border: '1px solid #000', padding: '2px' }} colSpan={6}>İyileştirme Planı</th>
              
              <th style={{ border: '1px solid #000', padding: '2px' }} colSpan={5}>İyileştirme Sonrası Risk Skoru</th>
              
              <th style={{ border: '1px solid #000', padding: '2px' }} colSpan={3}>İyileştirme Etkinlik Ölçümü</th>
              
              <th style={{ border: '1px solid #000', padding: '2px', width: '3%' }} rowSpan={2}>İlgili Mevzuat</th>
            </tr>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              {/* İlk Skor */}
              <th style={{ border: '1px solid #000', padding: '2px', width: '1.5%' }}>Olasılık</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '1.5%' }}>Frekans</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '1.5%' }}>Şiddet</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '1.5%' }}>Risk Puanı</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '3%' }}>Risk Seviyesi</th>
              
              {/* İyileştirme Planı */}
              <th style={{ border: '1px solid #000', padding: '2px', width: '5%' }}>Alınacak Önlemler / İyileştirici Faaliyet</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '3%' }}>İyileştirme Sorumlusu</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '3%' }}>Termin Tarihi</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '5%' }}>İyileştirme Açıklaması<br/><span style={{fontSize: '4px'}}>(Tespit edilen riske ilişkin yapılan iyileştirmeler)</span></th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '3%' }}>İyileştirme Tamamlanma Tarihi</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '4%' }}>İyileştirme Sonrası Görseli<br/><span style={{fontSize: '4px'}}>(Yapılan iyileştirme sonrasını gösteren görsel)</span></th>

              {/* Son Skor */}
              <th style={{ border: '1px solid #000', padding: '2px', width: '1.5%' }}>Olasılık</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '1.5%' }}>Frekans</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '1.5%' }}>Şiddet</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '1.5%' }}>Risk Puanı</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '3%' }}>Risk Seviyesi</th>

              {/* Etkinlik */}
              <th style={{ border: '1px solid #000', padding: '2px', width: '3%' }}>Etkinlik Ölçüm Yöntemi</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '3%' }}>İyileştirme Kontrol Sorumlusu</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '3%' }}>Sonuç</th>
            </tr>
          </thead>
          <tbody>
            {sortedRisks.map((risk, index) => {
              const formattedRiskNo = risk.riskNo || (index + 1);
              
              const initialLevelColor = LEVEL_COLORS[risk.initialLevel] || '#ffffff';
              const initialLevelTextColor = risk.initialLevel && risk.initialLevel !== 'Bilinmiyor' ? '#ffffff' : '#000000';
              
              const finalLevelColor = LEVEL_COLORS[risk.finalLevel] || '#ffffff';
              const finalLevelTextColor = risk.finalLevel && risk.finalLevel !== 'Bilinmiyor' ? '#ffffff' : '#000000';

              return (
                <tr key={risk.id} style={{ backgroundColor: '#ffffff' }}>
                  <td style={{ border: '1px solid #000', padding: '2px' }}>{formattedRiskNo}</td>
                  <td style={{ border: '1px solid #000', padding: '2px' }}>{risk.detectionDate ? format(new Date(risk.detectionDate), 'dd.MM.yyyy') : '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px' }}>{risk.riskCategory || '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px' }}>{risk.subCategory || '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px' }}>{risk.area || '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px' }}>{risk.activity || '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px' }}>{risk.hazard || '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px' }}>{risk.riskDescription || '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px' }}>{risk.impactDamage || '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px' }}>{risk.affectedPeople || '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'left' }}>{risk.initialCondition || '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px' }}>
                    {risk.initialImage ? (
                      <img src={risk.initialImage} alt="Mevcut Durum" style={{ maxWidth: '100%', maxHeight: '40px', objectFit: 'contain' }} />
                    ) : '-'}
                  </td>
                  
                  {/* İlk Skor */}
                  <td style={{ border: '1px solid #000', padding: '2px' }}>{risk.initialProb || '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px' }}>{risk.initialFreq || '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px' }}>{risk.initialSev || '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px', fontWeight: 'bold' }}>{risk.initialScore || '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px', backgroundColor: initialLevelColor, color: initialLevelTextColor, fontWeight: 'bold' }}>
                    {risk.initialLevel || '-'}
                  </td>

                  {/* İyileştirme Planı */}
                  <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'left' }}>{risk.firstActionPlan || '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px' }}>{risk.improvementResponsible || '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px' }}>{risk.dueDate ? format(new Date(risk.dueDate), 'dd.MM.yyyy') : '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'left' }}>{risk.actionsTaken || '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px' }}>{risk.actionDate ? format(new Date(risk.actionDate), 'dd.MM.yyyy') : '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px' }}>
                    {risk.actionImage ? (
                      <img src={risk.actionImage} alt="Sonrası Durum" style={{ maxWidth: '100%', maxHeight: '40px', objectFit: 'contain' }} />
                    ) : '-'}
                  </td>

                  {/* Son Skor */}
                  <td style={{ border: '1px solid #000', padding: '2px' }}>{risk.finalProb || '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px' }}>{risk.finalFreq || '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px' }}>{risk.finalSev || '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px', fontWeight: 'bold' }}>{risk.finalScore || '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px', backgroundColor: finalLevelColor, color: finalLevelTextColor, fontWeight: 'bold' }}>
                    {risk.finalLevel || '-'}
                  </td>

                  {/* Etkinlik Ölçümü */}
                  <td style={{ border: '1px solid #000', padding: '2px' }}>{risk.effectivenessMethod || '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px' }}>{risk.controlResponsible || '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px' }}>{risk.controlResult || '-'}</td>

                  <td style={{ border: '1px solid #000', padding: '2px' }}>{risk.legislation || '-'}</td>
                </tr>
              );
            })}
            {sortedRisks.length === 0 && (
              <tr>
                <td colSpan={32} style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', fontSize: '8px' }}>
                  Bu departmanda henüz risk kaydı bulunmamaktadır.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* SIGNATURE BLOCK */}
        <div style={{ marginTop: '20px', pageBreakInside: 'avoid' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7px', textAlign: 'center', border: '1px solid #000' }}>
            <thead>
              <tr>
                <th colSpan={7} style={{ border: '1px solid #000', padding: '4px', backgroundColor: '#e5e7eb', fontSize: '8px' }}>RİSK DEĞERLENDİRME EKİBİ</th>
              </tr>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={{ border: '1px solid #000', padding: '4px', width: '14%' }}>İşveren / İşveren Vekili</th>
                <th style={{ border: '1px solid #000', padding: '4px', width: '14%' }}>İş Güvenliği Uzmanları</th>
                <th style={{ border: '1px solid #000', padding: '4px', width: '14%' }}>İşyeri Hekimi</th>
                <th style={{ border: '1px solid #000', padding: '4px', width: '14%' }}>Baş Çalışan Temsilcisi</th>
                <th style={{ border: '1px solid #000', padding: '4px', width: '14%' }}>Destek Elemanı</th>
                <th style={{ border: '1px solid #000', padding: '4px', width: '15%' }}>İlgili Birim Yöneticisi</th>
                <th style={{ border: '1px solid #000', padding: '4px', width: '15%' }}>İlgili Birim Sorumlusu</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', height: '40px' }}></td>
                <td style={{ border: '1px solid #000', height: '40px' }}></td>
                <td style={{ border: '1px solid #000', height: '40px' }}></td>
                <td style={{ border: '1px solid #000', height: '40px' }}></td>
                <td style={{ border: '1px solid #000', height: '40px' }}></td>
                <td style={{ border: '1px solid #000', height: '40px' }}></td>
                <td style={{ border: '1px solid #000', height: '40px' }}></td>
              </tr>
              <tr>
                <td colSpan={7} style={{ border: '1px solid #000', padding: '4px', backgroundColor: '#f3f4f6', fontWeight: 'bold' }}>
                  Diğer Katılımcılar (Adı Soyadı, Görevi, Tarih, İmza)
                </td>
              </tr>
              <tr>
                <td colSpan={7} style={{ border: '1px solid #000', height: '40px' }}></td>
              </tr>
            </tbody>
          </table>
        </div>
        
      </div>
    );
  }
);

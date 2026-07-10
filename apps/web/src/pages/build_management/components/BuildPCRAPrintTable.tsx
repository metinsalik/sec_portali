import React, { forwardRef } from 'react';
import { format, addYears } from 'date-fns';

interface BuildPCRAPrintTableProps {
  risks: any[];
  project: any;
}

const LEVEL_COLORS: Record<string, string> = {
  'Kritik Risk': '#7f1d1d', // Koyu Kırmızı
  'Yüksek Risk': '#b91c1c', // Kırmızı
  'Orta Risk':   '#b45309', // Turuncu/Sarı
  'Düşük Risk':  '#047857', // Yeşil
  '-':           '#9ca3af'  // Gri
};

const getRiskLevel = (score: number) => {
  if (score >= 17) return 'Kritik Risk';
  if (score >= 10) return 'Yüksek Risk';
  if (score >= 5) return 'Orta Risk';
  if (score > 0) return 'Düşük Risk';
  return '-';
};

export const BuildPCRAPrintTable = forwardRef<HTMLDivElement, BuildPCRAPrintTableProps>(
  ({ risks, project }, ref) => {
    
    // Sort risks: highest initialScore first
    const sortedRisks = [...risks].sort((a, b) => {
      const scoreA = (Number(a.initialLikelihood) || 0) * (Number(a.initialSeverity) || 0);
      const scoreB = (Number(b.initialLikelihood) || 0) * (Number(b.initialSeverity) || 0);
      return scoreB - scoreA;
    });

    const currentDate = format(new Date(), 'dd.MM.yyyy');

    return (
      <div ref={ref} style={{ padding: '10px', fontFamily: 'Arial, sans-serif', color: '#000', backgroundColor: '#fff', width: '100%', boxSizing: 'border-box' }}>
        
        {/* HEADER TITLE */}
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <h1 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0' }}>İNŞAAT ÖNCESİ RİSK DEĞERLENDİRMESİ (PCRA) TABLOSU</h1>
        </div>

        {/* HEADER INFO TABLE */}
        <table style={{ width: '100%', marginBottom: '10px', borderCollapse: 'collapse', fontSize: '8px', border: '1px solid #000' }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', width: '15%', backgroundColor: '#f3f4f6' }}>Proje Adı</td>
              <td style={{ border: '1px solid #000', padding: '4px', width: '35%' }}>{project?.name || '-'}</td>
              <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', width: '15%', backgroundColor: '#f3f4f6' }}>Proje Yöneticisi</td>
              <td style={{ border: '1px solid #000', padding: '4px', width: '35%' }}>{project?.projectManager || '-'}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', backgroundColor: '#f3f4f6' }}>Değerlendirme Tarihi</td>
              <td style={{ border: '1px solid #000', padding: '4px' }}>{currentDate}</td>
              <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', backgroundColor: '#f3f4f6' }}>Proje Durumu</td>
              <td style={{ border: '1px solid #000', padding: '4px' }}>{project?.status || '-'}</td>
            </tr>
          </tbody>
        </table>

        {/* MAIN TABLE */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '6px', textAlign: 'center', tableLayout: 'fixed', wordWrap: 'break-word' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              <th style={{ border: '1px solid #000', padding: '2px', width: '2%' }} rowSpan={2}>No</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '6%' }} rowSpan={2}>Kategori</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '8%' }} rowSpan={2}>Faaliyet</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '8%' }} rowSpan={2}>Tehlike</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '8%' }} rowSpan={2}>Risk</th>
              
              <th style={{ border: '1px solid #000', padding: '2px' }} colSpan={4}>İlk Değerlendirme Skoru</th>
              
              <th style={{ border: '1px solid #000', padding: '2px' }} colSpan={4}>İyileştirme Planı ve Sorumlular</th>
              
              <th style={{ border: '1px solid #000', padding: '2px' }} colSpan={4}>İyileştirme Sonrası Risk Skoru</th>
              
              <th style={{ border: '1px solid #000', padding: '2px', width: '8%' }} rowSpan={2}>Kontrol Adımları</th>
            </tr>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              {/* İlk Skor */}
              <th style={{ border: '1px solid #000', padding: '2px', width: '2%' }}>Olasılık</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '2%' }}>Şiddet</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '2%' }}>Puan</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '4%' }}>Seviye</th>
              
              {/* İyileştirme Planı */}
              <th style={{ border: '1px solid #000', padding: '2px', width: '5%' }}>İlgili Departman</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '5%' }}>Sorumlu Kişi</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '4%' }}>Termin</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '8%' }}>Alınacak Önlemler</th>

              {/* Son Skor */}
              <th style={{ border: '1px solid #000', padding: '2px', width: '2%' }}>Olasılık</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '2%' }}>Şiddet</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '2%' }}>Puan</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '4%' }}>Seviye</th>
            </tr>
          </thead>
          <tbody>
            {sortedRisks.map((risk, index) => {
              const initScore = (Number(risk.initialLikelihood) || 0) * (Number(risk.initialSeverity) || 0);
              const initLevel = getRiskLevel(initScore);
              const initialLevelColor = LEVEL_COLORS[initLevel] || '#ffffff';
              const initialLevelTextColor = initScore > 0 ? '#ffffff' : '#000000';
              
              const finScore = (Number(risk.finalLikelihood) || 0) * (Number(risk.finalSeverity) || 0);
              const finLevel = getRiskLevel(finScore);
              const finalLevelColor = LEVEL_COLORS[finLevel] || '#ffffff';
              const finalLevelTextColor = finScore > 0 ? '#ffffff' : '#000000';

              return (
                <tr key={risk.id} style={{ backgroundColor: '#ffffff' }}>
                  <td style={{ border: '1px solid #000', padding: '2px' }}>{index + 1}</td>
                  <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'left' }}>{risk.category || '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'left' }}>{risk.activity || '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'left' }}>{risk.hazard || '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'left' }}>{risk.risk || '-'}</td>
                  
                  {/* İlk Skor */}
                  <td style={{ border: '1px solid #000', padding: '2px' }}>{risk.initialLikelihood || '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px' }}>{risk.initialSeverity || '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px', fontWeight: 'bold' }}>{initScore > 0 ? initScore : '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px', backgroundColor: initialLevelColor, color: initialLevelTextColor, fontWeight: 'bold' }}>
                    {initScore > 0 ? initLevel : '-'}
                  </td>

                  {/* İyileştirme Planı */}
                  <td style={{ border: '1px solid #000', padding: '2px' }}>{risk.department || '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px' }}>{risk.responsible || '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px' }}>{risk.dueDate || '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'left' }}>{risk.precautions || '-'}</td>

                  {/* Son Skor */}
                  <td style={{ border: '1px solid #000', padding: '2px' }}>{risk.finalLikelihood || '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px' }}>{risk.finalSeverity || '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px', fontWeight: 'bold' }}>{finScore > 0 ? finScore : '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '2px', backgroundColor: finalLevelColor, color: finalLevelTextColor, fontWeight: 'bold' }}>
                    {finScore > 0 ? finLevel : '-'}
                  </td>

                  {/* Etkinlik Ölçümü */}
                  <td style={{ border: '1px solid #000', padding: '2px', textAlign: 'left' }}>{risk.controlSteps || '-'}</td>
                </tr>
              );
            })}
            {sortedRisks.length === 0 && (
              <tr>
                <td colSpan={18} style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', fontSize: '8px' }}>
                  Bu projeye ait henüz risk kaydı bulunmamaktadır.
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
                <th colSpan={6} style={{ border: '1px solid #000', padding: '4px', backgroundColor: '#e5e7eb', fontSize: '8px' }}>RİSK DEĞERLENDİRME VE PROJE EKİBİ</th>
              </tr>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={{ border: '1px solid #000', padding: '4px', width: '16%' }}>Proje Sponsoru</th>
                <th style={{ border: '1px solid #000', padding: '4px', width: '16%' }}>Proje Yöneticisi</th>
                <th style={{ border: '1px solid #000', padding: '4px', width: '17%' }}>İş Güvenliği Uzmanı</th>
                <th style={{ border: '1px solid #000', padding: '4px', width: '17%' }}>Enfeksiyon Kontrol Sorumlusu</th>
                <th style={{ border: '1px solid #000', padding: '4px', width: '17%' }}>Tesis Yönetim Sorumlusu</th>
                <th style={{ border: '1px solid #000', padding: '4px', width: '17%' }}>Kalite Sorumlusu</th>
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
              </tr>
            </tbody>
          </table>
        </div>
        
      </div>
    );
  }
);

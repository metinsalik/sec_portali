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
    
    // Extract assigned team members from facility assignments
    const assignments: any[] = facility?.assignments || [];
    
    // Find specialist(s), doctor(s), employerRep
    const safetySpecialists = assignments
      .filter(a => a.type?.toLowerCase().includes('uzman') || a.type?.toLowerCase().includes('safety') || a.type?.toLowerCase().includes('isg'))
      .map(a => a.professional?.fullName || a.professional?.username)
      .filter(Boolean);

    const doctors = assignments
      .filter(a => a.type?.toLowerCase().includes('hekim') || a.type?.toLowerCase().includes('doctor'))
      .map(a => a.professional?.fullName || a.professional?.username)
      .filter(Boolean);

    const employerReps = assignments
      .filter(a => a.employerRep || a.type?.toLowerCase().includes('isveren') || a.type?.toLowerCase().includes('vekil'))
      .map(a => a.employerRep?.fullName || a.professional?.fullName)
      .filter(Boolean);

    const specialistText = safetySpecialists.length > 0 ? safetySpecialists.join(', ') : '';
    const doctorText = doctors.length > 0 ? doctors.join(', ') : '';
    const employerRepText = employerReps.length > 0 ? employerReps.join(', ') : '';

    // Sort risks: highest initialScore first
    const sortedRisks = [...risks].sort((a, b) => {
      const scoreA = Number(a.initialScore) || 0;
      const scoreB = Number(b.initialScore) || 0;
      return scoreB - scoreA;
    });

    const currentDate = format(new Date(), 'dd.MM.yyyy');
    const validUntilDate = format(addYears(new Date(), 2), 'dd.MM.yyyy');

    // Logo check
    const logoUrl = facility.logoUrl || '/mlpcare.jpg';

    // Format address components
    const addressParts = [
      facility.fullAddress,
      facility.district ? `${facility.district}` : null,
      facility.city
    ].filter(Boolean).join(', ');

    return (
      <div ref={ref} style={{ padding: '10px', fontFamily: 'Arial, sans-serif', color: '#000', backgroundColor: '#fff', width: '100%', boxSizing: 'border-box' }}>
        
        <table style={{ width: '100%', border: 'none', borderSpacing: 0 }}>
          <tfoot style={{ display: 'table-footer-group' }}>
            <tr>
              <td style={{ border: 'none', paddingTop: '15px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>
                İSG-F56-000
              </td>
            </tr>
          </tfoot>
          <tbody>
            <tr>
              <td style={{ border: 'none', padding: 0 }}>
                {/* HEADER TITLE & LOGO */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '2px solid #0f172a', paddingBottom: '8px' }}>
                  <div style={{ width: '180px', textAlign: 'left' }}>
                    {logoUrl ? (
                      <img 
                        src={logoUrl} 
                        alt={facility.name || 'Logo'} 
                        style={{ maxHeight: '42px', maxWidth: '170px', objectFit: 'contain' }}
                        onError={(e) => {
                          // Hide on broken image
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>{facility.name || ''}</span>
                    )}
                  </div>
                  
                  <div style={{ textAlign: 'center', flex: 1, padding: '0 10px' }}>
                    <h1 style={{ fontSize: '13px', fontWeight: 'bold', margin: '0', textTransform: 'uppercase', letterSpacing: '0.3px', color: '#0f172a' }}>
                      TEHLİKE BELİRLEME VE RİSK DEĞERLENDİRME TABLOSU (FINE KINNEY METODU)
                    </h1>
                    <div style={{ fontSize: '9px', color: '#475569', marginTop: '2px' }}>
                      {facility.commercialTitle || facility.name || ''}
                    </div>
                  </div>

                  <div style={{ width: '180px', textAlign: 'right', fontSize: '8px', color: '#64748b' }}>
                    <div><strong>Form No:</strong> İSG-F56</div>
                    <div><strong>Tarih:</strong> {currentDate}</div>
                  </div>
                </div>

        {/* HEADER INFO TABLE */}
        <table style={{ width: '100%', marginBottom: '10px', borderCollapse: 'collapse', fontSize: '8px', border: '1px solid #000' }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', width: '15%', backgroundColor: '#f3f4f6' }}>Değerlendirilen Birim / Bölüm</td>
              <td style={{ border: '1px solid #000', padding: '4px', width: '15%', fontWeight: '600' }}>{department?.name || '-'}</td>
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
                <strong>{facility.commercialTitle || facility.name || '-'}</strong>
                {addressParts && <span> — {addressParts}</span>}
              </td>
              <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', backgroundColor: '#f3f4f6' }} colSpan={2}>Kullanılan Metod</td>
              <td style={{ border: '1px solid #000', padding: '4px', fontWeight: '600' }} colSpan={2}>Fine-Kinney Metodu</td>
            </tr>
          </tbody>
        </table>

        {/* MAIN TABLE */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7.5px', textAlign: 'center', lineHeight: '1.3' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              <th style={{ border: '1px solid #000', padding: '4px 2px', width: '3%' }} rowSpan={2}>No</th>
              <th style={{ border: '1px solid #000', padding: '4px 2px', width: '5%' }} rowSpan={2}>Tespit Tarihi</th>
              <th style={{ border: '1px solid #000', padding: '4px 3px', width: '9%' }} rowSpan={2}>Kategori / Alt Kategori</th>
              <th style={{ border: '1px solid #000', padding: '4px 3px', width: '8%' }} rowSpan={2}>Alan / Faaliyet</th>
              <th style={{ border: '1px solid #000', padding: '4px 3px', width: '10%' }} rowSpan={2}>Tehlike</th>
              <th style={{ border: '1px solid #000', padding: '4px 3px', width: '13%' }} rowSpan={2}>Risk Tanımı & Olası Zarar</th>
              <th style={{ border: '1px solid #000', padding: '4px 3px', width: '8%' }} rowSpan={2}>Etkilenecek Kişiler</th>
              
              <th style={{ border: '1px solid #000', padding: '3px 2px' }} colSpan={5}>Mevcut Risk Skoru</th>
              <th style={{ border: '1px solid #000', padding: '3px 2px' }} colSpan={5}>İyileştirme Sonrası Risk Skoru</th>

              <th style={{ border: '1px solid #000', padding: '4px 2px', width: '7%' }} rowSpan={2}>Sorumlu</th>
              <th style={{ border: '1px solid #000', padding: '4px 2px', width: '5%' }} rowSpan={2}>Termin Tarihi</th>
            </tr>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              {/* İlk Skor */}
              <th style={{ border: '1px solid #000', padding: '2px', width: '2%', fontSize: '6.5px' }}>O</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '2%', fontSize: '6.5px' }}>F</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '2%', fontSize: '6.5px' }}>Ş</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '2.5%', fontSize: '7px' }}>Puan</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '5.5%', fontSize: '7px' }}>Seviye</th>

              {/* Son Skor */}
              <th style={{ border: '1px solid #000', padding: '2px', width: '2%', fontSize: '6.5px' }}>O</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '2%', fontSize: '6.5px' }}>F</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '2%', fontSize: '6.5px' }}>Ş</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '2.5%', fontSize: '7px' }}>Puan</th>
              <th style={{ border: '1px solid #000', padding: '2px', width: '5.5%', fontSize: '7px' }}>Seviye</th>
            </tr>
          </thead>
          <tbody>
            {sortedRisks.map((risk, index) => {
              const formattedRiskNo = risk.riskNo || (index + 1);
              
              const initialLevelColor = LEVEL_COLORS[risk.initialLevel] || '#ffffff';
              const initialLevelTextColor = risk.initialLevel && risk.initialLevel !== 'Bilinmiyor' ? '#ffffff' : '#000000';
              
              const finalLevelColor = LEVEL_COLORS[risk.finalLevel] || '#ffffff';
              const finalLevelTextColor = risk.finalLevel && risk.finalLevel !== 'Bilinmiyor' ? '#ffffff' : '#000000';

              const initialImg = (Array.isArray(risk.initialImages) && risk.initialImages.length > 0)
                ? risk.initialImages[0]
                : (risk.initialImage || null);

              const actionImg = (Array.isArray(risk.actionImages) && risk.actionImages.length > 0)
                ? risk.actionImages[0]
                : (risk.actionImage || null);

              return (
                <React.Fragment key={risk.id}>
                  {/* 1. SATIR: TEMEL RİSK VERİLERİ VE SKORLAR */}
                  <tr style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#fcfcfd' }}>
                    <td style={{ border: '1px solid #000', padding: '4px 2px', fontWeight: 'bold' }}>{formattedRiskNo}</td>
                    <td style={{ border: '1px solid #000', padding: '4px 2px', fontSize: '7px' }}>
                      {risk.detectionDate ? format(new Date(risk.detectionDate), 'dd.MM.yyyy') : '-'}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '4px 3px', textAlign: 'left' }}>
                      <div style={{ fontWeight: 'bold' }}>{risk.riskCategory || '-'}</div>
                      {risk.subCategory && <div style={{ fontSize: '6.5px', color: '#475569' }}>{risk.subCategory}</div>}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '4px 3px', textAlign: 'left' }}>
                      <div>{risk.area || '-'}</div>
                      {risk.activity && <div style={{ fontSize: '6.5px', color: '#475569' }}>{risk.activity}</div>}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '4px 3px', textAlign: 'left' }}>{risk.hazard || '-'}</td>
                    <td style={{ border: '1px solid #000', padding: '4px 3px', textAlign: 'left' }}>
                      <div style={{ fontWeight: '600' }}>{risk.riskDescription || '-'}</div>
                      {risk.impactDamage && (
                        <div style={{ fontSize: '6.5px', color: '#b91c1c', marginTop: '1px' }}>
                          <strong>Etki:</strong> {risk.impactDamage}
                        </div>
                      )}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '4px 3px', textAlign: 'left' }}>{risk.affectedPeople || '-'}</td>
                    
                    {/* İlk Skor */}
                    <td style={{ border: '1px solid #000', padding: '2px' }}>{risk.initialProb || '-'}</td>
                    <td style={{ border: '1px solid #000', padding: '2px' }}>{risk.initialFreq || '-'}</td>
                    <td style={{ border: '1px solid #000', padding: '2px' }}>{risk.initialSev || '-'}</td>
                    <td style={{ border: '1px solid #000', padding: '2px', fontWeight: 'bold' }}>{risk.initialScore || '-'}</td>
                    <td style={{ border: '1px solid #000', padding: '2px', backgroundColor: initialLevelColor, color: initialLevelTextColor, fontWeight: 'bold', fontSize: '6.5px' }}>
                      {risk.initialLevel || '-'}
                    </td>

                    {/* Son Skor */}
                    <td style={{ border: '1px solid #000', padding: '2px' }}>{risk.finalProb ?? 0.5}</td>
                    <td style={{ border: '1px solid #000', padding: '2px' }}>{risk.finalFreq ?? 3}</td>
                    <td style={{ border: '1px solid #000', padding: '2px' }}>{risk.finalSev ?? 7}</td>
                    <td style={{ border: '1px solid #000', padding: '2px', fontWeight: 'bold' }}>{risk.finalScore ?? 11}</td>
                    <td style={{ border: '1px solid #000', padding: '2px', backgroundColor: finalLevelColor || LEVEL_COLORS['Önemsiz Risk'], color: finalLevelTextColor || '#ffffff', fontWeight: 'bold', fontSize: '6.5px' }}>
                      {risk.finalLevel || 'Önemsiz Risk'}
                    </td>

                    {/* Sorumlu & Termin */}
                    <td style={{ border: '1px solid #000', padding: '4px 2px', fontWeight: '500' }}>{risk.improvementResponsible || '-'}</td>
                    <td style={{ border: '1px solid #000', padding: '4px 2px', fontSize: '7px' }}>
                      {risk.dueDate ? format(new Date(risk.dueDate), 'dd.MM.yyyy') : '-'}
                    </td>
                  </tr>

                  {/* 2. SATIR: GENİŞ DETAY VE İYİLEŞTİRME EYLEM ALANI (TAM GENİŞLİK) */}
                  <tr style={{ backgroundColor: index % 2 === 0 ? '#f8fafc' : '#f1f5f9' }}>
                    <td colSpan={19} style={{ border: '1px solid #000', padding: '6px 10px', textAlign: 'left' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '14px', alignItems: 'start' }}>
                        
                        {/* Sol Kolon: Mevcut Durum & Varsa Önlemler */}
                        <div style={{ borderRight: '1px solid #cbd5e1', paddingRight: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            {initialImg && (
                              <img 
                                src={initialImg} 
                                alt="Mevcut Durum" 
                                style={{ maxHeight: '55px', maxWidth: '85px', objectFit: 'contain', border: '1px solid #94a3b8', borderRadius: '3px' }} 
                              />
                            )}
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '7px', fontWeight: 'bold', color: '#1e293b', marginBottom: '2px', textTransform: 'uppercase' }}>
                                📋 Mevcut Durum Açıklaması & Alınan Önlemler:
                              </div>
                              <div style={{ fontSize: '7.5px', color: '#334155', whiteSpace: 'pre-line', lineHeight: '1.35' }}>
                                {risk.initialCondition || 'Belirtilmedi'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Sağ Kolon: Alınacak Önlemler / İyileştirici Faaliyet (Geniş Alan) */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '7px', fontWeight: 'bold', color: '#0f766e', marginBottom: '2px', textTransform: 'uppercase' }}>
                                🛠️ Alınacak Önlemler / İyileştirici Faaliyet:
                              </div>
                              <div style={{ fontSize: '7.5px', color: '#0f172a', fontWeight: '500', whiteSpace: 'pre-line', lineHeight: '1.35' }}>
                                {risk.firstActionPlan || 'Belirtilmedi'}
                              </div>
                              
                              {/* Yapılan İyileştirme veya Mevzuat varsa alt bilgi */}
                              {(risk.actionsTaken || risk.legislation || risk.actionDate) && (
                                <div style={{ marginTop: '4px', paddingTop: '3px', borderTop: '1px dashed #cbd5e1', fontSize: '6.5px', color: '#475569', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                  {risk.actionsTaken && <div><strong>Gerçekleşen:</strong> {risk.actionsTaken}</div>}
                                  {risk.actionDate && <div><strong>Tamamlanma:</strong> {format(new Date(risk.actionDate), 'dd.MM.yyyy')}</div>}
                                  {risk.legislation && <div><strong>İlgili Mevzuat:</strong> {risk.legislation}</div>}
                                </div>
                              )}
                            </div>
                            
                            {actionImg && (
                              <img 
                                src={actionImg} 
                                alt="İyileştirme Sonrası" 
                                style={{ maxHeight: '55px', maxWidth: '85px', objectFit: 'contain', border: '1px solid #94a3b8', borderRadius: '3px' }} 
                              />
                            )}
                          </div>
                        </div>

                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
            {sortedRisks.length === 0 && (
              <tr>
                <td colSpan={19} style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', fontSize: '8px' }}>
                  Bu birimde henüz kayıtlı risk bulunmamaktadır.
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
                <td style={{ border: '1px solid #000', height: '42px', verticalAlign: 'top', padding: '4px' }}>
                  {employerRepText && <div style={{ fontWeight: 'bold', fontSize: '7.5px' }}>{employerRepText}</div>}
                </td>
                <td style={{ border: '1px solid #000', height: '42px', verticalAlign: 'top', padding: '4px' }}>
                  {specialistText && <div style={{ fontWeight: 'bold', fontSize: '7.5px' }}>{specialistText}</div>}
                </td>
                <td style={{ border: '1px solid #000', height: '42px', verticalAlign: 'top', padding: '4px' }}>
                  {doctorText && <div style={{ fontWeight: 'bold', fontSize: '7.5px' }}>{doctorText}</div>}
                </td>
                <td style={{ border: '1px solid #000', height: '42px', verticalAlign: 'top', padding: '4px' }}></td>
                <td style={{ border: '1px solid #000', height: '42px', verticalAlign: 'top', padding: '4px' }}></td>
                <td style={{ border: '1px solid #000', height: '42px', verticalAlign: 'top', padding: '4px' }}></td>
                <td style={{ border: '1px solid #000', height: '42px', verticalAlign: 'top', padding: '4px' }}></td>
              </tr>
              <tr>
                <td colSpan={7} style={{ border: '1px solid #000', padding: '4px', backgroundColor: '#f3f4f6', fontWeight: 'bold' }}>
                  Diğer Katılımcılar (Adı Soyadı, Görevi, Tarih, İmza)
                </td>
              </tr>
              <tr>
                <td colSpan={7} style={{ border: '1px solid #000', height: '35px' }}></td>
              </tr>
            </tbody>
          </table>
        </div>

              </td>
            </tr>
          </tbody>
        </table>
        
      </div>
    );
  }
);

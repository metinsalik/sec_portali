import React, { forwardRef, useEffect, useState } from 'react';
import type { Finding, AuditMeta, IRSCFacility } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface ReportTemplateProps {
  auditMeta: AuditMeta;
  findings: Finding[];
  facility?: IRSCFacility;
  logoUrl?: string;
}

const ReportTemplate = forwardRef<HTMLDivElement, ReportTemplateProps>(
  ({ auditMeta, findings, facility, logoUrl }, ref) => {
    
    const riskWeights: Record<string, number> = {
      'Tolere Edilemez Risk': 5,
      'Yüksek Risk': 4,
      'Önemli Risk': 3,
      'Olası Risk': 2,
      'Önemsiz': 1
    };

    const sortedFindings = [...findings].sort((a, b) => {
      const areaCompare = (a.area || '').localeCompare(b.area || '');
      if (areaCompare !== 0) return areaCompare;
      const riskA = riskWeights[a.risk] || 0;
      const riskB = riskWeights[b.risk] || 0;
      return riskB - riskA;
    });

    const getRiskBg = (risk: string) => {
      switch(risk) {
        case 'Tolere Edilemez Risk': return 'bg-red-700 text-white';
        case 'Yüksek Risk': return 'bg-red-500 text-white';
        case 'Önemli Risk': return 'bg-orange-500 text-white';
        case 'Olası Risk': return 'bg-yellow-400 text-slate-900';
        case 'Önemsiz': return 'bg-green-500 text-white';
        default: return 'bg-slate-200 text-slate-800';
      }
    };

    // Calculate charts data
    const totalFindings = findings.length;
    
    // Improvement chart
    const impStats = {
      'Yeni Tespit Edilen': findings.filter(f => f.status === 'Açık').length,
      'İyileştirilmeyen': 0, // Placeholder
      'Kısmen İyileştirilen': findings.filter(f => f.status === 'İyileştirme Bekliyor').length,
      'Tamamlanan': findings.filter(f => f.status === 'Kapalı').length
    };
    
    const impData = [
      { name: 'Yeni Tespit Edilen', value: impStats['Yeni Tespit Edilen'], color: '#3b82f6' },
      { name: 'İyileştirilmeyen', value: impStats['İyileştirilmeyen'], color: '#ef4444' },
      { name: 'Kısmen İyileştirilen', value: impStats['Kısmen İyileştirilen'], color: '#eab308' },
      { name: 'Tamamlanan', value: impStats['Tamamlanan'], color: '#22c55e' }
    ].filter(d => d.value > 0);

    const tamamlanmaOrani = totalFindings > 0 
      ? Math.round((impStats['Tamamlanan'] / totalFindings) * 100) 
      : 0;

    const [headerReady, setHeaderReady] = useState(false);
    useEffect(() => { setHeaderReady(true); }, []);

    // The repeated header component
    const Header = () => (
      <table className="w-full border-collapse border-[3px] border-slate-700 mb-6 bg-white text-sm" style={{ tableLayout: 'fixed' }}>
        <tbody>
          <tr>
            <td className="w-[25%] h-24 border-r-[3px] border-slate-700 p-2 align-middle text-center bg-slate-50">
              {logoUrl && <img src={logoUrl} alt="Logo" className="max-h-20 max-w-full object-contain mx-auto" />}
            </td>
            <td className="w-[50%] h-24 p-4 align-middle text-center">
              <h1 className="text-xl font-black uppercase tracking-wide text-slate-800 m-0">Entegre Risk ve Güvenlik<br/>Denetim Raporu</h1>
            </td>
            <td className="w-[25%] h-24 border-l-[3px] border-slate-700 p-0 align-top">
              <table className="w-full h-full border-collapse font-medium text-xs">
                <tbody>
                  <tr>
                    <td className="w-1/2 p-2 bg-slate-50 border-r border-b border-slate-700 align-middle">Raporlayan:</td>
                    <td className="w-1/2 p-2 border-b border-slate-700 align-middle">MLPCARE HSE</td>
                  </tr>
                  <tr>
                    <td className="w-1/2 p-2 bg-slate-50 border-r border-b border-slate-700 align-middle">Rapor Tarihi:</td>
                    <td className="w-1/2 p-2 border-b border-slate-700 align-middle">{auditMeta.reportDate ? new Date(auditMeta.reportDate).toLocaleDateString('tr-TR') : '-'}</td>
                  </tr>
                  <tr>
                    <td className="w-1/2 p-2 bg-slate-50 border-r border-slate-700 align-middle">Rapor No:</td>
                    <td className="w-1/2 p-2 align-middle">{auditMeta.reportNo || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    );

    return (
      <div ref={ref} className="bg-white print:bg-white text-slate-800 w-full max-w-5xl mx-auto print:max-w-none print:mx-0 font-sans">
        <style type="text/css" media="print">
          {`
            @page { size: A4 portrait; margin: 15mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; margin: 0; padding: 0; }
            .page-break { page-break-after: always; break-after: page; }
            .avoid-break { page-break-inside: avoid; break-inside: avoid; }
            
            /* Hide print UI buttons and workspace wrappers */
            #print-wrapper { width: 100% !important; margin: 0 !important; padding: 0 !important; }
          `}
        </style>

        {/* --- KAPAK SAYFASI (COVER PAGE) --- */}
        <div className="page-break w-full h-[297mm] print:h-screen bg-white text-slate-800 flex flex-col justify-center items-center relative print:bg-white print:text-slate-800">
          <div className="absolute top-1/4 flex flex-col items-center">
            {logoUrl && <img src={logoUrl} alt="Logo" className="w-64 mb-24 object-contain" />}
            <h1 className="text-4xl font-black uppercase tracking-widest text-center leading-tight mb-8 text-slate-900">
              Entegre Risk ve Güvenlik<br/>Denetim Raporu
            </h1>
            <h2 className="text-xl font-bold tracking-wide mb-6 text-slate-700">
              {facility ? facility.name : 'Tesis Seçilmedi'}
            </h2>
            <h3 className="text-lg font-bold text-slate-600">
              {auditMeta.reportDate ? new Date(auditMeta.reportDate).toLocaleDateString('tr-TR') : '-'}
            </h3>
          </div>
          <div className="absolute bottom-12 font-bold text-sm tracking-widest text-slate-800 text-center">
            MLPCARE | HSE<br/><span className="text-[10px] font-normal opacity-80">HEALTH SAFETY ENVIRONMENT DIRECTORATE</span>
          </div>
        </div>

        {/* Since modern browsers support repeating table headers, we wrap the whole content in a table */}
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <td>
                <Header />
              </td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                
                {/* --- BÖLÜM 1: YÖNETİCİ ÖZETİ --- */}
                <div className="page-break w-full pb-8">
                  <h2 className="text-xl font-bold text-center mb-6">BÖLÜM 1: YÖNETİCİ ÖZETİ</h2>
                  
                  <div className="text-justify mb-8 leading-relaxed text-[15px]" dangerouslySetInnerHTML={{__html: auditMeta.executiveSummary || 'Yönetici özeti girilmedi.'}}>
                  </div>

                  <div className="flex border-[3px] border-slate-200 mt-8">
                    <div className="w-12 bg-slate-200 flex items-center justify-center font-bold text-slate-700 tracking-widest whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                      Veri Özeti
                    </div>
                    <div className="w-1/2 p-6 border-l-[3px] border-r-[3px] border-slate-200 flex flex-col justify-center">
                      <div className="font-bold mb-2">{auditMeta.start ? new Date(auditMeta.start).toLocaleDateString('tr-TR') : '-'} tarihinde yapılan denetimde:</div>
                      <ul className="list-disc pl-8 space-y-1 mb-4">
                        <li>Toplam Yeni Tespit Sayısı: {impStats['Yeni Tespit Edilen']}</li>
                        <li>İyileştirilen Tespit Sayısı: {impStats['Tamamlanan']}</li>
                        <li>İyileştirmesi Devam Eden Tespit Sayısı: {impStats['Kısmen İyileştirilen']}</li>
                      </ul>
                      <div className="font-black text-red-600 text-lg">Tamamlanma Oranı: % {tamamlanmaOrani}</div>
                    </div>
                    <div className="w-1/2 p-4 flex flex-col items-center">
                      <div className="font-bold text-slate-700 mb-2">İyileştirme Çalışmaları (Tümü)</div>
                      <div className="h-48 w-full">
                        {totalFindings > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={impData} innerRadius={30} outerRadius={70} paddingAngle={2} dataKey="value"
                                label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                labelLine={true}
                              >
                                {impData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-400 font-medium">Bulgu bulunamadı</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- BÖLÜM 2: DENETİM HAKKINDA BİLGİLER --- */}
                <div className="page-break w-full pb-8">
                  <h2 className="text-xl font-bold text-center mb-6">BÖLÜM 2: DENETİM HAKKINDA BİLGİLER</h2>
                  
                  <table className="w-full text-left text-sm border-collapse border-[3px] border-slate-700 mb-8">
                    <tbody>
                      <tr>
                        <td className="border border-slate-700 bg-slate-100 p-3 font-bold w-[25%]">Lokasyon</td>
                        <td className="border border-slate-700 p-3 font-medium">{facility ? facility.name : 'Tesis Seçilmedi'}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-700 bg-slate-100 p-3 font-bold">Denetim Tarihi</td>
                        <td className="border border-slate-700 p-3">
                          (1) {auditMeta.start ? new Date(auditMeta.start).toLocaleDateString('tr-TR') : '-'} / (2) {auditMeta.end ? new Date(auditMeta.end).toLocaleDateString('tr-TR') : '-'}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-700 bg-slate-100 p-3 font-bold">Denetimin Amacı</td>
                        <td className="border border-slate-700 p-3 text-justify">{auditMeta.purpose || 'Belirtilmedi'}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Ekip */}
                  <div className="border-[3px] border-slate-700 mb-8">
                    <div className="bg-slate-100 font-bold p-2 border-b-[3px] border-slate-700">Değerlendirme Ekibi</div>
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr>
                          <th className="border border-slate-700 p-2 text-center w-1/3">Kişi</th>
                          <th className="border border-slate-700 p-2 text-center w-1/3">Departman</th>
                          <th className="border border-slate-700 p-2 text-center w-1/3">Unvan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditMeta.team && auditMeta.team.length > 0 ? auditMeta.team.map((t: string, i: number) => {
                          const parts = t.split(/[,|]/).map(s => s.trim());
                          return (
                            <tr key={i}>
                              <td className="border border-slate-700 p-2">{parts[0] || t}</td>
                              <td className="border border-slate-700 p-2">{parts[1] || ''}</td>
                              <td className="border border-slate-700 p-2">{parts[2] || ''}</td>
                            </tr>
                          );
                        }) : <tr><td colSpan={3} className="border border-slate-700 p-2 text-center">Ekip girilmedi</td></tr>}
                      </tbody>
                    </table>
                  </div>

                  {/* Katılımcılar */}
                  <div className="border-[3px] border-slate-700 mb-8">
                    <div className="bg-slate-100 font-bold p-2 border-b-[3px] border-slate-700">Katılımcılar</div>
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr>
                          <th className="border border-slate-700 p-2 text-center w-1/3">Kişi</th>
                          <th className="border border-slate-700 p-2 text-center w-1/3">Departman</th>
                          <th className="border border-slate-700 p-2 text-center w-1/3">Unvan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditMeta.participants && auditMeta.participants.length > 0 ? auditMeta.participants.map((t: string, i: number) => {
                          const parts = t.split(/[,|]/).map(s => s.trim());
                          return (
                            <tr key={i}>
                              <td className="border border-slate-700 p-2">{parts[0] || t}</td>
                              <td className="border border-slate-700 p-2">{parts[1] || ''}</td>
                              <td className="border border-slate-700 p-2">{parts[2] || ''}</td>
                            </tr>
                          );
                        }) : <tr><td colSpan={3} className="border border-slate-700 p-2 text-center">Katılımcı girilmedi</td></tr>}
                      </tbody>
                    </table>
                  </div>

                  {/* Mahaller */}
                  <div className="border-[3px] border-slate-700 mb-8">
                    <div className="bg-slate-100 font-bold p-2 border-b-[3px] border-slate-700">Değerlendirme Yapılan Mahaller</div>
                    <div className="p-4 grid grid-cols-3 gap-y-2 text-sm">
                      {Array.from(new Set(findings.map(f => f.area).filter(Boolean))).map((area, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="font-bold">✓</span> {area}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Kriterler */}
                  <div className="border-[3px] border-slate-700">
                    <div className="bg-slate-100 font-bold p-2 border-b-[3px] border-slate-700">Değerlendirme Sürecinde Dikkat Edilen Konular</div>
                    <div className="p-4 text-sm">
                      <div className="mb-2">Değerlendirme sürecinde;</div>
                      <div className="space-y-1">
                        {auditMeta.criteria && auditMeta.criteria.length > 0 ? auditMeta.criteria.map((c: string, i: number) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="font-bold">✓</span> <span className="pt-[1px]">{c}</span>
                          </div>
                        )) : <div>Kriter girilmedi</div>}
                      </div>
                      <div className="mt-2">göz önüne alınmıştır.</div>
                    </div>
                  </div>
                </div>

                {/* --- BÖLÜM 3: BULGULAR --- */}
                {sortedFindings.map((finding, idx) => (
                  <div key={finding.id} className="page-break w-full">
                    {idx === 0 && <h2 className="text-xl font-bold text-center mb-6">BÖLÜM 3: BULGULAR</h2>}
                    <table className="w-full text-sm border-collapse border-[3px] border-slate-700 mb-4 bg-white">
                      <tbody>
                        <tr className="border-b-[3px] border-slate-700">
                          <td className="p-2 font-bold bg-slate-100 border-r border-slate-700 w-[10%] text-center">Tespit No:</td>
                          <td className="p-2 border-r border-slate-700 w-[15%] text-center text-base">{finding.no}</td>
                          <td className="p-2 font-bold bg-slate-100 border-r border-slate-700 w-[15%] text-center">Yer/Konum:</td>
                          <td className="p-2 border-r border-slate-700 w-[30%] text-center">{finding.area}{finding.subarea ? ` - ${finding.subarea}` : ''}</td>
                          <td className="p-2 font-bold bg-slate-100 border-r border-slate-700 w-[15%] text-center">Risk Düzeyi:</td>
                          <td className={`p-2 font-bold text-center ${getRiskBg(finding.risk)}`}>{finding.risk}</td>
                        </tr>
                        <tr className="border-b-[3px] border-slate-700">
                          <td className="p-2 font-bold bg-slate-100 border-r border-slate-700 text-center" colSpan={2}>İlgili Süreç:</td>
                          <td className="p-2 border-r border-slate-700 text-center" colSpan={2}>{finding.category}</td>
                          <td className="p-2 font-bold bg-slate-100 border-r border-slate-700 text-center">İlgili Birim:</td>
                          <td className="p-2 text-center">{finding.steps && finding.steps.length > 0 ? Array.from(new Set(finding.steps.map(s => s.department))).join(', ') : 'Atanmadı'}</td>
                        </tr>
                        
                        {/* Tespit Detayları Header */}
                        <tr className="border-b-[3px] border-slate-700 bg-slate-200">
                          <td colSpan={6} className="p-2 font-bold text-center text-base">Tespit Detayları</td>
                        </tr>
                        
                        {/* Tespit */}
                        <tr className="border-b border-slate-700">
                          <td className="p-4 font-bold bg-slate-100 border-r-[3px] border-slate-700 text-center align-middle" colSpan={1}>Tespit:</td>
                          <td className="p-4 align-middle text-justify leading-relaxed" colSpan={5}>{finding.findingDesc}</td>
                        </tr>
                        
                        {/* Risk */}
                        <tr className="border-b border-slate-700">
                          <td className="p-4 font-bold bg-slate-100 border-r-[3px] border-slate-700 text-center align-middle" colSpan={1}>Risk:</td>
                          <td className="p-4 align-middle text-justify leading-relaxed" colSpan={5}>{finding.riskDesc}</td>
                        </tr>
                        
                        {/* Öneri */}
                        <tr className="border-b-[3px] border-slate-700">
                          <td className="p-4 font-bold bg-slate-100 border-r-[3px] border-slate-700 text-center align-middle" colSpan={1}>Öneri:</td>
                          <td className="p-4 align-middle text-justify leading-relaxed" colSpan={5}>{finding.recommendation}</td>
                        </tr>
                        
                        {/* Ek */}
                        <tr className="border-b-[3px] border-slate-700 bg-slate-200">
                          <td colSpan={6} className="p-2 font-bold text-center text-base">Ek (Form, fotoğraf, vb. doküman)</td>
                        </tr>
                        <tr className="border-b-[3px] border-slate-700">
                          <td colSpan={3} className="p-2 align-middle border-r-[3px] border-slate-700 h-64 text-center">
                            {finding.files && finding.files[0] ? <img src={finding.files[0].url} className="max-h-[220px] mx-auto object-contain" /> : <div className="text-slate-400">Görsel yok</div>}
                          </td>
                          <td colSpan={3} className="p-2 align-middle h-64 text-center">
                            {finding.files && finding.files[1] ? <img src={finding.files[1].url} className="max-h-[220px] mx-auto object-contain" /> : <div className="text-slate-400">Görsel yok</div>}
                          </td>
                        </tr>
                        
                        {/* İyileştirme */}
                        <tr className="border-b-[3px] border-slate-700 bg-slate-200">
                          <td colSpan={3} className="p-2 font-bold text-center border-r-[3px] border-slate-700 text-base">İyileştirme Durumu</td>
                          <td colSpan={3} className="p-2 font-bold text-center text-base">Süreç Yönetimi</td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="p-6 align-middle border-r-[3px] border-slate-700 text-center text-sm font-medium">
                            {finding.improvementDesc || 'İyileştirme detayı bulunamadı.'}
                          </td>
                          <td colSpan={3} className="p-0 align-top">
                            <table className="w-full h-full text-[11px] border-collapse">
                              <thead>
                                <tr className="border-b border-slate-700 bg-slate-100">
                                  <th className="p-1.5 text-center border-r border-slate-700 w-[15%]">İşlem Trh.</th>
                                  <th className="p-1.5 text-center border-r border-slate-700 w-[20%]">Sorumlu</th>
                                  <th className="p-1.5 text-left border-r border-slate-700 w-[50%]">Açıklama</th>
                                  <th className="p-1.5 text-center w-[15%]">Durum</th>
                                </tr>
                              </thead>
                              <tbody>
                                {finding.steps && finding.steps.length > 0 ? finding.steps.map((s, si) => (
                                  <tr key={si} className="border-b border-slate-300 last:border-b-0">
                                    <td className="p-1.5 border-r border-slate-700 text-center font-medium">{s.actionDate ? new Date(s.actionDate).toLocaleDateString('tr-TR') : '-'}</td>
                                    <td className="p-1.5 border-r border-slate-700 text-center">{s.department}</td>
                                    <td className="p-1.5 border-r border-slate-700 text-left whitespace-pre-wrap">{s.explanation || '-'}</td>
                                    <td className="p-1.5 text-center font-bold text-[10px]">{s.status}</td>
                                  </tr>
                                )) : (
                                  <tr><td colSpan={4} className="p-4 text-center text-slate-400">Henüz aksiyon girilmemiş.</td></tr>
                                )}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ))}

                {/* --- BÖLÜM 4: GENEL DEĞERLENDİRME VE SONUÇ --- */}
                <div className="w-full">
                  <h2 className="text-xl font-bold text-center mb-6">BÖLÜM 4: GENEL DEĞERLENDİRME VE SONUÇ</h2>
                  <div className="text-justify mb-8 leading-relaxed text-[15px]" dangerouslySetInnerHTML={{__html: auditMeta.generalConclusion || 'Genel değerlendirme girilmedi.'}}>
                  </div>
                </div>

              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
);

ReportTemplate.displayName = 'ReportTemplate';
export default ReportTemplate;

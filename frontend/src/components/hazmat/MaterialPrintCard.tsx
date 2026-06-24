import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { BASE_URL } from '@/lib/api';

// Madde tipi ve arayüzler
interface MaterialPrintCardProps {
  material: any;
  facilityLogoUrl?: string;
  size?: 'A3' | 'A4' | 'A5';
}

export const MaterialPrintCard = forwardRef<HTMLDivElement, MaterialPrintCardProps>(
  ({ material, facilityLogoUrl = '/mlpcare.jpg', size = 'A4' }, ref) => {
    
    const pageHeight = size === 'A3' ? '410mm' : size === 'A4' ? '277mm' : '190mm';
    const pageWidth = size === 'A3' ? '287mm' : size === 'A4' ? '200mm' : '138mm';

    // Tüm text içeriklerinin toplam karakter sayısı
    const totalChars = [
      material?.firstAid, material?.fireFightingMeasures,
      material?.accidentalReleaseMeasures, material?.handlingAndStorage,
      material?.ecologicalInformation, material?.hazardDescription,
      material?.usageMethod
    ].filter(Boolean).join('').length;

    // Base scale: 1 = normal, <1 = küçült, >1 = büyüt
    const baseScale = size === 'A5'
      ? totalChars > 1500 ? 0.7 : totalChars > 800 ? 0.85 : 1
      : size === 'A4'
      ? totalChars > 2000 ? 0.75 : totalChars > 1200 ? 0.9 : 1
      : totalChars > 3000 ? 0.8 : totalChars > 1800 ? 0.9 : 1;

    // Tüm boyutlar bu scale ile türetilsin:
    const s = (base: number) => `${base * baseScale}px`;
    const sp = (base: number) => `${base * baseScale}mm`; // padding/margin için

    const rootFontSize = size === 'A5' ? s(8) : size === 'A4' ? s(10) : s(13);

    // Helper for table rows
    const SectionRow = ({ title, content, colSpan = 1 }: { title: string, content?: string | null, colSpan?: number }) => (
      <tr style={{ border: '1px solid #1e293b' }}>
        <td style={{ borderRight: '1px solid #1e293b', padding: sp(1), fontWeight: 'bold', backgroundColor: '#f8fafc', width: '25%', verticalAlign: 'top', fontSize: 'inherit' }}>
          {title}
        </td>
        <td style={{ padding: sp(1), verticalAlign: 'top', whiteSpace: 'pre-wrap', fontSize: 'inherit' }} colSpan={colSpan}>
          {content || '-'}
        </td>
      </tr>
    );

    const HeaderSection = ({ title, icon, colSpan = 2 }: { title: string, icon?: React.ReactNode, colSpan?: number }) => (
      <tr>
        <td colSpan={colSpan} style={{ border: '1px solid #1e293b', padding: sp(1), fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f1f5f9', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#1e293b', fontSize: s(10) }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: s(6) }}>
            {icon}
            {title}
          </div>
        </td>
      </tr>
    );

    const getAbsoluteUrl = (url: string) => {
      if (!url) return window.location.origin + '/mlpcare.jpg';
      if (url.startsWith('http')) return url;
      if (url.startsWith('/uploads')) return `${BASE_URL}${url}`;
      return window.location.origin + (url.startsWith('/') ? url : `/${url}`);
    };

    const renderGHS = () => {
      if (!material?.hazardLabels || material.hazardLabels.length === 0) return null;
      return material.hazardLabels.map((hl: any, idx: number) => (
        <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: sp(0.5) }}>
          <div style={{ width: s(32), height: s(32), padding: s(2), border: '1px solid #e2e8f0', borderRadius: s(4), display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }}>
            {hl.label?.imageUrl ? (
              <img src={getAbsoluteUrl(hl.label.imageUrl)} alt={hl.label.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <span style={{ fontWeight: 'bold', color: '#dc2626', textAlign: 'center', lineHeight: 1, fontSize: s(6) }}>
                GHS<br/>{hl.label?.code || ''}
              </span>
            )}
          </div>
          <span style={{ fontWeight: 'bold', color: '#dc2626', textAlign: 'center', lineHeight: 1.2, marginTop: s(2), maxWidth: s(32), fontSize: s(6) }}>
            {hl.label?.name}
          </span>
        </div>
      ));
    };

    const renderADR = () => {
      if (!material?.adrLabels || material.adrLabels.length === 0) return null;
      return material.adrLabels.map((al: any, idx: number) => (
        <div key={`adr-${idx}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: sp(0.5) }}>
          <div style={{ width: s(32), height: s(32), padding: s(2), borderRadius: s(4), display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', border: '1px solid #e2e8f0' }}>
            {al.label?.imageUrl ? (
              <img src={getAbsoluteUrl(al.label.imageUrl)} alt={al.label.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <span style={{ fontWeight: 'bold', color: '#ea580c', textAlign: 'center', lineHeight: 1, fontSize: s(6) }}>
                ADR<br/>{al.label?.name || ''}
              </span>
            )}
          </div>
          <span style={{ fontWeight: 'bold', color: '#ea580c', textAlign: 'center', lineHeight: 1.2, marginTop: s(2), maxWidth: s(32), fontSize: s(6) }}>
            {al.label?.name}
          </span>
        </div>
      ));
    };

    return (
      <div 
        ref={ref}
        style={{ 
          backgroundColor: 'white',
          color: 'black',
          padding: sp(2),
          margin: '0 auto',
          fontFamily: 'Arial, sans-serif',
          width: pageWidth,
          height: pageHeight,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxSizing: 'border-box',
          fontSize: rootFontSize
        }}
      >
        <table style={{flex: 1, width: '100%', borderCollapse: 'collapse', border: '1px solid #1e293b', tableLayout: 'fixed', marginBottom: sp(0.5) }}>
          <tbody>
            {/* Main Header */}
            <tr>
              <td colSpan={2} style={{ border: '1px solid #1e293b', padding: sp(1), position: 'relative', height: s(48) }}>
                <div style={{ position: 'absolute', left: s(8), top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={getAbsoluteUrl(facilityLogoUrl)} alt="Logo" style={{ maxHeight: s(32), width: 'auto', objectFit: 'contain' }} />
                </div>
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <h1 style={{ fontSize: s(16), fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', margin: 0 }}>GÜVENLİK BİLGİ KARTI</h1>
                </div>
              </td>
            </tr>

            {/* Info Section */}
            <tr style={{ border: '1px solid #1e293b' }}>
              <td colSpan={2} style={{ padding: 0, verticalAlign: 'top' }}>
                <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'stretch' }}>
                  
                  {/* Left Column (25%) */}
                  <div style={{ width: '25%', borderRight: '1px solid #1e293b', padding: sp(1), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', backgroundColor: '#f8fafc' }}>
                    <span style={{ fontWeight: 'bold', color: '#dc2626', textTransform: 'uppercase', marginBottom: s(4), fontSize: s(8) }}>
                      ÜRÜN TİCARİ<br/>ADI
                    </span>
                    <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '1.2em' }}>{material?.productName}</span>
                    {material?.imageUrl && (
                      <div style={{ marginTop: s(4), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img 
                          src={getAbsoluteUrl(material.imageUrl)} 
                          alt={material.productName} 
                          style={{ maxWidth: '100%', maxHeight: s(40), objectFit: 'contain', borderRadius: s(4), border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', padding: s(2), backgroundColor: 'white' }} 
                        />
                      </div>
                    )}
                  </div>

                  {/* Middle Column (50%) */}
                  <div style={{ width: '50%', borderRight: '1px solid #1e293b', padding: sp(1), display: 'flex', flexDirection: 'column', gap: s(2), lineHeight: 1.2, fontSize: 'inherit' }}>
                    <div><span style={{ fontWeight: 'bold' }}>Madde/Karışımın Kullanımı:</span><br/>{material?.usageMethod || '-'}</div>
                    <div><span style={{ fontWeight: 'bold' }}>Tedarikçi Firma:</span> {material?.brandName || '-'}</div>
                    <div style={{ marginTop: 'auto', paddingTop: s(2) }}>
                      <div style={{ fontWeight: 'bold', color: '#dc2626', fontSize: s(8) }}>Telefon:</div>
                      <div style={{ fontWeight: 'bold', color: '#dc2626', fontSize: s(8 * 1.1) }}>ULUSAL ZEHİR DANIŞMA MERKEZİ: 114</div>
                    </div>
                  </div>

                  {/* Right Column (25%) */}
                  <div style={{ width: '25%', padding: sp(1), position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: s(4) }}>
                       {renderGHS()}
                       {renderADR()}
                    </div>
                  </div>

                </div>
              </td>
            </tr>

            <HeaderSection title="ÜRÜN KULLANIM BİLGİLERİ" />
            <SectionRow title="Uygulama Şekli:" content={material?.usageMethod} />

            <HeaderSection title="ZARARLILIK VE ÖNLEM İFADELERİ" />
            <tr>
              <td colSpan={2} style={{ border: '1px solid #1e293b', padding: sp(1), verticalAlign: 'top', whiteSpace: 'pre-wrap', fontSize: 'inherit' }}>
                {material?.hazardDescription || '-'}
              </td>
            </tr>

            <HeaderSection 
              title="İLK YARDIM BİLGİLERİ" 
              icon={<div style={{ width: s(12), height: s(12), backgroundColor: '#dc2626', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: s(8), lineHeight: 1 }}>+</div>} 
            />
            
            {/* İlk yardım bilgileri */}
            <tr>
              <td colSpan={2} style={{ border: '1px solid #1e293b', padding: sp(1), verticalAlign: 'top', whiteSpace: 'pre-wrap', fontSize: 'inherit' }}>
                {material?.firstAid || '-'}
              </td>
            </tr>

            <HeaderSection title="YANGIN DURUMUNDA" />
            <tr>
              <td colSpan={2} style={{ border: '1px solid #1e293b', padding: sp(1), verticalAlign: 'top', whiteSpace: 'pre-wrap', fontSize: 'inherit' }}>
                {material?.fireFightingMeasures || '-'}
              </td>
            </tr>

            <HeaderSection title="KAZA SONUCU YAYILMAYA KARŞI ÖNLEMLER" />
            <tr>
              <td colSpan={2} style={{ border: '1px solid #1e293b', padding: sp(1), verticalAlign: 'top', whiteSpace: 'pre-wrap', fontSize: 'inherit' }}>
                {material?.accidentalReleaseMeasures || '-'}
              </td>
            </tr>

            <HeaderSection title="ÇEVRESEL TEDBİRLER" />
            <tr>
              <td colSpan={2} style={{ border: '1px solid #1e293b', padding: sp(1), verticalAlign: 'top', whiteSpace: 'pre-wrap', fontSize: 'inherit' }}>
                {material?.ecologicalInformation || '-'}
              </td>
            </tr>

            <HeaderSection title="ELLEÇLEME VE DEPOLAMA" />
            <tr>
              <td colSpan={2} style={{ border: '1px solid #1e293b', padding: sp(1), verticalAlign: 'top', whiteSpace: 'pre-wrap', fontSize: 'inherit' }}>
                {material?.handlingAndStorage || '-'}
              </td>
            </tr>

            <HeaderSection title="KİŞİSEL KORUYUCU ÖNLEMLER" />
            <tr>
              <td colSpan={2} style={{ border: '1px solid #1e293b', padding: sp(1.5), verticalAlign: 'top', fontSize: 'inherit' }}>
                {(!material?.ppes || material.ppes.length === 0) ? (
                  <span style={{ color: '#64748b' }}>-</span>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: s(12), justifyContent: 'center' }}>
                    {material.ppes.map((p: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: s(4) }}>
                        <div style={{ width: s(32), height: s(32), borderRadius: '50%', border: '2px solid #2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: s(4), backgroundColor: '#eff6ff', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
                           {p.ppe?.imageUrl ? (
                             <img src={getAbsoluteUrl(p.ppe.imageUrl)} alt={p.ppe.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                           ) : (
                             <span style={{ fontSize: s(6), color: '#2563eb', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center' }}>{p.ppe?.name}</span>
                           )}
                        </div>
                        <span style={{ fontSize: s(6), fontWeight: 'bold', color: '#334155', textAlign: 'center', textTransform: 'uppercase', maxWidth: s(50), lineHeight: 1.2 }}>
                          {p.ppe?.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </td>
            </tr>
          </tbody>
        </table>
        <div style={{ marginTop: sp(0.5), textAlign: 'left', fontSize: s(6), color: '#64748b' }}>
          İSG-YRD-47/00
        </div>
      </div>
    );
  }
);

MaterialPrintCard.displayName = 'MaterialPrintCard';

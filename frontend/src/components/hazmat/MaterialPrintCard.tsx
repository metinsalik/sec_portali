import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { BASE_URL } from '@/lib/api';

// Madde tipi ve arayüzler
interface MaterialPrintCardProps {
  material: any;
  facilityLogoUrl?: string;
  size?: 'A4' | 'A5';
}

export const MaterialPrintCard = forwardRef<HTMLDivElement, MaterialPrintCardProps>(
  ({ material, facilityLogoUrl = '/mlpcare.jpg', size = 'A4' }, ref) => {
    
    // Güvenlik Bilgi Kartı Stilleri
    // A4: 210mm x 297mm
    // A5: 148mm x 210mm
    const sizeClasses = size === 'A4' 
      ? 'w-[210mm] min-h-[297mm] text-sm' 
      : 'w-[148mm] min-h-[210mm] text-[10px] leading-tight';

    // Helper for table rows
    const SectionRow = ({ title, content, colSpan = 1 }: { title: string, content?: string | null, colSpan?: number }) => (
      <tr className="border border-slate-800">
        <td className="border-r border-slate-800 p-2 font-bold bg-slate-50 w-1/4 align-top">
          {title}
        </td>
        <td className="p-2 align-top whitespace-pre-wrap" colSpan={colSpan}>
          {content || '-'}
        </td>
      </tr>
    );

    const HeaderSection = ({ title, icon, colSpan = 2 }: { title: string, icon?: React.ReactNode, colSpan?: number }) => (
      <tr>
        <td colSpan={colSpan} className="border border-slate-800 p-2 font-bold text-center bg-slate-100 uppercase tracking-widest text-slate-800">
          <div className="flex items-center justify-center gap-2">
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
        <div key={idx} className="flex flex-col items-center justify-center gap-1 mb-1">
          <div className="w-16 h-16 p-1 border border-slate-200 rounded flex items-center justify-center bg-white">
            {hl.label?.imageUrl ? (
              <img src={getAbsoluteUrl(hl.label.imageUrl)} alt={hl.label.name} className="w-full h-full object-contain" />
            ) : (
              <span className="text-[10px] font-bold text-red-600 text-center leading-none">
                GHS<br/>{hl.label?.code || ''}
              </span>
            )}
          </div>
          <span className="text-[9px] font-bold text-red-600 text-center leading-tight">
            {hl.label?.name}
          </span>
        </div>
      ));
    };

    const renderADR = () => {
      if (!material?.adrLabels || material.adrLabels.length === 0) return null;
      return material.adrLabels.map((al: any, idx: number) => (
        <div key={`adr-${idx}`} className="flex flex-col items-center justify-center gap-1 mb-1">
          <div className="w-16 h-16 p-1 rounded flex items-center justify-center bg-white border border-slate-200">
            {al.label?.imageUrl ? (
              <img src={getAbsoluteUrl(al.label.imageUrl)} alt={al.label.name} className="w-full h-full object-contain" />
            ) : (
              <span className="text-[10px] font-bold text-orange-600 text-center leading-none">
                ADR<br/>{al.label?.name || ''}
              </span>
            )}
          </div>
          <span className="text-[9px] font-bold text-orange-600 text-center leading-tight">
            {al.label?.name}
          </span>
        </div>
      ));
    };

    return (
      <div 
        ref={ref}
        className={cn(
          "bg-white text-black p-8 mx-auto box-border",
          sizeClasses
        )}
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        <table className="w-full border-collapse border border-slate-800 table-fixed">
          <tbody>
            {/* Main Header */}
            <tr>
              <td colSpan={2} className="border border-slate-800 p-3 relative h-20">
                <div className="absolute left-4 top-0 bottom-0 flex items-center justify-center">
                  <img src={getAbsoluteUrl(facilityLogoUrl)} alt="Logo" className="max-h-16 w-auto object-contain" />
                </div>
                <div className="flex h-full items-center justify-center">
                  <h1 className="text-xl font-bold uppercase tracking-widest text-center m-0">GÜVENLİK BİLGİ KARTI</h1>
                </div>
              </td>
            </tr>

            {/* Info Section */}
            <tr className="border border-slate-800">
              <td colSpan={2} className="p-0 align-top">
                <div className="flex w-full h-full items-stretch">
                  
                  {/* Left Column (25%) */}
                  <div className="w-1/4 border-r border-slate-800 p-3 flex flex-col items-center justify-center text-center bg-slate-50">
                    <span className="font-bold text-red-600 uppercase text-xs mb-4">
                      ÜRÜN TİCARİ<br/>ADI
                    </span>
                    <span className="font-bold text-sm uppercase">{material?.productName}</span>
                    {material?.imageUrl && (
                      <div className="mt-4 flex items-center justify-center">
                        <img 
                          src={getAbsoluteUrl(material.imageUrl)} 
                          alt={material.productName} 
                          className="max-w-full max-h-[80px] object-contain rounded border border-slate-200 shadow-sm p-1 bg-white" 
                        />
                      </div>
                    )}
                  </div>

                  {/* Middle Column (50%) */}
                  <div className="w-1/2 border-r border-slate-800 p-3 flex flex-col gap-2 text-xs leading-relaxed">
                    <div><span className="font-bold">Madde/Karışımın Kullanımı:</span><br/>{material?.usageMethod || '-'}</div>
                    <div><span className="font-bold">Tedarikçi Firma:</span> {material?.brandName || '-'}</div>
                    <div className="mt-auto pt-2">
                      <div className="font-bold text-red-600">Telefon:</div>
                      <div className="font-bold text-red-600 text-sm">ULUSAL ZEHİR DANIŞMA MERKEZİ: 114</div>
                    </div>
                  </div>

                  {/* Right Column (25%) */}
                  <div className="w-1/4 p-2 relative flex flex-col items-center justify-center">
                    <div className="flex flex-wrap items-center justify-center gap-2">
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
              <td colSpan={2} className="border border-slate-800 p-3 align-top whitespace-pre-wrap min-h-[100px]">
                {material?.hazardDescription || '-'}
              </td>
            </tr>

            <HeaderSection 
              title="İLK YARDIM BİLGİLERİ" 
              icon={<div className="w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-sm leading-none">+</div>} 
            />
            
            {/* İlk yardım bilgileri */}
            <tr>
              <td colSpan={2} className="border border-slate-800 p-3 align-top whitespace-pre-wrap min-h-[60px]">
                {material?.firstAid || '-'}
              </td>
            </tr>

            <HeaderSection title="YANGIN DURUMUNDA" />
            <tr>
              <td colSpan={2} className="border border-slate-800 p-3 align-top whitespace-pre-wrap min-h-[60px]">
                {material?.fireFightingMeasures || '-'}
              </td>
            </tr>

            <HeaderSection title="KAZA SONUCU YAYILMAYA KARŞI ÖNLEMLER" />
            <tr>
              <td colSpan={2} className="border border-slate-800 p-3 align-top whitespace-pre-wrap min-h-[60px]">
                {material?.accidentalReleaseMeasures || '-'}
              </td>
            </tr>

            <HeaderSection title="ÇEVRESEL TEDBİRLER" />
            <tr>
              <td colSpan={2} className="border border-slate-800 p-3 align-top whitespace-pre-wrap min-h-[60px]">
                {material?.ecologicalInformation || '-'}
              </td>
            </tr>

            <HeaderSection title="ELLEÇLEME VE DEPOLAMA" />
            <tr>
              <td colSpan={2} className="border border-slate-800 p-3 align-top whitespace-pre-wrap min-h-[60px]">
                {material?.handlingAndStorage || '-'}
              </td>
            </tr>

            <HeaderSection title="KİŞİSEL KORUYUCU ÖNLEMLER" />
            <tr>
              <td colSpan={2} className="border border-slate-800 p-4 align-top">
                {(!material?.ppes || material.ppes.length === 0) ? (
                  <span className="text-muted-foreground">-</span>
                ) : (
                  <div className="flex flex-wrap gap-6 justify-center">
                    {material.ppes.map((p: any, idx: number) => (
                      <div key={idx} className="flex flex-col items-center gap-2">
                        <div className="w-14 h-14 rounded-full border-2 border-blue-600 flex items-center justify-center p-2 bg-blue-50 shadow-sm">
                           {p.ppe?.imageUrl ? (
                             <img src={getAbsoluteUrl(p.ppe.imageUrl)} alt={p.ppe.name} className="w-full h-full object-contain" />
                           ) : (
                             <span className="text-[10px] text-blue-600 font-bold uppercase text-center">{p.ppe?.name}</span>
                           )}
                        </div>
                        <span className="text-[10px] font-bold text-slate-700 text-center uppercase max-w-[80px] leading-tight">
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
        <div className="mt-2 text-left text-[8px] text-slate-500">
          İSG-YRD-47/00
        </div>
      </div>
    );
  }
);

MaterialPrintCard.displayName = 'MaterialPrintCard';

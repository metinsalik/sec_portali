import React, { forwardRef } from 'react';
import { BASE_URL } from '@/lib/api';

interface DepartmentPrintTableProps {
  department: any;
  inventoryItems: any[];
  facility: any;
}

export const DepartmentPrintTable = forwardRef<HTMLDivElement, DepartmentPrintTableProps>(({ department, inventoryItems, facility }, ref) => {
  const getAbsoluteUrl = (url: string) => {
    if (!url) return window.location.origin + '/mlpcare.jpg';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/uploads')) return `${BASE_URL}${url}`;
    return window.location.origin + (url.startsWith('/') ? url : `/${url}`);
  };

  const logoUrl = getAbsoluteUrl(facility?.logoUrl);

  const VertText = ({ children }: { children: React.ReactNode }) => (
    <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto' }}>
      {children}
    </div>
  );

  return (
    <div ref={ref} className="bg-white text-black p-2 text-[10px] w-full" style={{ fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        @page { size: landscape; margin: 10mm; }
        table { page-break-inside: auto; table-layout: fixed; width: 100%; word-wrap: break-word; word-break: break-word; overflow-wrap: break-word; }
        tr { page-break-inside: avoid; page-break-after: auto; }
        td, th { word-wrap: break-word; word-break: break-word; overflow-wrap: break-word; }
        thead { display: table-header-group; }
        .vert-col { width: 3%; }
      `}</style>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b-2 border-black pb-2">
        <img src={logoUrl} alt="Logo" className="max-h-16 w-auto object-contain" />
        <h1 className="text-xl font-bold text-center uppercase flex-1 mx-4">
          {department?.name} BÖLÜMÜ TEHLİKELİ MADDE ENVANTER VE GÜVENLİK BİLGİ LİSTESİ <br/>
          <span className="text-base font-normal mt-1 block">/ {facility?.name || 'Tesis Adı Yok'}</span>
        </h1>
        <div className="w-16" /> {/* Balance for center alignment */}
      </div>

      <table className="w-full border-collapse border border-slate-800 text-[8px] leading-tight table-fixed">
        <thead className="bg-[#fde6b1]">
          <tr>
            <th className="border border-slate-800 p-1 w-[4%] text-center align-middle font-bold"><VertText>Ürün Adı</VertText></th>
            <th className="border border-slate-800 p-1 w-[3%] text-center align-middle font-bold"><VertText>Adet / Miktar</VertText></th>
            <th className="border border-slate-800 p-1 w-[3%] text-center align-middle font-bold"><VertText>Firma Tedarikçi</VertText></th>
            <th className="border border-slate-800 p-1 w-[5%] text-center align-middle font-bold">Kullanım<br/>Şekli</th>
            <th className="border border-slate-800 p-1 w-[5%] text-center align-middle font-bold">Bileşimi / İçerik</th>
            <th className="border border-slate-800 p-1 w-[6%] text-center align-middle font-bold">Tehlike Tanımları</th>
            <th className="border border-slate-800 p-1 w-[7%] text-center align-middle font-bold">İlk Yardım Önlemleri</th>
            <th className="border border-slate-800 p-1 w-[7%] text-center align-middle font-bold">Yangınla Mücadele<br/>Tedbirleri</th>
            <th className="border border-slate-800 p-1 w-[7%] text-center align-middle font-bold">Kaza Sonucu Serbest Kalma Durumunda Alınacak Tedbirler</th>
            <th className="border border-slate-800 p-1 w-[7%] text-center align-middle font-bold">Kullanım ve Depolama</th>
            <th className="border border-slate-800 p-1 w-[6%] text-center align-middle font-bold">Maruz Kalma Kontrolü ve Kişisel Korunma</th>
            <th className="border border-slate-800 p-1 w-[6%] text-center align-middle font-bold">Fiziksel ve Kimyasal<br/>Özellikleri</th>
            <th className="border border-slate-800 p-1 w-[6%] text-center align-middle font-bold">Stabilite ve Reaktivite</th>
            <th className="border border-slate-800 p-1 w-[7%] text-center align-middle font-bold">Toksikolojik Bilgi</th>
            <th className="border border-slate-800 p-1 w-[5%] text-center align-middle font-bold">Ekolojik Bilgi</th>
            <th className="border border-slate-800 p-1 w-[5%] text-center align-middle font-bold">Tehlikeli / Atık Yönetimi</th>
            <th className="border border-slate-800 p-1 w-[4%] text-center align-middle font-bold">Taşıma Bilgisi</th>
            <th className="border border-slate-800 p-1 w-[4%] text-center align-middle font-bold">Yönetmelik Bilgisi</th>
            <th className="border border-slate-800 p-1 w-[3%] text-center align-middle font-bold">Diğer</th>
            <th className="border border-slate-800 p-1 w-[5%] text-center align-middle font-bold">Tehlikeli Madde Sınıfı/Görseli</th>
          </tr>
        </thead>
        <tbody>
          {inventoryItems.map((item, idx) => {
            const m = item.material;
            return (
              <tr key={idx} className="hover:bg-slate-50 text-center">
                <td className="border border-slate-800 p-1 align-middle font-bold">
                  <VertText>{m.productName}</VertText>
                </td>
                <td className="border border-slate-800 p-1 align-middle whitespace-nowrap">
                  <VertText>{item.minQuantity ?? '-'} - {item.maxQuantity ?? '-'} L</VertText>
                </td>
                <td className="border border-slate-800 p-1 align-middle">
                  <VertText>{m.brandName || '-'}</VertText>
                </td>
                <td className="border border-slate-800 p-1 align-middle">{m.usageMethod || '-'}</td>
                <td className="border border-slate-800 p-1 align-middle">
                   Kimyasal Yapısı: {m.composition || m.category?.name || '-'}
                </td>
                <td className="border border-slate-800 p-1 align-middle whitespace-pre-wrap">{m.hazardDescription || 'Yutulması halinde zararlı...'}</td>
                <td className="border border-slate-800 p-1 align-middle whitespace-pre-wrap">{m.firstAid || '-'}</td>
                <td className="border border-slate-800 p-1 align-middle whitespace-pre-wrap">{m.fireFightingMeasures || '-'}</td>
                <td className="border border-slate-800 p-1 align-middle whitespace-pre-wrap">{m.accidentalReleaseMeasures || '-'}</td>
                <td className="border border-slate-800 p-1 align-middle whitespace-pre-wrap">{m.handlingAndStorage || '-'}</td>
                <td className="border border-slate-800 p-1 align-middle">
                  <div className="whitespace-pre-wrap mb-2">
                    {m.exposureControlsPpe || '-'}
                  </div>
                  <div className="flex flex-wrap gap-1.5 items-center justify-center">
                    {m.ppes?.map((p: any, i: number) => (
                      <div key={i} className="flex flex-col items-center">
                         {p.ppe?.imageUrl ? (
                           <img src={getAbsoluteUrl(p.ppe.imageUrl)} alt={p.ppe.name} className="w-8 h-8 object-contain" />
                         ) : (
                           <span className="font-bold text-[8px] uppercase">{p.ppe?.name}</span>
                         )}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="border border-slate-800 p-1 align-middle whitespace-pre-wrap">{m.physicalChemicalProperties || 'Fiziksel: Sıvı'}</td>
                <td className="border border-slate-800 p-1 align-middle whitespace-pre-wrap">{m.stabilityAndReactivity || 'Oda sıcaklığında depolandığında stabildir.'}</td>
                <td className="border border-slate-800 p-1 align-middle whitespace-pre-wrap">{m.toxicologicalInformation || '-'}</td>
                <td className="border border-slate-800 p-1 align-middle whitespace-pre-wrap">{m.ecologicalInformation || 'Çevreye zararı beklenmez.'}</td>
                <td className="border border-slate-800 p-1 align-middle whitespace-pre-wrap">{m.disposalConsiderations || '-'}</td>
                <td className="border border-slate-800 p-1 align-middle whitespace-pre-wrap">{m.transportInformation || '-'}</td>
                <td className="border border-slate-800 p-1 align-middle whitespace-pre-wrap">{m.regulatoryInformation || '-'}</td>
                <td className="border border-slate-800 p-1 align-middle text-center">(-)</td>
                <td className="border border-slate-800 p-1 align-middle text-center">
                  <div className="flex flex-col gap-1 items-center justify-center">
                    {m.adrLabels && m.adrLabels.length > 0 ? (
                      m.adrLabels.map((al: any, i: number) => (
                        <div key={i} className="flex flex-col items-center p-0.5 bg-white border border-slate-200">
                          {al.label?.imageUrl ? (
                            <img src={getAbsoluteUrl(al.label.imageUrl)} alt={al.label.name} className="w-10 h-10 object-contain" />
                          ) : (
                            <span className="font-bold text-[8px] uppercase">{al.label?.code}</span>
                          )}
                          <span className="text-[6px] font-bold text-red-600 mt-0.5 max-w-[40px] text-center leading-tight">
                            {al.label?.name}
                          </span>
                        </div>
                      ))
                    ) : m.hazardLabels && m.hazardLabels.length > 0 ? (
                      m.hazardLabels.map((hl: any, i: number) => (
                        <div key={i} className="flex flex-col items-center p-0.5 bg-white border border-slate-200">
                          {hl.label?.imageUrl ? (
                            <img src={getAbsoluteUrl(hl.label.imageUrl)} alt={hl.label.name} className="w-10 h-10 object-contain" />
                          ) : (
                            <span className="font-bold text-[8px] uppercase">{hl.label?.code}</span>
                          )}
                          <span className="text-[6px] font-bold text-red-600 mt-0.5 max-w-[40px] text-center leading-tight">
                            {hl.label?.name}
                          </span>
                        </div>
                      ))
                    ) : m.imageUrl ? (
                      <div className="flex flex-col items-center p-0.5 bg-white border border-slate-200">
                        <img src={getAbsoluteUrl(m.imageUrl)} alt={m.productName} className="w-12 h-12 object-contain" />
                        <span className="text-[6px] font-bold text-slate-600 mt-0.5 max-w-[40px] text-center leading-tight">
                          Ürün Görseli
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

DepartmentPrintTable.displayName = 'DepartmentPrintTable';

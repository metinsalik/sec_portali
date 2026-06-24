import React, { forwardRef } from 'react';

interface Props {
  project: any;
  inspection: any;
}

export const BuildHandoverInfectionPrintTemplate = forwardRef<HTMLDivElement, Props>(
  ({ project, inspection }, ref) => {
    const formCode = "ENF-F76/00";
    const checklist = inspection?.checklistData || [];

    if (!project || !inspection) return null;

    return (
      <div ref={ref} className="print-template" style={{ width: '194mm', margin: '0 auto', fontSize: '11px', color: '#000', fontFamily: 'Arial, sans-serif', padding: '10mm' }}>
        <style type="text/css" media="print">
          {`
            @page { margin: 10mm; }
            body { font-family: Arial, sans-serif; font-size: 11px; margin: 0; padding: 0; }
            table { page-break-inside: auto; border-collapse: collapse; width: 100%; margin-bottom: 5px; table-layout: fixed; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            thead { display: table-header-group; }
            tfoot { display: table-footer-group; }
            th, td { border: 1px solid #000; padding: 3px 4px; vertical-align: top; }
            th { background-color: #f1f2f5 !important; font-weight: bold; text-align: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .bg-gray { background-color: #f1f2f5 !important; font-weight: bold; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-border td { border: none; padding: 0; }
            .title-box { text-align: center; font-size: 14px; font-weight: bold; padding: 8px 0; position: relative; margin-bottom: 5px;}
            .title-box img { position: absolute; left: 0; top: 50%; transform: translateY(-50%); height: 35px; }
            .info-table td:nth-child(odd) { width: 20%; background-color: #f1f2f5 !important; font-weight: bold; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .info-table td:nth-child(even) { width: 80%; }
            .checklist-table th:nth-child(1) { width: 5%; }
            .checklist-table th:nth-child(2) { width: 50%; }
            .checklist-table th:nth-child(3),
            .checklist-table th:nth-child(4),
            .checklist-table th:nth-child(5) { width: 5%; text-align: center; }
            .checklist-table th:nth-child(6) { width: 30%; }
            .center { text-align: center; }
            .number { text-align: center; font-weight: bold; }
            .sig-table { margin-top: 10px; margin-bottom: 0; page-break-inside: avoid; }
            .sig-table th { width: 33%; background-color: #f1f2f5 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .sig-table td { height: 40px; }
            .footer-info { display: flex; justify-content: space-between; font-size: 9px; margin-top: 5px; }
          `}
        </style>
        
        <table className="main-table">
          <thead>
            <tr className="no-border">
              <td>
                <div className="title-box">
                  <img src="/mlpcare.jpg" alt="Logo" />
                  ENFEKSİYON KONTROL TESLİM ALMA LİSTESİ
                </div>
                
                <table className="info-table">
                  <tbody>
                    <tr>
                      <td className="bg-gray">Proje Adı</td>
                      <td>{project.name}</td>
                    </tr>
                    <tr>
                      <td className="bg-gray">Firma / Yüklenici</td>
                      <td>{project.contractor?.name || 'Belirtilmedi'}</td>
                    </tr>
                    <tr>
                      <td className="bg-gray">Tarih</td>
                      <td>{new Date(inspection.inspectionDate).toLocaleDateString('tr-TR')}</td>
                    </tr>
                    <tr>
                      <td className="bg-gray">ICRA Sınıfı</td>
                      <td>{project.icraClass || 'Belirtilmedi'}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </thead>
          
          <tbody>
            <tr className="no-border">
              <td>
                <table className="checklist-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Kontrol Edilecek Hususlar</th>
                      <th>U</th>
                      <th>UD</th>
                      <th>KD</th>
                      <th>Açıklama</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checklist.map((item: any, i: number) => (
                      <tr key={i}>
                        <td className="number">{i + 1}</td>
                        <td>{item.text}</td>
                        <td className="center">{item.answer === 'U' ? 'X' : ''}</td>
                        <td className="center">{item.answer === 'UD' ? 'X' : ''}</td>
                        <td className="center">{item.answer === 'KD' ? 'X' : ''}</td>
                        <td>{item.note || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {inspection.notes && (
                  <table style={{ marginTop: '5px' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '4px' }}>Genel Notlar</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '4px', minHeight: '30px' }}>{inspection.notes}</td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </td>
            </tr>
          </tbody>
          
          <tfoot>
            <tr className="no-border">
              <td>
                <table className="sig-table">
                  <thead>
                    <tr>
                      <th>Teslim Eden (Yüklenici)</th>
                      <th>Kontrol Eden (Enfeksiyon)</th>
                      <th>Teslim Alan (Proje Yöneticisi)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ verticalAlign: 'top', height: '60px' }}>
                        <div style={{fontWeight:'bold'}}>Adı Soyadı:</div>
                        <div>İmza:</div>
                      </td>
                      <td style={{ verticalAlign: 'top', height: '60px' }}>
                        <div style={{fontWeight:'bold'}}>Adı Soyadı: {inspection.inspector}</div>
                        <div>İmza:</div>
                      </td>
                      <td style={{ verticalAlign: 'top', height: '60px' }}>
                        <div style={{fontWeight:'bold'}}>Adı Soyadı: {project.projectManager}</div>
                        <div>İmza:</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
                
                <div className="footer-info">
                  <span>{formCode}</span>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }
);
BuildHandoverInfectionPrintTemplate.displayName = 'BuildHandoverInfectionPrintTemplate';

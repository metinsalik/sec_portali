import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, Upload, X, CheckCircle, AlertCircle, 
  Layers, Building2, Check, RefreshCw, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import { type FacilityOption, SHEET_MAP } from './types';

const API = import.meta.env.VITE_API_URL || '';

interface Props {
  facilities: FacilityOption[];
  activeFacilityId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImprovementExcelImportModal: React.FC<Props> = ({
  facilities,
  activeFacilityId,
  onClose,
  onSuccess
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(
    activeFacilityId !== 'ALL' ? activeFacilityId : (facilities[0]?.id || '')
  );
  const [file, setFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheets, setSheets] = useState<Array<{ name: string; rowCount: number }>>([]);
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
  const [activePreviewSheet, setActivePreviewSheet] = useState<string>('');
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [loading, setLoading] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number; sheetName: string } | null>(null);

  // Dosya seçildiğinde
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    processFile(files[0]);
  };

  const processFile = (f: File) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: 'binary', cellDates: true });
        setWorkbook(wb);

        const sheetInfos: Array<{ name: string; rowCount: number }> = [];
        const detectedSheets: string[] = [];

        wb.SheetNames.forEach(sheetName => {
          // Sayfa2 veya Dashboard hariç tutulabilir veya listelenebilir
          if (sheetName.toLowerCase() === 'sayfa2') return;

          const ws = wb.Sheets[sheetName];
          const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });
          // Başlık satırı hariç veri satırları (genelde 4. satırdan sonra)
          const validDataRows = rawRows.filter((r, idx) => idx >= 4 && r && r.length > 2);
          
          sheetInfos.push({
            name: sheetName,
            rowCount: validDataRows.length,
          });

          // Başlangıçta veri içeren sekmeleri otomatik seç (Dashboard hariç)
          if (sheetName.toLowerCase() !== 'dashboard' && validDataRows.length > 0) {
            detectedSheets.push(sheetName);
          }
        });

        setSheets(sheetInfos);
        setSelectedSheets(detectedSheets.length > 0 ? detectedSheets : (sheetInfos[0] ? [sheetInfos[0].name] : []));

        // İlk sekmenin önizlemesini yükle
        const firstSheet = detectedSheets[0] || sheetInfos[0]?.name;
        if (firstSheet) {
          loadSheetPreview(wb, firstSheet);
        }

        // Hastane adını dosya veya sheet içinde otomatik bulmaya çalış
        const lowerName = f.name.toLowerCase();
        const matchedFac = facilities.find(fac => 
          lowerName.includes(fac.shortName.toLowerCase()) || 
          lowerName.includes(fac.name.toLowerCase())
        );
        if (matchedFac) {
          setSelectedFacilityId(matchedFac.id);
        }

        toast.success(`${sheetInfos.length} sekme tespit edildi.`);
      } catch (err: any) {
        console.error('Error reading excel:', err);
        toast.error('Excel dosyası okunamadı: ' + err.message);
      }
    };
    reader.readAsBinaryString(f);
  };

  const loadSheetPreview = (wb: XLSX.WorkBook, sheetName: string) => {
    setActivePreviewSheet(sheetName);
    const ws = wb.Sheets[sheetName];
    if (!ws) {
      setPreviewRows([]);
      return;
    }

    const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });
    // Başlık satırı (4. satır -> index 3) ve veri satırları (index 4+)
    if (rawRows.length <= 4) {
      setPreviewRows([]);
      return;
    }

    const headers = rawRows[3] || [];
    const rows = rawRows.slice(4, 9).map((row, idx) => {
      const obj: any = {};
      headers.forEach((h: any, colIdx: number) => {
        if (h) {
          obj[String(h).trim()] = row[colIdx] ?? '';
        }
      });
      return obj;
    });

    setPreviewRows(rows);
  };

  const toggleSheetSelection = (sheetName: string) => {
    if (selectedSheets.includes(sheetName)) {
      setSelectedSheets(selectedSheets.filter(s => s !== sheetName));
    } else {
      setSelectedSheets([...selectedSheets, sheetName]);
    }
  };

  const selectAllSheets = () => {
    const valid = sheets.filter(s => s.name.toLowerCase() !== 'dashboard').map(s => s.name);
    setSelectedSheets(valid);
  };

  const deselectAllSheets = () => {
    setSelectedSheets([]);
  };

  // İçe Aktarma İşlemi
  const handleImport = async () => {
    if (!workbook) {
      toast.error('Lütfen bir Excel dosyası yükleyin.');
      return;
    }
    if (!selectedFacilityId) {
      toast.error('Lütfen hedef hastaneyi seçin.');
      return;
    }
    if (selectedSheets.length === 0) {
      toast.error('Lütfen aktarılacak en az bir sekme (sheet) seçin.');
      return;
    }

    setLoading(true);
    let totalImported = 0;

    try {
      const token = localStorage.getItem('token');

      for (let i = 0; i < selectedSheets.length; i++) {
        const sheetName = selectedSheets[i];
        setImportProgress({ current: i + 1, total: selectedSheets.length, sheetName });

        const ws = workbook.Sheets[sheetName];
        if (!ws) continue;

        // Başlık 4. satır (index 3), veriler 5. satırdan (index 4) başlar
        const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });
        if (rawRows.length <= 4) continue;

        const headers: string[] = (rawRows[3] || []).map(h => String(h || '').trim());
        const dataRows = rawRows.slice(4);

        const parsedRows = dataRows.map((r, rIdx) => {
          const rowObj: any = {};
          headers.forEach((h, cIdx) => {
            if (h) {
              rowObj[h] = r[cIdx];
            }
          });
          // Sıra no
          rowObj.rowNo = rIdx + 1;
          return rowObj;
        });

        // Backend'e gönder
        const response = await fetch(`${API}/api/operations/improvements/import-sheet`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify({
            facilityId: selectedFacilityId,
            sheetName,
            rows: parsedRows,
            sourceFileName: file?.name || 'Excel Yükleme',
            mode: importMode,
          })
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.message || `${sheetName} aktarılırken hata oluştu.`);
        }

        totalImported += (result.insertedCount || 0);
      }

      toast.success(`Başarılı! Toplam ${totalImported} kayıt aktarıldı.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Import error:', err);
      toast.error('Aktarım hatası: ' + err.message);
    } finally {
      setLoading(false);
      setImportProgress(null);
    }
  };

  const selectedFacility = facilities.find(f => f.id === selectedFacilityId);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#1e2327] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Başlık */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Excel ile İyileştirme Takip İçe Aktar</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sahadan toplanan Takip Tablosu (v3) Excel dosyasını seçip aktarmak istediğiniz sekmeleri belirleyin.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gövde */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Adım 1: Hastane ve Dosya Seçimi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Hastane Seçimi */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-500" />
                Hedef Hastane (Sadece Hastaneler)
              </label>
              <select
                value={selectedFacilityId}
                onChange={(e) => setSelectedFacilityId(e.target.value)}
                disabled={loading}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {facilities.map(fac => (
                  <option key={fac.id} value={fac.id}>
                    {fac.name} {fac.city ? `(${fac.city})` : ''} — {fac.recordCount} kayıt
                  </option>
                ))}
              </select>
              {selectedFacility && (
                <p className="text-[11px] text-slate-500">
                  Seçili: <strong className="text-slate-700 dark:text-slate-300">{selectedFacility.name}</strong> ({selectedFacility.recordCount} mevcut kayıt)
                </p>
              )}
            </div>

            {/* İçe Aktarma Modu */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                Aktarım Modu
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setImportMode('append')}
                  className={`h-10 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                    importMode === 'append'
                      ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950/40 dark:border-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Check className={`w-3.5 h-3.5 ${importMode === 'append' ? 'opacity-100' : 'opacity-0'}`} />
                  Üzerine Ekle (Append)
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('replace')}
                  className={`h-10 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                    importMode === 'replace'
                      ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Check className={`w-3.5 h-3.5 ${importMode === 'replace' ? 'opacity-100' : 'opacity-0'}`} />
                  Sekmeyi Sıfırla (Replace)
                </button>
              </div>
            </div>

          </div>

          {/* Dosya Yükleme Alanı */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx, .xls"
              className="hidden"
            />
            
            {!file ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 rounded-xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-900/20 hover:bg-blue-50/30"
              >
                <Upload className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Excel dosyasını buraya sürükleyin veya tıklayarak seçin
                </p>
                <p className="text-xs text-slate-500">
                  Desteklenen şablonlar: İyilestirme Takip Tablosu_v3.xlsx, ANT-MP-İyilestirme Takip Tablosu vb.
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-xl">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{file.name}</p>
                    <p className="text-xs text-slate-500">
                      {(file.size / 1024).toFixed(1)} KB — {sheets.length} sekme bulundu
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="text-xs"
                >
                  Farklı Dosya Seç
                </Button>
              </div>
            )}
          </div>

          {/* Adım 2: Sekme (Sheet) Seçimi */}
          {sheets.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Aktarılacak Sekmeleri Seçin ({selectedSheets.length} / {sheets.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Sadece işaretlediğiniz sekmeler aktarılır.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllSheets}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    Tümünü Seç
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={deselectAllSheets}
                    className="text-xs text-slate-500 hover:underline font-medium"
                  >
                    Temizle
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {sheets.map(sh => {
                  const isSelected = selectedSheets.includes(sh.name);
                  const isPreview = activePreviewSheet === sh.name;
                  const isDashboard = sh.name.toLowerCase() === 'dashboard';

                  return (
                    <div
                      key={sh.name}
                      className={`relative border rounded-xl p-3 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-blue-400 bg-blue-50/70 dark:bg-blue-950/40 dark:border-blue-700 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-slate-300'
                      }`}
                      onClick={() => toggleSheetSelection(sh.name)}
                    >
                      <div className="flex items-start justify-between gap-1.5 mb-1.5">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={sh.name}>
                          {sh.name}
                        </span>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 pointer-events-none"
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{sh.rowCount > 0 ? `${sh.rowCount} veri satırı` : 'Veri yok'}</span>
                        {workbook && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              loadSheetPreview(workbook, sh.name);
                            }}
                            className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${isPreview ? 'text-blue-600 font-bold' : ''}`}
                            title="Önizle"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Adım 3: Sekme Önizlemesi */}
          {activePreviewSheet && previewRows.length > 0 && (
            <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 bg-slate-50/40 dark:bg-slate-900/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-blue-500" />
                  Önizleme: <strong>{activePreviewSheet}</strong> (İlk 5 Satır)
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {previewRows.length} satır gösteriliyor
                </Badge>
              </div>

              <div className="overflow-x-auto max-h-48 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-800">
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      {Object.keys(previewRows[0] || {}).slice(0, 7).map(col => (
                        <th key={col} className="p-2 font-semibold whitespace-nowrap">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-700/40">
                        {Object.keys(previewRows[0] || {}).slice(0, 7).map(col => (
                          <td key={col} className="p-2 truncate max-w-[200px]" title={String(row[col] || '')}>
                            {String(row[col] ?? '-')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* İlerleme Çubuğu */}
          {importProgress && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl space-y-2">
              <div className="flex justify-between text-xs font-semibold text-blue-900 dark:text-blue-200">
                <span>Aktarılıyor: {importProgress.sheetName}</span>
                <span>{importProgress.current} / {importProgress.total} sekme</span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-900 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

        </div>

        {/* Alt Butonlar */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Vazgeç
          </Button>

          <Button
            onClick={handleImport}
            disabled={loading || !workbook || selectedSheets.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                İçe Aktarılıyor...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                {selectedSheets.length} Sekmeyi İçe Aktar
              </>
            )}
          </Button>
        </div>

      </div>
    </div>
  );
};

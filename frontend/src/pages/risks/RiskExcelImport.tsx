import { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

const API = import.meta.env.VITE_API_URL || '';

interface Props {
  facilityId: string;
  departmentName?: string;
  areaName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

// Excel sütun eşleme (esnek — Türkçe başlıkları destekler)
const COL_MAP: Record<string, string> = {
  // 1. Bölüm Genel Bilgiler
  'tespit tarihi': 'detectionDate',
  'alt risk kategorisi': 'subCategory', // Matches first due to string length sorting
  'alt kategori': 'subCategory',
  'risk kategorisi': 'riskCategory',
  'bölüm': 'department', 'departman': 'department', 'birim / bölüm': 'department', 'birim': 'department',
  'alan': 'area',
  'faaliyet': 'activity',

  // 2. Bölüm : Mevcut Durum Değerlendirmesi:
  'tehlike': 'hazard',
  'sonuç/ olası etki zarar': 'impactDamage',
  'sonuç / olası etki zarar': 'impactDamage',
  'sonuç /olası etki zarar': 'impactDamage',
  'sonuç/olası etki zarar': 'impactDamage',
  'olası etki zarar': 'impactDamage',
  'olası etki': 'impactDamage',
  'riskten etkilenecek kişiler': 'affectedPeople',
  'etkilenecek kişiler': 'affectedPeople',
  'mevcut durum açıklaması (tespit edilen riske ilişkin mevcut önlemler)': 'initialCondition',
  'mevcut durum açıklaması': 'initialCondition',
  'mevcut durum görseli (varsa tespit edilen riske ilişkin görsel)': 'initialImage',
  'mevcut durum görseli': 'initialImage',
  
  // 3. Mevcut Risk Skoru (Parent + Sub)
  'mevcut risk skoru olasılık': 'initialProb',
  'mevcut risk skoru frekans': 'initialFreq',
  'mevcut risk skoru şiddet': 'initialSev',
  'mevcut risk skoru risk puanı': 'initialScore',
  'mevcut risk skoru risk seviyesi': 'initialLevel',
  // Fallbacks for initial score
  'olasılık': 'initialProb',
  'frekans': 'initialFreq',
  'şiddet': 'initialSev',
  'risk puanı': 'initialScore',
  'risk seviyesi': 'initialLevel',
  
  'ilgili mevzuat': 'legislation',
  'mevzuat': 'legislation',

  // 4. Bölüm İyileştirme Planı / Uygulama
  'iyileştirme planı': 'firstActionPlan',
  'alınacak önlemler / iyileştirici faaliyet': 'firstActionPlan',
  'alınacak önlemler': 'firstActionPlan',
  'iyileştirici faaliyet': 'firstActionPlan',
  'iyileştirme sorumlusu': 'improvementResponsible',
  'termin tarihi': 'dueDate',
  'termin': 'dueDate',
  'iyileştirme açıklaması (tespit edilen riske ilişkin yapılan iyileştirmeler)': 'actionsTaken',
  'iyileştirme açıklaması': 'actionsTaken',
  'iyileştirme tamamlanma tarihi': 'actionDate',
  'tamamlanma tarihi': 'actionDate',
  'iyileştirme sonrası görseli (yapılan iyileştirme sonrasını gösteren görsel)': 'actionImage',
  'iyileştirme sonrası görseli': 'actionImage',

  // 5. İyileştirme Sonrası Risk Skoru
  'iyileştirme sonrası risk skoru olasılık': 'finalProb',
  'iyileştirme sonrası risk skoru frekans': 'finalFreq',
  'iyileştirme sonrası risk skoru şiddet': 'finalSev',
  'iyileştirme sonrası risk skoru risk puanı': 'finalScore',
  'iyileştirme sonrası risk skoru risk seviyesi': 'finalLevel',

  // 6. Bölüm İyileştirme Etkinlik Ölçümü
  'etkinlik ölçüm yöntemi': 'effectivenessMethod',
  'iyileştirme kontrol sorumlusu': 'controlResponsible',
  'kontrol sorumlusu': 'controlResponsible',
  'etkinlik ölçümü sonuç': 'controlResult', // If parent is combined
  'kontrol sonucu': 'controlResult',
  'etkinlik sonucu': 'controlResult',

  // The most generic one must be at the end, but the matching uses string length sorting anyway.
  'risk': 'riskDescription',

  // Fallbacks and exact match handles
  'no': 'riskNo', 'sıra no': 'riskNo', 'risk no': 'riskNo',
};

function normalizeHeader(h: string): string {
  return h.toLowerCase().trim().replace(/\s+/g, ' ');
}

export default function RiskExcelImport({ facilityId, departmentName, areaName, onClose, onSuccess }: Props) {
  const token = localStorage.getItem('token');
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);

  const parseWorkbookSheet = (wb: XLSX.WorkBook, sheetName: string) => {
    try {
      const ws = wb.Sheets[sheetName];
      if (!ws) {
        toast.error('Sayfa bulunamadı.');
        return;
      }
      
      const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
      if (raw.length < 1) {
        toast.error('Sayfa boş veya satır yok.');
        setRows([]);
        return;
      }

      // 1. Find the header row dynamically
      let headerRowIdx = 0;
      for (let i = 0; i < Math.min(raw.length, 25); i++) {
        const row = raw[i];
        if (Array.isArray(row)) {
          const hasNo = row.some(cell => {
            const str = String(cell || '').toLowerCase().trim();
            return str === 'no' || str === 'sıra no' || str === 'risk no';
          });
          const hasTehlike = row.some(cell => String(cell || '').toLowerCase().includes('tehlike'));
          const hasRisk = row.some(cell => String(cell || '').toLowerCase().includes('risk'));
          if (hasNo && (hasTehlike || hasRisk)) {
            headerRowIdx = i;
            break;
          }
        }
      }

      // 2. Extract default department from metadata in Row 2 or nearby
      let extractedDept = '';
      for (let i = 0; i < Math.min(raw.length, 10); i++) {
        const row = raw[i];
        if (Array.isArray(row)) {
          const labelIdx = row.findIndex(cell => {
            const str = String(cell || '').toLowerCase().trim();
            return str.includes('değerlendirilen bölüm') || str.includes('değerlendirilen birim');
          });
          if (labelIdx !== -1) {
            // Check if there is "diğer ise belirtiniz" in the row
            const digerIdx = row.findIndex(cell => String(cell || '').toLowerCase().includes('diğer ise belirtiniz'));
            if (digerIdx !== -1) {
              // Get the first non-empty cell after "diğer ise belirtiniz"
              for (let j = digerIdx + 1; j < row.length; j++) {
                if (row[j] !== undefined && row[j] !== null && String(row[j]).trim() !== '') {
                  extractedDept = String(row[j]).trim();
                  break;
                }
              }
            }
            // If we didn't find "diğer ise belirtiniz" or its value is empty, get the first non-empty after labelIdx
            if (!extractedDept) {
              for (let j = labelIdx + 1; j < row.length; j++) {
                const val = String(row[j] || '').trim();
                if (val && val !== 'Diğer') {
                  extractedDept = val;
                  break;
                }
              }
            }
          }
        }
      }

      // 3. Determine if the next row is sub-headers
      const rawHeaders = raw[headerRowIdx] || [];
      const subHeaders = raw[headerRowIdx + 1] || [];
      const hasSubHeaders = subHeaders.some(cell => {
        const str = String(cell || '').toLowerCase().trim();
        return str === 'olasılık' || str === 'şiddet' || str === 'frekans';
      });

      // 4. Build flat headers
      let currentParent = '';
      const headers: string[] = [];
      const maxColLen = Math.max(rawHeaders.length, subHeaders.length);

      for (let colIdx = 0; colIdx < maxColLen; colIdx++) {
        const parentVal = rawHeaders[colIdx];
        if (parentVal !== undefined && parentVal !== null && String(parentVal).trim() !== '') {
          currentParent = String(parentVal).trim();
        }

        const subVal = hasSubHeaders ? subHeaders[colIdx] : null;
        let combined = currentParent;
        if (subVal !== undefined && subVal !== null && String(subVal).trim() !== '') {
          combined = `${currentParent} ${String(subVal).trim()}`;
        }
        
        headers[colIdx] = normalizeHeader(combined);
      }

      // 5. Parse data rows
      const dataStartIdx = hasSubHeaders ? headerRowIdx + 2 : headerRowIdx + 1;
      const mapped = raw.slice(dataStartIdx).filter(r => r.some(Boolean)).map(row => {
        const obj: any = {};
        const sortedKeys = Object.keys(COL_MAP).sort((a, b) => b.length - a.length);

        let seenOlasilik = 0;
        let seenFrekans = 0;
        let seenSiddet = 0;
        let seenPuan = 0;
        let seenSeviye = 0;

        headers.forEach((h, i) => {
          const matchedKey = sortedKeys.find(k => h.includes(k));
          if (matchedKey) {
            let field = COL_MAP[matchedKey];

            if (field === 'initialProb') {
              if (seenOlasilik === 1) field = 'finalProb';
              seenOlasilik++;
            }
            if (field === 'initialFreq') {
              if (seenFrekans === 1) field = 'finalFreq';
              seenFrekans++;
            }
            if (field === 'initialSev') {
              if (seenSiddet === 1) field = 'finalSev';
              seenSiddet++;
            }
            if (field === 'initialScore') {
              if (seenPuan === 1) field = 'finalScore';
              seenPuan++;
            }
            if (field === 'initialLevel') {
              if (seenSeviye === 1) field = 'finalLevel';
              seenSeviye++;
            }

            if (obj[field] === undefined) {
              obj[field] = row[i] ?? '';
            }
          }
        });
        
        // Always prioritize the active department where the user is importing from.
        const finalDept = departmentName || obj.department || extractedDept || 'Genel';
        obj.department = finalDept;
        
        // As requested: Alan: Departmanla aynı veya seçilen alan olarak gelsin
        obj.area = areaName || obj.area || finalDept;
        
        return obj;
      }).filter(r => r.department || r.hazard || r.riskDescription || r.riskCategory);

      setRows(mapped);
      setPreview(true);
      toast.success(`${mapped.length} satır okundu (${sheetName})`);
    } catch (err) {
      console.error(err);
      toast.error('Tablo ayrıştırılamadı.');
    }
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: 'array', cellDates: true });
        setWorkbook(wb);
        setSheets(wb.SheetNames);
        
        // Find default sheet
        let defaultSheet = wb.SheetNames[0];
        const match = wb.SheetNames.find(name => 
          name.toLowerCase().includes('birim bazlı') || 
          name.toLowerCase().includes('kinney') || 
          name.toLowerCase().includes('matris') || 
          name.toLowerCase().includes('risk')
        );
        if (match) defaultSheet = match;
        
        setSelectedSheet(defaultSheet);
        parseWorkbookSheet(wb, defaultSheet);
      } catch (err) {
        toast.error('Excel dosyası okunamadı.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/risks/lifecycle/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ facilityId, rows }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success(data.message);
      onSuccess();
    } catch {
      toast.error('İçe aktarma başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 bg-black/50 overflow-y-auto">
      <div className="w-full max-w-3xl bg-card rounded-2xl shadow-2xl border">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="font-bold">Excel'den Risk Aktar</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Fine Kinney veya Matris tablosu yükleyin</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-5 space-y-5">
          {!preview ? (
            <div
              className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            >
              <FileSpreadsheet className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="font-medium">Excel dosyasını sürükleyin veya tıklayın</p>
              <p className="text-xs text-muted-foreground mt-1">.xlsx, .xls desteklenir</p>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
                onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
            </div>
          ) : (
            <>
              {/* Özet */}
              <div className="flex items-center gap-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-medium text-sm text-emerald-700 dark:text-emerald-400">{fileName}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500">{rows.length} satır okundu — içe aktarmaya hazır</p>
                </div>
              </div>

              {/* Sayfa Seçimi */}
              {sheets.length > 1 && (
                <div className="space-y-1.5 bg-muted/20 border rounded-lg p-3">
                  <label className="text-xs font-bold text-muted-foreground block">Aktarılacak Excel Sayfası (Sheet)</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    value={selectedSheet}
                    onChange={(e) => {
                      setSelectedSheet(e.target.value);
                      if (workbook) parseWorkbookSheet(workbook, e.target.value);
                    }}
                  >
                    {sheets.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Önizleme Tablosu */}
              <div className="overflow-auto max-h-64 border rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Departman</th>
                      <th className="px-3 py-2 text-left font-medium">Tehlike</th>
                      <th className="px-3 py-2 text-left font-medium">Risk</th>
                      <th className="px-3 py-2 text-left font-medium">Skor</th>
                      <th className="px-3 py-2 text-left font-medium">Son Skor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.slice(0, 20).map((row, i) => (
                      <tr key={i} className="hover:bg-muted/30">
                        <td className="px-3 py-2 font-medium">{row.department || '—'}</td>
                        <td className="px-3 py-2 max-w-[160px] truncate">{row.hazard || '—'}</td>
                        <td className="px-3 py-2 max-w-[200px] truncate">{row.riskDescription || '—'}</td>
                        <td className="px-3 py-2 font-bold">{row.initialScore || '—'}</td>
                        <td className="px-3 py-2 font-bold text-emerald-600">{row.finalScore || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 20 && (
                  <p className="text-center text-xs text-muted-foreground py-2">
                    + {rows.length - 20} satır daha (önizlemede gösterilmiyor)
                  </p>
                )}
              </div>

              {/* Uyarılar */}
              <div className="flex items-start gap-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 px-4 py-3">
                <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  Veritabanında olmayan departmanlar <strong>otomatik oluşturulacak</strong>.
                  Mevcut risklerle çakışma olmaz — tüm satırlar yeni kayıt olarak eklenir.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t bg-muted/20">
          <Button variant="ghost" size="sm" onClick={() => { setPreview(false); setRows([]); }}>
            {preview ? 'Farklı Dosya' : 'İptal'}
          </Button>
          {preview && (
            <Button size="sm" onClick={handleImport} disabled={loading || rows.length === 0}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1" />}
              {rows.length} Riski İçe Aktar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

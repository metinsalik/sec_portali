import { useState, useRef, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, Upload, X, CheckCircle, AlertCircle, 
  HelpCircle, Eye, RefreshCw, Building2, Layers, MapPin, 
  ChevronRight, Sparkles 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || '';

interface Props {
  facilityId: string;
  departmentName?: string;
  locationName?: string;
  areaName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

// Kolon eşleme sözlüğü
const COLUMN_MAPPINGS: Record<string, string> = {
  // Sıra / No
  'no': 'riskNo',
  'sıra no': 'riskNo',
  'sira no': 'riskNo',
  'risk no': 'riskNo',

  // Tarih / Zaman
  'tespit tarihi': 'detectionDate',
  'tarih': 'detectionDate',

  // Lokasyon / Bölüm / Faaliyet
  'bölüm': 'department',
  'bolum': 'department',
  'birim': 'department',
  'değerlendirilen bölüm': 'department',
  'değerlendirilen birim': 'department',
  'alan': 'area',
  'mahal': 'area',
  'faaliyet': 'activity',
  'yapılan iş': 'activity',
  'is': 'activity',

  // Tehlike ve Risk
  'tehlike': 'hazard',
  'tehlike tanımı': 'hazard',
  'tehlike kaynağı': 'hazard',
  'kaynak': 'hazard',
  'risk': 'riskDescription',
  'risk tanımı': 'riskDescription',
  'oluşabilecek zarar': 'riskDescription',
  'sonuç / olası etki zarar': 'impactDamage',
  'sonuç/olası etki zarar': 'impactDamage',
  'sonuç/ olası etki zarar': 'impactDamage',
  'olası etki zarar': 'impactDamage',
  'etki zarar': 'impactDamage',
  'etkilenenler': 'affectedPeople',
  'riskten etkilenecek kişiler': 'affectedPeople',
  'etkilenecek kişiler': 'affectedPeople',
  'ilgili mevzuat': 'legislation',
  'mevzuat': 'legislation',
  'kategori': 'riskCategory',
  'risk kategorisi': 'riskCategory',
  'ana kategori': 'riskCategory',
  'alt kategori': 'subCategory',
  'alt risk kategorisi': 'subCategory',

  // Mevcut Durum Açıklaması
  'mevcut durum': 'initialCondition',
  'mevcut durum açıklaması': 'initialCondition',
  'alınmış önlemler': 'initialCondition',

  // Mevcut Risk Skoru (İlk Skorlama - Fine Kinney veya Matris)
  'ihtimal': 'initialProb',
  'olasılık': 'initialProb',
  'olasilik': 'initialProb',
  'frekans': 'initialFreq',
  'şiddet': 'initialSev',
  'siddet': 'initialSev',
  'etki': 'initialSev',
  'risk skoru': 'initialScore',
  'risk puanı': 'initialScore',
  'puan': 'initialScore',
  'risk seviyesi': 'initialLevel',
  'derece': 'initialLevel',

  // İyileştirme Planı
  'alınacak önlemler / iyileştirici faaliyet': 'firstActionPlan',
  'alınacak önlemler/iyileştirici faaliyet': 'firstActionPlan',
  'alınacak önlemler': 'firstActionPlan',
  'iyileştirici faaliyet': 'firstActionPlan',
  'aksiyon planı': 'firstActionPlan',
  'yapılacak faaliyetler': 'firstActionPlan',
  'önlem': 'firstActionPlan',
  'iyileştirme sorumlusu': 'improvementResponsible',
  'sorumlu': 'improvementResponsible',
  'termin': 'dueDate',
  'termin tarihi': 'dueDate',
  'hedef tarih': 'dueDate',
  'termin periyodu': 'dueDatePeriod',
  'iyileştirme açıklaması': 'actionsTaken',
  'yapılan iyileştirme': 'actionsTaken',
  'yapılan faaliyet': 'actionsTaken',
  'yapılan çalışma': 'actionsTaken',
  'iyileştirme tamamlanma tarihi': 'actionDate',
  'tamamlanma tarihi': 'actionDate',

  // İyileştirme Sonrası Risk Skoru
  'son ihtimal': 'finalProb',
  'son frekans': 'finalFreq',
  'son şiddet': 'finalSev',
  'son risk skoru': 'finalScore',
  'sonuç risk skoru': 'finalScore',
  'kalan risk skoru': 'finalScore',
  'son seviye': 'finalLevel',
  'kalan risk seviyesi': 'finalLevel',

  // İyileştirme Etkinlik Ölçümü
  'etkinlik ölçüm yöntemi': 'effectivenessMethod',
  'ölçüm yöntemi': 'effectivenessMethod',
  'etkinlik yöntemi': 'effectivenessMethod',
  'iyileştirme kontrol sorumlusu': 'controlResponsible',
  'kontrol sorumlusu': 'controlResponsible',
  'sonuç': 'controlResult',
  'kontrol sonucu': 'controlResult',

  // Durum
  'durum': 'status',
  'durumu': 'status',
};

function normalizeHeader(h: string): string {
  return String(h || '')
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/ı/g, 'i')
    .replace(/Ğ/g, 'g')
    .replace(/ğ/g, 'g')
    .replace(/Ü/g, 'u')
    .replace(/ü/g, 'u')
    .replace(/Ş/g, 's')
    .replace(/ş/g, 's')
    .replace(/Ö/g, 'o')
    .replace(/ö/g, 'o')
    .replace(/Ç/g, 'c')
    .replace(/ç/g, 'c')
    .toLowerCase()
    .trim()
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ');
}

export default function RiskExcelImport({ facilityId, onClose, onSuccess }: Props) {
  const token = localStorage.getItem('token');
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);

  // Lokasyon Verileri
  const [locations, setLocations] = useState<any[]>([]);

  // Basamaklı Hedef Seçimi (Bina/Blok -> Kat -> Birim -> Mahal)
  // Mode: 'auto' | 'custom'
  const [targetMode, setTargetMode] = useState<'auto' | 'custom'>('auto');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [selectedFloor, setSelectedFloor] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');

  // Tesisin tanımlı lokasyonlarını çekelim
  useEffect(() => {
    if (!facilityId) return;
    fetch(`${API}/api/risks/locations?facilityId=${facilityId}&flat=true`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLocations(data);
      })
      .catch(console.error);
  }, [facilityId, token]);

  // Hiyerarşik Ağaç İnşası (Bina -> Kat -> Birim -> Mahaller)
  const hierarchy = useMemo(() => {
    const buildings: Record<string, {
      floors: Record<string, {
        departments: Record<string, any[]>
      }>
    }> = {};

    locations.forEach(loc => {
      const b = loc.building || 'Ana Bina';
      const f = loc.floor || 'Genel';
      const d = loc.department || 'Genel';

      if (!buildings[b]) buildings[b] = { floors: {} };
      if (!buildings[b].floors[f]) buildings[b].floors[f] = { departments: {} };
      if (!buildings[b].floors[f].departments[d]) buildings[b].floors[f].departments[d] = [];

      buildings[b].floors[f].departments[d].push(loc);
    });

    return buildings;
  }, [locations]);

  // Bina Listesi
  const buildingList = useMemo(() => Object.keys(hierarchy), [hierarchy]);

  // Seçili Binaya Göre Kat Listesi
  const floorList = useMemo(() => {
    if (!selectedBuilding || !hierarchy[selectedBuilding]) return [];
    return Object.keys(hierarchy[selectedBuilding].floors);
  }, [hierarchy, selectedBuilding]);

  // Seçili Kata Göre Birim Listesi
  const deptList = useMemo(() => {
    if (!selectedBuilding || !selectedFloor || !hierarchy[selectedBuilding]?.floors[selectedFloor]) return [];
    return Object.keys(hierarchy[selectedBuilding].floors[selectedFloor].departments);
  }, [hierarchy, selectedBuilding, selectedFloor]);

  // Seçili Birime Göre Mahal Listesi
  const unitList = useMemo(() => {
    if (!selectedBuilding || !selectedFloor || !selectedDept || !hierarchy[selectedBuilding]?.floors[selectedFloor]?.departments[selectedDept]) return [];
    return hierarchy[selectedBuilding].floors[selectedFloor].departments[selectedDept];
  }, [hierarchy, selectedBuilding, selectedFloor, selectedDept]);

  // İlk bina yüklendiğinde otomatik seç
  useEffect(() => {
    if (buildingList.length > 0 && !selectedBuilding) {
      setSelectedBuilding(buildingList[0]);
    }
  }, [buildingList, selectedBuilding]);

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

      // 1. Header row bul
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

      // 2. Default department tespit
      let extractedDept = '';
      for (let i = 0; i < Math.min(raw.length, 10); i++) {
        const row = raw[i];
        if (Array.isArray(row)) {
          const labelIdx = row.findIndex(cell => {
            const str = String(cell || '').toLowerCase().trim();
            return str.includes('değerlendirilen bölüm') || str.includes('değerlendirilen birim');
          });
          if (labelIdx !== -1) {
            const digerIdx = row.findIndex(cell => String(cell || '').toLowerCase().includes('diğer ise belirtiniz'));
            if (digerIdx !== -1) {
              for (let j = digerIdx + 1; j < row.length; j++) {
                if (row[j] !== undefined && row[j] !== null && String(row[j]).trim() !== '') {
                  extractedDept = String(row[j]).trim();
                  break;
                }
              }
            }
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

      const rawHeaders = raw[headerRowIdx] || [];
      const subHeaders = raw[headerRowIdx + 1] || [];
      const isMultiLevel = subHeaders.some((cell: any) => {
        const str = normalizeHeader(String(cell || ''));
        return str.includes('olasilik') || str.includes('frekans') || str.includes('siddet') || str.includes('puan') || str === 'i' || str === 'f' || str === 'ş' || str === 's';
      });

      const colMap: Record<number, string> = {};
      const maxCols = Math.max(rawHeaders.length, subHeaders.length);

      for (let c = 0; c < maxCols; c++) {
        const top = normalizeHeader(rawHeaders[c] || '');
        const sub = normalizeHeader(subHeaders[c] || '');

        // Sıra No / Tespit Tarihi
        if (c === 0 || top === 'no' || top === 'sira no' || top === 'risk no') {
          colMap[c] = 'riskNo';
        } else if (top.includes('tespit tarihi')) {
          colMap[c] = 'detectionDate';
        } else if (top.includes('alt risk') || top.includes('alt kategori')) {
          colMap[c] = 'subCategory';
        } else if (top.includes('risk kategori') || top === 'kategori') {
          colMap[c] = 'riskCategory';
        } else if (top === 'alan' || top === 'mahal') {
          colMap[c] = 'area';
        } else if (top === 'faaliyet' || top.includes('yapilan is')) {
          colMap[c] = 'activity';
        } else if (top === 'tehlike' || top.includes('tehlike tanimi') || top.includes('tehlike kaynagi')) {
          colMap[c] = 'hazard';
        } else if (top === 'risk' || top.includes('risk tanimi')) {
          colMap[c] = 'riskDescription';
        } else if (top.includes('olasi etki') || top.includes('etki zarar') || top.includes('zarar')) {
          colMap[c] = 'impactDamage';
        } else if (top.includes('etkilenecek') || top.includes('etkilenenler')) {
          colMap[c] = 'affectedPeople';
        } else if (top.includes('mevcut durum gorseli') || top.includes('mevcut gorsel')) {
          colMap[c] = 'initialImage';
        } else if (top.includes('mevcut durum aciklamasi') || top.includes('mevcut durum')) {
          colMap[c] = 'initialCondition';
        } 
        // 1. Mevcut Risk Skoru (Fine-Kinney / Matris)
        else if (sub.includes('olasilik') || sub === 'i' || sub === 'ihtimal') {
          if (!Object.values(colMap).includes('initialProb')) colMap[c] = 'initialProb';
          else colMap[c] = 'finalProb';
        } else if (sub.includes('frekans') || sub === 'f') {
          if (!Object.values(colMap).includes('initialFreq')) colMap[c] = 'initialFreq';
          else colMap[c] = 'finalFreq';
        } else if (sub.includes('siddet') || sub === 'ş' || sub === 's' || sub === 'etki') {
          if (!Object.values(colMap).includes('initialSev')) colMap[c] = 'initialSev';
          else colMap[c] = 'finalSev';
        } else if (sub.includes('puan') || sub.includes('skor')) {
          if (!Object.values(colMap).includes('initialScore')) colMap[c] = 'initialScore';
          else colMap[c] = 'finalScore';
        } else if (sub.includes('seviye') || sub.includes('derece')) {
          if (!Object.values(colMap).includes('initialLevel')) colMap[c] = 'initialLevel';
          else colMap[c] = 'finalLevel';
        }
        // İyileştirme Planı ve Sorumlular
        else if (sub.includes('alinacak onlem') || top.includes('alinacak onlem') || top.includes('iyilestirme plani')) {
          colMap[c] = 'firstActionPlan';
        } else if (sub.includes('iyilestirme sorumlusu') || top.includes('iyilestirme sorumlusu')) {
          colMap[c] = 'improvementResponsible';
        } else if (sub.includes('termin') || top.includes('termin')) {
          colMap[c] = 'dueDate';
        } else if (top.includes('iyilestirme aciklamasi') || top.includes('yapilan calisma') || top.includes('yapilan iyilestirme')) {
          colMap[c] = 'actionsTaken';
        } else if (top.includes('tamamlanma tarihi') || top.includes('iyilestirme tarihi')) {
          colMap[c] = 'actionDate';
        } else if (top.includes('sonrasi gorsel')) {
          colMap[c] = 'actionImage';
        }
        // Etkinlik Ölçümü ve Mevzuat
        else if (sub.includes('olcum yontemi') || top.includes('olcum yontemi') || top.includes('etkinlik')) {
          colMap[c] = 'effectivenessMethod';
        } else if (sub.includes('kontrol sorumlusu') || top.includes('kontrol sorumlusu')) {
          colMap[c] = 'controlResponsible';
        } else if (sub.includes('sonuc') || top.includes('sonuc')) {
          colMap[c] = 'controlResult';
        } else if (top.includes('mevzuat') || top.includes('kanun')) {
          colMap[c] = 'legislation';
        }
      }

      const dataStartIdx = headerRowIdx + (isMultiLevel ? 2 : 1);
      const parsedRows: any[] = [];

      for (let r = dataStartIdx; r < raw.length; r++) {
        const row = raw[r];
        if (!row || row.length === 0) continue;

        const rowObj: any = {};
        let hasData = false;

        Object.entries(colMap).forEach(([cIdx, field]) => {
          const val = row[Number(cIdx)];
          if (val !== undefined && val !== null && String(val).trim() !== '') {
            rowObj[field] = val;
            hasData = true;
          }
        });

        if (hasData && (rowObj.hazard || rowObj.riskDescription || rowObj.riskNo)) {
          if (!rowObj.department && extractedDept) {
            rowObj.department = extractedDept;
          }
          parsedRows.push(rowObj);
        }
      }

      setRows(parsedRows);
      setPreview(true);
      toast.success(`${parsedRows.length} adet risk kaydı başarıyla ayrıştırıldı.`);
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

    // Kapsam / Hedef parametrelerini belirle
    let payloadTargetLocationId = 'auto';
    let targetLevel: string | undefined = undefined;
    let targetPath: string | undefined = undefined;

    if (targetMode === 'custom') {
      if (selectedLocationId) {
        // Doğrudan spesifik bir mahal/lokasyon seçildiyse
        payloadTargetLocationId = selectedLocationId;
      } else if (selectedDept && selectedFloor && selectedBuilding) {
        targetLevel = 'department';
        targetPath = `${selectedBuilding}|${selectedFloor}|${selectedDept}`;
      } else if (selectedFloor && selectedBuilding) {
        targetLevel = 'floor';
        targetPath = `${selectedBuilding}|${selectedFloor}`;
      } else if (selectedBuilding) {
        targetLevel = 'building';
        targetPath = selectedBuilding;
      }
    }

    try {
      const res = await fetch(`${API}/api/risks/lifecycle/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          facilityId, 
          rows,
          targetLocationId: payloadTargetLocationId,
          targetLevel,
          targetPath
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'İçe aktarma başarısız');
      }
      toast.success(data.message);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'İçe aktarma başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-card border rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Başlık */}
        <div className="p-4 px-6 border-b flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-foreground">Excel'den Risk Yaşam Döngüsü Aktarımı</h2>
              <p className="text-xs text-muted-foreground">Fine Kinney veya Matris tablolarınızı akıllı eşleştirme veya basamaklı hedefle aktarın</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {!preview ? (
            <div
              className="border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            >
              <Upload className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="font-semibold text-foreground text-sm">Excel dosyasını sürükleyin veya seçmek için tıklayın</p>
              <p className="text-xs text-muted-foreground mt-1">.xlsx veya .xls dosyaları desteklenir</p>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
                onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
            </div>
          ) : (
            <>
              {/* Özet Kartı */}
              <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-foreground">{fileName}</p>
                    <p className="text-xs text-emerald-600 font-medium">{rows.length} satır risk verisi başarıyla okundu</p>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 text-xs bg-card"
                  onClick={() => fileRef.current?.click()}
                >
                  <RefreshCw className="w-3 h-3 mr-1" /> Dosya Değiştir
                  <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
                    onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
                </Button>
              </div>

              {/* ─── BASAMAKLI HEDEF SEÇİMİ (BLOK › KAT › BİRİM › MAHAL) ────────── */}
              <div className="bg-muted/30 border rounded-2xl p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-primary" />
                      Hedef Lokasyon Belirleme
                    </label>
                    <p className="text-[11px] text-muted-foreground">
                      Risklerin tesisin hangi hiyerarşik kademesine aktarılacağını seçin.
                    </p>
                  </div>

                  {/* Mod Seçimi (Akıllı Eşleme vs Basamaklı Seçim) */}
                  <div className="inline-flex rounded-lg border bg-background p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setTargetMode('auto')}
                      className={`px-3 py-1 rounded-md font-medium transition-all ${
                        targetMode === 'auto'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Sparkles className="w-3 h-3 inline mr-1" />
                      Otomatik Akıllı Eşleme
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetMode('custom')}
                      className={`px-3 py-1 rounded-md font-medium transition-all ${
                        targetMode === 'custom'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Basamaklı Seçim (Bina/Kat/Birim)
                    </button>
                  </div>
                </div>

                {targetMode === 'auto' ? (
                  <div className="p-3 bg-background border rounded-xl text-xs text-muted-foreground space-y-1">
                    <p className="font-semibold text-foreground">🤖 Akıllı Eşleme Devrede:</p>
                    <p>
                      Excel tablosundaki <strong>Bölüm/Birim</strong> ve <strong>Alan/Mahal</strong> sütunları taranarak tesisinizde önceden tanımlanmış lokasyonlarla otomatik eşleştirilir.
                    </p>
                  </div>
                ) : (
                  /* Basamaklı Seçiciler */
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {/* 1. BLOK / BİNA */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-primary" /> 1. Blok / Bina
                        </label>
                        <select
                          className="w-full text-xs bg-background border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                          value={selectedBuilding}
                          onChange={(e) => {
                            setSelectedBuilding(e.target.value);
                            setSelectedFloor('');
                            setSelectedDept('');
                            setSelectedLocationId('');
                          }}
                        >
                          <option value="">Seçiniz...</option>
                          {buildingList.map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>

                      {/* 2. KAT */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                          <Layers className="w-3 h-3 text-blue-500" /> 2. Kat (İsteğe Bağlı)
                        </label>
                        <select
                          disabled={!selectedBuilding}
                          className="w-full text-xs bg-background border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                          value={selectedFloor}
                          onChange={(e) => {
                            setSelectedFloor(e.target.value);
                            setSelectedDept('');
                            setSelectedLocationId('');
                          }}
                        >
                          <option value="">Tüm Katlar (Bina Geneli)</option>
                          {floorList.map(f => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      </div>

                      {/* 3. BİRİM / DEPARTMAN */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-emerald-500" /> 3. Birim (İsteğe Bağlı)
                        </label>
                        <select
                          disabled={!selectedFloor}
                          className="w-full text-xs bg-background border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                          value={selectedDept}
                          onChange={(e) => {
                            setSelectedDept(e.target.value);
                            setSelectedLocationId('');
                          }}
                        >
                          <option value="">Tüm Birimler (Kat Geneli)</option>
                          {deptList.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      {/* 4. MAHAL / ALAN */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-500" /> 4. Spesifik Mahal
                        </label>
                        <select
                          disabled={!selectedDept || unitList.length === 0}
                          className="w-full text-xs bg-background border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                          value={selectedLocationId}
                          onChange={(e) => setSelectedLocationId(e.target.value)}
                        >
                          <option value="">Birim Geneli</option>
                          {unitList.map((unit: any) => (
                            <option key={unit.id} value={unit.id}>
                              {unit.description || unit.name || 'Ana Mahal'}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Seçilen Kapsam Özeti Bildirimi */}
                    <div className="p-2.5 px-3 rounded-xl bg-primary/5 border border-primary/20 text-xs flex items-center gap-2">
                      <span className="font-semibold text-primary">Hedef Kapsam:</span>
                      <span className="text-foreground font-medium">
                        {selectedBuilding || 'Tesis'} 
                        {selectedFloor && ` › ${selectedFloor}`} 
                        {selectedDept && ` › ${selectedDept}`}
                        {selectedLocationId && ` › (Seçili Mahal)`}
                      </span>
                      <span className="text-muted-foreground ml-auto text-[11px]">
                        {selectedLocationId 
                          ? 'Tüm riskler doğrudan bu mahalle kaydedilir.' 
                          : selectedDept 
                          ? 'Riskler bu birime ait olarak işlenir.' 
                          : selectedFloor 
                          ? 'Riskler seçili katın altına bağlanır.' 
                          : 'Riskler seçili binaya bağlanır.'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Sayfa Seçimi (Eğer Excel'de birden çok sayfa varsa) */}
              {sheets.length > 1 && (
                <div className="flex items-center gap-3 bg-muted/20 border rounded-xl p-3">
                  <label className="text-xs font-bold text-muted-foreground shrink-0">Aktarılacak Sheet:</label>
                  <select
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
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

              {/* Kapsamlı Önizleme Tablosu */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-bold uppercase tracking-wider text-foreground">
                    Ayrıştırılan Veriler Önizlemesi (İlk 10 Kayıt)
                  </span>
                  <span className="font-semibold text-primary">Toplam {rows.length} risk aktarılacak</span>
                </div>
                <div className="border rounded-xl overflow-x-auto max-h-64 overflow-y-auto bg-background/50 shadow-2xs">
                  <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
                    <thead className="bg-muted/80 border-b text-muted-foreground sticky top-0 z-10 text-[11px] font-bold">
                      <tr>
                        <th className="p-2.5 w-12 text-center">No</th>
                        <th className="p-2.5">Birim</th>
                        <th className="p-2.5">Alan / Mahal</th>
                        <th className="p-2.5">Kategori / Alt Kategori</th>
                        <th className="p-2.5">Tehlike</th>
                        <th className="p-2.5">Risk Açıklaması</th>
                        <th className="p-2.5">Mevcut Durum</th>
                        <th className="p-2.5 text-center">O / F / Ş</th>
                        <th className="p-2.5 text-center font-bold">Mevcut Skor</th>
                        <th className="p-2.5">Alınacak Önlemler</th>
                        <th className="p-2.5">Sorumlu</th>
                        <th className="p-2.5">Termin</th>
                        <th className="p-2.5">İyileştirme Açıklaması</th>
                        <th className="p-2.5 text-center">Son Skor</th>
                        <th className="p-2.5">Etkinlik Yöntemi</th>
                        <th className="p-2.5">Kontrol Sonucu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {rows.slice(0, 10).map((row, idx) => (
                        <tr key={idx} className="hover:bg-muted/40 transition-colors">
                          <td className="p-2.5 font-mono font-bold text-center text-primary">#{row.riskNo || idx + 1}</td>
                          <td className="p-2.5 font-semibold text-foreground">{row.department || selectedDept || '-'}</td>
                          <td className="p-2.5 text-muted-foreground">{row.area || '-'}</td>
                          <td className="p-2.5 text-muted-foreground">
                            {row.riskCategory || '-'} {row.subCategory ? `› ${row.subCategory}` : ''}
                          </td>
                          <td className="p-2.5 font-medium max-w-[200px] truncate" title={row.hazard}>{row.hazard || '-'}</td>
                          <td className="p-2.5 max-w-[220px] truncate" title={row.riskDescription}>{row.riskDescription || '-'}</td>
                          <td className="p-2.5 max-w-[180px] truncate" title={row.initialCondition}>{row.initialCondition || '-'}</td>
                          <td className="p-2.5 text-center font-mono text-muted-foreground">
                            {row.initialProb ?? '-'}/{row.initialFreq ?? '-'}/{row.initialSev ?? '-'}
                          </td>
                          <td className="p-2.5 text-center font-mono font-black text-rose-600">
                            {row.initialScore || '-'} {row.initialLevel ? `(${row.initialLevel})` : ''}
                          </td>
                          <td className="p-2.5 max-w-[200px] truncate" title={row.firstActionPlan}>{row.firstActionPlan || '-'}</td>
                          <td className="p-2.5 font-medium">{row.improvementResponsible || '-'}</td>
                          <td className="p-2.5 text-muted-foreground">{row.dueDate || row.dueDatePeriod || '-'}</td>
                          <td className="p-2.5 max-w-[200px] truncate" title={row.actionsTaken}>{row.actionsTaken || '-'}</td>
                          <td className="p-2.5 text-center font-mono font-bold text-emerald-600">{row.finalScore ?? '-'}</td>
                          <td className="p-2.5 max-w-[160px] truncate" title={row.effectivenessMethod}>{row.effectivenessMethod || '-'}</td>
                          <td className="p-2.5 max-w-[160px] truncate" title={row.controlResult}>{row.controlResult || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Alt Aksiyonlar */}
        <div className="p-4 px-6 border-t bg-muted/10 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onClose}>
            İptal
          </Button>

          {preview && (
            <Button
              size="sm"
              onClick={handleImport}
              disabled={loading || rows.length === 0}
              className="px-5 font-semibold"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  İçe Aktarılıyor...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  {rows.length} Riski Sisteme Aktar
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

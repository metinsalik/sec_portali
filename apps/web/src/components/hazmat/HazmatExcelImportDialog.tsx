import React, { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import api from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileSpreadsheet,
  Download,
  Upload,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Info,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface TemplateColumnDef {
  key: string;
  header: string;
  group: 'META' | 'GBF';
  width: number;
  required?: boolean;
  example: string;
  guide: string;
}

const TEMPLATE_COLUMNS: TemplateColumnDef[] = [
  // 1. AŞAMA: ÜRÜN & BELGE BİLGİLERİ
  {
    key: 'productName',
    header: 'Ürün / Madde Adı *',
    group: 'META',
    width: 30,
    required: true,
    example: '%70 İzopropil Alkol Yüzey Dezenfektanı',
    guide: 'Zorunlu. Kimyasalın GBF üzerinde yazan tam ticari adı.',
  },
  {
    key: 'categoryName',
    header: 'Kategori',
    group: 'META',
    width: 24,
    example: 'Dezenfektanlar',
    guide: 'Sistemde tanımlı Hazmat kategori adı (Excel açılır listesinden seçilebilir).',
  },
  {
    key: 'brandName',
    header: 'Tedarikçi / Marka',
    group: 'META',
    width: 22,
    example: 'Örnek Medikal Kimya A.Ş.',
    guide: 'Üretici veya tedarikçi firma / marka adı.',
  },
  {
    key: 'sdsNumber',
    header: 'GBF Numarası',
    group: 'META',
    width: 18,
    example: 'SDS-7404',
    guide: 'Güvenlik Bilgi Formu numarası (örn. 7404 veya SDS-7404).',
  },
  {
    key: 'sdsRevision',
    header: 'Revizyon No',
    group: 'META',
    width: 14,
    example: 'Rev-02',
    guide: 'Belge revizyon numarası (örn. 02 veya Rev-02).',
  },
  {
    key: 'sdsDate',
    header: 'Hazırlanma Tarihi',
    group: 'META',
    width: 18,
    example: '2025-03-15',
    guide: 'YYYY-AA-GG veya GG.AA.YYYY biçiminde (örn. 2025-03-15).',
  },
  {
    key: 'sdsRevisionDate',
    header: 'Revizyon Tarihi',
    group: 'META',
    width: 18,
    example: '2026-01-10',
    guide: 'YYYY-AA-GG veya GG.AA.YYYY biçiminde.',
  },
  {
    key: 'sdsExpiryDate',
    header: 'Geçerlilik Son Tarihi',
    group: 'META',
    width: 20,
    example: '2029-01-10',
    guide: 'YYYY-AA-GG veya GG.AA.YYYY biçiminde.',
  },
  {
    key: 'productKind',
    header: 'Ürün Türü',
    group: 'META',
    width: 14,
    example: 'karışım',
    guide: 'Geçerli değerler: karışım veya madde.',
  },
  {
    key: 'sdsRegime',
    header: 'Mevzuat / Belge Dönemi',
    group: 'META',
    width: 22,
    example: 'KKDİK Ek-2',
    guide: 'Geçerli değerler: KKDİK Ek-2 | 2014 GBF formatı | Diğer / eski format.',
  },

  // 2. AŞAMA: 16 RESMÎ GBF BÖLÜMÜ (Görsel/Piktogram/KKD/ADR hariç tüm metin alanları)
  {
    key: 'usageMethod',
    header: 'Bölüm 1 - Madde/Karışım ve Tedarikçi Kimliği',
    group: 'GBF',
    width: 34,
    example: 'Tıbbi cihaz ve yüzey dezenfeksiyonunda profesyonel kullanım içindir.',
    guide: 'GBF Bölüm 1: Ürün kimliği, belirlenmiş kullanımlar ve tedarikçi iletişim bilgileri.',
  },
  {
    key: 'hazardDescription',
    header: 'Bölüm 2 - Zararlılık Tanımlanması',
    group: 'GBF',
    width: 34,
    example: 'Alev. Sıvı 2 (H225), Göz Tah. 2 (H319), BHOT Tek Mrz. 3 (H336). Uyarı kelimesi: TEHLİKE.',
    guide: 'GBF Bölüm 2: Sınıflandırma, H/P ifadeleri ve uyarı kelimesi (GHS görselleri sistemden seçilir).',
  },
  {
    key: 'composition',
    header: 'Bölüm 3 - Bileşimi / İçindekiler',
    group: 'GBF',
    width: 34,
    example: 'Propan-2-ol (CAS: 67-63-0) %65-75; Deiyonize Su %25-35.',
    guide: 'GBF Bölüm 3: Kimyasal bileşenler, CAS/EC numaraları ve yüzdelik oranlar.',
  },
  {
    key: 'firstAid',
    header: 'Bölüm 4 - İlk Yardım Önlemleri',
    group: 'GBF',
    width: 34,
    example: 'Göz ile temasta en az 15 dk bol su ile yıkayın. Solunması halinde temiz havaya çıkarın.',
    guide: 'GBF Bölüm 4: Soluma, cilt, göz teması ve yutma durumunda ilk yardım.',
  },
  {
    key: 'fireFightingMeasures',
    header: 'Bölüm 5 - Yangınla Mücadele Önlemleri',
    group: 'GBF',
    width: 34,
    example: 'Kuru kimyevi toz, CO2 veya alkole dayanıklı köpük kullanın. Basınçlı su jeti kullanmayın.',
    guide: 'GBF Bölüm 5: Uygun/uygun olmayan söndürücüler ve özel tehlikeler.',
  },
  {
    key: 'accidentalReleaseMeasures',
    header: 'Bölüm 6 - Kaza Sonucu Yayılmaya Karşı Önlemler',
    group: 'GBF',
    width: 34,
    example: 'Tutuşturucu kaynakları uzaklaştırın. İnert emici (vermikülit/kum) ile toplayıp atık kabına alın.',
    guide: 'GBF Bölüm 6: Kişisel/çevresel önlemler ve temizleme yöntemleri.',
  },
  {
    key: 'handlingAndStorage',
    header: 'Bölüm 7 - Elleçleme ve Depolama',
    group: 'GBF',
    width: 34,
    example: 'Serin, iyi havalandırılan, kıvılcımdan uzak yanıcı madde dolabında (<25°C) saklayın.',
    guide: 'GBF Bölüm 7: Güvenli elleçleme ve depolama koşulları.',
  },
  {
    key: 'exposureControlsPpe',
    header: 'Bölüm 8 - Maruz Kalma Kontrolleri / KKD',
    group: 'GBF',
    width: 34,
    example: 'Nitril eldiven (EN 374), koruyucu gözlük (EN 166) kullanın. (KKD ikonları sistemden seçilir).',
    guide: 'GBF Bölüm 8: Sınır değerler, mühendislik kontrolleri ve KKD açıklamaları.',
  },
  {
    key: 'physicalAndChemicalProperties',
    header: 'Bölüm 9 - Fiziksel ve Kimyasal Özellikler',
    group: 'GBF',
    width: 34,
    example: 'Renksiz berrak sıvı; Alkol kokulu; Parlama noktası: 12°C; pH: 7.0; Yoğunluk: 0.87 g/cm³.',
    guide: 'GBF Bölüm 9: Görünüm, koku, pH, parlama/kaynama noktası, yoğunluk.',
  },
  {
    key: 'stabilityAndReactivity',
    header: 'Bölüm 10 - Kararlılık ve Tepkime',
    group: 'GBF',
    width: 34,
    example: 'Normal koşullarda kararlıdır. Kuvvetli oksitleyiciler, ısı ve açık alevden uzak tutun.',
    guide: 'GBF Bölüm 10: Tepkime, kararlılık, kaçınılması gereken durum ve maddeler.',
  },
  {
    key: 'toxicologicalInformation',
    header: 'Bölüm 11 - Toksikolojik Bilgiler',
    group: 'GBF',
    width: 34,
    example: 'LD50 (oral, sıçan): >5000 mg/kg. Yüksek buhar konsantrasyonu baş dönmesine yol açabilir.',
    guide: 'GBF Bölüm 11: Akut toksisite, tahriş ve sağlık etkileri.',
  },
  {
    key: 'ecologicalInformation',
    header: 'Bölüm 12 - Ekolojik Bilgiler',
    group: 'GBF',
    width: 34,
    example: 'Biyolojik olarak kolayca parçalanır. Kanalizasyona ve yeraltı sularına karıştırmayın.',
    guide: 'GBF Bölüm 12: Ekotoksisite, kalıcılık ve biyobirikim.',
  },
  {
    key: 'disposalConsiderations',
    header: 'Bölüm 13 - Bertaraf Etme Bilgileri',
    group: 'GBF',
    width: 34,
    example: 'Tehlikeli Atık Yönetmeliği kapsamında lisanslı bertaraf tesisine gönderin (Atık Kodu: 15 01 10*).',
    guide: 'GBF Bölüm 13: Ürün ve ambalaj atık bertaraf yöntemleri.',
  },
  {
    key: 'transportInfo',
    header: 'Bölüm 14 - Taşımacılık Bilgileri',
    group: 'GBF',
    width: 34,
    example: 'UN 1219, İZOPROPANOL, Sınıf 3, Paketleme Grubu II. (ADR etiketleri sistemden seçilir).',
    guide: 'GBF Bölüm 14: UN numarası, taşımacılık sınıfı ve paketleme grubu.',
  },
  {
    key: 'regulatoryInfo',
    header: 'Bölüm 15 - Mevzuat Bilgileri',
    group: 'GBF',
    width: 34,
    example: 'KKDİK (30105) ve SEA (28848) Yönetmeliklerine uygun hazırlanmıştır.',
    guide: 'GBF Bölüm 15: İlgili ulusal ve uluslararası yönetmelikler.',
  },
  {
    key: 'otherInfo',
    header: 'Bölüm 16 - Diğer Bilgiler',
    group: 'GBF',
    width: 34,
    example: 'GBF hazırlayıcı sertifika bilgileri ve kısaltmalar.',
    guide: 'GBF Bölüm 16: Revizyon özeti, kısaltmalar ve ek açıklamalar.',
  },
];

const GBF_KEYS = TEMPLATE_COLUMNS.filter((c) => c.group === 'GBF').map((c) => c.key);

interface ParsedRow {
  rowNo: number;
  data: Record<string, any>;
  filledGbfCount: number;
  error?: string;
}

interface HazmatExcelImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const HazmatExcelImportDialog: React.FC<HazmatExcelImportDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [downloading, setDownloading] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [updateExisting, setUpdateExisting] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  } | null>(null);

  const { data: categories = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['hazmat-categories-for-template'],
    queryFn: async () => {
      const res = await api.get('/hazmat/settings/categories');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: open,
  });

  const resetUpload = () => {
    setParsedRows([]);
    setFileName('');
    setImportSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 1. Detaylı Excel (.xlsx) Şablonu Oluştur ve İndir
  const handleDownloadExcelTemplate = async () => {
    setDownloading(true);
    try {
      const wb = new ExcelJS.Workbook();
      wb.creator = 'SEC Portali';
      wb.created = new Date();

      // Sayfa 1: Veri Giriş Tablosu
      const ws = wb.addWorksheet('Kimyasal_Veri_Girisi', {
        views: [{ state: 'frozen', ySplit: 1, xSplit: 1 }],
      });

      ws.columns = TEMPLATE_COLUMNS.map((col) => ({
        header: col.header,
        key: col.key,
        width: col.width,
      }));

      // Başlık stili (META = koyu lacivert, GBF 1-16 = koyu indigo)
      const headerRow = ws.getRow(1);
      headerRow.height = 30;
      TEMPLATE_COLUMNS.forEach((col, idx) => {
        const cell = headerRow.getCell(idx + 1);
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: col.group === 'META' ? 'FF0F172A' : 'FF1E3A8A' },
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          bottom: { style: 'medium', color: { argb: 'FF94A3B8' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        };
      });

      // Örnek satır (Satır 2)
      const exampleObj: Record<string, string> = {};
      TEMPLATE_COLUMNS.forEach((col) => {
        exampleObj[col.key] = col.example;
      });
      const exampleRow = ws.addRow(exampleObj);
      exampleRow.height = 42;
      exampleRow.eachCell((cell) => {
        cell.font = { italic: true, color: { argb: 'FF475569' }, size: 9.5 };
        cell.alignment = { vertical: 'top', wrapText: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' },
        };
      });

      // Sayfa 2: Kullanım Kılavuzu & Geçerli Değerler (Dropdown listesi için referans)
      const guideWs = wb.addWorksheet('Kullanim_Kilavuzu');
      guideWs.columns = [
        { header: 'Sütun Adı', key: 'col', width: 38 },
        { header: 'Grup', key: 'grp', width: 18 },
        { header: 'Zorunlu', key: 'req', width: 12 },
        { header: 'Açıklama ve Format', key: 'desc', width: 65 },
      ];

      const gHeader = guideWs.getRow(1);
      gHeader.height = 24;
      gHeader.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
        cell.alignment = { vertical: 'middle' };
      });

      TEMPLATE_COLUMNS.forEach((col) => {
        guideWs.addRow({
          col: col.header,
          grp: col.group === 'META' ? '1. Ürün & Belge' : '2. GBF Bölümleri',
          req: col.required ? 'EVET' : 'Opsiyonel',
          desc: col.guide,
        });
      });

      guideWs.addRow({});
      const noteRow = guideWs.addRow({
        col: 'ÖNEMLİ NOT',
        grp: 'Görseller',
        req: '-',
        desc: 'Ürün görseli, SDS PDF dosyası, GHS zararlılık piktogramları, KKD ikonları ve ADR etiketleri toplu yükleme sonrasında ilgili maddenin Düzenle ekranından görsel olarak seçilir.',
      });
      noteRow.eachCell((c) => {
        c.font = { bold: true, color: { argb: 'FF92400E' } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
      });

      // Referans Kategori Listesi (Gizli veya Kılavuz sayfasında F sütunu)
      const catNames = categories.map((c) => c.name).filter(Boolean);
      if (catNames.length > 0) {
        guideWs.getCell('F1').value = 'Kategoriler';
        catNames.forEach((name, i) => {
          guideWs.getCell(`F${i + 2}`).value = name;
        });
      }

      // Excel Açılır Liste (Data Validation) — Satır 2..200 arası
      for (let r = 2; r <= 200; r++) {
        if (catNames.length > 0) {
          ws.getCell(`B${r}`).dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`Kullanim_Kilavuzu!$F$2:$F$${catNames.length + 1}`],
          };
        }
        ws.getCell(`I${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: ['"karışım,madde"'],
        };
        ws.getCell(`J${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: ['"KKDİK Ek-2,2014 GBF formatı,Diğer / eski format"'],
        };
      }

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Hazmat_Kimyasal_Sablon_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Detaylı Excel şablonu indirildi (örnek satır ve kılavuz dahil).');
    } catch (err) {
      console.error(err);
      toast.error('Excel şablonu oluşturulamadı.');
    } finally {
      setDownloading(false);
    }
  };

  // 2. CSV Şablonu İndir (UTF-8 BOM, ; ayraçlı)
  const handleDownloadCsvTemplate = () => {
    const escapeCsv = (val: string) => `"${String(val || '').replace(/"/g, '""')}"`;
    const headerLine = TEMPLATE_COLUMNS.map((c) => escapeCsv(c.header)).join(';');
    const exampleLine = TEMPLATE_COLUMNS.map((c) => escapeCsv(c.example)).join(';');
    const csvContent = `\uFEFF${headerLine}\r\n${exampleLine}\r\n`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Hazmat_Kimyasal_Sablon_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV şablonu indirildi.');
  };

  // 3. Yüklenen Excel / CSV Dosyasını Oku ve Önizle
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setImportSummary(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });

      if (rawRows.length === 0) {
        toast.error('Dosyada veri satırı bulunamadı.');
        setParsedRows([]);
        return;
      }

      const normHeader = (h: string) =>
        String(h || '')
          .toLocaleLowerCase('tr-TR')
          .replace(/\*/g, '')
          .replace(/\s+/g, ' ')
          .trim();

      const headerToKey = new Map<string, string>();
      TEMPLATE_COLUMNS.forEach((col) => {
        headerToKey.set(normHeader(col.header), col.key);
        headerToKey.set(normHeader(col.key), col.key);
      });

      const mapped: ParsedRow[] = [];
      rawRows.forEach((raw, idx) => {
        const record: Record<string, any> = {};
        Object.entries(raw).forEach(([colHeader, val]) => {
          const matchedKey = headerToKey.get(normHeader(colHeader));
          if (matchedKey) {
            record[matchedKey] = val;
          }
        });

        // Tamamen boş satırları atla
        const hasAnyValue = Object.values(record).some((v) => String(v ?? '').trim() !== '');
        if (!hasAnyValue) return;

        const productName = String(record.productName ?? '').trim();
        const filledGbfCount = GBF_KEYS.filter((k) => String(record[k] ?? '').trim() !== '').length;

        mapped.push({
          rowNo: idx + 2,
          data: record,
          filledGbfCount,
          error: !productName ? 'Ürün / Madde Adı boş olamaz' : undefined,
        });
      });

      setParsedRows(mapped);
      toast.success(`${mapped.length} satır okundu. Önizlemeyi kontrol edip yükleyebilirsiniz.`);
    } catch (err) {
      console.error(err);
      toast.error('Dosya okunamadı. Lütfen geçerli bir .xlsx veya .csv şablonu seçin.');
      setParsedRows([]);
    }
  };

  // 4. Backend'e Gönder
  const handleImportSubmit = async () => {
    const validRows = parsedRows.filter((r) => !r.error).map((r) => r.data);
    if (validRows.length === 0) {
      toast.error('Yüklenecek geçerli satır bulunamadı.');
      return;
    }

    setImporting(true);
    try {
      const res = await api.post('/hazmat/materials/import', {
        materials: validRows,
        updateExisting,
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Yükleme başarısız oldu.');
      }
      setImportSummary(json.results);
      queryClient.invalidateQueries({ queryKey: ['global-materials-list'] });
      queryClient.invalidateQueries({ queryKey: ['facility-materials'] });
      toast.success(json.message || 'Kimyasal maddeler başarıyla yüklendi.');
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || 'Toplu yükleme sırasında hata oluştu.');
    } finally {
      setImporting(false);
    }
  };

  const validCount = parsedRows.filter((r) => !r.error).length;
  const errorCount = parsedRows.filter((r) => r.error).length;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetUpload();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-3xl max-h-[88vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-primary" />
            Excel / CSV ile Toplu Kimyasal Madde Yükleme
          </DialogTitle>
          <DialogDescription className="text-xs">
            Görseller, SDS PDF ve piktogram/KKD/ADR işaretleri hariç tüm ürün bilgileri ve 16 GBF bölümünü topluca yükleyin; ardından görselleri sistem içinden seçin.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* ADIM 1: ŞABLON İNDİRME */}
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-semibold text-foreground">
                  1. Adım: Hazır Şablonu İndirin (26 Metin &amp; GBF Sütunu)
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Excel şablonu; sistemdeki güncel kategorileri açılır liste olarak, örnek bir satırı ve Kullanım Kılavuzu sekmesini içerir.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  size="sm"
                  disabled={downloading}
                  onClick={handleDownloadExcelTemplate}
                  className="h-8 text-xs gap-1.5"
                >
                  {downloading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  Excel Şablonu (.xlsx)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadCsvTemplate}
                  className="h-8 text-xs gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  CSV Şablonu
                </Button>
              </div>
            </div>

            <div className="rounded-md bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 px-3 py-2 flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-300">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                <strong>Görsel alanlar hariçtir:</strong> Ürün fotoğrafı, GBF PDF dosyası, GHS zararlılık piktogramları, KKD ikonları ve ADR etiketleri yükleme sonrası ilgili maddenin <strong>Düzenle</strong> ekranından seçilir.
              </span>
            </div>
          </div>

          {/* ADIM 2: DOSYA YÜKLEME */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-foreground">
                2. Adım: Doldurduğunuz Excel veya CSV Dosyasını Seçin
              </h4>
              {fileName && (
                <button
                  type="button"
                  onClick={resetUpload}
                  className="text-[11px] text-muted-foreground hover:text-destructive inline-flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Dosyayı Temizle
                </button>
              )}
            </div>

            <label className="flex flex-col items-center justify-center gap-1.5 py-6 px-4 rounded-lg border-2 border-dashed border-input bg-muted/10 hover:bg-muted/30 transition-colors cursor-pointer text-center">
              <Upload className="w-6 h-6 text-primary/70" />
              <span className="text-xs font-semibold text-foreground">
                {fileName ? `Seçili dosya: ${fileName}` : 'Excel (.xlsx, .xls) veya CSV dosyası seçmek için tıklayın'}
              </span>
              <span className="text-[11px] text-muted-foreground">
                Örnek satırı silip kendi kimyasal listenizi ekledikten sonra yükleyebilirsiniz
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>
          </div>

          {/* ADIM 3: ÖNİZLEME TABLOSU */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs tabular-nums">
                    Toplam: {parsedRows.length}
                  </Badge>
                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs tabular-nums">
                    Geçerli: {validCount}
                  </Badge>
                  {errorCount > 0 && (
                    <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30 text-xs tabular-nums">
                      Hatalı: {errorCount}
                    </Badge>
                  )}
                </div>

                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={updateExisting}
                    onChange={(e) => setUpdateExisting(e.target.checked)}
                    className="w-3.5 h-3.5 accent-primary rounded"
                  />
                  Aynı ürün adı varsa mevcut metinleri güncelle
                </label>
              </div>

              <div className="border border-border rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/60 text-muted-foreground sticky top-0 border-b border-border">
                    <tr>
                      <th className="px-3 py-2 w-12">Satır</th>
                      <th className="px-3 py-2">Ürün / Madde Adı</th>
                      <th className="px-3 py-2">Kategori</th>
                      <th className="px-3 py-2">Marka / GBF No</th>
                      <th className="px-3 py-2 text-center">GBF</th>
                      <th className="px-3 py-2 text-right">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {parsedRows.slice(0, 50).map((row) => (
                      <tr key={row.rowNo} className={row.error ? 'bg-red-500/5' : ''}>
                        <td className="px-3 py-2 font-mono text-muted-foreground">{row.rowNo}</td>
                        <td className="px-3 py-2 font-medium text-foreground max-w-[200px] truncate">
                          {row.data.productName || '-'}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground truncate max-w-[130px]">
                          {row.data.categoryName || '-'}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground truncate max-w-[150px]">
                          {[row.data.brandName, row.data.sdsNumber].filter(Boolean).join(' · ') || '-'}
                        </td>
                        <td className="px-3 py-2 text-center tabular-nums">
                          <Badge variant="outline" className="text-[10px]">
                            {row.filledGbfCount}/16
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-right">
                          {row.error ? (
                            <span className="inline-flex items-center gap-1 text-destructive font-medium">
                              <AlertTriangle className="w-3 h-3" /> {row.error}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                              <CheckCircle2 className="w-3 h-3" /> Hazır
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedRows.length > 50 && (
                  <div className="px-3 py-1.5 text-[11px] text-muted-foreground bg-muted/30 text-center border-t border-border">
                    İlk 50 satır önizleniyor (toplam {parsedRows.length} satır yüklenecek).
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SONUÇ ÖZETİ */}
          {importSummary && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Yükleme tamamlandı:</strong> {importSummary.created} yeni eklendi,{' '}
                  {importSummary.updated} güncellendi
                  {importSummary.skipped > 0 ? `, ${importSummary.skipped} atlandı` : ''}. Artık
                  listeden ilgili maddeleri açıp görsel ve tehlike piktogramlarını seçebilirsiniz.
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-5 py-3.5 border-t border-border bg-muted/20 gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              resetUpload();
              onOpenChange(false);
            }}
            className="h-8 text-xs"
          >
            Kapat
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={validCount === 0 || importing}
            onClick={handleImportSubmit}
            className="h-8 text-xs gap-1.5"
          >
            {importing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            Sisteme Yükle ({validCount} Madde)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

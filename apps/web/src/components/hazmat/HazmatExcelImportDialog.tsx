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
import zararlilikData from '@/data/zararlilik_ifadeleri.json';
import {
  GBF_SECTIONS,
  GBF_SUGGEST,
  createEmptyGbfDoc,
  createEmptySub,
  extractLegacyFieldsFromGbf,
  countGbfProgress,
} from './gbf/gbfSchema';

interface HazardStatement {
  kod: string;
  ifade: string;
  kategori: string;
}

const HAZARD_STATEMENTS: HazardStatement[] = (zararlilikData as any).ifadeler || [];
const HAZARD_CODE_MAP = new Map<string, HazardStatement>();
HAZARD_STATEMENTS.forEach((st) => {
  HAZARD_CODE_MAP.set(st.kod.replace(/\s+/g, '').toUpperCase(), st);
});

/**
 * Kullanıcının Excel'e yazdığı H/EUH kodlarını (örn: "H225, H319, H336, EUH210" veya satır satır)
 * HazardStatementSelector'ın doğrudan seçili olarak tanıyacağı "KOD: Resmi İfade" satırlarına dönüştürür.
 */
function expandHazardCodesToSelectorText(raw: string): { text: string; matchedCodes: string[] } {
  const input = String(raw || '').trim();
  if (!input) return { text: '', matchedCodes: [] };

  const tokens = input
    .split(/[\r\n,;]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const lines: string[] = [];
  const matchedCodes: string[] = [];
  const seen = new Set<string>();

  for (const token of tokens) {
    // "H225: Kolay alevlenir..." veya sadece "H225" / "H302 + H312" / "EUH210"
    const codeMatch = token.match(
      /^(H\d{3}[a-zA-Z*]?(?:\s*\+\s*H\d{3}[a-zA-Z*]?)*|EUH\d{3}[a-zA-Z*]?)(?:\s*[:\-\.]\s*(.*))?$/i
    );
    if (codeMatch) {
      const normCode = codeMatch[1].replace(/\s+/g, '').toUpperCase();
      if (seen.has(normCode)) continue;
      seen.add(normCode);
      const dictItem = HAZARD_CODE_MAP.get(normCode);
      if (dictItem) {
        lines.push(`${dictItem.kod}: ${dictItem.ifade}`);
        matchedCodes.push(dictItem.kod);
      } else {
        const tail = (codeMatch[2] || '').trim();
        lines.push(tail ? `${normCode}: ${tail}` : normCode);
        matchedCodes.push(normCode);
      }
    } else {
      lines.push(token);
    }
  }

  return { text: lines.join('\n'), matchedCodes };
}

interface TemplateColumnDef {
  key: string;
  header: string;
  groupTitle: string;
  groupKind: 'META' | 'GBF';
  sectionNum?: number;
  subCode?: string;
  suggestLabel?: string; // GBF_SUGGEST satır etiketi (rows[] içine gider)
  isHazardCodeSelector?: boolean; // 2.2 H / EUH kodları -> sub['2.2'].text (HazardStatementSelector)
  width: number;
  required?: boolean;
  example: string;
  guide: string;
}

// 1. Aşama: Ürün & Belge Bilgileri (10 Sütun)
const META_COLUMNS: TemplateColumnDef[] = [
  {
    key: 'productName',
    header: 'Ürün / Madde Adı *',
    groupTitle: '1. ÜRÜN & BELGE BİLGİLERİ',
    groupKind: 'META',
    width: 30,
    required: true,
    example: '%70 İzopropil Alkol Yüzey Dezenfektanı',
    guide: 'Zorunlu. Kimyasalın GBF üzerinde yazan tam ticari adı.',
  },
  {
    key: 'categoryName',
    header: 'Kategori',
    groupTitle: '1. ÜRÜN & BELGE BİLGİLERİ',
    groupKind: 'META',
    width: 22,
    example: 'Dezenfektanlar',
    guide: 'Sistemde tanımlı Hazmat kategori adı (Excel açılır listesinden seçilebilir).',
  },
  {
    key: 'brandName',
    header: 'Tedarikçi / Marka',
    groupTitle: '1. ÜRÜN & BELGE BİLGİLERİ',
    groupKind: 'META',
    width: 22,
    example: 'Örnek Medikal Kimya A.Ş.',
    guide: 'Üretici veya tedarikçi firma / marka adı.',
  },
  {
    key: 'sdsNumber',
    header: 'GBF Numarası',
    groupTitle: '1. ÜRÜN & BELGE BİLGİLERİ',
    groupKind: 'META',
    width: 16,
    example: 'SDS-7404',
    guide: 'Güvenlik Bilgi Formu numarası (örn. 7404 veya SDS-7404).',
  },
  {
    key: 'sdsRevision',
    header: 'Revizyon No',
    groupTitle: '1. ÜRÜN & BELGE BİLGİLERİ',
    groupKind: 'META',
    width: 13,
    example: 'Rev-02',
    guide: 'Belge revizyon numarası (örn. 02 veya Rev-02).',
  },
  {
    key: 'sdsDate',
    header: 'Hazırlanma Tarihi',
    groupTitle: '1. ÜRÜN & BELGE BİLGİLERİ',
    groupKind: 'META',
    width: 16,
    example: '2025-03-15',
    guide: 'YYYY-AA-GG veya GG.AA.YYYY biçiminde.',
  },
  {
    key: 'sdsRevisionDate',
    header: 'Revizyon Tarihi',
    groupTitle: '1. ÜRÜN & BELGE BİLGİLERİ',
    groupKind: 'META',
    width: 16,
    example: '2026-01-10',
    guide: 'YYYY-AA-GG veya GG.AA.YYYY biçiminde.',
  },
  {
    key: 'sdsExpiryDate',
    header: 'Geçerlilik Son Tarihi',
    groupTitle: '1. ÜRÜN & BELGE BİLGİLERİ',
    groupKind: 'META',
    width: 18,
    example: '2029-01-10',
    guide: 'YYYY-AA-GG veya GG.AA.YYYY biçiminde.',
  },
  {
    key: 'productKind',
    header: 'Ürün Türü',
    groupTitle: '1. ÜRÜN & BELGE BİLGİLERİ',
    groupKind: 'META',
    width: 13,
    example: 'karışım',
    guide: 'Geçerli değerler: karışım veya madde (Bölüm 3.2 / 3.1 seçimini belirler).',
  },
  {
    key: 'sdsRegime',
    header: 'Mevzuat / Belge Dönemi',
    groupTitle: '1. ÜRÜN & BELGE BİLGİLERİ',
    groupKind: 'META',
    width: 20,
    example: 'KKDİK Ek-2',
    guide: 'Geçerli değerler: KKDİK Ek-2 | 2014 GBF formatı | Diğer / eski format.',
  },
];

// Örnek satır değerleri (gerçekçi örnek veri)
const EXAMPLE_VALUES: Record<string, string> = {
  'sub:1.1:Ürün adı': '%70 İzopropil Alkol Yüzey Dezenfektanı',
  'sub:1.1:Ürün kodu': 'IPA-70-1000',
  'sub:1.1:CAS / EC / kayıt no': 'CAS: 67-63-0 / EC: 200-661-7',
  'sub:1.2:Belirlenmiş kullanım': 'Tıbbi cihaz ve yüzey dezenfeksiyonu (profesyonel kullanım)',
  'sub:1.3:Tedarikçi / üretici': 'Örnek Medikal Kimya A.Ş.',
  'sub:1.4:UZEM / ulusal acil iletişim': '114 (UZEM)',
  'sub:2.1:Fiziksel zararlar': 'Alev. Sıvı 2 (H225)',
  'sub:2.1:Sağlık zararları': 'Göz Tah. 2 (H319); BHOT Tek Mrz. 3 (H336)',
  'sub:2.2:__HAZARD_CODES__': 'H225, H319, H336',
  'sub:2.2:Uyarı kelimesi': 'TEHLİKE',
  'sub:2.2:P ifadeleri': 'P210: Isıdan/kıvılcımdan uzak tutun. P305+P351+P338: Göz ile temasta suyla yıkayın.',
  'sub:3.2': 'Propan-2-ol (CAS: 67-63-0, %65-75, H225, H319, H336); Deiyonize Su (%25-35)',
  'sub:4.1:Soluma': 'Temiz havaya çıkarın, nefes darlığı varsa tıbbi yardım alın.',
  'sub:4.1:Göz teması': 'En az 15 dakika bol su ile yıkayın, kontakt lens varsa çıkarın.',
  'sub:4.1:Cilt teması': 'Bol su ve sabunla yıkayın.',
  'sub:4.1:Yutma': 'Kusturmayın, ağzı su ile çalkalayın, doktora başvurun.',
  'sub:5.1:Uygun yangın söndürücüler': 'Kuru kimyevi toz, CO2, alkole dayanıklı köpük',
  'sub:5.1:Uygun yangın söndürme maddeleri': 'Kuru kimyevi toz, CO2, alkole dayanıklı köpük',
  'sub:5.1:Uygun olmayan söndürme maddeleri': 'Basınçlı su jeti',
  'sub:6.1:Kişisel önlemler': 'Tutuşturucu kaynakları uzaklaştırın, ortamı havalandırın.',
  'sub:6.3:Temizleme malzemesi': 'İnert emici (vermikülit, kum) ile toplayıp tehlikeli atık kabına alın.',
  'sub:7.2:Depolama koşulları': 'Serin (<25°C), iyi havalandırılan, kıvılcımdan uzak yanıcı madde dolabında.',
  'sub:8.2:Göz / yüz koruması': 'EN 166 uyumlu koruyucu gözlük',
  'sub:8.2:El koruması': 'EN 374 uyumlu nitril eldiven',
  'sub:9.1:Görünüm / fiziksel hâl': 'Berrak sıvı',
  'sub:9.1:Renk': 'Renksiz',
  'sub:9.1:Koku': 'Karakteristik alkol kokusu',
  'sub:9.1:pH': '7.0',
  'sub:9.1:Parlama noktası': '12 °C',
  'sub:9.1:Yoğunluk': '0.87 g/cm³ (20°C)',
  'sub:10.2': 'Normal depolama ve kullanım koşullarında kararlıdır.',
  'sub:10.5': 'Kuvvetli oksitleyiciler, asitler',
  'sub:13.1:Atık kodu': '15 01 10* / 07 01 04*',
  'sub:14.1': 'UN 1219',
  'sub:14.2': 'İZOPROPANOL (İZOPROPİL ALKOL)',
  'sub:14.3': 'Sınıf 3',
  'sub:14.4': 'PG II',
  'sub:15.1': 'KKDİK (30105) ve SEA (28848) Yönetmeliklerine uygundur.',
  'sub:16:KDU adı': 'Örnek KDU Uzmanı',
};

// 2. Aşama: 16 Resmî GBF Bölümünün Alt Başlıkları + Önerilen Veri Başlıkları (Tam Yapısal)
function buildStructuredGbfColumns(): TemplateColumnDef[] {
  const cols: TemplateColumnDef[] = [];

  for (const sec of GBF_SECTIONS) {
    const groupTitle = `BÖLÜM ${sec.num}: ${sec.title.toUpperCase()}`;
    const subs = sec.subs.length > 0 ? sec.subs : [{ code: String(sec.num), title: sec.title }];

    for (const sub of subs) {
      const suggests = GBF_SUGGEST[sub.code] || [];

      // Bölüm 2.2: Etiket unsurları -> Özel H / EUH Kodları Seçicisi en başta!
      if (sub.code === '2.2') {
        cols.push({
          key: 'sub:2.2:__HAZARD_CODES__',
          header: '[2.2] H / EUH Kodları (Seçili Gelir)',
          groupTitle,
          groupKind: 'GBF',
          sectionNum: 2,
          subCode: '2.2',
          isHazardCodeSelector: true,
          width: 30,
          example: EXAMPLE_VALUES['sub:2.2:__HAZARD_CODES__'] || '',
          guide:
            'Virgülle ayırarak H / EUH kodlarını yazın (örn: H225, H319, H336, EUH210). Sistemde 2.2 Etiket Unsurları altında otomatik SEÇİLİ gelir (kod listesi 3. sekmede).',
        });

        for (const label of suggests) {
          // Görsel piktogramlar sistem içinden seçildiği için Excel'de hariç tutuyoruz
          if (label === 'Piktogramlar') continue;
          const colKey = `sub:2.2:${label}`;
          cols.push({
            key: colKey,
            header: `[2.2] ${label}`,
            groupTitle,
            groupKind: 'GBF',
            sectionNum: 2,
            subCode: '2.2',
            suggestLabel: label,
            width: label === 'Uyarı kelimesi' ? 18 : 28,
            example: EXAMPLE_VALUES[colKey] || '',
            guide:
              label === 'Uyarı kelimesi'
                ? 'Geçerli değerler: TEHLİKE veya DİKKAT (açılır listeden seçilebilir).'
                : `Bölüm 2.2 Etiket unsurları — ${label}.`,
          });
        }
        continue;
      }

      if (suggests.length > 0) {
        // Önerilen veri başlıkları olan alt başlıklar: her önerilen başlık kendi sütununa ayrılır
        for (const label of suggests) {
          const colKey = `sub:${sub.code}:${label}`;
          cols.push({
            key: colKey,
            header: `[${sub.code}] ${label}`,
            groupTitle,
            groupKind: 'GBF',
            sectionNum: sec.num,
            subCode: sub.code,
            suggestLabel: label,
            width: 24,
            example: EXAMPLE_VALUES[colKey] || '',
            guide: `Bölüm ${sec.num} / ${sub.code} ${sub.title} → ${label}`,
          });
        }
      } else {
        // Önerilen başlığı olmayan alt başlıklar (3.1, 3.2, 9.2, 10.1-10.6, 12.2-12.6, 14.1-14.7, 15.1-15.2)
        const colKey = `sub:${sub.code}`;
        cols.push({
          key: colKey,
          header: `[${sub.code}] ${sub.title}`,
          groupTitle,
          groupKind: 'GBF',
          sectionNum: sec.num,
          subCode: sub.code,
          width: 28,
          example: EXAMPLE_VALUES[colKey] || '',
          guide: `Bölüm ${sec.num} / ${sub.code} ${sub.title} serbest açıklama metni.`,
        });
      }
    }
  }

  return cols;
}

const GBF_STRUCTURED_COLUMNS = buildStructuredGbfColumns();
const ALL_TEMPLATE_COLUMNS: TemplateColumnDef[] = [...META_COLUMNS, ...GBF_STRUCTURED_COLUMNS];

// Eski 26 sütunlu "Hızlı Giriş" şablonuyla geriye dönük uyumluluk anahtarları
const LEGACY_QUICK_KEYS: Array<{ header: string; key: string; secNum: number }> = [
  { header: 'Bölüm 1 - Madde/Karışım ve Tedarikçi Kimliği', key: 'usageMethod', secNum: 1 },
  { header: 'Bölüm 2 - Zararlılık Tanımlanması', key: 'hazardDescription', secNum: 2 },
  { header: 'Bölüm 3 - Bileşimi / İçindekiler', key: 'composition', secNum: 3 },
  { header: 'Bölüm 4 - İlk Yardım Önlemleri', key: 'firstAid', secNum: 4 },
  { header: 'Bölüm 5 - Yangınla Mücadele Önlemleri', key: 'fireFightingMeasures', secNum: 5 },
  { header: 'Bölüm 6 - Kaza Sonucu Yayılmaya Karşı Önlemler', key: 'accidentalReleaseMeasures', secNum: 6 },
  { header: 'Bölüm 7 - Elleçleme ve Depolama', key: 'handlingAndStorage', secNum: 7 },
  { header: 'Bölüm 8 - Maruz Kalma Kontrolleri / KKD', key: 'exposureControlsPpe', secNum: 8 },
  { header: 'Bölüm 9 - Fiziksel ve Kimyasal Özellikler', key: 'physicalAndChemicalProperties', secNum: 9 },
  { header: 'Bölüm 10 - Kararlılık ve Tepkime', key: 'stabilityAndReactivity', secNum: 10 },
  { header: 'Bölüm 11 - Toksikolojik Bilgiler', key: 'toxicologicalInformation', secNum: 11 },
  { header: 'Bölüm 12 - Ekolojik Bilgiler', key: 'ecologicalInformation', secNum: 12 },
  { header: 'Bölüm 13 - Bertaraf Etme Bilgileri', key: 'disposalConsiderations', secNum: 13 },
  { header: 'Bölüm 14 - Taşımacılık Bilgileri', key: 'transportInfo', secNum: 14 },
  { header: 'Bölüm 15 - Mevzuat Bilgileri', key: 'regulatoryInfo', secNum: 15 },
  { header: 'Bölüm 16 - Diğer Bilgiler', key: 'otherInfo', secNum: 16 },
];

function colIndexToLetter(idx1Based: number): string {
  let n = idx1Based;
  let s = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

interface ParsedRow {
  rowNo: number;
  payload: Record<string, any>;
  filledSections: number;
  structuredSections: number;
  hazardCodes: string[];
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

  // 1. Tam Yapısal Excel (.xlsx) Şablonu Oluştur ve İndir
  //    Sayfa 1: Kimyasal_Veri_Girisi (Grup Başlığı + Alt Başlık/Önerilen Veri Sütunları + Örnek Satır + Dropdownlar)
  //    Sayfa 2: Kullanim_Kilavuzu (Tüm sütun açıklamaları + Kategori Referans Listesi)
  //    Sayfa 3: H_EUH_Kodlari (Tüm resmi H ve EUH kodları ve Türkçe açıklamaları)
  const handleDownloadExcelTemplate = async () => {
    setDownloading(true);
    try {
      const wb = new ExcelJS.Workbook();
      wb.creator = 'SEC Portali';
      wb.created = new Date();

      const ws = wb.addWorksheet('Kimyasal_Veri_Girisi', {
        views: [{ state: 'frozen', ySplit: 2, xSplit: 1 }],
      });

      ws.columns = ALL_TEMPLATE_COLUMNS.map((col) => ({
        key: col.key,
        width: col.width,
      }));

      // SATIR 1: Birleştirilmiş Bölüm Grup Başlıkları
      const groupRow = ws.getRow(1);
      groupRow.height = 24;

      // SATIR 2: Gerçek Sütun Başlıkları
      const headerRow = ws.getRow(2);
      headerRow.height = 34;

      const GROUP_PALETTE = [
        'FF0F172A', // META - koyu lacivert
        'FF1E3A8A', // Bölüm 1,3,5... - indigo
        'FF1E40AF', // Bölüm 2,4,6... - mavi
      ];

      let spanStart = 1;
      for (let i = 0; i < ALL_TEMPLATE_COLUMNS.length; i++) {
        const col = ALL_TEMPLATE_COLUMNS[i];
        const colIdx = i + 1;
        const isLast = i === ALL_TEMPLATE_COLUMNS.length - 1;
        const nextCol = !isLast ? ALL_TEMPLATE_COLUMNS[i + 1] : null;

        const colorArgb =
          col.groupKind === 'META'
            ? GROUP_PALETTE[0]
            : (col.sectionNum || 0) % 2 === 1
              ? GROUP_PALETTE[1]
              : GROUP_PALETTE[2];

        const hCell = headerRow.getCell(colIdx);
        hCell.value = col.header;
        hCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9.5 };
        hCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        hCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: col.isHazardCodeSelector ? 'FF9F1239' : colorArgb },
        };
        hCell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          bottom: { style: 'medium', color: { argb: 'FF94A3B8' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        };

        if (isLast || nextCol?.groupTitle !== col.groupTitle) {
          const gCell = groupRow.getCell(spanStart);
          gCell.value = col.groupTitle;
          if (colIdx > spanStart) {
            ws.mergeCells(1, spanStart, 1, colIdx);
          }
          gCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
          gCell.alignment = { vertical: 'middle', horizontal: 'center' };
          gCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: colorArgb },
          };
          gCell.border = {
            top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            left: { style: 'medium', color: { argb: 'FFFFFFFF' } },
            right: { style: 'medium', color: { argb: 'FFFFFFFF' } },
          };
          spanStart = colIdx + 1;
        }
      }

      // SATIR 3: Örnek Satır
      const exampleObj: Record<string, string> = {};
      ALL_TEMPLATE_COLUMNS.forEach((col) => {
        exampleObj[col.key] = col.example;
      });
      const exampleRow = ws.addRow(exampleObj);
      exampleRow.height = 40;
      exampleRow.eachCell((cell) => {
        cell.font = { italic: true, color: { argb: 'FF475569' }, size: 9 };
        cell.alignment = { vertical: 'top', wrapText: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' },
        };
      });

      // SAYFA 2: Kullanım Kılavuzu & Kategoriler
      const guideWs = wb.addWorksheet('Kullanim_Kilavuzu');
      guideWs.columns = [
        { header: 'Bölüm / Grup', key: 'grp', width: 32 },
        { header: 'Sütun Başlığı', key: 'col', width: 36 },
        { header: 'Zorunlu', key: 'req', width: 10 },
        { header: 'Açıklama ve Format', key: 'desc', width: 65 },
      ];
      const gHeader = guideWs.getRow(1);
      gHeader.height = 24;
      gHeader.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
        cell.alignment = { vertical: 'middle' };
      });

      ALL_TEMPLATE_COLUMNS.forEach((col) => {
        guideWs.addRow({
          grp: col.groupTitle,
          col: col.header,
          req: col.required ? 'EVET' : 'Opsiyonel',
          desc: col.guide,
        });
      });

      guideWs.addRow({});
      const noteRow = guideWs.addRow({
        grp: 'ÖNEMLİ NOT',
        col: 'Görseller & H/EUH Kodları',
        req: '-',
        desc: '1) [2.2] H / EUH Kodları sütununa virgülle ayırarak kod yazın (örn: H225, H319, EUH210); sistemde otomatik SEÇİLİ gelir. 2) Ürün görseli, SDS PDF, GHS piktogramları, KKD ikonları ve ADR etiketleri yükleme sonrası Düzenle ekranından seçilir.',
      });
      noteRow.eachCell((c) => {
        c.font = { bold: true, color: { argb: 'FF92400E' } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
      });

      // Referans Kategori Listesi (Kullanim_Kilavuzu!F sütunu)
      const catNames = categories.map((c) => c.name).filter(Boolean);
      if (catNames.length > 0) {
        guideWs.getCell('F1').value = 'Kategoriler';
        catNames.forEach((name, i) => {
          guideWs.getCell(`F${i + 2}`).value = name;
        });
      }

      // SAYFA 3: Resmi H ve EUH Kodları Referans Listesi
      const hWs = wb.addWorksheet('H_EUH_Kodlari', {
        views: [{ state: 'frozen', ySplit: 1 }],
      });
      hWs.columns = [
        { header: 'Kod', key: 'kod', width: 18 },
        { header: 'Kategori', key: 'kategori', width: 28 },
        { header: 'Resmi Zararlılık İfadesi', key: 'ifade', width: 78 },
      ];
      const hHead = hWs.getRow(1);
      hHead.height = 24;
      hHead.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9F1239' } };
        cell.alignment = { vertical: 'middle' };
      });
      HAZARD_STATEMENTS.forEach((st) => {
        hWs.addRow({ kod: st.kod, kategori: st.kategori, ifade: st.ifade });
      });

      // Excel Açılır Listeleri (Data Validation) — Satır 3..200 arası
      const catColLetter = colIndexToLetter(
        ALL_TEMPLATE_COLUMNS.findIndex((c) => c.key === 'categoryName') + 1
      );
      const kindColLetter = colIndexToLetter(
        ALL_TEMPLATE_COLUMNS.findIndex((c) => c.key === 'productKind') + 1
      );
      const regimeColLetter = colIndexToLetter(
        ALL_TEMPLATE_COLUMNS.findIndex((c) => c.key === 'sdsRegime') + 1
      );
      const signalColIdx = ALL_TEMPLATE_COLUMNS.findIndex((c) => c.key === 'sub:2.2:Uyarı kelimesi');
      const signalColLetter = signalColIdx >= 0 ? colIndexToLetter(signalColIdx + 1) : '';

      for (let r = 3; r <= 200; r++) {
        if (catNames.length > 0) {
          ws.getCell(`${catColLetter}${r}`).dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`Kullanim_Kilavuzu!$F$2:$F$${catNames.length + 1}`],
          };
        }
        ws.getCell(`${kindColLetter}${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: ['"karışım,madde"'],
        };
        ws.getCell(`${regimeColLetter}${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: ['"KKDİK Ek-2,2014 GBF formatı,Diğer / eski format"'],
        };
        if (signalColLetter) {
          ws.getCell(`${signalColLetter}${r}`).dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: ['"TEHLİKE,DİKKAT"'],
          };
        }
      }

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Hazmat_Yapisal_GBF_Sablon_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(
        `Tam yapısal Excel şablonu indirildi (${ALL_TEMPLATE_COLUMNS.length} sütun + H/EUH kod listesi).`
      );
    } catch (err) {
      console.error(err);
      toast.error('Excel şablonu oluşturulamadı.');
    } finally {
      setDownloading(false);
    }
  };

  // 2. Tam Yapısal CSV Şablonu İndir (UTF-8 BOM, ; ayraçlı)
  const handleDownloadCsvTemplate = () => {
    const escapeCsv = (val: string) => `"${String(val || '').replace(/"/g, '""')}"`;
    const headerLine = ALL_TEMPLATE_COLUMNS.map((c) => escapeCsv(c.header)).join(';');
    const exampleLine = ALL_TEMPLATE_COLUMNS.map((c) => escapeCsv(c.example)).join(';');
    const csvContent = `\uFEFF${headerLine}\r\n${exampleLine}\r\n`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Hazmat_Yapisal_GBF_Sablon_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Tam yapısal CSV şablonu indirildi.');
  };

  // 3. Yüklenen Excel / CSV Dosyasını Oku, Yapısal GBF (sdsStructuredData) + H/EUH Kodlarını Oluştur
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

      // 2 satırlı Excel başlığını (Satır 1 = Grup Başlığı, Satır 2 = Sütun Başlığı) veya
      // 1 satırlı CSV/eski Excel başlığını otomatik algıla
      const matrix = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' });
      if (matrix.length < 2) {
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

      const headerToDef = new Map<string, TemplateColumnDef>();
      ALL_TEMPLATE_COLUMNS.forEach((col) => {
        headerToDef.set(normHeader(col.header), col);
        headerToDef.set(normHeader(col.key), col);
      });

      const legacyHeaderMap = new Map<string, { key: string; secNum: number }>();
      LEGACY_QUICK_KEYS.forEach((item) => {
        legacyHeaderMap.set(normHeader(item.header), item);
        legacyHeaderMap.set(normHeader(item.key), item);
      });

      const scoreRowAsHeader = (row: any[]) =>
        row.reduce((acc, cell) => {
          const nh = normHeader(cell);
          if (headerToDef.has(nh) || legacyHeaderMap.has(nh)) return acc + 1;
          return acc;
        }, 0);

      const headerRowIdx =
        matrix.length >= 2 && scoreRowAsHeader(matrix[1]) > scoreRowAsHeader(matrix[0]) ? 1 : 0;
      const headers = (matrix[headerRowIdx] || []).map((h) => String(h ?? ''));
      const dataRows = matrix.slice(headerRowIdx + 1);

      const mapped: ParsedRow[] = [];

      dataRows.forEach((cells, idx) => {
        const metaRecord: Record<string, any> = {};
        const gbfDoc = createEmptyGbfDoc();
        let hasStructuredInput = false;
        let hazardCodes: string[] = [];
        let hasAnyCell = false;

        headers.forEach((rawHeader, colIdx) => {
          const val = cells[colIdx];
          const strVal = String(val ?? '').trim();
          if (!strVal) return;

          const nh = normHeader(rawHeader);
          const colDef = headerToDef.get(nh);
          if (colDef) {
            hasAnyCell = true;
            if (colDef.groupKind === 'META') {
              metaRecord[colDef.key] = val;
            } else if (colDef.sectionNum && colDef.subCode) {
              hasStructuredInput = true;
              const sec = gbfDoc.sections[colDef.sectionNum];
              if (!sec.sub[colDef.subCode]) {
                sec.sub[colDef.subCode] = createEmptySub();
              }
              const subObj = sec.sub[colDef.subCode];

              if (colDef.isHazardCodeSelector) {
                const expanded = expandHazardCodesToSelectorText(strVal);
                subObj.text = expanded.text;
                hazardCodes = expanded.matchedCodes;
              } else if (colDef.suggestLabel) {
                subObj.rows.push({ label: colDef.suggestLabel, value: strVal });
              } else {
                subObj.text = subObj.text ? `${subObj.text}\n${strVal}` : strVal;
              }
            }
            return;
          }

          // Eski 26 sütunlu Hızlı Giriş şablonu desteği
          const legacyDef = legacyHeaderMap.get(nh);
          if (legacyDef) {
            hasAnyCell = true;
            gbfDoc.sections[legacyDef.secNum].raw = strVal;
          }
        });

        if (!hasAnyCell) return;

        // Ürün türü ve mevzuat dönemini GBF belgesine yansıt
        const rawKind = String(metaRecord.productKind || '')
          .toLocaleLowerCase('tr-TR')
          .trim();
        gbfDoc.kind = rawKind === 'madde' ? 'madde' : 'karışım';
        if (String(metaRecord.sdsRegime || '').trim()) {
          gbfDoc.regime = String(metaRecord.sdsRegime).trim();
        }

        const legacyFields = extractLegacyFieldsFromGbf(gbfDoc);
        const progress = countGbfProgress(gbfDoc);
        const productName = String(metaRecord.productName ?? '').trim();

        const payload: Record<string, any> = {
          ...metaRecord,
          usageMethod: legacyFields.usageMethod,
          hazardDescription: legacyFields.hazardDescription,
          composition: legacyFields.composition,
          firstAid: legacyFields.firstAid,
          fireFightingMeasures: legacyFields.fireFightingMeasures,
          accidentalReleaseMeasures: legacyFields.accidentalReleaseMeasures,
          handlingAndStorage: legacyFields.handlingAndStorage,
          exposureControlsPpe: legacyFields.exposureControls,
          physicalAndChemicalProperties: legacyFields.physicalProperties,
          stabilityAndReactivity: legacyFields.stabilityAndReactivity,
          toxicologicalInformation: legacyFields.toxicologicalInfo,
          ecologicalInformation: legacyFields.ecologicalInfo,
          disposalConsiderations: legacyFields.disposalConsiderations,
          transportInfo: legacyFields.transportInfo,
          regulatoryInfo: legacyFields.regulatoryInfo,
          otherInfo: legacyFields.otherInfo,
          ...(hasStructuredInput || progress.any > 0 ? { sdsStructuredData: gbfDoc } : {}),
        };

        mapped.push({
          rowNo: headerRowIdx + idx + 2,
          payload,
          filledSections: progress.any,
          structuredSections: progress.structured,
          hazardCodes,
          error: !productName ? 'Ürün / Madde Adı boş olamaz' : undefined,
        });
      });

      setParsedRows(mapped);
      toast.success(`${mapped.length} satır yapısal GBF verisi olarak okundu.`);
    } catch (err) {
      console.error(err);
      toast.error('Dosya okunamadı. Lütfen geçerli bir .xlsx veya .csv şablonu seçin.');
      setParsedRows([]);
    }
  };

  // 4. Backend'e Gönder
  const handleImportSubmit = async () => {
    const validRows = parsedRows.filter((r) => !r.error).map((r) => r.payload);
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
      toast.success(json.message || 'Kimyasal maddeler yapısal GBF verileriyle yüklendi.');
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
            Excel / CSV ile Toplu Yapısal GBF Yükleme
          </DialogTitle>
          <DialogDescription className="text-xs">
            Tüm 16 GBF bölümü, alt başlıkları (1.1–16), önerilen veri başlıkları ve Bölüm 2.2 H / EUH kodları dahil tam yapısal şablonla topluca yükleyin.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* ADIM 1: ŞABLON İNDİRME */}
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-semibold text-foreground">
                  1. Adım: Tam Yapısal GBF Şablonunu İndirin ({ALL_TEMPLATE_COLUMNS.length} Sütun)
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Alt başlıklara ayrılmış tüm önerilen veri başlıkları, <strong>[2.2] H / EUH Kodları</strong> (otomatik seçili gelir) ve <strong>H_EUH_Kodlari</strong> referans sekmesini içerir.
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
                <strong>Görsel alanlar hariçtir:</strong> Ürün fotoğrafı, GBF PDF, GHS piktogramları, KKD ikonları ve ADR etiketleri yükleme sonrası <strong>Düzenle</strong> ekranından seçilir. <strong>H / EUH kodları</strong> ise <code>H225, H319, EUH210</code> şeklinde yazıldığında 2.2 altında otomatik seçili gelir.
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
                Örnek satırı (3. satır) silip kendi kimyasal listenizi ekledikten sonra yükleyebilirsiniz
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
                  Aynı ürün adı varsa mevcut GBF verilerini güncelle
                </label>
              </div>

              <div className="border border-border rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/60 text-muted-foreground sticky top-0 border-b border-border">
                    <tr>
                      <th className="px-3 py-2 w-12">Satır</th>
                      <th className="px-3 py-2">Ürün / Madde Adı</th>
                      <th className="px-3 py-2">H / EUH Kodları</th>
                      <th className="px-3 py-2 text-center">Yapısal GBF</th>
                      <th className="px-3 py-2 text-right">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {parsedRows.slice(0, 50).map((row) => (
                      <tr key={row.rowNo} className={row.error ? 'bg-red-500/5' : ''}>
                        <td className="px-3 py-2 font-mono text-muted-foreground">{row.rowNo}</td>
                        <td className="px-3 py-2 font-medium text-foreground max-w-[200px] truncate">
                          {row.payload.productName || '-'}
                        </td>
                        <td className="px-3 py-2">
                          {row.hazardCodes.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {row.hazardCodes.slice(0, 4).map((c) => (
                                <span
                                  key={c}
                                  className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                                >
                                  {c}
                                </span>
                              ))}
                              {row.hazardCodes.length > 4 && (
                                <span className="text-[10px] text-muted-foreground">
                                  +{row.hazardCodes.length - 4}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center tabular-nums">
                          <Badge variant="outline" className="text-[10px]">
                            {row.structuredSections > 0
                              ? `${row.structuredSections}/16 Alt Başlık`
                              : `${row.filledSections}/16`}
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
                  maddeleri açtığınızda alt başlıklar, önerilen veri alanları ve H/EUH kodları seçili olarak hazır görünecektir.
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

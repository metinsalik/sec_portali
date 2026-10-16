import { z } from 'zod';

// ============================================================================
// 1. ENUMLAR VE TEMEL TİPLER
// ============================================================================

export enum ImprovementSheetType {
  DENETIMLER = 'DENETIMLER',
  ELEKTRIK_PK = 'ELEKTRIK_PK',
  TOPRAKLAMA_PK = 'TOPRAKLAMA_PK',
  PARATONER_PK = 'PARATONER_PK',
  JENERATOR_PK = 'JENERATOR_PK',
  ELEKTRIK_PANO_KONTROLLERI = 'ELEKTRIK_PANO_KONTROLLERI', // Excel: 'Enerji Analiz Raporu'
  ELEKTRIK_PANO_BAKIMLARI = 'ELEKTRIK_PANO_BAKIMLARI',     // Excel: 'Elektrik Pano Kontrolleri' (Bakım)
  TRAFO = 'TRAFO',
  UPS = 'UPS',
}

export enum ImprovementOperationType {
  INSPECTION = 'INSPECTION', // Periyodik Kontrol / Denetim
  MAINTENANCE = 'MAINTENANCE', // Bakım
}

export enum ImprovementReportResult {
  CLEAR = 'CLEAR',             // Uygunsuzluk Yok / Temiz
  FINDINGS = 'FINDINGS',       // Tespit / Bulgu Var
  UNCONFIRMED = 'UNCONFIRMED', // Onaylanmamış / Taslak
  PLANNED = 'PLANNED',         // Planlandı
}

// ============================================================================
// 2. SABİTLER VE İŞ KURALLARI
// ============================================================================

export const VALID_STATUSES = [
  'Tamamlandı',
  'Devam Ediyor',
  'Başlamadı',
  'İptal Edildi',
  'Açık',
] as const;

export type ValidStatus = typeof VALID_STATUSES[number];

export const VALID_RISKS = [
  'Kritik',
  'Yüksek',
  'Önemli',
  'Olası',
  'Önemsiz',
  'Çok Yüksek',
] as const;

export type ValidRisk = typeof VALID_RISKS[number];

export const CRITICAL_RISKS = ['Kritik', 'Yüksek', 'Çok Yüksek'] as const;

// Fotoğraf Yükleme ve Sıkıştırma Kuralları
export const MAX_PHOTOS_PER_RECORD = 5;
export const MAX_PHOTO_DIMENSION = 1600; // px (maksimum genişlik veya yükseklik)
export const PHOTO_COMPRESSION_QUALITY = 0.8; // WebP / JPEG sıkıştırma kalitesi
export const ALLOWED_PHOTO_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

// ============================================================================
// 3. FOTOĞRAF MODELİ
// ============================================================================

export interface ImprovementPhoto {
  id: string;
  url: string;
  name: string;
  size: number;
  originalSize?: number;
  uploadedAt: string;
  uploadedBy?: string;
  caption?: string;
}

export const ImprovementPhotoSchema = z.object({
  id: z.string(),
  url: z.string(),
  name: z.string(),
  size: z.number(),
  originalSize: z.number().optional(),
  uploadedAt: z.string(),
  uploadedBy: z.string().optional(),
  caption: z.string().optional(),
});

// ============================================================================
// 4. 9 TAKİP ALANI METAVERİ VE EXCEL EŞLEŞME HARİTASI
// ============================================================================

export interface SheetDefinition {
  key: ImprovementSheetType;
  label: string;
  moduleGroup: 'DENETIM' | 'ELEKTRIK_BAKIM_KONTROL';
  path: string;
  operationMode: 'INSPECTION' | 'MAINTENANCE' | 'DUAL';
  excelAliases: string[];
  columnSchemaType: 'TYPE_A' | 'TYPE_B' | 'TYPE_C';
}

export const IMPROVEMENT_SHEET_DEFINITIONS: Record<ImprovementSheetType, SheetDefinition> = {
  [ImprovementSheetType.DENETIMLER]: {
    key: ImprovementSheetType.DENETIMLER,
    label: 'Denetimler',
    moduleGroup: 'DENETIM',
    path: 'denetimler',
    operationMode: 'INSPECTION',
    excelAliases: ['Denetimler'],
    columnSchemaType: 'TYPE_A',
  },
  [ImprovementSheetType.ELEKTRIK_PK]: {
    key: ImprovementSheetType.ELEKTRIK_PK,
    label: 'Elektrik PK',
    moduleGroup: 'ELEKTRIK_BAKIM_KONTROL',
    path: 'electrical/elektrik-pk',
    operationMode: 'INSPECTION',
    excelAliases: ['Elektrik PK'],
    columnSchemaType: 'TYPE_B',
  },
  [ImprovementSheetType.TOPRAKLAMA_PK]: {
    key: ImprovementSheetType.TOPRAKLAMA_PK,
    label: 'Topraklama PK',
    moduleGroup: 'ELEKTRIK_BAKIM_KONTROL',
    path: 'electrical/topraklama-pk',
    operationMode: 'INSPECTION',
    excelAliases: ['Topraklama PK'],
    columnSchemaType: 'TYPE_B',
  },
  [ImprovementSheetType.PARATONER_PK]: {
    key: ImprovementSheetType.PARATONER_PK,
    label: 'Paratoner PK',
    moduleGroup: 'ELEKTRIK_BAKIM_KONTROL',
    path: 'electrical/paratoner-pk',
    operationMode: 'INSPECTION',
    excelAliases: ['Paratoner PK'],
    columnSchemaType: 'TYPE_B',
  },
  [ImprovementSheetType.JENERATOR_PK]: {
    key: ImprovementSheetType.JENERATOR_PK,
    label: 'Jeneratör PK',
    moduleGroup: 'ELEKTRIK_BAKIM_KONTROL',
    path: 'electrical/jenerator-pk',
    operationMode: 'DUAL',
    excelAliases: ['Jeneratör PK', 'Jenerator PK'],
    columnSchemaType: 'TYPE_B',
  },
  [ImprovementSheetType.ELEKTRIK_PANO_KONTROLLERI]: {
    key: ImprovementSheetType.ELEKTRIK_PANO_KONTROLLERI,
    label: 'Elektrik Pano Kontrolleri',
    moduleGroup: 'ELEKTRIK_BAKIM_KONTROL',
    path: 'electrical/pano-kontrol',
    operationMode: 'INSPECTION',
    excelAliases: ['Enerji Analiz Raporu', 'Pano Kontrolleri', 'Elektrik Pano Kontolleri'],
    columnSchemaType: 'TYPE_B',
  },
  [ImprovementSheetType.ELEKTRIK_PANO_BAKIMLARI]: {
    key: ImprovementSheetType.ELEKTRIK_PANO_BAKIMLARI,
    label: 'Elektrik Pano Bakımları',
    moduleGroup: 'ELEKTRIK_BAKIM_KONTROL',
    path: 'electrical/pano-bakim',
    operationMode: 'MAINTENANCE',
    excelAliases: ['Elektrik Pano Kontrolleri'],
    columnSchemaType: 'TYPE_B',
  },
  [ImprovementSheetType.TRAFO]: {
    key: ImprovementSheetType.TRAFO,
    label: 'Trafo',
    moduleGroup: 'ELEKTRIK_BAKIM_KONTROL',
    path: 'electrical/trafo',
    operationMode: 'DUAL',
    excelAliases: ['Trafo'],
    columnSchemaType: 'TYPE_C',
  },
  [ImprovementSheetType.UPS]: {
    key: ImprovementSheetType.UPS,
    label: 'UPS',
    moduleGroup: 'ELEKTRIK_BAKIM_KONTROL',
    path: 'electrical/ups',
    operationMode: 'DUAL',
    excelAliases: ['UPS'],
    columnSchemaType: 'TYPE_C',
  },
};

export const ELECTRICAL_SHEET_KEYS: ImprovementSheetType[] = [
  ImprovementSheetType.ELEKTRIK_PK,
  ImprovementSheetType.TOPRAKLAMA_PK,
  ImprovementSheetType.PARATONER_PK,
  ImprovementSheetType.JENERATOR_PK,
  ImprovementSheetType.ELEKTRIK_PANO_KONTROLLERI,
  ImprovementSheetType.ELEKTRIK_PANO_BAKIMLARI,
  ImprovementSheetType.TRAFO,
  ImprovementSheetType.UPS,
];

// ============================================================================
// 5. MATEMATİKSEL İŞ MANTIĞI FONKSİYONLARI
// ============================================================================

export interface CompletionRateInput {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  cancelled: number;
  openCount?: number;
}

export interface CompletionRateResult {
  rate: number | null;
  display: string;
  hasIncompleteStatus: boolean;
}

/**
 * Excel if-then kuralına uygun tamamlanma oranı hesaplaması:
 * IF(OR(C=0, C-G=0, C<>SUM(D:G)), "n.a.", D/(C-G))
 */
export function calculateCompletionRate(metrics: CompletionRateInput): CompletionRateResult {
  const { total, completed, inProgress, notStarted, cancelled } = metrics;
  const categorizedSum = completed + inProgress + notStarted + cancelled;

  if (total === 0) {
    return { rate: null, display: 'n.a.', hasIncompleteStatus: false };
  }

  // Eğer durumu boş, 'Açık' veya tanımsız kayıt varsa oran hesaplanmaz
  if (total !== categorizedSum) {
    return { rate: null, display: 'n.a.', hasIncompleteStatus: true };
  }

  const actionableTotal = total - cancelled;
  if (actionableTotal <= 0) {
    return { rate: null, display: 'n.a.', hasIncompleteStatus: false };
  }

  const ratio = (completed / actionableTotal) * 100;
  const rounded = Math.round(ratio);

  return {
    rate: rounded,
    display: `%${rounded}`,
    hasIncompleteStatus: false,
  };
}

/**
 * Bir kaydın "Kritik Kalem" olup olmadığını belirleyen kural
 */
export function isCriticalItem(riskScore?: string | null, status?: string | null): boolean {
  if (!riskScore) return false;
  const isCriticalRisk = CRITICAL_RISKS.includes(riskScore as any);
  const isClosed = status === 'Tamamlandı' || status === 'İptal Edildi';
  return isCriticalRisk && !isClosed;
}

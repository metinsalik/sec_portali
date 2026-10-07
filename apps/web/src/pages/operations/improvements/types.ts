export interface FacilityOption {
  id: string;
  name: string;
  shortName: string;
  city: string;
  recordCount: number;
}

export type RiskScoreType = 'Kritik' | 'Yüksek' | 'Önemli' | 'Olası' | 'Önemsiz';
export type RecordStatusType = 'Tamamlandı' | 'Devam Ediyor' | 'Başlamadı' | 'İptal Edildi';

export interface ImprovementRecordHistory {
  id: string;
  recordId: string;
  previousNote?: string | null;
  newNote: string;
  previousStatus?: string | null;
  newStatus?: string | null;
  changedBy: string;
  changedByName?: string | null;
  createdAt: string;
}

export interface ImprovementRecord {
  id: string;
  facilityId: string;
  facility?: {
    id: string;
    name: string;
    shortName: string;
  };
  moduleGroup: string; // 'DENETIMLER' | 'ELEKTRIK'
  sheetType: string;
  rowNo?: number | null;
  location?: string | null;
  equipment?: string | null;
  finding: string;
  riskScore?: RiskScoreType | string | null;
  assignedTo?: string | null;
  status: RecordStatusType | string;
  actionPlan?: string | null;
  currentNote?: string | null;
  auditName?: string | null;
  category?: string | null;
  recordDate?: string | null;
  dueDate?: string | null; // Termin Tarihi
  applicationType?: string | null;
  sourceFileName?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  histories?: ImprovementRecordHistory[];
}

export interface DashboardStats {
  summary: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    cancelled: number;
    open: number;
    completionPercentage: number;
    openCritical: number;
    openHigh: number;
    risks: {
      critical: number;
      high: number;
      medium: number;
      low: number;
      negligible: number;
    };
  };
  sheets: Record<string, {
    total: number;
    completed: number;
    open: number;
    inProgress: number;
    notStarted: number;
  }>;
  hospitals: Array<{
    hospitalId: string;
    hospitalName: string;
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    cancelled: number;
    open: number;
    sheets?: Record<string, {
      total: number;
      completed: number;
      inProgress: number;
      notStarted: number;
      cancelled: number;
      open: number;
    }>;
  }>;
  categories: Record<string, number>;
}

export const ELECTRICAL_SHEETS = [
  { key: 'ELEKTRIK_PK', name: 'Elektrik PK', path: 'elektrik-pk' },
  { key: 'TOPRAKLAMA_PK', name: 'Topraklama PK', path: 'topraklama-pk' },
  { key: 'PARATONER_PK', name: 'Paratoner PK', path: 'paratoner-pk' },
  { key: 'JENERATOR_PK', name: 'Jeneratör PK', path: 'jenerator-pk' },
  { key: 'ELEKTRIK_PANO_KONTROLLERI', name: 'Elektrik Pano Kontrolleri', path: 'pano-kontrol' },
  { key: 'TRAFO', name: 'Trafo', path: 'trafo' },
  { key: 'UPS', name: 'UPS', path: 'ups' },
];

export const SHEET_MAP: Record<string, { sheetType: string; moduleGroup: string; label: string }> = {
  'Denetimler': { sheetType: 'DENETIMLER', moduleGroup: 'DENETIMLER', label: 'Denetimler' },
  'Elektrik PK': { sheetType: 'ELEKTRIK_PK', moduleGroup: 'ELEKTRIK', label: 'Elektrik PK' },
  'Topraklama PK': { sheetType: 'TOPRAKLAMA_PK', moduleGroup: 'ELEKTRIK', label: 'Topraklama PK' },
  'Paratoner PK': { sheetType: 'PARATONER_PK', moduleGroup: 'ELEKTRIK', label: 'Paratoner PK' },
  'Jeneratör PK': { sheetType: 'JENERATOR_PK', moduleGroup: 'ELEKTRIK', label: 'Jeneratör PK' },
  'Jenerator PK': { sheetType: 'JENERATOR_PK', moduleGroup: 'ELEKTRIK', label: 'Jeneratör PK' },
  'Elektrik Pano Kontrolleri': { sheetType: 'ELEKTRIK_PANO_KONTROLLERI', moduleGroup: 'ELEKTRIK', label: 'Elektrik Pano Kontrolleri' },
  'Elektrik Pano Kontolleri': { sheetType: 'ELEKTRIK_PANO_KONTROLLERI', moduleGroup: 'ELEKTRIK', label: 'Elektrik Pano Kontrolleri' },
  'Trafo': { sheetType: 'TRAFO', moduleGroup: 'ELEKTRIK', label: 'Trafo' },
  'UPS': { sheetType: 'UPS', moduleGroup: 'ELEKTRIK', label: 'UPS' },
};

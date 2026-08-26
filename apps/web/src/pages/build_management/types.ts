export type AuditStatus = 'Başlamadı' | 'Planlandı' | 'Devam Ediyor' | 'Tamamlandı' | 'Takipte' | 'Kapandı' | 'Arşiv Kayıt';

export type RiskLevel = 'Tolere Edilemez Risk' | 'Yüksek Risk' | 'Önemli Risk' | 'Olası Risk' | 'Önemsiz';

export const RISK_COLORS: Record<RiskLevel, string> = {
  'Tolere Edilemez Risk': '#8B0000',
  'Yüksek Risk': '#EF4444',
  'Önemli Risk': '#F97316',
  'Olası Risk': '#EAB308',
  'Önemsiz': '#22C55E'
};

export type ImprovementStatus = 'Yeni Tespit Edilen' | 'İyileştirilmeyen' | 'Kısmen İyileştirilen' | 'Tamamlanan';
export type StepStatus = 'Başlamadı' | 'Devam Ediyor' | 'İptal Edildi' | 'Tamamlandı';

export interface ActionStep {
  id: string;
  department: string;
  order: number;
  status: StepStatus;
  actionDate?: string; // İşlem Tarihi
  files?: { name: string, url: string, type: string }[];
  title?: string;
  explanation?: string;
  completedAt?: string;
}

export interface Finding {
  id: string;
  no: string;
  area: string;
  subarea?: string;
  category: string;
  subcategory?: string;
  risk: RiskLevel;
  targetDate?: string;
  isStarted?: boolean;
  files?: { name: string, url: string, type: string }[];
  residualRisk?: RiskLevel; // Kalan risk
  riskReasoning?: string; // Gerekçe
  findingDesc: string;
  riskDesc: string;
  recommendation: string;
  status: ImprovementStatus;
  steps: ActionStep[]; // Çoklu departman iş akışı
  departments?: string[]; // Sadece atanan departmanlar
  history: string;
}

export interface AuditMeta {
  locationId: string;
  round: number;
  start: string;
  end: string;
  reportDate: string;
  reportNo: string;
  reporter: string;
  auditStatus: AuditStatus;
  purpose: string;
  team: string[];
  participants: string[];
  executiveSummary?: string;
  generalConclusion?: string;
  
}

export interface Audit {
  id: string;
  status: 'DRAFT' | 'PUBLISHED';
  saved: boolean;
  meta: AuditMeta;
  findings: Finding[];
}

export interface FacilityAuditRef {
  date: string;
  reportNo: string;
  status: AuditStatus;
  findings?: number | null;
  improved?: number | null;
}

export interface IRSCFacility {
  id: string;
  name: string;
  locationCode?: string;
  audits: FacilityAuditRef[];
}

export interface IRSCDepartment {
  id: string;
  name: string;
}

export interface IRSCCategory {
  id: string;
  name: string;
  subcategories: string[];
}

export interface IRSCArea {
  id: string;
  name: string;
  subareas: string[];
}

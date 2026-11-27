export type AuditStatus = 'Başlamadı' | 'Planlandı' | 'Devam Ediyor' | 'Tamamlandı' | 'Takipte' | 'Kapandı' | 'Arşiv Kayıt';

export type RiskLevel = 'Kritik' | 'Yüksek' | 'Önemli' | 'Olası' | 'Önemsiz';

export const RISK_LEVELS: RiskLevel[] = ['Kritik', 'Yüksek', 'Önemli', 'Olası', 'Önemsiz'];

/** Eski kayıtlarla tam geriye dönük uyumluluk için risk seviyesini normalize eder */
export function normalizeRiskLevel(raw?: string | null): RiskLevel {
  const s = (raw || '').trim().toLocaleLowerCase('tr-TR');
  if (s.includes('kritik') || s.includes('tolere')) return 'Kritik';
  if (s.includes('yüksek') || s.includes('yuksek')) return 'Yüksek';
  if (s.includes('önemli') || s.includes('onemli') || s === 'orta') return 'Önemli';
  if (s.includes('olası') || s.includes('olasi') || s.includes('düşük') || s.includes('dusuk')) return 'Olası';
  if (s.includes('önemsiz') || s.includes('onemsiz')) return 'Önemsiz';
  return 'Önemli';
}

/** İyileştirme ve Aksiyon Takip modülü ile birebir aynı renk skalası */
export const RISK_COLORS: Record<RiskLevel, string> = {
  'Kritik': '#dc2626',   // red-600
  'Yüksek': '#f97316',   // orange-500
  'Önemli': '#f59e0b',   // amber-500
  'Olası': '#eab308',    // yellow-500
  'Önemsiz': '#64748b',  // slate-500
};

export function getRiskBadgeClass(raw?: string | null): string {
  switch (normalizeRiskLevel(raw)) {
    case 'Kritik':
      return 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50';
    case 'Yüksek':
      return 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/50';
    case 'Önemli':
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50';
    case 'Olası':
      return 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50';
    case 'Önemsiz':
      return 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800';
  }
}

export function getRiskSolidClass(raw?: string | null): string {
  switch (normalizeRiskLevel(raw)) {
    case 'Kritik':
      return 'bg-red-600 text-white border-red-700';
    case 'Yüksek':
      return 'bg-orange-500 text-white border-orange-600';
    case 'Önemli':
      return 'bg-amber-500 text-white border-amber-600';
    case 'Olası':
      return 'bg-yellow-500 text-white border-yellow-600';
    case 'Önemsiz':
      return 'bg-slate-500 text-white border-slate-600';
  }
}

export function getRiskBorderClass(raw?: string | null): string {
  switch (normalizeRiskLevel(raw)) {
    case 'Kritik':
      return 'border-l-red-600';
    case 'Yüksek':
      return 'border-l-orange-500';
    case 'Önemli':
      return 'border-l-amber-500';
    case 'Olası':
      return 'border-l-yellow-500';
    case 'Önemsiz':
      return 'border-l-slate-500';
  }
}

export function getRiskTermin(raw?: string | null): string {
  switch (normalizeRiskLevel(raw)) {
    case 'Kritik': return '+3 Gün';
    case 'Yüksek': return '+1 Ay';
    case 'Önemli': return '+3 Ay';
    case 'Olası': return '+9 Ay';
    case 'Önemsiz': return '+12 Ay';
  }
}

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
  stepType?: string;
  progress?: number | null;
  progressAdded?: number | null;
  performedBy?: string | null;
  performedByName?: string | null;
  performedByTitle?: string | null;
  sourceHistoryId?: string | null;
}

export interface Finding {
  id: string;
  rootFindingId?: string;
  originReportNo?: string;
  originReportDate?: string;
  isCarryover?: boolean;
  progress?: number;
  closedInReportNo?: string | null;
  closedAt?: string | null;
  no: string;
  area: string; // Eskiler için geriye dönük uyumluluk
  subarea?: string;
  locationId?: string;
  building?: string;
  floor?: string;
  department?: string;
  room?: string;
  
  mainCategory?: string;
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

export interface IrscFindingTemplate {
  id: string;
  code?: string | null;
  title: string;
  mainCategory?: string | null;
  category?: string | null;
  subcategory?: string | null;
  tags: string[];
  findingDesc: string;
  riskDesc?: string | null;
  recommendation?: string | null;
  defaultRisk: RiskLevel | string;
  defaultDepartments: string[];
  legislationRef?: string | null;
  usageCount: number;
  isActive: boolean;
  createdBy?: string | null;
  createdByName?: string | null;
  createdAt: string;
  updatedAt: string;
}

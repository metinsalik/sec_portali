import {
  ImprovementSheetType,
  ImprovementOperationType,
  ImprovementReportResult,
  type ImprovementPhoto,
  IMPROVEMENT_SHEET_DEFINITIONS,
  ELECTRICAL_SHEET_KEYS,
  VALID_STATUSES,
  VALID_RISKS,
  CRITICAL_RISKS,
  MAX_PHOTOS_PER_RECORD,
  type ValidStatus,
  type ValidRisk,
} from '@sec-portali/shared';

export {
  ImprovementSheetType,
  ImprovementOperationType,
  ImprovementReportResult,
  IMPROVEMENT_SHEET_DEFINITIONS,
  ELECTRICAL_SHEET_KEYS,
  VALID_STATUSES,
  VALID_RISKS,
  CRITICAL_RISKS,
  MAX_PHOTOS_PER_RECORD,
};

export type { ImprovementPhoto, ValidStatus, ValidRisk };

export interface FacilityOption {
  id: string;
  name: string;
  shortName: string;
  city: string;
  recordCount: number;
}

export interface ImprovementActionItem {
  id: string;
  recordId: string;
  actionDescription: string;
  statusAfterAction?: string | null;
  responsiblePerson?: string | null;
  actionDate: string;
  dueDate?: string | null;
  costAmount?: number | string | null;
  currency?: string;
  extraDetails?: any;
  createdById?: string;
  createdAt?: string;
}

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

export interface ImprovementOperationReportSummary {
  id: string;
  reportDate: string;
  nextScheduledDate?: string | null;
  operationType: ImprovementOperationType;
  resultStatus: ImprovementReportResult;
  companyName?: string | null;
  inspectorName?: string | null;
  reportNo?: string | null;
  summaryNotes?: string | null;
}

export interface ImprovementRecord {
  id: string;
  facilityId: string;
  facility?: {
    id: string;
    name: string;
    shortName: string;
  };
  moduleGroup: string; // 'DENETIM' | 'ELEKTRIK_BAKIM_KONTROL'
  sheetType: ImprovementSheetType;
  rowNo?: number | null;
  reportId?: string | null;
  report?: ImprovementOperationReportSummary | null;

  location?: string | null;
  equipment?: string | null;
  finding: string;
  riskScore?: string | null;
  assignedTo?: string | null;
  status: string;
  actionPlan?: string | null;
  currentNote?: string | null;

  auditName?: string | null;
  category?: string | null;
  recordDate?: string | null;
  dueDate?: string | null;
  applicationType?: string | null;

  legacyBudget?: number | string | null;
  currency?: string;
  extraFields?: Record<string, any> | null;
  photos?: ImprovementPhoto[];

  sourceFileName?: string | null;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;

  actions?: ImprovementActionItem[];
  histories?: ImprovementRecordHistory[];
}

export interface DashboardKPIs {
  totalFindings: number;
  completed: number;
  completionRateDisplay: string;
  completionRate: number | null;
  hasIncompleteStatus: boolean;
  openCritical: number;
  openHigh: number;
  missingStatusCount: number;
  missingRiskCount: number;
  missingOwnerCount: number;
}

export interface QualityGridData {
  emptyStatus: number;
  undefinedStatus: number;
  emptyRisk: number;
  undefinedRisk: number;
  emptyOwner: number;
  emptyAction: number;
  emptyDate: number;
  emptyFacility: number;
}

export interface AreaSummaryMatrixRow {
  sheetType: ImprovementSheetType;
  label: string;
  moduleGroup: string;
  path: string;
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  cancelled: number;
  completionRate: number | null;
  completionRateDisplay: string;
  openCritical: number;
  openHigh: number;
  actionsCount: number;
  reportsCount: number;
  overdueReportsCount: number;
}

export interface HospitalComparisonMatrixRow {
  facilityId: string;
  facilityName: string;
  shortName: string;
  city: string;
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  cancelled: number;
  completionRate: number | null;
  completionRateDisplay: string;
  openCritical: number;
  openHigh: number;
}

export interface HospitalAccordionCategory {
  categoryName: string;
  total: number;
  completed: number;
  completionRateDisplay: string;
}

export interface HospitalAccordionSheet {
  sheetType: string;
  sheetLabel: string;
  total: number;
  completed: number;
  completionRateDisplay: string;
  categories: HospitalAccordionCategory[];
}

export interface HospitalAccordionItem {
  hospitalId: string;
  hospitalName: string;
  total: number;
  completed: number;
  completionRateDisplay: string;
  sheets: HospitalAccordionSheet[];
}

export interface DashboardStatsResponse {
  kpis: DashboardKPIs;
  notice: { type: 'amber' | 'neutral'; message: string } | null;
  qualityGrid: QualityGridData;
  statusDistribution: Array<{ status: string; count: number }>;
  riskDistribution: Array<{ risk: string; count: number }>;
  areaSummaryMatrix: AreaSummaryMatrixRow[];
  hospitalComparisonMatrix: HospitalComparisonMatrixRow[];
  hospitalFindingAccordion: HospitalAccordionItem[];
}

export interface CompactReportOperationDetail {
  id: string;
  reportDate: string;
  nextScheduledDate?: string | null;
  resultStatus: ImprovementReportResult;
  isOverdue: boolean;
  companyName?: string | null;
  reportNo?: string | null;
  hasConflict: boolean;
}

export interface CompactReportOverviewRow {
  facilityId: string;
  facilityName: string;
  inspection: CompactReportOperationDetail | null;
  maintenance: CompactReportOperationDetail | null;
  openFindingsCount: number;
  criticalFindingsCount: number;
  hasConflict: boolean;
  conflictMessage?: string | null;
}

export interface GroupDashboardStatsResponse {
  groupKpis: {
    totalFindings: number;
    completed: number;
    completionRateDisplay: string;
    openCritical: number;
    totalActionsCost: number;
  };
  operationMetrics: {
    totalHospitals: number;
    facilitiesWithReports: number;
    overdueReports: number;
    clearReports: number;
    findingsReports: number;
  };
  groupSummaryTable: Array<{
    sheetType: ImprovementSheetType;
    label: string;
    path: string;
    total: number;
    completed: number;
    open: number;
    completionRateDisplay: string;
    openCritical: number;
  }>;
  hospitalOperationTable: Array<{
    facilityId: string;
    facilityName: string;
    latestInspectionDate?: string | null;
    nextInspectionDate?: string | null;
    inspectionResult?: string | null;
    isInspectionOverdue: boolean;
    latestMaintenanceDate?: string | null;
    nextMaintenanceDate?: string | null;
    maintenanceResult?: string | null;
    isMaintenanceOverdue: boolean;
    openCount: number;
    criticalCount: number;
  }>;
}

export interface TrashItem {
  id: string;
  type: 'RECORD' | 'REPORT' | 'ACTION';
  title: string;
  detail?: string | null;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

export type StatusType = 'normal' | 'warning' | 'critical';

export interface RiskDistribution {
  tolereGosterilmez: number;
  yuksek: number;
  onemli: number;
  olasi: number;
  onemsiz: number;
}

export interface ActiveHazardItem {
  id: string;
  riskNo: string;
  hazard: string;
  level: string;
  status: string;
  responsible?: string;
  action?: string;
}

export interface TelemetryData {
  voltageL1: number;
  voltageL2: number;
  voltageL3: number;
  temperature: number; // °C
  loadPercentage: number; // %
  currentAmps: number;
  lastMaintenance: string;
  activeAlarm?: string;
  isSimulatedResolved?: boolean;
}

export interface IsometricRoom {
  id: string;
  name: string;
  code?: string;
  departmentId?: string;
  gridX: number; // 0..2
  gridY: number; // 0..2
  spanX?: number; // default 1
  spanY?: number; // default 1
  height?: number; // cube height in px
  type: 'electrical' | 'ups' | 'mechanical' | 'medical' | 'office' | 'storage' | 'elevator' | 'general';
  status: StatusType;
  openRiskCount: number;
  riskDistribution?: RiskDistribution;
  safetyScore?: number; // 0..100
  activeHazards?: ActiveHazardItem[];
  telemetry?: TelemetryData;
  description?: string;
}

export interface IsometricFloor {
  id: string;
  floorNumber: number; // -2, -1, 0, 1, 2... 13
  name: string; // "13. Kat", "Zemin Kat", vs.
  gridSize: number; // e.g. 3 for 3x3
  rooms: IsometricRoom[];
  status: StatusType;
  riskCount: number;
  riskDistribution?: RiskDistribution;
  safetyScore?: number; // 0..100
  hasCriticalFault?: boolean;
  criticalFaultText?: string;
}

export interface IsometricBuildingData {
  id: string;
  name: string; // e.g. "A Blok - Ana Bina"
  floors: IsometricFloor[];
  riskDistribution?: RiskDistribution;
  totalRisks?: number;
  safetyScore?: number;
}


export const ISOMETRIC_MODULE_VERSION = '1.0.0';


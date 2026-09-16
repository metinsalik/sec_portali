import api from '@/lib/api';

export interface ElectricInfrastructureRecord {
  id: string;
  facilityId: string;
  orderIndex: number;
  equipmentCategory: string;
  equipmentCodeName: string;
  locationDescription: string;
  isInspected: string;
  hasRisk: string;
  hasMaintenanceRecord: string;
  lastMaintenanceDate?: string | null;
  thermalControl?: string | null;
  overloadHeat?: string | null;
  cablesBreakers?: string | null;
  cleanlinessVentilation?: string | null;
  extinguishingSystem?: string | null;
  sealingFireStop?: string | null;
  protectionSystem?: string | null;
  detectedRisk?: string | null;
  suggestedAction?: string | null;
  emergencyActionTaken?: string | null;
  responsiblePerson?: string | null;
  deadlineDate?: string | null;
  actionStatus: string;
  evidenceNo?: string | null;
  photoUrls?: string[] | any;
  inspectorName?: string | null;
  inspectionDate?: string | null;
  notes?: string | null;
  facility?: { id: string; name: string };
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface ElectricInfrastructureStats {
  totalCount: number;
  riskCount: number;
  noMaintenanceCount: number;
  openActionCount: number;
  notInspectedCount: number;
  statusText: string;
  statusColor: 'green' | 'red' | 'gray';
}

export interface HospitalFacilityItem {
  id: string;
  name: string;
  shortName: string;
  city?: string | null;
  recordCount: number;
  isCompleted?: boolean;
  completedAt?: string | null;
  completedBy?: string | null;
}

export interface HospitalStatsResponse {
  totalHospitals: number;
  enteredCount: number;
  notEnteredCount: number;
  completedHospitalsCount: number;
  completionRate: number;
  verifiedCompletionRate: number;
  enteredHospitals: HospitalFacilityItem[];
  notEnteredHospitals: HospitalFacilityItem[];
}

export interface FacilityStatusResponse {
  facilityId: string;
  recordCount: number;
  isCompleted: boolean;
  completedAt?: string | null;
  completedBy?: string | null;
  notes?: string | null;
}

export interface MatchingEquipmentItem {
  id: string;
  facilityId: string;
  facilityName: string;
  equipmentCategory: string;
  equipmentCodeName: string;
  locationDescription: string;
  isInspected?: string | null;
  hasRisk?: string | null;
  hasMaintenanceRecord?: string | null;
  lastMaintenanceDate?: string | null;
  thermalControl?: string | null;
  overloadHeat?: string | null;
  cablesBreakers?: string | null;
  cleanlinessVentilation?: string | null;
  extinguishingSystem?: string | null;
  sealingFireStop?: string | null;
  protectionSystem?: string | null;
  actionStatus?: string | null;
  detectedRisk?: string | null;
  suggestedAction?: string | null;
  emergencyActionTaken?: string | null;
  responsiblePerson?: string | null;
  deadlineDate?: string | null;
  inspectorName?: string | null;
  inspectionDate?: string | null;
  photoUrls?: any;
  notes?: string | null;
}

export interface ExecutiveDashboardFacilityItem {
  id: string;
  name: string;
  shortName: string;
  type: string;
  city?: string | null;
  equipmentCount: number;
  matchingEquipmentCount?: number;
  matchingEquipments?: MatchingEquipmentItem[];
  hasEntered: boolean;
  isCompleted: boolean;
  completedAt?: string | null;
  completedBy?: string | null;
  riskCount: number;
  noMaintenanceCount: number;
  openActionCount: number;
  thermalNotSuitableCount: number;
  complianceScore: number;
}

export interface ExecutiveDashboardResponse {
  summary: {
    totalFacilitiesCount: number;
    enteredFacilitiesCount: number;
    notEnteredFacilitiesCount: number;
    verifiedCompletedCount: number;
    entryCompletionRate: number;
    verifiedCompletionRate: number;
    totalEquipments: number;
    totalRisks: number;
    totalMissingMaintenance: number;
    totalOpenActions: number;
    totalThermalNotSuitable: number;
  };
  categoryBreakdown: {
    name: string;
    count: number;
    riskCount: number;
  }[];
  actionStatusBreakdown: {
    name: string;
    value: number;
    color: string;
  }[];
  criteriaBreakdowns?: Record<string, Record<string, number>>;
  facilities: ExecutiveDashboardFacilityItem[];
}

export const electricInfrastructureService = {
  getRecords: async (params?: {
    facilityId?: string;
    category?: string;
    risk?: string;
    actionStatus?: string;
    search?: string;
  }): Promise<ElectricInfrastructureRecord[]> => {
    const query = new URLSearchParams();
    if (params?.facilityId) query.append('facilityId', params.facilityId);
    if (params?.category) query.append('category', params.category);
    if (params?.risk) query.append('risk', params.risk);
    if (params?.actionStatus) query.append('actionStatus', params.actionStatus);
    if (params?.search) query.append('search', params.search);

    const res = await api.get(`/safety-management/electric-infrastructure?${query.toString()}`);
    if (!res.ok) throw new Error('Kayıtlar yüklenemedi.');
    return res.json();
  },

  getRecordById: async (id: string): Promise<ElectricInfrastructureRecord> => {
    const res = await api.get(`/safety-management/electric-infrastructure/${id}`);
    if (!res.ok) throw new Error('Kayıt bulunamadı.');
    return res.json();
  },

  getStats: async (facilityId?: string): Promise<ElectricInfrastructureStats> => {
    const query = new URLSearchParams();
    if (facilityId) query.append('facilityId', facilityId);

    const res = await api.get(`/safety-management/electric-infrastructure/stats?${query.toString()}`);
    if (!res.ok) throw new Error('İstatistikler yüklenemedi.');
    return res.json();
  },

  getHospitalStats: async (): Promise<HospitalStatsResponse> => {
    const res = await api.get('/safety-management/electric-infrastructure/hospital-stats');
    if (!res.ok) throw new Error('Hastane giriş durumu istatistikleri alınamadı.');
    return res.json();
  },

  getFacilityStatus: async (facilityId: string): Promise<FacilityStatusResponse> => {
    const res = await api.get(`/safety-management/electric-infrastructure/facility-status/${facilityId}`);
    if (!res.ok) throw new Error('Tesis tamamlama durumu alınamadı.');
    return res.json();
  },

  toggleFacilityStatus: async (
    facilityId: string,
    data: { isCompleted: boolean; notes?: string }
  ): Promise<FacilityStatusResponse> => {
    const res = await api.post(`/safety-management/electric-infrastructure/facility-status/${facilityId}/toggle`, {
      ...data,
      facilityId
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Tesis tamamlama durumu güncellenemedi.');
    }
    return res.json();
  },

  getExecutiveDashboard: async (params?: {
    facilityType?: string;
    completionFilter?: string;
    riskFilter?: string;
    selectedCategory?: string;
    criteriaKey?: string;
    criteriaValue?: string;
  }): Promise<ExecutiveDashboardResponse> => {
    const query = new URLSearchParams();
    if (params?.facilityType) query.append('facilityType', params.facilityType);
    if (params?.completionFilter) query.append('completionFilter', params.completionFilter);
    if (params?.riskFilter) query.append('riskFilter', params.riskFilter);
    if (params?.selectedCategory) query.append('selectedCategory', params.selectedCategory);
    if (params?.criteriaKey) query.append('criteriaKey', params.criteriaKey);
    if (params?.criteriaValue) query.append('criteriaValue', params.criteriaValue);

    const res = await api.get(`/safety-management/electric-infrastructure/executive-dashboard?${query.toString()}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Yönetici gösterge paneli verileri alınamadı.');
    }
    return res.json();
  },

  createRecord: async (data: Partial<ElectricInfrastructureRecord>): Promise<ElectricInfrastructureRecord> => {
    const res = await api.post('/safety-management/electric-infrastructure', data);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Kayıt eklenemedi.');
    }
    return res.json();
  },

  updateRecord: async (id: string, data: Partial<ElectricInfrastructureRecord>): Promise<ElectricInfrastructureRecord> => {
    const res = await api.put(`/safety-management/electric-infrastructure/${id}`, data);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Kayıt güncellenemedi.');
    }
    return res.json();
  },

  deleteRecord: async (id: string): Promise<void> => {
    const res = await api.delete(`/safety-management/electric-infrastructure/${id}`);
    if (!res.ok) throw new Error('Kayıt silinemedi.');
  },

  initTemplate: async (facilityId: string): Promise<{ message: string; items: ElectricInfrastructureRecord[] }> => {
    const res = await api.post('/safety-management/electric-infrastructure/init-template', { facilityId });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Şablon yüklenemedi.');
    }
    return res.json();
  },

  uploadEvidence: async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    const res = await api.post('/safety-management/electric-infrastructure/upload-evidence', formData);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Dosya yüklenemedi.');
    }
    const data = await res.json();
    return data.urls;
  },

  downloadExcel: async (facilityId?: string) => {
    const query = facilityId && facilityId !== 'all' ? `?facilityId=${encodeURIComponent(facilityId)}` : '';
    const res = await api.get(`/safety-management/electric-infrastructure/export-excel${query}`);
    if (!res.ok) throw new Error('Excel indirilemedi.');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Elektrik_Altyapi_Kontrol_Formu.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};

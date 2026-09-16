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
    if (!res.ok) throw new Error('Kayıt detayı yüklenemedi.');
    return res.json();
  },

  getStats: async (facilityId?: string): Promise<ElectricInfrastructureStats> => {
    const query = new URLSearchParams();
    if (facilityId) query.append('facilityId', facilityId);

    const res = await api.get(`/safety-management/electric-infrastructure/stats?${query.toString()}`);
    if (!res.ok) throw new Error('İstatistikler yüklenemedi.');
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

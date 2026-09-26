import api from '@/lib/api';

export interface ThermalInspectionItem {
  id: string;
  sessionId: string;
  orderIndex: number;
  buildingLocation?: string | null;
  floorSection?: string | null;
  measurementDate?: string | null;
  controlTime?: string | null;
  panelName: string;
  measurementPoint?: string | null;
  equipmentConnection?: string | null;
  measuredTemp?: number | null;
  ambientTemp?: number | null;
  deltaTemp?: number | null;
  status?: string | null;
  priority?: string | null;
  detectedRisk?: string | null;
  actionTaken?: string | null;
  photoUrls: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ThermalInspectionSession {
  id: string;
  facilityId: string;
  reportDate?: string | null;
  status: 'DEVAM_EDIYOR' | 'TAMAMLANDI';
  completedAt?: string | null;
  completedBy?: string | null;
  notes?: string | null;
  uploadedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  facility?: {
    id: string;
    name: string;
    shortName?: string | null;
    city?: string | null;
  };
  items?: ThermalInspectionItem[];
  _count?: {
    items: number;
  };
}

export interface ThermalDashboardFacility {
  id: string;
  name: string;
  shortName: string;
  city?: string | null;
  type?: string | null;
  hasEntered: boolean;
  status: 'DEVAM_EDIYOR' | 'TAMAMLANDI' | 'GIRILMEDI';
  isCompleted: boolean;
  sessionId?: string | null;
  reportDate?: string | null;
  completedAt?: string | null;
  completedBy?: string | null;
  itemCount: number;
  criticalCount: number;
  warningCount: number;
}

export interface ThermalDashboardSummary {
  totalFacilities: number;
  enteredCount: number;
  notEnteredCount: number;
  inProgressCount: number;
  completedCount: number;
  completionRate: number;
  entryRate: number;
  totalPanelsMeasured: number;
  totalCriticalIssues: number;
}

export interface ThermalDashboardResponse {
  summary: ThermalDashboardSummary;
  facilities: ThermalDashboardFacility[];
}

export const thermalInspectionService = {
  // Oturumları listele
  async getSessions(facilityId?: string): Promise<ThermalInspectionSession[]> {
    const url = facilityId && facilityId !== 'all'
      ? `/safety-management/electric-infrastructure/thermal/sessions?facilityId=${facilityId}`
      : '/safety-management/electric-infrastructure/thermal/sessions';
    const res = await api.get(url);
    return res.data;
  },

  // Tek oturum detayını ve maddelerini getir
  async getSessionDetail(sessionId: string): Promise<ThermalInspectionSession> {
    const res = await api.get(`/safety-management/electric-infrastructure/thermal/sessions/${sessionId}`);
    return res.data;
  },

  // Manuel yeni oturum aç
  async createSession(data: { facilityId: string; reportDate?: string; notes?: string }): Promise<ThermalInspectionSession> {
    const res = await api.post('/safety-management/electric-infrastructure/thermal/sessions', data);
    return res.data;
  },

  // Oturumu tamamla veya devam ediyora çevir
  async updateSessionStatus(sessionId: string, status: 'TAMAMLANDI' | 'DEVAM_EDIYOR'): Promise<ThermalInspectionSession> {
    const res = await api.patch(`/safety-management/electric-infrastructure/thermal/sessions/${sessionId}/status`, { status });
    return res.data;
  },

  // Oturum sil
  async deleteSession(sessionId: string): Promise<void> {
    await api.delete(`/safety-management/electric-infrastructure/thermal/sessions/${sessionId}`);
  },

  // Excel yükle
  async importExcel(facilityId: string, file: File): Promise<{ message: string; session: ThermalInspectionSession }> {
    const formData = new FormData();
    formData.append('facilityId', facilityId);
    formData.append('file', file);
    const res = await api.post('/safety-management/electric-infrastructure/thermal/import-excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  // Ölçüm maddesi oluştur (Manuel satır ekleme)
  async createItem(data: Partial<ThermalInspectionItem> & { sessionId: string }): Promise<ThermalInspectionItem> {
    const res = await api.post('/safety-management/electric-infrastructure/thermal/items', data);
    return res.data;
  },

  // Ölçüm maddesi güncelle
  async updateItem(itemId: string, data: Partial<ThermalInspectionItem>): Promise<ThermalInspectionItem> {
    const res = await api.put(`/safety-management/electric-infrastructure/thermal/items/${itemId}`, data);
    return res.data;
  },

  // Ölçüm maddesi sil
  async deleteItem(itemId: string): Promise<void> {
    await api.delete(`/safety-management/electric-infrastructure/thermal/items/${itemId}`);
  },

  // Maddeye çoklu fotoğraf yükle (Dosyalar + Tesis ID)
  async uploadPhotos(itemId: string, facilityId: string, files: File[]): Promise<{ message: string; photoUrls: string[]; item: ThermalInspectionItem }> {
    const formData = new FormData();
    formData.append('facilityId', facilityId);
    files.forEach(f => {
      formData.append('photos', f);
    });
    const res = await api.post(`/safety-management/electric-infrastructure/thermal/items/${itemId}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  // Maddeden tek bir fotoğraf sil
  async removePhoto(itemId: string, photoUrl: string): Promise<{ message: string; photoUrls: string[] }> {
    const res = await api.delete(`/safety-management/electric-infrastructure/thermal/items/${itemId}/photos`, {
      data: { photoUrl }
    });
    return res.data;
  },

  // Yönetici Paneli & Tesis Durum İstatistikleri
  async getDashboardStats(): Promise<ThermalDashboardResponse> {
    const res = await api.get('/safety-management/electric-infrastructure/thermal/dashboard-stats');
    return res.data;
  }
};

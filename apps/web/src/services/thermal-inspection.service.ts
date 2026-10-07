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
  // Gelişmiş Aksiyon & Termin Takibi
  actionPlan?: string | null;
  actionDueDate?: string | null;
  actionAssignee?: string | null;
  actionStatus?: 'BEKLIYOR' | 'DEVAM_EDIYOR' | 'TAMAMLANDI' | 'IPTAL' | string | null;
  actionCompletedDate?: string | null;
  actionNotes?: string | null;
  actionPhotos?: string[];
  photoUrls: string[];
  createdAt: string;
  updatedAt: string;
  isOverdue?: boolean;
  isUrgent?: boolean;
  session?: {
    id: string;
    facilityId?: string;
    reportDate?: string | null;
    facility?: {
      id: string;
      name: string;
      shortName?: string | null;
      city?: string | null;
    };
  };
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
    if (!res.ok) throw new Error('Oturumlar getirilemedi.');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  // Tek oturum detayını ve maddelerini getir
  async getSessionDetail(sessionId: string): Promise<ThermalInspectionSession> {
    const res = await api.get(`/safety-management/electric-infrastructure/thermal/sessions/${sessionId}`);
    if (!res.ok) throw new Error('Oturum detayı getirilemedi.');
    return await res.json();
  },

  // Manuel yeni oturum aç
  async createSession(data: { facilityId: string; reportDate?: string; notes?: string }): Promise<ThermalInspectionSession> {
    const res = await api.post('/safety-management/electric-infrastructure/thermal/sessions', data);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Oturum oluşturulamadı.');
    }
    return await res.json();
  },

  // Oturumu tamamla veya devam ediyora çevir
  async updateSessionStatus(sessionId: string, status: 'TAMAMLANDI' | 'DEVAM_EDIYOR'): Promise<ThermalInspectionSession> {
    const res = await api.patch(`/safety-management/electric-infrastructure/thermal/sessions/${sessionId}/status`, { status });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Oturum durumu güncellenemedi.');
    }
    return await res.json();
  },

  // Oturum sil
  async deleteSession(sessionId: string): Promise<void> {
    const res = await api.delete(`/safety-management/electric-infrastructure/thermal/sessions/${sessionId}`);
    if (!res.ok) throw new Error('Oturum silinemedi.');
  },

  // Excel yükle
  async importExcel(facilityId: string, file: File, reportDate?: string): Promise<{ message: string; session: ThermalInspectionSession }> {
    const formData = new FormData();
    formData.append('facilityId', facilityId);
    formData.append('file', file);
    if (reportDate) {
      formData.append('reportDate', reportDate);
    }
    const res = await api.post('/safety-management/electric-infrastructure/thermal/import-excel', formData);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Excel yüklenemedi.');
    }
    return await res.json();
  },

  // Ölçüm maddesi oluştur (Manuel satır ekleme)
  async createItem(data: Partial<ThermalInspectionItem> & { sessionId: string }): Promise<ThermalInspectionItem> {
    const res = await api.post('/safety-management/electric-infrastructure/thermal/items', data);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Ölçüm kaydı oluşturulamadı.');
    }
    return await res.json();
  },

  // Ölçüm maddesi güncelle
  async updateItem(itemId: string, data: Partial<ThermalInspectionItem>): Promise<ThermalInspectionItem> {
    const res = await api.put(`/safety-management/electric-infrastructure/thermal/items/${itemId}`, data);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Ölçüm kaydı güncellenemedi.');
    }
    return await res.json();
  },

  // Ölçüm maddesi sil
  async deleteItem(itemId: string): Promise<void> {
    const res = await api.delete(`/safety-management/electric-infrastructure/thermal/items/${itemId}`);
    if (!res.ok) throw new Error('Ölçüm kaydı silinemedi.');
  },

  // Maddeye çoklu fotoğraf yükle (Dosyalar + Tesis ID)
  async uploadPhotos(itemId: string, facilityId: string, files: File[]): Promise<{ message: string; newUrls?: string[]; photoUrls: string[]; item: ThermalInspectionItem }> {
    const formData = new FormData();
    formData.append('facilityId', facilityId);
    files.forEach(f => {
      formData.append('photos', f);
    });
    const res = await api.post(`/safety-management/electric-infrastructure/thermal/items/${itemId}/photos`, formData);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Fotoğraf yüklenemedi.');
    }
    return await res.json();
  },

  // Maddeden tek bir fotoğraf sil
  async removePhoto(itemId: string, photoUrl: string): Promise<{ message: string; photoUrls: string[] }> {
    const res = await api.delete(`/safety-management/electric-infrastructure/thermal/items/${itemId}/photos`, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoUrl })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Fotoğraf silinemedi.');
    }
    return await res.json();
  },

  // Yönetici Paneli & Tesis Durum İstatistikleri
  async getDashboardStats(): Promise<ThermalDashboardResponse> {
    const res = await api.get('/safety-management/electric-infrastructure/thermal/dashboard-stats');
    if (!res.ok) throw new Error('İstatistikler getirilemedi.');
    return await res.json();
  },

  // Aksiyon Planla / Güncelle
  async updateItemAction(
    itemId: string,
    data: {
      actionPlan?: string;
      actionDueDate?: string | null;
      actionAssignee?: string;
      actionStatus?: string;
      actionCompletedDate?: string | null;
      actionNotes?: string;
      actionPhotos?: string[];
      status?: string;
      priority?: string;
      measuredTemp?: number | null;
      ambientTemp?: number | null;
      deltaTemp?: number | null;
    }
  ): Promise<ThermalInspectionItem> {
    const res = await api.patch(`/safety-management/electric-infrastructure/thermal/items/${itemId}/action`, data);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Aksiyon güncellenemedi.');
    }
    return await res.json();
  },

  // Farklı veya hatalı adlandırılmış panoları tek bir isim altında birleştirme
  async mergePanels(data: {
    targetPanelName: string;
    sourcePanelNames: string[];
    facilityId?: string;
  }): Promise<{ message: string; updatedCount: number; targetPanelName: string }> {
    const res = await api.post('/safety-management/electric-infrastructure/thermal/merge-panels', data);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Panolar birleştirilemedi.');
    }
    return await res.json();
  },

  // Sıkı Takipteki Panolar ve Açık Aksiyonlar Listesi (Watchlist)
  async getWatchlist(facilityId?: string): Promise<ThermalInspectionItem[]> {
    const query = facilityId && facilityId !== 'all' ? `?facilityId=${encodeURIComponent(facilityId)}` : '';
    const res = await api.get(`/safety-management/electric-infrastructure/thermal/watchlist${query}`);
    if (!res.ok) throw new Error('Takip listesi getirilemedi.');
    return await res.json();
  },

  // Pano Tarihçesi / Sıcaklık Eğilimi
  async getPanelHistory(panelName: string, facilityId?: string): Promise<ThermalInspectionItem[]> {
    const params = new URLSearchParams({ panelName });
    if (facilityId && facilityId !== 'all') {
      params.append('facilityId', facilityId);
    }
    const res = await api.get(`/safety-management/electric-infrastructure/thermal/panel-history?${params.toString()}`);
    if (!res.ok) throw new Error('Pano geçmişi getirilemedi.');
    return await res.json();
  },

  // Boş / anlamsız ölçüm satırlarını temizleme
  async cleanupEmptyItems(facilityId?: string, sessionId?: string): Promise<{ message: string; deletedCount: number }> {
    const res = await api.post('/safety-management/electric-infrastructure/thermal/cleanup-empty', {
      facilityId,
      sessionId
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Boş satırlar temizlenemedi.');
    }
    return await res.json();
  },

  // Delta T ve Sıcaklık Eşik Değerleri Ayarları
  async getSettings(facilityId?: string): Promise<any> {
    const query = facilityId && facilityId !== 'all' ? `?facilityId=${encodeURIComponent(facilityId)}` : '';
    const res = await api.get(`/safety-management/electric-infrastructure/thermal/settings${query}`);
    if (!res.ok) throw new Error('Ayarlar getirilemedi.');
    const data = await res.json();
    return data.data;
  },

  async updateSettings(data: {
    facilityId?: string | null;
    warningThreshold: number;
    criticalThreshold: number;
    deltaWarning: number;
    deltaCritical: number;
    negativeDeltaWarn: boolean;
  }): Promise<any> {
    const res = await api.put('/safety-management/electric-infrastructure/thermal/settings', data);
    if (!res.ok) throw new Error('Ayarlar kaydedilemedi.');
    return await res.json();
  },

  // Pano adı otomatik tamamlama önerileri
  async getPanelSuggestions(facilityId?: string, search?: string): Promise<Array<{
    panelName: string;
    buildingLocation?: string;
    floorSection?: string;
    equipmentConnection?: string;
    measurementPoint?: string;
  }>> {
    const params = new URLSearchParams();
    if (facilityId && facilityId !== 'all') params.append('facilityId', facilityId);
    if (search) params.append('search', search);
    const res = await api.get(`/safety-management/electric-infrastructure/thermal/panels/suggestions?${params.toString()}`);
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  }
};

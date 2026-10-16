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

export interface ThermalPanel {
  id: string;
  facilityId: string;
  panelCode: string;
  panelName?: string | null;
  building?: string | null;
  block?: string | null;
  floor: string;
  panelType: string;
  description?: string | null;
  locationCode?: string | null;
  floorCode?: string | null;
  typeCode?: string | null;
  sequenceNumber?: number | null;
  equipmentConnection?: string | null;
  measurementPoint?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Computed stats
  measurementCount?: number;
  latestTemp?: number | null;
  maxTemp?: number | null;
  latestDelta?: number | null;
  latestDate?: string | null;
  isCritical?: boolean;
  latestStatus?: string | null;
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

  // Toplu oturum/rapor sil
  async deleteSessionsBulk(sessionIds: string[]): Promise<{ message: string; deletedSessionCount: number; deletedItemCount: number }> {
    const res = await api.delete('/safety-management/electric-infrastructure/thermal/sessions/bulk', { sessionIds });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Raporlar toplu silinemedi.');
    }
    return await res.json();
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

  // Konsolide Excel Önizleme (Tüm Hastaneler ve Ölçümler)
  async previewConsolidatedExcel(file: File): Promise<{
    success: boolean;
    fileName: string;
    totalValidRows: number;
    totalFacilities: number;
    facilities: Array<{
      excelName: string;
      matchType: 'EXACT' | 'FUZZY' | 'NONE';
      matchedFacilityId: string | null;
      matchedFacilityName: string | null;
      matchedFacilityCity: string | null;
      rowCount: number;
      measurements: Array<{ name: string; count: number; sampleDate: string | null }>;
    }>;
    allDbFacilities: Array<{ id: string; name: string; shortName?: string | null; city?: string | null }>;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/safety-management/electric-infrastructure/thermal/preview-consolidated-excel', formData);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Excel önizlemesi alınamadı.');
    }
    return await res.json();
  },

  // Konsolide Excel Toplu Aktarım
  async importConsolidatedExcel(file: File, mappings?: Record<string, string>): Promise<{
    success: boolean;
    message: string;
    stats: {
      totalFacilities: number;
      totalSessions: number;
      totalItems: number;
      totalPanelsRegistered: number;
    };
    details: any[];
  }> {
    const formData = new FormData();
    formData.append('file', file);
    if (mappings && Object.keys(mappings).length > 0) {
      formData.append('mappings', JSON.stringify(mappings));
    }
    const res = await api.post('/safety-management/electric-infrastructure/thermal/import-consolidated-excel', formData);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Konsolide Excel yüklenemedi.');
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
    const res = await api.delete(`/safety-management/electric-infrastructure/thermal/items/${itemId}/photos`, { photoUrl });
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
    displayName?: string;
    buildingLocation?: string;
    floorSection?: string;
    panelType?: string;
    equipmentConnection?: string;
    measurementPoint?: string;
    isInventory?: boolean;
    panelId?: string;
  }>> {
    const params = new URLSearchParams();
    if (facilityId && facilityId !== 'all') params.append('facilityId', facilityId);
    if (search) params.append('search', search);
    const res = await api.get(`/safety-management/electric-infrastructure/thermal/panels/suggestions?${params.toString()}`);
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  },

  // Pano Envanteri Listesi
  async getPanels(params: {
    facilityId: string;
    floor?: string;
    panelType?: string;
    search?: string;
  }): Promise<ThermalPanel[]> {
    const q = new URLSearchParams();
    if (params.facilityId && params.facilityId !== 'all') q.append('facilityId', params.facilityId);
    if (params.floor) q.append('floor', params.floor);
    if (params.panelType) q.append('panelType', params.panelType);
    if (params.search) q.append('search', params.search);
    const res = await api.get(`/safety-management/electric-infrastructure/thermal/panels?${q.toString()}`);
    if (!res.ok) throw new Error('Pano envanteri getirilemedi.');
    const json = await res.json();
    return json.data || [];
  },

  // Sıradaki Pano Kodu ve Sıra Numarası Önerisi
  async getNextPanelSequence(params: {
    facilityId: string;
    locationCode?: string;
    floorCode?: string;
    typeCode?: string;
  }): Promise<{
    nextSequence: number;
    formattedSequence: string;
    suggestedCode: string;
  }> {
    const q = new URLSearchParams();
    q.append('facilityId', params.facilityId);
    if (params.locationCode) q.append('locationCode', params.locationCode);
    if (params.floorCode) q.append('floorCode', params.floorCode);
    if (params.typeCode) q.append('typeCode', params.typeCode);
    const res = await api.get(`/safety-management/electric-infrastructure/thermal/panels/next-sequence?${q.toString()}`);
    if (!res.ok) throw new Error('Sıra numarası alınamadı.');
    return await res.json();
  },

  // Yeni Pano Ekle
  async createPanel(data: Partial<ThermalPanel>): Promise<ThermalPanel> {
    const res = await api.post('/safety-management/electric-infrastructure/thermal/panels', data);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Pano kaydedilemedi.');
    }
    const json = await res.json();
    return json.data;
  },

  // Pano Güncelle
  async updatePanel(id: string, data: Partial<ThermalPanel>): Promise<ThermalPanel> {
    const res = await api.put(`/safety-management/electric-infrastructure/thermal/panels/${id}`, data);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Pano güncellenemedi.');
    }
    const json = await res.json();
    return json.data;
  },

  // Pano Sil
  async deletePanel(id: string): Promise<void> {
    const res = await api.delete(`/safety-management/electric-infrastructure/thermal/panels/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Pano silinemedi.');
    }
  },

  // Excel Olarak Pano Envanterini İndir
  async exportPanelsExcel(facilityId?: string): Promise<{ blob: Blob; filename: string }> {
    const query = facilityId && facilityId !== 'all' ? `?facilityId=${encodeURIComponent(facilityId)}` : '?facilityId=all';
    const res = await api.get(`/safety-management/electric-infrastructure/thermal/panels/export${query}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Excel dosyası indirilemedi.');
    }
    const blob = await res.blob();
    const contentDisposition = res.headers.get('content-disposition');
    let filename = facilityId && facilityId !== 'all' ? 'Pano_Envanteri.xlsx' : 'Tum_Tesisler_Pano_Envanteri.xlsx';
    if (contentDisposition && contentDisposition.includes('filename=')) {
      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) filename = match[1].replace(/['"]/g, '');
    }
    return { blob, filename: decodeURIComponent(filename) };
  }
};

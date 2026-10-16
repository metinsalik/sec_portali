import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  type DashboardStatsResponse,
  type GroupDashboardStatsResponse,
  type FacilityOption,
  type ImprovementRecord,
  type CompactReportOverviewRow,
  type ImprovementOperationReportSummary,
  type TrashItem,
  ImprovementSheetType,
  type ImprovementPhoto,
} from '../types';

const API = import.meta.env.VITE_API_URL || '';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    Authorization: token ? `Bearer ${token}` : '',
  };
}

// ============================================================================
// QUERIES
// ============================================================================

export function useFacilitiesQuery() {
  return useQuery<FacilityOption[]>({
    queryKey: ['improvements', 'facilities'],
    queryFn: async () => {
      const res = await fetch(`${API}/api/operations/improvements/facilities`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Hastaneler yüklenemedi.');
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useDashboardStatsQuery(facilityId: string) {
  return useQuery<DashboardStatsResponse>({
    queryKey: ['improvements', 'dashboard-stats', facilityId],
    queryFn: async () => {
      const res = await fetch(
        `${API}/api/operations/improvements/dashboard-stats?facilityId=${facilityId}`,
        { headers: getAuthHeaders() }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Dashboard verileri alınamadı.');
      return data.data;
    },
  });
}

export function useGroupStatsQuery(group: string, facilityId: string) {
  return useQuery<GroupDashboardStatsResponse>({
    queryKey: ['improvements', 'group-stats', group, facilityId],
    queryFn: async () => {
      const res = await fetch(
        `${API}/api/operations/improvements/group-stats?group=${group}&facilityId=${facilityId}`,
        { headers: getAuthHeaders() }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Grup istatistikleri alınamadı.');
      return data.data;
    },
  });
}

export function useRecordsQuery(params: {
  facilityId?: string;
  moduleGroup?: string;
  sheetType?: string;
  riskScore?: string;
  status?: string;
  category?: string;
  reportId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery<{ records: ImprovementRecord[]; pagination: any }>({
    queryKey: ['improvements', 'records', params],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (params.facilityId) sp.set('facilityId', params.facilityId);
      if (params.moduleGroup) sp.set('moduleGroup', params.moduleGroup);
      if (params.sheetType) sp.set('sheetType', params.sheetType);
      if (params.riskScore) sp.set('riskScore', params.riskScore);
      if (params.status) sp.set('status', params.status);
      if (params.category) sp.set('category', params.category);
      if (params.reportId) sp.set('reportId', params.reportId);
      if (params.search) sp.set('search', params.search);
      if (params.page) sp.set('page', String(params.page));
      if (params.limit) sp.set('limit', String(params.limit));

      const res = await fetch(`${API}/api/operations/improvements/records?${sp.toString()}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Bulgular yüklenemedi.');
      return { records: data.data, pagination: data.pagination };
    },
  });
}

export function useCriticalRecordsQuery(params: {
  facilityId?: string;
  sheetType?: string;
  category?: string;
  status?: string;
}) {
  return useQuery<ImprovementRecord[]>({
    queryKey: ['improvements', 'critical', params],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (params.facilityId) sp.set('facilityId', params.facilityId);
      if (params.sheetType) sp.set('sheetType', params.sheetType);
      if (params.category) sp.set('category', params.category);
      if (params.status) sp.set('status', params.status);

      const res = await fetch(`${API}/api/operations/improvements/critical?${sp.toString()}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Kritik kalemler yüklenemedi.');
      return data.data;
    },
  });
}

export function useRecordDetailQuery(recordId: string | null) {
  return useQuery<ImprovementRecord>({
    queryKey: ['improvements', 'record-detail', recordId],
    queryFn: async () => {
      if (!recordId) throw new Error('ID belirtilmedi.');
      const res = await fetch(`${API}/api/operations/improvements/records/${recordId}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Bulgu detayı yüklenemedi.');
      return data.data;
    },
    enabled: !!recordId,
  });
}

export function useReportsOverviewQuery(sheetType: ImprovementSheetType, facilityId: string) {
  return useQuery<CompactReportOverviewRow[]>({
    queryKey: ['improvements', 'reports-overview', sheetType, facilityId],
    queryFn: async () => {
      const res = await fetch(
        `${API}/api/operations/improvements/reports/overview?sheetType=${sheetType}&facilityId=${facilityId}`,
        { headers: getAuthHeaders() }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Rapor özeti alınamadı.');
      return data.data;
    },
  });
}

export function useReportHistoryQuery(sheetType: ImprovementSheetType, facilityId: string | null) {
  return useQuery<ImprovementOperationReportSummary[]>({
    queryKey: ['improvements', 'report-history', sheetType, facilityId],
    queryFn: async () => {
      if (!facilityId) return [];
      const res = await fetch(
        `${API}/api/operations/improvements/reports/history?sheetType=${sheetType}&facilityId=${facilityId}`,
        { headers: getAuthHeaders() }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Rapor geçmişi alınamadı.');
      return data.data;
    },
    enabled: !!facilityId,
  });
}

export function useTrashQuery(facilityId?: string) {
  return useQuery<TrashItem[]>({
    queryKey: ['improvements', 'trash', facilityId],
    queryFn: async () => {
      const res = await fetch(
        `${API}/api/operations/improvements/trash?facilityId=${facilityId || 'ALL'}`,
        { headers: getAuthHeaders() }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Silinen kayıtlar alınamadı.');
      return data.data;
    },
  });
}

export function useCategoriesQuery() {
  return useQuery<string[]>({
    queryKey: ['improvements', 'categories'],
    queryFn: async () => {
      const res = await fetch(`${API}/api/operations/improvements/categories`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Kategoriler alınamadı.');
      return data.data;
    },
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

export function useImprovementMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['improvements'] });
  };

  // 1. Yeni Bulgu Ekle
  const createRecordMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`${API}/api/operations/improvements/records`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Bulgu kaydedilemedi.');
      return data.data;
    },
    onSuccess: () => {
      toast.success('Bulgu kaydedildi.');
      invalidateAll();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Hata oluştu.');
    },
  });

  // 2. Bulgu Güncelle
  const updateRecordMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await fetch(`${API}/api/operations/improvements/records/${id}`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Bulgu güncellenemedi.');
      return data.data;
    },
    onSuccess: () => {
      toast.success('Bulgu güncellendi.');
      invalidateAll();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Hata oluştu.');
    },
  });

  // 3. Bulgu Sil (Soft-delete & Undo Toast)
  const deleteRecordMutation = useMutation({
    mutationFn: async ({ id, deleteReason }: { id: string; deleteReason?: string }) => {
      const res = await fetch(`${API}/api/operations/improvements/records/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteReason }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Bulgu silinemedi.');
      return data.data;
    },
    onSuccess: (_data, variables) => {
      invalidateAll();
      toast((t) =>
        React.createElement(
          'span',
          { className: 'flex items-center gap-3 text-xs font-medium' },
          React.createElement('span', null, 'Kayıt silindi.'),
          React.createElement(
            'button',
            {
              onClick: async () => {
                toast.dismiss(t.id);
                await restoreTrashMutation.mutateAsync({ id: variables.id, type: 'RECORD' });
              },
              className: 'px-2 py-1 rounded bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90',
            },
            'Geri Al'
          )
        ),
        { duration: 6000 }
      );
    },
    onError: (err: any) => {
      toast.error(err.message || 'Hata oluştu.');
    },
  });

  // 4. Fotoğraf Yükle (Maks. 5 Fotoğraf)
  const uploadPhotosMutation = useMutation({
    mutationFn: async ({ recordId, files }: { recordId: string; files: File[] }) => {
      const formData = new FormData();
      files.forEach((file) => formData.append('photos', file));

      const res = await fetch(`${API}/api/operations/improvements/records/${recordId}/photos`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Fotoğraf yüklenemedi.');
      return data.data as ImprovementPhoto[];
    },
    onSuccess: () => {
      toast.success('Fotoğraflar başarıyla yüklendi.');
      invalidateAll();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Hata oluştu.');
    },
  });

  // 5. Fotoğraf Sil
  const deletePhotoMutation = useMutation({
    mutationFn: async ({ recordId, photoId }: { recordId: string; photoId: string }) => {
      const res = await fetch(
        `${API}/api/operations/improvements/records/${recordId}/photos/${photoId}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders(),
        }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Fotoğraf silinemedi.');
      return data.data as ImprovementPhoto[];
    },
    onSuccess: () => {
      toast.success('Fotoğraf silindi.');
      invalidateAll();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Hata oluştu.');
    },
  });

  // 6. Sihirbaz Rapor Kaydı (PK / Denetim)
  const createWizardReportMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`${API}/api/operations/improvements/reports/wizard`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Rapor kaydedilemedi.');
      return data.data;
    },
    onSuccess: () => {
      toast.success('Rapor ve bulgular başarıyla kaydedildi.');
      invalidateAll();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Hata oluştu.');
    },
  });

  // 7. Rapor Sil (Undo ile)
  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const res = await fetch(`${API}/api/operations/improvements/reports/${reportId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Rapor silinemedi.');
      return data;
    },
    onSuccess: (_data, reportId) => {
      invalidateAll();
      toast((t) =>
        React.createElement(
          'span',
          { className: 'flex items-center gap-3 text-xs font-medium' },
          React.createElement('span', null, 'Rapor silindi.'),
          React.createElement(
            'button',
            {
              onClick: async () => {
                toast.dismiss(t.id);
                await restoreTrashMutation.mutateAsync({ id: reportId, type: 'REPORT' });
              },
              className: 'px-2 py-1 rounded bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90',
            },
            'Geri Al'
          )
        ),
        { duration: 6000 }
      );
    },
    onError: (err: any) => {
      toast.error(err.message || 'Hata oluştu.');
    },
  });

  // 8. Yeni Aksiyon Ekle
  const createActionMutation = useMutation({
    mutationFn: async ({ recordId, payload }: { recordId: string; payload: any }) => {
      const res = await fetch(`${API}/api/operations/improvements/records/${recordId}/actions`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Aksiyon kaydedilemedi.');
      return data.data;
    },
    onSuccess: () => {
      toast.success('Aksiyon kaydedildi.');
      invalidateAll();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Hata oluştu.');
    },
  });

  // 9. Aksiyon Sil (Undo ile)
  const deleteActionMutation = useMutation({
    mutationFn: async (actionId: string) => {
      const res = await fetch(`${API}/api/operations/improvements/actions/${actionId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Aksiyon silinemedi.');
      return data;
    },
    onSuccess: (_data, actionId) => {
      invalidateAll();
      toast((t) =>
        React.createElement(
          'span',
          { className: 'flex items-center gap-3 text-xs font-medium' },
          React.createElement('span', null, 'Aksiyon silindi.'),
          React.createElement(
            'button',
            {
              onClick: async () => {
                toast.dismiss(t.id);
                await restoreTrashMutation.mutateAsync({ id: actionId, type: 'ACTION' });
              },
              className: 'px-2 py-1 rounded bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90',
            },
            'Geri Al'
          )
        ),
        { duration: 6000 }
      );
    },
    onError: (err: any) => {
      toast.error(err.message || 'Hata oluştu.');
    },
  });

  // 10. Çöp Kutusundan Geri Yükle (Restore)
  const restoreTrashMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: 'RECORD' | 'REPORT' | 'ACTION' }) => {
      const res = await fetch(`${API}/api/operations/improvements/restore`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Geri yüklenemedi.');
      return data;
    },
    onSuccess: () => {
      toast.success('Kayıt geri yüklendi.');
      invalidateAll();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Geri yükleme hatası.');
    },
  });

  return {
    createRecordMutation,
    updateRecordMutation,
    deleteRecordMutation,
    uploadPhotosMutation,
    deletePhotoMutation,
    createWizardReportMutation,
    deleteReportMutation,
    createActionMutation,
    deleteActionMutation,
    restoreTrashMutation,
  };
}

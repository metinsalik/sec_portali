
import api from '@/lib/api';

export const elevatorService = {
  getElevatorsByFacility: async (facilityId: string, filters?: { brand?: string; maintenanceCompany?: string; label?: string; type?: string; inspectionStatus?: string }) => {
    let url = `/safety-management/elevators/facility/${facilityId}`;
    if (filters) {
      const params = new URLSearchParams();
      if (filters.brand) params.append('brand', filters.brand);
      if (filters.maintenanceCompany) params.append('maintenanceCompany', filters.maintenanceCompany);
      if (filters.label) params.append('label', filters.label);
      if (filters.type) params.append('type', filters.type);
      if (filters.inspectionStatus) params.append('inspectionStatus', filters.inspectionStatus);
      const queryStr = params.toString();
      if (queryStr) url += `?${queryStr}`;
    }
    const res = await api.get(url);
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  },
  getElevatorById: async (id: string) => {
    const res = await api.get(`/safety-management/elevators/${id}`);
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  },
  createElevator: async (data: any) => {
    const res = await api.post('/safety-management/elevators', data);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create');
    }
    return res.json();
  },
  updateElevator: async (id: string, data: any) => {
    const res = await api.put(`/safety-management/elevators/${id}`, data);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update');
    }
    return res.json();
  },
  deleteElevator: async (id: string) => {
    const res = await api.delete(`/safety-management/elevators/${id}`);
    if (!res.ok) throw new Error('Failed to delete');
    return res.json();
  },
  addInspection: async (id: string, data: any) => {
    const res = await api.post(`/safety-management/elevators/${id}/inspections`, data);
    if (!res.ok) throw new Error('Failed to add inspection');
    return res.json();
  },
  uploadReport: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/safety-management/elevators/upload', formData);
    if (!res.ok) throw new Error('Failed to upload');
    return res.json();
  },
  downloadTemplate: async () => {
    const res = await api.get('/safety-management/elevators/import-template');
    if (!res.ok) throw new Error('Failed to download template');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'asansor_sablon.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
  importExcel: async (facilityId: string, file: File) => {
    const formData = new FormData();
    formData.append('facilityId', facilityId);
    formData.append('file', file);
    const res = await api.post('/safety-management/elevators/import', formData);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to import');
    }
    return res.json();
  }
};

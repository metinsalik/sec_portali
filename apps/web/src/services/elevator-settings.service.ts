import api from '@/lib/api';

export const elevatorSettingsService = {
  // Brands
  getBrands: async (facilityId?: string) => {
    const url = facilityId ? `/safety-management/elevator-settings/brands?facilityId=${facilityId}` : '/safety-management/elevator-settings/brands';
    const res = await api.get(url);
    return res.json();
  },
  addBrand: async (data: { facilityId: string; name: string }) => {
    const res = await api.post('/safety-management/elevator-settings/brands', data);
    return res.json();
  },
  toggleBrand: async (id: string, isActive: boolean) => {
    const res = await api.put(`/safety-management/elevator-settings/brands/${id}/toggle`, { isActive });
    return res.json();
  },
  deleteBrand: async (id: string) => {
    const res = await api.delete(`/safety-management/elevator-settings/brands/${id}`);
    return res.json();
  },

  // Maintenance Companies
  getMaintenanceCompanies: async (facilityId?: string) => {
    const url = facilityId ? `/safety-management/elevator-settings/maintenance-companies?facilityId=${facilityId}` : '/safety-management/elevator-settings/maintenance-companies';
    const res = await api.get(url);
    return res.json();
  },
  addMaintenanceCompany: async (data: { facilityId: string; name: string }) => {
    const res = await api.post('/safety-management/elevator-settings/maintenance-companies', data);
    return res.json();
  },
  toggleMaintenanceCompany: async (id: string, isActive: boolean) => {
    const res = await api.put(`/safety-management/elevator-settings/maintenance-companies/${id}/toggle`, { isActive });
    return res.json();
  },
  deleteMaintenanceCompany: async (id: string) => {
    const res = await api.delete(`/safety-management/elevator-settings/maintenance-companies/${id}`);
    return res.json();
  },

  // Types
  getTypes: async (facilityId?: string) => {
    const url = facilityId ? `/safety-management/elevator-settings/types?facilityId=${facilityId}` : '/safety-management/elevator-settings/types';
    const res = await api.get(url);
    return res.json();
  },
  addType: async (data: { facilityId: string; name: string }) => {
    const res = await api.post('/safety-management/elevator-settings/types', data);
    return res.json();
  },
  toggleType: async (id: string, isActive: boolean) => {
    const res = await api.put(`/safety-management/elevator-settings/types/${id}/toggle`, { isActive });
    return res.json();
  },
  deleteType: async (id: string) => {
    const res = await api.delete(`/safety-management/elevator-settings/types/${id}`);
    return res.json();
  },

  // Statuses
  getStatuses: async (facilityId?: string) => {
    const url = facilityId ? `/safety-management/elevator-settings/statuses?facilityId=${facilityId}` : '/safety-management/elevator-settings/statuses';
    const res = await api.get(url);
    return res.json();
  },
  addStatus: async (data: { facilityId: string; name: string }) => {
    const res = await api.post('/safety-management/elevator-settings/statuses', data);
    return res.json();
  },
  toggleStatus: async (id: string, isActive: boolean) => {
    const res = await api.put(`/safety-management/elevator-settings/statuses/${id}/toggle`, { isActive });
    return res.json();
  },
  deleteStatus: async (id: string) => {
    const res = await api.delete(`/safety-management/elevator-settings/statuses/${id}`);
    return res.json();
  },

  // Labels
  getLabels: async (facilityId?: string) => {
    const url = facilityId ? `/safety-management/elevator-settings/labels?facilityId=${facilityId}` : '/safety-management/elevator-settings/labels';
    const res = await api.get(url);
    return res.json();
  },
  addLabel: async (data: { facilityId: string; name: string; color?: string }) => {
    const res = await api.post('/safety-management/elevator-settings/labels', data);
    return res.json();
  },
  toggleLabel: async (id: string, isActive: boolean) => {
    const res = await api.put(`/safety-management/elevator-settings/labels/${id}/toggle`, { isActive });
    return res.json();
  },
  deleteLabel: async (id: string) => {
    const res = await api.delete(`/safety-management/elevator-settings/labels/${id}`);
    return res.json();
  }
};

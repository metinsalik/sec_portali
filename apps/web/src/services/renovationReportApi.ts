import api from '@/lib/api';
import type { RenovationReport, RenovationReportInput } from '@/types/renovationReport';

export const getRenovationReports = async (facilityId: string): Promise<RenovationReport[]> => {
  const res = await api.get(`/renovation-reports?facilityId=${facilityId}`);
  if (!res.ok) throw new Error('Raporlar alınamadı');
  return res.json();
};

export const getRenovationReport = async (id: string): Promise<RenovationReport> => {
  const res = await api.get(`/renovation-reports/${id}`);
  if (!res.ok) throw new Error('Rapor alınamadı');
  return res.json();
};

export const createRenovationReport = async (reportData: RenovationReportInput): Promise<RenovationReport> => {
  const res = await api.post('/renovation-reports', reportData);
  if (!res.ok) throw new Error('Rapor oluşturulamadı');
  return res.json();
};

export const updateRenovationReport = async (id: string, reportData: Partial<RenovationReportInput>): Promise<RenovationReport> => {
  const res = await api.put(`/renovation-reports/${id}`, reportData);
  if (!res.ok) throw new Error('Rapor güncellenemedi');
  return res.json();
};

export const deleteRenovationReport = async (id: string): Promise<void> => {
  const res = await api.delete(`/renovation-reports/${id}`);
  if (!res.ok) throw new Error('Rapor silinemedi');
};

export const uploadRenovationImages = async (files: File[]): Promise<string[]> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });
  
  // Use customFetch to allow browser to automatically set Content-Type with the proper boundary
  const res = await api.customFetch('/renovation-reports/upload', {
    method: 'POST',
    body: formData,
  });
  
  if (!res.ok) throw new Error('Fotoğraflar yüklenemedi');
  const data = await res.json();
  return data.urls;
};

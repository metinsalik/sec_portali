import api from '../../../lib/api';
import { type Audit, normalizeRiskLevel } from '../types';
import { compressImageToWebP } from '../../operations/improvements/ImprovementMediaManager';



const transformAudit = (backendAudit: any): Audit => {
  if (!backendAudit) return backendAudit;
  
  // Transform the flat backend IntegratedAudit to the frontend Audit shape
  return {
    id: backendAudit.id,
    status: backendAudit.status,
    saved: backendAudit.saved,
    meta: {
      locationId: backendAudit.facilityId,
      round: backendAudit.round,
      start: backendAudit.startDate ? backendAudit.startDate.split('T')[0] : '',
      end: backendAudit.endDate ? backendAudit.endDate.split('T')[0] : '',
      reportDate: backendAudit.reportDate ? backendAudit.reportDate.split('T')[0] : '',
      reportNo: backendAudit.reportNo,
      reporter: backendAudit.reporter,
      auditStatus: backendAudit.auditStatus,
      purpose: backendAudit.purpose,
      criteria: backendAudit.criteria || [],
      participants: backendAudit.participants || [],
      team: backendAudit.team || [],
      executiveSummary: backendAudit.executive,
      generalConclusion: backendAudit.conclusion,
    },
    findings: (backendAudit.findings || []).map((f: any) => ({
      id: f.id,
      no: f.no,
      area: f.area,
      subarea: f.subarea,
      category: f.category,
      subcategory: f.subcategory,
      risk: normalizeRiskLevel(f.risk),
      targetDate: f.targetDate ? f.targetDate.split('T')[0] : '',
      isStarted: f.isStarted,
      residualRisk: f.residualRisk,
      riskReasoning: f.riskReasoning,
      findingDesc: f.findingDesc,
      riskDesc: f.riskDesc,
      recommendation: f.recommendation,
      status: f.status,
      history: f.history,
      departments: f.departments || [],
      files: f.files || [],
      steps: (f.actions || []).map((a: any) => ({
        id: a.id,
        department: a.department,
        order: a.order,
        status: a.status,
        actionDate: a.actionDate ? a.actionDate.split('T')[0] : '',
        title: a.title,
        explanation: a.explanation,
        completedAt: a.completedAt ? a.completedAt.split('T')[0] : '',
        files: a.files || []
      }))
    }))
  };
};

export const fetchAudits = async (facilityId?: string) => {
  const url = facilityId ? `/renovation-reports?facilityId=${facilityId}` : '/renovation-reports';
  const response = await api.get(url);
  if (!response.ok) throw new Error('Failed to fetch audits');
  const data = await response.json();
  return Array.isArray(data) ? data.map(transformAudit) : [];
};

export const saveAudit = async (audit: Audit, facilityId: string) => {
  const payload = {
    ...audit,
    facilityId,
    meta: {
      ...audit.meta,
      executive: audit.meta.executiveSummary || '',
      conclusion: audit.meta.generalConclusion || ''
    }
  };
  const response = await api.post(`/renovation-reports/save`, payload);
  if (!response.ok) throw new Error('Failed to save audit');
  const data = await response.json();
  return transformAudit(data);
};

export const uploadAuditFiles = async (
  files: File[],
  facilityId?: string,
  facilityName?: string
) => {
  const processedFiles: File[] = [];
  for (const f of files) {
    if (f.type.startsWith('image/')) {
      try {
        processedFiles.push(await compressImageToWebP(f));
      } catch {
        processedFiles.push(f);
      }
    } else {
      processedFiles.push(f);
    }
  }

  const formData = new FormData();
  processedFiles.forEach((file) => {
    formData.append('files', file);
  });

  const params = new URLSearchParams();
  if (facilityId) params.set('facilityId', facilityId);
  if (facilityName) params.set('facilityName', facilityName);
  const qs = params.toString() ? `?${params.toString()}` : '';

  const response = await api.post(`/renovation-reports/upload${qs}`, formData);
  if (!response.ok) throw new Error('Dosya yüklenemedi');
  return response.json(); // Array of { name, url, type, size }
};

export const deleteAudit = async (auditId: string) => {
  const response = await api.delete(`/renovation-reports/${auditId}`);
  if (!response.ok) throw new Error('Failed to delete audit');
  return response.json();
};
export const fetchRenovationSettings = async () => {
  const response = await api.get('/renovation-reports/settings');
  if (!response.ok) throw new Error('Failed to fetch renovation settings');
  return response.json();
};

export const saveRenovationSettings = async (settings: any) => {
  const response = await api.post('/renovation-reports/settings', settings);
  if (!response.ok) throw new Error('Failed to save renovation settings');
  return response.json();
};

// ── DENETİM HAVUZU (BULGU ŞABLON KÜTÜPHANESİ) ──
export const fetchFindingPool = async (params?: {
  q?: string;
  category?: string;
  risk?: string;
  tag?: string;
  includeInactive?: boolean;
}) => {
  const qs = new URLSearchParams();
  if (params?.q) qs.set('q', params.q);
  if (params?.category && params.category !== 'ALL') qs.set('category', params.category);
  if (params?.risk && params.risk !== 'ALL') qs.set('risk', params.risk);
  if (params?.tag && params.tag !== 'ALL') qs.set('tag', params.tag);
  if (params?.includeInactive) qs.set('includeInactive', 'true');
  const queryStr = qs.toString();
  const response = await api.get(`/renovation-reports/pool${queryStr ? `?${queryStr}` : ''}`);
  if (!response.ok) throw new Error('Denetim havuzu alınamadı');
  return response.json();
};

export const checkSimilarPoolTemplates = async (payload: {
  title?: string;
  findingDesc?: string;
  category?: string;
}) => {
  const response = await api.post('/renovation-reports/pool/check-similar', payload);
  if (!response.ok) return [];
  return response.json();
};

export const createPoolTemplate = async (payload: any) => {
  const response = await api.post('/renovation-reports/pool', payload);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Şablon kaydedilemedi');
  }
  return response.json();
};

export const updatePoolTemplate = async (id: string, payload: any) => {
  const response = await api.put(`/renovation-reports/pool/${id}`, payload);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Şablon güncellenemedi');
  }
  return response.json();
};

export const incrementPoolTemplateUsage = async (id: string) => {
  const response = await api.post(`/renovation-reports/pool/${id}/use`, {});
  if (!response.ok) return null;
  return response.json();
};

export const mergePoolTemplates = async (targetId: string, sourceIds: string[]) => {
  const response = await api.post('/renovation-reports/pool/merge', { targetId, sourceIds });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Şablonlar birleştirilemedi');
  }
  return response.json();
};

export const deletePoolTemplate = async (id: string) => {
  const response = await api.delete(`/renovation-reports/pool/${id}`);
  if (!response.ok) throw new Error('Şablon silinemedi');
  return response.json();
};

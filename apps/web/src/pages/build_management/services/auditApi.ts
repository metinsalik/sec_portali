import api from '../../../lib/api';
import type { Audit } from '../types';



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
      risk: f.risk,
      targetDate: f.targetDate ? f.targetDate.split('T')[0] : '',
      isStarted: f.isStarted,
      residualRisk: f.residualRisk,
      riskReasoning: f.riskReasoning,
      findingDesc: f.findingDesc,
      riskDesc: f.riskDesc,
      recommendation: f.recommendation,
      status: f.status,
      history: f.history,
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

export const uploadAuditFiles = async (files: File[]) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });
  const response = await api.post(`/renovation-reports/upload`, formData);
  if (!response.ok) throw new Error('Failed to upload files');
  return response.json(); // Array of { name, url, type, size }
};

export const deleteAudit = async (auditId: string) => {
  const response = await api.delete(`/renovation-reports/${auditId}`);
  if (!response.ok) throw new Error('Failed to delete audit');
  return response.json();
};

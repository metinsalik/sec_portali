const fs = require('fs');

const transformLogic = `
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
      criteria: [], // Prisma doesn't have criteria array directly right now, or we didn't add it
      executive: backendAudit.executive,
      conclusion: backendAudit.conclusion,
    } as any,
    team: backendAudit.team || [],
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

export const fetchAudits = async (facilityId: string) => {
  const response = await api.get(\`/renovation-reports?facilityId=\${facilityId}\`);
  if (!response.ok) throw new Error('Failed to fetch audits');
  const data = await response.json();
  return Array.isArray(data) ? data.map(transformAudit) : [];
};

export const saveAudit = async (audit: Audit, facilityId: string) => {
  const response = await api.post(\`/renovation-reports/save\`, {
    ...audit,
    facilityId
  });
  if (!response.ok) throw new Error('Failed to save audit');
  const data = await response.json();
  return transformAudit(data);
};
`;

let content = fs.readFileSync('apps/web/src/pages/build_management/services/auditApi.ts', 'utf8');

// Replace fetchAudits and saveAudit with the transformed versions
content = content.replace(
  /export const fetchAudits = async \([\s\S]*?return response\.json\(\);\n\};\n/g,
  ''
);

content = content.replace(
  /export const saveAudit = async \([\s\S]*?return response\.json\(\);\n\};\n/g,
  transformLogic
);

fs.writeFileSync('apps/web/src/pages/build_management/services/auditApi.ts', content);

const fs = require('fs');

// Patch types.ts
let types = fs.readFileSync('apps/web/src/pages/build_management/types.ts', 'utf8');
types = types.replace('executive: string;', 'executiveSummary?: string;\n  generalConclusion?: string;');
types = types.replace('conclusion: string;', '');
fs.writeFileSync('apps/web/src/pages/build_management/types.ts', types);

// Patch auditApi.ts
let apiStr = fs.readFileSync('apps/web/src/pages/build_management/services/auditApi.ts', 'utf8');
const oldTransform = `      criteria: backendAudit.criteria || [],
      participants: backendAudit.participants || [],
      team: backendAudit.team || [],
      executive: backendAudit.executive,
      conclusion: backendAudit.conclusion,`;
const newTransform = `      criteria: backendAudit.criteria || [],
      participants: backendAudit.participants || [],
      team: backendAudit.team || [],
      executiveSummary: backendAudit.executive,
      generalConclusion: backendAudit.conclusion,`;
apiStr = apiStr.replace(oldTransform, newTransform);

const oldSave = `export const saveAudit = async (audit: Audit, facilityId: string) => {
  const response = await api.post(\`/renovation-reports/save\`, {
    ...audit,
    facilityId
  });`;
const newSave = `export const saveAudit = async (audit: Audit, facilityId: string) => {
  const payload = {
    ...audit,
    facilityId,
    meta: {
      ...audit.meta,
      executive: audit.meta.executiveSummary || '',
      conclusion: audit.meta.generalConclusion || ''
    }
  };
  const response = await api.post(\`/renovation-reports/save\`, payload);`;
apiStr = apiStr.replace(oldSave, newSave);

fs.writeFileSync('apps/web/src/pages/build_management/services/auditApi.ts', apiStr);

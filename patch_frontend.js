const fs = require('fs');
let content = fs.readFileSync('apps/web/src/pages/build_management/services/auditApi.ts', 'utf8');

const oldTransform = `    meta: {
      locationId: backendAudit.facilityId,
      round: backendAudit.round,
      start: backendAudit.startDate,
      end: backendAudit.endDate,
      reportDate: backendAudit.reportDate,
      reportNo: backendAudit.reportNo,
      reporter: backendAudit.reporter,
      auditStatus: backendAudit.auditStatus,
      purpose: backendAudit.purpose,
      criteria: [], // Prisma doesn't have criteria array directly right now, or we didn't add it
      executive: backendAudit.executive,
      conclusion: backendAudit.conclusion,
    } as any,
    team: backendAudit.team || [],`;

const newTransform = `    meta: {
      locationId: backendAudit.facilityId,
      round: backendAudit.round,
      start: backendAudit.startDate,
      end: backendAudit.endDate,
      reportDate: backendAudit.reportDate,
      reportNo: backendAudit.reportNo,
      reporter: backendAudit.reporter,
      auditStatus: backendAudit.auditStatus,
      purpose: backendAudit.purpose,
      criteria: backendAudit.criteria || [],
      participants: backendAudit.participants || [],
      team: backendAudit.team || [],
      executive: backendAudit.executive,
      conclusion: backendAudit.conclusion,
    },`;

content = content.replace(oldTransform, newTransform);
fs.writeFileSync('apps/web/src/pages/build_management/services/auditApi.ts', content);

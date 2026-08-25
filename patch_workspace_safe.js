const fs = require('fs');
let content = fs.readFileSync('apps/web/src/pages/build_management/views/AuditWorkspace.tsx', 'utf8');

content = content.replace(
  "if (a.meta.locationId === auditMeta.locationId && a.status === 'PUBLISHED') {",
  "if (a.meta?.locationId === auditMeta.locationId && a.status === 'PUBLISHED') {"
);

fs.writeFileSync('apps/web/src/pages/build_management/views/AuditWorkspace.tsx', content);

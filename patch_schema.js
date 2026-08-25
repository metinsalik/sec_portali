const fs = require('fs');

let schema = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

// Remove IntegratedAuditTeam model
schema = schema.replace(/model IntegratedAuditTeam \{[\s\S]*?\}/g, '');

// Replace relation with scalar array in IntegratedAudit
schema = schema.replace('team         IntegratedAuditTeam[]', 'team         String[]\n  participants String[]\n  criteria     String[]');

fs.writeFileSync('backend/prisma/schema.prisma', schema);

const fs = require('fs');

let content = fs.readFileSync('backend/src/routes/renovation_report.ts', 'utf8');

const oldTeamCreation = `      // 1. Create Team
      if (team && team.length > 0) {
        await tx.integratedAuditTeam.createMany({
          data: team.map((t: any) => ({
            auditId,
            type: t.type,
            name: t.name,
            title: t.title,
            department: t.department
          }))
        });
      }`;

content = content.replace(oldTeamCreation, '');
fs.writeFileSync('backend/src/routes/renovation_report.ts', content);

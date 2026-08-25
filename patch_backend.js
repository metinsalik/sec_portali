const fs = require('fs');

let content = fs.readFileSync('backend/src/routes/renovation_report.ts', 'utf8');

const oldAuditData = `        auditStatus: meta.auditStatus || 'Devam Ediyor',
        purpose: meta.purpose || '',
        executive: meta.executive || '',
        conclusion: meta.conclusion || ''
      };`;

const newAuditData = `        auditStatus: meta.auditStatus || 'Devam Ediyor',
        purpose: meta.purpose || '',
        executive: meta.executive || '',
        conclusion: meta.conclusion || '',
        team: meta.team || [],
        participants: meta.participants || [],
        criteria: meta.criteria || []
      };`;

content = content.replace(oldAuditData, newAuditData);

// Remove the Team creation logic
const oldTeamCreation = `      // 1. Create Team
      if (meta.team && meta.team.length > 0) {
        await tx.integratedAuditTeam.createMany({
          data: meta.team.map((member: any) => ({
            auditId,
            type: member.type || '',
            name: member.name || '',
            title: member.title || '',
            department: member.department || ''
          }))
        });
      }`;

content = content.replace(oldTeamCreation, '');

// Remove the Team deletion logic
const oldTeamDeletion = `await tx.integratedAuditTeam.deleteMany({ where: { auditId } });`;
content = content.replace(oldTeamDeletion, '');

// Remove include team
content = content.replace(/team: true,/g, '');

fs.writeFileSync('backend/src/routes/renovation_report.ts', content);

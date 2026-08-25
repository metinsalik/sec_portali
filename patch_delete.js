const fs = require('fs');

let apiContent = fs.readFileSync('apps/web/src/pages/build_management/services/auditApi.ts', 'utf8');
apiContent += `\nexport const deleteAudit = async (auditId: string) => {\n  const response = await api.delete(\`/renovation-reports/\${auditId}\`);\n  if (!response.ok) throw new Error('Failed to delete audit');\n  return response.json();\n};\n`;
fs.writeFileSync('apps/web/src/pages/build_management/services/auditApi.ts', apiContent);

let consoleContent = fs.readFileSync('apps/web/src/pages/build_management/views/LocationConsole.tsx', 'utf8');

// Replace the delete logic
const oldDeleteLogic = `                            onConfirm: () => {
                              setAudits(audits.filter(a => a.id !== audit.id));
                            }`;

const newDeleteLogic = `                            onConfirm: async () => {
                              try {
                                if (!audit.id.startsWith('draft_')) {
                                  // Requires actual API call
                                  const { deleteAudit } = await import('../services/auditApi');
                                  await deleteAudit(audit.id);
                                }
                                setAudits(audits.filter(a => a.id !== audit.id));
                              } catch (err) {
                                console.error("Silme hatası", err);
                                alert("Rapor silinemedi.");
                              }
                            }`;

consoleContent = consoleContent.replace(oldDeleteLogic, newDeleteLogic);
fs.writeFileSync('apps/web/src/pages/build_management/views/LocationConsole.tsx', consoleContent);

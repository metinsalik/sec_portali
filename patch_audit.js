const fs = require('fs');
let content = fs.readFileSync('apps/web/src/pages/build_management/views/AuditWorkspace.tsx', 'utf8');

content = content.replace(
  "import ReportTemplate from './ReportTemplate';",
  "import ReportTemplate from './ReportTemplate';\nimport { saveAudit, uploadAuditFiles } from '../services/auditApi';"
);

const saveFunc = `  const handleSave = async (publish: boolean = false) => {
    let newAuditStatus = auditMeta.auditStatus;
    if (publish) {
      const allFindingsCompleted = findings.length > 0 && findings.every(f => f.status === 'Tamamlanan' || f.status === 'İyileştirilmeyen');
      newAuditStatus = allFindingsCompleted ? 'Tamamlandı' : 'Takipte';
    }

    const audit = {
      id: activeAuditId || undefined,
      status: publish ? 'PUBLISHED' : 'DRAFT',
      saved: true,
      meta: { ...auditMeta, auditStatus: newAuditStatus },
      findings
    };

    try {
      const savedAudit = await saveAudit(audit as any, auditMeta.locationId);
      
      let updatedAudits = audits.filter(a => a.id !== activeAuditId);
      
      // If we are publishing, check if we need to close previous ones
      if (publish && auditMeta.locationId) {
        updatedAudits = updatedAudits.map(a => {
          if (a.meta.locationId === auditMeta.locationId && a.status === 'PUBLISHED') {
            return { ...a, meta: { ...a.meta, auditStatus: 'Tamamlandı' } };
          }
          return a;
        });
      }
      
      setAudits([...updatedAudits, savedAudit]);
      setActiveAuditId(null);
      
      if ((window as any)._irsc_selectedFacilityId) {
        setCurrentView('CONSOLE');
      } else {
        setCurrentView('TRACKING');
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Rapor kaydedilirken hata oluştu!");
    }
  };`;

// Replace handleSave
content = content.replace(
  /  const handleSave = \(publish: boolean = false\) => \{[\s\S]*?setActiveAuditId\(null\);\n    if \(\(window as any\)\._irsc_selectedFacilityId\) \{\n      setCurrentView\('CONSOLE'\);\n    \} else \{\n      setCurrentView\('TRACKING'\);\n    \}\n  \};/,
  saveFunc
);

// Replace Action File Upload
content = content.replace(
  /onChange=\{e => \{\n                                            if \(e\.target\.files\) \{\n                                              const selectedFiles = Array\.from\(e\.target\.files\)\.map\(f => \(\{\n                                                name: f\.name,\n                                                url: URL\.createObjectURL\(f\),\n                                                type: f\.type\n                                              \}\)\);\n                                              setNewAction\(\{\.\.\.newAction, files: \[\.\.\.\(newAction\.files \|\| \[\]\), \.\.\.selectedFiles\]\}\);\n                                            \}\n                                          \}\}/g,
  `onChange={async e => {
                                            if (e.target.files) {
                                              try {
                                                const uploaded = await uploadAuditFiles(Array.from(e.target.files));
                                                setNewAction({...newAction, files: [...(newAction.files || []), ...uploaded]});
                                              } catch (err) {
                                                console.error("Upload failed", err);
                                                alert("Dosya yüklenemedi!");
                                              }
                                            }
                                          }}`
);

// Replace Finding File Upload
content = content.replace(
  /onChange=\{e => \{\n                                if \(e\.target\.files\) \{\n                                  const newFiles = Array\.from\(e\.target\.files\)\.map\(f => \(\{\n                                    name: f\.name,\n                                    url: URL\.createObjectURL\(f\),\n                                    type: f\.type\n                                  \}\)\);\n                                  setNewFinding\(\{\.\.\.newFinding, files: \[\.\.\.\(newFinding\.files \|\| \[\]\), \.\.\.newFiles\]\}\);\n                                \}\n                              \}\}/g,
  `onChange={async e => {
                                if (e.target.files) {
                                  try {
                                    const uploaded = await uploadAuditFiles(Array.from(e.target.files));
                                    setNewFinding({...newFinding, files: [...(newFinding.files || []), ...uploaded]});
                                  } catch (err) {
                                    console.error("Upload failed", err);
                                    alert("Dosya yüklenemedi!");
                                  }
                                }
                              }}`
);


fs.writeFileSync('apps/web/src/pages/build_management/views/AuditWorkspace.tsx', content);

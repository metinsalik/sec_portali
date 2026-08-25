const fs = require('fs');
let content = fs.readFileSync('apps/web/src/pages/build_management/views/AuditWorkspace.tsx', 'utf8');

// 1. Fix the showActionForm logic to activeActionFormId (string | null)
content = content.replace(
  'const [showActionForm, setShowActionForm] = useState(false);',
  'const [activeActionFormId, setActiveActionFormId] = useState<string | null>(null);'
);

content = content.replace(
  'onClick={() => setShowActionForm(!showActionForm)}',
  'onClick={() => setActiveActionFormId(activeActionFormId === f.id ? null : f.id)}'
);

content = content.replace(
  '{showActionForm ? <X size={16} /> : <Plus size={16} />}',
  '{activeActionFormId === f.id ? <X size={16} /> : <Plus size={16} />}'
);

content = content.replace(
  "{showActionForm ? 'Vazgeç' : 'Aksiyon / Güncelleme Ekle'}",
  "{activeActionFormId === f.id ? 'Vazgeç' : 'Aksiyon / Güncelleme Ekle'}"
);

content = content.replace(
  '{showActionForm && (',
  '{activeActionFormId === f.id && ('
);

content = content.replace(
  'setShowActionForm(false);',
  'setActiveActionFormId(null);'
);

// 2. Fix handleSave using regex
const handleSaveRegex = /const handleSave = \(publish = false\) => \{[\s\S]*?setActiveAuditId\(null\);\n    if \(\(window as any\)\._irsc_selectedFacilityId\) \{\n      setCurrentView\('CONSOLE'\);\n    \} else \{\n      setCurrentView\('TRACKING'\);\n    \}\n  \};/;

const newHandleSave = `const handleSave = async (publish = false) => {
    if (!auditMeta.locationId) {
      setAlertMsg("Lütfen önce tesis seçin.");
      return;
    }
    
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

if (handleSaveRegex.test(content)) {
  content = content.replace(handleSaveRegex, newHandleSave);
  fs.writeFileSync('apps/web/src/pages/build_management/views/AuditWorkspace.tsx', content);
  console.log("Successfully patched AuditWorkspace.tsx");
} else {
  console.log("Failed to find handleSave using regex!");
}

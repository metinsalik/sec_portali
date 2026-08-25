const fs = require('fs');
let content = fs.readFileSync('apps/web/src/pages/build_management/views/AuditWorkspace.tsx', 'utf8');

const oldEditSave = `    if (activeFindingId && activeFindingForm === 'EDIT') {
      setFindings(findings.map(f => f.id === activeFindingId ? {
        ...f,
        risk: newFinding.risk as RiskLevel,
        category: newFinding.category || '',
        subcategory: newFinding.subcategory || '',
        findingDesc: newFinding.findingDesc || '',
        recommendation: newFinding.recommendation || '',
        area: newFinding.area || '',
        subarea: newFinding.subarea || '',
        targetDate: newFinding.targetDate || '',
        files: newFinding.files || [],
        // steps is left untouched during edit; we only edit it via handleAddAction
      } : f));`;

const newEditSave = `    if (activeFindingId && activeFindingForm === 'EDIT') {
      setFindings(findings.map(f => {
        if (f.id === activeFindingId) {
          const currentDepts = f.steps?.map(s => s.department) || [];
          const newDepts = selectedDepartments.filter(d => !currentDepts.includes(d));
          const newSteps = newDepts.map((dep, idx) => ({
            id: 'step_' + Date.now().toString() + '_' + idx,
            department: dep,
            order: (f.steps?.length || 0) + idx + 1,
            status: 'Başlamadı' as const,
            actionDate: '',
            files: []
          }));
          return {
            ...f,
            risk: newFinding.risk as RiskLevel,
            category: newFinding.category || '',
            subcategory: newFinding.subcategory || '',
            findingDesc: newFinding.findingDesc || '',
            recommendation: newFinding.recommendation || '',
            area: newFinding.area || '',
            subarea: newFinding.subarea || '',
            targetDate: newFinding.targetDate || '',
            files: newFinding.files || [],
            steps: [...(f.steps || []), ...newSteps]
          };
        }
        return f;
      }));`;

content = content.replace(oldEditSave, newEditSave);
fs.writeFileSync('apps/web/src/pages/build_management/views/AuditWorkspace.tsx', content);

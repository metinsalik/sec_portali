const fs = require('fs');
let content = fs.readFileSync('apps/web/src/pages/build_management/views/AuditWorkspace.tsx', 'utf8');

// Restore auto-generation of steps in handleSaveFinding
const oldHandleSaveFinding = `  const handleSaveFinding = () => {
    // We no longer auto-generate steps from selectedDepartments
    // Steps are now added via the new Action History UI
    
    if (activeFindingId && activeFindingForm === 'EDIT') {`;

const newHandleSaveFinding = `  const handleSaveFinding = () => {
    if (activeFindingId && activeFindingForm === 'EDIT') {`;

content = content.replace(oldHandleSaveFinding, newHandleSaveFinding);

// For new finding, inject the generated steps
const oldNewFinding = `      const completeFinding: Finding = {
        ...newFinding,
        id: 'temp_' + Date.now().toString(),
        status: 'Açık',
        no: fNo,
        history: null,
        risk: newFinding.risk as RiskLevel,
        category: newFinding.category || '',
        subcategory: newFinding.subcategory || '',
        findingDesc: newFinding.findingDesc || '',
        riskDesc: newFinding.riskDesc || '',
        recommendation: newFinding.recommendation || '',
        area: newFinding.area || '',
        subarea: newFinding.subarea || '',
        targetDate: newFinding.targetDate || calculateTargetDate(newFinding.risk as RiskLevel, auditMeta.reportDate),
        files: newFinding.files || [],
        steps: []
      };`;

const newNewFinding = `      const completeFinding: Finding = {
        ...newFinding,
        id: 'temp_' + Date.now().toString(),
        status: 'Açık',
        no: fNo,
        history: null,
        risk: newFinding.risk as RiskLevel,
        category: newFinding.category || '',
        subcategory: newFinding.subcategory || '',
        findingDesc: newFinding.findingDesc || '',
        riskDesc: newFinding.riskDesc || '',
        recommendation: newFinding.recommendation || '',
        area: newFinding.area || '',
        subarea: newFinding.subarea || '',
        targetDate: newFinding.targetDate || calculateTargetDate(newFinding.risk as RiskLevel, auditMeta.reportDate),
        files: newFinding.files || [],
        steps: selectedDepartments.map((dep, idx) => ({
          id: 'step_' + Date.now().toString() + '_' + idx,
          department: dep,
          order: idx + 1,
          status: 'Başlamadı' as const,
          actionDate: '',
          files: []
        }))
      };`;

content = content.replace(oldNewFinding, newNewFinding);

// Add the checkboxes UI
const riskLevelSection = `{/* Finne Kinney Risk Seviyesi */}`;

const checkboxSection = `
                        {/* İlgili Birim / Departmanlar */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2 dark:text-slate-300">İlgili Birim / Departmanlar (Çoklu Seçim)</label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {departments.map(d => (
                              <label key={d.id} className={\`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors \${selectedDepartments.includes(d.name) ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800' : 'bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-700'}\`}>
                                <input 
                                  type="checkbox" 
                                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" 
                                  checked={selectedDepartments.includes(d.name)}
                                  onChange={() => toggleDepartment(d.name)}
                                />
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{d.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Finne Kinney Risk Seviyesi */}`;

content = content.replace(riskLevelSection, checkboxSection);

fs.writeFileSync('apps/web/src/pages/build_management/views/AuditWorkspace.tsx', content);

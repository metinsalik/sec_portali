const fs = require('fs');
const { jsx } = require('./frontend/src/pages/risks/RiskViewLayoutSnippet.ts');

const content = fs.readFileSync('./frontend/src/pages/risks/RiskViewPage.tsx', 'utf8');

const startIndex = content.indexOf('<section className="space-y-4">\n            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">\n              <Activity className="w-4 h-4" /> 1. Genel Bilgiler');
const endIndexStr = '        </div>\n\n        {/* Sağ Kolon - Yaşam Döngüsü (Audit Logs) */}';
const endIndex = content.indexOf(endIndexStr);

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find start or end index.");
    process.exit(1);
}

const before = content.substring(0, startIndex);
const after = content.substring(endIndex);

const newContent = before + jsx + after;
fs.writeFileSync('./frontend/src/pages/risks/RiskViewPage.tsx', newContent);
console.log("Replaced view layout successfully.");

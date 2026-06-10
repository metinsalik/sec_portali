const fs = require('fs');
const { jsx } = require('./frontend/src/pages/risks/RiskFormLayoutSnippet.ts');

const content = fs.readFileSync('./frontend/src/pages/risks/RiskFormPage.tsx', 'utf8');

const startIndex = content.indexOf('<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">');
const endIndexStr = '      </div>\n    </div>\n  );\n}';
const endIndex = content.lastIndexOf('</div>\n    </div>\n  );\n}');

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find start or end index.");
    process.exit(1);
}

const before = content.substring(0, startIndex);
const after = content.substring(endIndex + 6); // Keep `    </div>\n  );\n}`

const newContent = before + jsx + after;
fs.writeFileSync('./frontend/src/pages/risks/RiskFormPage.tsx', newContent);
console.log("Replaced layout successfully.");

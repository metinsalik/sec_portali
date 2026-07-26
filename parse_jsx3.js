const fs = require('fs');
const content = fs.readFileSync('apps/web/src/components/panel/assignments/QuickAssignModal.tsx', 'utf8');

let divCount = 0;
let lineNum = 1;
for (let i = 0; i < content.length; i++) {
  if (content[i] === '\n') lineNum++;
  if (content.substr(i, 4) === '<div') { divCount++; }
  if (content.substr(i, 5) === '</div') { divCount--; }
  if (lineNum === 188 && content[i] === '\n') {
    console.log('Count at line 188:', divCount);
  }
}

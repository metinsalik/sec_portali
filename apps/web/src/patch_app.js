const fs = require('fs');
const content = fs.readFileSync('/Users/metinsalik/Desktop/Projelerim/sec_portali/apps/web/src/App.tsx', 'utf8');

let newContent = content.replace(
  /<AuthProvider>\s*<ChatProvider>\s*<TooltipProvider>\s*<Router>/,
  '<AuthProvider>\n          <ChatProvider>\n          <TooltipProvider>\n            <Router>'
);

newContent = newContent.replace(
  /<\/TooltipProvider>\s*<\/ChatProvider>\s*<\/AuthProvider>\s*<\/ThemeProvider>\s*<Toaster \/>/,
  '</TooltipProvider>\n          </Router>\n          <Toaster />\n          </ChatProvider>\n        </AuthProvider>\n      </ThemeProvider>'
);

fs.writeFileSync('/Users/metinsalik/Desktop/Projelerim/sec_portali/apps/web/src/App.tsx', newContent);
console.log('Fixed');

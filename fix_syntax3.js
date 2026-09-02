const fs = require('fs');
['frontend/app/dashboard/page.js', 'frontend/app/login/page.js'].forEach(f => {
  let code = fs.readFileSync(f, 'utf8');
  code = code.replace(/<\/button>\s*<div className="px-4 py-2">/g, '</button>\n)}\n<div className="px-4 py-2">');
  fs.writeFileSync(f, code);
});

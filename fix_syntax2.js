const fs = require('fs');
['frontend/app/dashboard/page.js', 'frontend/app/login/page.js'].forEach(f => {
  let code = fs.readFileSync(f, 'utf8');
  code = code.replace(/\\'client\\'/g, "'client'");
  fs.writeFileSync(f, code);
});

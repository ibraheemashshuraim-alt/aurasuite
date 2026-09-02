const fs = require('fs');

['frontend/app/dashboard/page.js', 'frontend/app/login/page.js'].forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(/\\'Reactivate\\'/g, "'Reactivate'");
  fs.writeFileSync(file, code);
});

console.log("Fixed syntax error");

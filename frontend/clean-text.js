const fs = require('fs');
const files = ['frontend/app/dashboard/page.js', 'frontend/app/login/page.js'];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/Access Revoked \(Condition A\)[^`'"]+/g, 'Access Revoked: Your access card has been suspended by the Admin.');
  content = content.replace(/Access Revoked \(Condition B\)[^`'"]+/g, 'Access Revoked: Your access card has been suspended by the Admin.');
  content = content.replace(/Access Revoked \(Condition URL\)[^`'"]+/g, 'Access Revoked: Your access card has been suspended by the Admin.');
  fs.writeFileSync(f, content);
});
console.log('Done');

const fs = require('fs');
let content = fs.readFileSync('frontend/app/dashboard/page.js', 'utf8');
content = content.replace(
  /const \{ data: profileData \} = await supabase\.from\('profiles'\)\.insert\(\{/,
  "const { data: profileData } = await supabase.from('profiles').insert({ id: genId('user'),"
);
fs.writeFileSync('frontend/app/dashboard/page.js', content);
console.log('done');

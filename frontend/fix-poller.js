const fs = require('fs');
let content = fs.readFileSync('frontend/app/dashboard/page.js', 'utf8');

const search = `    // Polling fallback for organizations (in case Realtime is disabled on the table)
    const orgsInterval = setInterval(() => {
      if (currentUserRef.current?.role === 'super_admin') {
        supabase.from('organizations').select('*').then(({ data }) => {
          if (data) setOrganizations(data);
        });
      }
    }, 5000);`;

const replace = `    // Polling fallback for organizations and profiles (in case Realtime is disabled on the table)
    const orgsInterval = setInterval(() => {
      if (currentUserRef.current?.role === 'super_admin') {
        supabase.from('organizations').select('*').then(({ data }) => {
          if (data) setOrganizations(data);
        });
        supabase.from('profiles').select('*').then(({ data }) => {
          if (data) setProfiles(data);
        });
      }
    }, 5000);`;

content = content.replace(search, replace);
fs.writeFileSync('frontend/app/dashboard/page.js', content);

const fs = require('fs');
let content = fs.readFileSync('frontend/app/dashboard/page.js', 'utf8');

const targetStr = `    // Polling fallback for organizations (in case Realtime is disabled on the table)
    const orgsInterval = setInterval(() => {
      if (currentUserRef.current?.role === 'super_admin') {
        supabase.from('organizations').select('*').then(({ data }) => {
          if (data) setOrganizations(data);
        });
      }
    }, 5000);`;

const targetStrNormalized = targetStr.replace(/\r\n/g, '\n');
const contentNormalized = content.replace(/\r\n/g, '\n');

const replacement = `    // Polling fallback for organizations and profiles (in case Realtime is disabled on the table)
    const orgsInterval = setInterval(() => {
      const currentRole = currentUserRef.current?.role;
      if (currentRole === 'super_admin' || currentRole === 'admin') {
        if (currentRole === 'super_admin') {
          supabase.from('organizations').select('*').then(({ data }) => {
            if (data) setOrganizations(data);
          });
        }
        supabase.from('profiles').select('*').then(({ data }) => {
          if (data) setProfiles(data);
        });
      }
    }, 5000);`;

const newContent = contentNormalized.replace(targetStrNormalized, replacement);
if (newContent !== contentNormalized) {
  fs.writeFileSync('frontend/app/dashboard/page.js', newContent);
  console.log('Poller updated successfully!');
} else {
  console.log('Failed to find poller code!');
}

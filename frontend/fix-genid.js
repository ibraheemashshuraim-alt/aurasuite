const fs = require('fs');
let content = fs.readFileSync('frontend/app/dashboard/page.js', 'utf8');

const search = `                             const { data: profileData } = await supabase.from('profiles').insert({
                               organization_id: org.id, email: org.email, full_name: org.owner_name,
                               role: 'admin', category: 'A', domain: 'Admin', username, password_hash: tempPassword,
                               card_number: cardNumber, is_first_login: true, org_mode: org.working_hours?.business_type || 'software_house'
                             }).select().single();`;

const replace = `                             const { data: profileData } = await supabase.from('profiles').insert({
                               id: genId('user'),
                               organization_id: org.id, email: org.email, full_name: org.owner_name,
                               role: 'admin', category: 'A', domain: 'Admin', username, password_hash: tempPassword,
                               card_number: cardNumber, is_first_login: true, org_mode: org.working_hours?.business_type || 'software_house'
                             }).select().single();`;

content = content.replace(search, replace);
fs.writeFileSync('frontend/app/dashboard/page.js', content);

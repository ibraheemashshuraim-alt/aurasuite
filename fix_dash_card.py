import re

filepath = 'frontend/app/dashboard/page.js'
with open(filepath, 'r', encoding='utf-8') as f:
    code = f.read()

pattern = r"supabase\.from\('digital_cards'\)\.select\('is_revoked'\)\.eq\('card_number', cardParam\)\.eq\('username', userParam\)\.maybeSingle\(\)\.then\(\(\{data\}\) => \{ if \(data\?\.is_revoked\) setKickoutModal\(true\); \}\);"
replacement = """supabase.from('digital_cards').select('is_revoked, organization_id').eq('card_number', cardParam).eq('username', userParam).maybeSingle().then(({data}) => { 
            if (data?.is_revoked) setKickoutModal(true); 
            else if (data?.organization_id) {
              supabase.from('organizations').select('status').eq('id', data.organization_id).single().then(({data: orgData}) => {
                if (orgData?.status === 'suspended' || orgData?.status === 'banned') {
                  setAuthBlockedByOrg(true);
                }
              });
            }
          });"""

code = re.sub(pattern, replacement, code)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(code)

print("Fixed dashboard cardParam again")

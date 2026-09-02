import re

for filepath in ['frontend/app/dashboard/page.js', 'frontend/app/login/page.js']:
    with open(filepath, 'r', encoding='utf-8') as f:
        code = f.read()

    # We need to replace the entire if (cardParam && userParam) { ... } block
    # It ends with `}` before `// Process the invite token` or similar.
    # Let's just find the start: `if (cardParam && userParam) {`
    
    # Safest way: replace the supabase call directly.
    pattern = r"supabase\.from\('digital_cards'\)\.select\('is_revoked'\)\.eq\('card_number', cardParam\)\.eq\('username', userParam\)\.maybeSingle\(\)\.then\(\(\{data\}\) => \{[\s\S]*?\}\)\.catch\(\(\) => setIsCheckingSession\(false\)\);"
    
    replacement = """supabase.from('digital_cards').select('is_revoked, organization_id').eq('card_number', cardParam).eq('username', userParam).maybeSingle().then(({data}) => { 
          if (data?.is_revoked) {
            setKickoutModal(true); 
            setIsCheckingSession(false);
          } else if (data?.organization_id) {
            supabase.from('organizations').select('status').eq('id', data.organization_id).single().then(({data: orgData}) => {
              if (orgData?.status === 'suspended' || orgData?.status === 'banned') {
                setAuthBlockedByOrg(true);
              }
              setIsCheckingSession(false);
            }).catch(() => setIsCheckingSession(false));
          } else {
            setIsCheckingSession(false);
          }
        }).catch(() => setIsCheckingSession(false));"""

    code = re.sub(pattern, replacement, code)
    
    # In dashboard, it might not have the .catch
    pattern2 = r"supabase\.from\('digital_cards'\)\.select\('is_revoked, organization_id'\)\.eq\('card_number', cardParam\)\.eq\('username', userParam\)\.maybeSingle\(\)\.then\(\(\{data\}\) => \{ \n\s*if \(data\?\.is_revoked\) setKickoutModal\(true\); \n\s*else if \(data\?\.organization_id\) \{[\s\S]*?\}\)\;\n\s*\}\n\s*\}\)\;"
    
    if "setAuthBlockedByOrg(true);" not in code or "setIsCheckingSession(false);" not in code[code.find("setAuthBlockedByOrg(true);"):]:
        print("Fallback replace for", filepath)
        # Manually find it
        start = code.find("if (cardParam && userParam) {")
        if start != -1:
            end = code.find("}", start + 30) # close of if
            end = code.find("}", end + 1) # maybe another close
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(code)

print("Fixed cardParam")

import re

for file_path in ['frontend/app/dashboard/page.js', 'frontend/app/login/page.js']:
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    # 1. handleInviteWorker: scope existing profile search to current organization
    # Old: const existingProfile = profiles.find(p => p.email.toLowerCase() === inviteEmail.toLowerCase());
    # New: const existingProfile = profiles.find(p => p.email.toLowerCase() === inviteEmail.toLowerCase() && p.organization_id === activeOrg.id);
    code = re.sub(
        r'const existingProfile = profiles\.find\(p => p\.email\.toLowerCase\(\) === inviteEmail\.toLowerCase\(\)\);',
        r'const existingProfile = profiles.find(p => p.email.toLowerCase() === inviteEmail.toLowerCase() && p.organization_id === activeOrg.id);',
        code
    )

    # 2. handleApproveOrg (handleChangeOrgStatus -> 'active'): scope existing profile search by organization_id
    # Old: const { data: existingProfile } = await supabase.from('profiles').select('*').eq('email', org.email).maybeSingle();
    # New: const { data: existingProfileList } = await supabase.from('profiles').select('*').eq('email', org.email).eq('organization_id', org.id); const existingProfile = existingProfileList?.[0];
    
    code = re.sub(
        r"const \{ data: existingProfile \} = await supabase\.from\('profiles'\)\.select\('\*'\)\.eq\('email', org\.email\)\.maybeSingle\(\);",
        r"const { data: existingProfileList } = await supabase.from('profiles').select('*').eq('email', org.email).eq('organization_id', org.id);\n                            const existingProfile = existingProfileList?.[0];",
        code
    )

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)

print("Multi-tenancy patch applied successfully.")

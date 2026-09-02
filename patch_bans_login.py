import re

file_path = 'frontend/app/login/page.js'
with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. handleBanUser -> org-specific ban
ban_user_pattern = r"""const newBanRecord = \{ email: userEmail\.toLowerCase\(\), banned_until: banDate\.toISOString\(\), created_at: new Date\(\)\.toISOString\(\) \};"""
ban_user_replacement = """const orgSpecificEmail = `${activeOrg.id}:${userEmail.toLowerCase()}`;
          const newBanRecord = { email: orgSpecificEmail, banned_until: banDate.toISOString(), created_at: new Date().toISOString() };"""
code = code.replace("const newBanRecord = { email: userEmail.toLowerCase(), banned_until: banDate.toISOString(), created_at: new Date().toISOString() };",
                   "const orgSpecificEmail = `${activeOrg.id}:${userEmail.toLowerCase()}`;\n          const newBanRecord = { email: orgSpecificEmail, banned_until: banDate.toISOString(), created_at: new Date().toISOString() };")

# 2. handleInviteWorker -> check both org-specific and global ban
invite_check_pattern = r"""// Task A: STRICTLY QUERY banned_emails FIRST.*?const \{ data: banRecord \} = await supabase.*?\.from\('banned_emails'\).*?\.select\('\*'\).*?\.eq\('email', inviteEmail\.toLowerCase\(\)\).*?\.single\(\);.*?if \(banRecord && new Date\(banRecord\.banned_until\) > new Date\(\)\) \{.*?setCustomAlert\('This email is banned for 30 days\.'\);.*?return;.*?}"""

invite_check_replacement = """// Task A: STRICTLY QUERY banned_emails FIRST
                  const { data: banRecordOrg } = await supabase
                    .from('banned_emails')
                    .select('*')
                    .eq('email', `${activeOrg.id}:${inviteEmail.toLowerCase()}`)
                    .single();
                    
                  const { data: banRecordGlobal } = await supabase
                    .from('banned_emails')
                    .select('*')
                    .eq('email', inviteEmail.toLowerCase())
                    .single();

                  if (banRecordGlobal && new Date(banRecordGlobal.banned_until) > new Date()) {
                    setCustomAlert('This email is permanently banned globally.');
                    setIsGeneratingInvite(false);
                    return;
                  }

                  if (banRecordOrg && new Date(banRecordOrg.banned_until) > new Date()) {
                    setCustomAlert('This email is banned from this organization for 30 days.');
                    setIsGeneratingInvite(false);
                    return;
                  }"""
code = re.sub(invite_check_pattern, invite_check_replacement, code, flags=re.DOTALL)

# 3. Find bannedEmails checks (in handleReactivateUser and UI)
code = re.sub(r'bannedEmails\.find\(b => b\.email === userEmail\)', 
              r'bannedEmails.find(b => b.email === userEmail || b.email === `${activeOrg?.id}:${userEmail}`)', code)
code = re.sub(r'bannedEmails\.find\(b => b\.email === user\.email\?\.toLowerCase\(\)\)', 
              r'bannedEmails.find(b => b.email === user.email?.toLowerCase() || b.email === `${activeOrg?.id}:${user.email?.toLowerCase()}`)', code)

# In handleReactivateUser, deleting the ban record
code = re.sub(r"await supabase\.from\('banned_emails'\)\.delete\(\)\.eq\('email', userEmail\);",
              r"await supabase.from('banned_emails').delete().in('email', [userEmail, `${activeOrg?.id}:${userEmail}`]);", code)
code = re.sub(r"setBannedEmails\(prev => prev\.filter\(b => b\.email !== userEmail\)\);",
              r"setBannedEmails(prev => prev.filter(b => b.email !== userEmail && b.email !== `${activeOrg?.id}:${userEmail}`));", code)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("login/page.js patched successfully.")

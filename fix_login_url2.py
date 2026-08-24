import re
with open('frontend/app/login/page.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the first useEffect return
content = re.sub(r'if \(hasInviteToken \|\| hasOldInvite \|\| hasCard\) \{\s*setIsCheckingSession\(false\);\s*return;\s*\}', 'if (hasInviteToken || hasOldInvite || hasCard) {\n        // Handled by URL params effect\n        return;\n      }', content)

# Replace the second useEffect
content = re.sub(r'setLoginMode\(\'worker\'\);\s*supabase\.from\(\'digital_cards\'\)\.select\(\'is_revoked\'\)\.eq\(\'card_number\', cardParam\)\.eq\(\'username\', userParam\)\.maybeSingle\(\)\.then\(\(\{data\}\) => \{ if \(data\?\.is_revoked\) setKickoutModal\(true\); \}\);\s*\}', "setLoginMode('worker');\n          supabase.from('digital_cards').select('is_revoked').eq('card_number', cardParam).eq('username', userParam).maybeSingle().then(({data}) => { \n            if (data?.is_revoked) setKickoutModal(true); \n            setIsCheckingSession(false);\n          }).catch(() => setIsCheckingSession(false));\n        } else {\n          setIsCheckingSession(false);\n        }", content)

with open('frontend/app/login/page.js', 'w', encoding='utf-8') as f:
    f.write(content)

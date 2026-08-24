import re

def remove_bad_listener(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    bad_listener = re.compile(r'\s*\.on\(\'postgres_changes\', \{ event: \'\*\', schema: \'public\', table: \'group_messages\' \}, \(\) => \{\s*supabase\.from\(\'group_messages\'\)\.select\(\'\*\'\)\.order\(\'created_at\', \{ ascending: true \}\)\.then\(\(\{ data \}\) => \{[\s\S]*?          \}\);\s*\}\)')
    
    content = re.sub(bad_listener, '', content)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

remove_bad_listener('frontend/app/dashboard/page.js')
remove_bad_listener('frontend/app/login/page.js')

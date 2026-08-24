import re

def delete_bad_listener(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the block starting with: .on('postgres_changes', { event: '*', schema: 'public', table: 'group_messages' }, () => {
    # and ending with: });\n        })
    # NOTE: The good listener has payload => { instead of () => {
    
    bad_pattern = re.compile(r'\s*\.on\(\'postgres_changes\', \{ event: \'\*\', schema: \'public\', table: \'group_messages\' \}, \(\) => \{\s*supabase\.from\(\'group_messages\'\)[\s\S]*?\}\);\s*\}\)')
    
    content = re.sub(bad_pattern, '', content)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

delete_bad_listener('frontend/app/dashboard/page.js')
delete_bad_listener('frontend/app/login/page.js')

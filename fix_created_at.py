import sys
with open('frontend/app/dashboard/page.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("supabase.from('group_messages').select('*').order('created_at', { ascending: true }),", "supabase.from('group_messages').select('*').order('id', { ascending: true }),")

with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(content)

with open('frontend/app/login/page.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("supabase.from('group_messages').select('*').order('created_at', { ascending: true }),", "supabase.from('group_messages').select('*').order('id', { ascending: true }),")

with open('frontend/app/login/page.js', 'w', encoding='utf-8') as f:
    f.write(content)

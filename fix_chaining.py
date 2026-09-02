import re

for filepath in ['frontend/app/dashboard/page.js', 'frontend/app/login/page.js']:
    with open(filepath, 'r', encoding='utf8') as f:
        code = f.read()

    code = code.replace("currentUser.role === 'client'", "currentUser?.role === 'client'")
    code = code.replace("currentUser.id", "currentUser?.id")
    code = code.replace("currentUser.full_name", "currentUser?.full_name")
    
    with open(filepath, 'w', encoding='utf8') as f:
        f.write(code)

print("Fixed optional chaining.")

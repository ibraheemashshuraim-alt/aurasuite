import re

def fix_syntax(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace('onConfirm: () => {', 'onConfirm: async () => {')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

fix_syntax('frontend/app/login/page.js')
fix_syntax('frontend/app/dashboard/page.js')

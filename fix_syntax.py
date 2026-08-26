import re

filepath = 'frontend/app/dashboard/page.js'
with open(filepath, 'r', encoding='utf-8') as f:
    code = f.read()

# We need to find the `)}` right after `Trash2 size={14}` and replace it with `))}`
pattern = r"(<Trash2 size=\{14\} /></button>\s*</>\s*)\)\}"
replacement = r"\1))}"

code = re.sub(pattern, replacement, code)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(code)

print("Fixed syntax")

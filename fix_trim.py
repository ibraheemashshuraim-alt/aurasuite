import re

for filepath in ['frontend/app/dashboard/page.js', 'frontend/app/login/page.js']:
    with open(filepath, 'r', encoding='utf-8') as f:
        code = f.read()

    code = code.replace("org.email !== 'ibraheemashshuraim@gmail.com'", "org.email?.toLowerCase().trim() !== 'ibraheemashshuraim@gmail.com'")
    code = code.replace("a.email === 'ibraheemashshuraim@gmail.com'", "a.email?.toLowerCase().trim() === 'ibraheemashshuraim@gmail.com'")
    code = code.replace("b.email === 'ibraheemashshuraim@gmail.com'", "b.email?.toLowerCase().trim() === 'ibraheemashshuraim@gmail.com'")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(code)

print("Fixed trim")

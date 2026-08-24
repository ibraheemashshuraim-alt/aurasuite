def fix(path):
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()
    c = c.replace("'bg-purple-900/50\n", "'bg-purple-900/50 ")
    with open(path, 'w', encoding='utf-8') as f:
        f.write(c)

fix('frontend/app/login/page.js')
fix('frontend/app/dashboard/page.js')

import re

files = ['frontend/app/dashboard/page.js', 'frontend/app/login/page.js']

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        code = f.read()

    # 1. Remove bad injections
    code = code.replace("playSoundEffect('outgoing_msg');\n          const key = [currentUser", "const key = [currentUser")
    code = code.replace("playSoundEffect('outgoing_msg');\n            const key = [currentUser", "const key = [currentUser")
    
    # Also handle possible variations in whitespace
    code = re.sub(r"playSoundEffect\('outgoing_msg'\);\s*const key = \[currentUser\?\.id", r"const key = [currentUser?.id", code)

    # 2. Add proper injections
    code = code.replace("const optimisticMsg = { id: msgId", "playSoundEffect('outgoing_msg');\n        const optimisticMsg = { id: msgId")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(code)

print("Fixed outgoing msg sounds.")

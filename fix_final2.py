import re

d = open('frontend/app/dashboard/page.js', 'r', encoding='utf-8').read()

d = d.replace("const _trigger = currentMinute;", "")

with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(d)
print("Fixed ReferenceError")

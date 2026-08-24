import sys
with open('frontend/app/login/page.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if i > 2500 and ('KICKOUT MODAL OVERLAY' in line or 'LOCK MODAL OVERLAY' in line):
        skip = True
    
    if not skip:
        new_lines.append(line)
        
    if skip and ('  }\n' in line or '  }\r\n' in line):
        skip = False

with open('frontend/app/login/page.js', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

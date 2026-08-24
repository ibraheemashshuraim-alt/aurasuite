import sys
with open('frontend/app/dashboard/page.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if 'LOCK MODAL OVERLAY' in line:
        skip = True
    
    if not skip:
        new_lines.append(line)
        
    if skip and '    );\n' in line or '    );\r\n' in line:
        # Wait, the closing of the lock modal is:
        #     );
        #   }
        pass
    if skip and '  }\n' in line or '  }\r\n' in line:
        skip = False

with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

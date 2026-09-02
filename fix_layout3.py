import re

for filepath in ['frontend/app/dashboard/page.js', 'frontend/app/login/page.js']:
    with open(filepath, 'r', encoding='utf8') as f:
        code = f.read()

    pattern = r'(Update Password\s*</button>\s*</div>\s*</div>\s*</div>\s*</div>\s*\)\s*\}\s*)(</div>)'
    
    match = re.search(pattern, code)
    if not match:
        print(f'[{filepath}] No match')
        continue
    
    # We remove the </div> from here.
    code = code[:match.end(1)] + code[match.end(2):]
    
    # Now we find where to insert it.
    insert_pattern = r'(\{\/\* Org View Details Popup \*\/\}|\{\/\*.*SIDEBAR.*\*\/\}|^\s*<aside className="w-64 glass-panel)'
    
    insert_match = re.search(insert_pattern, code[match.end(1):], re.MULTILINE)
    if not insert_match:
        print(f'[{filepath}] No insert match')
        continue
        
    insert_idx = match.end(1) + insert_match.start(1)
    
    code = code[:insert_idx] + '\n        </div>\n\n  ' + code[insert_idx:]
    
    with open(filepath, 'w', encoding='utf8') as f:
        f.write(code)
    
    print(f'[{filepath}] Fixed!')

import re

for file in ['frontend/app/dashboard/page.js', 'frontend/app/login/page.js']:
    with open(file, 'r', encoding='utf8') as f:
        code = f.read()
    
    # Hide group chat
    code = re.sub(
        r'\{\/\* Group Chat \*\/\}\s*<button onClick=\{openGroupChat\}',
        r'{/* Group Chat */}\n                      {currentUser?.role !== \'client\' && (\n                      <button onClick={openGroupChat}',
        code
    )
    code = re.sub(
        r'<\/span>\s*<\/button>\s*<div className=\"px-4 py-2\">',
        r'</span>\n                      </button>\n                      )}\n                      <div className="px-4 py-2">',
        code
    )
    
    with open(file, 'w', encoding='utf8') as f:
        f.write(code)

print("Done")

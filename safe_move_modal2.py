
import re

def fix_file(filename):
    with open(filename, "r", encoding="utf-8") as f:
        content = f.read()

    pattern = re.compile(r"(  if \(kickoutModal \|\| currentUser\?\.role === \"suspended\" \|\| currentUser\?\.status === \"suspended\"\)[^{]*\{[\s\S]*?    }\n)", re.MULTILINE)
    match = pattern.search(content)
    
    if match:
        block = match.group(1)
        content = content.replace(block, "")
        
        insert_point = "  if (isCheckingSession) {"
        content = content.replace(insert_point, block + "\n" + insert_point)
        
        with open(filename, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Fixed {filename}")
    else:
        print(f"Modal not found in {filename}")

fix_file("frontend/app/dashboard/page.js")


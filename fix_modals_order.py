
import re

def fix_file(filename):
    with open(filename, "r", encoding="utf-8") as f:
        content = f.read()

    kickout_pattern = re.compile(r"(  // .*?KICKOUT MODAL OVERLAY.*?  if \(kickoutModal.*?  }\n)", re.DOTALL)
    lock_pattern = re.compile(r"(  // .*?LOCK MODAL OVERLAY.*?  const isEffectivelyLocked.*?  }\n)", re.DOTALL)
    
    kickout_match = kickout_pattern.search(content)
    lock_match = lock_pattern.search(content)
    
    if kickout_match and lock_match:
        kickout_code = kickout_match.group(1)
        lock_code = lock_match.group(1)
        
        content = content.replace(kickout_code, "")
        content = content.replace(lock_code, "")
        
        insert_point = "  if (isCheckingSession) {"
        new_content = kickout_code + "\n" + lock_code + "\n" + insert_point
        content = content.replace(insert_point, new_content)
        
        with open(filename, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Fixed modal order in {filename}")
    else:
        print(f"Could not find modals in {filename}")

fix_file("frontend/app/dashboard/page.js")
fix_file("frontend/app/login/page.js")


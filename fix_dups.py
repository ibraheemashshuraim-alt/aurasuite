
import re

def fix_file(filename):
    with open(filename, "r", encoding="utf-8") as f:
        content = f.read()

    # The ones I added are grouped like this:
    #   const [lockModal, setLockModal] = useState(false);
    #   const [kickoutModal, setKickoutModal] = useState(false);
    # I should just remove these two lines from my injected block around line 271
    
    # Let\x27s just use re.sub to remove them ONLY from the first match
    content = content.replace("  const [lockModal, setLockModal] = useState(false);\n", "", 1)
    content = content.replace("  const [kickoutModal, setKickoutModal] = useState(false);\n", "", 1)

    with open(filename, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Fixed {filename}")

fix_file("frontend/app/dashboard/page.js")
fix_file("frontend/app/login/page.js")


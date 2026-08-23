
import re

def fix_file(filename):
    with open(filename, "r", encoding="utf-8") as f:
        content = f.read()

    content = content.replace(
        "const [kickoutModal, setKickoutModal] = useState(false);",
        "const [lockModal, setLockModal] = useState(false);\n  const [kickoutModal, setKickoutModal] = useState(false);"
    )

    with open(filename, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Fixed {filename}")

fix_file("frontend/app/dashboard/page.js")
fix_file("frontend/app/login/page.js")


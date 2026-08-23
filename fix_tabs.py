
import re

def fix_file(filename, is_worker_portal):
    with open(filename, "r", encoding="utf-8") as f:
        content = f.read()

    if is_worker_portal:
        content = content.replace(
            "const saved = localStorage.getItem(\x27aura_admin_tab\x27);",
            "const saved = sessionStorage.getItem(\x27aura_worker_tab\x27) || (currentUser?.role === \x27worker\x27 ? \x27dashboard\x27 : null);",
            1
        )
        content = content.replace(
            "localStorage.setItem(\x27aura_admin_tab\x27, activeTab);",
            "sessionStorage.setItem(\x27aura_worker_tab\x27, activeTab);",
            1
        )
        # Also ensure we default to a valid tab if the loaded one is invalid.
        # Actually, if we just use sessionStorage, it won\x27t leak from Admin!
    else:
        # Dashboard is Admin
        pass

    with open(filename, "w", encoding="utf-8") as f:
        f.write(content)

fix_file("frontend/app/login/page.js", True)


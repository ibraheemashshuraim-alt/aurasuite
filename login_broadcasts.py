
import re

def fix_file(filename):
    with open(filename, "r", encoding="utf-8") as f:
        content = f.read()

    # Add listeners in login/page.js
    content = content.replace(
        ".subscribe((status) => {",
        ".on(\x27broadcast\x27, { event: \x27worker-lock-status\x27 }, (payload) => {\n        const targetId = payload?.payload?.userId;\n        const currentId = currentUserRef.current?.id;\n        if (targetId && currentId && targetId === currentId) {\n          setCurrentUser(prev => prev ? { ...prev, is_locked: payload.payload.is_locked, force_unlocked: payload.payload.force_unlocked } : prev);\n        }\n      })\n      .on(\x27broadcast\x27, { event: \x27org-updated\x27 }, (payload) => {\n        const updatedOrg = payload?.payload;\n        if (updatedOrg && activeOrg?.id === updatedOrg.orgId) {\n          setActiveOrg(prev => ({ ...prev, ...updatedOrg }));\n        }\n      })\n      .subscribe((status) => {"
    )

    with open(filename, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Fixed {filename}")

fix_file("frontend/app/login/page.js")


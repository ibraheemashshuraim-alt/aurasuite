
import re

def fix_file(filename):
    with open(filename, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. toggleLockAllWorkers
    content = content.replace(
        "addNotification(`All workers are now ${modeText}.`, mode === \x27lock\x27 ? \x27warning\x27 : \x27success\x27);",
        "addNotification(`All workers are now ${modeText}.`, mode === \x27lock\x27 ? \x27warning\x27 : \x27success\x27);\n        if (kickoutChannelRef.current) {\n          workerIds.forEach(wid => kickoutChannelRef.current.send({ type: \x27broadcast\x27, event: \x27worker-lock-status\x27, payload: { userId: wid, is_locked: lock, force_unlocked: newForceUnlocked } }));\n        }"
    )
    print("Added broadcast to toggleLockAllWorkers")

    # 2. updateWorkingDays
    content = content.replace(
        "addNotification(\x27Working days updated\x27, \x27success\x27);",
        "addNotification(\x27Working days updated\x27, \x27success\x27);\n      if (kickoutChannelRef.current) kickoutChannelRef.current.send({ type: \x27broadcast\x27, event: \x27org-updated\x27, payload: { orgId: org.id, working_days: newDays } });"
    )
    print("Added broadcast to updateWorkingDays")

    # 3. updateWorkingHours
    content = content.replace(
        "addNotification(\x27Working hours updated\x27, \x27success\x27);",
        "addNotification(\x27Working hours updated\x27, \x27success\x27);\n      if (kickoutChannelRef.current) kickoutChannelRef.current.send({ type: \x27broadcast\x27, event: \x27org-updated\x27, payload: { orgId: org.id, working_hours: newHours } });"
    )
    print("Added broadcast to updateWorkingHours")

    # Add listener for org-updated in dashboard/page.js
    listener_pattern = re.compile(r"(\.on\(\x27broadcast\x27, \{ event: \x27worker-lock-status\x27 \}, \(payload\) => \{[\s\S]*?\}\))")
    
    # We can use str.replace for the listener if we just find a specific line to insert before
    content = content.replace(
        ".subscribe((status) => {",
        ".on(\x27broadcast\x27, { event: \x27org-updated\x27 }, (payload) => {\n        const updatedOrg = payload?.payload;\n        if (updatedOrg && activeOrg?.id === updatedOrg.orgId) {\n          setActiveOrg(prev => ({ ...prev, ...updatedOrg }));\n        }\n      })\n      .subscribe((status) => {"
    )
    print("Added listener for org-updated")

    with open(filename, "w", encoding="utf-8") as f:
        f.write(content)

fix_file("frontend/app/dashboard/page.js")


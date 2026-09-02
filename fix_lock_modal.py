import re

for filepath in ['frontend/app/dashboard/page.js', 'frontend/app/login/page.js']:
    with open(filepath, 'r', encoding='utf-8') as f:
        code = f.read()

    pattern = r"const isEffectivelyLocked = lockModal \|\| checkIsEffectivelyLocked\(currentUser, activeOrg\);\s*if \(isEffectivelyLocked && currentUser\?\.role === \"worker\"\) \{"
    
    replacement = """const isOrgLockedBySuperAdmin = activeOrg?.working_hours?.is_org_locked;
    const isEffectivelyLocked = lockModal || checkIsEffectivelyLocked(currentUser, activeOrg) || isOrgLockedBySuperAdmin;
    const shouldShowLockScreen = (isEffectivelyLocked && currentUser?.role === "worker") || (isOrgLockedBySuperAdmin && currentUser?.role === "admin");
    if (shouldShowLockScreen) {"""

    new_code = re.sub(pattern, replacement, code)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_code)

print("Updated lock modal condition")

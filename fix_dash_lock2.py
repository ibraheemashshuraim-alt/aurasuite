import re

filepath = 'frontend/app/dashboard/page.js'
with open(filepath, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Rewrite checkIsEffectivelyLocked to only check manual user.is_locked
old_check = r"function checkIsEffectivelyLocked\(user, org\) \{[\s\S]*?\n  \}\n  return false;\n\}"
new_check = """function checkIsEffectivelyLocked(user, org) {
  if (!user || user.role !== 'worker') return false;
  return !!user.is_locked;
}"""
code = re.sub(old_check, new_check, code)

# 2. Fix the popup logic. Let's find the existing popup logic.
# In dashboard/page.js, we had:
# const isOrgLockedBySuperAdmin = activeOrg?.working_hours?.is_org_locked;
# const isEffectivelyLocked = lockModal || checkIsEffectivelyLocked(currentUser, activeOrg) || isOrgLockedBySuperAdmin;
# const shouldShowLockScreen = (isEffectivelyLocked && currentUser?.role === "worker") || (isOrgLockedBySuperAdmin && currentUser?.role === "admin");
# if (shouldShowLockScreen) { ... }

# Wait! We want the Organization Lock popup to be the "Some issue has occurred" one!
# And the Worker Lock popup to be the "Off-Day / Access Locked" one!
# Let's remove the recent modification we did.

# The recent modification was:
pattern = r"const isOrgLockedBySuperAdmin = activeOrg\?\.working_hours\?\.is_org_locked;\s*const isEffectivelyLocked = lockModal \|\| checkIsEffectivelyLocked\(currentUser, activeOrg\) \|\| isOrgLockedBySuperAdmin;\s*const shouldShowLockScreen = \(isEffectivelyLocked && currentUser\?\.role === \"worker\"\) \|\| \(isOrgLockedBySuperAdmin && currentUser\?\.role === \"admin\"\);\s*if \(shouldShowLockScreen\) \{"
replacement = """const isEffectivelyLocked = lockModal || checkIsEffectivelyLocked(currentUser, activeOrg);
    if (isEffectivelyLocked && currentUser?.role === "worker") {"""

code = re.sub(pattern, replacement, code)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(code)

print("Fixed dashboard page")

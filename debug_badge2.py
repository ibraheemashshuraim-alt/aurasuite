import re

with open('frontend/app/dashboard/page.js', 'r', encoding='utf-8') as f:
    d = f.read()

debug_badge = """    <main className="relative min-h-screen">
        <div className="fixed bottom-4 right-4 z-[9999999999] bg-green-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg whitespace-pre-wrap">
          {`Deployed: Aug 25 20:09
Role: ${currentUser?.role}
Lock Math Result: ${checkIsEffectivelyLocked(currentUser, activeOrg)}
User Locked: ${currentUser?.is_locked}
User Force Unlock: ${currentUser?.force_unlocked}
Org 24/7: ${activeOrg?.working_hours?.is_24_7}
Org Start: ${activeOrg?.working_hours?.start}
Org End: ${activeOrg?.working_hours?.end}
Current Time: ${new Date().getHours()}:${new Date().getMinutes()}`}
        </div>"""

d = re.sub(r'<main className="relative min-h-screen">\s*<div className="fixed bottom-4 right-4 z-\[9999999999\] bg-green-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg whitespace-pre-wrap">[\s\S]*?</div>', debug_badge.strip(), d, count=1)

with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(d)
print("Updated badge with role and math")

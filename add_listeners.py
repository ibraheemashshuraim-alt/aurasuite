import re

d = open('frontend/app/dashboard/page.js', 'r', encoding='utf-8').read()

missing_listeners = """        .on('broadcast', { event: 'org-updated' }, (payload) => {
          const updatedOrg = payload?.payload;
          if (updatedOrg && activeOrgRef.current?.id === updatedOrg.orgId) {
            setActiveOrg(prev => ({ ...prev, ...updatedOrg }));
          }
        })
        .on('broadcast', { event: 'worker-lock-all' }, (payload) => {
          const orgId = payload?.payload?.orgId;
          if (orgId && activeOrgRef.current?.id === orgId) {
            setCurrentUser(prev => prev ? { ...prev, is_locked: payload.payload.is_locked, force_unlocked: payload.payload.force_unlocked } : prev);
          }
        })
        .on('broadcast', { event: 'org-working-hours' }, (payload) => {
          const orgId = payload?.payload?.orgId;
          if (orgId && activeOrgRef.current?.id === orgId) {
            setActiveOrg(prev => prev ? { ...prev, working_hours: payload.payload.working_hours } : prev);
          }
        })
        .on('broadcast', { event: 'org-working-days' }, (payload) => {
          const orgId = payload?.payload?.orgId;
          if (orgId && activeOrgRef.current?.id === orgId) {
            setActiveOrg(prev => prev ? { ...prev, working_days: payload.payload.working_days } : prev);
          }
        })"""

old_listener = r"\s*\.on\('broadcast', \{ event: 'org-updated' \}, \(payload\) => \{\s*const updatedOrg = payload\?\.payload;\s*if \(updatedOrg && activeOrg\?\.id === updatedOrg\.orgId\) \{\s*setActiveOrg\(prev => \(\{ \.\.\.prev, \.\.\.updatedOrg \}\)\);\s*\}\s*\}\)"

if "worker-lock-all" not in d[:10000]:  # Only look at the beginning where the listeners are
    d = re.sub(old_listener, "\n" + missing_listeners.replace('\\', '\\\\'), d)
    with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
        f.write(d)
    print("Added listeners successfully")
else:
    print("Listeners already present")

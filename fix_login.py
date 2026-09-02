import re

with open('frontend/app/login/page.js', 'r', encoding='utf-8') as f:
    code = f.read()

old_org_update = """.on('broadcast', { event: 'org-updated' }, (payload) => {
          const updatedOrg = payload?.payload;
          if (updatedOrg && activeOrgRef.current?.id === updatedOrg.orgId) {
            setActiveOrg(prev => ({ ...prev, ...updatedOrg }));
          }
        })"""

new_org_update = """.on('broadcast', { event: 'org-updated' }, (payload) => {
          const updatedOrg = payload?.payload;
          if (updatedOrg && activeOrgRef.current?.id === updatedOrg.orgId) {
            setActiveOrg(prev => {
              const nextOrg = prev ? { ...prev, ...updatedOrg, working_hours: updatedOrg.working_hours || prev.working_hours } : prev;
              if (checkIsEffectivelyLocked(currentUserRef.current, nextOrg)) setLockModal(true);
              else setLockModal(false);
              
              if (nextOrg.status === 'suspended' || nextOrg.status === 'banned') {
                setKickoutModal(true);
              }
              
              return nextOrg;
            });
          }
        })"""

code = code.replace(old_org_update, new_org_update)

with open('frontend/app/login/page.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Fixed login")

import re

with open('frontend/app/dashboard/page.js', 'r', encoding='utf-8') as f:
    d = f.read()

# 1. Aggressively force lockModal in listeners
listeners = """
          .on('broadcast', { event: 'worker-lock-status' }, (payload) => {
          const targetId = payload?.payload?.userId;
          const currentId = currentUserRef.current?.id;
          if (targetId && currentId && targetId === currentId) {
            setCurrentUser(prev => {
              const nextUser = prev ? { ...prev, is_locked: payload.payload.is_locked, force_unlocked: payload.payload.force_unlocked } : prev;
              if (checkIsEffectivelyLocked(nextUser, activeOrgRef.current)) setLockModal(true);
              else setLockModal(false);
              return nextUser;
            });
          }
        })
          .on('broadcast', { event: 'org-updated' }, (payload) => {
            const updatedOrg = payload?.payload;
            if (updatedOrg && activeOrgRef.current?.id === updatedOrg.orgId) {
              setActiveOrg(prev => ({ ...prev, ...updatedOrg }));
            }
          })
          .on('broadcast', { event: 'worker-lock-all' }, (payload) => {
            const orgId = payload?.payload?.orgId;
            if (orgId && activeOrgRef.current?.id === orgId) {
              setCurrentUser(prev => {
                const nextUser = prev ? { ...prev, is_locked: payload.payload.is_locked, force_unlocked: payload.payload.force_unlocked } : prev;
                if (checkIsEffectivelyLocked(nextUser, activeOrgRef.current)) setLockModal(true);
                else setLockModal(false);
                return nextUser;
              });
            }
          })
          .on('broadcast', { event: 'org-working-hours' }, (payload) => {
            const orgId = payload?.payload?.orgId;
            if (orgId && activeOrgRef.current?.id === orgId) {
              setActiveOrg(prev => {
                const nextOrg = prev ? { ...prev, working_hours: payload.payload.working_hours } : prev;
                if (checkIsEffectivelyLocked(currentUserRef.current, nextOrg)) setLockModal(true);
                else setLockModal(false);
                return nextOrg;
              });
            }
          })
"""
# Need to replace the old listeners carefully.
# We'll use regex to replace from worker-lock-status to org-working-hours
pattern = r"\.on\('broadcast', \{ event: 'worker-lock-status' \}.*?(?=\.on\('broadcast', \{ event: 'org-working-days')"
d = re.sub(pattern, listeners.strip() + "\n          ", d, flags=re.DOTALL)

# 2. Rename isSendingChat to isChatSendingNow to DESTROY old React state and force cache bust
d = d.replace("isSendingChat", "isChatSendingNow")
d = d.replace("setIsSendingChat", "setIsChatSendingNow")

# 3. Just to be absolutely nuclear sure about the spinner, I will rip out ANY Loader2 inside the Send button.
# Replace {isChatSendingNow ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} with <Send size={18} />
d = d.replace("{isChatSendingNow ? <Loader2 size={18} className=\"animate-spin\" /> : <Send size={18} />}", "<Send size={18} />")
d = d.replace("{isChatSendingNow ? <Loader2 size={16} className=\"animate-spin\" /> : <Send size={16} />}", "<Send size={16} />")

with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(d)
print("Aggressive lock modal and nuclear spinner removal applied")

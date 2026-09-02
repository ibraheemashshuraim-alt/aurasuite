import re

with open('frontend/app/dashboard/page.js', 'r', encoding='utf-8') as f:
    d = f.read()

poller = """    // Robust Worker State Poller (Guarantees live lock/unlock and org hours sync)
    useEffect(() => {
      const int = setInterval(async () => {
        if (currentUserRef.current?.role !== 'worker') return;
        if (currentUserRef.current?.id) {
          const { data: userData } = await supabase.from('profiles').select('is_locked, force_unlocked').eq('id', currentUserRef.current.id).single();
          if (userData) {
            setCurrentUser(prev => {
              const nextUser = prev ? { ...prev, is_locked: userData.is_locked, force_unlocked: userData.force_unlocked } : prev;
              if (checkIsEffectivelyLocked(nextUser, activeOrgRef.current)) setLockModal(true);
              else setLockModal(false);
              return nextUser;
            });
          }
        }
        if (activeOrgRef.current?.id) {
          const { data: orgData } = await supabase.from('organizations').select('working_hours').eq('id', activeOrgRef.current.id).single();
          if (orgData) {
            setActiveOrg(prev => {
              const nextOrg = prev ? { ...prev, working_hours: orgData.working_hours } : prev;
              if (checkIsEffectivelyLocked(currentUserRef.current, nextOrg)) setLockModal(true);
              else setLockModal(false);
              return nextOrg;
            });
          }
        }
      }, 5000);
      return () => clearInterval(int);
    }, []);"""

d = re.sub(r'// Robust Worker State Poller.*?return \(\) => clearInterval\(int\);\n    \}, \[\]\);', poller.strip(), d, flags=re.DOTALL)

with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(d)
print("Updated poller to force lockModal")

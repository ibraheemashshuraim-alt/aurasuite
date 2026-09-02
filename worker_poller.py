import re

with open('frontend/app/dashboard/page.js', 'r', encoding='utf-8') as f:
    d = f.read()

# Add a robust worker state poller
worker_poller = """
    // Robust Worker State Poller (Guarantees live lock/unlock and org hours sync)
    useEffect(() => {
      if (currentUserRef.current?.role !== 'worker') return;
      const int = setInterval(async () => {
        if (currentUserRef.current?.id) {
          const { data: userData } = await supabase.from('profiles').select('is_locked, force_unlocked').eq('id', currentUserRef.current.id).single();
          if (userData) {
            setCurrentUser(prev => prev ? { ...prev, is_locked: userData.is_locked, force_unlocked: userData.force_unlocked } : prev);
          }
        }
        if (activeOrgRef.current?.id) {
          const { data: orgData } = await supabase.from('organizations').select('working_hours').eq('id', activeOrgRef.current.id).single();
          if (orgData) {
            setActiveOrg(prev => prev ? { ...prev, working_hours: orgData.working_hours } : prev);
          }
        }
      }, 5000);
      return () => clearInterval(int);
    }, []);
"""

d = d.replace("// Non-destructive chat poller", worker_poller + "\n    // Non-destructive chat poller")

with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(d)
print("Added robust worker state poller")

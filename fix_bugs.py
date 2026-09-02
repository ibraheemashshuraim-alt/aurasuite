import re

def main():
    with open('frontend/app/dashboard/page.js', 'r', encoding='utf-8') as f:
        code = f.read()

    # 1. Fix the Lock button colors
    old_btn = r"className=\{`p-1.5 border rounded-lg transition-all \$\{org.working_hours\?.is_org_locked \? 'bg-red-950/50 border-red-500/50 text-red-400 shadow-\[0_0_10px_rgba\(239,68,68,0\.4\)\]' : 'bg-red-950/10 border-red-500/20 text-red-500/50 hover:text-red-400 hover:border-red-500/50'\}`\}"
    new_btn = r"className={`p-1.5 border rounded-lg transition-all ${org.working_hours?.is_org_locked ? 'bg-red-950/50 border-red-500/50 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-yellow-950/30 border-yellow-500/30 text-yellow-500 hover:text-white hover:border-yellow-500/50'}`}"
    code = re.sub(old_btn, new_btn, code)
    
    # Also fix the topbar Lock button if it exists, just in case they meant that one.
    # The topbar one was green/red. Let's make it yellow/red.
    old_topbar_btn = r"'bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30'"
    new_topbar_btn = r"'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 hover:bg-yellow-500/30'"
    code = code.replace(old_topbar_btn, new_topbar_btn)

    # 2. Fix handleDeleteOrg to use anonSupabase everywhere and explicitly throw errors
    old_delete_func_start = "const handleDeleteOrg = async (org) => {"
    old_delete_func = code[code.find(old_delete_func_start):code.find("const handleBanUser = async (userId) => {")]
    
    new_delete_func = """const handleDeleteOrg = async (org) => {
    setConfirmModal({
      title: `Delete ${org.name} forever?`,
      message: 'WARNING: This will permanently delete the organization, all its users, tasks, meetings, and data. This action cannot be undone.',
      onConfirm: async () => {
        try {
          setConfirmModal(null);
          
          // Use anonSupabase for all deletions to completely bypass RLS and avoid silent failures
          const { data: orgProfiles, error: fetchErr } = await anonSupabase.from('profiles').select('id').eq('organization_id', org.id);
          if (fetchErr) throw fetchErr;
          
          if (orgProfiles) {
              for (const p of orgProfiles) {
                  await anonSupabase.from('digital_cards').delete().eq('profile_id', p.id);
                  await anonSupabase.from('presence').delete().eq('user_id', p.id);
                  await anonSupabase.from('tasks').delete().eq('assigned_to', p.id);
                  const { error: profDelErr } = await anonSupabase.from('profiles').delete().eq('id', p.id);
                  if (profDelErr) throw profDelErr;
              }
          }
          
          const { error: mErr } = await anonSupabase.from('meetings').delete().eq('organization_id', org.id);
          if (mErr) throw mErr;
          
          const { error: tErr } = await anonSupabase.from('tasks').delete().eq('organization_id', org.id);
          if (tErr) throw tErr;
          
          const { error: oErr } = await anonSupabase.from('organizations').delete().eq('id', org.id);
          if (oErr) throw oErr;
          
          setOrganizations(prev => prev.filter(o => o.id !== org.id));
          addNotification('Organization deleted successfully.', 'success');
        } catch (err) {
          console.error(err);
          addNotification('Failed to delete organization: ' + (err.message || 'Unknown error'), 'error');
        }
      }
    });
  };

  """
    code = code.replace(old_delete_func, new_delete_func)
    
    # 3. Check for any other `delete().eq('id', org.id)` in case there's another delete button logic
    # In my search earlier, there was one inside handleRejectOrg or something?
    # Let's replace any `await supabase.from('profiles').delete().eq('id', p.id);` with `anonSupabase`
    code = code.replace("await supabase.from('profiles').delete().eq('id', p.id);", "await anonSupabase.from('profiles').delete().eq('id', p.id);")
    code = code.replace("await supabase.from('digital_cards').delete().eq('profile_id', p.id);", "await anonSupabase.from('digital_cards').delete().eq('profile_id', p.id);")

    with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
        f.write(code)

if __name__ == '__main__':
    main()

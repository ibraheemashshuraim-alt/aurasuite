import re

with open('frontend/app/dashboard/page.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update the channel broadcast listener for 'org-updated'
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

# Let's fix the buttons block directly with regex
import re
# We want to replace `{activeOrgsTab === 'active' && (` up to `</button>\n                                  </>\n                                )}` inside the `td` of `Actions` column.

pattern = r"\{activeOrgsTab === 'active' && \(\s*<button onClick=\{\(\) => handleToggleOrgLock\(org\)\}.*?\{activeOrgsTab === 'active' \? \(\s*<>\s*<button onClick=\{\(\) => handleChangeOrgStatus\(org, 'suspended'\)\}.*?</>\s*\)\}"
# Wait, let's just use string replace for the parts we know.

part1 = r"""{activeOrgsTab === 'active' && (
                                  <button onClick={() => handleToggleOrgLock(org)} className={`p-1.5 border rounded-lg transition-all ${org.working_hours?.is_org_locked ? 'bg-red-950/50 border-red-500/50 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-yellow-950/30 border-yellow-500/30 text-yellow-500 hover:text-white hover:border-yellow-500/50'}`} title={org.working_hours?.is_org_locked ? 'Unlock Org' : 'Lock Org (Work in progress)'}>
                                    {org.working_hours?.is_org_locked ? <Lock size={14} /> : <Unlock size={14} />}
                                  </button>
                                )}"""

part2 = r"""{org.email !== 'ibraheemashshuraim@gmail.com' && activeOrgsTab === 'active' && (
                                  <button onClick={() => handleToggleOrgLock(org)} className={`p-1.5 border rounded-lg transition-all ${org.working_hours?.is_org_locked ? 'bg-red-950/50 border-red-500/50 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-yellow-950/30 border-yellow-500/30 text-yellow-500 hover:text-white hover:border-yellow-500/50'}`} title={org.working_hours?.is_org_locked ? 'Unlock Org' : 'Lock Org (Work in progress)'}>
                                    {org.working_hours?.is_org_locked ? <Lock size={14} /> : <Unlock size={14} />}
                                  </button>
                                )}"""

code = code.replace(part1, part2)

part3 = r"""{activeOrgsTab === 'active' ? ("""
part4 = r"""{org.email !== 'ibraheemashshuraim@gmail.com' && (activeOrgsTab === 'active' ? ("""
code = code.replace(part3, part4)

# But wait, there is a `)}` at the end of the block which needs to become `))}`
# Find the exact position of the Trash2 button and replace its closing
part5 = r"""<button onClick={() => handleDeleteOrg(org)} title="Delete Record" className="p-1.5 bg-red-950/30 border border-red-500/20 rounded-lg text-red-400 hover:text-white hover:border-red-500/50 transition-all"><Trash2 size={14} /></button>
                                    </>
                                  )}"""
part6 = r"""<button onClick={() => handleDeleteOrg(org)} title="Delete Record" className="p-1.5 bg-red-950/30 border border-red-500/20 rounded-lg text-red-400 hover:text-white hover:border-red-500/50 transition-all"><Trash2 size={14} /></button>
                                    </>
                                  ))}"""
code = code.replace(part5, part6)


with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Fixed dashboard")

import re

def main():
    with open('frontend/app/dashboard/page.js', 'r', encoding='utf-8') as f:
        code = f.read()

    # 1. Add states
    state_injection = """  const [activeOrgsTab, setActiveOrgsTab] = useState('active');
  const [viewOrgDetails, setViewOrgDetails] = useState(null);
"""
    if 'activeOrgsTab' not in code:
        code = code.replace("const [activeTab, setActiveTab] = useState('dashboard');", "const [activeTab, setActiveTab] = useState('dashboard');\n" + state_injection)

    # 2. Add Handlers (handleChangeOrgStatus, handleToggleOrgLock, handleDeleteOrg)
    handlers = """
  const handleChangeOrgStatus = async (org, newStatus) => {
    let title = '';
    let msg = '';
    if (newStatus === 'suspended') {
      title = 'Suspend Organization?';
      msg = 'This will immediately lock out all users (Admin, Workers, Clients) of this organization. You can reactivate them later.';
    } else if (newStatus === 'banned') {
      title = 'Ban Organization for 30 Days?';
      msg = 'This will ban the organization. They will be completely locked out. You can still reactivate them manually if needed.';
    } else if (newStatus === 'active') {
      title = 'Reactivate Organization?';
      msg = 'This will restore access to all users of this organization immediately.';
    }

    setConfirmModal({
      title,
      message: msg,
      onConfirm: async () => {
        try {
          await supabase.from('organizations').update({ status: newStatus }).eq('id', org.id);
          setOrganizations(prev => prev.map(o => o.id === org.id ? { ...o, status: newStatus } : o));
          
          if (kickoutChannelRef.current) {
            await kickoutChannelRef.current.send({
              type: 'broadcast',
              event: 'org-updated',
              payload: { orgId: org.id, status: newStatus }
            });
          }
          addNotification(`Organization status updated to ${newStatus}.`, 'success');
        } catch (err) {
          console.error(err);
          addNotification('Failed to update organization status.', 'error');
        }
      }
    });
  };

  const handleToggleOrgLock = async (org) => {
    const isLocked = org.working_hours?.is_org_locked;
    const newLockState = !isLocked;
    const title = newLockState ? 'Lock Organization (Work in Progress)?' : 'Unlock Organization?';
    const msg = newLockState ? 'This will lock out all users and show them a "Work in progress" screen.' : 'This will unlock the organization and restore normal access.';

    setConfirmModal({
      title,
      message: msg,
      onConfirm: async () => {
        try {
          const currentHours = org.working_hours || {};
          const newHours = { ...currentHours, is_org_locked: newLockState };
          
          await supabase.from('organizations').update({ working_hours: newHours }).eq('id', org.id);
          setOrganizations(prev => prev.map(o => o.id === org.id ? { ...o, working_hours: newHours } : o));
          
          if (kickoutChannelRef.current) {
            await kickoutChannelRef.current.send({
              type: 'broadcast',
              event: 'org-updated',
              payload: { orgId: org.id, working_hours: newHours }
            });
          }
          addNotification(newLockState ? 'Organization Locked.' : 'Organization Unlocked.', 'success');
        } catch (err) {
          console.error(err);
          addNotification('Failed to toggle lock.', 'error');
        }
      }
    });
  };

  const handleDeleteOrg = async (org) => {
    setConfirmModal({
      title: `Delete ${org.name} forever?`,
      message: 'WARNING: This will permanently delete the organization, all its users, tasks, meetings, and data. This action cannot be undone.',
      onConfirm: async () => {
        try {
          const { data: orgProfiles } = await supabase.from('profiles').select('id').eq('organization_id', org.id);
          if (orgProfiles) {
              for (const p of orgProfiles) {
                  await supabase.from('digital_cards').delete().eq('profile_id', p.id);
                  await supabase.from('presence').delete().eq('user_id', p.id);
                  await supabase.from('tasks').delete().eq('assigned_to', p.id);
                  await supabase.from('profiles').delete().eq('id', p.id);
              }
          }
          await supabase.from('meetings').delete().eq('organization_id', org.id);
          await supabase.from('tasks').delete().eq('organization_id', org.id);
          await supabase.from('organizations').delete().eq('id', org.id);
          setOrganizations(prev => prev.filter(o => o.id !== org.id));
          addNotification('Organization deleted successfully.', 'success');
        } catch (err) {
          console.error(err);
          addNotification('Failed to delete organization.', 'error');
        }
      }
    });
  };
"""
    if 'handleChangeOrgStatus' not in code:
        code = code.replace("const handleBanUser = async", handlers + "\n  const handleBanUser = async")

    # 3. Replace Active Orgs UI
    active_orgs_ui = """{activeTab === 'active_orgs' && currentUser?.role === 'super_admin' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20"><Server className="text-green-400" size={20} /></div>
                    Software Houses
                  </h2>
                </div>

                <div className="flex gap-4 mb-4 border-b border-purple-500/20 pb-2">
                  <button onClick={() => setActiveOrgsTab('active')} className={`pb-2 px-2 text-sm font-bold transition-all relative ${activeOrgsTab === 'active' ? 'text-green-400' : 'text-purple-400 hover:text-purple-300'}`}>
                    Active
                    {activeOrgsTab === 'active' && <div className="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-green-400 rounded-full" />}
                  </button>
                  <button onClick={() => setActiveOrgsTab('suspended')} className={`pb-2 px-2 text-sm font-bold transition-all relative ${activeOrgsTab === 'suspended' ? 'text-red-400' : 'text-purple-400 hover:text-purple-300'}`}>
                    Suspended & Banned
                    {activeOrgsTab === 'suspended' && <div className="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-red-400 rounded-full" />}
                  </button>
                </div>

                {organizations.filter(o => activeOrgsTab === 'active' ? (o.status === 'active' || !o.status) : (o.status === 'suspended' || o.status === 'banned')).length === 0 ? (
                  <div className="text-center py-20 bg-[#0f081c] border border-purple-500/10 rounded-3xl">
                    <Shield className={`mx-auto mb-4 ${activeOrgsTab === 'active' ? 'text-green-500/30' : 'text-red-500/30'}`} size={40} />
                    <h3 className="text-xl font-bold text-white mb-2">No {activeOrgsTab === 'active' ? 'Active' : 'Suspended/Banned'} Orgs</h3>
                  </div>
                ) : (
                  <div className="overflow-hidden bg-[#11081c] border border-purple-500/20 rounded-2xl shadow-lg">
                    <table className="w-full text-left text-sm text-purple-200">
                      <thead className="bg-[#1a0e2e] text-purple-300 text-xs uppercase font-bold">
                        <tr>
                          <th className="px-6 py-4">Software House</th>
                          <th className="px-6 py-4">Owner</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-500/10">
                        {organizations.filter(o => activeOrgsTab === 'active' ? (o.status === 'active' || !o.status) : (o.status === 'suspended' || o.status === 'banned')).map(org => (
                          <tr key={org.id} className="hover:bg-purple-900/10 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-bold text-white text-base">{org.name}</div>
                              <div className="text-xs text-purple-400 truncate max-w-[200px]">{org.email}</div>
                            </td>
                            <td className="px-6 py-4 font-medium text-white">{org.owner_name}</td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1 items-start">
                                {org.status === 'suspended' || org.status === 'banned' ? (
                                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-900/30 text-red-400 border border-red-500/20">{org.status}</span>
                                ) : (
                                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-green-900/30 text-green-400 border border-green-500/20">Active</span>
                                )}
                                {org.working_hours?.is_org_locked && (
                                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-yellow-900/30 text-yellow-400 border border-yellow-500/20 flex items-center gap-1"><Lock size={10}/> Locked</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => setViewOrgDetails(org)} className="px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 text-xs font-bold transition-colors">View Details</button>
                                
                                <button onClick={() => handleToggleOrgLock(org)} className={`p-1.5 border rounded-lg transition-all ${org.working_hours?.is_org_locked ? 'bg-yellow-950/50 border-yellow-500/50 text-yellow-400' : 'bg-yellow-950/10 border-yellow-500/20 text-yellow-500/50 hover:text-yellow-400 hover:border-yellow-500/50'}`} title={org.working_hours?.is_org_locked ? 'Unlock Org' : 'Lock Org (Work in progress)'}>
                                  {org.working_hours?.is_org_locked ? <Lock size={14} /> : <Unlock size={14} />}
                                </button>

                                {activeOrgsTab === 'active' ? (
                                  <>
                                    <button onClick={() => handleChangeOrgStatus(org, 'suspended')} title="Suspend" className="p-1.5 bg-orange-950/30 border border-orange-500/20 rounded-lg text-orange-400 hover:text-white hover:border-orange-500/50 transition-all"><UserMinus size={14} /></button>
                                    <button onClick={() => handleChangeOrgStatus(org, 'banned')} title="Ban (30 days)" className="p-1.5 bg-red-950/30 border border-red-500/20 rounded-lg text-red-400 hover:text-white hover:border-red-500/50 transition-all"><UserX size={14} /></button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => handleChangeOrgStatus(org, 'active')} title="Reactivate" className="p-1.5 bg-green-950/30 border border-green-500/20 rounded-lg text-green-400 hover:text-white hover:border-green-500/50 transition-all"><PlayCircle size={14} /></button>
                                    <button onClick={() => handleDeleteOrg(org)} title="Delete Forever" className="p-1.5 bg-red-950/30 border border-red-500/20 rounded-lg text-red-400 hover:text-white hover:border-red-500/50 transition-all"><Trash2 size={14} /></button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}"""
    
    # We will replace the entire block from {activeTab === 'active_orgs' ... } to just before {activeTab === 'admin_control'
    pattern = r"\{activeTab === 'active_orgs' && currentUser\?\.role === 'super_admin' && \(\s*<div.*?\{activeTab === 'admin_control'"
    code = re.sub(pattern, active_orgs_ui + "\n\n            {activeTab === 'admin_control'", code, flags=re.DOTALL)

    # 4. View Details Popup
    view_details_popup = """
      {/* Org View Details Popup */}
      {viewOrgDetails && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#11081c] border border-purple-500/30 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-purple-500/20 flex justify-between items-center bg-[#1a0e2e]">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><Server size={18} className="text-purple-400"/> Organization Details</h3>
              <button onClick={() => setViewOrgDetails(null)} className="text-purple-400 hover:text-white p-1 rounded-lg hover:bg-purple-900/50 transition-colors"><X size={20}/></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-900/10 p-4 rounded-xl border border-purple-500/10">
                  <p className="text-[10px] uppercase font-bold text-purple-400 mb-1">Software House Name</p>
                  <p className="text-white font-medium">{viewOrgDetails.name}</p>
                </div>
                <div className="bg-purple-900/10 p-4 rounded-xl border border-purple-500/10">
                  <p className="text-[10px] uppercase font-bold text-purple-400 mb-1">Owner Name</p>
                  <p className="text-white font-medium">{viewOrgDetails.owner_name}</p>
                </div>
                <div className="bg-purple-900/10 p-4 rounded-xl border border-purple-500/10">
                  <p className="text-[10px] uppercase font-bold text-purple-400 mb-1">Email</p>
                  <p className="text-white font-medium">{viewOrgDetails.email}</p>
                </div>
                <div className="bg-purple-900/10 p-4 rounded-xl border border-purple-500/10">
                  <p className="text-[10px] uppercase font-bold text-purple-400 mb-1">Phone</p>
                  <p className="text-white font-medium">{viewOrgDetails.phone}</p>
                </div>
                <div className="bg-purple-900/10 p-4 rounded-xl border border-purple-500/10">
                  <p className="text-[10px] uppercase font-bold text-purple-400 mb-1">CNIC</p>
                  <p className="text-white font-medium">{viewOrgDetails.working_hours?.cnic || 'N/A'}</p>
                </div>
                <div className="bg-purple-900/10 p-4 rounded-xl border border-purple-500/10">
                  <p className="text-[10px] uppercase font-bold text-purple-400 mb-1">City</p>
                  <p className="text-white font-medium">{viewOrgDetails.working_hours?.city || 'N/A'}</p>
                </div>
                <div className="bg-purple-900/10 p-4 rounded-xl border border-purple-500/10">
                  <p className="text-[10px] uppercase font-bold text-purple-400 mb-1">Team Size</p>
                  <p className="text-white font-medium">{viewOrgDetails.working_hours?.team_size || 'N/A'}</p>
                </div>
                <div className="bg-purple-900/10 p-4 rounded-xl border border-purple-500/10">
                  <p className="text-[10px] uppercase font-bold text-purple-400 mb-1">Business Type</p>
                  <p className="text-white font-medium uppercase">{viewOrgDetails.working_hours?.business_type || viewOrgDetails.type}</p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-purple-500/20 bg-black/20 flex justify-end">
              <button onClick={() => setViewOrgDetails(null)} className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-xl transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
"""
    # Insert right before the last closing tags of the component
    if "Org View Details Popup" not in code:
        code = code.replace("      {/* Logout Warning Popup */}", view_details_popup + "\n      {/* Logout Warning Popup */}")

    # 5. Lock/Suspend Live Enforcement for everyone EXCEPT super_admin
    live_enforcement = """
    // 🚨 ORG WIDE LOCK & SUSPEND ENFORCEMENT 🚨
    const isOrgSuspended = activeOrg?.status === 'suspended' || activeOrg?.status === 'banned';
    const isOrgLocked = activeOrg?.working_hours?.is_org_locked;

    if (currentUser && currentUser.role !== 'super_admin') {
      if (isOrgSuspended) {
        return (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/95 backdrop-blur-lg p-4">
            <div className="bg-slate-950 border-2 border-red-500/50 rounded-2xl p-8 max-w-md w-full text-center shadow-[0_0_50px_rgba(239,68,68,0.3)]">
              <div className="flex justify-center mb-6">
                 <ShieldAlert size={64} className="text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-pulse" />
              </div>
              <h2 className="text-3xl font-black text-white mb-4 tracking-wider">Access Revoked</h2>
              <p className="text-red-400 text-sm mb-8 leading-relaxed font-medium">Your organization's access to AuraSuite has been suspended or banned by the Super Admin. Please contact support for further details.</p>
              <button
                onClick={() => {
                  try { window.close(); } catch (e) {}
                  localStorage.removeItem("aura_session");
                  sessionStorage.removeItem("aura_session");
                  window.location.href = "/";
                }}
                className="w-full py-4 bg-red-950 hover:bg-red-900 text-white font-bold rounded-xl border border-red-500/30 transition-all uppercase tracking-widest"
              >
                Close Portal
              </button>
            </div>
          </div>
        );
      }
      if (isOrgLocked) {
        return (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <div className="bg-slate-900 border border-yellow-500/50 rounded-2xl p-8 max-w-md w-full text-center shadow-[0_0_30px_rgba(234,179,8,0.2)]">
              <div className="flex justify-center mb-6">
                 <Lock size={56} className="text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Access Locked</h2>
              <p className="text-yellow-400 text-sm mb-6 leading-relaxed">کوئی مسئلہ آیا ہے کام جاری ہے۔ کام مکمل ہوتے ہی اکاؤنٹ دوبارہ ایکٹیو کر دیا جائے گا۔<br/><br/>(Some issue has occurred, work is in progress. The account will be reactivated as soon as the work is complete.)</p>
              <button
                onClick={() => {
                  try { window.close(); } catch (e) {}
                  localStorage.removeItem("aura_session");
                  sessionStorage.removeItem("aura_session");
                  window.location.href = "/";
                }}
                className="px-8 py-3 bg-yellow-950/60 hover:bg-yellow-900/80 text-white font-semibold rounded-xl border border-yellow-500/30 transition-all"
              >
                Close Portal
              </button>
            </div>
          </div>
        );
      }
    }
"""
    if "ORG WIDE LOCK & SUSPEND ENFORCEMENT" not in code:
        code = code.replace("    // 🔒🔒🔒 LOCK MODAL OVERLAY 🔒🔒🔒", live_enforcement + "\n    // 🔒🔒🔒 LOCK MODAL OVERLAY 🔒🔒🔒")

    with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
        f.write(code)

if __name__ == '__main__':
    main()

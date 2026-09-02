import codecs

def main():
    with codecs.open('frontend/app/dashboard/page.js', 'r', 'utf-8') as f:
        code = f.read()

    # 1. Fix Confirm Modal NOT closing in Handlers
    # I need to add `setConfirmModal(null);` to all `onConfirm` in my handlers.
    if 'setConfirmModal(null)' not in code.split("handleChangeOrgStatus")[1][:500]:
        code = code.replace(
            "await supabase.from('organizations').update({ status: newStatus }).eq('id', org.id);",
            "setConfirmModal(null);\n          await supabase.from('organizations').update({ status: newStatus }).eq('id', org.id);"
        )
        code = code.replace(
            "const currentHours = org.working_hours || {};",
            "setConfirmModal(null);\n          const currentHours = org.working_hours || {};"
        )
        code = code.replace(
            "const { data: orgProfiles } = await supabase.from('profiles').select('id').eq('organization_id', org.id);",
            "setConfirmModal(null);\n          const { data: orgProfiles } = await supabase.from('profiles').select('id').eq('organization_id', org.id);"
        )

    # 2. Add View Details Popup
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
    if "Org View Details Popup" not in code:
        # Just insert it right before the final main closing div
        code = code.replace("    </main>", view_details_popup + "\n    </main>")

    # 3. Org-Wide Live Enforcement Popup
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
        code = code.replace("const isEffectivelyLocked = lockModal || checkIsEffectivelyLocked(currentUser, activeOrg);", live_enforcement + "\n    const isEffectivelyLocked = lockModal || checkIsEffectivelyLocked(currentUser, activeOrg);")


    # 4. Remove Lock icon from Suspended tab, and handle Ban timeout
    # When org.status === 'banned', we should disable Reactivate button and show a tooltip.
    # Currently:
    # <button onClick={() => handleChangeOrgStatus(org, 'active')} title="Reactivate" className="..."><PlayCircle size={14} /></button>
    old_reactivate = """<button onClick={() => handleChangeOrgStatus(org, 'active')} title="Reactivate" className="p-1.5 bg-green-950/30 border border-green-500/20 rounded-lg text-green-400 hover:text-white hover:border-green-500/50 transition-all"><PlayCircle size={14} /></button>"""
    
    new_reactivate = """{org.status === 'banned' ? (
                                      <button disabled title="Banned for 30 Days from date of ban" className="p-1.5 bg-gray-900 border border-gray-700 rounded-lg text-gray-500 cursor-not-allowed transition-all"><PlayCircle size={14} /></button>
                                    ) : (
                                      <button onClick={() => handleChangeOrgStatus(org, 'active')} title="Reactivate" className="p-1.5 bg-green-950/30 border border-green-500/20 rounded-lg text-green-400 hover:text-white hover:border-green-500/50 transition-all"><PlayCircle size={14} /></button>
                                    )}"""
    code = code.replace(old_reactivate, new_reactivate)

    # Currently:
    # <button onClick={() => handleToggleOrgLock(org)} className={`p-1.5 border rounded-lg transition-all ${org.working_hours?.is_org_locked ? 'bg-yellow-950/50 border-yellow-500/50 text-yellow-400' : 'bg-yellow-950/10 border-yellow-500/20 text-yellow-500/50 hover:text-yellow-400 hover:border-yellow-500/50'}`} title={org.working_hours?.is_org_locked ? 'Unlock Org' : 'Lock Org (Work in progress)'}>
    #   {org.working_hours?.is_org_locked ? <Lock size={14} /> : <Unlock size={14} />}
    # </button>
    old_lock = """<button onClick={() => handleToggleOrgLock(org)} className={`p-1.5 border rounded-lg transition-all ${org.working_hours?.is_org_locked ? 'bg-yellow-950/50 border-yellow-500/50 text-yellow-400' : 'bg-yellow-950/10 border-yellow-500/20 text-yellow-500/50 hover:text-yellow-400 hover:border-yellow-500/50'}`} title={org.working_hours?.is_org_locked ? 'Unlock Org' : 'Lock Org (Work in progress)'}>
                                  {org.working_hours?.is_org_locked ? <Lock size={14} /> : <Unlock size={14} />}
                                </button>"""
    
    new_lock = """{activeOrgsTab === 'active' && (
                                  <button onClick={() => handleToggleOrgLock(org)} className={`p-1.5 border rounded-lg transition-all ${org.working_hours?.is_org_locked ? 'bg-yellow-950/50 border-yellow-500/50 text-yellow-400' : 'bg-yellow-950/10 border-yellow-500/20 text-yellow-500/50 hover:text-yellow-400 hover:border-yellow-500/50'}`} title={org.working_hours?.is_org_locked ? 'Unlock Org' : 'Lock Org (Work in progress)'}>
                                    {org.working_hours?.is_org_locked ? <Lock size={14} /> : <Unlock size={14} />}
                                  </button>
                                )}"""
    code = code.replace(old_lock, new_lock)


    with codecs.open('frontend/app/dashboard/page.js', 'w', 'utf-8') as f:
        f.write(code)

if __name__ == '__main__':
    main()

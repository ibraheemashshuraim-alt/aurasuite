import re

def main():
    with open('frontend/app/dashboard/page.js', 'r', encoding='utf-8') as f:
        code = f.read()

    # Define UI
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

    # We will replace the entire block from {activeTab === 'active_orgs' ... } to just before {activeTab === 'dashboard'
    pattern = r"\{activeTab === 'active_orgs' && currentUser\?\.role === 'super_admin' && \(\s*<div.*?\{activeTab === 'dashboard'"
    code = re.sub(pattern, active_orgs_ui + "\n\n          {activeTab === 'dashboard'", code, flags=re.DOTALL)

    with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
        f.write(code)

if __name__ == '__main__':
    main()

import re
import os

def fix_file(filepath):
    if not os.path.exists(filepath):
        print(f"Not found: {filepath}")
        return
        
    with open(filepath, 'r', encoding='utf-8') as f:
        code = f.read()

    # 1. State for authBlockedByOrg
    if "const [authBlockedByOrg, setAuthBlockedByOrg] = useState(false);" not in code:
        code = code.replace("const [kickoutModal, setKickoutModal] = useState(false);", 
                            "const [kickoutModal, setKickoutModal] = useState(false);\n  const [authBlockedByOrg, setAuthBlockedByOrg] = useState(false);")
                            
    # 2. Add Edit Org State
    if "const [editOrgData, setEditOrgData] = useState(null);" not in code:
        code = code.replace("const [viewOrgDetails, setViewOrgDetails] = useState(null);",
                            "const [viewOrgDetails, setViewOrgDetails] = useState(null);\n  const [editOrgData, setEditOrgData] = useState(null);")

    # 3. Update the `isOrgSuspended` logic to also check `authBlockedByOrg`
    old_susp_block = """  if (currentUser && currentUser.role !== 'super_admin') {
    if (isOrgSuspended) {"""
    new_susp_block = """  if ((currentUser && currentUser.role !== 'super_admin' && isOrgSuspended) || authBlockedByOrg) {
    if (true) {"""
    code = code.replace(old_susp_block, new_susp_block)

    # 4. Update `cardParam` parsing
    old_card_param = """        if (cardParam && userParam) {
          setAuthCardNumber(cardParam);
          setAuthUsername(userParam);
          setLoginMode('worker');
          supabase.from('digital_cards').select('is_revoked').eq('card_number', cardParam).eq('username', userParam).maybeSingle().then(({data}) => { if (data?.is_revoked) setKickoutModal(true); });
        }"""
    
    new_card_param = """        if (cardParam && userParam) {
          setAuthCardNumber(cardParam);
          setAuthUsername(userParam);
          setLoginMode('worker');
          supabase.from('digital_cards').select('is_revoked, organization_id').eq('card_number', cardParam).eq('username', userParam).maybeSingle().then(({data}) => { 
            if (data?.is_revoked) setKickoutModal(true); 
            else if (data?.organization_id) {
              supabase.from('organizations').select('status').eq('id', data.organization_id).single().then(({data: orgData}) => {
                if (orgData?.status === 'suspended' || orgData?.status === 'banned') {
                  setAuthBlockedByOrg(true);
                }
              });
            }
          });
        }"""
    code = code.replace(old_card_param, new_card_param)

    # 5. Fix Active Orgs mapping and conditional buttons
    old_map = "{organizations.filter(o => activeOrgsTab === 'active' ? (o.status === 'active' || !o.status) : (o.status === 'suspended' || o.status === 'banned')).map(org => ("
    new_map = """{organizations.filter(o => activeOrgsTab === 'active' ? (o.status === 'active' || !o.status) : (o.status === 'suspended' || o.status === 'banned')).sort((a, b) => {
                          const isSuperA = a.email === 'ibraheemashshuraim@gmail.com';
                          const isSuperB = b.email === 'ibraheemashshuraim@gmail.com';
                          if (isSuperA && !isSuperB) return -1;
                          if (!isSuperA && isSuperB) return 1;
                          return 0;
                        }).map(org => ("""
    code = code.replace(old_map, new_map)

    # We need to hide action buttons for super org.
    old_btns = """                                {activeOrgsTab === 'active' && (
                                  <button onClick={() => handleToggleOrgLock(org)} className={`p-1.5 border rounded-lg transition-all ${org.working_hours?.is_org_locked ? 'bg-red-950/50 border-red-500/50 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-yellow-950/30 border-yellow-500/30 text-yellow-500 hover:text-white hover:border-yellow-500/50'}`} title={org.working_hours?.is_org_locked ? 'Unlock Org' : 'Lock Org (Work in progress)'}>
                                    {org.working_hours?.is_org_locked ? <Lock size={14} /> : <Unlock size={14} />}
                                  </button>
                                )}

                                {activeOrgsTab === 'active' ? (
                                  <>
                                    <button onClick={() => handleChangeOrgStatus(org, 'suspended')} title="Suspend" className="p-1.5 bg-orange-950/30 border border-orange-500/20 rounded-lg text-orange-400 hover:text-white hover:border-orange-500/50 transition-all"><UserMinus size={14} /></button>
                                    <button onClick={() => handleChangeOrgStatus(org, 'banned')} title="Ban (30 days)" className="p-1.5 bg-red-950/30 border border-red-500/20 rounded-lg text-red-400 hover:text-white hover:border-red-500/50 transition-all"><UserX size={14} /></button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => handleChangeOrgStatus(org, 'active')} title="Reactivate" className="p-1.5 bg-green-950/30 border border-green-500/20 rounded-lg text-green-400 hover:text-white hover:border-green-500/50 transition-all"><UserCheck size={14} /></button>
                                    <button onClick={() => handleDeleteOrg(org)} title="Delete Record" className="p-1.5 bg-red-950/30 border border-red-500/20 rounded-lg text-red-400 hover:text-white hover:border-red-500/50 transition-all"><Trash2 size={14} /></button>
                                  </>
                                )}"""
                                
    new_btns = """                                {org.email !== 'ibraheemashshuraim@gmail.com' && activeOrgsTab === 'active' && (
                                  <button onClick={() => handleToggleOrgLock(org)} className={`p-1.5 border rounded-lg transition-all ${org.working_hours?.is_org_locked ? 'bg-red-950/50 border-red-500/50 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-yellow-950/30 border-yellow-500/30 text-yellow-500 hover:text-white hover:border-yellow-500/50'}`} title={org.working_hours?.is_org_locked ? 'Unlock Org' : 'Lock Org (Work in progress)'}>
                                    {org.working_hours?.is_org_locked ? <Lock size={14} /> : <Unlock size={14} />}
                                  </button>
                                )}

                                {org.email !== 'ibraheemashshuraim@gmail.com' && (activeOrgsTab === 'active' ? (
                                  <>
                                    <button onClick={() => handleChangeOrgStatus(org, 'suspended')} title="Suspend" className="p-1.5 bg-orange-950/30 border border-orange-500/20 rounded-lg text-orange-400 hover:text-white hover:border-orange-500/50 transition-all"><UserMinus size={14} /></button>
                                    <button onClick={() => handleChangeOrgStatus(org, 'banned')} title="Ban (30 days)" className="p-1.5 bg-red-950/30 border border-red-500/20 rounded-lg text-red-400 hover:text-white hover:border-red-500/50 transition-all"><UserX size={14} /></button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => handleChangeOrgStatus(org, 'active')} title="Reactivate" className="p-1.5 bg-green-950/30 border border-green-500/20 rounded-lg text-green-400 hover:text-white hover:border-green-500/50 transition-all"><UserCheck size={14} /></button>
                                    <button onClick={() => handleDeleteOrg(org)} title="Delete Record" className="p-1.5 bg-red-950/30 border border-red-500/20 rounded-lg text-red-400 hover:text-white hover:border-red-500/50 transition-all"><Trash2 size={14} /></button>
                                  </>
                                ))}"""
    code = code.replace(old_btns, new_btns)

    # 6. Replace View Details Modal with Editable version
    old_modal_start = "{/* Org View Details Popup */}"
    old_modal_end = "  </main>"
    
    if old_modal_start in code:
        parts = code.split(old_modal_start)
        pre = parts[0]
        try:
            post = parts[1].split(old_modal_end, 1)[1]
        except IndexError:
            # fallback if it's not "  </main>"
            post = parts[1].split("</main>", 1)[1]
            old_modal_end = "</main>"
        
        new_modal = """{/* Org View Details Popup */}
      {viewOrgDetails && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#11081c] border border-purple-500/30 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-purple-500/20 flex justify-between items-center bg-[#1a0e2e]">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><Server size={18} className="text-purple-400"/> Organization Details</h3>
              <div className="flex items-center gap-2">
                {!editOrgData ? (
                  <button onClick={() => setEditOrgData({
                    name: viewOrgDetails.name || '',
                    owner_name: viewOrgDetails.owner_name || '',
                    email: viewOrgDetails.email || '',
                    phone: viewOrgDetails.phone || '',
                    cnic: viewOrgDetails.working_hours?.cnic || '',
                    city: viewOrgDetails.working_hours?.city || '',
                    team_size: viewOrgDetails.working_hours?.team_size || '',
                    business_type: viewOrgDetails.working_hours?.business_type || viewOrgDetails.type || ''
                  })} className="px-3 py-1 bg-purple-600/20 text-purple-400 hover:bg-purple-600/40 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"><Edit3 size={12}/> Edit</button>
                ) : (
                  <button onClick={async () => {
                    const newWH = { ...viewOrgDetails.working_hours, cnic: editOrgData.cnic, city: editOrgData.city, team_size: editOrgData.team_size, business_type: editOrgData.business_type };
                    const updatePayload = { name: editOrgData.name, owner_name: editOrgData.owner_name, email: editOrgData.email, phone: editOrgData.phone, working_hours: newWH };
                    const { error } = await anonSupabase.from('organizations').update(updatePayload).eq('id', viewOrgDetails.id);
                    if (error) { alert('Failed to update details: ' + error.message); return; }
                    const updatedOrg = { ...viewOrgDetails, ...updatePayload };
                    setOrganizations(prev => prev.map(o => o.id === updatedOrg.id ? updatedOrg : o));
                    setViewOrgDetails(updatedOrg);
                    setEditOrgData(null);
                    addNotification('Organization details updated successfully.', 'success');
                  }} className="px-3 py-1 bg-green-500/20 text-green-400 hover:bg-green-500/40 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"><Check size={12}/> Save</button>
                )}
                <button onClick={() => { setViewOrgDetails(null); setEditOrgData(null); }} className="text-purple-400 hover:text-white p-1 rounded-lg hover:bg-purple-900/50 transition-colors"><X size={20}/></button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-900/10 p-4 rounded-xl border border-purple-500/10">
                  <p className="text-[10px] uppercase font-bold text-purple-400 mb-1">Software House Name</p>
                  {editOrgData ? <input className="w-full bg-black/30 border border-purple-500/30 rounded p-1 text-white text-sm" value={editOrgData.name} onChange={e => setEditOrgData({...editOrgData, name: e.target.value})} /> : <p className="text-white font-medium">{viewOrgDetails.name}</p>}
                </div>
                <div className="bg-purple-900/10 p-4 rounded-xl border border-purple-500/10">
                  <p className="text-[10px] uppercase font-bold text-purple-400 mb-1">Owner Name</p>
                  {editOrgData ? <input className="w-full bg-black/30 border border-purple-500/30 rounded p-1 text-white text-sm" value={editOrgData.owner_name} onChange={e => setEditOrgData({...editOrgData, owner_name: e.target.value})} /> : <p className="text-white font-medium">{viewOrgDetails.owner_name || 'N/A'}</p>}
                </div>
                <div className="bg-purple-900/10 p-4 rounded-xl border border-purple-500/10">
                  <p className="text-[10px] uppercase font-bold text-purple-400 mb-1">Email</p>
                  {editOrgData ? <input className="w-full bg-black/30 border border-purple-500/30 rounded p-1 text-white text-sm" value={editOrgData.email} onChange={e => setEditOrgData({...editOrgData, email: e.target.value})} /> : <p className="text-white font-medium">{viewOrgDetails.email}</p>}
                </div>
                <div className="bg-purple-900/10 p-4 rounded-xl border border-purple-500/10">
                  <p className="text-[10px] uppercase font-bold text-purple-400 mb-1">Phone</p>
                  {editOrgData ? <input className="w-full bg-black/30 border border-purple-500/30 rounded p-1 text-white text-sm" value={editOrgData.phone} onChange={e => setEditOrgData({...editOrgData, phone: e.target.value})} /> : <p className="text-white font-medium">{viewOrgDetails.phone || 'N/A'}</p>}
                </div>
                <div className="bg-purple-900/10 p-4 rounded-xl border border-purple-500/10">
                  <p className="text-[10px] uppercase font-bold text-purple-400 mb-1">CNIC</p>
                  {editOrgData ? <input className="w-full bg-black/30 border border-purple-500/30 rounded p-1 text-white text-sm" value={editOrgData.cnic} onChange={e => setEditOrgData({...editOrgData, cnic: e.target.value})} /> : <p className="text-white font-medium">{viewOrgDetails.working_hours?.cnic || 'N/A'}</p>}
                </div>
                <div className="bg-purple-900/10 p-4 rounded-xl border border-purple-500/10">
                  <p className="text-[10px] uppercase font-bold text-purple-400 mb-1">City</p>
                  {editOrgData ? <input className="w-full bg-black/30 border border-purple-500/30 rounded p-1 text-white text-sm" value={editOrgData.city} onChange={e => setEditOrgData({...editOrgData, city: e.target.value})} /> : <p className="text-white font-medium">{viewOrgDetails.working_hours?.city || 'N/A'}</p>}
                </div>
                <div className="bg-purple-900/10 p-4 rounded-xl border border-purple-500/10">
                  <p className="text-[10px] uppercase font-bold text-purple-400 mb-1">Team Size</p>
                  {editOrgData ? <input className="w-full bg-black/30 border border-purple-500/30 rounded p-1 text-white text-sm" value={editOrgData.team_size} onChange={e => setEditOrgData({...editOrgData, team_size: e.target.value})} /> : <p className="text-white font-medium">{viewOrgDetails.working_hours?.team_size || 'N/A'}</p>}
                </div>
                <div className="bg-purple-900/10 p-4 rounded-xl border border-purple-500/10">
                  <p className="text-[10px] uppercase font-bold text-purple-400 mb-1">Business Type</p>
                  {editOrgData ? <input className="w-full bg-black/30 border border-purple-500/30 rounded p-1 text-white text-sm uppercase" value={editOrgData.business_type} onChange={e => setEditOrgData({...editOrgData, business_type: e.target.value})} /> : <p className="text-white font-medium uppercase">{viewOrgDetails.working_hours?.business_type || viewOrgDetails.type || 'N/A'}</p>}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-purple-500/20 bg-black/20 flex justify-end">
              <button onClick={() => { setViewOrgDetails(null); setEditOrgData(null); }} className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-xl transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
""" + old_modal_end + post
        code = pre + new_modal
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Fixed {filepath}")

fix_file('frontend/app/dashboard/page.js')
fix_file('frontend/app/login/page.js')

import re

with open('inject_client.py', 'r', encoding='utf8') as f:
    text = f.read()

# Extract tabs_append from inject_client.py
# We can just define the tabs directly here.

tabs_append = """
            {/* ═══════ PROJECT PREVIEW TAB ═══════ */}
            {activeTab === 'project_preview' && (
              <div className="glass-panel rounded-2xl border border-purple-500/10 overflow-hidden w-full" style={{ height: 'calc(100vh - 160px)' }}>
                {clientProjects.find(p => p.client_id === currentUser?.id)?.preview_url ? (
                  <iframe src={clientProjects.find(p => p.client_id === currentUser?.id).preview_url} className="w-full h-full border-none" title="Project Preview" sandbox="allow-scripts allow-same-origin allow-forms" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-purple-500/50">
                    <Globe size={48} className="mb-4 opacity-50" />
                    <p>No preview link provided by the admin yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* ═══════ DELIVERABLES TAB ═══════ */}
            {activeTab === 'deliverables' && (
              <div className="space-y-5">
                <div className="glass-panel p-5 rounded-2xl border border-purple-500/10">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><CheckCircle size={16} className="text-purple-400" /> Review & Milestone Approvals</h3>
                  <div className="space-y-3">
                    {clientMilestones.filter(m => m.project_id === clientProjects.find(p => p.client_id === currentUser?.id)?.id).length === 0 ? (
                      <p className="text-xs text-blue-400">No milestones yet.</p>
                    ) : (
                      clientMilestones.filter(m => m.project_id === clientProjects.find(p => p.client_id === currentUser?.id)?.id).map(mile => (
                        <div key={mile.id} className="flex justify-between items-center bg-[#150d24] p-4 rounded-xl border border-purple-500/20">
                          <div>
                            <h4 className="text-white font-bold">{mile.title}</h4>
                            <p className="text-[10px] text-purple-300 mt-1">Status: {mile.status.toUpperCase()}</p>
                          </div>
                          <div className="flex gap-2">
                            {mile.status === 'review' && (
                              <>
                                <button className="px-3 py-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold hover:bg-emerald-600/40"
                                  onClick={() => supabase.from('client_milestones').update({status: 'approved'}).eq('id', mile.id).then(()=>setClientMilestones(prev=>prev.map(m=>m.id===mile.id?{...m,status:'approved'}:m)))}>Approve</button>
                                <button className="px-3 py-1.5 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold hover:bg-red-600/40"
                                  onClick={() => supabase.from('client_milestones').update({status: 'revision_requested'}).eq('id', mile.id).then(()=>setClientMilestones(prev=>prev.map(m=>m.id===mile.id?{...m,status:'revision_requested'}:m)))}>Request Revision</button>
                              </>
                            )}
                            {mile.status === 'approved' && <span className="text-emerald-400 text-xs font-bold flex items-center gap-1"><CheckCircle size={12}/> Approved</span>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-blue-500/10">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><FileText size={16} className="text-blue-400" /> Requirements & Deliverables Hub</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {clientDeliverables.filter(d => d.project_id === clientProjects.find(p => p.client_id === currentUser?.id)?.id).length === 0 ? (
                      <p className="text-xs text-blue-400">No deliverables uploaded.</p>
                    ) : (
                      clientDeliverables.filter(d => d.project_id === clientProjects.find(p => p.client_id === currentUser?.id)?.id).map(del => (
                        <div key={del.id} className="bg-[#120a1f] p-4 rounded-xl border border-blue-500/20 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <FileText className="text-blue-400" size={24} />
                            <div>
                              <h4 className="text-white text-xs font-bold">{del.title}</h4>
                              <p className="text-[10px] text-blue-200/50 mt-0.5">{del.file_size} • {new Date(del.uploaded_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <a href={del.file_url} download target="_blank" rel="noreferrer" className="text-blue-400 hover:text-white p-2 bg-blue-900/30 rounded-lg transition-colors"><Globe size={14}/></a>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ═══════ INVOICES TAB ═══════ */}
            {activeTab === 'client_invoices' && (
              <div className="space-y-5">
                <div className="glass-panel p-5 rounded-2xl border border-red-500/10">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2"><CreditCard size={16} className="text-red-400" /> Outstanding Balance</h3>
                      <div className="text-3xl font-bold text-red-400 mt-2">Rs. {clientInvoices.filter(i => i.project_id === clientProjects.find(p => p.client_id === currentUser?.id)?.id && i.status === 'unpaid').reduce((s, i) => s + i.amount, 0).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-purple-500/20">
                          <th className="px-4 py-3 text-purple-400 uppercase tracking-wide">ID</th>
                          <th className="px-4 py-3 text-purple-400 uppercase tracking-wide">Due Date</th>
                          <th className="px-4 py-3 text-purple-400 uppercase tracking-wide">Amount</th>
                          <th className="px-4 py-3 text-purple-400 uppercase tracking-wide">Status</th>
                          <th className="px-4 py-3 text-purple-400 uppercase tracking-wide">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientInvoices.filter(i => i.project_id === clientProjects.find(p => p.client_id === currentUser?.id)?.id).map(inv => (
                          <tr key={inv.id} className="border-b border-purple-500/10">
                            <td className="px-4 py-3 text-white font-mono">{inv.id.slice(-6).toUpperCase()}</td>
                            <td className="px-4 py-3 text-purple-200">{new Date(inv.due_date).toLocaleDateString()}</td>
                            <td className="px-4 py-3 font-bold text-white">Rs. {inv.amount.toLocaleString()}</td>
                            <td className="px-4 py-3">
                              {inv.status === 'paid' ? <span className="text-emerald-400 font-bold px-2 py-1 bg-emerald-950/30 rounded-lg uppercase">Paid</span> : <span className="text-red-400 font-bold px-2 py-1 bg-red-950/30 rounded-lg uppercase">Unpaid</span>}
                            </td>
                            <td className="px-4 py-3">
                              {inv.pdf_url && <a href={inv.pdf_url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:text-white px-3 py-1.5 border border-blue-500/30 rounded-lg bg-blue-950/30 font-bold inline-block">Download PDF</a>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════ CLIENT MANAGEMENT (ADMIN) ═══════ */}
            {activeTab === 'client_mgmt' && (
              <div className="space-y-5">
                <div className="glass-panel p-5 rounded-2xl border border-purple-500/10">
                  <h3 className="text-sm font-bold text-white mb-4">Client Projects Overview</h3>
                  {orgUsers.filter(u => u.role === 'client').map(client => {
                    const proj = clientProjects.find(p => p.client_id === client.id) || { status: 'none', overall_progress: 0 };
                    return (
                      <div key={client.id} className="mb-4 p-4 bg-[#150d24] border border-purple-500/20 rounded-xl">
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <h4 className="text-white font-bold">{client.full_name}</h4>
                            <p className="text-xs text-purple-400">{client.email}</p>
                          </div>
                          <div className="flex gap-2 items-center">
                            <select value={proj.status} onChange={(e) => {
                                if (proj.status === 'none') {
                                    const newProj = { id: genId('proj'), client_id: client.id, organization_id: activeOrg.id, status: e.target.value, overall_progress: 0 };
                                    supabase.from('client_projects').insert(newProj).then(() => setClientProjects([...clientProjects, newProj]));
                                } else {
                                    supabase.from('client_projects').update({ status: e.target.value }).eq('id', proj.id).then(() => setClientProjects(prev => prev.map(p => p.id === proj.id ? { ...p, status: e.target.value } : p)));
                                }
                            }} className="bg-purple-950/40 border border-purple-500/30 rounded-lg px-2 py-1 text-xs text-white">
                              <option value="none">No Project</option>
                              <option value="active">Active</option>
                              <option value="on_hold">On Hold</option>
                              <option value="review">Review</option>
                              <option value="completed">Completed</option>
                            </select>
                          </div>
                        </div>
                        {proj.status !== 'none' && (
                          <div className="space-y-4 pt-4 border-t border-purple-500/10">
                            <div>
                                <label className="text-xs text-purple-300">Preview URL (Iframe Sandbox)</label>
                                <div className="flex gap-2 mt-1">
                                    <input type="text" defaultValue={proj.preview_url || ''} onBlur={(e) => {
                                        supabase.from('client_projects').update({ preview_url: e.target.value }).eq('id', proj.id).then(() => setClientProjects(prev => prev.map(p => p.id === proj.id ? { ...p, preview_url: e.target.value } : p)));
                                    }} className="flex-1 bg-[#0f081c] border border-purple-500/20 p-2 rounded-lg text-xs text-white" placeholder="https://..." />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h5 className="text-xs font-bold text-white mb-2">Milestones</h5>
                                    <button onClick={() => {
                                        const title = prompt('Milestone Title:');
                                        if (title) {
                                            const newM = { id: genId('mile'), project_id: proj.id, title, progress: 50, status: 'review' };
                                            supabase.from('client_milestones').insert(newM).then(() => setClientMilestones([...clientMilestones, newM]));
                                        }
                                    }} className="px-3 py-1.5 bg-purple-600/20 text-purple-300 text-xs rounded-lg border border-purple-500/30">+ Add Milestone</button>
                                </div>
                                <div>
                                    <h5 className="text-xs font-bold text-white mb-2">Invoices</h5>
                                    <button onClick={() => {
                                        const amt = prompt('Invoice Amount (PKR):');
                                        if (amt && !isNaN(parseInt(amt))) {
                                            const newI = { id: genId('inv'), project_id: proj.id, amount: parseInt(amt), status: 'unpaid', due_date: new Date().toISOString() };
                                            supabase.from('client_invoices').insert(newI).then(() => setClientInvoices([...clientInvoices, newI]));
                                        }
                                    }} className="px-3 py-1.5 bg-blue-600/20 text-blue-300 text-xs rounded-lg border border-blue-500/30">+ Create Invoice</button>
                                </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
"""

for filepath in ['frontend/app/dashboard/page.js', 'frontend/app/login/page.js']:
    with open(filepath, 'r', encoding='utf8') as f:
        code = f.read()

    # 1. DELETE the dummy CLIENT VIEW from the dashboard
    dummy_regex = r"\{\/\* CLIENT VIEW \*\/\}.*?(?=\{\/\* FACTORY MANAGER VIEW \*\/})"
    code = re.sub(dummy_regex, "", code, flags=re.DOTALL)

    # 2. Inject the tabs if not already present
    if "PROJECT PREVIEW TAB" not in code:
        # Regex to find Org View Details Popup more resiliently
        popup_regex = r"\{\/\*\s*Org View Details Popup\s*\*\/\}"
        code = re.sub(popup_regex, lambda m: tabs_append + "\n" + m.group(0), code)
        print(f"Injected tabs into {filepath}")
    else:
        print(f"Tabs already exist in {filepath}")

    with open(filepath, 'w', encoding='utf8') as f:
        f.write(code)

print("Done patching.")

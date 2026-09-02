import re
import os

filepath = 'frontend/app/login/page.js'

with open(filepath, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. State hooks
state_injection = """
  const [clientProjects, setClientProjects] = useState([]);
  const [clientMilestones, setClientMilestones] = useState([]);
  const [clientDeliverables, setClientDeliverables] = useState([]);
  const [clientInvoices, setClientInvoices] = useState([]);
"""
if "const [clientProjects" not in code:
    code = code.replace("const [tasks, setTasks] = useState([]);", "const [tasks, setTasks] = useState([]);" + state_injection)


# 2. loadAll Injection
loadall_old = """const [orgs, profs, tsk, meets, scheds, msgs, invites, mStates, fin, bans] = await Promise.all(["""
loadall_new = """const [orgs, profs, tsk, meets, scheds, msgs, invites, mStates, fin, bans, cProj, cMile, cDel, cInv] = await Promise.all(["""
code = code.replace(loadall_old, loadall_new)

promise_old = """supabase.from('banned_emails').select('*'),
          ]);"""
promise_new = """supabase.from('banned_emails').select('*'),
            supabase.from('client_projects').select('*'),
            supabase.from('client_milestones').select('*'),
            supabase.from('client_deliverables').select('*'),
            supabase.from('client_invoices').select('*'),
          ]);"""
code = code.replace(promise_old, promise_new)

setter_old = """if (bans.data) setBannedEmails(bans.data);"""
setter_new = """if (bans.data) setBannedEmails(bans.data);
          if (cProj?.data) setClientProjects(cProj.data);
          if (cMile?.data) setClientMilestones(cMile.data);
          if (cDel?.data) setClientDeliverables(cDel.data);
          if (cInv?.data) setClientInvoices(cInv.data);"""
code = code.replace(setter_old, setter_new)

# 3. Sidebar tabs
sidebar_target = """{ id: 'chat', icon: <MessageSquare size={15} />, label: 'Team Chat' },"""
sidebar_new = """{ id: 'chat', icon: <MessageSquare size={15} />, label: 'Team Chat', hideForClient: true },
              { id: 'client_chat', icon: <MessageSquare size={15} />, label: 'Admin Chat (DM)', clientOnly: true },
              { id: 'project_preview', icon: <Globe size={15} />, label: 'Project Preview', clientOnly: true },
              { id: 'deliverables', icon: <FileText size={15} />, label: 'Deliverables', clientOnly: true },
              { id: 'client_invoices', icon: <CreditCard size={15} />, label: 'Invoices', clientOnly: true },
              { id: 'client_mgmt', icon: <Star size={15} />, label: 'Client Management', adminOnly: true },"""
code = code.replace(sidebar_target, sidebar_new)

filter_target = """if (item.hideForClient && currentUser.role === 'client') return false;"""
filter_new = """if (item.hideForClient && currentUser.role === 'client') return false;
              if (item.clientOnly && currentUser.role !== 'client') return false;"""
code = code.replace(filter_target, filter_new)

# 4. DM Chat filter
dm_target = """orgMembers.filter(u => u.role !== 'deleted' && u.role !== 'pending_worker' && u.role !== 'suspended')"""
dm_new = """orgMembers.filter(u => u.role !== 'deleted' && u.role !== 'pending_worker' && u.role !== 'suspended' && (currentUser?.role !== 'client' || ['admin', 'super_admin', 'sub_admin'].includes(u.role)))"""
code = code.replace(dm_target, dm_new)

# 5. Hide Group chat for client in Chat Tab (we actually use the same 'chat' UI for 'client_chat', let's map 'client_chat' to 'chat' behavior)
# Wait, if we use 'client_chat' in sidebar, clicking it sets activeTab='client_chat'.
# Let's just make the existing chat block render for both.
chat_tab_target = """{activeTab === 'chat' && ("""
chat_tab_new = """{(activeTab === 'chat' || activeTab === 'client_chat') && ("""
code = code.replace(chat_tab_target, chat_tab_new)

group_chat_target = """{/* Group Chat */}
                      <button onClick={openGroupChat}"""
group_chat_new = """{/* Group Chat */}
                      {currentUser?.role !== 'client' && (
                      <button onClick={openGroupChat}"""
group_chat_end_target = """</span>
                      </button>
                      <div className="px-4 py-2">"""
group_chat_end_new = """</span>
                      </button>
                      )}
                      <div className="px-4 py-2">"""
code = code.replace(group_chat_target, group_chat_new)
code = code.replace(group_chat_end_target, group_chat_end_new)

# 6. Meeting Scheduling filter
meet_target = """orgUsers.filter(u => u.id !== currentUser.id && u.role !== 'suspended' && u.role !== 'deleted').map(user => ("""
meet_new = """orgUsers.filter(u => u.id !== currentUser.id && u.role !== 'suspended' && u.role !== 'deleted' && (currentUser?.role !== 'client' || ['admin', 'super_admin', 'sub_admin'].includes(u.role))).map(user => ("""
code = code.replace(meet_target, meet_new)

# 7. Render new tabs at the end of the content area
# Replace the CLIENT VIEW in dashboard
client_view_regex = r"\{\/\* CLIENT VIEW \*\/}.*?(?=\{\/\* ═══════ SCHEDULES TAB ═══════ \*\/})"
client_view_replacement = """{/* CLIENT VIEW IN DASHBOARD */}
              {currentUser.role === 'client' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="glass-panel p-5 rounded-2xl border border-yellow-500/20">
                      <div className="flex items-center gap-2 mb-2"><Activity size={16} className="text-yellow-400" /><h3 className="font-bold text-white text-sm">Project Radar</h3></div>
                      <div className="text-3xl font-bold text-yellow-400 mt-2">{clientProjects.find(p => p.client_id === currentUser.id)?.status?.replace('_', ' ')?.toUpperCase() || 'NO PROJECT'}</div>
                      <p className="text-xs text-yellow-200/50 mt-1">Real-time status.</p>
                    </div>
                    <div className="glass-panel p-5 rounded-2xl border border-purple-500/20">
                      <div className="flex items-center gap-2 mb-2"><Globe size={16} className="text-purple-400" /><h3 className="font-bold text-white text-sm">Overall Progress</h3></div>
                      <div className="text-3xl font-bold text-purple-400 mt-2">{clientProjects.find(p => p.client_id === currentUser.id)?.overall_progress || 0}%</div>
                      <p className="text-xs text-purple-200/50 mt-1">Development completion.</p>
                    </div>
                    <div className="glass-panel p-5 rounded-2xl border border-emerald-500/20">
                      <div className="flex items-center gap-2 mb-2"><CheckCircle size={16} className="text-emerald-400" /><h3 className="font-bold text-white text-sm">Milestones</h3></div>
                      <div className="text-3xl font-bold text-emerald-400 mt-2">{clientMilestones.filter(m => m.project_id === clientProjects.find(p => p.client_id === currentUser.id)?.id && m.status === 'approved').length}</div>
                      <p className="text-xs text-emerald-200/50 mt-1">Approved by you.</p>
                    </div>
                  </div>
                </div>
              )}
              """
code = re.sub(client_view_regex, client_view_replacement, code, flags=re.DOTALL)


# Append new tabs right before the end of the tabs area
# We search for:
#           </div>
#     
#         {/* Org View Details Popup */}

tabs_append = """

            {/*  ? ? ? ? ? ? ? PROJECT PREVIEW TAB  ? ? ? ? ? ? ? */}
            {activeTab === 'project_preview' && (
              <div className="glass-panel rounded-2xl border border-purple-500/10 overflow-hidden w-full" style={{ height: 'calc(100vh - 160px)' }}>
                {clientProjects.find(p => p.client_id === currentUser.id)?.preview_url ? (
                  <iframe src={clientProjects.find(p => p.client_id === currentUser.id).preview_url} className="w-full h-full border-none" title="Project Preview" sandbox="allow-scripts allow-same-origin allow-forms" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-purple-500/50">
                    <Globe size={48} className="mb-4 opacity-50" />
                    <p>No preview link provided by the admin yet.</p>
                  </div>
                )}
              </div>
            )}

            {/*  ? ? ? ? ? ? ? DELIVERABLES TAB  ? ? ? ? ? ? ? */}
            {activeTab === 'deliverables' && (
              <div className="space-y-5">
                <div className="glass-panel p-5 rounded-2xl border border-purple-500/10">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><CheckCircle size={16} className="text-purple-400" /> Review & Milestone Approvals</h3>
                  <div className="space-y-3">
                    {clientMilestones.filter(m => m.project_id === clientProjects.find(p => p.client_id === currentUser.id)?.id).length === 0 ? (
                      <p className="text-xs text-purple-400">No milestones set for your project yet.</p>
                    ) : clientMilestones.filter(m => m.project_id === clientProjects.find(p => p.client_id === currentUser.id)?.id).map(m => (
                      <div key={m.id} className="p-4 bg-[#120a1f] border border-purple-500/20 rounded-xl flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-white">{m.title}</h4>
                          <p className="text-[10px] text-purple-300">Status: <span className="font-bold text-purple-400 uppercase">{m.status}</span></p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs font-bold text-purple-400 mr-4">{m.progress}% Completed</div>
                          {m.status === 'review' && (
                            <>
                              <button onClick={async () => {
                                await supabase.from('client_milestones').update({ status: 'approved' }).eq('id', m.id);
                                setClientMilestones(prev => prev.map(p => p.id === m.id ? { ...p, status: 'approved' } : p));
                              }} className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 rounded-lg text-xs font-bold border border-emerald-500/30">Approve</button>
                              <button onClick={() => {
                                const feedback = prompt('Enter your revision feedback:');
                                if (feedback) {
                                  supabase.from('client_milestones').update({ status: 'revision_requested', feedback }).eq('id', m.id).then(() => {
                                    setClientMilestones(prev => prev.map(p => p.id === m.id ? { ...p, status: 'revision_requested', feedback } : p));
                                  });
                                }
                              }} className="px-3 py-1.5 bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-400 rounded-lg text-xs font-bold border border-yellow-500/30">Request Revision</button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-blue-500/10">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><FileText size={16} className="text-blue-400" /> Requirements & Deliverables Hub</h3>
                  <div className="space-y-3">
                    {clientDeliverables.filter(d => d.project_id === clientProjects.find(p => p.client_id === currentUser.id)?.id).length === 0 ? (
                      <p className="text-xs text-blue-400">No deliverables uploaded.</p>
                    ) : clientDeliverables.filter(d => d.project_id === clientProjects.find(p => p.client_id === currentUser.id)?.id).map(d => (
                      <div key={d.id} className="p-3 bg-[#0a121f] border border-blue-500/20 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText size={16} className="text-blue-400" />
                          <span className="text-xs font-bold text-white">{d.title}</span>
                          <span className="text-[9px] px-2 py-0.5 rounded-md bg-blue-900/40 text-blue-300 uppercase">{d.type}</span>
                        </div>
                        <a href={d.file_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-white font-bold px-3 py-1 bg-blue-900/30 rounded-lg">Download</a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/*  ? ? ? ? ? ? ? INVOICES TAB  ? ? ? ? ? ? ? */}
            {activeTab === 'client_invoices' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="glass-panel p-5 rounded-2xl border border-red-500/20">
                    <div className="flex items-center gap-2 mb-2"><CreditCard size={16} className="text-red-400" /><h3 className="font-bold text-white text-sm">Outstanding Balance</h3></div>
                    <div className="text-3xl font-bold text-red-400 mt-2">Rs. {clientInvoices.filter(i => i.project_id === clientProjects.find(p => p.client_id === currentUser.id)?.id && i.status === 'unpaid').reduce((s, i) => s + i.amount, 0).toLocaleString()}</div>
                  </div>
                  <div className="glass-panel p-5 rounded-2xl border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-2"><CheckCircle size={16} className="text-emerald-400" /><h3 className="font-bold text-white text-sm">Total Paid</h3></div>
                    <div className="text-3xl font-bold text-emerald-400 mt-2">Rs. {clientInvoices.filter(i => i.project_id === clientProjects.find(p => p.client_id === currentUser.id)?.id && i.status === 'paid').reduce((s, i) => s + i.amount, 0).toLocaleString()}</div>
                  </div>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-purple-500/10">
                  <h3 className="text-sm font-bold text-white mb-4">Invoice History</h3>
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
                        {clientInvoices.filter(i => i.project_id === clientProjects.find(p => p.client_id === currentUser.id)?.id).map(inv => (
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

            {/*  ? ? ? ? ? ? ? CLIENT MANAGEMENT (ADMIN)  ? ? ? ? ? ? ? */}
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
target = """          </div>
    
        {/* Org View Details Popup */}"""
code = code.replace(target, tabs_append + target)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(code)
print("Injected successfully")

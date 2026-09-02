import re

def enhance_client_mgmt(filepath):
    with open(filepath, 'r', encoding='utf8') as f:
        code = f.read()

    # The block we want to replace starts after `Preview URL` input and ends at the closing `</div>` of `grid-cols-3`
    
    # Let's find the `grid grid-cols-1 md:grid-cols-3 gap-3` block.
    # It starts with: `<div className="grid grid-cols-1 md:grid-cols-3 gap-3">`
    # We will replace it with a new version that includes the lists.
    
    search_pattern = r'<div className="grid grid-cols-1 md:grid-cols-3 gap-3">.*?</div>\s*</div>\s*</div>\s*\)\}'
    
    replacement = """<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="bg-[#120a1f] p-3 rounded-xl border border-purple-500/20 flex flex-col h-[250px]">
                                <h5 className="text-[10px] uppercase font-bold text-purple-400 mb-2 shrink-0">Milestones</h5>
                                <div className="flex-1 overflow-y-auto mb-2 space-y-1.5 pr-1">
                                  {clientMilestones.filter(m => m.project_id === proj.id).map(m => (
                                    <div key={m.id} className="flex justify-between items-center bg-purple-900/10 border border-purple-500/20 p-2 rounded-lg">
                                      <span className="text-[10px] text-white truncate">{m.title}</span>
                                      <button onClick={() => {
                                        supabase.from('client_milestones').delete().eq('id', m.id).then(() => setClientMilestones(prev => prev.filter(x => x.id !== m.id)));
                                      }} className="text-red-400 hover:text-red-300 ml-2"><Trash2 size={10} /></button>
                                    </div>
                                  ))}
                                </div>
                                <button onClick={() => {
                                  const title = prompt('Milestone Title:');
                                  if (title) {
                                    const newM = { id: genId('mile'), project_id: proj.id, title, progress: 50, status: 'review' };
                                    supabase.from('client_milestones').insert(newM).then(() => setClientMilestones([...clientMilestones, newM]));
                                  }
                                }} className="w-full px-3 py-2 bg-purple-600/20 text-purple-300 text-[10px] rounded-lg border border-purple-500/30 hover:bg-purple-600/40 transition-colors shrink-0">+ Add Milestone</button>
                              </div>
                              <div className="bg-[#120a1f] p-3 rounded-xl border border-blue-500/20 flex flex-col h-[250px]">
                                <h5 className="text-[10px] uppercase font-bold text-blue-400 mb-2 shrink-0">Deliverables</h5>
                                <div className="flex-1 overflow-y-auto mb-2 space-y-1.5 pr-1">
                                  {clientDeliverables.filter(d => d.project_id === proj.id).map(d => (
                                    <div key={d.id} className="flex justify-between items-center bg-blue-900/10 border border-blue-500/20 p-2 rounded-lg">
                                      <span className="text-[10px] text-white truncate">{d.title}</span>
                                      <button onClick={() => {
                                        supabase.from('client_deliverables').delete().eq('id', d.id).then(() => setClientDeliverables(prev => prev.filter(x => x.id !== d.id)));
                                      }} className="text-red-400 hover:text-red-300 ml-2"><Trash2 size={10} /></button>
                                    </div>
                                  ))}
                                </div>
                                <button onClick={() => {
                                  const title = prompt('Deliverable Title:');
                                  if (!title) return;
                                  const url = prompt('Deliverable File URL:');
                                  if (!url) return;
                                  const newD = { id: genId('del'), project_id: proj.id, title, file_url: url, file_size: 'External Link', uploaded_at: new Date().toISOString() };
                                  supabase.from('client_deliverables').insert(newD).then(() => setClientDeliverables([...clientDeliverables, newD]));
                                }} className="w-full px-3 py-2 bg-blue-600/20 text-blue-300 text-[10px] rounded-lg border border-blue-500/30 hover:bg-blue-600/40 transition-colors shrink-0">+ Add Deliverable</button>
                              </div>
                              <div className="bg-[#120a1f] p-3 rounded-xl border border-red-500/20 flex flex-col h-[250px]">
                                <h5 className="text-[10px] uppercase font-bold text-red-400 mb-2 shrink-0">Invoices</h5>
                                <div className="flex-1 overflow-y-auto mb-2 space-y-1.5 pr-1">
                                  {clientInvoices.filter(i => i.project_id === proj.id).map(i => (
                                    <div key={i.id} className="flex justify-between items-center bg-red-900/10 border border-red-500/20 p-2 rounded-lg">
                                      <span className="text-[10px] text-white truncate">Rs. {i.amount.toLocaleString()}</span>
                                      <button onClick={() => {
                                        supabase.from('client_invoices').delete().eq('id', i.id).then(() => setClientInvoices(prev => prev.filter(x => x.id !== i.id)));
                                      }} className="text-red-400 hover:text-red-300 ml-2"><Trash2 size={10} /></button>
                                    </div>
                                  ))}
                                </div>
                                <button onClick={() => {
                                  const amt = prompt('Invoice Amount (PKR):');
                                  if (amt && !isNaN(parseInt(amt))) {
                                    const newI = { id: genId('inv'), project_id: proj.id, amount: parseInt(amt), status: 'unpaid', due_date: new Date().toISOString() };
                                    supabase.from('client_invoices').insert(newI).then(() => setClientInvoices([...clientInvoices, newI]));
                                  }
                                }} className="w-full px-3 py-2 bg-red-600/20 text-red-300 text-[10px] rounded-lg border border-red-500/30 hover:bg-red-600/40 transition-colors shrink-0">+ Create Invoice</button>
                              </div>
                            </div>
                          </div>
                        )}"""

    if re.search(search_pattern, code, re.DOTALL):
        code = re.sub(search_pattern, replacement, code, flags=re.DOTALL)
        with open(filepath, 'w', encoding='utf8') as f:
            f.write(code)
        print(f"Enhanced {filepath}")
    else:
        print(f"Pattern not found in {filepath}")

enhance_client_mgmt('frontend/app/dashboard/page.js')
enhance_client_mgmt('frontend/app/login/page.js')

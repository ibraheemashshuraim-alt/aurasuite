import re

replacement = """                      {proj.status !== 'none' && (
                        <div className="space-y-4 pt-4 border-t border-purple-500/10">
                          <div>
                            <label className="text-xs text-purple-300">Preview URL (Iframe Sandbox)</label>
                            <input type="text" defaultValue={proj.preview_url || ''} onBlur={(e) => {
                              supabase.from('client_projects').update({ preview_url: normalizeExternalUrl(e.target.value) }).eq('id', proj.id).then(() => setClientProjects(prev => prev.map(p => p.id === proj.id ? { ...p, preview_url: normalizeExternalUrl(e.target.value) } : p)));
                            }} className="w-full mt-1 bg-[#0f081c] border border-purple-500/20 p-2 rounded-lg text-xs text-white" placeholder="https://..." />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="bg-[#120a1f] p-3 rounded-xl border border-purple-500/20">
                              <h5 className="text-[10px] uppercase font-bold text-purple-400 mb-2">Milestones</h5>
                              <button onClick={() => {
                                const title = prompt('Milestone Title:');
                                if (title) {
                                  const newM = { id: genId('mile'), project_id: proj.id, title, progress: 50, status: 'review' };
                                  supabase.from('client_milestones').insert(newM).then(() => setClientMilestones([...clientMilestones, newM]));
                                }
                              }} className="w-full px-3 py-2 bg-purple-600/20 text-purple-300 text-[10px] rounded-lg border border-purple-500/30 hover:bg-purple-600/40 transition-colors">+ Add Milestone</button>
                            </div>
                            <div className="bg-[#120a1f] p-3 rounded-xl border border-blue-500/20">
                              <h5 className="text-[10px] uppercase font-bold text-blue-400 mb-2">Deliverables</h5>
                              <button onClick={() => {
                                const title = prompt('Deliverable Title:');
                                if (!title) return;
                                const url = prompt('Deliverable File URL:');
                                if (!url) return;
                                const newD = { id: genId('del'), project_id: proj.id, title, file_url: url, file_size: 'External Link', uploaded_at: new Date().toISOString() };
                                supabase.from('client_deliverables').insert(newD).then(() => setClientDeliverables([...clientDeliverables, newD]));
                              }} className="w-full px-3 py-2 bg-blue-600/20 text-blue-300 text-[10px] rounded-lg border border-blue-500/30 hover:bg-blue-600/40 transition-colors">+ Add Deliverable</button>
                            </div>
                            <div className="bg-[#120a1f] p-3 rounded-xl border border-red-500/20">
                              <h5 className="text-[10px] uppercase font-bold text-red-400 mb-2">Invoices</h5>
                              <button onClick={() => {
                                const amt = prompt('Invoice Amount (PKR):');
                                if (amt && !isNaN(parseInt(amt))) {
                                  const newI = { id: genId('inv'), project_id: proj.id, amount: parseInt(amt), status: 'unpaid', due_date: new Date().toISOString() };
                                  supabase.from('client_invoices').insert(newI).then(() => setClientInvoices([...clientInvoices, newI]));
                                }
                              }} className="w-full px-3 py-2 bg-red-600/20 text-red-300 text-[10px] rounded-lg border border-red-500/30 hover:bg-red-600/40 transition-colors">+ Create Invoice</button>
                            </div>
                          </div>
                        </div>
                      )}"""

with open('frontend/app/dashboard/page.js', 'r', encoding='utf8') as f:
    code = f.read()

# For dashboard, we match from `{proj.status !== 'none'` down to `+ Create Invoice</button>\n                                </div>\n                            </div>\n                          </div>\n                        )}`
search_regex = r"\{\s*proj\.status !== 'none' && \(\s*<div className=\"space-y-4 pt-4 border-t border-purple-500/10\">.*?Create Invoice<\/button>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\}"

if re.search(search_regex, code, re.DOTALL):
    code = re.sub(search_regex, replacement, code, flags=re.DOTALL)
    with open('frontend/app/dashboard/page.js', 'w', encoding='utf8') as f:
        f.write(code)
    print("Injected into dashboard/page.js")
else:
    print("Could not find target in dashboard/page.js")


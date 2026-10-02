import sys

block = """
                      {task.status === 'ACTION_REQUIRED' && (
                        <div className="mt-2 bg-yellow-900/30 border border-yellow-500/30 p-2 rounded text-[10px]">
                          <div className="text-yellow-400 font-bold mb-1">Approval Required</div>
                          <div className="text-yellow-200 mb-2">The AI agent wants to execute a computer action that requires your permission.</div>
                          {task.error && <div className="bg-black/50 p-1 mb-2 text-gray-300 font-mono text-[9px]">{task.error}</div>}
                          <div className="flex gap-2 justify-end mt-2">
                             <button 
                               onClick={async () => {
                                  try {
                                    // Normally we would get the exact planText from the DB or error msg, 
                                    // but we can just fetch the pending plan for this task
                                    const { data: session } = await supabase.auth.getSession();
                                    
                                    // Quick fetch of the plan
                                    const { data: plans } = await supabase.from('engine_action_plans')
                                      .select('actions').eq('task_id', task.id).order('created_at', { ascending: false }).limit(1);
                                      
                                    let planText = JSON.stringify({ actions: [] });
                                    if (plans && plans.length > 0) {
                                      planText = JSON.stringify({ actions: plans[0].actions });
                                    }

                                    await fetch('/api/engine/action-plan/approve', {
                                      method: 'POST',
                                      headers: { 
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${session.session?.access_token}`
                                      },
                                      body: JSON.stringify({ taskId: task.id, orgId: currentUser.organization_id, agentId: task.assigned_agent_id, decision: 'APPROVE', planText })
                                    });
                                  } catch (err) { console.error(err); }
                               }}
                               className="bg-green-600/80 hover:bg-green-500 text-white px-3 py-1 rounded transition-colors"
                             >
                               Approve
                             </button>
                             <button 
                               onClick={async () => {
                                  try {
                                    const { data: session } = await supabase.auth.getSession();
                                    await fetch('/api/engine/action-plan/approve', {
                                      method: 'POST',
                                      headers: { 
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${session.session?.access_token}`
                                      },
                                      body: JSON.stringify({ taskId: task.id, orgId: currentUser.organization_id, agentId: task.assigned_agent_id, decision: 'REJECT' })
                                    });
                                  } catch (err) { console.error(err); }
                               }}
                               className="bg-red-600/80 hover:bg-red-500 text-white px-3 py-1 rounded transition-colors"
                             >
                               Reject
                             </button>
                          </div>
                        </div>
                      )}
"""

with open('frontend/components/AgentTown.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

start = -1
for i, line in enumerate(lines):
    if "{task.error && <div className=\"text-red-400 mt-1\">" in line:
        start = i
        break

if start != -1:
    lines.insert(start, block + "\n")
    with open('frontend/components/AgentTown.js', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("Added approval UI to AgentTown!")
else:
    print("Not found target line!")

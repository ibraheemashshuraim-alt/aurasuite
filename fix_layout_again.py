import re

def fix_layout(filepath):
    with open(filepath, 'r', encoding='utf8') as f:
        code = f.read()

    # The goal is to clean up everything between ADMIN QUICK VIEW and CLIENT VIEW IN DASHBOARD
    
    start_marker = "{/* ADMIN QUICK VIEW */}"
    end_marker = "{/* CLIENT VIEW IN DASHBOARD */}"
    
    if start_marker in code and end_marker in code:
        start_idx = code.find(start_marker)
        end_idx = code.find(end_marker)
        
        replacement = """{/* ADMIN QUICK VIEW */}
                {['admin', 'super_admin', 'sub_admin'].includes(currentUser?.role) && (
                  <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { label: 'Total Members', value: orgUsers.length, icon: <Users size={16} />, sub: `${orgUsers.filter(u => u.role === 'worker').length} workers, ${orgUsers.filter(u => u.role === 'client').length} clients` },
                        { label: 'Online Now', value: orgUsers.filter(u => onlineUsers.includes(u.id)).length, icon: <Activity size={16} />, sub: 'Active sessions' },
                        { label: 'Live Meetings', value: orgMeetings.length, icon: <Video size={16} />, sub: 'Active channels' },
                        { label: 'Tasks Active', value: tasks.filter(t => t.status !== 'done').length, icon: <Clock size={16} />, sub: `${tasks.filter(t => t.status === 'done').length} completed` },
                      ].map(s => (
                        <div key={s.label} className="glass-panel p-4 rounded-2xl border border-purple-500/10">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-purple-400">{s.icon}</span>
                            <span className="text-2xl font-bold text-white">{s.value}</span>
                          </div>
                          <div className="text-[10px] text-purple-400 uppercase font-bold tracking-wide">{s.label}</div>
                          <div className="text-[10px] text-purple-600 mt-0.5">{s.sub}</div>
                        </div>
                      ))}
                    </div>
                    
                    {/* AGENT TOWN & VOICE ASSISTANT */}
                    <AgentTown currentUser={currentUser} />
                  </>
                )}

                """
        
        code = code[:start_idx] + replacement + code[end_idx:]
        
        with open(filepath, 'w', encoding='utf8') as f:
            f.write(code)
        print(f"Fixed {filepath}")

fix_layout('frontend/app/dashboard/page.js')
fix_layout('frontend/app/login/page.js')

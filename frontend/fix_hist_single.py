import sys

block = """
                engineTasks.map(task => (
                  <div key={task.id} className="bg-black/40 border border-purple-500/20 rounded-lg p-3 group">
                    <div className="flex justify-between items-start mb-1">
                      <div className="text-xs font-bold text-purple-200">{task.title}</div>
                      <div className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${getStatusColor(task.status)} ${task.status==='PENDING'?'text-black':'text-white'}`}>
                        {task.status}
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2 text-[10px] text-purple-400">
                      <span>{task.agents?.name || 'Unassigned'}</span>
                      <span>{new Date(task.created_at).toLocaleTimeString()}</span>
                    </div>
                    
                    {/* Phase 2C Details - Expandable on hover or always visible concisely */}
                    <div className="mt-2 pt-2 border-t border-purple-500/20 text-[9px] text-purple-300 space-y-1">
                      {task.started_at && <div><span className="opacity-50">Started:</span> {new Date(task.started_at).toLocaleTimeString()}</div>}
                      {task.completed_at && <div><span className="opacity-50">Completed:</span> {new Date(task.completed_at).toLocaleTimeString()}</div>}
                      {task.error && <div className="text-red-400 mt-1"><span className="opacity-50 text-purple-300">Error:</span> {task.error}</div>}
                      {task.result && (
                        <div className="mt-1 bg-[#1a1129] p-1.5 rounded border border-purple-500/10 max-h-24 overflow-y-auto custom-scrollbar">
                          <span className="opacity-50 block mb-0.5">Result:</span>
                          <div className="whitespace-pre-wrap">{task.result}</div>
                        </div>
                      )}
                      <div className="flex justify-end mt-2">
                         <a href={`/api/engine/logs?taskId=${task.id}`} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-white underline opacity-70 hover:opacity-100 flex items-center gap-1">
                           View Execution Logs
                         </a>
                      </div>
                    </div>
                  </div>
                ))
"""

with open('components/AgentTown.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

start = -1
end = -1
for i, line in enumerate(lines):
    if "engineTasks.map(task => (" in line:
        start = i
    if start != -1 and "))" in line and i > start:
        end = i
        break

if start != -1 and end != -1:
    new_lines = lines[:start] + [block + "\n"] + lines[end+1:]
    with open('components/AgentTown.js', 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print("Replaced properly!")
else:
    print("Not found!")

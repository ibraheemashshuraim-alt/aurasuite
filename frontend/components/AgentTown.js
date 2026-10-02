'use client';

import React, { useState, useEffect } from 'react';
import { X, Keyboard, Mic, Plus, Share2, Users, Settings, Activity, Sparkles, List } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { dispatchAgentTask, createEngineTask, getEngineAgents, getEngineTasks, executeEngineTaskClient } from '../lib/agentClient';

export default function AgentTown({ currentUser }) {
  if (!currentUser || !['admin', 'super_admin', 'sub_admin'].includes(currentUser.role)) {
    return null;
  }

  // Live Agent States from Supabase Realtime
  const [agentStates, setAgentStates] = useState({
    Saima: { state: 'idle', thought: 'Analyzing...' },
    Dani: { state: 'idle', thought: 'Fixing bugs' },
    Mianzi: { state: 'idle', thought: 'Printing...' },
    Zohaib: { state: 'idle', thought: 'Need coffee...' },
  });

  const [voiceInput, setVoiceInput] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [activeTaskBanner, setActiveTaskBanner] = useState('');
  
  // Phase 2A Engine States
  const [engineAgents, setEngineAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [showTaskHistory, setShowTaskHistory] = useState(false);
  const [engineTasks, setEngineTasks] = useState([]);

  // Load Phase 2A Agents and Tasks
  useEffect(() => {
    if (currentUser?.organization_id) {
      getEngineAgents(currentUser.organization_id).then(res => {
        if (res.agents) {
          setEngineAgents(res.agents);
          if (res.agents.length > 0) setSelectedAgentId(res.agents[0].id);
        }
      });
      loadTasks();
    }
  }, [currentUser?.organization_id]);

  const loadTasks = async () => {
    if (!currentUser?.organization_id) return;
    const res = await getEngineTasks(currentUser.organization_id);
    if (res.tasks) setEngineTasks(res.tasks);
  };



  // Phase 2C Realtime Supabase Subscription for Engine Tasks
  useEffect(() => {
    if (!currentUser?.organization_id) return;

    loadTasks(); // Initial load

    const channel = supabase
      .channel(`agent_town_sync_${currentUser.organization_id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'engine_tasks', filter: `organization_id=eq.${currentUser.organization_id}` },
        () => {
          loadTasks(); // reload tasks on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.organization_id]);



  // Phase 2C: Derive visual agent states from the real AI task engine
  useEffect(() => {
    const newStates = {
      Saima: { state: 'idle', thought: 'Analyzing...' },
      Dani: { state: 'idle', thought: 'Fixing bugs' },
      Mianzi: { state: 'idle', thought: 'Printing...' },
      Zohaib: { state: 'idle', thought: 'Need coffee...' },
    };

    // Process from oldest to newest, so the newest state overrides
    const sorted = [...engineTasks].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    sorted.forEach(task => {
      const charName = task.agents?.character_name;
      if (!charName) return;

      const statusMap = {
        'PENDING': 'idle',
        'RUNNING': 'thinking',
        'VERIFYING': 'researching',
        'VERIFIED': 'completed',
        'FAILED': 'failed',
        'COMPLETED': 'completed'
      };
      
      const st = statusMap[task.status] || 'idle';
      
      if (['PENDING', 'RUNNING', 'VERIFYING'].includes(task.status)) {
        newStates[charName] = { state: st, thought: task.status === 'VERIFYING' ? 'Verifying output...' : 'Task: ' + task.title };
      } else {
        // If it's a finished task, keep them idle unless we want a specific message
        if (task.status === 'FAILED') newStates[charName] = { state: 'error', thought: 'Failed: ' + (task.error ? task.error.slice(0, 15) : 'Error') };
        else if (task.status === 'VERIFIED') newStates[charName] = { state: 'idle', thought: 'Ready for work' };
      }
    });

    setAgentStates(newStates);
  }, [engineTasks]);


  // Handle voice assistant prompt submission or direct Dispatch Task click
  const handleAssistantSubmit = async (e) => {
    e?.preventDefault();
    if (isDispatching) return;

    const promptText = voiceInput.trim() || 'Analyze market trends and draft initial growth strategy';
    setVoiceInput('');
    setIsDispatching(true);
    setActiveTaskBanner(`Dispatching: "${promptText.slice(0, 42)}..." to Orchestrator...`);

    const orgId = currentUser?.organization_id || 'org-aurasuite-superadmin';
    const userName = currentUser?.full_name || 'Admin';

    try {
      // Phase 2A: Create Task in Task Engine
      const tRes = await createEngineTask({
        organization_id: orgId,
        title: promptText.slice(0, 50),
        prompt: promptText,
        assigned_agent_id: selectedAgentId || null,
        priority: 'MEDIUM',
        created_by: currentUser?.id
      });
      setActiveTaskBanner('Task dispatched to Phase 2A Engine! Status: PENDING');
      
      // Phase 2B: Trigger Real AI Execution (Async, does not block UI)
      if (tRes && tRes.task && tRes.task.id) {
         executeEngineTaskClient(tRes.task.id).catch(e => console.error("Real AI Execution failed", e));
      }
      
      // Phase 1 Legacy pipeline trigger (keeps UI animating!)
      await dispatchAgentTask({
        orgId,
        agentCodeName: 'researcher', // Visual mapping
        title: promptText,
        inputPayload: { prompt: promptText, initiated_by: userName },
      });
      
    } catch (err) {
      console.error('Failed to dispatch agent task:', err);
      setActiveTaskBanner(`Dispatch notice: ${err.message}`);
    } finally {
      setIsDispatching(false);
    }
  };

  const getStatusColor = (state) => {
    switch (state?.toLowerCase()) {
      case 'pending': return 'bg-yellow-500';
      case 'thinking': return 'bg-amber-400 animate-pulse';
      case 'researching': return 'bg-orange-400 animate-pulse';
      case 'running':
      case 'creating': return 'bg-blue-400 animate-pulse';
      case 'generating': return 'bg-purple-400 animate-pulse';
      case 'verifying': return 'bg-indigo-400 animate-pulse';
      case 'completed': return 'bg-emerald-400';
      case 'failed': return 'bg-red-400';
      case 'cancelled': return 'bg-gray-400';
      default: return 'bg-green-500';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
      {/* Agent Town Panel */}
      <div className="lg:col-span-2 glass-panel rounded-2xl border border-purple-500/20 flex flex-col overflow-hidden relative">
        <div className="flex justify-between items-center p-3 border-b border-purple-500/10 bg-[#0f081c]/80 backdrop-blur z-10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <h3 className="font-bold text-white text-sm whitespace-nowrap">Agent Town</h3>
          </div>
          <div className="text-[10px] text-purple-400 hidden sm:block truncate ml-2">
            {activeTaskBanner || 'Live AI Autonomous Team Workspace'}
          </div>
          <button className="text-purple-400 hover:text-white ml-auto"><X size={14} /></button>
        </div>
        
        <div className="flex-1 bg-[#1a1b26] relative overflow-hidden h-[400px] w-full group">
          <div className="absolute inset-0 bg-[#1a1b26]">
              <img src="/agent-town-map-clean.png" alt="Agent Town Map" className="w-full h-full object-cover opacity-90 mix-blend-lighten pointer-events-none" />
          </div>
          
          <div className="absolute w-[4.5%] h-[8%] bg-[#2d3142] z-10" style={{ left: '33.8%', top: '42%' }}>
             <div className="w-full h-full bg-[#d97736] border-2 border-[#944d1f] origin-left animate-[doorOpenLeft_20s_infinite]"></div>
          </div>
          <div className="absolute w-[4.5%] h-[8%] bg-[#2d3142] z-10" style={{ left: '74.5%', top: '42%' }}>
             <div className="w-full h-full bg-[#d97736] border-2 border-[#944d1f] origin-left animate-[doorOpenRight_20s_infinite]"></div>
          </div>
          
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(139,92,246,0.1)_1px,transparent_1px)]" style={{ backgroundSize: '100% 4px', animation: 'scanline 8s linear infinite' }}></div>

          <div className="absolute top-0 left-0 z-20 pointer-events-none" style={{ animation: 'agent1Path 20s infinite linear' }}>
            <div className="relative flex flex-col items-center w-[20px] h-[30px] scale-[1.3]">
                <div className="absolute -top-[25px] bg-white text-black text-[7px] px-2 py-0.5 rounded shadow whitespace-nowrap font-bold border border-gray-300 max-w-[120px] truncate" style={{ animation: 'talk1 20s infinite' }}>
                  {agentStates.Saima?.thought || 'Analyzing...'}
                </div>
                <div className="absolute top-0 left-0.5 w-4 h-4 bg-[#f5d0b5] rounded-sm border border-black/20 shadow-sm"></div>
                <div className="absolute -top-0.5 left-0 w-5 h-2 bg-amber-800 rounded-t-sm"></div>
                <div className="absolute top-4 left-0.5 w-4 h-4 bg-orange-500 rounded-sm border border-black/20"></div>
                <div className="absolute top-8 left-1 w-1.5 h-3 bg-blue-900 rounded-sm origin-top animate-[legSwing_0.5s_infinite_linear]"></div>
                <div className="absolute top-8 left-2.5 w-1.5 h-3 bg-blue-900 rounded-sm origin-top animate-[legSwing_0.5s_infinite_linear] [animation-delay:0.25s]"></div>
            </div>
          </div>

          <div className="absolute top-0 left-0 z-20 pointer-events-none" style={{ animation: 'agent2Path 20s infinite linear' }}>
            <div className="relative flex flex-col items-center w-[20px] h-[30px] scale-[1.3]">
                <div className="absolute -top-[25px] bg-white text-black text-[7px] px-2 py-0.5 rounded shadow whitespace-nowrap font-bold border border-gray-300 max-w-[120px] truncate" style={{ animation: 'talk2 20s infinite' }}>
                  {agentStates.Dani?.thought || 'Fixing bugs'}
                </div>
                <div className="absolute top-0 left-0.5 w-4 h-4 bg-[#f5d0b5] rounded-sm border border-black/20 shadow-sm"></div>
                <div className="absolute -top-0.5 left-0 w-5 h-2 bg-slate-800 rounded-t-sm"></div>
                <div className="absolute top-4 left-0.5 w-4 h-4 bg-blue-500 rounded-sm border border-black/20"></div>
                <div className="absolute top-8 left-1 w-1.5 h-3 bg-slate-900 rounded-sm origin-top animate-[legSwing_0.6s_infinite_linear]"></div>
                <div className="absolute top-8 left-2.5 w-1.5 h-3 bg-slate-900 rounded-sm origin-top animate-[legSwing_0.6s_infinite_linear] [animation-delay:0.3s]"></div>
            </div>
          </div>

          <div className="absolute top-0 left-0 z-20 pointer-events-none" style={{ animation: 'agent3Path 20s infinite linear' }}>
            <div className="relative flex flex-col items-center w-[20px] h-[30px] scale-[1.3]">
                <div className="absolute -top-[25px] bg-white text-black text-[7px] px-2 py-0.5 rounded shadow whitespace-nowrap font-bold border border-gray-300 max-w-[120px] truncate" style={{ animation: 'talk3 20s infinite' }}>
                  {agentStates.Mianzi?.thought || 'Printing...'}
                </div>
                <div className="absolute top-0 left-0.5 w-4 h-4 bg-[#dcb193] rounded-sm border border-black/20 shadow-sm"></div>
                <div className="absolute -top-0.5 left-0 w-5 h-2 bg-black rounded-t-sm"></div>
                <div className="absolute top-4 left-0.5 w-4 h-4 bg-red-500 rounded-sm border border-black/20"></div>
                <div className="absolute top-8 left-1 w-1.5 h-3 bg-gray-800 rounded-sm origin-top animate-[legSwing_0.7s_infinite_linear]"></div>
                <div className="absolute top-8 left-2.5 w-1.5 h-3 bg-gray-800 rounded-sm origin-top animate-[legSwing_0.7s_infinite_linear] [animation-delay:0.35s]"></div>
            </div>
          </div>

          <div className="absolute top-0 left-0 z-20 pointer-events-none" style={{ animation: 'agent4Path 20s infinite linear' }}>
            <div className="relative flex flex-col items-center w-[20px] h-[30px] scale-[1.3]">
                <div className="absolute -top-[25px] bg-white text-black text-[7px] px-2 py-0.5 rounded shadow whitespace-nowrap font-bold border border-gray-300 max-w-[120px] truncate" style={{ animation: 'talk4 20s infinite' }}>
                  {agentStates.Zohaib?.thought || 'Need coffee...'}
                </div>
                <div className="absolute top-0 left-0.5 w-4 h-4 bg-[#ffdecc] rounded-sm border border-black/20 shadow-sm"></div>
                <div className="absolute top-4 left-0.5 w-4 h-4 bg-cyan-500 rounded-sm border border-black/20"></div>
                <div className="absolute top-8 left-1 w-1.5 h-3 bg-indigo-900 rounded-sm origin-top animate-[legSwing_0.8s_infinite_linear]"></div>
                <div className="absolute top-8 left-2.5 w-1.5 h-3 bg-indigo-900 rounded-sm origin-top animate-[legSwing_0.8s_infinite_linear] [animation-delay:0.4s]"></div>
            </div>
          </div>

          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 sm:gap-2 bg-black/50 backdrop-blur-sm p-1.5 rounded-full border border-white/10 z-30">
              <div className="flex items-center gap-1.5 bg-orange-900/50 pr-0 sm:pr-2.5 rounded-full border border-orange-500/30">
                  <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-[10px] border border-white/20 font-bold relative">
                    S<span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-black ${getStatusColor(agentStates.Saima?.state)}`}></span>
                  </div>
                  <span className="text-[9px] text-orange-200 hidden sm:inline">Saima</span>
              </div>
              <div className="flex items-center gap-1.5 bg-blue-900/50 pr-0 sm:pr-2.5 rounded-full border border-blue-500/30">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px] border border-white/20 font-bold relative">
                    D<span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-black ${getStatusColor(agentStates.Dani?.state)}`}></span>
                  </div>
                  <span className="text-[9px] text-blue-200 hidden sm:inline">Dani</span>
              </div>
              <div className="flex items-center gap-1.5 bg-red-900/50 pr-0 sm:pr-2.5 rounded-full border border-red-500/30">
                  <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-[10px] border border-white/20 font-bold relative">
                    M<span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-black ${getStatusColor(agentStates.Mianzi?.state)}`}></span>
                  </div>
                  <span className="text-[9px] text-red-200 hidden sm:inline">Mianzi</span>
              </div>
              <div className="flex items-center gap-1.5 bg-cyan-900/50 pr-0 sm:pr-2.5 rounded-full border border-cyan-500/30">
                  <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-[10px] border border-white/20 font-bold relative">
                    Z<span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-black ${getStatusColor(agentStates.Zohaib?.state)}`}></span>
                  </div>
                  <span className="text-[9px] text-cyan-200 hidden sm:inline">Zohaib</span>
              </div>
          </div>
        </div>

        <div className="p-3 bg-[#0a0514] border-t border-purple-500/10 text-center flex items-center justify-between px-4">
          <div className="text-[10px] text-purple-400 font-bold flex items-center gap-1.5">
            <Activity size={12} className="text-emerald-400 animate-pulse" />
            <span>Realtime Orchestrator Active</span>
          </div>
          
          {/* Phase 2A Controls */}
          <div className="flex items-center gap-3">
            {engineAgents.length > 0 && (
              <select 
                value={selectedAgentId} 
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="text-[10px] bg-purple-900/40 text-purple-200 border border-purple-500/30 px-2 py-1 rounded-lg outline-none cursor-pointer hidden sm:block"
              >
                <option value="">Auto-Assign Agent</option>
                {engineAgents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            )}
            
            <button 
              onClick={() => setShowTaskHistory(!showTaskHistory)}
              className={`text-[10px] border px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${showTaskHistory ? 'bg-purple-800 text-white border-purple-400' : 'bg-purple-900/40 text-purple-200 border-purple-500/30 hover:bg-purple-800/60'}`}>
              <List size={11} />
              <span>History</span>
            </button>
            <button 
              onClick={() => handleAssistantSubmit({ preventDefault: () => {} })}
              disabled={isDispatching}
              className="text-[10px] bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 border border-purple-500/30 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer">
              <Sparkles size={11} className="text-yellow-400" />
              <span>{isDispatching ? 'Assigning...' : 'Dispatch Task'}</span>
            </button>
          </div>
        </div>
        
        {/* Phase 2A Task History Overlay */}
        {showTaskHistory && (
          <div className="absolute top-0 right-0 bottom-0 w-full sm:w-80 bg-[#0f081c]/95 backdrop-blur-md border-l border-purple-500/30 z-40 flex flex-col p-4 shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b border-purple-500/20 pb-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2"><List size={14}/> Task Engine History</h4>
              <button onClick={() => setShowTaskHistory(false)} className="text-purple-400 hover:text-white"><X size={14}/></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {engineTasks.length === 0 ? (
                <div className="text-xs text-purple-300/50 text-center mt-10">No tasks in history. Dispatch one!</div>
              ) : (


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



              )}
            </div>
          </div>
        )}
      </div>

      {/* Voice Assistant Terminal */}
      <div className="lg:col-span-1 glass-panel rounded-2xl border border-purple-500/20 flex flex-col overflow-hidden relative bg-[#0a0514]">
        <div className="flex justify-between items-center p-3 border-b border-purple-500/10 z-10 relative">
          <h3 className="font-bold text-white text-sm">Voice Assistant Terminal</h3>
          <button className="text-purple-400 hover:text-white"><X size={14} /></button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
          <div className="relative w-40 h-40 mb-8 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-pink-500 via-purple-500 to-cyan-500 rounded-full animate-spin opacity-50 blur-md" style={{ animationDuration: '4s' }}></div>
              <div className="absolute inset-1 bg-gradient-to-tr from-[#1a0f2e] to-[#0a0514] rounded-full overflow-hidden border-2 border-white/10 shadow-[0_0_30px_rgba(139,92,246,0.6)]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(236,72,153,0.3),transparent)]"></div>
                  <svg className="w-full h-full opacity-60" viewBox="0 0 100 100">
                      <path d="M10,50 Q40,10 90,40" fill="none" stroke="cyan" strokeWidth="0.5" className="animate-pulse" />
                      <path d="M20,20 Q60,80 80,20" fill="none" stroke="magenta" strokeWidth="0.5" className="animate-pulse" style={{animationDelay: '0.5s'}} />
                      <path d="M30,90 Q50,30 90,80" fill="none" stroke="yellow" strokeWidth="0.5" className="animate-pulse" style={{animationDelay: '1s'}} />
                      <circle cx="10" cy="50" r="1.5" fill="cyan" className="animate-ping" />
                      <circle cx="90" cy="40" r="1.5" fill="cyan" className="animate-ping" style={{animationDelay: '0.5s'}} />
                      <circle cx="20" cy="20" r="1.5" fill="magenta" className="animate-ping" style={{animationDelay: '1s'}} />
                      <circle cx="80" cy="20" r="1.5" fill="magenta" className="animate-ping" style={{animationDelay: '1.5s'}} />
                  </svg>
              </div>
          </div>

          <p className="text-xs text-center text-gray-300 mb-8 px-4 font-medium leading-relaxed">
              Appka personal AI assistant. Bataye main kaise madad kar sakta hoon?
          </p>

          <div className="flex items-center justify-center gap-1 h-12 w-full px-8">
              <div className="w-2 h-3 bg-gradient-to-t from-pink-500 to-purple-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(236,72,153,0.8)]"></div>
              <div className="w-2 h-6 bg-gradient-to-t from-purple-500 to-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(139,92,246,0.8)]" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-10 bg-gradient-to-t from-indigo-500 to-cyan-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.8)]" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-12 bg-gradient-to-t from-cyan-500 to-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]" style={{ animationDelay: '0.3s' }}></div>
              <div className="w-2 h-9 bg-gradient-to-t from-blue-500 to-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" style={{ animationDelay: '0.4s' }}></div>
              <div className="w-2 h-5 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.8)]" style={{ animationDelay: '0.5s' }}></div>
              <div className="w-2 h-2 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.8)]" style={{ animationDelay: '0.6s' }}></div>
          </div>
        </div>

        <form onSubmit={handleAssistantSubmit} className="p-3 border-t border-purple-500/10 w-full z-10 relative">
          <div className="flex items-center gap-2 bg-[#1a1129] border border-purple-500/20 rounded-xl p-2 shadow-inner">
              <input 
                type="text" 
                value={voiceInput}
                onChange={(e) => setVoiceInput(e.target.value)}
                placeholder="Type to Assistant... (e.g. Research AI SaaS trends)" 
                className="bg-transparent border-none outline-none text-xs text-white flex-1 px-2 placeholder-purple-500" 
              />
              <button type="button" className="text-purple-400 hover:text-white bg-[#0f0a1b] p-1.5 rounded-lg border border-purple-500/20"><Keyboard size={14} /></button>
              <button type="button" className="text-purple-400 hover:text-white bg-[#0f0a1b] p-1.5 rounded-lg border border-purple-500/20"><Mic size={14} /></button>
              <button type="submit" disabled={isDispatching} className="text-purple-400 hover:text-white bg-[#0f0a1b] p-1.5 rounded-lg border border-purple-500/20 cursor-pointer">
                <Plus size={14} />
              </button>
          </div>
        </form>
      </div>
    </div>
  );
}

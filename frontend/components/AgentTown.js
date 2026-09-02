import React from 'react';
import { X, Keyboard, Mic, Plus, Share2, Users, Settings } from 'lucide-react';

export default function AgentTown({ currentUser }) {
  if (!currentUser || !['admin', 'super_admin', 'sub_admin'].includes(currentUser.role)) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
      {/* Agent Town Panel */}
      <div className="lg:col-span-2 glass-panel rounded-2xl border border-purple-500/20 flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="flex justify-between items-center p-3 border-b border-purple-500/10 bg-[#0f081c]/80 backdrop-blur z-10">
          <h3 className="font-bold text-white text-sm whitespace-nowrap">Agent Town</h3>
          <div className="text-[10px] text-purple-400 hidden sm:block truncate ml-2">Live AI Agents Workspace</div>
          <button className="text-purple-400 hover:text-white ml-auto"><X size={14} /></button>
        </div>
        
        {/* PROPER 2D OFFICE ENVIRONMENT USING CLEANED IMAGE */}
        <div className="flex-1 bg-[#1a1b26] relative overflow-hidden h-[400px] w-full group">
          
          {/* Cleaned Pixel Art Map Background */}
          <div className="absolute inset-0 bg-[#1a1b26]">
              <img src="/agent-town-map-clean.png" alt="Agent Town Map" className="w-full h-full object-cover opacity-90 mix-blend-lighten pointer-events-none" />
          </div>
          
          {/* Fake Doors to cover the painted ones and animate opening */}
          {/* Left Door */}
          <div className="absolute w-[4.5%] h-[8%] bg-[#2d3142] z-10" style={{ left: '33.8%', top: '42%' }}>
             <div className="w-full h-full bg-[#d97736] border-2 border-[#944d1f] origin-left animate-[doorOpenLeft_20s_infinite]"></div>
          </div>
          {/* Right Door */}
          <div className="absolute w-[4.5%] h-[8%] bg-[#2d3142] z-10" style={{ left: '74.5%', top: '42%' }}>
             <div className="w-full h-full bg-[#d97736] border-2 border-[#944d1f] origin-left animate-[doorOpenRight_20s_infinite]"></div>
          </div>
          
          {/* Scanning / Radar Effect Overlay */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(139,92,246,0.1)_1px,transparent_1px)]" style={{ backgroundSize: '100% 4px', animation: 'scanline 8s linear infinite' }}></div>


          {/* --- CHOREOGRAPHED ANIMATED CSS PIXEL AGENTS --- */}
          
          {/* Agent 1 (Saima) - Left Side Choreography */}
          <div className="absolute top-0 left-0 z-20 pointer-events-none" style={{ animation: 'agent1Path 20s infinite linear' }}>
            <div className="relative flex flex-col items-center w-[20px] h-[30px] scale-[1.3]">
                <div className="absolute -top-[25px] bg-white text-black text-[7px] px-2 py-0.5 rounded shadow whitespace-nowrap font-bold border border-gray-300" style={{ animation: 'talk1 20s infinite' }}>Analyzing...</div>
                
                <div className="absolute top-0 left-0.5 w-4 h-4 bg-[#f5d0b5] rounded-sm border border-black/20 shadow-sm"></div>
                <div className="absolute -top-0.5 left-0 w-5 h-2 bg-amber-800 rounded-t-sm"></div>
                <div className="absolute top-4 left-0.5 w-4 h-4 bg-orange-500 rounded-sm border border-black/20"></div>
                <div className="absolute top-8 left-1 w-1.5 h-3 bg-blue-900 rounded-sm origin-top animate-[legSwing_0.5s_infinite_linear]"></div>
                <div className="absolute top-8 left-2.5 w-1.5 h-3 bg-blue-900 rounded-sm origin-top animate-[legSwing_0.5s_infinite_linear] [animation-delay:0.25s]"></div>
            </div>
          </div>

          {/* Agent 2 (Dani) - Right Side Choreography */}
          <div className="absolute top-0 left-0 z-20 pointer-events-none" style={{ animation: 'agent2Path 20s infinite linear' }}>
            <div className="relative flex flex-col items-center w-[20px] h-[30px] scale-[1.3]">
                <div className="absolute -top-[25px] bg-white text-black text-[7px] px-2 py-0.5 rounded shadow whitespace-nowrap font-bold border border-gray-300" style={{ animation: 'talk2 20s infinite' }}>Fixing bugs</div>
                
                <div className="absolute top-0 left-0.5 w-4 h-4 bg-[#f5d0b5] rounded-sm border border-black/20 shadow-sm"></div>
                <div className="absolute -top-0.5 left-0 w-5 h-2 bg-slate-800 rounded-t-sm"></div>
                <div className="absolute top-4 left-0.5 w-4 h-4 bg-blue-500 rounded-sm border border-black/20"></div>
                <div className="absolute top-8 left-1 w-1.5 h-3 bg-slate-900 rounded-sm origin-top animate-[legSwing_0.6s_infinite_linear]"></div>
                <div className="absolute top-8 left-2.5 w-1.5 h-3 bg-slate-900 rounded-sm origin-top animate-[legSwing_0.6s_infinite_linear] [animation-delay:0.3s]"></div>
            </div>
          </div>

          {/* Agent 3 (Mianzi) - Left/Center Choreography */}
          <div className="absolute top-0 left-0 z-20 pointer-events-none" style={{ animation: 'agent3Path 20s infinite linear' }}>
            <div className="relative flex flex-col items-center w-[20px] h-[30px] scale-[1.3]">
                <div className="absolute -top-[25px] bg-white text-black text-[7px] px-2 py-0.5 rounded shadow whitespace-nowrap font-bold border border-gray-300" style={{ animation: 'talk3 20s infinite' }}>Printing...</div>
                
                <div className="absolute top-0 left-0.5 w-4 h-4 bg-[#dcb193] rounded-sm border border-black/20 shadow-sm"></div>
                <div className="absolute -top-0.5 left-0 w-5 h-2 bg-black rounded-t-sm"></div>
                <div className="absolute top-4 left-0.5 w-4 h-4 bg-red-500 rounded-sm border border-black/20"></div>
                <div className="absolute top-8 left-1 w-1.5 h-3 bg-gray-800 rounded-sm origin-top animate-[legSwing_0.7s_infinite_linear]"></div>
                <div className="absolute top-8 left-2.5 w-1.5 h-3 bg-gray-800 rounded-sm origin-top animate-[legSwing_0.7s_infinite_linear] [animation-delay:0.35s]"></div>
            </div>
          </div>

          {/* Agent 4 (Zohaib) - Right Side Lounge Choreography */}
          <div className="absolute top-0 left-0 z-20 pointer-events-none" style={{ animation: 'agent4Path 20s infinite linear' }}>
            <div className="relative flex flex-col items-center w-[20px] h-[30px] scale-[1.3]">
                <div className="absolute -top-[25px] bg-white text-black text-[7px] px-2 py-0.5 rounded shadow whitespace-nowrap font-bold border border-gray-300" style={{ animation: 'talk4 20s infinite' }}>Need coffee...</div>
                <div className="absolute top-0 left-0.5 w-4 h-4 bg-[#ffdecc] rounded-sm border border-black/20 shadow-sm"></div>
                <div className="absolute top-4 left-0.5 w-4 h-4 bg-cyan-500 rounded-sm border border-black/20"></div>
                <div className="absolute top-8 left-1 w-1.5 h-3 bg-indigo-900 rounded-sm origin-top animate-[legSwing_0.8s_infinite_linear]"></div>
                <div className="absolute top-8 left-2.5 w-1.5 h-3 bg-indigo-900 rounded-sm origin-top animate-[legSwing_0.8s_infinite_linear] [animation-delay:0.4s]"></div>
            </div>
          </div>

          {/* UI Overlay Controls (Avatars at top) */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 sm:gap-2 bg-black/50 backdrop-blur-sm p-1.5 rounded-full border border-white/10 z-30">
              <div className="flex items-center gap-1 bg-orange-900/50 pr-0 sm:pr-2 rounded-full border border-orange-500/30">
                  <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-[10px] border border-white/20">S</div>
                  <span className="text-[9px] text-orange-200 hidden sm:inline">Saima</span>
              </div>
              <div className="flex items-center gap-1 bg-blue-900/50 pr-0 sm:pr-2 rounded-full border border-blue-500/30">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px] border border-white/20">D</div>
                  <span className="text-[9px] text-blue-200 hidden sm:inline">Dani</span>
              </div>
              <div className="flex items-center gap-1 bg-red-900/50 pr-0 sm:pr-2 rounded-full border border-red-500/30">
                  <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-[10px] border border-white/20">M</div>
                  <span className="text-[9px] text-red-200 hidden sm:inline">Mianzi</span>
              </div>
              <div className="flex items-center gap-1 bg-cyan-900/50 pr-0 sm:pr-2 rounded-full border border-cyan-500/30">
                  <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-[10px] border border-white/20">Z</div>
                  <span className="text-[9px] text-cyan-200 hidden sm:inline">Zohaib</span>
              </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#0a0514] border-t border-purple-500/10 text-center">
          <div className="text-xs text-purple-300 font-bold mb-1">--- Agent Town Controls ---</div>
          <div className="text-[10px] text-purple-500">View Map | Manage Agents | Assign Tasks</div>
        </div>
      </div>

      {/* Voice Assistant Terminal */}
      <div className="lg:col-span-1 glass-panel rounded-2xl border border-purple-500/20 flex flex-col overflow-hidden relative bg-[#0a0514]">
        {/* Header */}
        <div className="flex justify-between items-center p-3 border-b border-purple-500/10 z-10 relative">
          <h3 className="font-bold text-white text-sm">Voice Assistant Terminal</h3>
          <button className="text-purple-400 hover:text-white"><X size={14} /></button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
          {/* Glowing Orb */}
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

          {/* Audio visualizer */}
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

        {/* Input Footer */}
        <div className="p-3 border-t border-purple-500/10 w-full z-10 relative">
          <div className="flex items-center gap-2 bg-[#1a1129] border border-purple-500/20 rounded-xl p-2 shadow-inner">
              <input type="text" placeholder="Type to Assistant..." className="bg-transparent border-none outline-none text-xs text-white flex-1 px-2 placeholder-purple-500" />
              <button className="text-purple-400 hover:text-white bg-[#0f0a1b] p-1.5 rounded-lg border border-purple-500/20"><Keyboard size={14} /></button>
              <button className="text-purple-400 hover:text-white bg-[#0f0a1b] p-1.5 rounded-lg border border-purple-500/20"><Mic size={14} /></button>
              <button className="text-purple-400 hover:text-white bg-[#0f0a1b] p-1.5 rounded-lg border border-purple-500/20"><Plus size={14} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

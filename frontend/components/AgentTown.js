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
        
        {/* PROPER 2D OFFICE ENVIRONMENT */}
        <div className="flex-1 bg-[#202231] relative overflow-hidden h-[400px] w-full" style={{ backgroundImage: 'radial-gradient(#ffffff0a 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
          
          {/* --- ROOM STRUCTURE --- */}
          {/* Center Wall dividing Top and Bottom partitions */}
          <div className="absolute top-[200px] left-0 w-[400px] h-[8px] bg-[#12131c] shadow-[0_4px_10px_rgba(0,0,0,0.5)]"></div>
          <div className="absolute top-[200px] left-[480px] right-0 h-[8px] bg-[#12131c] shadow-[0_4px_10px_rgba(0,0,0,0.5)]"></div>
          
          {/* Vertical Partition Wall in Bottom Room */}
          <div className="absolute top-[208px] left-[300px] w-[8px] bottom-0 bg-[#12131c] shadow-[4px_0_10px_rgba(0,0,0,0.5)]"></div>
          
          {/* The Animated Door */}
          <div className="absolute top-[198px] left-[400px] w-[80px] h-[12px] bg-[#d97736] border-2 border-[#944d1f] origin-left animate-[doorOpen_15s_infinite]"></div>

          {/* --- FURNITURE --- */}
          {/* Top Partition Desks */}
          <div className="absolute top-[60px] left-[100px] w-[120px] h-[60px] bg-[#2a2d42] border border-[#3f435e] rounded shadow-lg flex items-center justify-around px-4">
              <div className="w-[20px] h-[15px] bg-[#1a1c29] border-t-2 border-[#54f3ff] rounded-sm relative"><div className="absolute top-[4px] left-[2px] w-[16px] h-[2px] bg-green-500 animate-pulse"></div></div>
              <div className="w-[20px] h-[15px] bg-[#1a1c29] border-t-2 border-[#a855f7] rounded-sm"></div>
          </div>
          
          <div className="absolute top-[60px] left-[450px] w-[80px] h-[60px] bg-[#2a2d42] border border-[#3f435e] rounded shadow-lg flex items-center justify-center">
              <div className="w-[24px] h-[18px] bg-[#1a1c29] border-t-2 border-[#ff3b8f] rounded-sm relative"><div className="absolute top-[4px] left-[2px] w-[20px] h-[2px] bg-yellow-500 animate-pulse" style={{animationDelay: '1s'}}></div></div>
          </div>

          {/* Bottom Left Partition Desks */}
          <div className="absolute top-[280px] left-[60px] w-[60px] h-[80px] bg-[#2a2d42] border border-[#3f435e] rounded shadow-lg flex flex-col items-center justify-center gap-2">
              <div className="w-[20px] h-[15px] bg-[#1a1c29] border-t-2 border-[#3b82f6] rounded-sm rotate-90"></div>
          </div>

          {/* Bottom Right Partition (Lounge/Pantry) */}
          <div className="absolute top-[240px] left-[500px] w-[60px] h-[40px] bg-[#4a362f] rounded shadow-lg"></div> {/* Coffee table */}
          <div className="absolute top-[230px] right-[40px] w-[30px] h-[30px] bg-green-800 rounded-full border-4 border-green-600 shadow-lg"></div> {/* Plant */}
          <div className="absolute bottom-[30px] right-[80px] w-[40px] h-[40px] bg-blue-300 rounded-sm border-2 border-blue-400 opacity-80"></div> {/* Water cooler */}

          {/* Chairs */}
          <div className="absolute top-[130px] left-[125px] w-[20px] h-[20px] bg-[#4a4f73] rounded-full shadow-lg"></div> {/* Desk 1 left */}
          <div className="absolute top-[130px] left-[175px] w-[20px] h-[20px] bg-[#4a4f73] rounded-full shadow-lg"></div> {/* Desk 1 right */}
          <div className="absolute top-[130px] left-[480px] w-[20px] h-[20px] bg-[#4a4f73] rounded-full shadow-lg"></div> {/* Desk 2 */}
          <div className="absolute top-[310px] left-[130px] w-[20px] h-[20px] bg-[#4a4f73] rounded-full shadow-lg"></div> {/* Bottom Desk */}


          {/* --- ANIMATED AGENTS --- */}
          
          {/* Agent 1: Walk from bottom room, open door, go to top right desk, sit, work, leave */}
          <div className="absolute animate-[pathSaima_15s_infinite] z-20">
            <div className="relative flex flex-col items-center w-[20px] h-[30px]">
                {/* Speech Bubble */}
                <div className="absolute -top-[30px] bg-white text-black text-[8px] px-2 py-0.5 rounded shadow whitespace-nowrap animate-[fadeTalk_15s_infinite]">Analyzing data...</div>
                
                {/* Body */}
                <div className="w-[14px] h-[14px] bg-[#f5d0b5] rounded-full border border-black/30 shadow-md z-10"></div>
                <div className="w-[18px] h-[14px] bg-orange-500 rounded-sm border border-black/30 -mt-1 z-0 relative">
                   <div className="absolute top-1 -left-1 w-[4px] h-[10px] bg-orange-400 rounded-full animate-[armSwing_0.5s_infinite]"></div>
                   <div className="absolute top-1 -right-1 w-[4px] h-[10px] bg-orange-400 rounded-full animate-[armSwing_0.5s_infinite_0.25s]"></div>
                </div>
            </div>
          </div>

          {/* Agent 2: Already sitting at top left desk, working */}
          <div className="absolute top-[115px] left-[125px] z-20">
            <div className="relative flex flex-col items-center w-[20px] h-[30px]">
                <div className="absolute -top-[25px] bg-white text-black text-[8px] px-2 py-0.5 rounded shadow whitespace-nowrap">Deploying!</div>
                <div className="w-[14px] h-[14px] bg-[#f5d0b5] rounded-full border border-black/30 shadow-md z-10"></div>
                <div className="w-[18px] h-[14px] bg-blue-500 rounded-sm border border-black/30 -mt-1 z-0 relative"></div>
            </div>
          </div>

          {/* Agent 3: Walking around bottom left partition */}
          <div className="absolute animate-[pathDani_20s_infinite] z-20">
            <div className="relative flex flex-col items-center w-[20px] h-[30px]">
                <div className="w-[14px] h-[14px] bg-[#dcb193] rounded-full border border-black/30 shadow-md z-10">
                   <div className="absolute top-0 right-1 w-[8px] h-[4px] bg-black rounded-full"></div> {/* Hair */}
                </div>
                <div className="w-[18px] h-[14px] bg-red-500 rounded-sm border border-black/30 -mt-1 z-0 relative"></div>
            </div>
          </div>

          {/* Agent 4: Getting water in bottom right, then walking to lounge */}
          <div className="absolute animate-[pathZohaib_18s_infinite] z-20">
            <div className="relative flex flex-col items-center w-[20px] h-[30px]">
                <div className="absolute -top-[25px] left-[10px] bg-white text-black text-[8px] px-2 py-0.5 rounded shadow whitespace-nowrap animate-[fadeTalk2_18s_infinite]">Need coffee...</div>
                <div className="w-[14px] h-[14px] bg-[#ffdecc] rounded-full border border-black/30 shadow-md z-10"></div>
                <div className="w-[18px] h-[14px] bg-cyan-500 rounded-sm border border-black/30 -mt-1 z-0 relative"></div>
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

          {/* Audio visualizer (Sound wave) */}
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

import re

def enhance_file(filepath):
    with open(filepath, 'r', encoding='utf8') as f:
        code = f.read()

    # 1. Add missing lucide imports
    if 'Keyboard, Share2' not in code:
        code = code.replace("} from 'lucide-react';", "Keyboard, Share2, MessageCircle } from 'lucide-react';")

    agent_town_ui = """
                {/* AGENT TOWN & VOICE ASSISTANT */}
                {['admin', 'super_admin', 'sub_admin'].includes(currentUser?.role) && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
                    {/* Agent Town Panel */}
                    <div className="lg:col-span-2 glass-panel rounded-2xl border border-purple-500/20 flex flex-col overflow-hidden relative">
                      {/* Header */}
                      <div className="flex justify-between items-center p-3 border-b border-purple-500/10 bg-[#0f081c]/80 backdrop-blur z-10">
                        <h3 className="font-bold text-white text-sm">Agent Town</h3>
                        <div className="text-[10px] text-purple-400">Agent Town · agents · visual hub · gesture</div>
                        <button className="text-purple-400 hover:text-white"><X size={14} /></button>
                      </div>
                      
                      {/* Map Area */}
                      <div className="flex-1 bg-[#1a1b26] relative overflow-hidden h-[400px]">
                        {/* Floor Grid */}
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                        
                        {/* Static Environment elements (Desks, Plants, Walls) */}
                        <div className="absolute top-1/4 left-0 w-full h-2 bg-[#0f081c] border-y border-purple-500/30"></div>
                        <div className="absolute top-1/4 left-2/3 w-2 h-full bg-[#0f081c] border-x border-purple-500/30"></div>
                        
                        {/* Desk 1 */}
                        <div className="absolute top-12 left-10 w-28 h-16 bg-[#2a2b36] border border-gray-600 rounded shadow-2xl flex flex-wrap gap-2 p-2">
                            <div className="w-6 h-6 bg-blue-500/20 border border-blue-400 rounded-sm"></div>
                            <div className="w-6 h-6 bg-cyan-500/20 border border-cyan-400 rounded-sm"></div>
                        </div>

                        {/* Desk 2 */}
                        <div className="absolute top-12 left-40 w-28 h-16 bg-[#2a2b36] border border-gray-600 rounded shadow-2xl flex flex-wrap gap-2 p-2">
                            <div className="w-6 h-6 bg-pink-500/20 border border-pink-400 rounded-sm"></div>
                        </div>

                        {/* Desk 3 (Bottom left) */}
                        <div className="absolute bottom-20 left-20 w-40 h-20 bg-[#2a2b36] border border-gray-600 rounded shadow-2xl flex items-center justify-center gap-4">
                            <div className="w-8 h-8 bg-purple-500/20 border border-purple-400 rounded-sm"></div>
                            <div className="w-8 h-8 bg-green-500/20 border border-green-400 rounded-sm"></div>
                        </div>
                        
                        {/* Desk 4 (Bottom right corner) */}
                        <div className="absolute bottom-10 right-10 w-24 h-16 bg-[#2a2b36] border border-gray-600 rounded shadow-2xl flex items-center justify-center">
                            <div className="w-6 h-6 bg-yellow-500/20 border border-yellow-400 rounded-sm"></div>
                        </div>

                        {/* Animated Agents (Avatars) */}
                        {/* Agent 1 - Bouncing */}
                        <div className="absolute top-14 left-8 animate-bounce"><div className="w-6 h-6 bg-pink-400 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-[10px]">👩‍💻</div></div>
                        
                        {/* Agent 2 - Bouncing */}
                        <div className="absolute top-16 left-44 animate-bounce" style={{ animationDelay: '0.3s' }}><div className="w-6 h-6 bg-blue-400 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-[10px]">👨‍💻</div></div>
                        
                        {/* Agent 3 - Pulse / Working */}
                        <div className="absolute bottom-24 left-24 animate-pulse"><div className="w-6 h-6 bg-purple-400 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-[10px]">👨‍🎨</div></div>
                        
                        {/* Agent 4 - Speaking Bubble */}
                        <div className="absolute bottom-28 left-40 animate-bounce" style={{ animationDelay: '0.5s' }}><div className="w-6 h-6 bg-yellow-400 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-[10px] relative">
                            👨‍🔧
                            <div className="absolute -top-8 -left-12 bg-white text-black text-[9px] px-2 py-1 rounded shadow-lg whitespace-nowrap font-bold">Staying hydrated!</div>
                            <div className="absolute -top-3 left-2 w-2 h-2 bg-white rotate-45"></div>
                        </div></div>
                        
                        {/* Agent 5 - Bouncing bottom right */}
                        <div className="absolute bottom-12 right-14 animate-bounce" style={{ animationDelay: '0.2s' }}><div className="w-6 h-6 bg-emerald-400 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-[10px]">👩‍💼</div></div>

                        {/* UI Overlay Controls (Avatars at top) */}
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-sm p-1.5 rounded-full border border-white/10 z-10">
                            <div className="flex items-center gap-1 bg-orange-900/50 pr-2 rounded-full border border-orange-500/30">
                                <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-[10px] border border-white/20">S</div>
                                <span className="text-[9px] text-orange-200">Saima</span>
                            </div>
                            <div className="flex items-center gap-1 bg-blue-900/50 pr-2 rounded-full border border-blue-500/30">
                                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px] border border-white/20">D</div>
                                <span className="text-[9px] text-blue-200">Dani</span>
                            </div>
                            <div className="flex items-center gap-1 bg-red-900/50 pr-2 rounded-full border border-red-500/30">
                                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-[10px] border border-white/20">M</div>
                                <span className="text-[9px] text-red-200">Mianzi</span>
                            </div>
                            <div className="flex items-center gap-1 bg-cyan-900/50 pr-2 rounded-full border border-cyan-500/30">
                                <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-[10px] border border-white/20">Z</div>
                                <span className="text-[9px] text-cyan-200">Zohaib</span>
                            </div>
                        </div>

                        {/* Right side tools */}
                        <div className="absolute top-3 right-3 flex gap-1 z-10">
                            <button className="w-7 h-7 bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 rounded-lg flex items-center justify-center text-[#8b5cf6] hover:bg-[#8b5cf6]/40"><Share2 size={12}/></button>
                            <button className="w-7 h-7 bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 rounded-lg flex items-center justify-center text-[#8b5cf6] hover:bg-[#8b5cf6]/40"><Users size={12}/></button>
                            <button className="w-7 h-7 bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 rounded-lg flex items-center justify-center text-[#8b5cf6] hover:bg-[#8b5cf6]/40"><Settings size={12}/></button>
                        </div>
                        
                        {/* Press C overlay */}
                        <div className="absolute bottom-28 left-52 text-yellow-500 text-[10px] font-bold animate-pulse">
                            Press C
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
                            {/* Outer Glow Ring */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-pink-500 via-purple-500 to-cyan-500 rounded-full animate-spin opacity-50 blur-md" style={{ animationDuration: '4s' }}></div>
                            
                            {/* Inner glowing circle */}
                            <div className="absolute inset-1 bg-gradient-to-tr from-[#1a0f2e] to-[#0a0514] rounded-full overflow-hidden border-2 border-white/10 shadow-[0_0_30px_rgba(139,92,246,0.6)]">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(236,72,153,0.3),transparent)]"></div>
                                {/* Neural net lines effect inside orb */}
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
                )}
\n"""

    search_str = "              {/* CLIENT VIEW IN DASHBOARD */}"
    if search_str in code:
        code = code.replace(search_str, agent_town_ui + search_str)
        with open(filepath, 'w', encoding='utf8') as f:
            f.write(code)
        print(f"Successfully added Agent Town to {filepath}")
    else:
        print(f"Could not find '{search_str}' in {filepath}")

enhance_file('frontend/app/dashboard/page.js')
enhance_file('frontend/app/login/page.js')


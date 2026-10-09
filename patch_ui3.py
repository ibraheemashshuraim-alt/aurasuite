import sys

with open('frontend/components/AgentTown.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Plus with Send icon import
content = content.replace("import { X, Keyboard, Mic, Plus, Share2, Users, Settings, Activity, Sparkles, List } from 'lucide-react';", 
                          "import { X, Keyboard, Mic, Plus, Share2, Users, Settings, Activity, Sparkles, List, Send, ArrowRight } from 'lucide-react';")

# Fix the Voice Assistant Terminal input UI
old_ui = """                <input 
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
                </button>"""

new_ui = """                <input 
                  type="text" 
                  value={voiceInput}
                  onChange={(e) => setVoiceInput(e.target.value)}
                  placeholder="Type to Assistant... (e.g. Research AI SaaS trends)" 
                  className="bg-transparent border-none outline-none text-xs text-white flex-1 px-2 placeholder-purple-500" 
                />
                <button type="button" className="text-purple-400 hover:text-white bg-[#0f0a1b] p-1.5 rounded-lg border border-purple-500/20"><Keyboard size={14} /></button>
                <button type="button" onClick={() => alert("Voice Assistant module will be integrated in Phase 5!")} className="text-purple-400 hover:text-white bg-[#0f0a1b] p-1.5 rounded-lg border border-purple-500/20"><Mic size={14} /></button>
                <button type="submit" disabled={isDispatching} className="text-purple-400 hover:text-white bg-purple-600/30 p-1.5 rounded-lg border border-purple-500/50 cursor-pointer transition-colors hover:bg-purple-500/50">
                  <Send size={14} />
                </button>"""

if old_ui in content:
    content = content.replace(old_ui, new_ui)
else:
    print("WARNING: Could not find old UI block to patch.")

with open('frontend/components/AgentTown.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("AgentTown UI updated for Send icon and Mic alert!")

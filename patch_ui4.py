import sys
import re

with open('frontend/components/AgentTown.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace <Plus size={14} /> with <Send size={14} /> inside the submit button
content = re.sub(
    r'<button type="submit" disabled=\{isDispatching\} className="[^"]*">.*?<Plus size=\{14\} />.*?</button>',
    r'<button type="submit" disabled={isDispatching} className="text-purple-100 hover:text-white bg-purple-600 p-1.5 rounded-lg border border-purple-500 cursor-pointer shadow-lg">\n                  <Send size={14} />\n                </button>',
    content,
    flags=re.DOTALL
)

# Replace <Mic size={14} /> wrapper with alert
content = re.sub(
    r'<button type="button" className="[^"]*"><Mic size=\{14\} /></button>',
    r'<button type="button" onClick={() => alert("Voice assistant module will be integrated in Phase 5!")} className="text-purple-400 hover:text-white bg-[#0f0a1b] p-1.5 rounded-lg border border-purple-500/20 cursor-pointer"><Mic size={14} /></button>',
    content,
    flags=re.DOTALL
)

with open('frontend/components/AgentTown.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("AgentTown UI updated using regex!")

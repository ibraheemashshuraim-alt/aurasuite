import re

with open('frontend/app/dashboard/page.js', 'r', encoding='utf-8') as f:
    d = f.read()

# Add a huge visible version badge at the top of the AppContainer
badge = """
  return (
    <div className="flex h-screen bg-[#06030b] text-slate-200 overflow-hidden font-sans">
      <div className="fixed top-0 left-0 z-[9999999999] bg-red-600 text-white font-black text-2xl p-4 rounded-br-lg shadow-2xl border-2 border-white">
        VERSION 9000
      </div>
"""

d = d.replace("  return (\n    <div className=\"flex h-screen bg-[#06030b] text-slate-200 overflow-hidden font-sans\">", badge)

# Also fix handleSendLiveChat just in case!
d = d.replace("setIsSendingLiveChat(true);\n      try {", "setIsSendingLiveChat(true);\n      setTimeout(() => setIsSendingLiveChat(false), 2000);\n      try {")

with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(d)
print("Added massive red version badge and fixed live chat")

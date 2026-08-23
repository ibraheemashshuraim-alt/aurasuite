
import re

kickout_block = """  // \u2500\u2500 KICKOUT MODAL OVERLAY (HIGHEST PRIORITY) \u2500\u2500
  if (kickoutModal || currentUser?.role == "suspended" || currentUser?.status == "suspended") {
    return (
      <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
        <div className="bg-slate-900 border border-red-500/50 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-4">Access Revoked</h2>
          <p className="text-red-400 text-sm mb-6">Your access card has been suspended by the Admin.</p>
          <button
            onClick={() => {
              try {
                window.close();
              } catch (e) {}
            }}
            className="px-8 py-3 bg-red-950/60 hover:bg-red-900/80 text-white font-semibold rounded-xl border border-red-500/30 transition-all"
          >
            Close Portal
          </button>
        </div>
      </div>
    );
  }"""

def replace_in_file(filename):
    with open(filename, "r", encoding="utf-8") as f:
        content = f.read()
    
    pattern = re.compile(r"// \xe2\x94\x80\xe2\x94\x80 KICKOUT MODAL OVERLAY \(HIGHEST PRIORITY\) \xe2\x94\x80\xe2\x94\x80\n\s*if \(kickoutModal \|\| currentUser\?\.role === .suspended. \|\| currentUser\?\.status === .suspended.\) \{.*?\n  \}\n", re.DOTALL)
    
    match = pattern.search(content)
    if not match:
        print(f"Could not find kickout block in {filename}")
        return
        
    new_content = content[:match.start()] + kickout_block + "\n" + content[match.end():]
    
    with open(filename, "w", encoding="utf-8") as f:
        f.write(new_content)
    print(f"Replaced kickout modal in {filename}")

replace_in_file("frontend/app/dashboard/page.js")
replace_in_file("frontend/app/login/page.js")


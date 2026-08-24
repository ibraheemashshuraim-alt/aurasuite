import re

def clean_modals(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Regex to match any Kickout Modal
    kickout_pattern = re.compile(r'\s*// [^\n]*KICKOUT MODAL OVERLAY[^\n]*\n\s*if \(kickoutModal[\s\S]*?    \);\n  \}\n')
    content = re.sub(kickout_pattern, '', content)
    
    # Regex to match any Lock Modal
    lock_pattern = re.compile(r'\s*// [^\n]*LOCK MODAL OVERLAY[^\n]*\n\s*const isEffectivelyLocked[^\n]*\n\s*if \([\s\S]*?    \);\n  \}\n')
    content = re.sub(lock_pattern, '', content)
    
    # Insert both modals exactly once above isCheckingSession
    modals = '''
  // 🚨🚨 KICKOUT MODAL OVERLAY (HIGHEST PRIORITY) 🚨🚨
  if (kickoutModal || currentUser?.role === "suspended" || currentUser?.status === "suspended") {
    return (
      <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
        <div className="bg-slate-900 border border-red-500/50 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-4">Access Revoked</h2>
          <p className="text-red-400 text-sm mb-6">Your access card has been suspended by the Admin.</p>
          <button
            onClick={() => {
              try { window.close(); } catch (e) {}
              localStorage.removeItem("aura_session");
              sessionStorage.removeItem("aura_session");
              window.location.href = "/";
            }}
            className="px-8 py-3 bg-red-950/60 hover:bg-red-900/80 text-white font-semibold rounded-xl border border-red-500/30 transition-all"
          >
            Close Portal
          </button>
        </div>
      </div>
    );
  }

  // 🚨🚨 LOCK MODAL OVERLAY 🚨🚨
  const isEffectivelyLocked = lockModal || checkIsEffectivelyLocked(currentUser, activeOrg);
  if (isEffectivelyLocked && currentUser?.role === "worker") {
    return (
      <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
        <div className="bg-slate-900 border border-yellow-500/50 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="flex justify-center mb-4">
             <Lock size={48} className="text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Off-Day / Access Locked</h2>
          <p className="text-yellow-400 text-sm mb-6">Your portal access is currently locked for an off-day or by an admin. Enjoy your break!</p>
          <button
            onClick={() => {
              try { window.close(); } catch (e) {}
              localStorage.removeItem("aura_session");
              sessionStorage.removeItem("aura_session");
              window.location.href = "/";
            }}
            className="px-8 py-3 bg-yellow-950/60 hover:bg-yellow-900/80 text-white font-semibold rounded-xl border border-yellow-500/30 transition-all"
          >
            Close Portal
          </button>
        </div>
      </div>
    );
  }
'''
    content = content.replace('  // Show loading until: (1) component mounted AND (2) session check done\n  if (!mounted || isCheckingSession) return (', modals + '\n  // Show loading until: (1) component mounted AND (2) session check done\n  if (!mounted || isCheckingSession) return (')

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

clean_modals('frontend/app/dashboard/page.js')
clean_modals('frontend/app/login/page.js')

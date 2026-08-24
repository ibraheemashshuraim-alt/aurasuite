def insert_lock(path):
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    lock_modal = '''
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
    new_lines = []
    in_kickout = False
    for line in lines:
        new_lines.append(line)
        if 'KICKOUT MODAL OVERLAY' in line:
            in_kickout = True
        
        if in_kickout and ('  }\n' in line or '  }\r\n' in line):
            new_lines.append(lock_modal)
            in_kickout = False

    with open(path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

insert_lock('frontend/app/dashboard/page.js')
insert_lock('frontend/app/login/page.js')

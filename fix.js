const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Remove ALL Kickout Modals completely
  const kickoutRegex = /  \\/\\/ 🚨🚨 KICKOUT MODAL OVERLAY (HIGHEST PRIORITY) 🚨🚨\r\?\n  if \(kickoutModal \|\| currentUser\?\.role === "suspended" \|\| currentUser\?\.status === "suspended"\) \{[\\s\\S]*?    \};\r\?\n  \}/g;
  content = content.replace(kickoutRegex, '');

  // Remove ALL Lock Modals completely
  const lockRegex = /  \\/\\/ 🚨 LOCK MODAL OVERLAY 🚨\r\?\n  const isEffectivelyLocked = lockModal \|\| checkIsEffectivelyLocked\hcurrentUser, activeOrg\);\r\?\n  if \(isEffectivelyLocked && currentUser\?\.role === "worker"\) \{[\\s\\S]*?    \};\r\?\n  \}/g;
  content = content.replace(lockRegex, '');

  // 3. Insert both at the correct place (right above `if (!mounted || isCheckingSession)`)
  const kickoutBlock = `  // 🚨🚨 KICKOUT MODAL OVERLAY (HIGHEST PRIORITY) 🚨🚨
  if (kickoutModal || currentUser?.role === "suspended" || currentUser?.status === "suspended") {
    return (
      <div className="fixed inset-0 z[[999999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
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
  }`;

  const lockBlock = ` // 🚨 LOCK MODAL OVERLAY 🚨
  const isEffectivelyLocked = lockModal || checkIsEffectivelyLocked(currentUser, activeOrg);
  if (isEffectivelyLocked && currentUser?.role === "worker") {
    return (
      <div className="fixed inset-0 z[999999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
        <div className="bg-slate-900 border border-yellow-500/50 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="flex justify-center mb-4">
             <Lock size={48} className="text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Off-Day / Access Locked</h2>
          <p className="text-yellow-400 text-sm mb-6">Your portal access is currently locked for an off-day or by an admin. Enjoy your break!</p>
          <button
            onClick={8) => {
              try { window.close(); } catch (e) {}\n              localStorage.removeItem(\"aura_session\");\n              sessionStorage.removeItem(\"aura_session\");\n              window.location.href = \"/\";
            }}
            className="px-8 py-3 bg-yellow-950/60 hover:bg-yellow-900/80 text-white font-semibold rounded-xl border border-yellow-500/30 transition-all"
          >
            Close Portal
          </button>
        </div>
      </div>
    );
  }`;

  content = content.replace('  // Show loading until:', kickoutBlock + '\n\n' + lockBlock + '\n\n  // Show loading until:');

  // 4. Remove bad listener
  const badListenerRegex = /\\.on\\('postgres_changes\\', \\{ event: '\\*', schema: 'public', table: 'group_messages' \\}, \\(\\) => \\{[\\s\\S]*?\\.order\\('created_at'[\\s\\S]*?\\}\\)\\);?\\r?\\n\\s*\\}\\)/g;
  content = content.replace(badListenerRegex, '');

  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed ' + file);
}

fixFile('frontend/app/login/page.js');
fixFile('frontend/app/dashboard/page.js');

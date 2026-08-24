import re

def fix(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove all lock modals
    content = re.sub(r'  // 🚨🚨 LOCK MODAL OVERLAY 🚨🚨\n  const isEffectivelyLocked[\s\S]*?    \);\n  \}\n', '', content)

    # Insert Lock Modal right under Kickout Modal
    kickout_insert = '    );\n  }\n\n  // 🚨🚨 LOCK MODAL OVERLAY 🚨🚨\n  const isEffectivelyLocked = lockModal || checkIsEffectivelyLocked(currentUser, activeOrg);\n  if (isEffectivelyLocked && currentUser?.role === "worker") {\n    return (\n      <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">\n        <div className="bg-slate-900 border border-yellow-500/50 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">\n          <div className="flex justify-center mb-4">\n             <Lock size={48} className="text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />\n          </div>\n          <h2 className="text-2xl font-bold text-white mb-4">Off-Day / Access Locked</h2>\n          <p className="text-yellow-400 text-sm mb-6">Your portal access is currently locked for an off-day or by an admin. Enjoy your break!</p>\n          <button\n            onClick={() => {\n              try { window.close(); } catch (e) {}\n              localStorage.removeItem("aura_session");\n              sessionStorage.removeItem("aura_session");\n              window.location.href = "/";\n            }}\n            className="px-8 py-3 bg-yellow-950/60 hover:bg-yellow-900/80 text-white font-semibold rounded-xl border border-yellow-500/30 transition-all"\n          >\n            Close Portal\n          </button>\n        </div>\n      </div>\n    );\n  }\n'

    content = re.sub(r'  // 🚨🚨 KICKOUT MODAL OVERLAY \(HIGHEST PRIORITY\) 🚨🚨\n  if \(kickoutModal[\s\S]*?    \);\n  \}\n', lambda m: m.group(0) + '\n' + kickout_insert, content, count=1)
    
    # Remove bad listener
    content = re.sub(r'        \.on\(\'postgres_changes\', \{ event: \'\*\', schema: \'public\', table: \'group_messages\' \}, \(\) => \{\n          supabase\.from\(\'group_messages\'\)\.select\(\'\*\'\)\.order\(\'created_at\', \{ ascending: true \}\)\.then\(\(\{ data \}\) => \{[\s\S]*?          \}\);\n        \}\)\n', '', content)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

fix('frontend/app/dashboard/page.js')
fix('frontend/app/login/page.js')

import re

filepath = 'frontend/app/login/page.js'
with open(filepath, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Rewrite checkIsEffectivelyLocked
old_check = r"function checkIsEffectivelyLocked\(user, org\) \{[\s\S]*?\n  \}\n  return false;\n\}"
new_check = """function checkIsEffectivelyLocked(user, org) {
  if (!user || user.role !== 'worker') return false;
  return !!user.is_locked;
}"""
code = re.sub(old_check, new_check, code)

# 2. Fix the popups logic
# I'll find the blocks
pattern = r"""if \(\(currentUser && currentUser\.role !== 'super_admin' && isOrgSuspended\) \|\| authBlockedByOrg\) \{
      if \(true\) \{
        return \(
          <div className="fixed inset-0 z-\[999999\] flex items-center justify-center bg-black/95 backdrop-blur-lg p-4">
            <div className="bg-slate-950 border-2 border-red-500/50 rounded-2xl p-8 max-w-md w-full text-center shadow-\[0_0_50px_rgba\(239,68,68,0\.3\)\]">
              <div className="flex justify-center mb-6">
                 <ShieldAlert size=\{64\} className="text-red-500 drop-shadow-\[0_0_20px_rgba\(239,68,68,0\.8\)\] animate-pulse" />
              </div>
              <h2 className="text-3xl font-black text-white mb-4 tracking-wider">Access Revoked</h2>
              <p className="text-red-400 text-sm mb-8 leading-relaxed font-medium">Your organization's access to AuraSuite has been suspended or banned by the Super Admin\. Please contact support for further details\.</p>
              <button
                onClick=\{.*?\}
                className="w-full py-4 bg-red-950 hover:bg-red-900 text-white font-bold rounded-xl border border-red-500/30 transition-all uppercase tracking-widest"
              >
                Close Portal
              </button>
            </div>
          </div>
        \);
      \}
      if \(isOrgLocked\) \{
        return \(
          <div className="fixed inset-0 z-\[999999\] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <div className="bg-slate-900 border border-yellow-500/50 rounded-2xl p-8 max-w-md w-full text-center shadow-\[0_0_30px_rgba\(234,179,8,0\.2\)\]">
              <div className="flex justify-center mb-6">
                 <Lock size=\{56\} className="text-yellow-500 drop-shadow-\[0_0_15px_rgba\(234,179,8,0\.5\)\]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Access Locked</h2>
              <p className="text-yellow-400 text-sm mb-6 leading-relaxed">[^<]*<br/><br/>\(Some issue has occurred, work is in progress\. The account will be reactivated as soon as the work is complete\.\)</p>
              <button
                onClick=\{.*?\}
                className="px-8 py-3 bg-yellow-950/60 hover:bg-yellow-900/80 text-white font-semibold rounded-xl border border-yellow-500/30 transition-all"
              >
                Close Portal
              </button>
            </div>
          </div>
        \);
      \}
    \}"""

replacement = """    if ((currentUser && currentUser.role !== 'super_admin' && isOrgSuspended) || authBlockedByOrg) {
      return (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/95 backdrop-blur-lg p-4">
          <div className="bg-slate-950 border-2 border-red-500/50 rounded-2xl p-8 max-w-md w-full text-center shadow-[0_0_50px_rgba(239,68,68,0.3)]">
            <div className="flex justify-center mb-6">
               <ShieldAlert size={64} className="text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-pulse" />
            </div>
            <h2 className="text-3xl font-black text-white mb-4 tracking-wider">Access Revoked</h2>
            <p className="text-red-400 text-sm mb-8 leading-relaxed font-medium">Your organization's access to AuraSuite has been suspended or banned by the Super Admin. Please contact support for further details.</p>
            <button
              onClick={() => {
                try { window.close(); } catch (e) {}
                localStorage.removeItem("aura_session");
                sessionStorage.removeItem("aura_session");
                window.location.href = "/";
              }}
              className="w-full py-4 bg-red-950 hover:bg-red-900 text-white font-bold rounded-xl border border-red-500/30 transition-all uppercase tracking-widest"
            >
              Close Portal
            </button>
          </div>
        </div>
      );
    }
    
    if (currentUser && currentUser.role !== 'super_admin' && isOrgLocked) {
      return (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-yellow-500/50 rounded-2xl p-8 max-w-md w-full text-center shadow-[0_0_30px_rgba(234,179,8,0.2)]">
            <div className="flex justify-center mb-6">
               <Lock size={56} className="text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Access Locked</h2>
            <p className="text-yellow-400 text-sm mb-6 leading-relaxed">کچھ مسئلہ پیش آ گیا ہے، کام جاری ہے۔<br/><br/>(Some issue has occurred, work is in progress. The account will be reactivated as soon as the work is complete.)</p>
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
    }"""

# Using re.DOTALL to match across newlines inside onClick
code = re.sub(pattern, replacement, code, flags=re.DOTALL)

# Revert my previous addition
pattern2 = r"const isOrgLockedBySuperAdmin = activeOrg\?\.working_hours\?\.is_org_locked;\s*const isEffectivelyLocked = lockModal \|\| checkIsEffectivelyLocked\(currentUser, activeOrg\) \|\| isOrgLockedBySuperAdmin;\s*const shouldShowLockScreen = \(isEffectivelyLocked && currentUser\?\.role === \"worker\"\) \|\| \(isOrgLockedBySuperAdmin && currentUser\?\.role === \"admin\"\);\s*if \(shouldShowLockScreen\) \{"
replacement2 = """const isEffectivelyLocked = lockModal || checkIsEffectivelyLocked(currentUser, activeOrg);
    if (isEffectivelyLocked && currentUser?.role === "worker") {"""

code = re.sub(pattern2, replacement2, code)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(code)

print("Fixed login page")

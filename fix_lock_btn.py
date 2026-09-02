import re

def main():
    with open('frontend/app/dashboard/page.js', 'r', encoding='utf-8') as f:
        code = f.read()

    # 1. Change lock icon color to red, and hide it in suspended tab
    # We will find the cell that contains the lock button
    
    pattern = r'(<button onClick=\{\(\) => handleToggleOrgLock\(org\)\}.*?</button>)'
    
    new_button = """{activeOrgsTab === 'active' && (
                                  <button onClick={() => handleToggleOrgLock(org)} className={`p-1.5 border rounded-lg transition-all ${org.working_hours?.is_org_locked ? 'bg-red-950/50 border-red-500/50 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-red-950/10 border-red-500/20 text-red-500/50 hover:text-red-400 hover:border-red-500/50'}`} title={org.working_hours?.is_org_locked ? 'Unlock Org' : 'Lock Org (Work in progress)'}>
                                    {org.working_hours?.is_org_locked ? <Lock size={14} /> : <Unlock size={14} />}
                                  </button>
                                )}"""
    
    # We might have multiple matches if we run it again, so we just do a simple sub
    code = re.sub(pattern, new_button, code, flags=re.DOTALL)

    # 2. Add an explicit check: if currentUser is super_admin but they want to "preview" the lock screen?
    # No, we shouldn't lock out the super_admin. We will explain it to them.
    # Let's just fix the color and the suspended tab issue.
    
    # Wait, the popup says:
    # "Access Revoked"
    
    with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
        f.write(code)

if __name__ == '__main__':
    main()

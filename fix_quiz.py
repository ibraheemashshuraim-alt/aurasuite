import re

def fix_quiz(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # We need to change:
    # await supabase.from('profiles').update({ category: newCategory, domain: newDomain }).eq('id', currentUser.id);
    # setCurrentUser(prev => ({ ...prev, category: newCategory, domain: newDomain }));
    # setProfiles(prev => prev.map(p => p.id === currentUser.id ? { ...p, category: newCategory, domain: newDomain } : p));
    
    old_update = "await supabase.from('profiles').update({ category: newCategory, domain: newDomain }).eq('id', currentUser.id);"
    new_update = "const newSkills = [...(currentUser?.skills || []), 'assessment_completed'];\n          await supabase.from('profiles').update({ category: newCategory, domain: newDomain, skills: newSkills }).eq('id', currentUser.id);"
    
    old_set_current = "setCurrentUser(prev => ({ ...prev, category: newCategory, domain: newDomain }));"
    new_set_current = "setCurrentUser(prev => ({ ...prev, category: newCategory, domain: newDomain, skills: newSkills }));"
    
    old_set_profiles = "setProfiles(prev => prev.map(p => p.id === currentUser.id ? { ...p, category: newCategory, domain: newDomain } : p));"
    new_set_profiles = "setProfiles(prev => prev.map(p => p.id === currentUser.id ? { ...p, category: newCategory, domain: newDomain, skills: newSkills } : p));"

    content = content.replace(old_update, new_update)
    content = content.replace(old_set_current, new_set_current)
    content = content.replace(old_set_profiles, new_set_profiles)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

fix_quiz('frontend/app/login/page.js')
fix_quiz('frontend/app/dashboard/page.js')

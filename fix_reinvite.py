
import re

def fix_file(filename):
    with open(filename, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Fix the setProfiles filter bug
    content = content.replace(
        "setProfiles(prev => prev.filter(p => p.id !== existingProfile.id));",
        "// setProfiles removed"
    )
    
    # 2. Add newProfile back to state
    content = content.replace(
        "const { error: cErr } = await supabase.from(\x27digital_cards\x27).insert(newCard);\n                    if (cErr) throw cErr;",
        "const { error: cErr } = await supabase.from(\x27digital_cards\x27).insert(newCard);\n                    if (cErr) throw cErr;\n                    if (!isUpdate) setProfiles(prev => [...prev, newProfile]);\n                    if (isUpdate) setProfiles(prev => prev.map(p => p.id === newProfile.id ? newProfile : p));"
    )

    # 3. Prevent quiz from showing if already completed
    content = content.replace(
        "if (user.role === \x27worker\x27 || user.role === \x27student\x27) setShowQuiz(true);",
        "if ((user.role === \x27worker\x27 || user.role === \x27student\x27) && !(user.skills || []).includes(\x27assessment_completed\x27)) setShowQuiz(true);"
    )

    with open(filename, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Fixed {filename}")

fix_file("frontend/app/dashboard/page.js")
fix_file("frontend/app/login/page.js")


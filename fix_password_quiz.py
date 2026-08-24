
import re

def fix_file(filename):
    with open(filename, "r", encoding="utf-8") as f:
        content = f.read()

    pattern = re.compile(r"if \(user\.role === \x27worker\x27 \|\| user\.role === \x27student\x27\) \{\s*setShowQuiz\(true\);\s*\} else \{\s*setShowQuiz\(false\);\s*\}")
    
    replacement = "if ((user.role === \x27worker\x27 || user.role === \x27student\x27) && !(user.skills || []).includes(\x27assessment_completed\x27)) {\n          setShowQuiz(true);\n        } else {\n          setShowQuiz(false);\n        }"
        
    if pattern.search(content):
        content = pattern.sub(replacement, content)
        with open(filename, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Fixed quiz bug in {filename}")
    else:
        print(f"Target not found in {filename}")

fix_file("frontend/app/login/page.js")


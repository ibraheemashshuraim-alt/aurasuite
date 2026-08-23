
import re

with open("quiz_block.js", "r", encoding="utf-16") as f:
    quiz_block = f.read()

# Fix the end of the block in case there is some extra trailing stuff
quiz_block = re.sub(r"// \xe2\x95\x90.* MAIN APP .*$", "", quiz_block, flags=re.DOTALL).strip()

def replace_in_file(filename):
    with open(filename, "r", encoding="utf-8") as f:
        content = f.read()
    
    # We are looking for the block between "if (showQuiz) {" and the next return statement or Main App comment
    pattern = re.compile(r"// .* AI QUIZ \(ONBOARDING\) .*\n\s*if \(showQuiz\) \{.*?\n  \}\n", re.DOTALL)
    
    match = pattern.search(content)
    if not match:
        print(f"Could not find quiz block in {filename}")
        return
        
    new_content = content[:match.start()] + "// ------------------ AI QUIZ (ONBOARDING) ------------------\n  " + quiz_block + "\n\n" + content[match.end():]
    
    with open(filename, "w", encoding="utf-8") as f:
        f.write(new_content)
    print(f"Replaced in {filename}")

replace_in_file("frontend/app/dashboard/page.js")
replace_in_file("frontend/app/login/page.js")


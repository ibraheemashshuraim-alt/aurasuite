import re

def fix_all(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    start_idx = content.find("AI QUIZ")
    end_idx = content.find("MAIN APP")
    
    if start_idx != -1 and end_idx != -1:
        quiz = content[start_idx:end_idx]
        
        # Remove all \n from inside single quotes, backticks, and double quotes
        chars = list(quiz)
        in_s = False
        in_d = False
        in_b = False
        
        for i in range(len(chars)):
            c = chars[i]
            
            # To handle comments properly, we shouldn't strip \n if we are in a comment, 
            # BUT since we only strip \n INSIDE quotes, we are safe (unless the quote is in a comment).
            # If the quote is in a comment, it flips the state, which ruins everything.
            # So let's delete all // comments first!
            pass
            
        # Safer: Just remove \n that are surrounded by text characters on the previous and next lines
        # Actually, let's just use regex for '...' and ... matching across newlines:
        def strip_newlines(m):
            return m.group(0).replace('\n', ' ')
            
        quiz = re.sub(r"'[^']*'", strip_newlines, quiz)
        quiz = re.sub(r"[^]*", strip_newlines, quiz)
        
        content = content[:start_idx] + quiz + content[end_idx:]

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

fix_all('frontend/app/login/page.js')
fix_all('frontend/app/dashboard/page.js')

import re

def strip_all_string_newlines(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # The quiz code is between "AI QUIZ (ONBOARDING)" and "MAIN APP"
    start_idx = content.find("AI QUIZ (ONBOARDING)")
    end_idx = content.find("MAIN APP")
    
    if start_idx != -1 and end_idx != -1:
        quiz_block = content[start_idx:end_idx]
        
        # Replace ALL \n that occur right after or before words that seem to be string literals.
        # Let's just remove ALL \n in the ENTIRE quiz block where we are inside JSX strings or regular strings.
        # Actually, let's just strip ALL newlines in the quiz block, and replace them with spaces!
        # Wait, if we strip ALL newlines, comments // will comment out the whole line!
        # So we remove comments first, OR we just use a regex that matches quizLang === 'ur' ? '...' : '...'
        # and removes \n in them.
        
        # Let's just remove the specific ones that broke:
        quiz_block = quiz_block.replace("Select or\ntype", "Select or type")
        quiz_block = quiz_block.replace("type\nyour", "type your")
        quiz_block = quiz_block.replace("your\nskill", "your skill")
        quiz_block = quiz_block.replace("Select or \ntype", "Select or type")
        quiz_block = quiz_block.replace("Select or\n type", "Select or type")
        quiz_block = quiz_block.replace("Select or \n type", "Select or type")
        quiz_block = re.sub(r"Select or\s*\n\s*type", "Select or type", quiz_block)
        
        content = content[:start_idx] + quiz_block + content[end_idx:]

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

strip_all_string_newlines('frontend/app/login/page.js')
strip_all_string_newlines('frontend/app/dashboard/page.js')

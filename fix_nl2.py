import re

def fix_all_newlines(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the setQuizQuestions call specifically
    start_idx = content.find('setQuizQuestions([')
    end_idx = content.find(']);', start_idx)

    if start_idx != -1 and end_idx != -1:
        block = content[start_idx:end_idx]
        # Remove ALL newlines inside this block, and then add one after each }
        block = block.replace('\n', '')
        block = block.replace('},', '},\n')
        content = content[:start_idx] + block + content[end_idx:]

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

fix_all_newlines('frontend/app/login/page.js')
fix_all_newlines('frontend/app/dashboard/page.js')

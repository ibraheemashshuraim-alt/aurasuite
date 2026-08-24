import re

def fix_all_broken_strings(path):
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Join lines if the previous line ended with an unterminated single quote or backtick?
    # Actually, simpler: Any line ending in an Urdu character or a space with an unclosed quote.
    
    out = []
    i = 0
    while i < len(lines):
        line = lines[i]
        # if line has an odd number of single quotes, it's unterminated.
        # But wait, escaped quotes count. Let's just strip newlines from specific known broken strings.
        
        # We can just join everything into one string, find quizLang === 'ur' ? '...' : '...' and regex it.
        # It's better to just use a quick regex on the whole content.
        i += 1

    content = "".join(lines)
    # find all strings that look like: 'ur' ? '... \n ...' : '...'
    
    # Or just remove newline characters between single quotes. 
    # Since JS string literals can't span lines, ANY newline inside a single quote is a syntax error!
    
    # We will iterate through characters.
    chars = list(content)
    in_single = False
    in_double = False
    in_backtick = False
    
    for idx, c in enumerate(chars):
        # Handle escapes
        if c == "'" and not in_double and not in_backtick:
            if idx == 0 or chars[idx-1] != '\\':
                in_single = not in_single
        elif c == '"' and not in_single and not in_backtick:
            if idx == 0 or chars[idx-1] != '\\':
                in_double = not in_double
        elif c == '' and not in_single and not in_double:
            if idx == 0 or chars[idx-1] != '\\':
                in_backtick = not in_backtick
                
        # If we are inside a single or double quote, newlines are illegal in JS!
        if c == '\n' and (in_single or in_double):
            chars[idx] = ' ' # replace with space
            
    content = "".join(chars)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

fix_all_broken_strings('frontend/app/login/page.js')
fix_all_broken_strings('frontend/app/dashboard/page.js')

import re

def fix_newlines_in_strings(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all strings like '...' or "..." or ... and remove newlines?
    # No, just find quizLang === 'ur' ? '...'
    
    # Let's just remove newlines before Urdu characters or inside the specific blocks
    # Better: just remove all newlines between ' and ' if it contains urdu or is part of quizLang.
    # Actually, let's just find " ? '" and "' :" and remove newlines in between.
    
    # Or just replace the exact broken lines!
    content = content.replace("'?-^ ??-^ǩ ??\"'\"O\"~?-\"\n??\"'?\"'\"~\"~Ǿ\"~ '", "'?-^ ??-^ǩ ??\"'\"O\"~?-\" ??\"'?\"'\"~\"~Ǿ\"~ '")
    content = content.replace("'AuraSuite AI \"O\"~Ǧ ?\"~ \"O? \"~?-'\"~Ǧ\"~Ǭ??\"~\n?-^ǩ??-' \"O?-'\"~Ǿ-^ ?-^ǩ\"O '-^'", "'AuraSuite AI \"O\"~Ǧ ?\"~ \"O? \"~?-'\"~Ǧ\"~Ǭ??\"~ ?-^ǩ??-' \"O?-'\"~Ǿ-^ ?-^ǩ\"O '-^'")
    content = content.replace("'AuraSuite \"~-^ǩ\"O ' ?\"~Ǧ?\" ?\"~?-^ǩ?!\n-^Ǭ\"~??-'-^ AI \"O\"~Ǧ ?\"~ \"O-^ǩ \"~-^Ǭ??-'?\"~Ǧ\"O ' \"O? ?\"~Ǿ???-\"-^Ǭ \"~σ\"O?\"~Ǿ? -^Ǭ-^ ??\"O-^Ǭ ?\"~ \"O\"~Ǧ ??-'?\"'? \"~ ??\"'\"O?\"'\n?-^ǩ-^ ?? ?\"'\"O-^ǩ\"O '-^'", "'AuraSuite \"~-^ǩ\"O ' ?\"~Ǧ?\" ?\"~?-^ǩ?! -^Ǭ\"~??-'-^ AI \"O\"~Ǧ ?\"~ \"O-^ǩ \"~-^Ǭ??-'?\"~Ǧ\"O ' \"O? ?\"~Ǿ???-\"-^Ǭ \"~σ\"O?\"~Ǿ? -^Ǭ-^ ??\"O-^Ǭ ?\"~ \"O\"~Ǧ ??-'?\"'? \"~ ??\"'\"O?\"' ?-^ǩ-^ ?? ?\"'\"O-^ǩ\"O '-^'")
    content = content.replace("'??\"'?\"'\"~\"~Ǿ\"~  \"~Ǭ-^ǩ\"~'", "'??\"'?\"'\"~\"~Ǿ\"~  \"~Ǭ-^ǩ\"~'")
    content = content.replace("?\"~ \"~Ǿ-^\n \"~-^ǩ\"O ' ?\"'-^  \"O? ???-^ǩ? ?\"~Ǧ?? ?-^ǩ?-^ \"~??\"' -^Ǭ\"~Ǧ\"~Ǿ-^ \"O-^ \"~σ-^ǩ-^ 3\n??-'\"O??-' -^Ǭ-^ǩ\"O '-^", "?\"~ \"~Ǿ-^  \"~-^ǩ\"O ' ?\"'-^  \"O? ???-^ǩ? ?\"~Ǧ?? ?-^ǩ?-^ \"~??\"' -^Ǭ\"~Ǧ\"~Ǿ-^ \"O-^ \"~σ-^ǩ-^ 3 ??-'\"O??-' -^Ǭ-^ǩ\"O '-^")
    
    # Just loop through the string and if we find \n inside '...' and it's near quizLang, we replace it.
    out = []
    in_single_quote = False
    for i, c in enumerate(content):
        if c == "'":
            # skip escaped quotes
            if i > 0 and content[i-1] != "\\":
                in_single_quote = not in_single_quote
        
        if c == '\n' and in_single_quote:
            out.append(' ') # replace newline with space
        else:
            out.append(c)

    content = ''.join(out)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

fix_newlines_in_strings('frontend/app/login/page.js')
fix_newlines_in_strings('frontend/app/dashboard/page.js')

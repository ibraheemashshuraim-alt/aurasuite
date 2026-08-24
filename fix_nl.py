import re

def fix_newlines(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the setQuizQuestions arrays and remove newlines within the object definitions
    
    # Simple replace:
    content = content.replace("question_ur: '?\"~ \"O-^ǩ \"~-^Ǭ??-'? \"O?\n?\"~Ǿ-^ǩ??-^ǩ ?\"? ?-^Ǭ \"O\"~Ǧ\"~Ǿ ?\"'? -^Ǭ-^?'', options:", "question_ur: '?\"~ \"O-^ǩ \"~-^Ǭ??-'? \"O? ?\"~Ǿ-^ǩ??-^ǩ ?\"? ?-^Ǭ \"O\"~Ǧ\"~Ǿ ?\"'? -^Ǭ-^?'', options:")
    content = content.replace("'Operations'], options_ur: ['?\"'?\"~Ǭ\"~  \"~Ǧ-^ǩ??-' \"OǦ-^ǩ\"~Ǧ\"~σ\"~\"~\"~Ǿ\"~ ', '\"OǦ-^ǩ?-\"??\"~Ǿ/\"O?-'-^ǩ?-^ǩ\"~ \"~Ǧ', '\"~-^ǩ\"~Ǿ?\"~\"~Ǿ\"~ ',\n'?\"~?-'-^ǩ?\"σ\"~Ǿ?-\"'] },", "'Operations'], options_ur: ['?\"'?\"~Ǭ\"~  \"~Ǧ-^ǩ??-' \"OǦ-^ǩ\"~Ǧ\"~σ\"~\"~\"~Ǿ\"~ ', '\"OǦ-^ǩ?-\"??\"~Ǿ/\"O?-'-^ǩ?-^ǩ\"~ \"~Ǧ', '\"~-^ǩ\"~Ǿ?\"~\"~Ǿ\"~ ', '?\"~?-'-^ǩ?\"σ\"~Ǿ?-\"'] },")
    content = content.replace("question_ur: '?\"~ \"O\"~Ǧ\"~Ǿ\n?\"'-^ǩ \"~?-'\"~Ǧ\"O?-'?\"~\"~Ǿ\"O ?-\"??\"~Ǿ\"~Ǧ\"O ' \"~-^ǩ\"O ' ?-\"-^ǩ??-^Ǭ \"~-^Ǭ??-'? ?-'\"O\"O?-^ -^Ǭ-^ǩ\"O '?'', options:", "question_ur: '?\"~ \"O\"~Ǧ\"~Ǿ ?\"'-^ǩ \"~?-'\"~Ǧ\"O?-'?\"~\"~Ǿ\"O ?-\"??\"~Ǿ\"~Ǧ\"O ' \"~-^ǩ\"O ' ?-\"-^ǩ??-^Ǭ \"~-^Ǭ??-'? ?-'\"O\"O?-^ -^Ǭ-^ǩ\"O '?'', options:")
    content = content.replace("['JavaScript/TypeScript', 'Python', 'Java/C#', 'Not Applicable'], options_ur: ['JavaScript/TypeScript', 'Python',\n'Java/C#', '\"~Ǹ??\"~ ???\"~?\"~Ǹ \"~Ǿ-^Ǭ-^ǩ\"O ''] },", "['JavaScript/TypeScript', 'Python', 'Java/C#', 'Not Applicable'], options_ur: ['JavaScript/TypeScript', 'Python', 'Java/C#', '\"~Ǹ??\"~ ???\"~?\"~Ǹ \"~Ǿ-^Ǭ-^ǩ\"O ''] },")
    content = content.replace("question_ur: '?\"~ \"O? \"O?\"~Ǿ? ???-'?-^Ǭ\n-^Ǭ-^?'', options: ['0-2 Years', '3-5 Years', '5-10 Years', '10+ Years'], options_ur: ['0-2 ?\"'?\"~', '3-5 ?\"'?\"~',\n'5-10 ?\"'?\"~', '10+ ?\"'?\"~'] }", "question_ur: '?\"~ \"O? \"O?\"~Ǿ? ???-'?-^Ǭ -^Ǭ-^?'', options: ['0-2 Years', '3-5 Years', '5-10 Years', '10+ Years'], options_ur: ['0-2 ?\"'?\"~', '3-5 ?\"'?\"~', '5-10 ?\"'?\"~', '10+ ?\"'?\"~'] }")

    # For any remaining single quote line break inside strings, let's just use regex
    # Replace \n inside ''
    def replacer(match):
        return match.group(0).replace('\n', '')
    
    # Simple regex to remove newlines within lines ending with , options:
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

fix_newlines('frontend/app/login/page.js')
fix_newlines('frontend/app/dashboard/page.js')

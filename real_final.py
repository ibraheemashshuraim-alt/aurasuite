import re
with open('clean_quiz.txt', 'r', encoding='utf-8') as f:
    c = f.read()
def r(m): return m.group(0).replace('\n', ' ')
c = re.sub(r"'ur'\s*\?\s*'([^']*)'", r, c, flags=re.DOTALL)
c = re.sub(r"'ur'\s*\?\s*`([^`]*)`", r, c, flags=re.DOTALL)
c = re.sub(r"options_ur:\s*\[(.*?)\]", r, c, flags=re.DOTALL)
c = re.sub(r"options:\s*\[(.*?)\]", r, c, flags=re.DOTALL)
c = re.sub(r"question_ur:\s*'(.*?)'", r, c, flags=re.DOTALL)
c = re.sub(r"question:\s*'(.*?)'", r, c, flags=re.DOTALL)
with open('clean_quiz.txt', 'w', encoding='utf-8') as f:
    f.write(c)

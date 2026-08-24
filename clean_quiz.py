with open('quiz_block.txt', 'r', encoding='utf-16') as f:
    lines = f.readlines()

brace_count = 0
started = False
out = []
for line in lines:
    if "AI QUIZ" in line:
        continue
    if "if (showQuiz) {" in line:
        started = True
    
    if started:
        out.append(line.rstrip())
        brace_count += line.count('{')
        brace_count -= line.count('}')
        if brace_count == 0:
            break

with open('clean_quiz.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(out))

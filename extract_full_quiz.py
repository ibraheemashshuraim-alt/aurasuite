with open('old_login_c1d46dd.js', 'r', encoding='utf-16') as f:
    lines = f.readlines()

out = []
capture = False
for line in lines:
    if "AI QUIZ (ONBOARDING)" in line:
        capture = True
    if capture:
        out.append(line.rstrip())
    if capture and "if (isEnteringDashboard)" in line:
        break

with open('full_old_quiz.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(out))

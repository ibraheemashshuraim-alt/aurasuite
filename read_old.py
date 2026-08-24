with open('old_login.js', 'r', encoding='utf-16') as f:
    lines = f.readlines()

out = []
capture = False
for line in lines:
    if "AI QUIZ (ONBOARDING)" in line:
        capture = True
    if capture:
        out.append(line.strip())
    if capture and "if (isEnteringDashboard)" in line:
        break

print('\n'.join(out[:150]))

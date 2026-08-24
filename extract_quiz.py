import subprocess
import re

result = subprocess.run(['git', 'log', '-p', '-n', '15', 'frontend/app/login/page.js'], capture_output=True, text=True)

lines = result.stdout.split('\n')
capturing = False
out = []
for line in lines:
    if "AI QUIZ (ONBOARDING)" in line:
        capturing = True
    if capturing:
        out.append(line)
    if capturing and "if (isEnteringDashboard)" in line:
        break

print('\n'.join(out[:100]))

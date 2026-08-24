import sys
import subprocess

result = subprocess.run(['git', 'show', 'c1d46dd:frontend/app/login/page.js'], capture_output=True)
content = result.stdout.decode('utf-8', errors='ignore')

start = content.find("if (showQuiz) {")
print("start:", start)
end1 = content.find("MAIN APP", start)
end2 = content.find("KICKOUT MODAL", start)
print("end1:", end1)
print("end2:", end2)

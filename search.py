
import sys
with open("frontend/app/dashboard/page.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "handleSuspendUser" in line:
        print(f"Line {i}: {line.strip()}")


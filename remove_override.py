
import re

def fix_file(filename):
    with open(filename, "r", encoding="utf-8") as f:
        content = f.read()

    content = content.replace("if (isWorker) setActiveTab(\x27dashboard\x27);", "// if (isWorker) setActiveTab(\x27dashboard\x27);", 1)

    with open(filename, "w", encoding="utf-8") as f:
        f.write(content)

fix_file("frontend/app/login/page.js")


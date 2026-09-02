import re

with open('frontend/app/dashboard/page.js', 'r', encoding='utf-8') as f:
    d = f.read()

d = d.replace("setIsSendingChat(true);\n    try {\n      const msgId = genId('msg');", "setIsSendingChat(true);\n    setTimeout(() => setIsSendingChat(false), 2000);\n    try {\n      const msgId = genId('msg');")

with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(d)
print("Added failsafe for audio")

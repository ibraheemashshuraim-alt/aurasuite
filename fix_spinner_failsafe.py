import re

with open('frontend/app/dashboard/page.js', 'r', encoding='utf-8') as f:
    d = f.read()

# Fix 1: Ensure timeout is registered IMMEDIATELY so it fires even if await hangs
d = d.replace("setIsSendingChat(true);\n\n    try {", "setIsSendingChat(true);\n    setTimeout(() => setIsSendingChat(false), 2000);\n\n    try {")

with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(d)
print("Added failsafe spinner timeout")

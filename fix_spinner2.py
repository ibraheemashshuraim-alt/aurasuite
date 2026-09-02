import re

with open('frontend/app/dashboard/page.js', 'r', encoding='utf-8') as f:
    d = f.read()

d = re.sub(r"finally \{\s*setIsSendingChat\(false\);\s*\}", "finally { setIsSendingChat(false); setTimeout(() => setIsSendingChat(false), 3000); }", d)

with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(d)
print("Replaced successfully")

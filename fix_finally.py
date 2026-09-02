import re

with open('frontend/app/dashboard/page.js', 'r', encoding='utf-8') as f:
    d = f.read()

# Fix the ReferenceError in finally block
d = d.replace("} finally { if (needsSpinner) { setIsSendingChat(false); } }", "} finally { setIsSendingChat(false); }")

with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(d)
print("Fixed finally blocks")

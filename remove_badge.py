import re

with open('frontend/app/dashboard/page.js', 'r', encoding='utf-8') as f:
    d = f.read()

# Remove the Green Badge completely
d = re.sub(r'<div className="fixed bottom-4 right-4 z-\[9999999999\] bg-green-500.*?</div>', '', d, flags=re.DOTALL)

with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(d)
print("Removed debug badge")

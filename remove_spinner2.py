import re

with open('frontend/app/dashboard/page.js', 'r', encoding='utf-8') as f:
    d = f.read()

# Forcefully remove setIsSendingChat(true) from handleSendMessage
d = d.replace("setIsSendingChat(true);\n    setTimeout(() => setIsSendingChat(false), 2000);\n\n    try {", "if (filesToProcess.length > 0 || currentAudioBlob) { setIsSendingChat(true); setTimeout(() => setIsSendingChat(false), 2000); }\n    try {")

with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(d)
print("Removed spinner manually")

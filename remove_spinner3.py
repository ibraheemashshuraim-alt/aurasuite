import re

with open('frontend/app/dashboard/page.js', 'r', encoding='utf-8') as f:
    d = f.read()

# Fix ReferenceError
d = d.replace("if (filesToProcess.length > 0 || currentAudioBlob) { setIsSendingChat(true); setTimeout(() => setIsSendingChat(false), 2000); }\n    try {", "if (currentAttachmentFiles.length > 0 || currentAudioBlob) { setIsSendingChat(true); setTimeout(() => setIsSendingChat(false), 2000); }\n    try {")

with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(d)
print("Fixed reference error")

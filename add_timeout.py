import re

d = open('frontend/app/dashboard/page.js', 'r', encoding='utf-8').read()

# Replace supabase.storage.from('chat_attachments').upload with a Promise.race timeout (15s)
upload_old = re.compile(r"await supabase\.storage\.from\('chat_attachments'\)\.upload\((\w+), (\w+)(?:, \{ contentType: (\w+)\.type \})?\);", re.DOTALL)

def replacer(match):
    fileName = match.group(1)
    fileObj = match.group(2)
    has_content = match.group(3)
    content_str = f", {{ contentType: {has_content}.type }}" if has_content else ""
    return f"""await Promise.race([
        supabase.storage.from('chat_attachments').upload({fileName}, {fileObj}{content_str}),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Upload timed out after 15 seconds")), 15000))
      ]);"""

d = upload_old.sub(replacer, d)

with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(d)
print("Added timeout to uploads")

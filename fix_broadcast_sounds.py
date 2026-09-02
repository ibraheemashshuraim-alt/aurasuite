import re

files = ['frontend/app/dashboard/page.js', 'frontend/app/login/page.js']

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        code = f.read()

    # new-group-message broadcast
    pattern_group_bc = r"\.on\('broadcast', \{ event: 'new-group-message' \}, \(payload\) => \{\s*if \(payload\?\.payload\) \{\s*const message = payload\.payload;"
    replacement_group_bc = """.on('broadcast', { event: 'new-group-message' }, (payload) => {
          if (payload?.payload) {
            const message = payload.payload;
            if (message.from !== currentUserRef.current?.id) playSoundEffect('incoming_msg');"""
    code = re.sub(pattern_group_bc, replacement_group_bc, code)

    # new-dm-message broadcast
    pattern_dm_bc = r"\.on\('broadcast', \{ event: 'new-dm-message' \}, \(payload\) => \{\s*const message = payload\?\.payload;\s*const currentId = currentUserRef\.current\?\.id;\s*if \(\!message\?\.thread_key \|\| \!currentId \|\| \!message\.thread_key\.includes\(currentId\)\) return;"
    replacement_dm_bc = """.on('broadcast', { event: 'new-dm-message' }, (payload) => {
          const message = payload?.payload;
          const currentId = currentUserRef.current?.id;
          if (!message?.thread_key || !currentId || !message.thread_key.includes(currentId)) return;
          if (message.from !== currentId) playSoundEffect('incoming_msg');"""
    code = re.sub(pattern_dm_bc, replacement_dm_bc, code)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(code)

print("Added sounds to broadcast listeners")

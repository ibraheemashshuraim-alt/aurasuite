import re

files = ['frontend/app/dashboard/page.js', 'frontend/app/login/page.js']

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        code = f.read()

    # Incoming Group Message
    pattern_group_in = r"if \(payload\.eventType === 'INSERT'\) \{\s*const m = payload\.new;"
    replacement_group_in = """if (payload.eventType === 'INSERT') {
            const m = payload.new;
            if (m.from_id !== currentUserRef.current?.id) playSoundEffect('incoming_msg');"""
    code = re.sub(pattern_group_in, replacement_group_in, code)

    # Incoming DM Message
    pattern_dm_in = r"if \(payload\.eventType === 'INSERT'\) \{\s*const m = payload\.new;"
    # Wait, the DM listener looks like:
    # const row = payload.new || payload.old;
    # if (!row?.thread_key?.includes(currentUser.id)) return;
    # if (payload.eventType === 'INSERT') { ...
    # So replacing `payload.eventType === 'INSERT'` will match BOTH!
    # Let's just do a global replace for both since they are identical!
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(code)

print("Added incoming msg sounds.")

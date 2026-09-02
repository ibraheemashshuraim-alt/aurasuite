import re
import os

files = ['frontend/app/dashboard/page.js', 'frontend/app/login/page.js']

for filepath in files:
    with open(filepath, 'r', encoding='utf8') as f:
        code = f.read()

    # Ignore group messages for clients
    msg_target = r"\.on\('broadcast', \{ event: 'new-group-message' \}, \(payload\) => \{"
    msg_new = r".on('broadcast', { event: 'new-group-message' }, (payload) => {\n            if (currentUserRef.current?.role === 'client') return;"
    code = re.sub(msg_target, msg_new, code)

    upd_target = r"\.on\('broadcast', \{ event: 'group-message-updated' \}, \(payload\) => \{"
    upd_new = r".on('broadcast', { event: 'group-message-updated' }, (payload) => {\n            if (currentUserRef.current?.role === 'client') return;"
    code = re.sub(upd_target, upd_new, code)

    del_target = r"\.on\('broadcast', \{ event: 'group-message-deleted' \}, \(payload\) => \{"
    del_new = r".on('broadcast', { event: 'group-message-deleted' }, (payload) => {\n            if (currentUserRef.current?.role === 'client') return;"
    code = re.sub(del_target, del_new, code)

    # Ignore group calls for clients
    # Finding chat-call-invite
    call_target = r"\.on\('broadcast', \{ event: 'chat-call-invite' \}, \(payload\) => \{"
    call_new = r".on('broadcast', { event: 'chat-call-invite' }, (payload) => {\n            if (currentUserRef.current?.role === 'client' && payload?.payload?.scope === 'group') return;"
    code = re.sub(call_target, call_new, code)
    
    with open(filepath, 'w', encoding='utf8') as f:
        f.write(code)

print("Patched broadcast listeners.")

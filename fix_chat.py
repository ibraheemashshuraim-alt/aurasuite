import re

with open('frontend/app/dashboard/page.js', 'r', encoding='utf-8') as f:
    d = f.read()

# Fix 1: The insert for text chat messages needs a broadcast attached.
text_insert_old = r"await supabase\.from\('group_messages'\)\.insert\(\{ id: msgId, organization_id: activeOrg\.id, from_id: currentUser\.id, from_name: currentUser\.full_name, text: currentChatInput, msg_time: msgTime, type: 'chat', audio_url: audioUrl, attachment_url: null \}\);"

text_insert_new = """await supabase.from('group_messages').insert({ id: msgId, organization_id: activeOrg.id, from_id: currentUser.id, from_name: currentUser.full_name, text: currentChatInput, msg_time: msgTime, type: 'chat', audio_url: audioUrl, attachment_url: null });
            if (kickoutChannelRef.current) {
                kickoutChannelRef.current.send({ type: 'broadcast', event: 'new-group-message', payload: { id: msgId, organization_id: activeOrg.id, from: currentUser.id, fromName: currentUser.full_name, text: currentChatInput, time: msgTime, type: 'chat', attachmentUrl: null, audioUrl: audioUrl, reactions: {} } });
            }"""

if re.search(text_insert_old, d):
    d = re.sub(text_insert_old, text_insert_new, d)
    print("Replaced text chat insert")
else:
    print("FAILED to find text chat insert")


# Fix 2: The insert for audio chat messages needs a broadcast attached.
audio_insert_old = r"await supabase\.from\('group_messages'\)\.insert\(\{ id: msgId, organization_id: activeOrg\.id, from_id: currentUser\.id, from_name: currentUser\.full_name, text: '', msg_time: msgTime, type: 'chat', audio_url: audioUrl, attachment_url: null \}\);"

audio_insert_new = """await supabase.from('group_messages').insert({ id: msgId, organization_id: activeOrg.id, from_id: currentUser.id, from_name: currentUser.full_name, text: '', msg_time: msgTime, type: 'chat', audio_url: audioUrl, attachment_url: null });
            if (kickoutChannelRef.current) {
                kickoutChannelRef.current.send({ type: 'broadcast', event: 'new-group-message', payload: { id: msgId, organization_id: activeOrg.id, from: currentUser.id, fromName: currentUser.full_name, text: '', time: msgTime, type: 'chat', attachmentUrl: null, audioUrl: audioUrl, reactions: {} } });
            }"""

if re.search(audio_insert_old, d):
    d = re.sub(audio_insert_old, audio_insert_new, d)
    print("Replaced audio chat insert")
else:
    print("FAILED to find audio chat insert")


# Fix 3: The insert for attachment chat messages needs a broadcast attached.
attach_insert_old = r"if \(activeChat === 'group' && activeOrg\?\.id\) await supabase\.from\('group_messages'\)\.insert\(\{ \.\.\.msgData, organization_id: activeOrg\.id \}\);"

attach_insert_new = """if (activeChat === 'group' && activeOrg?.id) {
              await supabase.from('group_messages').insert({ ...msgData, organization_id: activeOrg.id });
              if (kickoutChannelRef.current) {
                  kickoutChannelRef.current.send({ type: 'broadcast', event: 'new-group-message', payload: { id: msgId, organization_id: activeOrg.id, from: currentUser.id, fromName: currentUser.full_name, text: msgText, time: msgTime, type: 'chat', attachmentUrl: msgData.attachment_url, audioUrl: null, reactions: {} } });
              }
            }"""

if re.search(attach_insert_old, d):
    d = re.sub(attach_insert_old, attach_insert_new, d)
    print("Replaced attach chat insert")
else:
    print("FAILED to find attach chat insert")

with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(d)

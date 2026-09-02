import re

with open('frontend/app/dashboard/page.js', 'r', encoding='utf-8') as f:
    d = f.read()

# Make text insert backgrounded (no await)
# For files:
d = d.replace("await supabase.from('group_messages').insert({ ...msgData, organization_id: activeOrg.id });", "supabase.from('group_messages').insert({ ...msgData, organization_id: activeOrg.id }).then(() => {});")
d = d.replace("await supabase.from('dm_messages').insert({ ...msgData, thread_key: key });", "supabase.from('dm_messages').insert({ ...msgData, thread_key: key }).then(() => {});")

# For text:
d = d.replace("await supabase.from('group_messages').insert({ id: msgId, organization_id: activeOrg.id, from_id: currentUser.id, from_name: currentUser.full_name, text: currentChatInput, msg_time: msgTime, type: 'chat', audio_url: audioUrl, attachment_url: null });", "supabase.from('group_messages').insert({ id: msgId, organization_id: activeOrg.id, from_id: currentUser.id, from_name: currentUser.full_name, text: currentChatInput, msg_time: msgTime, type: 'chat', audio_url: audioUrl, attachment_url: null }).then(() => {});")
d = d.replace("await supabase.from('dm_messages').insert({ id: msgId, thread_key: key, from_id: currentUser.id, from_name: currentUser.full_name, text: currentChatInput, msg_time: msgTime, audio_url: audioUrl, attachment_url: null });", "supabase.from('dm_messages').insert({ id: msgId, thread_key: key, from_id: currentUser.id, from_name: currentUser.full_name, text: currentChatInput, msg_time: msgTime, audio_url: audioUrl, attachment_url: null }).then(() => {});")

# Direct audio:
d = d.replace("await supabase.from('group_messages').insert({ id: msgId, organization_id: activeOrg.id, from_id: currentUser.id, from_name: currentUser.full_name, text: '', msg_time: msgTime, type: 'chat', audio_url: audioUrl, attachment_url: null });", "supabase.from('group_messages').insert({ id: msgId, organization_id: activeOrg.id, from_id: currentUser.id, from_name: currentUser.full_name, text: '', msg_time: msgTime, type: 'chat', audio_url: audioUrl, attachment_url: null }).then(() => {});")
d = d.replace("await supabase.from('dm_messages').insert({ id: msgId, thread_key: key, from_id: currentUser.id, from_name: currentUser.full_name, text: '', msg_time: msgTime, audio_url: audioUrl, attachment_url: null });", "supabase.from('dm_messages').insert({ id: msgId, thread_key: key, from_id: currentUser.id, from_name: currentUser.full_name, text: '', msg_time: msgTime, audio_url: audioUrl, attachment_url: null }).then(() => {});")

with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(d)
print("Removed await from chat inserts")

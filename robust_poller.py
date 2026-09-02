import re

d = open('frontend/app/dashboard/page.js', 'r', encoding='utf-8').read()

# 1. Update the 30s interval to bust cache and also fetch chat messages!
tick_old = re.compile(r"const int = setInterval\(\(\) => setTimeTick\(t => t \+ 1\), 30000\);", re.DOTALL)
tick_new = """const int = setInterval(async () => {
      setTimeTick(t => t + 1);
      const rand = Date.now().toString();
      
      // 1. Force fetch organizations (Bust cache with neq)
      if (activeOrgRef.current?.id) {
        const { data } = await supabase.from('organizations').select('*').eq('id', activeOrgRef.current.id).neq('name', rand).single();
        if (data) setActiveOrg(data);
      }

      // 2. Force fetch group messages (Bust cache with neq)
      if (activeOrgRef.current?.id) {
        const { data: msgs } = await supabase.from('group_messages').select('*').eq('organization_id', activeOrgRef.current.id).neq('id', rand).order('id', { ascending: true });
        if (msgs) {
          setGroupMessages(msgs.map(m => ({ id: m.id, organization_id: m.organization_id, from: m.from_id, fromName: m.from_name, text: m.text, time: m.msg_time, type: m.type, meetingId: m.meeting_id, deletedFor: m.deleted_for || [], attachmentUrl: m.attachment_url, audioUrl: m.audio_url, reactions: m.reactions || {}, fileName: m.file_name, fileSize: m.file_size })));
        }
      }
    }, 5000);"""

d = tick_old.sub(tick_new, d)

with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(d)
print("Updated poller successfully")

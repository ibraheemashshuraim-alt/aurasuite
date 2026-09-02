import re

with open('frontend/app/dashboard/page.js', 'r', encoding='utf-8') as f:
    d = f.read()

# Add a non-destructive 5-second chat poller
poller_code = """
  // Non-destructive chat poller
  useEffect(() => {
    const int = setInterval(async () => {
      if (activeOrgRef.current?.id) {
        const { data: msgs } = await supabase.from('group_messages').select('*').eq('organization_id', activeOrgRef.current.id).order('id', { ascending: true });
        if (msgs) {
          setGroupMessages(prev => {
            const newMsgs = [...prev];
            let changed = false;
            msgs.forEach(m => {
              if (!newMsgs.find(existing => existing.id === m.id)) {
                newMsgs.push({ id: m.id, organization_id: m.organization_id, from: m.from_id, fromName: m.from_name, text: m.text, time: m.msg_time, type: m.type, meetingId: m.meeting_id, deletedFor: m.deleted_for || [], attachmentUrl: m.attachment_url, audioUrl: m.audio_url, reactions: m.reactions || {}, fileName: m.file_name, fileSize: m.file_size });
                changed = true;
              }
            });
            return changed ? newMsgs : prev;
          });
        }
      }
    }, 5000);
    return () => clearInterval(int);
  }, []);
"""

d = d.replace("const [timeTick, setTimeTick] = useState(0);", "const [timeTick, setTimeTick] = useState(0);\n" + poller_code)

with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(d)
print("Added non-destructive poller")

import re

d = open('frontend/app/dashboard/page.js', 'r', encoding='utf-8').read()

poller_code = """
  // ----------------------------------------------------
  // INJECTED POLLERS
  // ----------------------------------------------------
  useEffect(() => {
    if (!mounted || !activeOrg?.id) return;
    const chatInterval = setInterval(async () => {
      // Group Messages
      const { data } = await supabase.from('group_messages').select('*').eq('organization_id', activeOrg.id).order('id', { ascending: true });
      if (data) {
        setGroupMessages(data.map(m => ({ id: m.id, organization_id: m.organization_id, from: m.from_id, fromName: m.from_name, text: m.text, time: m.msg_time, type: m.type, meetingId: m.meeting_id, deletedFor: m.deleted_for || [], attachmentUrl: m.attachment_url, audioUrl: m.audio_url, reactions: m.reactions || {} })));
      }
      
      // DM Messages
      const { data: dmData } = await supabase.from('dm_messages').select('*').or(`thread_key.ilike.%${currentUserRef.current?.id}%`).order('id', { ascending: true });
      if (dmData) {
         const newThreads = {};
         dmData.forEach(m => {
            if (!newThreads[m.thread_key]) newThreads[m.thread_key] = [];
            newThreads[m.thread_key].push({ id: m.id, from: m.from_id, fromName: m.from_name, text: m.text, time: m.msg_time, audioUrl: m.audio_url, attachmentUrl: m.attachment_url, deletedFor: m.deleted_for || [], reactions: m.reactions || {} });
         });
         setDmThreads(newThreads);
      }
    }, 3000);
    return () => clearInterval(chatInterval);
  }, [mounted, activeOrg?.id]);
  // ----------------------------------------------------
"""

if "INJECTED POLLERS" not in d:
    d = re.sub(r"(\s*// .*Render .*\n)", "\n" + poller_code.replace('\\', '\\\\') + r"\1", d)
    with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
        f.write(d)
    print("Injected pollers successfully")
else:
    print("Already injected")

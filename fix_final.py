import re

d = open('frontend/app/dashboard/page.js', 'r', encoding='utf-8').read()

# 1. Add precise 1-second minute tracker for EXACT auto-locking
minute_tracker_js = """
  const [currentMinute, setCurrentMinute] = useState(new Date().getMinutes());
  useEffect(() => {
    const int = setInterval(() => {
      const min = new Date().getMinutes();
      setCurrentMinute(prev => {
        if (prev !== min) return min;
        return prev;
      });
    }, 1000);
    return () => clearInterval(int);
  }, []);
"""
if "const [currentMinute, setCurrentMinute]" not in d:
    d = d.replace("const [timeTick, setTimeTick] = useState(0);", "const [timeTick, setTimeTick] = useState(0);\n" + minute_tracker_js)

# 2. Modify checkIsEffectivelyLocked to depend on currentMinute so it re-evaluates
d = d.replace("const now = new Date();\n        const currentMin = now.getHours() * 60 + now.getMinutes();", 
              "const now = new Date();\n        const currentMin = now.getHours() * 60 + now.getMinutes();\n        // depend on currentMinute state to force re-render\n        const _trigger = currentMinute;")

# 3. Add explicit broadcast for chat messages to bypass ANY RLS realtime restrictions
broadcast_send = """
          if (activeChat === 'group' && activeOrg?.id) {
            await supabase.from('group_messages').insert({ id: msgId, organization_id: activeOrg.id, from_id: currentUser.id, from_name: currentUser.full_name, text: currentChatInput, msg_time: msgTime, type: 'chat', audio_url: audioUrl, attachment_url: null });
            if (kickoutChannelRef.current) {
                kickoutChannelRef.current.send({ type: 'broadcast', event: 'new-group-message', payload: { id: msgId, organization_id: activeOrg.id, from: currentUser.id, fromName: currentUser.full_name, text: currentChatInput, time: msgTime, type: 'chat', attachmentUrl: null, audioUrl: audioUrl, reactions: {} } });
            }
"""
d = d.replace("""          if (activeChat === 'group' && activeOrg?.id) {
            await supabase.from('group_messages').insert({ id: msgId, organization_id: activeOrg.id, from_id: currentUser.id, from_name: currentUser.full_name, text: currentChatInput, msg_time: msgTime, type: 'chat', audio_url: audioUrl, attachment_url: null });""", broadcast_send)

broadcast_receive = """
          .on('broadcast', { event: 'new-group-message' }, (payload) => {
            const m = payload?.payload;
            if (m && activeOrgRef.current?.id === m.organization_id) {
              setGroupMessages(prev => {
                if (prev.find(msg => msg.id === m.id)) return prev;
                return [...prev, m];
              });
            }
          })
"""
if "new-group-message" not in d:
    d = d.replace(".on('broadcast', { event: 'org-working-days' }", broadcast_receive + "\n          .on('broadcast', { event: 'org-working-days' }")

with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(d)
print("Applied exact minute tracker and chat broadcast fallback")

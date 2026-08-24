const fs = require('fs');

let c = fs.readFileSync('frontend/app/dashboard/page.js', 'utf8');

// 1. Remove from top
const regex = /\/\/ Chat Poller \(Bulletproof fallback\)\r?\n\s*useEffect\(\(\) => \{[\s\S]*?return \(\) => clearInterval\(chatInterval\);\r?\n\s*\}, \[mounted, activeOrg\?\.id\]\);\r?\n/;
c = c.replace(regex, '');

const regex2 = /useEffect\(\(\) => \{\r?\n\s*const int = setInterval\(\(\) => \{\r?\n\s*setTimeTick\(t => t \+ 1\);\r?\n\s*if \(currentUserRef\.current\?\.role === 'worker' && checkIsEffectivelyLocked\(currentUserRef\.current, activeOrgRef\?\.current\)\) \{\r?\n\s*setKickoutModal\(true\);\r?\n\s*\}\r?\n\s*\}, 10000\);\r?\n\s*return \(\) => clearInterval\(int\);\r?\n\s*\}, \[\]\);\r?\n/;
c = c.replace(regex2, '');

// 2. Put at the bottom before return (
const injection = `
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
      const { data: dmData } = await supabase.from('dm_messages').select('*').or(\`thread_key.ilike.%\${currentUserRef.current?.id}%\`).order('id', { ascending: true });
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

  useEffect(() => {
    const int = setInterval(() => {
      setTimeTick(t => t + 1);
      if (currentUserRef.current?.role === 'worker' && checkIsEffectivelyLocked(currentUserRef.current, activeOrgRef?.current)) {
        setKickoutModal(true);
      }
    }, 10000);
    return () => clearInterval(int);
  }, []);
  // ----------------------------------------------------
`;

c = c.replace('  if (!mounted) return null;\n\n  return (', injection + '\n  if (!mounted) return null;\n\n  return (');

fs.writeFileSync('frontend/app/dashboard/page.js', c);
console.log('Fixed TDZ in dashboard');

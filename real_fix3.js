const fs = require('fs');

function clean(path, addChatPoller) {
  let c = fs.readFileSync(path, 'utf8');

  // 1. TimeTick Injection
  const timeTickPattern = /const \[timeTick, setTimeTick\] = useState\(0\);/;
  if (!timeTickPattern.test(c)) {
    c = c.replace(
      /export default function AppContainer\(\) \{\r?\n\s*const \[mounted, setMounted\] = useState\(false\);/,
      `export default function AppContainer() {
  const [mounted, setMounted] = useState(false);
  const [timeTick, setTimeTick] = useState(0);`
    );
  }

  // 2. Chat Poller (only for dashboard)
  if (addChatPoller && !c.includes('Chat Poller (Bulletproof fallback)')) {
    c = c.replace(
      /const \[timeTick, setTimeTick\] = useState\(0\);/,
      `const [timeTick, setTimeTick] = useState(0);

  // Chat Poller (Bulletproof fallback)
  useEffect(() => {
    if (!mounted || !activeOrg?.id) return;
    const chatInterval = setInterval(async () => {
      const { data } = await supabase.from('group_messages').select('*').eq('organization_id', activeOrg.id).order('id', { ascending: true });
      if (data) {
        setGroupMessages(data.map(m => ({ id: m.id, organization_id: m.organization_id, from: m.from_id, fromName: m.from_name, text: m.text, time: m.msg_time, type: m.type, meetingId: m.meeting_id, deletedFor: m.deleted_for || [], attachmentUrl: m.attachment_url, audioUrl: m.audio_url, reactions: m.reactions || {} })));
      }
    }, 3000);
    return () => clearInterval(chatInterval);
  }, [mounted, activeOrg?.id]);`
    );
  }

  // 3. Update the TimeTick Interval to ALSO trigger the Modal
  const oldIntervalPattern = /useEffect\(\(\) => \{\r?\n\s*const int = setInterval\(\(\) => setTimeTick\(t => t \+ 1\), 30000\);\r?\n\s*return \(\) => clearInterval\(int\);\r?\n\s*\}, \[\]\);/;
  
  if (oldIntervalPattern.test(c)) {
     c = c.replace(
       oldIntervalPattern,
       `useEffect(() => {
    const int = setInterval(() => {
      setTimeTick(t => t + 1);
      if (currentUserRef.current?.role === 'worker' && checkIsEffectivelyLocked(currentUserRef.current, activeOrgRef?.current)) {
        setKickoutModal(true);
      }
    }, 10000);
    return () => clearInterval(int);
  }, []);`
     );
  } else {
    // Inject brand new effect
    c = c.replace(
      /const \[timeTick, setTimeTick\] = useState\(0\);/,
      `const [timeTick, setTimeTick] = useState(0);
  useEffect(() => {
    const int = setInterval(() => {
      setTimeTick(t => t + 1);
      if (currentUserRef.current?.role === 'worker' && checkIsEffectivelyLocked(currentUserRef.current, activeOrgRef?.current)) {
        setKickoutModal(true);
      }
    }, 10000);
    return () => clearInterval(int);
  }, []);`
    );
  }

  // 4. Update the default hours to 09:00 - 17:00
  c = c.replace(/const start = org\.working_hours\?\.start \|\| "00:00";/g, 'const start = org.working_hours?.start || "09:00";');
  c = c.replace(/const end = org\.working_hours\?\.end \|\| "23:59";/g, 'const end = org.working_hours?.end || "17:00";');
  c = c.replace(/const currentHours = activeOrg\.working_hours \|\| \{ start: "00:00", end: "23:59" \};/g, 'const currentHours = activeOrg.working_hours || { start: "09:00", end: "17:00" };');
  c = c.replace(/<input type="time" value=\{activeOrg\?\.working_hours\?\.start \|\| "00:00"\}/g, '<input type="time" value={activeOrg?.working_hours?.start || "09:00"}');
  c = c.replace(/<input type="time" value=\{activeOrg\?\.working_hours\?\.end \|\| "23:59"\}/g, '<input type="time" value={activeOrg?.working_hours?.end || "17:00"}');

  fs.writeFileSync(path, c);
}

clean('frontend/app/dashboard/page.js', true);
clean('frontend/app/login/page.js', false);
console.log('Clean fixes applied');

const fs = require('fs');

let c = fs.readFileSync('frontend/app/dashboard/page.js', 'utf8');

const pollerInjection = `
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
    }, [mounted, activeOrg?.id]);
`;

c = c.replace('const [timeTick, setTimeTick] = useState(0);', 'const [timeTick, setTimeTick] = useState(0);' + pollerInjection);

c = c.replace(
  'const int = setInterval(() => setTimeTick(t => t + 1), 30000);',
  `const int = setInterval(() => {
      setTimeTick(t => t + 1);
      if (currentUserRef.current?.role === 'worker' && checkIsEffectivelyLocked(currentUserRef.current, activeOrgRef?.current)) {
        setKickoutModal(true);
      }
    }, 10000);`
);

c = c.replace('const currentUserRef = useRef(currentUser);', 'const currentUserRef = useRef(currentUser);\n  const activeOrgRef = useRef(activeOrg);\n  useEffect(() => { activeOrgRef.current = activeOrg; }, [activeOrg]);');

// What if working_hours defaults to 00:00 to 23:59 and they are never locked?
// We can change the default start and end inside checkIsEffectivelyLocked!
c = c.replace('const start = org.working_hours?.start || "00:00";', 'const start = org.working_hours?.start || "09:00";');
c = c.replace('const end = org.working_hours?.end || "23:59";', 'const end = org.working_hours?.end || "17:00";');

fs.writeFileSync('frontend/app/dashboard/page.js', c);
console.log('Done dashboard');

let c2 = fs.readFileSync('frontend/app/login/page.js', 'utf8');
c2 = c2.replace(
  'const int = setInterval(() => setTimeTick(t => t + 1), 30000);',
  `const int = setInterval(() => {
      setTimeTick(t => t + 1);
      if (currentUserRef.current?.role === 'worker' && checkIsEffectivelyLocked(currentUserRef.current, activeOrgRef?.current)) {
        setKickoutModal(true);
      }
    }, 10000);`
);
c2 = c2.replace('const currentUserRef = useRef(currentUser);', 'const currentUserRef = useRef(currentUser);\n  const activeOrgRef = useRef(activeOrg);\n  useEffect(() => { activeOrgRef.current = activeOrg; }, [activeOrg]);');

c2 = c2.replace('const start = org.working_hours?.start || "00:00";', 'const start = org.working_hours?.start || "09:00";');
c2 = c2.replace('const end = org.working_hours?.end || "23:59";', 'const end = org.working_hours?.end || "17:00";');

fs.writeFileSync('frontend/app/login/page.js', c2);
console.log('Done login');

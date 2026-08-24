const fs = require('fs');

function inject(file) {
  let c = fs.readFileSync(file, 'utf8');

  // 1. Inject timeTick
  c = c.replace(
    /export default function AppContainer\(\) \{\r?\n\s*const \[mounted, setMounted\] = useState\(false\);/,
    `export default function AppContainer() {
  const [mounted, setMounted] = useState(false);
  const [timeTick, setTimeTick] = useState(0);
  
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

  // 2. Inject activeOrgRef
  c = c.replace(
    /const currentUserRef = useRef\(currentUser\);/,
    `const currentUserRef = useRef(currentUser);
  const activeOrgRef = useRef(activeOrg);
  useEffect(() => { activeOrgRef.current = activeOrg; }, [activeOrg]);`
  );

  // 3. Fix checkIsEffectivelyLocked defaults
  c = c.replace(/const start = org\.working_hours\?\.start \|\| "00:00";/, 'const start = org.working_hours?.start || "09:00";');
  c = c.replace(/const end = org\.working_hours\?\.end \|\| "23:59";/, 'const end = org.working_hours?.end || "17:00";');

  fs.writeFileSync(file, c);
}

inject('frontend/app/dashboard/page.js');
inject('frontend/app/login/page.js');
console.log('Done');

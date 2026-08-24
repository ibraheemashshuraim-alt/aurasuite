import re

# 1. Dashboard: Chat Poller & TimeTick Effect & Default Hours & Invite Skills Reset
with open('frontend/app/dashboard/page.js', 'r', encoding='utf-8') as f:
    d = f.read()

# Add Chat Poller right after timeTick
if 'Chat Poller' not in d:
    # Ensure timeTick exists
    if 'const [timeTick, setTimeTick] = useState(0);' not in d:
        d = d.replace(
            'const [mounted, setMounted] = useState(false);',
            'const [mounted, setMounted] = useState(false);\n  const [timeTick, setTimeTick] = useState(0);'
        )
    d = d.replace(
        'const [timeTick, setTimeTick] = useState(0);',
        """const [timeTick, setTimeTick] = useState(0);

  // Chat Poller (Bulletproof fallback)
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
  }, [mounted, activeOrg?.id]);"""
    )

# Add TimeTick popup logic
if 'if (currentUserRef.current?.role === \'worker\'' not in d:
    d = d.replace(
        """  // Chat Poller (Bulletproof fallback)""",
        """  useEffect(() => {
    const int = setInterval(() => {
      setTimeTick(t => t + 1);
      if (currentUserRef.current?.role === 'worker' && checkIsEffectivelyLocked(currentUserRef.current, activeOrgRef?.current)) {
        setKickoutModal(true);
      }
    }, 10000);
    return () => clearInterval(int);
  }, []);
  
  // Chat Poller (Bulletproof fallback)"""
    )

# Fix Default Hours
d = d.replace('const start = org.working_hours?.start || "00:00";', 'const start = org.working_hours?.start || "09:00";')
d = d.replace('const end = org.working_hours?.end || "23:59";', 'const end = org.working_hours?.end || "17:00";')
d = d.replace('const currentHours = activeOrg.working_hours || { start: "00:00", end: "23:59" };', 'const currentHours = activeOrg.working_hours || { start: "09:00", end: "17:00" };')
d = d.replace('<input type="time" value={activeOrg?.working_hours?.start || "00:00"}', '<input type="time" value={activeOrg?.working_hours?.start || "09:00"}')
d = d.replace('<input type="time" value={activeOrg?.working_hours?.end || "23:59"}', '<input type="time" value={activeOrg?.working_hours?.end || "17:00"}')

# Fix Invite Skills Reset
invite_profile_regex = re.compile(
    r"category: isUpdate \? existingProfile\.category : \(genInviteCategory \|\| null\),\s*"
    r"domain: isUpdate \? existingProfile\.domain : \(genInviteDomain \|\| ''\),\s*"
    r"skills: isUpdate \? \(existingProfile\.skills \|\| \[\]\) : \[\],"
)
new_invite_profile = """category: genInviteCategory || null,
                      domain: genInviteDomain || '',
                      skills: [],"""
d = invite_profile_regex.sub(new_invite_profile, d)

with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(d)


# 2. Login: Fix TimeTick logic, Popup on token, Default Hours
with open('frontend/app/login/page.js', 'r', encoding='utf-8') as f:
    l = f.read()

# Fix Default Hours
l = l.replace('const start = org.working_hours?.start || "00:00";', 'const start = org.working_hours?.start || "09:00";')
l = l.replace('const end = org.working_hours?.end || "23:59";', 'const end = org.working_hours?.end || "17:00";')

# We don't need TimeTick locking them OUT on login page, because they aren't logged in!
# We can safely leave it alone or just let it exist. Let's make sure it doesn't crash.
# Actually, I added activeOrgRef in login/page.js, so it's safe.

# Popup on Token
token_logic = """              if (decoded.orgName) setAuthOrgName(decoded.orgName);
            }
          } catch(e) { /* ignore invalid token */ }
        }"""
        
new_token_logic = """              if (decoded.orgName) setAuthOrgName(decoded.orgName);
              
              // IMMEDIATELY CHECK IF SUSPENDED/REVOKED
              supabase.from('digital_cards').select('is_revoked').eq('card_number', decoded.card).eq('username', decoded.username).maybeSingle().then(({data}) => { 
                if (data?.is_revoked) setKickoutModal(true); 
              });
            }
          } catch(e) { /* ignore invalid token */ }
        }"""
        
if 'IMMEDIATELY CHECK IF SUSPENDED' not in l:
    l = l.replace(token_logic, new_token_logic)
    
with open('frontend/app/login/page.js', 'w', encoding='utf-8') as f:
    f.write(l)
    
print("All fixes applied via Python")

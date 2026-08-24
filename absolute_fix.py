import re
import os

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

# 1. Dashboard: Fix TimeTick, fix invite skills, inject Chat Poller
d = read_file('frontend/app/dashboard/page.js')

# Fix Invite Skills Reset (put it back to how it was)
invite_profile_regex = re.compile(
    r"category: genInviteCategory \|\| null,\s*"
    r"domain: genInviteDomain \|\| '',\s*"
    r"skills: \[\],"
)
new_invite_profile = """category: isUpdate ? existingProfile.category : (genInviteCategory || null),
                      domain: isUpdate ? existingProfile.domain : (genInviteDomain || ''),
                      skills: isUpdate ? (existingProfile.skills || []) : [],"""
d = invite_profile_regex.sub(new_invite_profile, d)

# Fix TimeTick (make it just increment every 30s to trigger re-renders, NO modal popping!)
old_interval = re.compile(
    r"useEffect\(\(\) => \{\s*const int = setInterval\(\(\) => \{\s*setTimeTick\(t => t \+ 1\);\s*if \(currentUserRef\.current\?\.role === 'worker' && checkIsEffectivelyLocked\(currentUserRef\.current, activeOrgRef\?\.current\)\) \{\s*setKickoutModal\(true\);\s*\}\s*\}, 10000\);\s*return \(\) => clearInterval\(int\);\s*\}, \[\]\);"
)
new_interval = """useEffect(() => {
    const int = setInterval(() => setTimeTick(t => t + 1), 30000);
    return () => clearInterval(int);
  }, []);"""
d = old_interval.sub(new_interval, d)

# Inject Chat Poller AT THE BOTTOM of AppContainer (before Render starts)
# Find the string "Render " and insert right before it
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
    render_marker = "Render "
    d = d.replace("// " + render_marker, poller_code + "// " + render_marker)

write_file('frontend/app/dashboard/page.js', d)


# 2. Login: Fix TimeTick
l = read_file('frontend/app/login/page.js')

l = old_interval.sub(new_interval, l)

write_file('frontend/app/login/page.js', l)

print("Absolute final fixes applied!")

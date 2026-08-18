import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://trrvcethuyqldnzrneiw.supabase.co', 'sb_publishable_HKKUstgS3rzPEmDk53OrMg_9J7JqsSx');
async function run() {
  const { data: orgs } = await supabase.from('organizations').select('*');
  for (const org of orgs) {
    if (org.name === 'softweare house' || org.name === 'software house' || org.name === 'Al bake' || org.name === 'Al madina') {
      console.log('Deleting:', org.name);
      const { data: orgProfiles } = await supabase.from('profiles').select('id').eq('organization_id', org.id);
      if (orgProfiles) {
          for (const p of orgProfiles) {
              await supabase.from('digital_cards').delete().eq('profile_id', p.id);
              await supabase.from('presence').delete().eq('user_id', p.id);
              await supabase.from('tasks').delete().eq('assigned_to', p.id);
              await supabase.from('group_messages').delete().eq('from_id', p.id);
              await supabase.from('dm_messages').delete().like('thread_key', `%${p.id}%`);
              const { data: userMeetings } = await supabase.from('meetings').select('id').eq('host_id', p.id);
              if (userMeetings && userMeetings.length > 0) {
                  const meetingIds = userMeetings.map(m => m.id);
                  await supabase.from('meeting_states').delete().in('meeting_id', meetingIds);
                  await supabase.from('meeting_invites').delete().in('meeting_id', meetingIds);
              }
              await supabase.from('meetings').delete().eq('host_id', p.id);
              await supabase.from('profiles').delete().eq('id', p.id);
          }
      }
      await supabase.from('meetings').delete().eq('organization_id', org.id);
      await supabase.from('tasks').delete().eq('organization_id', org.id);
      await supabase.from('organizations').delete().eq('id', org.id);
    }
  }
  console.log('Done wiping dummy orgs.');
}
run();

const fs = require('fs');
let content = fs.readFileSync('frontend/app/dashboard/page.js', 'utf8');

const search = `                          if (orgProfiles) {
                              for (const p of orgProfiles) {
                                  await supabase.from('digital_cards').delete().eq('profile_id', p.id);
                                  await supabase.from('presence').delete().eq('user_id', p.id);
                                  await supabase.from('tasks').delete().eq('assigned_to', p.id);
                                  await supabase.from('profiles').delete().eq('id', p.id);
                              }
                          }`;

const replace = `                          if (orgProfiles) {
                              for (const p of orgProfiles) {
                                  await supabase.from('digital_cards').delete().eq('profile_id', p.id);
                                  await supabase.from('presence').delete().eq('user_id', p.id);
                                  await supabase.from('tasks').delete().eq('assigned_to', p.id);
                                  await supabase.from('group_messages').delete().eq('from_id', p.id);
                                  await supabase.from('dm_messages').delete().like('thread_key', \`%\${p.id}%\`);
                                  const { data: userMeetings } = await supabase.from('meetings').select('id').eq('host_id', p.id);
                                  if (userMeetings && userMeetings.length > 0) {
                                      const meetingIds = userMeetings.map(m => m.id);
                                      await supabase.from('meeting_states').delete().in('meeting_id', meetingIds);
                                      await supabase.from('meeting_invites').delete().in('meeting_id', meetingIds);
                                  }
                                  await supabase.from('meetings').delete().eq('host_id', p.id);
                                  await supabase.from('profiles').delete().eq('id', p.id);
                              }
                          }`;

content = content.split(search).join(replace);
fs.writeFileSync('frontend/app/dashboard/page.js', content);

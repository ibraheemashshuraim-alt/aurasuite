import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://trrvcethuyqldnzrneiw.supabase.co';
const supabaseKey = 'sb_publishable_HKKUstgS3rzPEmDk53OrMg_9J7JqsSx';
const supabase = createClient(supabaseUrl, supabaseKey);

async function wipeDatabase() {
  console.log('Starting database wipe...');
  
  // 1. Fetch super admin profile
  const { data: superAdmins, error: saError } = await supabase.from('profiles').select('*').eq('role', 'super_admin');
  if (saError) { console.error('Error fetching super admin:', saError); return; }
  
  const superAdminIds = superAdmins.map(sa => sa.id);
  console.log('Super Admins found:', superAdminIds);

  // 2. Delete all Presence
  await supabase.from('presence').delete().neq('user_id', '00000000-0000-0000-0000-000000000000');
  console.log('Deleted presence');

  // 3. Delete all Digital Cards (except super admin)
  for (const sa of superAdminIds) {
      await supabase.from('digital_cards').delete().neq('profile_id', sa);
  }
  if (superAdminIds.length === 0) {
      await supabase.from('digital_cards').delete().neq('id', '000');
  }
  console.log('Deleted digital cards');

  // 4. Delete all Tasks, Meetings, Messages
  await supabase.from('tasks').delete().neq('id', '000');
  await supabase.from('meetings').delete().neq('id', '000');
  await supabase.from('messages').delete().neq('id', '000');
  console.log('Deleted tasks, meetings, messages');

  // 5. Delete all profiles EXCEPT super admin
  for (const sa of superAdminIds) {
      await supabase.from('profiles').delete().neq('id', sa);
  }
  if (superAdminIds.length === 0) {
      await supabase.from('profiles').delete().neq('id', '000');
  }
  console.log('Deleted profiles');

  // 6. Delete all organizations
  await supabase.from('organizations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Deleted organizations');

  console.log('Wipe complete!');
}

wipeDatabase();

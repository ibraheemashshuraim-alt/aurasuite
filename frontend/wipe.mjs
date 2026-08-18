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

  // Helper to delete all rows except super admins
  const deleteAll = async (table, excludeCol = null, excludeIds = []) => {
      const { data } = await supabase.from(table).select('id');
      if (!data) return;
      for (const row of data) {
          // If we need to exclude based on a column
          if (excludeCol && excludeIds.length > 0) {
              const { data: checkRow } = await supabase.from(table).select(excludeCol).eq('id', row.id).single();
              if (checkRow && excludeIds.includes(checkRow[excludeCol])) continue;
          }
          if (table === 'profiles' && excludeIds.includes(row.id)) continue;

          await supabase.from(table).delete().eq('id', row.id);
      }
  };

  console.log('Deleting presence...');
  await deleteAll('presence');

  console.log('Deleting digital cards...');
  await deleteAll('digital_cards', 'profile_id', superAdminIds);

  console.log('Deleting tasks, meetings, messages...');
  await deleteAll('tasks');
  await deleteAll('meetings');
  await deleteAll('messages');

  console.log('Deleting profiles...');
  await deleteAll('profiles', 'id', superAdminIds);

  console.log('Deleting organizations...');
  await deleteAll('organizations');

  console.log('Wipe complete!');
}

wipeDatabase();

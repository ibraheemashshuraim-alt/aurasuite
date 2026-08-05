const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://trrvcethuyqldnzrneiw.supabase.co';
const supabaseKey = 'sb_publishable_HKKUstgS3rzPEmDk53OrMg_9J7JqsSx';
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
  const email = 'abdullqudus.77@gmail.com';
  
  console.log(`Starting cleanup for ${email}...`);
  
  // 1. Get User Profile ID
  const { data: profiles, error: profileErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email);
    
  if (profileErr) {
    console.error('Error fetching profile:', profileErr);
    return;
  }
  
  if (!profiles || profiles.length === 0) {
    console.log(`No profiles found for ${email}. Maybe already deleted?`);
    return;
  }
  
  const userId = profiles[0].id;
  console.log(`Found Profile ID: ${userId}`);
  
  // 2. Delete dependent records
  console.log('Deleting presence...');
  await supabase.from('presence').delete().eq('user_id', userId);
  
  console.log('Deleting digital_cards...');
  await supabase.from('digital_cards').delete().eq('profile_id', userId);
  
  console.log('Deleting profiles...');
  const { error: delProfileErr } = await supabase.from('profiles').delete().eq('id', userId);
  
  if (delProfileErr) {
    console.error('Failed to delete profile (maybe 406 or RLS?):', delProfileErr);
  } else {
    console.log('Profile successfully deleted from public schema!');
  }
  
  // 3. Delete from banned_emails if exists
  console.log('Checking banned_emails...');
  await supabase.from('banned_emails').delete().eq('email', email);
  
  console.log('Cleanup script finished.');
}

cleanup();

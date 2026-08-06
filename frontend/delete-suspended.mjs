import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: profiles, error: err1 } = await supabase.from('profiles').select('*').in('role', ['suspended', 'banned', 'deleted']);
  if (err1) { console.error('Error fetching:', err1); return; }
  
  console.log('Found profiles to delete:', profiles.length);
  for (const p of profiles) {
    console.log(`Deleting ${p.email}...`);
    await supabase.from('digital_cards').delete().eq('profile_id', p.id);
    await supabase.from('presence').delete().eq('user_id', p.id);
    await supabase.from('tasks').delete().eq('assigned_to', p.id);
    await supabase.from('banned_emails').delete().eq('email', p.email.toLowerCase());
    await supabase.from('profiles').delete().eq('id', p.id);
    console.log(`Deleted ${p.email}`);
  }
}
run();

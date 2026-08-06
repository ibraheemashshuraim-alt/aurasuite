import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const targetEmails = ['mehmood.0ab123@gmail.com', 'kashifbhaiabc904@gmail.com'];

async function run() {
  const { data: profiles, error: err1 } = await supabase.from('profiles').select('*').in('email', targetEmails);
  if (err1) { console.error('Error fetching:', err1); return; }
  
  console.log(`Found ${profiles.length} profiles to delete.`);
  for (const p of profiles) {
    console.log(`Deleting data for ${p.email} (ID: ${p.id})...`);
    await supabase.from('digital_cards').delete().eq('profile_id', p.id);
    await supabase.from('presence').delete().eq('user_id', p.id);
    await supabase.from('tasks').delete().eq('assigned_to', p.id);
    await supabase.from('profiles').delete().eq('id', p.id);
    console.log(`Deleted ${p.email} from profiles and related tables.`);
  }

  // Also remove from banned_emails just in case
  for (const email of targetEmails) {
    await supabase.from('banned_emails').delete().eq('email', email.toLowerCase());
    console.log(`Removed ${email} from banned_emails table.`);
  }
}
run();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: profiles, error } = await supabase.from('profiles').select('email, role, status');
  if (error) { console.error('Error fetching:', error); return; }
  
  console.log(profiles);
  
  const suspended = profiles.filter(p => ['suspended', 'banned', 'deleted'].includes(p.status) || ['suspended', 'banned', 'deleted'].includes(p.role));
  console.log('Suspended profiles:', suspended);
}
run();

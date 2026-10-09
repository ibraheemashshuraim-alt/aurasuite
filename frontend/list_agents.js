import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
  const orgId = orgs[0].id;
  const { data } = await supabase.from('agents').select('*').eq('organization_id', orgId);
  console.log(JSON.stringify(data, null, 2));
}
run();

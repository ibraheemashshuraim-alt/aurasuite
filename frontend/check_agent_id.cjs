const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://trrvcethuyqldnzrneiw.supabase.co';
const supabaseKey = 'sb_publishable_HKKUstgS3rzPEmDk53OrMg_9J7JqsSx';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data } = await supabase.from('engine_tasks').select('id, title, status, assigned_agent_id').eq('id', '577a106d-e10d-422b-8a56-04e55a7038b0');
  console.log(data);
}
run();

const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://trrvcethuyqldnzrneiw.supabase.co';
const supabaseKey = 'sb_publishable_HKKUstgS3rzPEmDk53OrMg_9J7JqsSx';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data } = await supabase.from('engine_tasks').select('id, title, status').eq('status', 'ACTION_REQUIRED');
  console.log("ACTION REQUIRED:", data);
  
  const { data: executing } = await supabase.from('engine_tasks').select('id, title, status').eq('status', 'EXECUTING');
  console.log("EXECUTING:", executing);
}
run();

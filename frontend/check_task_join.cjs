const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://trrvcethuyqldnzrneiw.supabase.co';
const supabaseKey = 'sb_publishable_HKKUstgS3rzPEmDk53OrMg_9J7JqsSx';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: task, error: tErr } = await supabase.from('engine_tasks').select('*, agents(*)').eq('id', '577a106d-e10d-422b-8a56-04e55a7038b0').single();
  console.log("Task agents:", task?.agents, tErr);
}
run();

const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://trrvcethuyqldnzrneiw.supabase.co';
const supabaseKey = 'sb_publishable_HKKUstgS3rzPEmDk53OrMg_9J7JqsSx';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  await supabase.from('engine_tasks').update({ status: 'FAILED', error: 'Cancelled old hanging task' }).eq('status', 'PENDING');
  await supabase.from('engine_tasks').update({ status: 'FAILED', error: 'Cancelled old hanging task' }).eq('status', 'VERIFYING');
  console.log("Cleared old hanging tasks");
}
run();

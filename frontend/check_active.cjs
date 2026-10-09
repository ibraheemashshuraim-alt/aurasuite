const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://trrvcethuyqldnzrneiw.supabase.co';
const supabaseKey = 'sb_publishable_HKKUstgS3rzPEmDk53OrMg_9J7JqsSx';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data } = await supabase.from('engine_tasks').select('id, title, status').in('status', ['PENDING', 'RUNNING', 'ACTION_REQUIRED', 'VERIFYING']).order('created_at', { ascending: false });
  console.log(data);
}
run();

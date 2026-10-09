const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://trrvcethuyqldnzrneiw.supabase.co';
const supabaseKey = 'sb_publishable_HKKUstgS3rzPEmDk53OrMg_9J7JqsSx';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data } = await supabase.from('engine_tasks').select('id, organization_id, title').order('created_at', { ascending: false }).limit(3);
  console.log(data);
  const { data: configs } = await supabase.from('ai_provider_configs').select('*');
  console.log(configs);
}
check();

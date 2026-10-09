const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://trrvcethuyqldnzrneiw.supabase.co';
const supabaseKey = 'sb_publishable_HKKUstgS3rzPEmDk53OrMg_9J7JqsSx';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: configs } = await supabase.from('ai_provider_configs').select('*');
  console.log("Configs:", JSON.stringify(configs, null, 2));
}
check();

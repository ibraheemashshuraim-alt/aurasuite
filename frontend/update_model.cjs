const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://trrvcethuyqldnzrneiw.supabase.co';
const supabaseKey = 'sb_publishable_HKKUstgS3rzPEmDk53OrMg_9J7JqsSx';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  await supabase.from('ai_provider_configs').update({ default_model: 'gemini-pro-latest' }).eq('provider_name', 'gemini');
  await supabase.from('agents').update({ default_model: 'gemini-pro-latest' }).eq('default_provider', 'gemini');
  
  console.log("Updated model to gemini-pro-latest in DB");
}
run();

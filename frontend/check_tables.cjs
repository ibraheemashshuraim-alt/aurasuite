const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://trrvcethuyqldnzrneiw.supabase.co';
const supabaseKey = 'sb_publishable_HKKUstgS3rzPEmDk53OrMg_9J7JqsSx';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const tables = ['organizations', 'profiles', 'engine_tasks', 'engine_action_plans', 'engine_execution_logs', 'ai_provider_configs', 'agents', 'agent_memories'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('id').limit(1);
    if (error) {
      console.log(`Table ${table} ERROR: ${error.message}`);
    } else {
      console.log(`Table ${table} EXISTS.`);
    }
  }
}
check();

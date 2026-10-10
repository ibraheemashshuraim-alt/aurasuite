const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://trrvcethuyqldnzrneiw.supabase.co';
const supabaseKey = 'sb_publishable_HKKUstgS3rzPEmDk53OrMg_9J7JqsSx';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: tasks } = await supabase.from('engine_tasks').select('*').eq('status', 'ACTION_REQUIRED').order('created_at', { ascending: false }).limit(1);
  if (!tasks.length) return console.log("No task found");
  const task = tasks[0];
  console.log("Task:", task.id);
  
  const { data: plans } = await supabase.from('engine_action_plans')
    .select('actions').eq('task_id', task.id).order('created_at', { ascending: false }).limit(1);
    
  let planText = JSON.stringify({ actions: [] });
  if (plans && plans.length > 0) {
    planText = JSON.stringify({ actions: plans[0].actions });
  }
  
  console.log("Plan found:", planText);
}
run();

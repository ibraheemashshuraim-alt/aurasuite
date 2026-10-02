import { createClient } from '@supabase/supabase-js';
import { executeEngineTask } from './lib/ai/engine/executor.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  console.log("=== PHASE 2B AI EXECUTION VERIFICATION ===");
  const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
  const orgId = orgs[0].id;
  
  const { data: agent, error: aErr } = await supabase.from('agents').insert({
    organization_id: orgId, name: '2B Test Agent', status: 'ACTIVE'
  }).select().single();
  const agentId = agent.id;

  console.log("1. Creating Task...");
  const { data: task } = await supabase.from('engine_tasks').insert({
    organization_id: orgId,
    title: 'Phase 2B Test',
    prompt: 'Hello AI',
    assigned_agent_id: agentId,
    status: 'PENDING'
  }).select().single();
  const taskId = task.id;
  console.log("Task created:", taskId);

  console.log("2. Executing Task...");
  const eData = await executeEngineTask(taskId);
  console.log("Execution Result:", eData);

  console.log("3. Fetching updated task from DB...");
  const { data: updatedTask } = await supabase.from('engine_tasks').select('*').eq('id', taskId).single();
  console.log("Task Status:", updatedTask.status);
  console.log("Task Error:", updatedTask.error);
  console.log("Task Result:", updatedTask.result);
  
  console.log("4. Cleaning up...");
  await supabase.from('engine_tasks').delete().eq('id', taskId);
  await supabase.from('agents').delete().eq('id', agentId);
}

runTest().catch(console.error);

import { createClient } from '@supabase/supabase-js';
import { executeEngineTask } from './lib/ai/engine/executor.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  console.log("=== PHASE 2C: AI EXECUTION & VERIFICATION TEST ===");
  const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
  const orgId = orgs[0].id;
  
  const { data: agent, error: aErr } = await supabase.from('agents').insert({
    organization_id: orgId, name: '2C Test Agent', status: 'ACTIVE'
  }).select().single();
  const agentId = agent.id;

  console.log("1. Creating Task...");
  const { data: task } = await supabase.from('engine_tasks').insert({
    organization_id: orgId,
    title: 'Phase 2C Verification Test',
    prompt: 'Please say hello to test the verification system.',
    assigned_agent_id: agentId,
    status: 'PENDING'
  }).select().single();
  const taskId = task.id;
  console.log("Task created:", taskId);

  console.log("2. Executing Task...");
  const eData = await executeEngineTask(taskId);
  console.log("Execution Result:", eData.success ? 'SUCCESS' : 'FAILED');

  console.log("3. Fetching updated task from DB...");
  const { data: updatedTask } = await supabase.from('engine_tasks').select('*').eq('id', taskId).single();
  console.log("Task Status:", updatedTask.status);
  console.log("Task Result:", updatedTask.result?.slice(0, 50));
  
  console.log("4. Fetching Execution Logs...");
  const { data: logs } = await supabase.from('engine_execution_logs').select('event, message').eq('task_id', taskId).order('created_at', { ascending: true });
  logs?.forEach(l => console.log( - []: ));

  console.log("5. Cleaning up test data...");
  await supabase.from('engine_tasks').delete().eq('id', taskId);
  await supabase.from('agents').delete().eq('id', agentId);
}

runTest().catch(console.error);

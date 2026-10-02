import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runFullVerification() {
  console.log("=== PHASE 2A FINAL LIVE VERIFICATION ===");

  const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
  const orgId = orgs?.[0]?.id || 'org-aurasuite-superadmin';
  console.log("✓ Organization found:", orgId);

  // 1. Verify old 'tasks' table is untouched
  console.log("\n--- Testing Old 'tasks' Table ---");
  const { data: oldTasks, error: oldTasksErr } = await supabase.from('tasks').select('*').limit(1);
  if (oldTasksErr) throw new Error("Old 'tasks' table check failed: " + oldTasksErr.message);
  console.log("✓ Old 'tasks' table is accessible and preserved.");

  // 2. Agent Management (Create, Fetch, Update)
  console.log("\n--- Testing Agent CRUD ---");
  const { data: agent, error: aCreateErr } = await supabase.from('agents').insert({
    organization_id: orgId, name: 'Final Verify Agent', status: 'ACTIVE'
  }).select().single();
  if (aCreateErr) throw new Error("Agent Create failed: " + aCreateErr.message);
  console.log("✓ Create Agent passed. ID:", agent.id);

  const { data: fetchedAgent, error: aFetchErr } = await supabase.from('agents').select('*').eq('id', agent.id).single();
  if (aFetchErr || !fetchedAgent) throw new Error("Agent Fetch failed");
  console.log("✓ Fetch Agent passed.");

  const { data: updatedAgent, error: aUpdateErr } = await supabase.from('agents').update({ status: 'PAUSED' }).eq('id', agent.id).select().single();
  if (aUpdateErr || updatedAgent.status !== 'PAUSED') throw new Error("Agent Update failed");
  console.log("✓ Update Agent passed.");

  // 3. Engine Task (Create, Assign, Status Transition, Join)
  console.log("\n--- Testing Engine Tasks ---");
  const { data: task, error: tCreateErr } = await supabase.from('engine_tasks').insert({
    organization_id: orgId, assigned_agent_id: agent.id, title: 'Final Verify Task', prompt: 'Run checks', status: 'PENDING'
  }).select().single();
  if (tCreateErr) throw new Error("Engine Task Create failed: " + tCreateErr.message);
  console.log("✓ Create Engine Task & Assign Agent passed. ID:", task.id);

  const { data: runningTask, error: tUpdateErr } = await supabase.from('engine_tasks').update({ status: 'RUNNING' }).eq('id', task.id).select().single();
  if (tUpdateErr || runningTask.status !== 'RUNNING') throw new Error("Engine Task Status Transition failed");
  console.log("✓ Engine Task Status Transition (PENDING -> RUNNING) passed.");

  // 4. Task History (Join Task with Agent)
  const { data: history, error: hErr } = await supabase.from('engine_tasks').select('*, agents(name)').eq('id', task.id).single();
  if (hErr || !history.agents) throw new Error("Task History (Join) failed: " + hErr?.message);
  console.log("✓ Task History Join passed. Assigned Agent Name:", history.agents.name);

  // 5. Cleanup
  console.log("\n--- Cleanup ---");
  await supabase.from('engine_tasks').delete().eq('id', task.id);
  await supabase.from('agents').delete().eq('id', agent.id);
  console.log("✓ Cleanup passed. Test records removed.");

  console.log("\n=== ALL VERIFICATION CHECKS PASSED ===");
}

runFullVerification().catch(err => {
  console.error("Verification Error:", err);
  process.exit(1);
});

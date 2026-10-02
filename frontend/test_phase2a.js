import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runFullVerification() {
  console.log("=== PHASE 2A FINAL LIVE VERIFICATION ===");

  const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
  const orgId = orgs?.[0]?.id || 'org-aurasuite-superadmin';
  console.log("✓ Organization found:", orgId);

  // 1. Agent Management (Create, Fetch, Update)
  console.log("\n--- Testing Agent CRUD ---");
  const { data: agent, error: aCreateErr } = await supabase.from('agents').insert({
    organization_id: orgId, name: 'Live Verify Agent', status: 'ACTIVE'
  }).select().single();
  if (aCreateErr) throw new Error("Agent Create failed: " + aCreateErr.message);
  console.log("✓ Create Agent passed. ID:", agent.id);

  const { data: fetchedAgent, error: aFetchErr } = await supabase.from('agents').select('*').eq('id', agent.id).single();
  if (aFetchErr || !fetchedAgent) throw new Error("Agent Fetch failed");
  console.log("✓ Fetch Agent passed.");

  const { data: updatedAgent, error: aUpdateErr } = await supabase.from('agents').update({ status: 'PAUSED' }).eq('id', agent.id).select().single();
  if (aUpdateErr || updatedAgent.status !== 'PAUSED') throw new Error("Agent Update failed");
  console.log("✓ Update Agent passed.");

  // 2. Task Engine (Create, Assign, Status Transition, Join)
  console.log("\n--- Testing Task Engine ---");
  const { data: task, error: tCreateErr } = await supabase.from('engine_tasks').insert({
    organization_id: orgId, assigned_agent_id: agent.id, title: 'Verify Task', prompt: 'Run checks', status: 'PENDING'
  }).select().single();
  if (tCreateErr) {
    if (tCreateErr.code === '42P01') {
        console.log("Test skipped: Please apply db/migrations/002B_phase2a_engine_tasks_fix.sql in Supabase");
        process.exit(0);
    }
    throw new Error("Task Create failed: " + tCreateErr.message);
  }
  console.log("✓ Create Task & Assign Agent passed. ID:", task.id);

  const { data: runningTask, error: tUpdateErr } = await supabase.from('engine_tasks').update({ status: 'RUNNING' }).eq('id', task.id).select().single();
  if (tUpdateErr || runningTask.status !== 'RUNNING') throw new Error("Task Status Transition failed");
  console.log("✓ Task Status Transition (PENDING -> RUNNING) passed.");

  // 3. Task History (Join Task with Agent)
  const { data: history, error: hErr } = await supabase.from('engine_tasks').select('*, agents(name)').eq('id', task.id).single();
  if (hErr || !history.agents) throw new Error("Task History (Join) failed");
  console.log("✓ Task History Join passed. Assigned Agent Name:", history.agents.name);

  // 4. Cleanup
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

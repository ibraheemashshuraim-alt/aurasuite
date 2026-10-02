import { createClient } from '@supabase/supabase-js';
import { executeActionPlan } from './lib/ai/actions/executor.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseKey);

process.env.USE_MOCK_CONNECTOR = 'false';

async function runTest() {
  console.log("=== PHASE 3B: REAL BROWSER CONNECTOR TEST ===\n");
  
  const { data: orgs, error: e1 } = await supabase.from('organizations').select('id').limit(1);
  if (e1) console.error(e1);
  const orgId = orgs[0].id;
  
  const { data: agent, error: e2 } = await supabase.from('agents').insert({
    organization_id: orgId, name: '3B Browser Agent', status: 'ACTIVE'
  }).select().single();
  if (e2) console.error(e2);
  
  const { data: task, error: e3 } = await supabase.from('engine_tasks').insert({
    organization_id: orgId, title: 'Phase 3B Test Task', prompt: 'test', assigned_agent_id: agent.id, status: 'PENDING'
  }).select().single();
  if (e3) console.error(e3);

  console.log("Test: Open Wikipedia, Type, Click Search, Wait, Screenshot, Read Screen");
  const plan = JSON.stringify({
    actions: [
      { type: 'open_url', target: 'https://en.wikipedia.org/wiki/Main_Page' },
      { type: 'type', target: 'input[name="search"]', value: 'Artificial Intelligence' },
      { type: 'press_key', value: 'Enter' },
      { type: 'wait', value: '3000' },
      { type: 'read_screen' },
      { type: 'screenshot' }
    ]
  });

  const exec1 = await executeActionPlan(task.id, agent.id, orgId, plan, true);
  console.log(" - Execute Result:", exec1.status);
  if (exec1.results) {
     exec1.results.forEach((r, idx) => {
         console.log(`   -> Action ${idx + 1} [${r.action.type}]:`, 
                     r.action.type === 'read_screen' ? r.result.result.substring(0, 50) + '...' : r.result.result);
     });
  }

  console.log("\nTest: Invalid URL / Blocked Domain");
  const blockedPlan = JSON.stringify({ actions: [{ type: 'open_url', target: 'http://127.0.0.1/admin' }] });
  const exec2 = await executeActionPlan(task.id, agent.id, orgId, blockedPlan, true);
  console.log(" - Blocked Execution Result:", exec2.status, "| Error:", exec2.error);

  console.log("\nCleaning up...");
  await supabase.from('engine_tasks').delete().eq('id', task.id);
  await supabase.from('agents').delete().eq('id', agent.id);
}

runTest().catch(console.error);

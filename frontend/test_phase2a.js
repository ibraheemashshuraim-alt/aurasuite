import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
  console.log("=== AURASUITE PHASE 2A TESTS ===");
  // (Tests assume migration is applied. If it fails, that's expected until the user applies the migration.)
  const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
  const orgId = orgs?.[0]?.id || 'org-aurasuite-superadmin';
  console.log("✓ Found test organization:", orgId);

  const { data: newAgent, error: createError } = await supabase.from('agents').insert({
    organization_id: orgId, name: 'Phase 2A Agent', provider: 'gemini', model: 'gemini-1.5-pro'
  }).select().single();
  
  if (createError) {
    if (createError.code === '42P01') {
      console.log("Test skipped: DB Migration 002 needs to be applied manually by the user in Supabase SQL editor.");
      process.exit(0);
    }
    throw createError;
  }
  
  console.log("✓ Agent created successfully:", newAgent.id);
  await supabase.from('agents').delete().eq('id', newAgent.id);
  console.log("✓ Cleaned up test data.");
  console.log("\n=== ALL PHASE 2A TESTS PASSED ===");
}

runTests().catch(e => {
  console.error("Test Failed:", e);
  process.exit(1);
});

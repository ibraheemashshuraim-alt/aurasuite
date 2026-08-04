const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf8');
const lines = env.split('\n');
const processEnv = {};
lines.forEach(l => {
  if(!l.includes('=')) return;
  const [k, ...v] = l.split('=');
  if (k) processEnv[k.trim()] = v.join('=').trim().replace(/"/g, '');
});
const supabase = createClient(processEnv.NEXT_PUBLIC_SUPABASE_URL, processEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function cleanDB() {
  console.log("Cleaning up all test data...");

  await supabase.from('presence').delete().neq('user_id', 'dummy');
  console.log("Deleted presence");

  await supabase.from('group_messages').delete().neq('id', 'dummy');
  await supabase.from('dm_messages').delete().neq('id', 'dummy');
  console.log("Deleted messages");

  await supabase.from('meeting_states').delete().neq('meeting_id', 'dummy');
  await supabase.from('meeting_invites').delete().neq('id', 'dummy');
  await supabase.from('meetings').delete().neq('id', 'dummy');
  console.log("Deleted meetings");

  await supabase.from('tasks').delete().neq('id', 'dummy');
  console.log("Deleted tasks");

  await supabase.from('digital_cards').delete().neq('card_number', 'dummy');
  await supabase.from('banned_emails').delete().neq('id', 'dummy');
  console.log("Deleted digital cards and bans");

  await supabase.from('profiles').delete().neq('email', 'ibraheemashshuraim@gmail.com');
  console.log("Deleted test profiles");

  console.log("✅ All test data has been successfully removed!");
}

cleanDB();

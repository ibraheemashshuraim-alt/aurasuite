import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://trrvcethuyqldnzrneiw.supabase.co', 'sb_publishable_HKKUstgS3rzPEmDk53OrMg_9J7JqsSx');
async function run() {
  const pId = 'user-1786104268322-1102';
  const { error } = await supabase.from('dm_messages').delete().or(`from_id.eq.${pId},to_id.eq.${pId}`);
  console.log('Delete DM error:', error);
}
run();

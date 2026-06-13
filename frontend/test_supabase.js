const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://trrvcethuyqldnzrneiw.supabase.co', 'sb_publishable_HKKUstgS3rzPEmDk53OrMg_9J7JqsSx');

async function test() {
  const { data, error } = await supabase.from('profiles').select('*');
  console.log("Profiles Error:", error);
  console.log("Profiles Data:", data);
}
test();

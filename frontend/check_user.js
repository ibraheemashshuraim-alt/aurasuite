const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://trrvcethuyqldnzrneiw.supabase.co', 'sb_publishable_HKKUstgS3rzPEmDk53OrMg_9J7JqsSx');

async function checkUser() {
  const email = 'abdullqudus.77@gmail.com';
  console.log(`Checking DB for ${email}...`);
  
  const { data, error } = await supabase.from('profiles').select('*').eq('email', email);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Profiles found:', data.length);
    console.log(data);
    
    // Also try case-insensitive check
    const { data: data2 } = await supabase.from('profiles').select('*').ilike('email', email);
    if (data2 && data2.length > 0 && data.length === 0) {
      console.log('Found with ilike:', data2.length);
      console.log(data2);
    }
  }
}
checkUser();

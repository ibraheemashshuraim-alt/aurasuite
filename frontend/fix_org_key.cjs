const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://trrvcethuyqldnzrneiw.supabase.co';
const supabaseKey = 'sb_publishable_HKKUstgS3rzPEmDk53OrMg_9J7JqsSx';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: configs } = await supabase.from('ai_provider_configs').select('*').eq('provider_name', 'gemini').limit(1);
  if (configs && configs.length) {
    const conf = configs[0];
    const { error } = await supabase.from('ai_provider_configs').upsert({
      organization_id: 'org-aurasuite-superadmin',
      provider_name: 'gemini',
      encrypted_api_key: conf.encrypted_api_key,
      nonce: conf.nonce,
      key_hint: conf.key_hint,
      default_model: conf.default_model,
      is_active: true,
      is_byok: true
    }, { onConflict: 'organization_id,provider_name' });
    console.log("DB Insert:", error || "Success");
  }
}
run();

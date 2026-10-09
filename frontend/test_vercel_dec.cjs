const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://trrvcethuyqldnzrneiw.supabase.co';
const supabaseKey = 'sb_publishable_HKKUstgS3rzPEmDk53OrMg_9J7JqsSx';
const supabase = createClient(supabaseUrl, supabaseKey);

const VERCEL_FALLBACK_KEY = 'aurasuite-master-encryption-key-32b!';

function getDerivedKey() { return crypto.createHash('sha256').update(VERCEL_FALLBACK_KEY).digest(); }
function decryptKey(ciphertextCombined, nonceB64) {
  const [encrypted, authTagB64] = ciphertextCombined.split(':');
  const key = getDerivedKey();
  const iv = Buffer.from(nonceB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function run() {
  const { data: configs } = await supabase.from('ai_provider_configs').select('*').eq('organization_id', 'org-aurasuite-superadmin').eq('provider_name', 'gemini');
  if(configs && configs.length) {
      const cfg = configs[0];
      const plain = decryptKey(cfg.encrypted_api_key, cfg.nonce);
      console.log("Decrypted successfully:", plain.substring(0,10));
  }
}
run();

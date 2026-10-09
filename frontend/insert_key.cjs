const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://trrvcethuyqldnzrneiw.supabase.co';
const supabaseKey = 'sb_publishable_HKKUstgS3rzPEmDk53OrMg_9J7JqsSx';
const supabase = createClient(supabaseUrl, supabaseKey);
const crypto = require('crypto');

const MASTER_KEY_ENV = 'aurasuite_sec_key_2026_master_9944a1b8e4f1c7d2';
function getDerivedKey() {
  return crypto.createHash('sha256').update(MASTER_KEY_ENV).digest();
}

function encryptKey(plainText) {
  const key = getDerivedKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag().toString('base64');
  const combinedCiphertext = `${encrypted}:${authTag}`;
  const trimmed = plainText.trim();
  const hint = trimmed.length > 4 ? `...${trimmed.slice(-4)}` : '****';
  return { ciphertext: combinedCiphertext, nonce: iv.toString('base64'), hint };
}

async function run() {
  const enc = encryptKey('AIzaSyCHBMrNroXnRLT5caXMIQQybUkGuHy_WrQ');
  
  // get org id
  const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
  if (!orgs || !orgs.length) {
    console.log("No orgs found");
    return;
  }
  const orgId = orgs[0].id;
  
  const { data, error } = await supabase.from('ai_provider_configs').upsert({
    organization_id: orgId,
    provider_name: 'gemini',
    encrypted_api_key: enc.ciphertext,
    nonce: enc.nonce,
    key_hint: enc.hint,
    default_model: 'gemini-1.5-pro',
    is_active: true,
    is_byok: true
  }, { onConflict: 'organization_id,provider_name' });
  
  console.log("DB Insert:", error || "Success");
}
run();

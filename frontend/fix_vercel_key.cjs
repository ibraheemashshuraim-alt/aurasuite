const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://trrvcethuyqldnzrneiw.supabase.co';
const supabaseKey = 'sb_publishable_HKKUstgS3rzPEmDk53OrMg_9J7JqsSx';
const supabase = createClient(supabaseUrl, supabaseKey);

const VERCEL_FALLBACK_KEY = 'aurasuite-master-encryption-key-32b!';

function getDerivedKey() { return crypto.createHash('sha256').update(VERCEL_FALLBACK_KEY).digest(); }
function encryptKey(plainText) {
  const key = getDerivedKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag().toString('base64');
  return { ciphertext: `${encrypted}:${authTag}`, nonce: iv.toString('base64'), hint: '..._WrQ' };
}

async function run() {
  const enc = encryptKey('AIzaSyCHBMrNroXnRLT5caXMIQQybUkGuHy_WrQ');
  
  const { error } = await supabase.from('ai_provider_configs').upsert({
    organization_id: 'org-aurasuite-superadmin',
    provider_name: 'gemini',
    encrypted_api_key: enc.ciphertext,
    nonce: enc.nonce,
    key_hint: enc.hint,
    default_model: 'gemini-1.5-pro',
    is_active: true,
    is_byok: true
  }, { onConflict: 'organization_id,provider_name' });
  
  console.log("DB Insert for Vercel:", error || "Success");
}
run();

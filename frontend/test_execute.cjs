const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://trrvcethuyqldnzrneiw.supabase.co';
const supabaseKey = 'sb_publishable_HKKUstgS3rzPEmDk53OrMg_9J7JqsSx';
const supabase = createClient(supabaseUrl, supabaseKey);

const crypto = require('crypto');
const MASTER_KEY_ENV = 'aurasuite_sec_key_2026_master_9944a1b8e4f1c7d2';
function getDerivedKey() { return crypto.createHash('sha256').update(MASTER_KEY_ENV).digest(); }
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

async function resolveProviderCredentials(orgId, defaultProvider, defaultModel) {
  try {
    const { data: configs } = await supabase
      .from('ai_provider_configs')
      .select('*')
      .eq('organization_id', orgId)
      .eq('is_active', true);
    if (configs && configs.length > 0) {
      const cfg = configs.find(c => c.provider_name === defaultProvider) || configs[0];
      if (cfg && cfg.encrypted_api_key && cfg.nonce) {
        const plainKey = decryptKey(cfg.encrypted_api_key, cfg.nonce);
        return { providerName: cfg.provider_name, apiKey: plainKey, model: cfg.default_model || defaultModel };
      }
    }
    throw new Error("No config found or decryption failed");
  } catch (e) {
    console.warn('BYOK decryption lookup failed, using server environment fallback:', e.message);
  }
  return { providerName: defaultProvider || 'gemini', apiKey: process.env.GEMINI_API_KEY, model: defaultModel };
}

async function run() {
  const taskId = 'task-b6d925fb-9ae7-446d-a1c6-cf35a3963b63';
  const { data: task, error: tErr } = await supabase.from('engine_tasks').select('*, agents(*)').eq('id', taskId).single();
  console.log("Task orgId:", task.organization_id);
  const creds = await resolveProviderCredentials(task.organization_id, task.agents.default_provider, task.agents.default_model);
  console.log("Creds resolved:", creds.providerName, creds.apiKey ? "KEY_PRESENT" : "NO_KEY");
}
run();

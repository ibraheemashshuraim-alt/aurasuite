const crypto = require('crypto');
const MASTER_KEY_ENV = 'aurasuite_sec_key_2026_master_9944a1b8e4f1c7d2';

function getDerivedKey() {
  return crypto.createHash('sha256').update(MASTER_KEY_ENV).digest();
}

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

try {
  const k = decryptKey("Z7ETfj4DztUSMb2z7oqgXpqaiqerkDbD6HXuIXcrPqmnmC0Jo2tA:/m19qhZ96yWglUK+oNVoXw==", "wgNjaIlC7QSo4Vte");
  console.log("Decrypted successfully:", k.substring(0,10) + "...");
} catch (e) {
  console.error("Decryption failed:", e.message);
}

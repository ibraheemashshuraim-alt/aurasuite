import crypto from 'crypto';

const MASTER_KEY_ENV = process.env.AURA_MASTER_KEY || 'aurasuite-master-encryption-key-32b!';

// Derive exact 32-byte key for AES-256
function getDerivedKey() {
  return crypto.createHash('sha256').update(MASTER_KEY_ENV).digest();
}

/**
 * Encrypt a plaintext API Key using AES-256-GCM
 * @param {string} plainText 
 * @returns {{ ciphertext: string, nonce: string, hint: string }}
 */
export function encryptKey(plainText) {
  if (!plainText || typeof plainText !== 'string') {
    throw new Error('Plaintext cannot be empty');
  }

  const key = getDerivedKey();
  const iv = crypto.randomBytes(12); // Standard 12-byte nonce for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag().toString('base64');
  // Combine ciphertext and authTag into unified payload
  const combinedCiphertext = `${encrypted}:${authTag}`;

  const trimmed = plainText.trim();
  const hint = trimmed.length > 4 ? `...${trimmed.slice(-4)}` : '****';

  return {
    ciphertext: combinedCiphertext,
    nonce: iv.toString('base64'),
    hint,
  };
}

/**
 * Decrypt a ciphertext using AES-256-GCM
 * @param {string} ciphertextCombined 
 * @param {string} nonceB64 
 * @returns {string}
 */
export function decryptKey(ciphertextCombined, nonceB64) {
  if (!ciphertextCombined || !nonceB64) {
    throw new Error('Ciphertext and nonce are required for decryption');
  }

  const [encrypted, authTagB64] = ciphertextCombined.split(':');
  if (!encrypted || !authTagB64) {
    throw new Error('Malformed ciphertext payload');
  }

  const key = getDerivedKey();
  const iv = Buffer.from(nonceB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

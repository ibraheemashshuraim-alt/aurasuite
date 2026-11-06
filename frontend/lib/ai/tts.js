// Shared Jarvis Neural Voice Generator & WAV Encoder
import { createClient } from '@supabase/supabase-js';
import { decryptKey } from '@/lib/ai/crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseKey);

export function pcmToWav(pcmBase64, sampleRate = 24000, numChannels = 1, bitDepth = 16) {
  let pcmBuffer = Buffer.from(pcmBase64, 'base64');

  // Ensure buffer length is strictly aligned to 16-bit 2-byte boundary
  if (pcmBuffer.length % 2 !== 0) {
    pcmBuffer = pcmBuffer.subarray(0, pcmBuffer.length - 1);
  }

  // Smooth Fade-In (~5ms) to eliminate opening DC click
  const fadeInSamples = Math.min(120, Math.floor(pcmBuffer.length / 2));
  for (let i = 0; i < fadeInSamples; i++) {
    const byteOffset = i * 2;
    const sample = pcmBuffer.readInt16LE(byteOffset);
    const factor = i / fadeInSamples;
    pcmBuffer.writeInt16LE(Math.round(sample * factor), byteOffset);
  }

  // Smooth Fade-Out (~40ms) to eliminate trailing hiss/pop
  const fadeOutSamples = Math.min(960, Math.floor(pcmBuffer.length / 2));
  const startByte = pcmBuffer.length - (fadeOutSamples * 2);
  for (let i = 0; i < fadeOutSamples; i++) {
    const byteOffset = startByte + (i * 2);
    const sample = pcmBuffer.readInt16LE(byteOffset);
    const factor = (fadeOutSamples - i) / fadeOutSamples;
    pcmBuffer.writeInt16LE(Math.round(sample * factor), byteOffset);
  }

  const byteRate = (sampleRate * numChannels * bitDepth) / 8;
  const blockAlign = (numChannels * bitDepth) / 8;
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitDepth, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

/**
 * Generates an authentic Jarvis neural voice WAV Buffer directly on the server
 * @param {string} text - Spoken text
 * @param {string} voice - Voice name ('Charon' | 'Aoede')
 * @param {string} apiKey - Optional Gemini API key
 * @param {string} orgId - Organization ID for key lookup fallback
 * @returns {Promise<Buffer|null>}
 */
export async function generateJarvisVoiceWav(text, voice = 'Charon', apiKey = null, orgId = 'org-aurasuite-superadmin') {
  if (!text || typeof text !== 'string') return null;

  let activeKey = apiKey;
  if (!activeKey) {
    try {
      const { data: configs } = await supabase
        .from('ai_provider_configs')
        .select('*')
        .eq('organization_id', orgId);

      const cfg = configs?.find(c => c.provider_name === 'gemini') || configs?.[0];
      if (cfg?.encrypted_api_key && cfg?.nonce) {
        activeKey = decryptKey(cfg.encrypted_api_key, cfg.nonce);
      }
    } catch (e) {
      console.warn('TTS API key decryption failed:', e.message);
    }
  }

  if (!activeKey) {
    activeKey = process.env.GEMINI_API_KEY || '';
  }

  if (!activeKey) return null;

  // Clean text: strip code blocks, markdown symbols, URLs
  let clean = text
    .replace(/\{[\s\S]*?\}/g, ' ')
    .replace(/[*_#`~[\]]/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/Jarvis Execution Completed:|- [a-zA-Z_]+:/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean) return null;
  const speechChunk = clean.slice(0, 220);

  // In-memory cache
  globalThis.__aurasuite_tts_cache = globalThis.__aurasuite_tts_cache || new Map();
  const cacheKey = `${voice}_${speechChunk.trim()}`;
  if (globalThis.__aurasuite_tts_cache.has(cacheKey)) {
    return globalThis.__aurasuite_tts_cache.get(cacheKey);
  }

  const ttsModels = [
    'gemini-3.8-flash-lite-tts',
    'gemini-3.1-flash-tts-preview',
    'gemini-3.8-flash-tts'
  ];

  for (const modelName of ttsModels) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${activeKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: speechChunk }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voice
                }
              }
            }
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const inlineData = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        if (inlineData?.data) {
          const rawBuf = Buffer.from(inlineData.data, 'base64');
          let wavBuffer;
          if (rawBuf.slice(0, 4).toString('ascii') === 'RIFF') {
            wavBuffer = rawBuf;
          } else {
            wavBuffer = pcmToWav(inlineData.data, 24000);
          }

          if (globalThis.__aurasuite_tts_cache.size > 200) {
            const firstKey = globalThis.__aurasuite_tts_cache.keys().next().value;
            globalThis.__aurasuite_tts_cache.delete(firstKey);
          }
          globalThis.__aurasuite_tts_cache.set(cacheKey, wavBuffer);
          return wavBuffer;
        }
      }
    } catch (err) {
      console.warn(`TTS attempt with ${modelName} failed:`, err.message);
    }
  }

  return null;
}

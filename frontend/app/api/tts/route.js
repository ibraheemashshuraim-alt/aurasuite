import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decryptKey } from '@/lib/ai/crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseKey);

let cachedApiKey = null;
let lastKeyFetchTime = 0;

async function getGeminiApiKey(orgId) {
  const now = Date.now();
  if (cachedApiKey && (now - lastKeyFetchTime < 1000 * 60 * 30)) {
    return cachedApiKey;
  }
  try {
    const { data: configs } = await supabase
      .from('ai_provider_configs')
      .select('*')
      .eq('organization_id', orgId)
      .eq('is_active', true);

    const cfg = configs?.find(c => c.provider_name === 'gemini') || configs?.[0];
    if (cfg?.encrypted_api_key && cfg?.nonce) {
      cachedApiKey = decryptKey(cfg.encrypted_api_key, cfg.nonce);
      lastKeyFetchTime = now;
      return cachedApiKey;
    }
  } catch (e) {
    console.warn('Fast Gemini key decryption failed, fallback to env:', e.message);
  }
  return process.env.GEMINI_API_KEY || '';
}

function pcmToWav(pcmBase64, sampleRate = 24000, numChannels = 1, bitDepth = 16) {
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

  // Smooth Fade-Out (~40ms) to eliminate trailing 'khush' hiss/pop
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

export async function POST(request) {
  try {
    const { text, lang, voice, gender } = await request.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const selectedVoice = voice || (gender === 'female' ? 'Aoede' : 'Charon');

    // Clean text: remove code blocks, JSON, actions, markdown symbols
    let cleanText = text
      .replace(/\{[\s\S]*?\}/g, ' ')
      .replace(/[*_#`~[\]]/g, ' ')
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/Jarvis Execution Completed:|- [a-zA-Z_]+:/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      return NextResponse.json({ error: 'Clean text is empty' }, { status: 400 });
    }

    const speechChunk = cleanText.slice(0, 220);
    const orgId = 'org-aurasuite-superadmin';
    const apiKey = await getGeminiApiKey(orgId);

    // In-memory cache for ultra-fast instant voice responses
    globalThis.__aurasuite_tts_cache = globalThis.__aurasuite_tts_cache || new Map();
    const cacheKey = `${selectedVoice}_${speechChunk.trim()}`;
    if (globalThis.__aurasuite_tts_cache.has(cacheKey)) {
      const cachedWav = globalThis.__aurasuite_tts_cache.get(cacheKey);
      return new Response(cachedWav, {
        status: 200,
        headers: {
          'Content-Type': 'audio/wav',
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
          'X-TTS-Cached': 'true'
        }
      });
    }

    // Primary: Google Gemini Studio Neural Voice (gemini-2.5-flash-preview-tts)
    if (apiKey) {
      try {
        const ttsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: speechChunk }] }],
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: selectedVoice
                  }
                }
              }
            }
          })
        });

        if (ttsRes.ok) {
          const ttsData = await ttsRes.json();
          const pcmBase64 = ttsData?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (pcmBase64) {
            const wavBuffer = pcmToWav(pcmBase64, 24000);
            // Save in cache (keep last 100 clips)
            if (globalThis.__aurasuite_tts_cache.size > 100) {
              const firstKey = globalThis.__aurasuite_tts_cache.keys().next().value;
              globalThis.__aurasuite_tts_cache.delete(firstKey);
            }
            globalThis.__aurasuite_tts_cache.set(cacheKey, wavBuffer);

            return new Response(wavBuffer, {
              status: 200,
              headers: {
                'Content-Type': 'audio/wav',
                'Cache-Control': 'public, max-age=86400, s-maxage=86400',
                'X-TTS-Cached': 'false'
              }
            });
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini TTS error:', geminiErr.message);
      }
    }

    // Fast, Unlimited Neural TTS Fallback (Auto-detects Urdu vs English)
    try {
      const isUrduScript = /[\u0600-\u06FF]/.test(speechChunk);
      const chosenLang = isUrduScript ? 'ur' : (selectedVoice === 'Charon' ? 'en-GB' : 'en-US');
      const encoded = encodeURIComponent(speechChunk);
      const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=${chosenLang}&client=tw-ob`;

      const gRes = await fetch(googleTtsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (gRes.ok) {
        const audioBuffer = Buffer.from(await gRes.arrayBuffer());
        if (globalThis.__aurasuite_tts_cache.size > 100) {
          const firstKey = globalThis.__aurasuite_tts_cache.keys().next().value;
          globalThis.__aurasuite_tts_cache.delete(firstKey);
        }
        globalThis.__aurasuite_tts_cache.set(cacheKey, audioBuffer);

        return new Response(audioBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'public, max-age=86400, s-maxage=86400',
            'X-TTS-Provider': 'google-neural-fast'
          }
        });
      }
    } catch (gErr) {
      console.warn('Google Neural TTS fallback error:', gErr.message);
    }

    return NextResponse.json({ error: 'Jarvis neural voice unavailable' }, { status: 503 });
  } catch (err) {
    console.error('TTS API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

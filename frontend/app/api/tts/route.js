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
  const pcmBuffer = Buffer.from(pcmBase64, 'base64');
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
    const { text, lang } = await request.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

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

    // Primary: Google Gemini Studio Charon Voice (Authentic Jarvis Engine)
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
                    voiceName: 'Charon' // Iconic British AI assistant voice
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
            return new Response(wavBuffer, {
              status: 200,
              headers: {
                'Content-Type': 'audio/wav',
                'Cache-Control': 'public, max-age=86400, s-maxage=86400'
              }
            });
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini Charon TTS failed, falling back:', geminiErr.message);
      }
    }

    // Fallback: Google Translate TTS
    const isUrduScript = /[\u0600-\u06FF]/.test(speechChunk);
    let chosenLang = lang || (isUrduScript ? 'ur' : 'en-GB');
    const encoded = encodeURIComponent(speechChunk);
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=${chosenLang}&client=tw-ob`;

    const res = await fetch(googleTtsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (res.ok) {
      const audioBuffer = await res.arrayBuffer();
      return new Response(audioBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=86400, s-maxage=86400'
        }
      });
    }

    return NextResponse.json({ error: 'Failed to synthesize voice' }, { status: 500 });
  } catch (err) {
    console.error('TTS API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

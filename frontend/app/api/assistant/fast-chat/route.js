import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decryptKey } from '@/lib/ai/crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// In-memory cache for API key to avoid DB lookup on every single voice query
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

export async function POST(request) {
  const startTime = Date.now();
  try {
    const { prompt, orgId, userName } = await request.json();
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const organizationId = orgId || 'org-aurasuite-superadmin';
    const apiKey = await getGeminiApiKey(organizationId);

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing Gemini API key' }, { status: 500 });
    }

    const systemPrompt = [
      'You are Jarvis, the authentic, highly intelligent, iconic AI assistant from Iron Man.',
      'RULES:',
      '1. LANGUAGE & ACCENT:',
      '   - If the user speaks in Urdu or Roman Urdu (e.g. "Salam", "kya haal hai", "aap kaise hain"): You MUST reply directly in pure, authentic Urdu script (اردو رسم الخط - e.g. "وعلیکم السلام! میں بالکل ٹھیک ہوں۔ بتائیے کیا خدمت کر سکتا ہوں؟"). DO NOT write in English/Latin letters.',
      '   - If the user speaks in English: Respond in the authentic British Jarvis persona: crisp, polite, refined, loyal (e.g. "Good day, sir. All systems are fully operational. How may I assist you today?").',
      '2. SPEED & DIRECTNESS:',
      '   - Respond directly in 1 short, complete, natural sentence (max 20-30 words).',
      '   - NEVER repeat the user\'s question or say "Order received" or "You asked about". Answer directly.',
      '3. OS & DESKTOP ACTIONS (JARVIS DAEMON):',
      '   - If the user explicitly asks to open an application (Notepad, Calculator, Paint, Chrome, Browser) or write a file, you MUST return ONLY a raw JSON object with an "actions" array.',
      '   - Supported actions: launch_app, close_app, write_file, open_url, type, click.',
      '   - Example: { "actions": [{ "type": "launch_app", "target": "calc" }] }',
      '   - If no OS action is needed, return ONLY your natural conversational response without JSON.'
    ].join('\n');

    // Call Google Gemini directly for sub-second generation
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 250
        }
      })
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      throw new Error(`Gemini API error (${geminiRes.status}): ${errText}`);
    }

    const data = await geminiRes.json();
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    text = text.trim();

    // Check if this is an action plan
    let isActionPlan = false;
    let cleanJson = text;
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\n?/, '').replace(/```$/, '').trim();
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\n?/, '').replace(/```$/, '').trim();
    }

    try {
      const parsed = JSON.parse(cleanJson);
      if (parsed && Array.isArray(parsed.actions)) {
        isActionPlan = true;
      }
    } catch (e) {}

    // Async persist to engine_tasks in the background so history and desktop daemon can work
    (async () => {
      try {
        const { data: insertedTask } = await supabase.from('engine_tasks').insert({
          organization_id: organizationId,
          title: prompt.slice(0, 50),
          prompt,
          status: isActionPlan ? 'ACTION_REQUIRED' : 'VERIFIED',
          result: text,
          output_payload: { result: text },
          completed_at: isActionPlan ? null : new Date().toISOString()
        }).select().single();

        if (isActionPlan && insertedTask) {
          const { executeActionPlan } = await import('@/lib/ai/actions/executor');
          await executeActionPlan(insertedTask.id, null, organizationId, cleanJson);
        }
      } catch (dbErr) {
        console.warn('Background task sync error:', dbErr.message);
      }
    })();

    return NextResponse.json({
      success: true,
      text,
      isActionPlan,
      elapsedMs: Date.now() - startTime
    });
  } catch (err) {
    console.error('Fast assistant API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

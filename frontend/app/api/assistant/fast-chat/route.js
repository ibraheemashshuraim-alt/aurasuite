import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decryptKey } from '@/lib/ai/crypto';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

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

export async function POST(request) {
  const startTime = Date.now();
  try {
    const { prompt, orgId, userName, autoApprove } = await request.json();
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const organizationId = orgId || 'org-aurasuite-superadmin';
    const cleanLower = prompt.trim().toLowerCase();
    const isUrdu = cleanLower.includes('kholo') || cleanLower.includes('khol') || cleanLower.includes('karo') || cleanLower.includes('chalao') || cleanLower.includes('hai') || cleanLower.includes('salam') || cleanLower.includes('salaam') || cleanLower.includes('assalam') || cleanLower.includes('سلام') || cleanLower.includes('sun') || /[\u0600-\u06FF]/.test(prompt);

    // ==========================================
    // 0. INSTANT ZERO-LATENCY CONVERSATIONAL REPLIES
    // ==========================================
    const isGreeting = cleanLower.includes('salam') || cleanLower.includes('salaam') || cleanLower.includes('assalam') || cleanLower.includes('سلام') || cleanLower.includes('hello') || cleanLower.includes('ہیلو') || cleanLower.includes('hi jarvis');
    const isStatusCheck = cleanLower.includes('kaise') || cleanLower.includes('kese') || cleanLower.includes('کیسے ہو') || cleanLower.includes('کیا حال') || cleanLower.includes('how are you');
    const isThanks = cleanLower.includes('shukriya') || cleanLower.includes('شکریہ') || cleanLower.includes('thank');

    if (isGreeting || isStatusCheck || isThanks) {
      let instantText = '';
      if (isGreeting) {
        if (cleanLower.includes('rahmat') || cleanLower.includes('barakat')) {
          instantText = 'وعلیکم السلام ورحمۃ اللہ وبرکاتہ سر! میں حاضر ہوں۔ فرمائیے، میں آپ کی کیا خدمت کر سکتا ہوں؟';
        } else {
          instantText = isUrdu ? 'وعلیکم السلام سر! میں حاضر ہوں۔ بتائیے کیا حکم ہے؟' : 'Good day, sir. Systems are online and ready for your command.';
        }
      } else if (isStatusCheck) {
        instantText = isUrdu ? 'الحمدللہ سر، میں بالکل ٹھیک ہوں۔ سسٹم کے تمام ماڈیولز نارمل کام کر رہے ہیں۔' : 'All systems operating at 100% efficiency, sir. Ready for instructions.';
      } else if (isThanks) {
        instantText = isUrdu ? 'میرا فرض ہے سر! کوئی اور کام ہو تو ضرور بتائیے۔' : 'Always at your service, sir.';
      }
      return NextResponse.json({ success: true, text: instantText, isActionPlan: false, elapsedMs: Date.now() - startTime });
    }

    // ==========================================
    // 1. DIRECT AURASUITE SYSTEM & PC ACTIONS
    // ==========================================
    // (a) User count query
    if (
      (cleanLower.includes('how many user') || cleanLower.includes('kitne user') || cleanLower.includes('total user') || cleanLower.includes('users count')) ||
      (cleanLower.includes('check') && cleanLower.includes('user'))
    ) {
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const userCount = count || 0;
      const responseText = isUrdu
        ? `سر، اس وقت اورا سویٹ سسٹم میں کل ${userCount} یوزرز رجسٹرڈ ہیں۔`
        : `Sir, there are currently ${userCount} registered users in the AuraSuite system.`;
      
      return NextResponse.json({ success: true, text: responseText, isActionPlan: false, elapsedMs: Date.now() - startTime });
    }

    // (b) User lock/suspension command
    if (
      (cleanLower.includes('lock') || cleanLower.includes('suspend') || cleanLower.includes('band karo')) &&
      (cleanLower.includes('user') || cleanLower.includes('account'))
    ) {
      const words = prompt.split(/\s+/);
      const targetWord = words.find(w => w.length > 2 && !['lock', 'suspend', 'user', 'account', 'the', 'ko', 'karo', 'karein', 'please'].includes(w.toLowerCase()));
      
      let matchMsg = '';
      if (targetWord) {
        const { data: foundUsers } = await supabase.from('profiles')
          .select('id, full_name, username')
          .or(`full_name.ilike.%${targetWord}%,username.ilike.%${targetWord}%`)
          .limit(1);

        if (foundUsers && foundUsers.length > 0) {
          const u = foundUsers[0];
          await supabase.from('profiles').update({ is_locked: true }).eq('id', u.id);
          matchMsg = `یوزر "${u.full_name}" (@${u.username}) کا اکاؤنٹ فوری طور پر لاک اور سسپینڈ کر دیا گیا ہے۔`;
        } else {
          matchMsg = `معذرت سر، نام "${targetWord}" کا کوئی یوزر سسٹم میں نہیں ملا۔`;
        }
      } else {
        matchMsg = 'سر، برائے مہربانی اس یوزر کا نام یا یوزر نیم بتائیے جسے لاک کرنا ہے۔';
      }

      return NextResponse.json({ success: true, text: matchMsg, isActionPlan: false, elapsedMs: Date.now() - startTime });
    }

    // (c) Direct Windows PC Application Launchers
    if (cleanLower.includes('calc') || cleanLower.includes('کیلکولیٹر')) {
      exec('start calc');
      const msg = isUrdu ? 'سر، میں نے آپ کے کمپیوٹر پر کیلکولیٹر کھول دیا ہے۔' : 'Launching Calculator now, sir.';
      return NextResponse.json({ success: true, text: msg, isActionPlan: true, actions: [{ type: 'launch_app', target: 'calc' }], elapsedMs: Date.now() - startTime });
    }

    if (cleanLower.includes('notepad') || cleanLower.includes('نوٹ پیڈ') || cleanLower.includes('نوٹپیڈ')) {
      exec('start notepad');
      const msg = isUrdu ? 'سر، نوٹ پیڈ اوپن کر دیا گیا ہے۔ بتائیے کیا لکھنا ہے؟' : 'Opening Notepad now, sir.';
      return NextResponse.json({ success: true, text: msg, isActionPlan: true, actions: [{ type: 'launch_app', target: 'notepad' }], elapsedMs: Date.now() - startTime });
    }

    if (cleanLower.includes('paint') || cleanLower.includes('پینٹ')) {
      exec('start mspaint');
      const msg = isUrdu ? 'سر، پینٹ ایپلیکیشن اوپن کر دی گئی ہے۔' : 'Launching Paint application, sir.';
      return NextResponse.json({ success: true, text: msg, isActionPlan: true, actions: [{ type: 'launch_app', target: 'paint' }], elapsedMs: Date.now() - startTime });
    }

    if ((cleanLower.includes('chrome') || cleanLower.includes('browser') || cleanLower.includes('کروم') || cleanLower.includes('براؤزر')) && (cleanLower.includes('open') || cleanLower.includes('kholo') || cleanLower.includes('start'))) {
      exec('start chrome');
      const msg = isUrdu ? 'سر، گوگل کروم براؤزر کھول دیا گیا ہے۔' : 'Opening Google Chrome, sir.';
      return NextResponse.json({ success: true, text: msg, isActionPlan: true, actions: [{ type: 'launch_app', target: 'chrome' }], elapsedMs: Date.now() - startTime });
    }

    if (cleanLower.includes('explorer') || cleanLower.includes('my computer') || cleanLower.includes('فائلز') || cleanLower.includes('files')) {
      exec('start explorer');
      const msg = isUrdu ? 'سر، فائل ایکسپلورر کھول دیا گیا ہے۔' : 'Opening File Explorer, sir.';
      return NextResponse.json({ success: true, text: msg, isActionPlan: true, actions: [{ type: 'launch_app', target: 'explorer' }], elapsedMs: Date.now() - startTime });
    }

    // ==========================================
    // 2. GEMINI AI JARVIS ENGINE (gemini-2.5-flash)
    // ==========================================
    const apiKey = await getGeminiApiKey(organizationId);
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing Gemini API key' }, { status: 500 });
    }

    const systemPrompt = [
      'You are Jarvis, the authentic, highly intelligent, iconic AI assistant from Iron Man.',
      'SYSTEM KNOWLEDGE: You are deployed in AuraSuite (an Enterprise SaaS Operating System). You have full control over Windows computer tasks and AuraSuite system data.',
      'RULES:',
      '1. LANGUAGE & ACCENT:',
      '   - If the user speaks in Urdu or Roman Urdu: You MUST reply directly in pure, authentic Urdu script (اردو رسم الخط - e.g. "وعلیکم السلام! میں بالکل ٹھیک ہوں۔ بتائیے کیا خدمت کر سکتا ہوں؟"). DO NOT write in English/Latin letters.',
      '   - If the user speaks in English: Respond in the authentic British Jarvis persona: crisp, polite, refined, loyal (e.g. "Good day, sir. All systems are fully operational. How may I assist you today?").',
      '2. SPEED & ULTRA-DIRECTNESS:',
      '   - Respond directly in ONE short, complete, natural sentence (max 15-25 words). Never add fluff or preamble.',
      '   - NEVER repeat the user\'s question. Answer immediately.',
      '3. OS & COMPUTER AUTOMATION ACTIONS:',
      '   - If the user asks to open an application (Notepad, Calculator, Paint, Chrome, Browser), close an app, search google, or write a file, you MUST return ONLY a raw JSON object with an "actions" array.',
      '   - Supported actions:',
      '     * { "type": "launch_app", "target": "calc" | "notepad" | "paint" | "chrome" | "explorer" }',
      '     * { "type": "close_app", "target": "calc" | "notepad" | "chrome" }',
      '     * { "type": "write_file", "target": "Desktop/filename.txt", "value": "text content" }',
      '     * { "type": "open_url", "target": "https://www.google.com" }',
      '   - If no OS action is needed, return ONLY your natural conversational response without JSON.'
    ].join('\n');

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 100
        }
      })
    });

    let responseText = '';
    if (geminiRes.ok) {
      const data = await geminiRes.json();
      responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else {
      console.warn('gemini-2.5-flash status:', geminiRes.status, await geminiRes.text());
      responseText = isUrdu ? 'سر، میں آپ کی بات سمجھ گیا ہوں۔ بتائیے کیا کارروائی کرنی ہے؟' : 'Understood, sir. How shall we proceed?';
    }

    let text = responseText.trim();

    // Check if this is an action plan
    let isActionPlan = false;
    let cleanJson = text;
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\n?/, '').replace(/```$/, '').trim();
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\n?/, '').replace(/```$/, '').trim();
    }

    let parsedPlan = null;
    try {
      const parsed = JSON.parse(cleanJson);
      if (parsed && Array.isArray(parsed.actions)) {
        isActionPlan = true;
        parsedPlan = parsed;
      }
    } catch (e) {}

    // Execute actions locally on Windows
    if (isActionPlan && parsedPlan && Array.isArray(parsedPlan.actions)) {
      parsedPlan.actions.forEach(act => {
        if (act.type === 'launch_app' && act.target) {
          exec(`start ${act.target}`);
        } else if (act.type === 'open_url' && act.target) {
          exec(`start "" "${act.target}"`);
        } else if (act.type === 'write_file' && act.target) {
          try {
            const deskPath = path.join(os.homedir(), 'Desktop', act.target.replace(/^[/\\]+/, ''));
            fs.writeFileSync(deskPath, act.value || '', 'utf8');
          } catch (e) {}
        }
      });

      // Provide natural spoken confirmation instead of raw JSON
      if (text.includes('{') || text.includes('actions')) {
        text = isUrdu ? 'سر، میں نے آپ کے سسٹم پر یہ ٹاسک مکمل کر دیا ہے۔' : 'Right away, sir. Executed on your desktop successfully.';
      }
    }

    // Async persist to engine_tasks
    (async () => {
      try {
        const initialStatus = isActionPlan ? 'COMPLETED' : 'VERIFIED';
        await supabase.from('engine_tasks').insert({
          organization_id: organizationId,
          title: prompt.slice(0, 50),
          prompt,
          status: initialStatus,
          result: text,
          output_payload: { result: text },
          completed_at: new Date().toISOString()
        });
      } catch (dbErr) {
        console.warn('Background task sync error:', dbErr.message);
      }
    })();

    return NextResponse.json({
      success: true,
      text,
      isActionPlan,
      actions: parsedPlan?.actions || [],
      elapsedMs: Date.now() - startTime
    });
  } catch (err) {
    console.error('Fast assistant API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

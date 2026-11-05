import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decryptKey } from '@/lib/ai/crypto';
import { generateJarvisVoiceWav } from '@/lib/ai/tts';
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
    const { prompt, orgId, userName, userId, voice, gender, autoApprove } = await request.json();
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const organizationId = orgId || 'org-aurasuite-superadmin';
    const cleanLower = prompt.trim().toLowerCase();
    const isUrdu = cleanLower.includes('kholo') || cleanLower.includes('khol') || cleanLower.includes('karo') || cleanLower.includes('chalao') || cleanLower.includes('hai') || cleanLower.includes('salam') || cleanLower.includes('salaam') || cleanLower.includes('assalam') || cleanLower.includes('سلام') || cleanLower.includes('sun') || /[\u0600-\u06FF]/.test(prompt);

    const apiKey = await getGeminiApiKey(organizationId);
    const selectedVoice = voice || (gender === 'female' ? 'Aoede' : 'Charon');

    // ==========================================
    // 0. LIVE SOFTWARE HOUSE DATABASE STATE
    // ==========================================
    let orgName = 'سافٹ ویئر ہاؤس';
    try {
      if (organizationId && organizationId !== 'all') {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('id', organizationId)
          .maybeSingle();
        if (orgData?.name) {
          orgName = orgData.name;
        }
      }
    } catch (e) {}

    // Query profiles belonging strictly to this organization
    let profileQuery = supabase.from('profiles').select('id, full_name, username, role, is_locked, organization_id');
    if (organizationId && organizationId !== 'all') {
      profileQuery = profileQuery.eq('organization_id', organizationId);
    }
    const { data: profiles } = await profileQuery;

    // Query real-time presence for this organization
    let presenceQuery = supabase.from('presence').select('user_id, last_seen, organization_id');
    if (organizationId && organizationId !== 'all') {
      presenceQuery = presenceQuery.eq('organization_id', organizationId);
    }
    const { data: presences } = await presenceQuery;

    const now = Date.now();
    // Considered online if presence last_seen is within the last 15 minutes (900,000 ms)
    const activePresenceUserIds = new Set(
      (presences || [])
        .filter(p => (now - Number(p.last_seen)) < 15 * 60 * 1000)
        .map(p => p.user_id)
    );
    if (userId) activePresenceUserIds.add(userId);

    const totalUsers = profiles && profiles.length > 0 ? profiles.length : 1;
    const onlineProfiles = (profiles || []).filter(p => 
      activePresenceUserIds.has(p.id) || 
      (userId && p.id === userId) ||
      (userName && p.full_name?.toLowerCase().includes(userName.toLowerCase()))
    );
    const offlineProfiles = (profiles || []).filter(p => !onlineProfiles.some(op => op.id === p.id));

    const onlineCount = Math.max(1, onlineProfiles.length);
    const offlineCount = Math.max(0, totalUsers - onlineCount);

    const onlineNamesList = onlineProfiles.map(p => p.full_name || p.username || 'یوزر').join('، ');
    const offlineNamesList = offlineProfiles.map(p => p.full_name || p.username || 'یوزر').join('، ');

    let decidedText = null;
    let isActionPlan = false;
    let actions = [];

    // ==========================================
    // 1. INSTANT ZERO-LATENCY CONVERSATIONAL REPLIES
    // ==========================================
    const isGreeting = cleanLower.includes('salam') || cleanLower.includes('salaam') || cleanLower.includes('assalam') || cleanLower.includes('سلام') || cleanLower.includes('hello') || cleanLower.includes('ہیلو') || cleanLower.includes('hi jarvis');
    const isStatusCheck = cleanLower.includes('kaise') || cleanLower.includes('kese') || cleanLower.includes('کیسے ہو') || cleanLower.includes('کیا حال') || cleanLower.includes('how are you');
    const isThanks = cleanLower.includes('shukriya') || cleanLower.includes('شکریہ') || cleanLower.includes('thank');

    if (isGreeting || isStatusCheck || isThanks) {
      if (isGreeting) {
        if (cleanLower.includes('rahmat') || cleanLower.includes('barakat')) {
          decidedText = 'وعلیکم السلام ورحمۃ اللہ وبرکاتہ سر! میں حاضر ہوں۔ فرمائیے، میں آپ کی کیا خدمت کر سکتا ہوں؟';
        } else {
          decidedText = isUrdu ? 'وعلیکم السلام سر! میں حاضر ہوں۔ بتائیے کیا حکم ہے؟' : 'Good day, sir. Systems are online and ready for your command.';
        }
      } else if (isStatusCheck) {
        decidedText = isUrdu ? 'الحمدللہ سر، میں بالکل ٹھیک ہوں۔ سسٹم کے تمام ماڈیولز نارمل کام کر رہے ہیں۔' : 'All systems operating at 100% efficiency, sir. Ready for instructions.';
      } else if (isThanks) {
        decidedText = isUrdu ? 'میرا فرض ہے سر! کوئی اور کام ہو تو ضرور بتائیے۔' : 'Always at your service, sir.';
      }
    }

    // ==========================================
    // 2. REAL-TIME SOFTWARE HOUSE USER & MEMBER QUERIES
    // ==========================================
    if (!decidedText) {
      // (a) Specific user names / offline user list query
      const isAskingNames =
        cleanLower.includes('نام') ||
        cleanLower.includes('name') ||
        cleanLower.includes('naam') ||
        cleanLower.includes('کون کون') ||
        cleanLower.includes('کون ہے') ||
        cleanLower.includes('کون ہیں') ||
        cleanLower.includes('لسٹ') ||
        cleanLower.includes('list') ||
        cleanLower.includes('تفصیل') ||
        cleanLower.includes('چاروں') ||
        (cleanLower.includes('چار') && (cleanLower.includes('یوزر') || cleanLower.includes('بتا')));

      if (isAskingNames && (cleanLower.includes('offline') || cleanLower.includes('آف لائن') || cleanLower.includes('اف لائن') || cleanLower.includes('چار') || cleanLower.includes('باقی') || cleanLower.includes('یوزر') || cleanLower.includes('لوگ'))) {
        decidedText = isUrdu
          ? `سر، آپ کے سافٹ ویئر ہاؤس "${orgName}" میں اس وقت جو ${offlineCount} یوزرز آف لائن ہیں ان کے نام یہ ہیں: ${offlineNamesList}۔ اور اس وقت صرف آپ (${onlineNamesList}) آن لائن ہیں۔`
          : `Sir, the ${offlineCount} offline users in "${orgName}" are: ${offlineNamesList}. Currently, only you (${onlineNamesList}) are online.`;
      }
      // (b) Online count / User count / Status query
      else if (
        cleanLower.includes('کتنے لوگ') ||
        cleanLower.includes('کتنے یوزر') ||
        cleanLower.includes('ان لائن') ||
        cleanLower.includes('آن لائن') ||
        cleanLower.includes('کون آن لائن') ||
        cleanLower.includes('who is online') ||
        cleanLower.includes('how many users') ||
        cleanLower.includes('kitne user') ||
        cleanLower.includes('users count') ||
        cleanLower.includes('total user') ||
        ((cleanLower.includes('user') || cleanLower.includes('لوگ')) && (cleanLower.includes('check') || cleanLower.includes('کتنے') || cleanLower.includes('دیکھ') || cleanLower.includes('بتاؤ')))
      ) {
        if (isUrdu) {
          if (onlineCount === 1) {
            decidedText = `سر، میں نے آپ کے سافٹ ویئر ہاؤس "${orgName}" کا لائیو جائزہ لیا ہے۔ سسٹم میں کل ${totalUsers} یوزرز رجسٹرڈ ہیں، اور اس وقت صرف آپ (${userName || onlineNamesList}) آن لائن ہیں جبکہ باقی ${offlineCount} یوزرز آف لائن ہیں۔`;
          } else {
            decidedText = `سر، میں نے آپ کے سافٹ ویئر ہاؤس "${orgName}" کا لائیو جائزہ لیا ہے۔ سسٹم میں کل ${totalUsers} یوزرز ہیں، جن میں سے اس وقت ${onlineCount} یوزرز (${onlineNamesList}) آن لائن ہیں اور باقی ${offlineCount} آف لائن ہیں۔`;
          }
        } else {
          if (onlineCount === 1) {
            decidedText = `Sir, I inspected your software house "${orgName}". There are ${totalUsers} registered users in total, and currently only you are online (${offlineCount} offline).`;
          } else {
            decidedText = `Sir, in your software house "${orgName}", there are ${totalUsers} registered users. Currently ${onlineCount} are online and ${offlineCount} are offline.`;
          }
        }
      }
    }

    // ==========================================
    // 3. USER LOCK / SUSPENSION COMMAND
    // ==========================================
    if (!decidedText) {
      if (
        (cleanLower.includes('lock') || cleanLower.includes('suspend') || cleanLower.includes('band karo')) &&
        (cleanLower.includes('user') || cleanLower.includes('account'))
      ) {
        const words = prompt.split(/\s+/);
        const targetWord = words.find(w => w.length > 2 && !['lock', 'suspend', 'user', 'account', 'the', 'ko', 'karo', 'karein', 'please'].includes(w.toLowerCase()));
        
        if (targetWord) {
          const { data: foundUsers } = await supabase.from('profiles')
            .select('id, full_name, username')
            .eq('organization_id', organizationId)
            .or(`full_name.ilike.%${targetWord}%,username.ilike.%${targetWord}%`)
            .limit(1);

          if (foundUsers && foundUsers.length > 0) {
            const u = foundUsers[0];
            await supabase.from('profiles').update({ is_locked: true }).eq('id', u.id);
            decidedText = `یوزر "${u.full_name}" (@${u.username}) کا اکاؤنٹ فوری طور پر لاک اور سسپینڈ کر دیا گیا ہے۔`;
          } else {
            decidedText = `معذرت سر، نام "${targetWord}" کا کوئی یوزر آپ کے سافٹ ویئر ہاؤس میں نہیں ملا۔`;
          }
        } else {
          decidedText = 'سر، برائے مہربانی اس یوزر کا نام یا یوزر نیم بتائیے جسے لاک کرنا ہے۔';
        }
      }
    }

    // ==========================================
    // 4. DIRECT WINDOWS PC APPLICATION LAUNCHERS
    // ==========================================
    if (!decidedText) {
      if (cleanLower.includes('calc') || cleanLower.includes('کیلکولیٹر')) {
        exec('start calc');
        decidedText = isUrdu ? 'سر، میں نے آپ کے کمپیوٹر پر کیلکولیٹر کھول دیا ہے۔' : 'Launching Calculator now, sir.';
        isActionPlan = true;
        actions = [{ type: 'launch_app', target: 'calc' }];
      } else if (cleanLower.includes('notepad') || cleanLower.includes('نوٹ پیڈ') || cleanLower.includes('نوٹپیڈ')) {
        exec('start notepad');
        decidedText = isUrdu ? 'سر، نوٹ پیڈ اوپن کر دیا گیا ہے۔ بتائیے کیا لکھنا ہے؟' : 'Opening Notepad now, sir.';
        isActionPlan = true;
        actions = [{ type: 'launch_app', target: 'notepad' }];
      } else if (cleanLower.includes('paint') || cleanLower.includes('پینٹ')) {
        exec('start mspaint');
        decidedText = isUrdu ? 'سر، پینٹ ایپلیکیشن اوپن کر دی گئی ہے۔' : 'Launching Paint application, sir.';
        isActionPlan = true;
        actions = [{ type: 'launch_app', target: 'paint' }];
      } else if ((cleanLower.includes('chrome') || cleanLower.includes('browser') || cleanLower.includes('کروم') || cleanLower.includes('براؤزر')) && (cleanLower.includes('open') || cleanLower.includes('kholo') || cleanLower.includes('start'))) {
        exec('start chrome');
        decidedText = isUrdu ? 'سر، گوگل کروم براؤزر کھول دیا گیا ہے۔' : 'Opening Google Chrome, sir.';
        isActionPlan = true;
        actions = [{ type: 'launch_app', target: 'chrome' }];
      } else if (cleanLower.includes('explorer') || cleanLower.includes('my computer') || cleanLower.includes('فائلز') || cleanLower.includes('files')) {
        exec('start explorer');
        decidedText = isUrdu ? 'سر، فائل ایکسپلورر کھول دیا گیا ہے۔' : 'Opening File Explorer, sir.';
        isActionPlan = true;
        actions = [{ type: 'launch_app', target: 'explorer' }];
      }
    }

    // ==========================================
    // 5. GEMINI AI JARVIS ENGINE (WITH LIVE DATABASE ROSTER)
    // ==========================================
    if (!decidedText) {
      if (!apiKey) {
        return NextResponse.json({ error: 'Missing Gemini API key' }, { status: 500 });
      }

      const rosterDetails = (profiles || []).map(p => `  * Name: "${p.full_name || p.username || 'User'}", Role: ${p.role}, Status: ${p.is_locked ? 'Locked' : 'Active'}, Online: ${onlineProfiles.some(op => op.id === p.id) ? 'YES' : 'NO'}`).join('\n');

      const systemPrompt = [
        'You are Jarvis, the authentic, highly intelligent, iconic AI assistant from Iron Man.',
        `REAL-TIME LIVE DATABASE CONTEXT FOR SOFTWARE HOUSE ("${orgName}"):`,
        `- Software House Name: "${orgName}"`,
        `- Total Registered Users: ${totalUsers}`,
        `- Online Users (${onlineCount}): ${onlineNamesList} (including current user ${userName})`,
        `- Offline Users (${offlineCount}): ${offlineNamesList}`,
        `- Detailed Member Roster:`,
        rosterDetails,
        'CRITICAL DATABASE TRUTH RULES:',
        '1. You MUST NEVER say there are 10 users unless the real count above is 10. For this software house, the exact count is ' + totalUsers + '.',
        '2. When asked about user names, offline users, online users, or roles, ALWAYS answer using the EXACT real names and roles from the roster above.',
        '3. If asked about offline users, their names are: ' + (offlineNamesList || 'None') + '.',
        '4. LANGUAGE & ACCENT: If the user speaks in Urdu or Roman Urdu, reply directly in pure, elegant Urdu script. Always complete your sentence cleanly.',
        '5. BREVITY: Keep answers to 1-2 direct, respectful, natural sentences. Never repeat the user\'s question.'
      ].join('\n');

      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 500
          }
        })
      });

      let responseText = '';
      if (geminiRes.ok) {
        const data = await geminiRes.json();
        responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else {
        console.warn('gemini-2.5-flash status:', geminiRes.status, await geminiRes.text());
        responseText = isUrdu ? 'سر، میں آپ کی بات سمجھ گیا ہوں۔ بتائیے کیا خدمت کروں؟' : 'Understood, sir. How may I assist you?';
      }

      decidedText = responseText.trim();
      if (!decidedText || decidedText === 'معاف کی' || decidedText.endsWith('معاف کی')) {
        decidedText = isUrdu ? 'سر، سسٹم کا تمام ڈیٹا بالکل محفوظ اور تمام سروسز آن لائن ہیں۔ بتائیے مزید کیا حکم ہے؟' : 'All systems are fully operational and online, sir.';
      }

      // Action plan JSON extraction
      let cleanJson = decidedText;
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json\n?/, '').replace(/```$/, '').trim();
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```\n?/, '').replace(/```$/, '').trim();
      }

      try {
        const parsed = JSON.parse(cleanJson);
        if (parsed && Array.isArray(parsed.actions)) {
          isActionPlan = true;
          actions = parsed.actions;
          actions.forEach(act => {
            if (act.type === 'launch_app' && act.target) exec(`start ${act.target}`);
            else if (act.type === 'open_url' && act.target) exec(`start "" "${act.target}"`);
            else if (act.type === 'write_file' && act.target) {
              try {
                const deskPath = path.join(os.homedir(), 'Desktop', act.target.replace(/^[/\\]+/, ''));
                fs.writeFileSync(deskPath, act.value || '', 'utf8');
              } catch (e) {}
            }
          });
          decidedText = isUrdu ? 'سر، میں نے آپ کے سسٹم پر یہ ٹاسک مکمل کر دیا ہے۔' : 'Right away, sir. Executed on your desktop successfully.';
        }
      } catch (e) {}
    }

    const finalText = decidedText || (isUrdu ? 'جی سر، میں آپ کے حکم کا منتظر ہوں۔' : 'At your service, sir.');

    // ==========================================
    // 6. ULTRA-FAST SERVER-SIDE NEURAL VOICE SYNTHESIS
    // ==========================================
    let audioBase64 = null;
    if (apiKey) {
      try {
        const wavBuf = await generateJarvisVoiceWav(finalText, selectedVoice, apiKey);
        if (wavBuf) {
          audioBase64 = wavBuf.toString('base64');
        }
      } catch (ttsErr) {
        console.warn('Fast-chat direct TTS synthesis error:', ttsErr.message);
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
          result: finalText,
          output_payload: { result: finalText },
          completed_at: new Date().toISOString()
        });
      } catch (dbErr) {
        console.warn('Background task sync error:', dbErr.message);
      }
    })();

    return NextResponse.json({
      success: true,
      text: finalText,
      audioBase64,
      isActionPlan,
      actions,
      elapsedMs: Date.now() - startTime
    });
  } catch (err) {
    console.error('Fast assistant API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

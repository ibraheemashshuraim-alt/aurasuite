import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decryptKey } from '@/lib/ai/crypto';
import { generateAI } from '@/lib/ai/providers';
import { generateJarvisVoiceWav } from '@/lib/ai/tts';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseKey);

function isUrduPrompt(text) {
  return /[\u0600-\u06FF]/.test(text) || /\b(assalam|salam|salaam|kya|kaise|kese|mujhe|aap|ap|karo|karna|kholo|chalao|batao|shukriya|meherbani|sir|janab)\b/i.test(text);
}

function safeDesktopAction(prompt) {
  const normalized = prompt.toLowerCase();
  const apps = [
    { matches: ['calculator', 'calc', 'کیلکولیٹر'], target: 'calc', urdu: 'کیلکولیٹر' },
    { matches: ['notepad', 'note pad', 'note-pad', 'نوٹ پیڈ', 'نوٹپیڈ'], target: 'notepad', urdu: 'نوٹ پیڈ' },
    { matches: ['paint', 'پینٹ'], target: 'paint', urdu: 'پینٹ' },
    { matches: ['file explorer', 'explorer', 'my computer', 'my pc', 'file manager', 'فائلز'], target: 'explorer', urdu: 'فائل ایکسپلورر' },
    { matches: ['chrome', 'کروم'], target: 'chrome', urdu: 'گوگل کروم' },
  ];

  for (const app of apps) {
    if (app.matches.some((match) => normalized.includes(match))) {
      return { actions: [{ type: 'launch_app', target: app.target }], label: app.urdu };
    }
  }

  const url = prompt.match(/https?:\/\/[^\s]+/i)?.[0];
  if (url && /(open|kholo|کھولو|کھول|browser|براؤزر)/i.test(prompt)) {
    return { actions: [{ type: 'open_url', target: url }], label: url };
  }

  return null;
}

async function getProviderConfig(orgId, requestedProvider = null) {
  const { data: configs, error } = await supabase
    .from('ai_provider_configs')
    .select('provider_name, encrypted_api_key, nonce, default_model, base_url, is_active, updated_at')
    .eq('organization_id', orgId);

  if (error) throw error;

  let chosen = null;
  if (requestedProvider) {
    chosen = configs?.find((c) => c.provider_name.toLowerCase() === requestedProvider.toLowerCase());
  }

  if (!chosen) {
    // Pick the most recently updated active provider, or fallback in preferred order
    const activeConfigs = (configs || []).filter((c) => c.is_active);
    activeConfigs.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
    chosen = activeConfigs[0];
  }

  if (!chosen) {
    const preferred = ['groq', 'gemini', 'openai', 'claude', 'ollama'];
    chosen = preferred.map((p) => configs?.find((item) => item.provider_name === p)).find(Boolean);
  }

  if (chosen) {
    if (chosen.provider_name === 'ollama') {
      return {
        provider: 'ollama',
        baseURL: chosen.base_url || 'http://localhost:11434',
        model: chosen.default_model || 'llama3.2',
      };
    }
    if (chosen.encrypted_api_key && chosen.nonce) {
      return {
        provider: chosen.provider_name,
        apiKey: decryptKey(chosen.encrypted_api_key, chosen.nonce),
        model: chosen.default_model || undefined,
      };
    }
  }

  // Final fallback to environment Gemini key
  if (process.env.GEMINI_API_KEY) {
    return {
      provider: 'gemini',
      apiKey: process.env.GEMINI_API_KEY,
      model: 'gemini-2.0-flash',
    };
  }

  return null;
}

async function getAgentId(orgId) {
  const { data } = await supabase
    .from('agents')
    .select('id')
    .eq('organization_id', orgId)
    .eq('status', 'ACTIVE')
    .limit(1)
    .maybeSingle();
  return data?.id || null;
}

async function queueJarvisTask({ organizationId, prompt, userId, actions }) {
  const agentId = await getAgentId(organizationId);
  const { data: task, error: taskError } = await supabase
    .from('engine_tasks')
    .insert({
      organization_id: organizationId,
      title: prompt.slice(0, 80),
      prompt,
      created_by: userId || null,
      assigned_agent_id: agentId,
      priority: 'MEDIUM',
      status: 'PENDING',
    })
    .select('id')
    .single();

  if (taskError) throw taskError;

  const { error: planError } = await supabase
    .from('engine_action_plans')
    .insert({
      task_id: task.id,
      organization_id: organizationId,
      agent_id: agentId,
      actions,
      status: 'PENDING',
    });
  if (planError) throw planError;

  await supabase.from('engine_action_plans').update({ status: 'EXECUTING' }).eq('task_id', task.id);
  const { error: dispatchError } = await supabase
    .from('engine_tasks')
    .update({ status: 'EXECUTING', started_at: new Date().toISOString() })
    .eq('id', task.id);
  if (dispatchError) throw dispatchError;

  return task.id;
}

async function persistConversation({ organizationId, prompt, userId, result }) {
  await supabase.from('engine_tasks').insert({
    organization_id: organizationId,
    title: prompt.slice(0, 80),
    prompt,
    created_by: userId || null,
    status: 'VERIFIED',
    result,
    output_payload: { result },
    completed_at: new Date().toISOString(),
  });
}

export async function POST(request) {
  const startedAt = Date.now();
  try {
    const { prompt, orgId, userId, userName, provider: requestedProvider, voice, gender, language = 'ur' } = await request.json();
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const organizationId = orgId || 'org-aurasuite-superadmin';
    const cleanPrompt = prompt.trim();
    const cleanLower = cleanPrompt.toLowerCase();
    const forceUrdu = language === 'ur' || isUrduPrompt(cleanPrompt);
    const reply = (urdu, english) => (forceUrdu ? urdu : english);
    const selectedVoice = voice || (gender === 'female' ? 'Aoede' : 'Charon');

    // ==========================================
    // 0. LIVE SOFTWARE HOUSE CONTEXT (ORGANIZATION & MEMBERS)
    // ==========================================
    let orgName = 'Software House';
    let profiles = [];
    let presence = [];
    try {
      const [orgRes, profRes, presRes] = await Promise.all([
        supabase.from('organizations').select('name').eq('id', organizationId).maybeSingle(),
        supabase.from('profiles').select('id, full_name, username, role, is_locked').eq('organization_id', organizationId),
        supabase.from('presence').select('user_id, last_seen').eq('organization_id', organizationId),
      ]);
      if (orgRes.data?.name) orgName = orgRes.data.name;
      if (profRes.data) profiles = profRes.data;
      if (presRes.data) presence = presRes.data;
    } catch (e) {
      console.warn('Live roster fetch warning:', e.message);
    }

    const now = Date.now();
    const onlineIds = new Set(
      (presence || [])
        .filter((item) => now - Number(item.last_seen) < 15 * 60 * 1000)
        .map((item) => item.user_id)
    );
    if (userId) onlineIds.add(userId);

    const totalUsers = profiles.length || 1;
    const onlineProfiles = profiles.filter((p) => onlineIds.has(p.id) || (userName && p.full_name?.toLowerCase().includes(userName.toLowerCase())));
    const offlineProfiles = profiles.filter((p) => !onlineProfiles.some((op) => op.id === p.id));

    const onlineCount = Math.max(1, onlineProfiles.length);
    const offlineCount = Math.max(0, totalUsers - onlineCount);

    const onlineNames = onlineProfiles.map((p) => p.full_name || p.username || 'User').join('، ');
    const offlineNames = offlineProfiles.map((p) => p.full_name || p.username || 'User').join('، ');

    let decidedText = null;

    // Instant greetings
    if (/\b(assalam|salam|salaam|hello|hi jarvis)\b|سلام|ہیلو/i.test(cleanPrompt)) {
      decidedText = reply('وعلیکم السلام سر! میں حاضر ہوں۔ فرمائیے کیا حکم ہے؟', 'Hello, sir. I am ready for your command.');
    } else if (/\b(shukriya|thank)\b|شکریہ/i.test(cleanPrompt)) {
      decidedText = reply('میرا فرض ہے سر۔ کوئی اور کام ہو تو بتائیے۔', 'Always at your service, sir.');
    }

    // Windows local desktop action
    let isActionPlan = false;
    let actions = [];
    let taskId = null;
    if (!decidedText) {
      const desktopTask = safeDesktopAction(cleanPrompt);
      if (desktopTask) {
        taskId = await queueJarvisTask({ organizationId, prompt: cleanPrompt, userId, actions: desktopTask.actions });
        decidedText = reply(
          `سر، ${desktopTask.label} کھولنے کا حکم دے دیا گیا ہے۔`,
          `Launching ${desktopTask.label} now, sir.`
        );
        isActionPlan = true;
        actions = desktopTask.actions;
      }
    }

    // Direct live roster queries
    if (!decidedText) {
      const isAskingNames = /نام|name|naam|کون کون|کون ہے|کون ہیں|لسٹ|list|تفصیل|چاروں|چار|باقی/i.test(cleanPrompt);
      const isAskingOnline = /online|آن لائن|ان لائن|آنلائن|کون آن لائن/i.test(cleanPrompt);
      const isAskingUsers = /user|users|لوگ|یوزر|کتنے|kitne|how many|total/i.test(cleanPrompt);

      if (isAskingNames && (/offline|آف لائن|اف لائن|چار|باقی|یوزر|لوگ/i.test(cleanPrompt) || offlineCount > 0)) {
        decidedText = reply(
          `سر، آپ کے سافٹ ویئر ہاؤس "${orgName}" میں اس وقت جو ${offlineCount} یوزرز آف لائن ہیں ان کے نام یہ ہیں: ${offlineNames}۔ اور آن لائن یوزر آپ خود (${onlineNames}) ہیں۔`,
          `Sir, the ${offlineCount} offline users in "${orgName}" are: ${offlineNames}. Currently online is: ${onlineNames}.`
        );
      } else if (isAskingOnline || (isAskingUsers && (cleanLower.includes('online') || cleanLower.includes('کتنے') || cleanLower.includes('دیکھ')))) {
        if (onlineCount === 1) {
          decidedText = reply(
            `سر، میں نے آپ کے سافٹ ویئر ہاؤس "${orgName}" کا لائیو جائزہ لیا ہے۔ سسٹم میں کل ${totalUsers} یوزرز رجسٹرڈ ہیں، اور اس وقت صرف آپ (${userName || onlineNames}) آن لائن ہیں جبکہ باقی ${offlineCount} یوزرز آف لائن ہیں۔`,
            `Sir, in "${orgName}" there are ${totalUsers} registered users. Currently only you (${onlineNames}) are online, and ${offlineCount} are offline.`
          );
        } else {
          decidedText = reply(
            `سر، میں نے آپ کے سافٹ ویئر ہاؤس "${orgName}" کا جائزہ لیا ہے۔ کل ${totalUsers} یوزرز ہیں جن میں سے ${onlineCount} یوزرز (${onlineNames}) آن لائن ہیں اور ${offlineCount} آف لائن ہیں۔`,
            `Sir, in "${orgName}" there are ${totalUsers} users. Currently ${onlineCount} are online (${onlineNames}) and ${offlineCount} are offline.`
          );
        }
      }
    }

    // AI Provider Call
    if (!decidedText) {
      const provider = await getProviderConfig(organizationId, requestedProvider);
      if (!provider) {
        decidedText = reply(
          'سر، Jarvis کے لیے کوئی AI Provider کنیکٹ نہیں ہے۔ Settings میں Gemini، Groq یا OpenAI کی API Key محفوظ کریں۔',
          'Jarvis does not have an active AI provider connected yet. Please configure an API key in Settings.'
        );
      } else {
        const rosterContext = `Current Software House: "${orgName}". Total Registered Members: ${totalUsers}. Online Members (${onlineCount}): ${onlineNames}. Offline Members (${offlineCount}): ${offlineNames}. Members List: ${profiles.map(p => `${p.full_name || p.username} (Role: ${p.role}, Status: ${p.is_locked ? 'Locked' : 'Active'})`).join('; ')}.`;

        const systemPrompt = [
          'You are Jarvis, the authentic, highly intelligent, iconic AI assistant from Iron Man.',
          `LIVE DATABASE STATE:\n${rosterContext}`,
          'CRITICAL DATABASE RULES:',
          `1. The software house "${orgName}" has strictly ${totalUsers} registered users. NEVER hallucinate 10 users or any fake numbers.`,
          `2. If asked about user names or offline users, use the exact real names above: ${offlineNames}.`,
          forceUrdu
            ? '3. Always reply directly in pure, elegant Urdu script (اردو رسم الخط). Keep answers concise (1-2 sentences maximum).'
            : '3. Reply concisely in the user\'s language (1-2 sentences maximum).',
        ].join('\n');

        try {
          const aiOptions = {
            apiKey: provider.apiKey,
            model: provider.model,
            systemPrompt,
            prompt: cleanPrompt,
            temperature: 0.2,
            maxTokens: 300,
          };
          if (provider.provider === 'ollama') {
            aiOptions.baseURL = provider.baseURL;
          }
          const result = await generateAI(provider.provider, aiOptions);
          decidedText = result.text?.trim();
        } catch (providerError) {
          console.warn('Jarvis provider request error:', providerError.message);
          decidedText = reply(
            'سر، AI provider اس وقت جواب نہیں دے رہا۔ Settings میں API connection چیک کریں۔',
            'The AI provider did not respond. Please check your connection in Settings.'
          );
        }
      }
    }

    const finalText = decidedText || reply('جی سر، میں حاضر ہوں۔ بتائیے کیا خدمت کر سکتا ہوں؟', 'At your service, sir.');

    // Server-side instant neural voice synthesis (zero-latency audio)
    let audioBase64 = null;
    try {
      const wavBuf = await generateJarvisVoiceWav(finalText, selectedVoice, null, organizationId);
      if (wavBuf) {
        audioBase64 = wavBuf.toString('base64');
      }
    } catch (ttsErr) {
      console.warn('Fast-chat direct TTS synthesis error:', ttsErr.message);
    }

    persistConversation({ organizationId, prompt: cleanPrompt, userId, result: finalText }).catch((err) => console.warn('Conversation save error:', err.message));

    return NextResponse.json({
      success: true,
      text: finalText,
      audioBase64,
      isActionPlan,
      actions,
      taskId,
      elapsedMs: Date.now() - startedAt,
    });
  } catch (error) {
    console.error('Fast assistant API error:', error);
    return NextResponse.json({ error: error.message || 'Jarvis error' }, { status: 500 });
  }
}

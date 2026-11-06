import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { exec } from 'child_process';
import { decryptKey } from '@/lib/ai/crypto';
import { generateAI } from '@/lib/ai/providers';
import { generateJarvisVoiceWav } from '@/lib/ai/tts';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseKey);

function detectPromptLanguage(text) {
  const t = text.toLowerCase().trim();
  // Explicit language request
  if (/عربی|عربي|العربية|بالعربي|arabic/i.test(t)) return 'ar';
  if (/urdu|اردو/i.test(t)) return 'ur';
  if (/english|انگریزی|انگلیش/i.test(t)) return 'en';

  // Arabic detection (Arabic characters without Urdu-specific characters)
  const hasUrduSpecific = /[\u0679\u067E\u0686\u0698\u06AF\u06BA\u06D2\u06C1\u06BE]/.test(text);
  const hasArabicWords = /\b(مرحبا|اهلا|أهلا|كيف|حالك|شكرا|سيدي|تكلم|اريد|افتح|ماذا|من|انت|نعم|لا|صباح|مساء)\b/i.test(t);
  if (hasArabicWords || (!hasUrduSpecific && /[\u0600-\u06FF]/.test(text) && /\b(في|على|الى|من|عن|مع|هذا|هذه|هل)\b/i.test(t))) {
    return 'ar';
  }

  // Urdu detection
  if (hasUrduSpecific || /\b(assalam|salam|salaam|kya|kaise|kese|mujhe|aap|ap|karo|karna|kholo|chalao|batao|shukriya|meherbani|sir|janab|نہیں|کھولو|کھولنا|کرو|بتائیں|کیسے)\b/i.test(t)) {
    return 'ur';
  }

  // English fallback
  if (/^[a-zA-Z0-9\s.,!?'"_\-]+$/.test(text)) {
    return 'en';
  }

  return 'auto';
}

function safeDesktopAction(prompt) {
  const normalized = prompt.toLowerCase().trim();

  // Close verbs detection (Urdu, Arabic, English)
  const isClose = /(بند\s*(کر|کریں|کردو|کردیں|کرو|ہو|دیں|دو)?|بند$|close|exit|quit|stop|kill|shut|أغلق|اغلق|اقفل|سكر|قفل)/i.test(prompt);

  const apps = [
    { 
      matches: ['calculator', 'calc', 'کیلکولیٹر', 'الحاسبة', 'آلة حاسبة', 'احسب', 'حاسبة'], 
      target: 'calc', 
      urdu: 'کیلکولیٹر',
      arabic: 'الحاسبة (Calculator)',
      english: 'Calculator'
    },
    { 
      matches: ['notepad', 'note pad', 'note-pad', 'نوٹ پیڈ', 'نوٹپیڈ', 'المفكرة', 'مفكرة', 'نوت باد', 'نوت‌باد'], 
      target: 'notepad', 
      urdu: 'نوٹ پیڈ',
      arabic: 'المفكرة (Notepad)',
      english: 'Notepad'
    },
    { 
      matches: ['paint', 'پینٹ', 'الرسام', 'رسام'], 
      target: 'paint', 
      urdu: 'پینٹ',
      arabic: 'الرسام (Paint)',
      english: 'Paint'
    },
    { 
      matches: ['file explorer', 'explorer', 'my computer', 'my pc', 'file manager', 'فائلز', 'مستكشف الملفات', 'الملفات'], 
      target: 'explorer', 
      urdu: 'فائل ایکسپلورر',
      arabic: 'مستكشف الملفات',
      english: 'File Explorer'
    },
    { 
      matches: ['chrome', 'کروم', 'جوجل كروم', 'المتصفح', 'browser'], 
      target: 'chrome', 
      urdu: 'گوگل کروم',
      arabic: 'متصفح جوجل كروم',
      english: 'Google Chrome'
    },
  ];

  const webApps = [
    {
      matches: ['youtube', 'یوٹیوب', 'يوتيوب', 'یو ٹیوب'],
      url: 'https://www.youtube.com',
      urdu: 'یوٹیوب',
      arabic: 'يوتيوب (YouTube)',
      english: 'YouTube'
    },
    {
      matches: ['google', 'گوگل', 'جوجل'],
      url: 'https://www.google.com',
      urdu: 'گوگل',
      arabic: 'جوجل (Google)',
      english: 'Google'
    },
    {
      matches: ['whatsapp', 'واٹس ایپ', 'واتساب', 'واتس اب', 'واٹسایپ'],
      url: 'https://web.whatsapp.com',
      urdu: 'واٹس ایپ',
      arabic: 'واتساب (WhatsApp)',
      english: 'WhatsApp Web'
    },
    {
      matches: ['facebook', 'فیس بک', 'فيسبوك', 'فیسبوک'],
      url: 'https://www.facebook.com',
      urdu: 'فیس بک',
      arabic: 'فيسبوك (Facebook)',
      english: 'Facebook'
    },
    {
      matches: ['gmail', 'جی میل', 'جيميل'],
      url: 'https://mail.google.com',
      urdu: 'جی میل',
      arabic: 'بريد جيميل (Gmail)',
      english: 'Gmail'
    },
    {
      matches: ['github', 'گٹ ہب', 'جيت هب', 'گٹہب'],
      url: 'https://github.com',
      urdu: 'گٹ ہب',
      arabic: 'جيت هب (GitHub)',
      english: 'GitHub'
    }
  ];

  // 1. Direct retry / feedback from user ("نہیں کھلا")
  if (/(نہیں کھلا|نہیں چلی|نہیں چلا|نہیں کھل رہا|کھلا نہیں|دوبارہ کھولو|دوبارہ چلاؤ|لم يفتح|افتح مرة اخرى|open again|not opened)/i.test(prompt)) {
    let targetApp = 'notepad';
    let appObj = apps[1];
    for (const app of apps) {
      if (app.matches.some((match) => normalized.includes(match))) {
        targetApp = app.target;
        appObj = app;
        return {
          actions: [{ type: 'launch_app', target: targetApp }],
          app: appObj,
          isClose: false,
          isRetry: true,
          isOpenUrl: false
        };
      }
    }
    for (const web of webApps) {
      if (web.matches.some((match) => normalized.includes(match))) {
        return {
          actions: [{ type: 'open_url', target: web.url }],
          app: web,
          isClose: false,
          isRetry: true,
          isOpenUrl: true
        };
      }
    }
    return {
      actions: [{ type: 'launch_app', target: targetApp }],
      app: appObj,
      isClose: false,
      isRetry: true,
      isOpenUrl: false
    };
  }

  // 2. Close command check (close app or close browser for web apps)
  if (isClose) {
    for (const app of apps) {
      if (app.matches.some((match) => normalized.includes(match))) {
        return {
          actions: [{ type: 'close_app', target: app.target }],
          app,
          isClose: true,
          isRetry: false,
          isOpenUrl: false
        };
      }
    }
    for (const web of webApps) {
      if (web.matches.some((match) => normalized.includes(match))) {
        return {
          actions: [{ type: 'close_app', target: 'chrome' }],
          app: web,
          isClose: true,
          isRetry: false,
          isOpenUrl: false
        };
      }
    }
  }

  // 3. Web search with query (e.g. "YouTube kholo aur usmein search karo Naat", "یوٹیوب پر نعت سرچ کرو", "google weather")
  if (!isClose && (/youtube|یوٹیوب|يوتيوب|google|گوگل|جوجل/i.test(prompt))) {
    let query = '';
    const urduMatch = prompt.match(/(?:پر|پہ|میں)\s+([a-zA-Z0-9\u0600-\u06FF\s]+?)\s+(?:سرچ|تلاش|چلاؤ|ڈھونڈو)/i);
    if (urduMatch && urduMatch[1]) {
      query = urduMatch[1].trim();
    }
    if (!query) {
      const romanMatch = prompt.match(/(?:search|سرچ|play|find)\s+(?:for|karo|karein|کرو|کریں|in|on)?\s*[:\-]?\s*([a-zA-Z0-9\u0600-\u06FF\s]+)/i);
      if (romanMatch && romanMatch[1] && !/^(karo|karein|کرو|کریں)$/i.test(romanMatch[1].trim())) {
        query = romanMatch[1].trim();
      }
    }
    if (query) {
      query = query.replace(/\b(karo|karein|کرو|کریں|chalao|چلاؤ|play|kholo|کھولو|dekhna|sunna|aur|usmein|اس|میں|پر|اور|ڈھونڈو)\b/gi, '').trim();
    }

    const isYt = /youtube|یوٹیوب|يوتيوب/i.test(prompt);
    if (isYt) {
      const searchUrl = query ? `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}` : 'https://www.youtube.com';
      const label = query ? `یوٹیوب پر "${query}"` : 'یوٹیوب';
      const labelEn = query ? `YouTube for "${query}"` : 'YouTube';
      const labelAr = query ? `يوتيوب عن "${query}"` : 'يوتيوب';
      return {
        actions: [{ type: 'open_url', target: searchUrl }],
        app: { urdu: label, english: labelEn, arabic: labelAr },
        isClose: false,
        isRetry: false,
        isOpenUrl: true
      };
    } else {
      const searchUrl = query ? `https://www.google.com/search?q=${encodeURIComponent(query)}` : 'https://www.google.com';
      const label = query ? `گوگل پر "${query}"` : 'گوگل';
      const labelEn = query ? `Google for "${query}"` : 'Google';
      const labelAr = query ? `جوجل عن "${query}"` : 'جوجل';
      return {
        actions: [{ type: 'open_url', target: searchUrl }],
        app: { urdu: label, english: labelEn, arabic: labelAr },
        isClose: false,
        isRetry: false,
        isOpenUrl: true
      };
    }
  }

  // 4. Web apps open check (general)
  for (const web of webApps) {
    if (web.matches.some((match) => normalized.includes(match))) {
      return {
        actions: [{ type: 'open_url', target: web.url }],
        app: web,
        isClose: false,
        isRetry: false,
        isOpenUrl: true
      };
    }
  }

  // 5. Desktop apps open check
  for (const app of apps) {
    if (app.matches.some((match) => normalized.includes(match))) {
      return {
        actions: [{ type: 'launch_app', target: app.target }],
        app,
        isClose: false,
        isRetry: false,
        isOpenUrl: false
      };
    }
  }

  // 6. Raw URL in prompt
  const url = prompt.match(/https?:\/\/[^\s]+/i)?.[0];
  if (url && /(open|kholo|کھولو|کھول|browser|براؤزر|افتح)/i.test(prompt)) {
    return { 
      actions: [{ type: 'open_url', target: url }], 
      app: { urdu: url, arabic: url, english: url }, 
      isClose: false,
      isRetry: false,
      isOpenUrl: true
    };
  }

  return null;
}

function executeDesktopActions(actions) {
  if (!Array.isArray(actions) || actions.length === 0) return;
  const appMap = {
    calc: 'cmd.exe /c start "" calc',
    calculator: 'cmd.exe /c start "" calc',
    notepad: 'powershell -Command "Stop-Process -Name notepad -Force -ErrorAction SilentlyContinue; Start-Process notepad"',
    paint: 'cmd.exe /c start "" mspaint',
    mspaint: 'cmd.exe /c start "" mspaint',
    chrome: 'cmd.exe /c start "" chrome',
    browser: 'cmd.exe /c start "" chrome',
    explorer: 'cmd.exe /c start "" explorer',
    files: 'cmd.exe /c start "" explorer',
    cmd: 'cmd.exe /c start "" cmd',
    powershell: 'cmd.exe /c start "" powershell'
  };

  for (const act of actions) {
    try {
      if (act.type === 'launch_app' || act.type === 'open_app') {
        const cmd = appMap[act.target?.toLowerCase()] || `cmd.exe /c start "" ${act.target}`;
        exec(cmd, (err) => {
          if (err) console.warn('Fast-chat direct execution error:', err.message);
        });
      } else if (act.type === 'close_app') {
        const target = (act.target || '').toLowerCase().trim();
        let killCmd = '';
        if (target === 'calc' || target === 'calculator') {
          killCmd = 'taskkill /F /IM CalculatorApp.exe /IM calc.exe 2>nul';
        } else if (target === 'notepad') {
          killCmd = 'taskkill /F /IM notepad.exe 2>nul';
        } else if (target === 'paint' || target === 'mspaint') {
          killCmd = 'taskkill /F /IM mspaint.exe 2>nul';
        } else if (target === 'chrome' || target === 'browser') {
          killCmd = 'taskkill /F /IM chrome.exe 2>nul';
        } else {
          killCmd = `taskkill /F /IM ${target}.exe 2>nul`;
        }
        exec(`cmd.exe /c ${killCmd}`, (err) => {
          if (err) console.warn('Fast-chat direct close error:', err.message);
        });
      } else if (act.type === 'open_url') {
        const url = act.target.startsWith('http') ? act.target : `https://${act.target}`;
        exec(`cmd.exe /c start "" "${url}"`, (err) => {
          if (err) console.warn('Fast-chat direct URL execution error:', err.message);
        });
      }
    } catch (e) {
      console.warn('Desktop action exec exception:', e);
    }
  }
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
    // Pick the active provider
    const activeConfigs = (configs || []).filter((c) => c.is_active);
    activeConfigs.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
    chosen = activeConfigs[0];
  }

  if (!chosen) {
    const preferred = ['gemini', 'groq', 'openai', 'claude', 'ollama'];
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
      let resolvedModel = chosen.default_model;
      if (chosen.provider_name === 'gemini') {
        if (!resolvedModel || resolvedModel.includes('2.0') || resolvedModel.includes('1.5') || resolvedModel.includes('gemini-pro')) {
          resolvedModel = 'gemini-2.5-flash';
        }
      }
      return {
        provider: chosen.provider_name,
        apiKey: decryptKey(chosen.encrypted_api_key, chosen.nonce),
        model: resolvedModel || undefined,
      };
    }
  }

  // Final fallback to environment Gemini key
  if (process.env.GEMINI_API_KEY) {
    return {
      provider: 'gemini',
      apiKey: process.env.GEMINI_API_KEY,
      model: 'gemini-2.5-flash',
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
    const { prompt, orgId, userId, userName, provider: requestedProvider, voice, gender } = await request.json();
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const organizationId = orgId || 'org-aurasuite-superadmin';
    const cleanPrompt = prompt.trim();
    const promptLang = detectPromptLanguage(cleanPrompt);
    const selectedVoice = voice || (gender === 'female' ? 'Aoede' : 'Charon');

    // ==========================================
    // 0. LIVE SOFTWARE HOUSE CONTEXT
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

    // Language switch requests (e.g. "عربی میں بات کرو", "speak Arabic", "talk in English") -> Pass directly to AI
    const isLanguageSwitchRequest = /(عربی میں|عربی بولو|تكلم بالعربية|تكلم عربي|باللغة العربية|speak in arabic|speak english|talk in)/i.test(cleanPrompt);

    // Instant greetings (only if not an explicit language request)
    if (!isLanguageSwitchRequest) {
      if (/مرحبا|أهلا|اهلا|صباح الخير|مساء الخير/i.test(cleanPrompt)) {
        decidedText = 'أهلاً وسهلاً بك يا سيدي! أنا جارفيس في خدمتك، كيف يمكنني مساعدتك؟';
      } else if (/\b(assalam|salam|salaam)\b|سلام|ہیلو/i.test(cleanPrompt)) {
        decidedText = 'وعلیکم السلام سر! میں حاضر ہوں۔ فرمائیے کیا حکم ہے؟';
      } else if (/^(hello|hi|hey jarvis|hello jarvis)$/i.test(cleanPrompt)) {
        decidedText = 'Hello sir! Jarvis at your service. How can I help you today?';
      } else if (/\b(shukriya|thank)\b|شکریہ|شكرا/i.test(cleanPrompt)) {
        if (promptLang === 'ar') decidedText = 'عفواً يا سيدي، هذا واجبي دائماً.';
        else if (promptLang === 'en') decidedText = 'Always a pleasure to serve you, sir.';
        else decidedText = 'میرا فرض ہے سر۔ کوئی اور کام ہو تو بتائیے۔';
      }
    }

    // Windows local desktop action
    let isActionPlan = false;
    let actions = [];
    let taskId = null;
    if (!decidedText && !isLanguageSwitchRequest) {
      const desktopTask = safeDesktopAction(cleanPrompt);
      if (desktopTask) {
        taskId = await queueJarvisTask({ organizationId, prompt: cleanPrompt, userId, actions: desktopTask.actions });
        // Execute on the local system
        executeDesktopActions(desktopTask.actions);

        if (desktopTask.isClose) {
          if (promptLang === 'ar') {
            decidedText = `تم إغلاق ${desktopTask.app.arabic} بنجاح يا سيدي.`;
          } else if (promptLang === 'en') {
            decidedText = `Sir, ${desktopTask.app.english} has been closed.`;
          } else {
            decidedText = `سر، ${desktopTask.app.urdu} بند کر دیا گیا ہے۔`;
          }
        } else if (desktopTask.isOpenUrl) {
          if (promptLang === 'ar') {
            decidedText = desktopTask.isRetry
              ? `معذرة يا سيدي! تم إعادة فتح ${desktopTask.app.arabic} في متصفحك فوراً.`
              : `تم فتح ${desktopTask.app.arabic} فوراً يا سيدي.`;
          } else if (promptLang === 'en') {
            decidedText = desktopTask.isRetry
              ? `My apologies sir! I have relaunched ${desktopTask.app.english} in your browser.`
              : `Opening ${desktopTask.app.english} in your browser now, sir.`;
          } else {
            decidedText = desktopTask.isRetry
              ? `معذرت سر! میں نے دوبارہ براؤزر میں ${desktopTask.app.urdu} کھول دی ہے۔`
              : `سر، ${desktopTask.app.urdu} کھول دی گئی ہے۔`;
          }
        } else {
          if (promptLang === 'ar') {
            decidedText = desktopTask.isRetry
              ? `معذرة يا سيدي! تم إعادة فتح ${desktopTask.app.arabic} على شاشتك فوراً.`
              : `تم فتح ${desktopTask.app.arabic} على شاشتك بنجاح يا سيدي.`;
          } else if (promptLang === 'en') {
            decidedText = desktopTask.isRetry
              ? `My apologies sir! I have immediately relaunched ${desktopTask.app.english} on your screen.`
              : `Launching ${desktopTask.app.english} on your screen now, sir.`;
          } else {
            decidedText = desktopTask.isRetry
              ? `معذرت سر! میں نے فوراً دوبارہ حکم جاری کر کے ${desktopTask.app.urdu} اسکرین پر کھول دیا ہے۔`
              : `سر، ${desktopTask.app.urdu} اسکرین پر کھول دیا گیا ہے۔`;
          }
        }

        isActionPlan = true;
        actions = desktopTask.actions;
      }
    }

    // Direct live roster queries
    if (!decidedText && !isLanguageSwitchRequest) {
      const isAskingNames = /نام|name|naam|کون کون|کون ہے|کون ہیں|لسٹ|list|تفصیل|أسماء|من هم|من متصل/i.test(cleanPrompt);
      const isAskingOnline = /online|آن لائن|ان لائن|متصل|من اونلاين/i.test(cleanPrompt);
      const isAskingUsers = /user|users|لوگ|یوزر|کتنے|kitne|كم عدد|مستخدمين/i.test(cleanPrompt);

      if (isAskingNames && (/offline|آف لائن|اف لائن|غائب|غیر متصل|باقی/i.test(cleanPrompt) || offlineCount > 0)) {
        if (promptLang === 'ar') {
          decidedText = `سيدي، في شركتكم البرمجية "${orgName}"، المستخدمون غير المتصلين حالياً (${offlineCount}) هم: ${offlineNames}. والمتصل حالياً أنت فقط (${onlineNames}).`;
        } else if (promptLang === 'en') {
          decidedText = `Sir, in "${orgName}", the ${offlineCount} offline users are: ${offlineNames}. Currently online: ${onlineNames}.`;
        } else {
          decidedText = `سر، آپ کے سافٹ ویئر ہاؤس "${orgName}" میں اس وقت جو ${offlineCount} یوزرز آف لائن ہیں ان کے نام یہ ہیں: ${offlineNames}۔ اور آن لائن یوزر آپ خود (${onlineNames}) ہیں۔`;
        }
      } else if (isAskingOnline || (isAskingUsers && (/online|آن لائن|متصل|کتنے|كم/i.test(cleanPrompt)))) {
        if (promptLang === 'ar') {
          decidedText = `سيدي، فحصت حالة النظام لشركة "${orgName}": إجمالي المسجلين ${totalUsers}، والمتصل حالياً هو (${onlineNames})، بينما (${offlineCount}) غير متصلين.`;
        } else if (promptLang === 'en') {
          decidedText = `Sir, in "${orgName}" there are ${totalUsers} users. Online: ${onlineCount} (${onlineNames}), offline: ${offlineCount}.`;
        } else {
          decidedText = `سر، میں نے آپ کے سافٹ ویئر ہاؤس "${orgName}" کا لائیو جائزہ لیا ہے۔ سسٹم میں کل ${totalUsers} یوزرز ہیں، جن میں سے ${onlineCount} آن لائن (${onlineNames}) اور ${offlineCount} آف لائن ہیں۔`;
        }
      }
    }

    // AI Provider Call
    if (!decidedText) {
      const provider = await getProviderConfig(organizationId, requestedProvider);
      if (!provider) {
        decidedText = promptLang === 'ar'
          ? 'سيدي، لا يوجد مزود ذكاء اصطناعي نشط. يرجى حفظ مفتاح API في الإعدادات.'
          : (promptLang === 'en'
            ? 'Sir, no active AI provider is connected. Please configure an API key in Settings.'
            : 'سر، Jarvis کے لیے کوئی AI Provider کنیکٹ نہیں ہے۔ Settings میں API Key محفوظ کریں۔');
      } else {
        const rosterContext = `Current Software House: "${orgName}". Total Registered Members: ${totalUsers}. Online Members (${onlineCount}): ${onlineNames}. Offline Members (${offlineCount}): ${offlineNames}. Members List: ${profiles.map(p => `${p.full_name || p.username} (Role: ${p.role}, Status: ${p.is_locked ? 'Locked' : 'Active'})`).join('; ')}.`;

        const systemPrompt = [
          'You are Jarvis, the authentic, highly intelligent, iconic, multi-lingual AI assistant from Iron Man.',
          `LIVE DATABASE CONTEXT:\n${rosterContext}`,
          'CRITICAL RULES:',
          `1. The software house "${orgName}" has strictly ${totalUsers} registered users. NEVER hallucinate 10 users or any fake numbers.`,
          `2. If asked about user names or offline users, use the exact real names: ${offlineNames}.`,
          '3. UNIVERSAL MULTI-LINGUAL SUPPORT (AUTO-LANGUAGE DETECTION):',
          '   - Automatically detect the exact language the user is speaking or requesting (e.g., Arabic, Urdu, English, Hindi, Pashto, French, Turkish, etc.).',
          '   - ALWAYS reply in that exact same language naturally, fluently, and elegantly.',
          '   - If the user speaks in Arabic or says "عربی میں بات کرو" or "تكلم بالعربية", IMMEDIATELY switch to fluent, polite, elegant Arabic (العربية الفصحى)! NEVER refuse or say you only speak Urdu or English.',
          '   - If the user speaks Urdu, reply in natural Urdu script.',
          '   - If the user speaks English, reply in English.',
          '4. OS INTEGRATION & COMMAND EXECUTION (CRITICAL):',
          '   - You are directly connected to the user\'s Windows system via the Jarvis OS engine.',
          '   - You CAN and DO open websites (YouTube, Google, WhatsApp, Facebook, etc.), launch desktop applications (Calculator, Notepad, Paint, Chrome, etc.), and close applications on command.',
          '   - NEVER give disclaimers like "I am an AI and cannot open websites/YouTube/apps" or "I do not have access to your system".',
          '   - If the user asks you to open or close any app or website, confirm with concise elegance that the action has been executed.',
          '5. Keep answers concise, sharp, helpful, and respectful (1-2 sentences maximum).'
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
          decidedText = promptLang === 'ar'
            ? 'نعم يا سيدي، أنا معك دائماً. كيف يمكنني خدمتك الآن؟'
            : (promptLang === 'en'
              ? 'Yes sir, I am here. How may I assist you further?'
              : 'جی سر، میں حاضر ہوں۔ بتائیے آگے کیا حکم ہے؟');
        }
      }
    }

    const finalText = decidedText || (promptLang === 'ar' ? 'أنا في خدمتك يا سيدي، تفضل.' : 'جی سر، میں حاضر ہوں۔ بتائیے کیا خدمت کر سکتا ہوں؟');

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

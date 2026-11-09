import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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
  if (hasUrduSpecific || /\b(assalam|salam|salaam|kya|kaise|kese|mujhe|aap|ap|karo|karna|kholo|chalao|batao|shukriya|meherbani|sir|janab|band|bandh|dobara|pehle|khuli|kholi|nahi|nahin|نہیں|کھولو|کھولنا|کرو|بتائیں|کیسے)\b/i.test(t)) {
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

  // Deterministic desktop file task: "Desktop par Pakistan naam ka folder
  // banao aur uske andar index file bana do". This must never fall through
  // to a conversational model, because it has a concrete local outcome.
  const wantsFolder = /\b(folder|directory)\b|فولڈر|ڈائریکٹری/i.test(prompt);
  const wantsCreate = /\b(create|make|banao|bana|banado|bana do)\b|بناؤ|بنادو|بنائیں|کریئیٹ/i.test(prompt);
  const wantsIndex = /\bindex(?:\s*(?:file|html))?\b|انڈیکس/i.test(prompt);
  if (wantsFolder && wantsCreate && wantsIndex) {
    const nameMatch = prompt.match(/(?:naam|name)\s*(?:rakho|rakhna|rakhein|رکھو|رکھنا)?\s+([a-zA-Z0-9_-]+)/i)
      || prompt.match(/(?:folder|directory)\s+(?:ka|named?|naam\s+ka)?\s*([a-zA-Z0-9_-]+)/i);
    const rawFolderName = nameMatch?.[1] || 'New-Project';
    const folderName = rawFolderName.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'New-Project';
    const target = `Desktop/${folderName}/index.html`;
    const html = `<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>${folderName}</title>\n</head>\n<body>\n  <h1>${folderName}</h1>\n</body>\n</html>\n`;

    return {
      actions: [
        { type: 'write_file', target, value: html },
        { type: 'launch_app', target: 'explorer', value: `Desktop/${folderName}` },
      ],
      app: { urdu: `${rawFolderName} فولڈر اور index.html`, arabic: `${rawFolderName} ومِلَف index.html`, english: `${rawFolderName} folder and index.html` },
      acknowledgement: `جی سر، Desktop پر ${rawFolderName} نام کا فولڈر اور اس کے اندر index.html بنا رہا ہوں۔ مکمل ہوتے ہی بتاتا ہوں۔`,
      completionMessage: `جی سر، ${rawFolderName} فولڈر اور اس کے اندر index.html بنا دیا ہے۔ آپ کو نظر آ رہا ہے؟ کوئی اور کام ہو تو بتا دیں۔`,
      isClose: false,
      isRetry: false,
      isOpenUrl: false,
    };
  }

  // Close verbs detection (Urdu, Roman Urdu, Arabic, English)
  const isClose = /(بند\s*(کر|کریں|کردو|کردیں|کرو|ہو|دیں|دو)?|بند$|\bbandh?\b|\bclose\b|\bexit\b|\bquit\b|\bstop\b|\bkill\b|\bshut\b|أغلق|اغلق|اقفل|سكر|قفل)/i.test(prompt);

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
    { 
      matches: ['control panel', 'control', 'کنٹرول پینل', 'کنٹرول پینل اوپن', 'کنٹرول پینل کھول', 'لوحة التحكم'], 
      target: 'control', 
      urdu: 'کنٹرول پینل',
      arabic: 'لوحة التحكم (Control Panel)',
      english: 'Control Panel'
    },
    { 
      matches: ['settings', 'سیٹنگز', 'سیٹنگ', 'الإعدادات'], 
      target: 'settings', 
      urdu: 'سیٹنگز',
      arabic: 'الإعدادات (Settings)',
      english: 'Settings'
    },
    { 
      matches: ['task manager', 'taskmgr', 'ٹاسک مینیجر', 'ٹاسک مینیجر کھول', 'مدير المهام'], 
      target: 'taskmgr', 
      urdu: 'ٹاسک مینیجر',
      arabic: 'مدير المهام (Task Manager)',
      english: 'Task Manager'
    },
    { 
      matches: ['camera', 'کیمرہ', 'کیمرا', 'كاميرا'], 
      target: 'camera', 
      urdu: 'کیمرہ',
      arabic: 'الكاميرا (Camera)',
      english: 'Camera'
    },
    { 
      matches: ['cmd', 'command prompt', 'terminal', 'ٹرمینل', 'کمانڈ پرامپٹ', 'موجه الأوامر'], 
      target: 'cmd', 
      urdu: 'کمانڈ پرامپٹ',
      arabic: 'موجه الأوامر (CMD)',
      english: 'Command Prompt'
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

  // 2. Close command check. Websites are closed as their own controlled tab,
  // never by opening them again or killing every browser window.
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
          actions: [{ type: 'close_url', target: web.url }],
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

function likelyDesktopInstruction(prompt) {
  return /(\b(open|close|create|make|write|save|delete|rename|move|copy|search|find|download|upload|folder|file|notepad|calculator|chrome|google|youtube|desktop|documents|khol|band|bana|likh|save|search)\b|کھولو|بند|بناؤ|بنادو|بنائیں|لکھو|لکھیں|محفوظ|فولڈر|فائل|ڈیسک ٹاپ|سرچ|تلاش)/i.test(prompt);
}

function parseTeamChatInstruction(prompt) {
  const wantsTeamChat = /\b(?:team|teen)\s*(?:chat|general)\b|ٹیم\s*(?:چیٹ|جنرل)/i.test(prompt);
  if (!wantsTeamChat) return null;

  // Keep the message after the *send* instruction intact.  It can itself be
  // a greeting (for example, "... Team Chat mein message send karein Assalam
  // Walaikum"), so it must never be handled by the conversational greeting
  // shortcut below.
  const sendMatch = prompt.match(/(?:message|msg|میسج|پیغام)\s*(?:send|bhej(?:o|en)?|karo|karain|karen|بھیجو|بھیجیں|کریں|کرو)\s*(?:karo|karain|karen|کریں|کرو)?\s*[:\-]?\s*(.+)$/i);
  const message = sendMatch?.[1]?.trim().replace(/^[:\-"']+|["']+$/g, '');
  if (!message || message.length > 1500) return null;

  return {
    actions: [{ type: 'send_team_message', target: 'team_general', value: message }],
    app: { urdu: 'ٹیم چیٹ میں پیغام', arabic: 'رسالة في دردشة الفريق', english: 'Team Chat message' },
    acknowledgement: `جی سر، Team General میں یہ پیغام بھیج رہا ہوں: ${message}`,
    completionMessage: `جی سر، Team General میں پیغام بھیج دیا ہے۔ آپ کو نظر آ رہا ہے؟ کوئی اور کام ہو تو بتا دیں۔`,
    isClose: false,
    isRetry: false,
    isOpenUrl: false,
    uiAction: 'open_team_chat',
  };
}

function extractPlanJson(text) {
  const trimmed = (text || '').trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start < 0 || end < start) return null;
  try {
    return JSON.parse(trimmed.slice(start, end + 1));
  } catch (e) {
    return null;
  }
}

function validatePlannerActions(actions) {
  if (!Array.isArray(actions) || actions.length < 1 || actions.length > 6) return null;
  const allowedTypes = new Set(['launch_app', 'close_app', 'open_url', 'close_url', 'write_file', 'open_file', 'read_file', 'send_team_message']);
  const allowedApps = new Set(['notepad', 'calc', 'paint', 'mspaint', 'explorer', 'chrome', 'control', 'settings', 'taskmgr', 'camera', 'cmd']);

  const cleanActions = [];
  for (const action of actions) {
    if (!action || !allowedTypes.has(action.type) || typeof action.target !== 'string') return null;
    const target = action.target.trim();
    if (!target || target.includes('..')) return null;

    if (action.type === 'send_team_message') {
      if (target !== 'team_general' || typeof action.value !== 'string' || !action.value.trim() || action.value.trim().length > 1500) return null;
      cleanActions.push({ type: action.type, target, value: action.value.trim() });
      continue;
    }

    if (action.type === 'launch_app' || action.type === 'close_app') {
      if (!allowedApps.has(target.toLowerCase())) return null;
      cleanActions.push({ type: action.type, target: target.toLowerCase(), ...(action.value ? { value: String(action.value).slice(0, 260) } : {}) });
      continue;
    }

    if (action.type === 'open_url' || action.type === 'close_url') {
      try {
        const url = new URL(target);
        if (!['http:', 'https:'].includes(url.protocol)) return null;
        cleanActions.push({ type: action.type, target: url.toString() });
      } catch (e) {
        return null;
      }
      continue;
    }

    // File operations stay within user-controlled Desktop or Documents folders.
    if (!/^(Desktop|Documents)[\\/]/i.test(target)) return null;
    if (action.type === 'write_file') {
      if (typeof action.value !== 'string' || action.value.length > 24000) return null;
      cleanActions.push({ type: action.type, target, value: action.value });
    } else {
      cleanActions.push({ type: action.type, target });
    }
  }
  return cleanActions;
}

async function planDesktopTaskWithAI({ prompt, provider, recentContext = [] }) {
  if (!provider || !likelyDesktopInstruction(prompt)) return null;

  const plannerPrompt = [
    'You are a careful Windows task planner for a personal assistant.',
    'Interpret Urdu, Roman Urdu, and English naturally. Decide whether the request is a concrete computer task.',
    'Return ONLY one JSON object, with no markdown and no commentary:',
    '{"is_task":true,"summary_ur":"short Urdu task summary","actions":[{"type":"write_file","target":"Desktop/Project/index.html","value":"..."}]}',
    'If it is not a computer task, return {"is_task":false}.',
    'Allowed action types only: launch_app, close_app, open_url, close_url, write_file, open_file, read_file.',
    'Allowed apps only: notepad, calc, paint, explorer, chrome, control, settings, taskmgr, camera, cmd.',
    'For files, only Desktop/... or Documents/... paths are allowed. Never use shell commands, registry edits, deletion, credentials, or external uploads.',
    'For a folder request, create a file inside the folder; the worker creates missing folders automatically.',
    'For a requested HTML index file, produce a complete small HTML document.',
    'Do not invent actions. If a name, location, or content is essential but missing, return is_task:false.'
  ].join('\n');
  const contextText = recentContext.length > 0
    ? `\n\nRecent conversation context:\n${recentContext.map((message) => `${message.sender}: ${message.text}`).join('\n')}`
    : '';

  try {
    const result = await generateAI(provider.provider, {
      apiKey: provider.apiKey,
      model: provider.model,
      systemPrompt: plannerPrompt,
      prompt: `${prompt}${contextText}`,
      temperature: 0.1,
      maxTokens: 900,
      ...(provider.provider === 'ollama' ? { baseURL: provider.baseURL } : {}),
    });
    const plan = extractPlanJson(result.text);
    if (!plan?.is_task) return null;
    const actions = validatePlannerActions(plan.actions);
    if (!actions) return null;
    const summary = typeof plan.summary_ur === 'string' && plan.summary_ur.trim()
      ? plan.summary_ur.trim().slice(0, 120)
      : 'درخواست کردہ کام';

    return {
      actions,
      app: { urdu: summary, arabic: summary, english: summary },
      acknowledgement: `جی سر، ${summary} کر رہا ہوں۔ مکمل ہوتے ہی بتاتا ہوں۔`,
      completionMessage: `جی سر، ${summary} مکمل کر دیا ہے۔ آپ کو نظر آ رہا ہے؟ کوئی اور کام ہو تو بتا دیں۔`,
      isClose: actions.every((action) => action.type === 'close_app' || action.type === 'close_url'),
      isRetry: false,
      isOpenUrl: actions.every((action) => action.type === 'open_url'),
    };
  } catch (err) {
    console.warn('Jarvis task planner failed:', err.message);
    return null;
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
        if (!resolvedModel || resolvedModel.includes('2.0') || resolvedModel.includes('1.5') || resolvedModel.includes('2.5') || resolvedModel.includes('gemini-pro')) {
          resolvedModel = 'gemini-3.5-flash';
        }
      }
      try {
        const decryptedKey = decryptKey(chosen.encrypted_api_key, chosen.nonce);
        return {
          provider: chosen.provider_name,
          apiKey: decryptedKey,
          model: resolvedModel || undefined,
        };
      } catch (decErr) {
        console.warn('Decryption failed for org config, falling back to superadmin:', decErr.message);
      }
    }
  }

  // Fallback to superadmin config if current org lacks decrypted key
  if (orgId !== 'org-aurasuite-superadmin') {
    const superadminConfig = await getProviderConfig('org-aurasuite-superadmin', requestedProvider);
    if (superadminConfig) return superadminConfig;
  }

  // Final fallback to environment Gemini key
  if (process.env.GEMINI_API_KEY) {
    return {
      provider: 'gemini',
      apiKey: process.env.GEMINI_API_KEY,
      model: 'gemini-3.5-flash',
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

async function queueJarvisTask({ organizationId, prompt, userId, actions, completionMessage = null }) {
  const agentId = await getAgentId(organizationId);
  const taskPrompt = completionMessage
    ? `${prompt}\n\nJARVIS_DONE::${completionMessage}`
    : prompt;
  const { data: task, error: taskError } = await supabase
    .from('engine_tasks')
    .insert({
      organization_id: organizationId,
      title: prompt.slice(0, 80),
      prompt: taskPrompt,
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
    const { prompt, orgId, userId, userName, provider: requestedProvider, voice, gender, recentMessages = [] } = await request.json();
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
    const teamChatTask = parseTeamChatInstruction(cleanPrompt);
    const hasActionIntent = Boolean(teamChatTask) || likelyDesktopInstruction(cleanPrompt);

    // Language switch requests (e.g. "عربی میں بات کرو", "speak Arabic", "talk in English") -> Pass directly to AI
    const isLanguageSwitchRequest = /(عربی میں|عربی بولو|تكلم بالعربية|تكلم عربي|باللغة العربية|speak in arabic|speak english|talk in)/i.test(cleanPrompt);

    // Instant greetings (only if not an explicit language request)
    if (!isLanguageSwitchRequest && !hasActionIntent) {
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
    let uiAction = null;
    if (!decidedText && !isLanguageSwitchRequest) {
      let desktopTask = teamChatTask || safeDesktopAction(cleanPrompt);
      if (!desktopTask) {
        const plannerProvider = await getProviderConfig(organizationId, requestedProvider);
        const recentContext = Array.isArray(recentMessages)
          ? recentMessages
              .filter((message) => message && typeof message.text === 'string')
              .slice(-6)
              .map((message) => ({
                sender: message.sender === 'assistant' ? 'Jarvis' : 'User',
                text: message.text.slice(0, 500),
              }))
          : [];
        desktopTask = await planDesktopTaskWithAI({ prompt: cleanPrompt, provider: plannerProvider, recentContext });
      }
      if (desktopTask) {
        const defaultCompletion = desktopTask.isClose
          ? `جی سر، ${desktopTask.app.urdu} بند کر دیا ہے۔ آپ کو نظر آ رہا ہے؟ کوئی اور کام ہو تو بتا دیں۔`
          : `جی سر، ${desktopTask.app.urdu} کا کام مکمل کر دیا ہے۔ آپ کو نظر آ رہا ہے؟ کوئی اور کام ہو تو بتا دیں۔`;
        const taskActions = desktopTask.actions.map((action) => action.type === 'send_team_message'
          ? { ...action, actorId: userId || null, actorName: userName || 'Admin' }
          : action);
        taskId = await queueJarvisTask({
          organizationId,
          prompt: cleanPrompt,
          userId,
          actions: taskActions,
          completionMessage: desktopTask.completionMessage || defaultCompletion,
        });
        if (desktopTask.acknowledgement) {
          decidedText = desktopTask.acknowledgement;
        }
        if (!decidedText && desktopTask.isClose) {
          if (promptLang === 'ar') {
            decidedText = `حاضر يا سيدي، أقوم بإغلاق ${desktopTask.app.arabic}.`;
          } else if (promptLang === 'en') {
            decidedText = `Certainly, sir. I am closing ${desktopTask.app.english}.`;
          } else {
            decidedText = `جی سر، ${desktopTask.app.urdu} بند کر رہا ہوں۔`;
          }
        } else if (!decidedText && desktopTask.isOpenUrl) {
          if (promptLang === 'ar') {
            decidedText = desktopTask.isRetry
              ? `حاضر يا سيدي، أعيد فتح ${desktopTask.app.arabic}.`
              : `حاضر يا سيدي، أفتح ${desktopTask.app.arabic}.`;
          } else if (promptLang === 'en') {
            decidedText = desktopTask.isRetry
              ? `Certainly, sir. I am reopening ${desktopTask.app.english}.`
              : `Certainly, sir. I am opening ${desktopTask.app.english}.`;
          } else {
            decidedText = desktopTask.isRetry
              ? `جی سر، ${desktopTask.app.urdu} دوبارہ کھول رہا ہوں۔`
              : `جی سر، ${desktopTask.app.urdu} کھول رہا ہوں۔`;
          }
        } else if (!decidedText) {
          if (promptLang === 'ar') {
            decidedText = desktopTask.isRetry
              ? `حاضر يا سيدي، أعيد فتح ${desktopTask.app.arabic}.`
              : `حاضر يا سيدي، أفتح ${desktopTask.app.arabic}.`;
          } else if (promptLang === 'en') {
            decidedText = desktopTask.isRetry
              ? `Certainly, sir. I am reopening ${desktopTask.app.english}.`
              : `Certainly, sir. I am opening ${desktopTask.app.english}.`;
          } else {
            decidedText = desktopTask.isRetry
              ? `جی سر، ${desktopTask.app.urdu} دوبارہ کھول رہا ہوں۔`
              : `جی سر، ${desktopTask.app.urdu} کھول رہا ہوں۔`;
          }
        }

        isActionPlan = true;
        actions = taskActions;
        uiAction = desktopTask.uiAction || null;
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
          Array.isArray(recentMessages) && recentMessages.length > 0
            ? `RECENT CONVERSATION:\n${recentMessages.slice(-6).map((message) => `${message.sender === 'assistant' ? 'Jarvis' : 'User'}: ${String(message.text || '').slice(0, 500)}`).join('\n')}`
            : '',
          'CRITICAL RULES:',
          `1. The software house "${orgName}" has strictly ${totalUsers} registered users. NEVER hallucinate 10 users or any fake numbers.`,
          `2. If asked about user names or offline users, use the exact real names: ${offlineNames}.`,
          '   - Never volunteer roster, user-count, presence, or database information unless the user explicitly asks about it.',
          '   - If the user requests a practical desktop task such as creating, editing, opening, closing, or organizing a file/folder, focus only on that task. Never answer with an unrelated roster summary.',
          '3. UNIVERSAL MULTI-LINGUAL SUPPORT (AUTO-LANGUAGE DETECTION):',
          '   - Automatically detect the exact language the user is speaking or requesting (e.g., Arabic, Urdu, English, Hindi, Pashto, French, Turkish, etc.).',
          '   - ALWAYS reply in that exact same language naturally, fluently, and elegantly.',
          '   - If the user speaks in Arabic or says "عربی میں بات کرو" or "تكلم بالعربية", IMMEDIATELY switch to fluent, polite, elegant Arabic (العربية الفصحى)! NEVER refuse or say you only speak Urdu or English.',
          '   - If the user speaks Urdu, reply in natural Urdu script.',
          '   - Treat Roman Urdu (for example: "youtube band karo", "notepad kholo") as Urdu and reply in Urdu script.',
          '   - If the user speaks English, reply in English.',
          '4. OS INTEGRATION & COMMAND EXECUTION (CRITICAL):',
          '   - You are directly connected to the user\'s Windows system via the Jarvis OS engine.',
          '   - You CAN and DO open websites (YouTube, Google, WhatsApp, Facebook, etc.), launch desktop applications (Calculator, Notepad, Paint, Chrome, etc.), and close applications on command.',
          '   - NEVER give disclaimers like "I am an AI and cannot open websites/YouTube/apps" or "I do not have access to your system".',
          '   - Never mention queues, a local worker, APIs, technical routing, or internal system components to the user.',
          '   - For an app or website command, answer naturally and briefly in the user\'s language, e.g. "جی سر، یوٹیوب بند کر رہا ہوں۔" Do not claim an action is already complete before its execution result arrives.',
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
      uiAction: typeof uiAction === 'string' ? uiAction : null,
      elapsedMs: Date.now() - startedAt,
    });
  } catch (error) {
    console.error('Fast assistant API error:', error);
    return NextResponse.json({ error: error.message || 'Jarvis error' }, { status: 500 });
  }
}

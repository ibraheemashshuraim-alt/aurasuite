import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decryptKey } from '@/lib/ai/crypto';
import { generateAI } from '@/lib/ai/providers';

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

async function getProviderConfig(orgId) {
  const { data: configs, error } = await supabase
    .from('ai_provider_configs')
    .select('provider_name, encrypted_api_key, nonce, default_model, updated_at')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('updated_at', { ascending: false });

  if (error) throw error;

  // Groq is deliberately preferred for conversational latency when configured.
  const preferred = ['groq', 'gemini', 'openai', 'claude'];
  const config = preferred.map((provider) => configs?.find((item) => item.provider_name === provider)).find(Boolean);
  if (!config?.encrypted_api_key || !config?.nonce) return null;

  return {
    provider: config.provider_name,
    apiKey: decryptKey(config.encrypted_api_key, config.nonce),
    model: config.default_model || undefined,
  };
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
    const { prompt, orgId, userId, language = 'ur' } = await request.json();
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const organizationId = orgId || 'org-aurasuite-superadmin';
    const cleanPrompt = prompt.trim();
    const forceUrdu = language === 'ur' || isUrduPrompt(cleanPrompt);
    const reply = (urdu, english) => (forceUrdu ? urdu : english);

    // These answers intentionally avoid database/provider calls so voice feedback starts immediately.
    if (/\b(assalam|salam|salaam|hello|hi jarvis)\b|سلام|ہیلو/i.test(cleanPrompt)) {
      const text = reply('وعلیکم السلام سر! میں حاضر ہوں۔ بتائیے کیا حکم ہے؟', 'Hello. I am ready for your command.');
      return NextResponse.json({ success: true, text, isActionPlan: false, actions: [], elapsedMs: Date.now() - startedAt });
    }
    if (/\b(shukriya|thank)\b|شکریہ/i.test(cleanPrompt)) {
      const text = reply('میرا فرض ہے سر۔ کوئی اور کام ہو تو بتائیے۔', 'Always at your service.');
      return NextResponse.json({ success: true, text, isActionPlan: false, actions: [], elapsedMs: Date.now() - startedAt });
    }

    const desktopTask = safeDesktopAction(cleanPrompt);
    if (desktopTask) {
      const taskId = await queueJarvisTask({ organizationId, prompt: cleanPrompt, userId, actions: desktopTask.actions });
      const text = reply(
        `سر، ${desktopTask.label} کھولنے کا کام آپ کے مقامی Jarvis کو بھیج دیا ہے۔`,
        `I sent the request to open ${desktopTask.label} to your local Jarvis daemon.`
      );
      return NextResponse.json({ success: true, text, isActionPlan: true, actions: desktopTask.actions, taskId, elapsedMs: Date.now() - startedAt });
    }

    const needsRoster = /online|offline|user|users|لوگ|یوزر|آن لائن|آف لائن|کتنے/i.test(cleanPrompt);
    let context = '';
    if (needsRoster) {
      const [{ data: organization }, { data: profiles }, { data: presence }] = await Promise.all([
        supabase.from('organizations').select('name').eq('id', organizationId).maybeSingle(),
        supabase.from('profiles').select('id, full_name, username, role, is_locked').eq('organization_id', organizationId),
        supabase.from('presence').select('user_id, last_seen').eq('organization_id', organizationId),
      ]);
      const now = Date.now();
      const onlineIds = new Set((presence || []).filter((item) => now - Number(item.last_seen) < 15 * 60 * 1000).map((item) => item.user_id));
      if (userId) onlineIds.add(userId);
      const memberList = (profiles || []).map((member) => `${member.full_name || member.username || 'User'} (${member.role || 'member'}, ${onlineIds.has(member.id) ? 'online' : 'offline'}, ${member.is_locked ? 'locked' : 'active'})`).join('; ');
      context = `Live organization: ${organization?.name || 'Software House'}. Members: ${memberList || 'No members found.'}`;
    }

    const provider = await getProviderConfig(organizationId);
    if (!provider) {
      const text = reply(
        'سر، Jarvis کے لیے کوئی API provider ابھی connect نہیں ہے۔ Settings میں Gemini، OpenAI یا Groq کی official API key save کریں۔',
        'Jarvis does not have an API provider connected yet. Add an official Gemini, OpenAI, or Groq API key in Settings.'
      );
      return NextResponse.json({ success: true, text, isActionPlan: false, actions: [], elapsedMs: Date.now() - startedAt });
    }

    const systemPrompt = [
      'You are Jarvis, a concise and reliable software-house assistant.',
      forceUrdu
        ? 'Reply only in clear Urdu script. Never switch to English unless the user explicitly asks you to use English.'
        : 'Reply in the language used by the user.',
      'Give a direct answer in no more than two sentences. Do not claim to have executed a desktop action unless the local Jarvis daemon has received an action plan.',
      context,
    ].filter(Boolean).join('\n');

    let text;
    try {
      const result = await generateAI(provider.provider, {
        apiKey: provider.apiKey,
        model: provider.model,
        systemPrompt,
        prompt: cleanPrompt,
        temperature: 0.2,
        maxTokens: 220,
      });
      text = result.text?.trim();
    } catch (providerError) {
      console.warn('Jarvis provider request failed:', providerError.message);
      text = reply('سر، AI provider اس وقت جواب نہیں دے رہا۔ Settings میں API connection دوبارہ test کر لیجیے۔', 'The AI provider is not responding. Please test its API connection in Settings.');
    }

    const finalText = text || reply('جی سر، میں حاضر ہوں۔ مزید ہدایت دیجیے۔', 'I am ready for your next instruction.');
    persistConversation({ organizationId, prompt: cleanPrompt, userId, result: finalText }).catch((error) => console.warn('Conversation history save failed:', error.message));

    return NextResponse.json({ success: true, text: finalText, isActionPlan: false, actions: [], elapsedMs: Date.now() - startedAt });
  } catch (error) {
    console.error('Fast assistant API error:', error);
    return NextResponse.json({ error: error.message || 'Jarvis could not process this request.' }, { status: 500 });
  }
}

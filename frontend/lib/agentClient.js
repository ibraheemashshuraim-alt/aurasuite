import { supabase } from './supabase';

/**
 * Dispatch a task to the AuraSuite Master Orchestrator (Next.js server-side engine)
 */
export async function dispatchAgentTask({ orgId, agentCodeName, title, inputPayload = {}, upstreamResults = {}, createdBy = null }) {
  try {
    const response = await fetch('/api/agents/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_id: orgId,
        agent_code_name: agentCodeName,
        title,
        input_payload: inputPayload,
        upstream_results: upstreamResults,
        created_by: createdBy,
      }),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('API /agents/dispatch error, falling back to direct Supabase record:', err.message);
  }

  // Fallback direct to Supabase
  const taskId = `atask-${Date.now()}`;
  const execId = `exec-${Date.now()}`;
  const characterMap = {
    researcher: 'Saima',
    creator: 'Dani',
    image_gen: 'Mianzi',
    video_gen: 'Zohaib',
    output_pkg: 'Aura',
  };
  const characterName = characterMap[agentCodeName] || 'Aura';

  await supabase.from('agent_tasks').insert({
    id: taskId,
    organization_id: orgId,
    title,
    input_payload: inputPayload,
    status: 'running',
    created_by: createdBy,
  });

  await supabase.from('agent_executions').insert({
    id: execId,
    task_id: taskId,
    organization_id: orgId,
    character_name: characterName,
    state: 'thinking',
    current_thought: `${characterName} is preparing context and instructions...`,
    execution_log: [{
      timestamp: new Date().toISOString(),
      state: 'thinking',
      thought: 'Task initialized',
      event: 'client_dispatch',
    }],
  });

  return {
    taskId,
    executionId: execId,
    characterName,
    status: 'running',
    message: `${characterName} is processing task via Supabase Realtime channel.`,
  };
}

/**
 * Save user/business brand guidelines and instructions
 */
export async function saveBusinessProfile(profile) {
  const res = await fetch('/api/business/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to save business profile');
  }
  return await res.json();
}

/**
 * Fetch business profile
 */
export async function getBusinessProfile(orgId) {
  const res = await fetch(`/api/business/profile?organization_id=${encodeURIComponent(orgId)}`);
  if (!res.ok) {
    return null;
  }
  return await res.json();
}

/**
 * Configure an encrypted BYOK API key (encrypted server-side)
 */
export async function saveBYOKKey({ orgId, providerName, apiKey, defaultModel, baseUrl }) {
  const res = await fetch('/api/providers/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      organization_id: orgId,
      provider_name: providerName,
      api_key: apiKey,
      default_model: defaultModel,
      base_url: baseUrl,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to save provider key');
  }

  return await res.json();
}

/**
 * Get active providers with safe hints only
 */
export async function getProviderConfigs(orgId) {
  const res = await fetch(`/api/providers/config?organization_id=${encodeURIComponent(orgId)}`);
  if (!res.ok) {
    return { providers: [] };
  }
  return await res.json();
}
// Phase 2A - Agents & Tasks Engine
export async function getEngineAgents(orgId) {
  const res = await fetch('/api/agents/management?organization_id=' + encodeURIComponent(orgId));
  if (!res.ok) return { agents: [] };
  return await res.json();
}

export async function createEngineAgent(data) {
  const res = await fetch('/api/agents/management', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function getEngineTasks(orgId) {
  const res = await fetch('/api/tasks?organization_id=' + encodeURIComponent(orgId));
  if (!res.ok) return { tasks: [] };
  return await res.json();
}

export async function createEngineTask(data) {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}
export async function executeEngineTaskClient(taskId) {
  const res = await fetch('/api/engine/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId }),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

import { createClient } from '@supabase/supabase-js';
import { generateAI } from '../providers/index.js';
import { resolveProviderCredentials } from '../orchestrator/orchestrator.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Executes a Phase 2A/2B engine_task using real AI, with Context & Memory
 */
export async function executeEngineTask(taskId) {
  const { data: task, error: tErr } = await supabase
    .from('engine_tasks')
    .select('*, agents(*)')
    .eq('id', taskId)
    .single();

  if (tErr || !task) throw new Error('Task not found: ' + (tErr?.message || ''));

  const agent = task.agents;
  if (!agent) {
    await markFailed(taskId, 'Task has no assigned agent.');
    throw new Error('No assigned agent');
  }

  await supabase.from('engine_tasks').update({ status: 'RUNNING', started_at: new Date().toISOString() }).eq('id', taskId);

  try {
    const { data: memories, error: memErr } = await supabase
      .from('agent_memories')
      .select('*')
      .eq('agent_id', agent.id)
      .eq('organization_id', task.organization_id)
      .order('created_at', { ascending: false })
      .limit(10);
      
    // Fix PowerShell template literal bug here using string concat
    const memoryStrings = (!memErr && memories) ? memories.map(m => '[Memory - ' + m.memory_type + ']: ' + m.content) : [];

    const systemPrompt = [
      'You are ' + agent.name + ' (' + agent.character_name + ').',
      'Role: ' + agent.role_description,
      agent.system_prompt,
      '',
      '--- GLOBAL INSTRUCTIONS ---',
      'AuraSuite is a professional platform. Keep responses helpful and aligned with the brand.',
      '',
      '--- YOUR MEMORY ---',
      memoryStrings.length > 0 ? memoryStrings.join('\n') : 'No relevant memory yet.'
    ].join('\n');

    const userPrompt = [
      'Task Title: ' + task.title,
      'Task Priority: ' + task.priority,
      '--- TASK PROMPT ---',
      task.prompt
    ].join('\n');

    const { providerName, apiKey, model } = await resolveProviderCredentials(task.organization_id, agent.default_provider, agent.default_model);

    const result = await generateAI(providerName, {
      apiKey,
      model,
      systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
      allowSynthetic: false
    });

    await supabase.from('engine_tasks').update({
      status: 'COMPLETED',
      result: result.text,
      completed_at: new Date().toISOString()
    }).eq('id', taskId);

    const memoryContent = 'Completed task "' + task.title + '". Result summary: ' + result.text.slice(0, 150) + '...';
    const { error: insertMemErr } = await supabase.from('agent_memories').insert({
      organization_id: task.organization_id,
      agent_id: agent.id,
      memory_type: 'general',
      content: memoryContent,
      source_task_id: taskId
    });
    if (insertMemErr) console.warn('Could not save memory (Migration 003 missing):', insertMemErr.message);

    return { success: true, result: result.text, taskId };
  } catch (error) {
    console.error('Task Execution Error:', error);
    await markFailed(taskId, error.message);
    return { success: false, error: error.message, taskId };
  }
}

async function markFailed(taskId, errorMessage) {
  await supabase.from('engine_tasks').update({
    status: 'FAILED',
    error: errorMessage,
    completed_at: new Date().toISOString()
  }).eq('id', taskId);
}

import { createClient } from '@supabase/supabase-js';
import { generateAI } from '../providers/index.js';
import { resolveProviderCredentials } from '../orchestrator/orchestrator.js';
import { logExecutionEvent } from './logger.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function executeEngineTask(taskId) {
  const { data: task, error: tErr } = await supabase.from('engine_tasks').select('*, agents(*)').eq('id', taskId).single();
  if (tErr || !task) throw new Error('Task not found: ' + (tErr?.message || ''));

  const agent = task.agents;
  if (!agent) {
    await markFailed(taskId, null, null, 'Missing assigned agent.');
    throw new Error('No assigned agent');
  }

  const { organization_id: orgId } = task;

  await logExecutionEvent({ taskId, agentId: agent.id, orgId, event: 'task_started', message: 'Task execution started.' });
  await supabase.from('engine_tasks').update({ status: 'RUNNING', started_at: new Date().toISOString() }).eq('id', taskId);

  let resultText = '';
  try {
    const { data: memories, error: memErr } = await supabase.from('agent_memories').select('*')
      .eq('agent_id', agent.id).eq('organization_id', orgId).order('created_at', { ascending: false }).limit(10);
      
    const memoryStrings = (!memErr && memories) ? memories.map(m => '[Memory - ' + m.memory_type + ']: ' + m.content) : [];

    const systemPrompt = [
      'You are ' + agent.name + ' (' + agent.character_name + ').',
      'Role: ' + agent.role_description,
      agent.system_prompt,
      '',
      '--- CAPABILITIES & COMPUTER CONTROL ---',
      'You have access to a real web browser to complete tasks. If a task requires visiting a website, reading a webpage, or clicking/typing, YOU MUST OUTPUT ONLY A RAW JSON OBJECT with an "actions" array. DO NOT output markdown or conversational text if you output JSON.',
      'Supported actions:',
      '- { "type": "open_url", "target": "https://..." }',
      '- { "type": "read_screen" }',
      '- { "type": "click", "target": "css_selector" }',
      '- { "type": "type", "target": "css_selector", "value": "text_to_type" }',
      '- { "type": "press_key", "value": "Enter" }',
      '- { "type": "wait", "value": "2000" }',
      '- { "type": "screenshot" }',
      '',
      'Example JSON output:',
      '{',
      '  "actions": [',
      '    { "type": "open_url", "target": "https://en.wikipedia.org/wiki/Main_Page" },',
      '    { "type": "type", "target": "#searchInput", "value": "Artificial Intelligence" },',
      '    { "type": "press_key", "value": "Enter" },',
      '    { "type": "wait", "value": "3000" },',
      '    { "type": "read_screen" }',
      '  ]',
      '}',
      'If the task does NOT require web browsing, simply output your normal conversational response.',
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

    await logExecutionEvent({ taskId, agentId: agent.id, orgId, event: 'ai_execution_started', message: 'Generating AI response...' });

    const { providerName, apiKey, model } = await resolveProviderCredentials(orgId, agent.default_provider, agent.default_model);

    const result = await generateAI(providerName, {
      apiKey,
      model,
      systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
      allowSynthetic: false
    });



    resultText = result.text;
    await logExecutionEvent({ taskId, agentId: agent.id, orgId, event: 'ai_execution_completed', message: 'AI response generated successfully.' });
    
    // --- PHASE 3A: Action Plan Detection & Execution ---
    let actionPlanResult = null;
    let isActionPlan = false;
    
    let cleanJsonText = resultText.trim();
    if (cleanJsonText.startsWith('```json')) {
       cleanJsonText = cleanJsonText.replace(/^```json\n?/, '');
       cleanJsonText = cleanJsonText.replace(/```$/, '');
       cleanJsonText = cleanJsonText.trim();
    } else if (cleanJsonText.startsWith('```')) {
       cleanJsonText = cleanJsonText.replace(/^```\n?/, '');
       cleanJsonText = cleanJsonText.replace(/```$/, '');
       cleanJsonText = cleanJsonText.trim();
    }

    try {
      const parsed = JSON.parse(cleanJsonText);
      if (parsed && Array.isArray(parsed.actions)) {
        isActionPlan = true;
        resultText = cleanJsonText;
      }
    } catch (e) {
      // Not JSON, continue as normal AI task
    }

    if (isActionPlan) {
      await supabase.from('engine_tasks').update({ status: 'ACTION_REQUIRED' }).eq('id', taskId);
      
      const { executeActionPlan } = await import('../actions/executor.js');
      actionPlanResult = await executeActionPlan(taskId, agent.id, orgId, resultText);
      
      if (actionPlanResult.status === 'APPROVAL_REQUIRED') {
         await supabase.from('engine_tasks').update({ status: 'ACTION_REQUIRED', error: actionPlanResult.error }).eq('id', taskId);
         return { success: false, error: 'User Approval Required', taskId };
      }
      
      if (actionPlanResult.status !== 'SUCCESS') {
         await logExecutionEvent({ taskId, agentId: agent.id, orgId, event: 'verification_failed', message: 'Action Plan Execution Failed' });
         await markFailed(taskId, agent.id, orgId, 'Action Execution Failed: ' + actionPlanResult.error);
         return { success: false, error: actionPlanResult.error, taskId };
      }
      
      // Override resultText to be a summary of the successful actions
      resultText = "Action Plan Completed Successfully:\n" + actionPlanResult.results.map(r => `- ${r.action.type}: ${r.result.result}`).join('\n');
    }
    // ----------------------------------------------------

    // Transition to VERIFYING
    await supabase.from('engine_tasks').update({ status: 'VERIFYING', result: resultText }).eq('id', taskId);


    await logExecutionEvent({ taskId, agentId: agent.id, orgId, event: 'verification_started', message: 'Starting task verification...' });

    // VERIFICATION LAYER
    const isVerified = verifyTaskOutput(resultText, task.prompt);
    
    if (!isVerified) {
      await logExecutionEvent({ taskId, agentId: agent.id, orgId, event: 'verification_failed', message: 'Output failed brand/quality verification rules.' });
      await markFailed(taskId, agent.id, orgId, 'Verification Failed: The generated output did not meet the required structural or content rules.');
      return { success: false, error: 'Verification Failed', taskId };
    }

    await logExecutionEvent({ taskId, agentId: agent.id, orgId, event: 'verification_completed', message: 'Task verified successfully.' });
    
    // Complete Task
    await supabase.from('engine_tasks').update({
      status: 'VERIFIED',
      completed_at: new Date().toISOString()
    }).eq('id', taskId);
    await logExecutionEvent({ taskId, agentId: agent.id, orgId, event: 'task_completed', message: 'Task finished successfully.' });

    // Store Memory ONLY on VERIFIED success
    const memoryContent = 'Completed task "' + task.title + '". Result summary: ' + resultText.slice(0, 150) + '...';
    await supabase.from('agent_memories').insert({
      organization_id: orgId,
      agent_id: agent.id,
      memory_type: 'general',
      content: memoryContent,
      source_task_id: taskId
    });

    return { success: true, result: resultText, taskId };
  } catch (error) {
    console.error('Task Execution Error:', error);
    await logExecutionEvent({ taskId, agentId: agent.id, orgId, event: 'ai_execution_failed', message: 'Execution error: ' + error.message });
    await markFailed(taskId, agent.id, orgId, error.message);
    return { success: false, error: error.message, taskId };
  }
}

// Basic modular verification foundation
function verifyTaskOutput(resultText, prompt) {
  if (!resultText || resultText.trim().length < 5) return false;
  // A simple heuristic: ensure it's not returning error stubs masquerading as success.
  if (resultText.toLowerCase().includes('i am an ai language model and cannot')) return false;
  return true;
}

async function markFailed(taskId, agentId, orgId, errorMessage) {
  await supabase.from('engine_tasks').update({
    status: 'FAILED',
    error: errorMessage,
    completed_at: new Date().toISOString()
  }).eq('id', taskId);
  
  if (agentId && orgId) {
     await logExecutionEvent({ taskId, agentId, orgId, event: 'task_completed', message: 'Task finished with failure state.' });
  }
}

import sys
import re

with open('frontend/lib/ai/engine/executor.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace completion logic to handle chaining
old_completion_logic = """    // Complete Task
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

    return { success: true, result: resultText, taskId };"""

new_completion_logic = """    // Complete Task
    await supabase.from('engine_tasks').update({
      status: 'VERIFIED',
      completed_at: new Date().toISOString(),
      output_payload: { result: resultText }
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

    // --- PHASE 4: MULTI-AGENT CHAINING ---
    if (task.next_task_id) {
       await logExecutionEvent({ taskId, agentId: agent.id, orgId, event: 'trigger_next', message: 'Triggering downstream task: ' + task.next_task_id });
       
       // Update next task with upstream result and set to PENDING
       const { data: nextTask } = await supabase.from('engine_tasks').select('prompt').eq('id', task.next_task_id).single();
       if (nextTask) {
          const newPrompt = nextTask.prompt + '\\n\\n--- UPSTREAM RESULT FROM ' + agent.name + ' ---\\n' + resultText;
          await supabase.from('engine_tasks').update({
             status: 'PENDING',
             prompt: newPrompt
          }).eq('id', task.next_task_id);
          
          // Optionally trigger it asynchronously (fire and forget)
          // For now, setting it to PENDING will let the frontend Client loop pick it up and execute it,
          // creating a visually pleasing cascading effect!
       }
    }

    return { success: true, result: resultText, taskId };"""

if old_completion_logic in content:
    content = content.replace(old_completion_logic, new_completion_logic)
else:
    print("WARNING: Could not find old completion logic to patch.")

with open('frontend/lib/ai/engine/executor.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Executor updated with Phase 4 Chaining logic!")

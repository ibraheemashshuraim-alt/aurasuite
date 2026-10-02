import sys

block = """
    resultText = result.text;
    await logExecutionEvent({ taskId, agentId: agent.id, orgId, event: 'ai_execution_completed', message: 'AI response generated successfully.' });
    
    // --- PHASE 3A: Action Plan Detection & Execution ---
    let actionPlanResult = null;
    let isActionPlan = false;
    try {
      const parsed = JSON.parse(resultText);
      if (parsed && Array.isArray(parsed.actions)) {
        isActionPlan = true;
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
      resultText = "Action Plan Completed Successfully:\\n" + actionPlanResult.results.map(r => `- ${r.action.type}: ${r.result.result}`).join('\\n');
    }
    // ----------------------------------------------------

    // Transition to VERIFYING
    await supabase.from('engine_tasks').update({ status: 'VERIFYING', result: resultText }).eq('id', taskId);
"""

with open('frontend/lib/ai/engine/executor.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

start = -1
end = -1
for i, line in enumerate(lines):
    if "resultText = result.text;" in line:
        start = i
    if start != -1 and "await supabase.from('engine_tasks').update({ status: 'VERIFYING'" in line:
        end = i
        break

if start != -1 and end != -1:
    new_lines = lines[:start] + [block + "\n"] + lines[end+1:]
    with open('frontend/lib/ai/engine/executor.js', 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print("Replaced properly!")
else:
    print("Not found!")

import sys

content = """/**
 * Phase 3A/3B: Action Execution Layer
 */
import { createClient } from '@supabase/supabase-js';
import { validateActionPlan } from './validator.js';
import { ActionConnectorRegistry } from './connector_registry.js';
import { logExecutionEvent } from '../engine/logger.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function executeActionPlan(taskId, agentId, orgId, rawPlanText, bypassApproval = false) {
  let connector = null;
  try {
    await logExecutionEvent({ taskId, agentId, orgId, event: 'action_plan_created', message: 'Action plan identified and sent to executor.' });
    
    await logExecutionEvent({ taskId, agentId, orgId, event: 'action_validation_started', message: 'Validating action plan...' });
    
    // We assume SAFE_ACTIONS permission.
    const validation = validateActionPlan(rawPlanText, 'SAFE_ACTIONS');

    if (!validation.valid) {
      if (validation.status === 'APPROVAL_REQUIRED' && !bypassApproval) {
        await logExecutionEvent({ taskId, agentId, orgId, event: 'approval_requested', message: `Action validation requires approval: ${validation.reason}` });
        return { status: 'APPROVAL_REQUIRED', error: validation.reason, plan: validation.plan };
      }
      if (!bypassApproval) {
        await logExecutionEvent({ taskId, agentId, orgId, event: 'action_validation_failed', message: `Action validation result: ${validation.reason}` });
        return { status: validation.status, error: validation.reason };
      }
    }

    const plan = validation.plan;
    
    // Check if the plan is already saved
    const { data: existingPlan } = await supabase.from('engine_action_plans')
      .select('id').eq('task_id', taskId).single();

    let planRecordId = existingPlan?.id;

    if (!existingPlan) {
      const { data: newPlan, error: pErr } = await supabase.from('engine_action_plans').insert({
        task_id: taskId,
        organization_id: orgId,
        agent_id: agentId,
        actions: plan.actions,
        status: 'EXECUTING'
      }).select().single();
      if (!pErr && newPlan) planRecordId = newPlan.id;
    } else {
      await supabase.from('engine_action_plans').update({ status: 'EXECUTING' }).eq('id', planRecordId);
    }

    await logExecutionEvent({ taskId, agentId, orgId, event: 'browser_session_created', message: 'Initializing browser session...' });

    // In a real environment we can choose MOCK or BROWSER based on env or org config
    const connectorType = process.env.USE_MOCK_CONNECTOR === 'true' ? 'MOCK' : 'BROWSER';
    connector = ActionConnectorRegistry.getConnector(connectorType);

    if (connector.connect) await connector.connect();

    await logExecutionEvent({ taskId, agentId, orgId, event: 'action_execution_started', message: `Executing ${plan.actions.length} actions via ${connector.name}.` });

    const results = [];

    for (let i = 0; i < plan.actions.length; i++) {
      const action = plan.actions[i];
      try {
        await logExecutionEvent({ taskId, agentId, orgId, event: 'action_started', message: `Executing action: ${action.type}` });
        const result = await connector.executeAction(action);
        results.push({ action, result });

        if (result.status === 'FAILED' || result.status === 'UNSUPPORTED') {
          await logExecutionEvent({ taskId, agentId, orgId, event: 'action_failed', message: `Action [${action.type}] failed: ${result.result}` });
          if (planRecordId) await supabase.from('engine_action_plans').update({ status: 'FAILED' }).eq('id', planRecordId);
          if (connector.disconnect) await connector.disconnect();
          await logExecutionEvent({ taskId, agentId, orgId, event: 'browser_session_closed', message: 'Session closed on failure.' });
          return { status: 'FAILED', error: `Action ${i+1} failed: ${result.result}`, results };
        } else {
           await logExecutionEvent({ taskId, agentId, orgId, event: 'action_completed', message: `Action [${action.type}] completed: ${result.result}` });
        }
      } catch (err) {
        await logExecutionEvent({ taskId, agentId, orgId, event: 'action_failed', message: `Action [${action.type}] threw error: ${err.message}` });
        if (planRecordId) await supabase.from('engine_action_plans').update({ status: 'FAILED' }).eq('id', planRecordId);
        if (connector.disconnect) await connector.disconnect();
        await logExecutionEvent({ taskId, agentId, orgId, event: 'browser_session_closed', message: 'Session closed on exception.' });
        return { status: 'FAILED', error: `Action ${i+1} exception: ${err.message}`, results };
      }
    }

    await logExecutionEvent({ taskId, agentId, orgId, event: 'action_execution_completed', message: 'All actions completed successfully.' });
    if (planRecordId) await supabase.from('engine_action_plans').update({ status: 'COMPLETED' }).eq('id', planRecordId);
    
    if (connector.disconnect) await connector.disconnect();
    await logExecutionEvent({ taskId, agentId, orgId, event: 'browser_session_closed', message: 'Browser session closed gracefully.' });

    return { status: 'SUCCESS', results };
  } catch (globalErr) {
    if (connector && connector.disconnect) await connector.disconnect().catch(()=>null);
    await logExecutionEvent({ taskId, agentId, orgId, event: 'action_failed', message: `Executor error: ${globalErr.message}` });
    return { status: 'FAILED', error: globalErr.message };
  }
}
"""

with open('frontend/lib/ai/actions/executor.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated executor with session and registry!")

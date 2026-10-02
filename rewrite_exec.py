import sys

content = """/**
 * Phase 3A: Action Execution Layer
 */
import { createClient } from '@supabase/supabase-js';
import { validateActionPlan } from './validator.js';
import { MockActionConnector } from './mock_connector.js';
import { logExecutionEvent } from '../engine/logger.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function executeActionPlan(taskId, agentId, orgId, rawPlanText) {
  try {
    await logExecutionEvent({ taskId, agentId, orgId, event: 'action_plan_created', message: 'Action plan identified and sent to executor.' });
    
    await logExecutionEvent({ taskId, agentId, orgId, event: 'action_validation_started', message: 'Validating action plan...' });
    const validation = validateActionPlan(rawPlanText, 'SAFE_ACTIONS');

    if (!validation.valid) {
      const statusEvent = validation.status === 'APPROVAL_REQUIRED' ? 'approval_required' : 'action_validation_failed';
      await logExecutionEvent({ taskId, agentId, orgId, event: statusEvent, message: `Action validation result: ${validation.reason}` });
      return { status: validation.status, error: validation.reason };
    }

    const plan = validation.plan;
    
    // Save the plan to DB
    const { data: planRecord, error: pErr } = await supabase.from('engine_action_plans').insert({
      task_id: taskId,
      organization_id: orgId,
      agent_id: agentId,
      actions: plan.actions,
      status: 'EXECUTING'
    }).select().single();

    if (pErr) console.warn('Could not save to engine_action_plans (Migration 005 missing?):', pErr.message);

    await logExecutionEvent({ taskId, agentId, orgId, event: 'action_execution_started', message: `Executing ${plan.actions.length} actions via Action Connector.` });

    const connector = new MockActionConnector();
    const results = [];

    for (let i = 0; i < plan.actions.length; i++) {
      const action = plan.actions[i];
      try {
        const result = await connector.executeAction(action);
        results.push({ action, result });

        if (result.status === 'FAILED' || result.status === 'UNSUPPORTED') {
          await logExecutionEvent({ taskId, agentId, orgId, event: 'action_execution_failed', message: `Action [${action.type}] failed: ${result.result}` });
          if (planRecord) await supabase.from('engine_action_plans').update({ status: 'FAILED' }).eq('id', planRecord.id);
          return { status: 'FAILED', error: `Action ${i+1} failed: ${result.result}`, results };
        }
      } catch (err) {
        await logExecutionEvent({ taskId, agentId, orgId, event: 'action_execution_failed', message: `Action [${action.type}] threw error: ${err.message}` });
        if (planRecord) await supabase.from('engine_action_plans').update({ status: 'FAILED' }).eq('id', planRecord.id);
        return { status: 'FAILED', error: `Action ${i+1} exception: ${err.message}`, results };
      }
    }

    await logExecutionEvent({ taskId, agentId, orgId, event: 'action_execution_completed', message: 'All actions completed successfully.' });
    if (planRecord) await supabase.from('engine_action_plans').update({ status: 'COMPLETED' }).eq('id', planRecord.id);

    return { status: 'SUCCESS', results };
  } catch (globalErr) {
    await logExecutionEvent({ taskId, agentId, orgId, event: 'action_execution_failed', message: `Executor error: ${globalErr.message}` });
    return { status: 'FAILED', error: globalErr.message };
  }
}
"""

with open('frontend/lib/ai/actions/executor.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Rewrote executor!")

import { supabase } from '../../supabase';

/**
 * StateMachine transitions agent states in Supabase PostgreSQL
 */
export async function transitionAgentState({ executionId, newState, thought = '', event = 'state_transition' }) {
  const entry = {
    timestamp: new Date().toISOString(),
    state: newState,
    thought,
    event,
  };

  try {
    // 1. Fetch current log
    const { data: current } = await supabase
      .from('agent_executions')
      .select('execution_log')
      .eq('id', executionId)
      .maybeSingle();

    const currentLog = Array.isArray(current?.execution_log) ? current.execution_log : [];
    const updatedLog = [...currentLog, entry];

    const updatePayload = {
      state: newState,
      current_thought: thought,
      execution_log: updatedLog,
    };

    if (newState === 'completed' || newState === 'failed') {
      updatePayload.finished_at = new Date().toISOString();
    }

    await supabase
      .from('agent_executions')
      .update(updatePayload)
      .eq('id', executionId);
  } catch (err) {
    console.error('Failed to transition agent state:', err.message);
  }
}

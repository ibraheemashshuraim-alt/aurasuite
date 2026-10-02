import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function logExecutionEvent({ taskId, agentId, orgId, event, message, metadata = {} }) {
  try {
    const { error } = await supabase.from('engine_execution_logs').insert({
      task_id: taskId,
      agent_id: agentId,
      organization_id: orgId,
      event,
      message,
      metadata
    });
    if (error) {
      console.warn('Failed to insert execution log (migration 004 missing?):', error.message);
    }
  } catch (err) {
    console.warn('Execution logger exception:', err.message);
  }
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy_url_for_build.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key_for_build';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req) {
  try {
    const { taskId, planText, orgId, agentId, decision } = await req.json();
    
    if (!taskId || !orgId || !agentId) {
       return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400 });
    }

    if (decision === 'REJECT') {
       await supabase.from('engine_tasks').update({ status: 'FAILED', error: 'User rejected the action plan.' }).eq('id', taskId);
       await supabase.from('engine_execution_logs').insert({
         task_id: taskId, agent_id: agentId, organization_id: orgId, event: 'approval_rejected', message: 'User rejected the action plan.'
       });
       return new Response(JSON.stringify({ success: true, message: 'Rejected' }), { status: 200 });
    }

    // If APPROVE
    await supabase.from('engine_execution_logs').insert({
      task_id: taskId, agent_id: agentId, organization_id: orgId, event: 'approval_granted', message: 'User approved the action plan.'
    });

    // We do NOT need to await this to block the response, but doing so prevents edge cases.
    // Actually let's await it so we know it definitely updated!
    await supabase.from('engine_tasks').update({ status: 'EXECUTING' }).eq('id', taskId);
    await supabase.from('engine_action_plans').update({ status: 'EXECUTING' }).eq('task_id', taskId);
    
    await supabase.from('engine_execution_logs').insert({
      task_id: taskId, agent_id: agentId, organization_id: orgId, event: 'jarvis_dispatched', message: 'Task dispatched to local Jarvis daemon for execution.'
    });

    return new Response(JSON.stringify({ success: true, message: 'Execution started' }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

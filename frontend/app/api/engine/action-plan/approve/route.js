import { createClient } from '@supabase/supabase-js';
import { executeActionPlan } from '../../../../../lib/ai/actions/executor.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy_url_for_build.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key_for_build';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Missing auth' }), { status: 401 });
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { taskId, planText, orgId, agentId, decision } = await req.json();
    
    if (!taskId || !orgId || !agentId) {
       return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400 });
    }

    // Verify user belongs to orgId
    const { data: userOrg } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
    if (!userOrg || userOrg.organization_id !== orgId) {
       return new Response(JSON.stringify({ error: 'Unauthorized for this organization' }), { status: 403 });
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

    (async () => {
       // Offload execution to Jarvis
       await supabase.from('engine_tasks').update({ status: 'EXECUTING' }).eq('id', taskId);
       await supabase.from('engine_action_plans').update({ status: 'EXECUTING' }).eq('task_id', taskId);
       
       await supabase.from('engine_execution_logs').insert({
         task_id: taskId, agent_id: agentId, organization_id: orgId, event: 'jarvis_dispatched', message: 'Task dispatched to local Jarvis daemon for execution.'
       });
       
       // Note: Jarvis daemon will update the task to VERIFYING and then COMPLETED
    })().catch(err => console.error("Async approval exec error:", err));

    return new Response(JSON.stringify({ success: true, message: 'Execution started' }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

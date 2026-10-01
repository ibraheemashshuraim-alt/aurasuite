import { NextResponse } from 'next/server';
import { executeOrchestratedTask } from '@/lib/ai/orchestrator/orchestrator';

export async function POST(request) {
  try {
    const body = await request.json();
    const { organization_id, agent_code_name, title, input_payload, upstream_results, created_by } = body;

    if (!organization_id || !title) {
      return NextResponse.json({ error: 'organization_id and title are required' }, { status: 400 });
    }

    const result = await executeOrchestratedTask({
      organizationId: organization_id,
      agentCodeName: agent_code_name || 'researcher',
      title,
      inputPayload: input_payload || {},
      upstreamResults: upstream_results || {},
      createdBy: created_by,
    });

    return NextResponse.json({
      success: true,
      ...result,
    }, { status: 200 });
  } catch (err) {
    console.error('API /agents/dispatch error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

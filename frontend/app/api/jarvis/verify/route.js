import { NextResponse } from 'next/server';
import { executeAndVerifyComputerTask } from '@/lib/ai/jarvis/verification';

export async function POST(request) {
  try {
    const body = await request.json();
    const { execution_id, organization_id, command } = body;

    if (!command?.action || !command?.expectedResultCriteria) {
      return NextResponse.json({
        error: 'command.action and command.expectedResultCriteria are required',
      }, { status: 400 });
    }

    const outcome = await executeAndVerifyComputerTask({
      executionId: execution_id || `exec-${Date.now()}`,
      organizationId: organization_id || 'org-aurasuite-superadmin',
      command,
    });

    return NextResponse.json({
      success: outcome.verification_status === 'verified',
      outcome,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

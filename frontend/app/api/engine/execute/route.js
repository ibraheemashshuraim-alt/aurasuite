import { NextResponse } from 'next/server';
import { executeEngineTask } from '@/lib/ai/engine/executor';

export async function POST(request) {
  try {
    const { taskId } = await request.json();
    if (!taskId) {
      return NextResponse.json({ error: 'Missing taskId' }, { status: 400 });
    }

    // In a full production system, we might push to a queue here.
    // For Phase 2B, we execute directly and await it.
    const result = await executeEngineTask(taskId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('API /engine/execute error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

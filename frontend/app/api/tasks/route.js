import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('organization_id');
  if (!orgId) return NextResponse.json({ error: 'Missing organization_id' }, { status: 400 });

  const { data, error } = await supabase
    .from('tasks')
    .select(`*, agents ( name )`) // join to get agent name easily
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tasks: data });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { organization_id, title, prompt, assigned_agent_id, priority, created_by } = body;
    if (!organization_id || !title || !prompt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        organization_id,
        title,
        prompt,
        assigned_agent_id,
        priority: priority || 'MEDIUM',
        status: 'PENDING',
        created_by,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ task: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, status, result, error: taskError, started_at, completed_at } = body;
    if (!id) return NextResponse.json({ error: 'Missing task id' }, { status: 400 });

    const updateData = {};
    if (status) updateData.status = status;
    if (result) updateData.result = result;
    if (taskError) updateData.error = taskError;
    if (started_at) updateData.started_at = started_at;
    if (completed_at) updateData.completed_at = completed_at;

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ task: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

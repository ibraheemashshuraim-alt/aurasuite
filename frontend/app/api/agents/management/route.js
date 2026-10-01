import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('organization_id');
  if (!orgId) return NextResponse.json({ error: 'Missing organization_id' }, { status: 400 });

  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ agents: data });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { organization_id, name, description, instructions, provider, model } = body;
    if (!organization_id || !name) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

    const { data, error } = await supabase
      .from('agents')
      .insert({
        organization_id,
        name,
        description,
        instructions,
        provider: provider || 'gemini',
        model: model || 'gemini-1.5-pro',
        status: 'ACTIVE',
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ agent: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, name, description, instructions, provider, model, status } = body;
    if (!id) return NextResponse.json({ error: 'Missing agent id' }, { status: 400 });

    const { data, error } = await supabase
      .from('agents')
      .update({
        name,
        description,
        instructions,
        provider,
        model,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ agent: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { error } = await supabase.from('agents').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

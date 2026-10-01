import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getRelevantKnowledge } from '@/lib/ai/knowledge/knowledgeService';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('organization_id') || '';
    const category = searchParams.get('category') || '';

    const items = await getRelevantKnowledge({ orgId, category });
    return NextResponse.json({ items });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { organization_id, category, title, content, tags, is_system } = body;

    if (!title || !content || !category) {
      return NextResponse.json({ error: 'category, title and content are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('knowledge_items')
      .insert({
        organization_id: organization_id || null,
        category,
        title,
        content,
        tags: tags || [],
        is_system: is_system || false,
      })
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, item: data?.[0] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

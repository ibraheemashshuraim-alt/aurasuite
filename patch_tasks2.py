import sys

with open('frontend/app/api/tasks/route.js', 'r', encoding='utf-8') as f:
    content = f.read()

new_post = """export async function POST(request) {
  try {
    const body = await request.json();
    const { organization_id, title, prompt, agent_id, priority, created_by } = body;
    if (!organization_id || !title || !prompt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let finalAgentId = agent_id;
    if (!finalAgentId) {
      // Auto-provision a default agent if none provided
      const { data: existing } = await supabase.from('agents').select('id').eq('organization_id', organization_id).limit(1).maybeSingle();
      if (existing) {
        finalAgentId = existing.id;
      } else {
        const { data: created } = await supabase.from('agents').insert({
          organization_id: organization_id,
          name: 'Saima',
          provider: 'gemini',
          model: 'gemini-1.5-pro',
          status: 'ACTIVE'
        }).select('id').single();
        if (created) finalAgentId = created.id;
      }
    }

    const { data, error } = await supabase
      .from('engine_tasks')
      .insert({
        organization_id,
        title,
        prompt,
        agent_id: finalAgentId,
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
}"""

import re
content = re.sub(r'export async function POST\(request\) \{[\s\S]*?\}\n\}', new_post, content)

with open('frontend/app/api/tasks/route.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed tasks/route.js!")

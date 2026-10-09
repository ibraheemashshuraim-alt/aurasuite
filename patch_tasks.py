import sys
import re

with open('frontend/app/api/tasks/route.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Auto-assign if agent_id is missing
old_logic = """    const { organization_id, title, prompt, agent_id, priority, created_by } = body;

    if (!organization_id || !title) {
      return NextResponse.json({ error: 'organization_id and title are required' }, { status: 400 });
    }

    const { data, error } = await supabase"""

new_logic = """    const { organization_id, title, prompt, agent_id, priority, created_by } = body;

    if (!organization_id || !title) {
      return NextResponse.json({ error: 'organization_id and title are required' }, { status: 400 });
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

    const { data, error } = await supabase"""

if old_logic in content:
    content = content.replace(old_logic, new_logic)
else:
    print("WARNING: Could not find logic to replace in tasks/route.js")

# And we need to replace `agent_id,` in the insert with `agent_id: finalAgentId,`
content = content.replace("agent_id,", "agent_id: finalAgentId,")

with open('frontend/app/api/tasks/route.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Tasks API updated for auto-assignment!")

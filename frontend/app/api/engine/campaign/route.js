import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt, organization_id, created_by } = body;

    if (!prompt || !organization_id) {
      return NextResponse.json({ error: 'Missing prompt or organization_id' }, { status: 400 });
    }

    const campaignId = crypto.randomUUID();

    // 1. Define our 4 core agents
    const coreAgents = [
      { name: 'Saima', role: 'Strategist & Researcher', char: 'Saima' },
      { name: 'Dani', role: 'Creative Copywriter', char: 'Dani' },
      { name: 'Mianzi', role: 'Visual Art Director', char: 'Mianzi' },
      { name: 'Zohaib', role: 'Quality & Packaging Lead', char: 'Zohaib' }
    ];

    const agentIds = {};

    // Ensure agents exist
    for (const ca of coreAgents) {
      const { data: existing } = await supabase.from('agents')
        .select('id')
        .eq('organization_id', organization_id)
        .eq('name', ca.name)
        .maybeSingle();

      if (existing) {
        agentIds[ca.name] = existing.id;
      } else {
        const { data: created, error: err } = await supabase.from('agents').insert({
          organization_id: organization_id,
          name: ca.name,
          provider: 'gemini',
          model: 'gemini-1.5-pro',
          status: 'ACTIVE'
        }).select('id').single();
        if (err) throw err;
        agentIds[ca.name] = created.id;
      }
    }

    // 2. Create the 4 sequential tasks
    const tasksToCreate = [
      {
        id: crypto.randomUUID(),
        title: `[Campaign] Research Phase`,
        prompt: `Campaign Topic: ${prompt}\n\nAct as the Strategist. Research the topic and provide a comprehensive strategy, target audience, and key messaging points.`,
        assigned_agent_id: agentIds['Saima'],
        step_order: 1
      },
      {
        id: crypto.randomUUID(),
        title: `[Campaign] Copywriting Phase`,
        prompt: `Campaign Topic: ${prompt}\n\nAct as the Copywriter. Wait for upstream research, then write 3 highly engaging social media posts (Facebook/Instagram/Twitter).`,
        assigned_agent_id: agentIds['Dani'],
        step_order: 2
      },
      {
        id: crypto.randomUUID(),
        title: `[Campaign] Design Prompt Phase`,
        prompt: `Campaign Topic: ${prompt}\n\nAct as the Visual Art Director. Wait for upstream copy, then create detailed image generation prompts (Midjourney style) for the posts.`,
        assigned_agent_id: agentIds['Mianzi'],
        step_order: 3
      },
      {
        id: crypto.randomUUID(),
        title: `[Campaign] Final Review Phase`,
        prompt: `Campaign Topic: ${prompt}\n\nAct as the Quality Lead. Review the upstream copy and design prompts, ensure they meet brand safety rules, and package them nicely.`,
        assigned_agent_id: agentIds['Zohaib'],
        step_order: 4
      }
    ];

    // Link them together
    for (let i = 0; i < tasksToCreate.length; i++) {
      tasksToCreate[i].organization_id = organization_id;
      tasksToCreate[i].created_by = created_by;
      tasksToCreate[i].campaign_id = campaignId;
      tasksToCreate[i].status = i === 0 ? 'PENDING' : 'IDLE'; // Only first is PENDING, rest wait
      tasksToCreate[i].priority = 'HIGH';

      if (i > 0) {
        tasksToCreate[i].upstream_task_id = tasksToCreate[i - 1].id;
      }
      if (i < tasksToCreate.length - 1) {
        tasksToCreate[i].next_task_id = tasksToCreate[i + 1].id;
      }
    }

    // Insert all tasks
    const { error: insertErr } = await supabase.from('engine_tasks').insert(tasksToCreate);
    if (insertErr) throw insertErr;

    return NextResponse.json({ 
      success: true, 
      campaign_id: campaignId, 
      message: 'Campaign initialized! Saima is starting now.',
      first_task_id: tasksToCreate[0].id
    });
  } catch (err) {
    console.error('API /engine/campaign error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

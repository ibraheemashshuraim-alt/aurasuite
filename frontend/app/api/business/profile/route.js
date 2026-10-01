import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      organization_id,
      brand_name,
      industry,
      target_audience,
      tone_and_voice,
      preferred_language,
      cta_style,
      do_rules,
      dont_rules,
      prohibited_claims,
      custom_instructions,
    } = body;

    if (!organization_id || !brand_name) {
      return NextResponse.json({ error: 'organization_id and brand_name are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('business_profiles')
      .upsert({
        organization_id,
        brand_name,
        industry: industry || 'Technology',
        target_audience: target_audience || '',
        tone_and_voice: tone_and_voice || 'Luxury, Professional',
        preferred_language: preferred_language || 'en-UK',
        cta_style: cta_style || 'Action-Oriented',
        do_rules: do_rules || [],
        dont_rules: dont_rules || [],
        prohibited_claims: prohibited_claims || [],
        custom_instructions: custom_instructions || '',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'organization_id',
      })
      .select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Business profile and brand guidelines saved.',
      profile: data?.[0] || body,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('organization_id');

    if (!orgId) {
      return NextResponse.json({ error: 'organization_id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('organization_id', orgId)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json(data || {});
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

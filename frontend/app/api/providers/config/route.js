import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { encryptKey } from '@/lib/ai/crypto';

export async function POST(request) {
  try {
    const body = await request.json();
    const { organization_id, provider_name, api_key, default_model, base_url } = body;

    if (!organization_id || !provider_name) {
      return NextResponse.json({ error: 'organization_id and provider_name are required' }, { status: 400 });
    }

    const pName = provider_name.toLowerCase().trim();
    let ciphertext = '';
    let nonce = '';
    let hint = '';

    if (pName !== 'ollama') {
      if (!api_key || !api_key.trim()) {
        return NextResponse.json({ error: 'api_key is required for cloud providers' }, { status: 400 });
      }
      const enc = encryptKey(api_key);
      ciphertext = enc.ciphertext;
      nonce = enc.nonce;
      hint = enc.hint;
    } else {
      hint = 'Local Ollama Engine';
    }

    const { error } = await supabase
      .from('ai_provider_configs')
      .upsert({
        organization_id,
        provider_name: pName,
        encrypted_api_key: ciphertext,
        nonce,
        key_hint: hint,
        base_url: base_url || null,
        default_model: default_model || null,
        is_active: true,
        is_byok: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'organization_id,provider_name',
      });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      provider_name: pName,
      key_hint: hint,
      message: 'API Key securely encrypted server-side and stored.',
    });
  } catch (err) {
    console.error('API /providers/config error:', err);
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
      .from('ai_provider_configs')
      .select('id, organization_id, provider_name, key_hint, base_url, default_model, is_active, is_byok, updated_at')
      .eq('organization_id', orgId);

    if (error) throw error;

    return NextResponse.json({ providers: data || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

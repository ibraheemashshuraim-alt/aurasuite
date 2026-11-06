import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { encryptKey } from '@/lib/ai/crypto';

export async function POST(request) {
  try {
    const body = await request.json();
    const { organization_id, provider_name, api_key, default_model, base_url, action } = body;

    if (!organization_id || !provider_name) {
      return NextResponse.json({ error: 'organization_id and provider_name are required' }, { status: 400 });
    }

    const pName = provider_name.toLowerCase().trim();

    // Quick active engine switch
    if (action === 'set_active') {
      // Deactivate all providers for this organization
      await supabase
        .from('ai_provider_configs')
        .update({ is_active: false })
        .eq('organization_id', organization_id);

      // Activate only the chosen provider
      await supabase
        .from('ai_provider_configs')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('organization_id', organization_id)
        .eq('provider_name', pName);

      return NextResponse.json({
        success: true,
        active_provider: pName,
        message: `Switched active AI engine to ${pName.toUpperCase()}`
      });
    }

    let ciphertext = '';
    let nonce = '';
    let hint = '';

    if (pName !== 'ollama') {
      if (api_key && api_key.trim()) {
        const enc = encryptKey(api_key);
        ciphertext = enc.ciphertext;
        nonce = enc.nonce;
        hint = enc.hint;
      } else {
        // Keep existing encrypted key if already saved
        const { data: existing } = await supabase
          .from('ai_provider_configs')
          .select('encrypted_api_key, nonce, key_hint')
          .eq('organization_id', organization_id)
          .eq('provider_name', pName)
          .maybeSingle();

        if (existing?.encrypted_api_key && existing?.nonce) {
          ciphertext = existing.encrypted_api_key;
          nonce = existing.nonce;
          hint = existing.key_hint || 'Configured';
        } else {
          return NextResponse.json({ error: `api_key is required for ${provider_name}` }, { status: 400 });
        }
      }
    } else {
      hint = 'Local Ollama Engine';
    }

    // Preserve existing is_active status or use requested
    const { data: existingRow } = await supabase
      .from('ai_provider_configs')
      .select('is_active')
      .eq('organization_id', organization_id)
      .eq('provider_name', pName)
      .maybeSingle();

    const shouldBeActive = typeof body.is_active === 'boolean' 
      ? body.is_active 
      : (existingRow?.is_active ?? false);

    if (shouldBeActive) {
      await supabase
        .from('ai_provider_configs')
        .update({ is_active: false })
        .eq('organization_id', organization_id);
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
        is_active: shouldBeActive,
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
      .eq('organization_id', orgId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ providers: data || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

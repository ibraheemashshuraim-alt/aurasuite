import { NextResponse } from 'next/server';

export async function POST(request) {
  const startTime = Date.now();
  try {
    const { provider, mode, apiKey } = await request.json();

    if (mode === 'subscription') {
      return NextResponse.json({
        success: false,
        error: 'Consumer subscriptions cannot be used as application API credentials. Add the provider\'s official API key instead.'
      }, { status: 400 });
    }

    // API Key verification mode
    const keyToTest = apiKey?.trim();
    if (!keyToTest) {
      return NextResponse.json({ success: false, error: 'API key is required' }, { status: 400 });
    }

    if (provider === 'gemini') {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${keyToTest}`);
      if (!res.ok) throw new Error(await res.text());
      return NextResponse.json({
        success: true,
        provider,
        latencyMs: Date.now() - startTime,
        message: 'Google Gemini API key verified (Active)'
      });
    }

    if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${keyToTest}` }
      });
      if (!res.ok) throw new Error(await res.text());
      return NextResponse.json({
        success: true,
        provider,
        latencyMs: Date.now() - startTime,
        message: 'OpenAI API key verified (Active)'
      });
    }

    if (provider === 'groq') {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${keyToTest}` }
      });
      if (!res.ok) throw new Error(await res.text());
      return NextResponse.json({
        success: true,
        provider,
        latencyMs: Date.now() - startTime,
        message: 'Groq LPU API key verified (Active)'
      });
    }

    if (provider === 'claude') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': keyToTest,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'ping' }]
        })
      });
      if (!res.ok && res.status !== 400) throw new Error(await res.text());
      return NextResponse.json({
        success: true,
        provider,
        latencyMs: Date.now() - startTime,
        message: 'Anthropic Claude API key verified (Active)'
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown provider' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err.message || 'Connection test failed',
      latencyMs: Date.now() - startTime
    }, { status: 400 });
  }
}

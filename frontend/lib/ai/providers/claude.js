/**
 * Anthropic Claude Provider Client
 */
export async function generateClaude({ apiKey, model = 'claude-3-5-sonnet-20241022', systemPrompt = '', prompt = '', temperature = 0.7, maxTokens = 2048 }) {
  if (!apiKey) throw new Error('Missing API key for Claude');

  const url = 'https://api.anthropic.com/v1/messages';

  const body = {
    model,
    max_tokens: maxTokens,
    messages: [
      { role: 'user', content: prompt }
    ],
    temperature,
  };

  if (systemPrompt) {
    body.system = systemPrompt;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Claude API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const text = (data?.content || [])
    .filter(c => c.type === 'text')
    .map(c => c.text)
    .join('');

  return {
    text,
    promptTokens: data?.usage?.input_tokens || 0,
    completionTokens: data?.usage?.output_tokens || 0,
    model,
    provider: 'claude',
  };
}

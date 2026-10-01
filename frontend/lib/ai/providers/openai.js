/**
 * OpenAI Provider Client
 */
export async function generateOpenAI({ apiKey, model = 'gpt-4o-mini', systemPrompt = '', prompt = '', temperature = 0.7, maxTokens, jsonMode = false }) {
  if (!apiKey) throw new Error('Missing API key for OpenAI');

  const url = 'https://api.openai.com/v1/chat/completions';

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const body = {
    model,
    messages,
    temperature,
  };

  if (maxTokens) {
    body.max_tokens = maxTokens;
  }
  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || '';
  const promptTokens = data?.usage?.prompt_tokens || 0;
  const completionTokens = data?.usage?.completion_tokens || 0;

  return {
    text,
    promptTokens,
    completionTokens,
    model,
    provider: 'openai',
  };
}

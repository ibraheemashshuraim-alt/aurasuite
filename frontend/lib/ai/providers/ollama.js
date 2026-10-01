/**
 * Ollama Local AI Provider Client
 */
export async function generateOllama({ baseURL = 'http://localhost:11434', model = 'llama3.2', systemPrompt = '', prompt = '', temperature = 0.7, maxTokens, jsonMode = false }) {
  const cleanBase = (baseURL || 'http://localhost:11434').replace(/\/$/, '');
  const url = `${cleanBase}/api/generate`;

  const body = {
    model,
    prompt,
    stream: false,
  };

  if (systemPrompt) {
    body.system = systemPrompt;
  }

  const options = {};
  if (temperature) options.temperature = temperature;
  if (maxTokens) options.num_predict = maxTokens;
  if (Object.keys(options).length > 0) body.options = options;

  if (jsonMode) {
    body.format = 'json';
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Ollama API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();

  return {
    text: data.response || '',
    promptTokens: data.prompt_eval_count || 0,
    completionTokens: data.eval_count || 0,
    model,
    provider: 'ollama',
  };
}

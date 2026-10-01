/**
 * Google Gemini Provider Client
 */
export async function generateGemini({ apiKey, model = 'gemini-1.5-flash', systemPrompt = '', prompt = '', temperature = 0.7, maxTokens, jsonMode = false }) {
  if (!apiKey) throw new Error('Missing API key for Gemini');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      { parts: [{ text: prompt }] },
    ],
    generationConfig: {
      temperature,
    },
  };

  if (systemPrompt) {
    body.systemInstruction = {
      parts: [{ text: systemPrompt }],
    };
  }

  if (maxTokens) {
    body.generationConfig.maxOutputTokens = maxTokens;
  }

  if (jsonMode) {
    body.generationConfig.responseMimeType = 'application/json';
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const promptTokens = data?.usageMetadata?.promptTokenCount || 0;
  const completionTokens = data?.usageMetadata?.candidatesTokenCount || 0;

  return {
    text,
    promptTokens,
    completionTokens,
    model,
    provider: 'gemini',
  };
}

/**
 * Google Gemini Provider Client
 */
export async function generateGemini({ apiKey, model = 'gemini-3.5-flash', systemPrompt = '', prompt = '', temperature = 0.7, maxTokens, jsonMode = false }) {
  if (!apiKey) throw new Error('Missing API key for Gemini');

  // Ensure supported model name (fallback deprecated 2.0 / 1.5 / 2.5 names to lightning-fast 3.5-flash)
  let resolvedModel = model;
  if (!resolvedModel || resolvedModel.includes('2.0') || resolvedModel.includes('1.5') || resolvedModel.includes('2.5') || resolvedModel === 'gemini-pro') {
    resolvedModel = 'gemini-3.5-flash';
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${resolvedModel}:generateContent?key=${apiKey}`;

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
    model: resolvedModel,
    provider: 'gemini',
  };
}

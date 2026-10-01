import { generateGemini } from './gemini';
import { generateGroq } from './groq';
import { generateOpenAI } from './openai';
import { generateClaude } from './claude';
import { generateOllama } from './ollama';

/**
 * Universal AI Provider Dispatcher
 */
export async function generateAI(providerName, options) {
  const normalized = (providerName || 'gemini').toLowerCase().trim();

  // If no API key is configured yet for cloud providers, return structured simulation for Phase 1 verification
  if (!options?.apiKey && normalized !== 'ollama') {
    return {
      text: `[AuraSuite Synthetic AI Output - ${options.model || normalized}]\nTask: ${options.prompt?.slice(0, 120) || 'Task Directives'}\n\n1. Analysis: Market context and audience requirements parsed successfully.\n2. Strategy: Strict adherence to brand voice, tone, and prohibited claims maintained.\n3. Output: Actionable directives generated and packaged for downstream execution.\n\n(Note: To activate live Google Gemini/Groq/OpenAI calls, add your BYOK key in AI Provider Settings).`,
      promptTokens: 140,
      completionTokens: 92,
      model: `${options.model || normalized}-simulated`,
      provider: normalized,
    };
  }

  switch (normalized) {
    case 'gemini':
      return await generateGemini(options);
    case 'groq':
      return await generateGroq(options);
    case 'openai':
      return await generateOpenAI(options);
    case 'claude':
      return await generateClaude(options);
    case 'ollama':
      return await generateOllama(options);
    default:
      throw new Error(`Unsupported AI provider: ${providerName}. Supported: gemini, groq, openai, claude, ollama`);
  }
}

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

// AI Provider Factory and Abstraction Layer

import { AIProvider, AIProviderType, AIProviderConfig } from './types';
import { GeminiProvider } from './providers/gemini';
import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';

let cachedProvider: AIProvider | null = null;

/**
 * Create an AI provider instance based on configuration
 */
export function createAIProvider(config: AIProviderConfig): AIProvider {
  switch (config.type) {
    case 'gemini':
      return new GeminiProvider(config.apiKey, config.model);
    case 'openai':
      return new OpenAIProvider(config.apiKey, config.model);
    case 'anthropic':
      return new AnthropicProvider(config.apiKey, config.model);
    default:
      throw new Error(`Unsupported AI provider type: ${config.type}`);
  }
}

/**
 * Get the default AI provider from environment variables
 * Works in both server and client contexts
 */
export function getDefaultAIProvider(): AIProvider {
  if (cachedProvider) {
    return cachedProvider;
  }

  // Support both server and client-side access
  const getEnv = (key: string): string | undefined => {
    if (typeof window !== 'undefined') {
      // Client-side: use window or process.env
      return (window as any).__ENV__?.[key] || process.env[key];
    }
    // Server-side: use process.env
    return process.env[key];
  };

  const providerType = (getEnv('NEXT_PUBLIC_AI_PROVIDER') ||
    'gemini') as AIProviderType;

  let apiKey: string;
  let model: string | undefined;

  switch (providerType) {
    case 'gemini':
      apiKey = getEnv('NEXT_PUBLIC_GEMINI_API_KEY') || '';
      model = getEnv('NEXT_PUBLIC_GEMINI_MODEL');
      if (!apiKey) {
        throw new Error('NEXT_PUBLIC_GEMINI_API_KEY is required');
      }
      cachedProvider = new GeminiProvider(apiKey, model);
      break;

    case 'openai':
      apiKey = getEnv('NEXT_PUBLIC_OPENAI_API_KEY') || '';
      model = getEnv('NEXT_PUBLIC_OPENAI_MODEL');
      if (!apiKey) {
        throw new Error('NEXT_PUBLIC_OPENAI_API_KEY is required');
      }
      cachedProvider = new OpenAIProvider(apiKey, model);
      break;

    case 'anthropic':
      apiKey = getEnv('NEXT_PUBLIC_ANTHROPIC_API_KEY') || '';
      model = getEnv('NEXT_PUBLIC_ANTHROPIC_MODEL');
      if (!apiKey) {
        throw new Error('NEXT_PUBLIC_ANTHROPIC_API_KEY is required');
      }
      cachedProvider = new AnthropicProvider(apiKey, model);
      break;

    default:
      throw new Error(`Unsupported AI provider type: ${providerType}`);
  }

  return cachedProvider;
}

/**
 * Reset the cached provider (useful for testing or switching providers)
 */
export function resetAIProvider(): void {
  cachedProvider = null;
}

// Export types and providers
export * from './types';
export { GeminiProvider } from './providers/gemini';
export { OpenAIProvider } from './providers/openai';
export { AnthropicProvider } from './providers/anthropic';


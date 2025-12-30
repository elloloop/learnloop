// AI Model Fallback System - Start with cheapest, upgrade if needed

import { AIProvider, AIGenerateOptions } from './types';
import { GeminiProvider } from './providers/gemini';
import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';

export interface ModelTier {
  provider: 'gemini' | 'openai' | 'anthropic';
  model: string;
  cost: number; // Relative cost (lower = cheaper)
  quality: number; // Expected quality 1-10
}

export interface FallbackResult<T = any> {
  result: T;
  modelUsed: string;
  provider: string;
  attempts: number;
  qualityScore?: number;
}

export interface QualityCheck {
  isValid: boolean;
  score?: number; // 1-10
  reason?: string;
}

// Model tiers ordered by cost (cheapest first)
export const MODEL_TIERS: ModelTier[] = [
  // Cheapest tier
  {
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    cost: 1,
    quality: 7,
  },
  {
    provider: 'openai',
    model: 'gpt-4o-mini',
    cost: 2,
    quality: 7,
  },
  {
    provider: 'anthropic',
    model: 'claude-3-haiku-20240307',
    cost: 3,
    quality: 7,
  },
  // Mid tier
  {
    provider: 'gemini',
    model: 'gemini-2.5-flash-preview-09-2025',
    cost: 4,
    quality: 8,
  },
  {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    cost: 5,
    quality: 8,
  },
  {
    provider: 'gemini',
    model: 'gemini-1.5-pro',
    cost: 6,
    quality: 9,
  },
  // Premium tier
  {
    provider: 'openai',
    model: 'gpt-4o',
    cost: 7,
    quality: 9,
  },
  {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    cost: 8,
    quality: 9,
  },
  // Best tier
  {
    provider: 'openai',
    model: 'gpt-4-turbo',
    cost: 9,
    quality: 10,
  },
  {
    provider: 'anthropic',
    model: 'claude-3-opus-20240229',
    cost: 10,
    quality: 10,
  },
];

/**
 * Create a provider instance for a specific model tier
 */
function createProviderForTier(tier: ModelTier, apiKeys: {
  gemini?: string;
  openai?: string;
  anthropic?: string;
}): AIProvider {
  const apiKey = apiKeys[tier.provider];
  if (!apiKey) {
    throw new Error(`API key not available for ${tier.provider}`);
  }

  switch (tier.provider) {
    case 'gemini':
      return new GeminiProvider(apiKey, tier.model);
    case 'openai':
      return new OpenAIProvider(apiKey, tier.model);
    case 'anthropic':
      return new AnthropicProvider(apiKey, tier.model);
    default:
      throw new Error(`Unknown provider: ${tier.provider}`);
  }
}

/**
 * Default quality checker - validates JSON structure and basic quality
 */
export async function defaultQualityCheck(
  result: any,
  prompt: string
): Promise<QualityCheck> {
  // Basic validation
  if (!result || typeof result !== 'object') {
    return {
      isValid: false,
      score: 1,
      reason: 'Invalid response format',
    };
  }

  // Check if result is empty
  if (Object.keys(result).length === 0) {
    return {
      isValid: false,
      score: 2,
      reason: 'Empty response',
    };
  }

  // Basic quality heuristics
  let score = 5;

  // Check for required fields in common structures
  if (result.templateText && result.variables) {
    score += 2; // Has expected structure
  }

  if (result.title && result.concepts) {
    score += 1; // Has metadata
  }

  // Check if content seems meaningful (not just placeholders)
  const hasContent = JSON.stringify(result).length > 50;
  if (!hasContent) {
    return {
      isValid: false,
      score: 3,
      reason: 'Response too short or incomplete',
    };
  }

  return {
    isValid: score >= 6,
    score: Math.min(10, score),
    reason: score >= 6 ? 'Quality acceptable' : 'Quality below threshold',
  };
}

/**
 * Generate with automatic fallback through model tiers
 */
export async function generateWithFallback<T = any>(
  prompt: string,
  options: {
    imageBase64?: string;
    systemInstruction?: string;
    apiKeys: {
      gemini?: string;
      openai?: string;
      anthropic?: string;
    };
    qualityCheck?: (result: T, prompt: string) => Promise<QualityCheck>;
    minQualityScore?: number; // Minimum acceptable quality (1-10)
    maxAttempts?: number; // Maximum models to try
    onAttempt?: (tier: ModelTier, attempt: number) => void; // Progress callback
  }
): Promise<FallbackResult<T>> {
  const {
    imageBase64,
    systemInstruction,
    apiKeys,
    qualityCheck = defaultQualityCheck,
    minQualityScore = 6,
    maxAttempts = 5,
    onAttempt,
  } = options;

  // Filter tiers to only those with available API keys
  const availableTiers = MODEL_TIERS.filter(
    (tier) => apiKeys[tier.provider]
  );

  if (availableTiers.length === 0) {
    throw new Error('No AI provider API keys available');
  }

  // Sort by cost (cheapest first)
  const sortedTiers = [...availableTiers].sort((a, b) => a.cost - b.cost);

  let lastError: Error | null = null;
  let lastResult: T | null = null;

  for (let attempt = 0; attempt < Math.min(maxAttempts, sortedTiers.length); attempt++) {
    const tier = sortedTiers[attempt];

    try {
      // Notify about attempt
      if (onAttempt) {
        onAttempt(tier, attempt + 1);
      }

      // Create provider for this tier
      const provider = createProviderForTier(tier, apiKeys);

      // Generate content
      let result: T;
      if (imageBase64) {
        result = await provider.generateJSONWithImage<T>(
          prompt,
          imageBase64,
          {
            systemInstruction,
          }
        );
      } else {
        result = await provider.generateJSON<T>(prompt, {
          systemInstruction,
        });
      }

      // Check quality
      const quality = await qualityCheck(result, prompt);

      // If quality is acceptable, return
      if (quality.isValid && (quality.score || 0) >= minQualityScore) {
        return {
          result,
          modelUsed: tier.model,
          provider: tier.provider,
          attempts: attempt + 1,
          qualityScore: quality.score,
        };
      }

      // Quality not good enough, but save result in case we run out of attempts
      lastResult = result;

      // If this is the last attempt, return anyway
      if (attempt === Math.min(maxAttempts, sortedTiers.length) - 1) {
        return {
          result,
          modelUsed: tier.model,
          provider: tier.provider,
          attempts: attempt + 1,
          qualityScore: quality.score,
        };
      }

      // Continue to next tier
    } catch (error) {
      lastError = error as Error;
      console.warn(
        `Attempt ${attempt + 1} with ${tier.provider}/${tier.model} failed:`,
        error
      );

      // If this is the last attempt, throw
      if (attempt === Math.min(maxAttempts, sortedTiers.length) - 1) {
        throw lastError;
      }

      // Continue to next tier
    }
  }

  // Should not reach here, but just in case
  if (lastResult) {
    return {
      result: lastResult,
      modelUsed: sortedTiers[sortedTiers.length - 1].model,
      provider: sortedTiers[sortedTiers.length - 1].provider,
      attempts: sortedTiers.length,
    };
  }

  throw lastError || new Error('All model attempts failed');
}


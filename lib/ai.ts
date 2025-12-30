// AI Helper Functions - Backward compatibility wrapper
// Uses the new AI provider abstraction with automatic fallback

import { getDefaultAIProvider } from './ai/index';
import { generateWithFallback } from './ai/fallback';

/**
 * @deprecated Use getDefaultAIProvider() directly for better type safety
 * Legacy function for backward compatibility
 * Now uses automatic fallback for cost optimization
 */
export const callGemini = async (
  prompt: string,
  imageBase64?: string | null,
  systemInstruction?: string
): Promise<any> => {
  try {
    // Get API keys from environment
    const getEnv = (key: string): string | undefined => {
      if (typeof window !== 'undefined') {
        return (window as any).__ENV__?.[key] || process.env[key];
      }
      return process.env[key];
    };

    const apiKeys = {
      gemini: getEnv('NEXT_PUBLIC_GEMINI_API_KEY'),
      openai: getEnv('NEXT_PUBLIC_OPENAI_API_KEY'),
      anthropic: getEnv('NEXT_PUBLIC_ANTHROPIC_API_KEY'),
    };

    // Use fallback system for cost optimization
    const result = await generateWithFallback(prompt, {
      imageBase64: imageBase64 || undefined,
      systemInstruction,
      apiKeys,
      minQualityScore: 6,
      maxAttempts: 3, // Try up to 3 models
    });

    return result.result;
  } catch (error) {
    console.error('AI Error:', error);
    // Fallback to simple provider if fallback system fails
    try {
      const provider = getDefaultAIProvider();
      if (imageBase64) {
        return await provider.generateJSONWithImage(prompt, imageBase64, {
          systemInstruction,
        });
      } else {
        return await provider.generateJSON(prompt, {
          systemInstruction,
        });
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return null;
    }
  }
};


// Common types and interfaces for AI providers

export interface AIProvider {
  /**
   * Generate content based on a text prompt
   */
  generateText(prompt: string, options?: AIGenerateOptions): Promise<string>;

  /**
   * Generate structured JSON content
   */
  generateJSON<T = any>(
    prompt: string,
    options?: AIGenerateOptions
  ): Promise<T>;

  /**
   * Generate content with image input (vision)
   */
  generateWithImage(
    prompt: string,
    imageBase64: string,
    options?: AIGenerateOptions
  ): Promise<string>;

  /**
   * Generate structured JSON with image input
   */
  generateJSONWithImage<T = any>(
    prompt: string,
    imageBase64: string,
    options?: AIGenerateOptions
  ): Promise<T>;
}

export interface AIGenerateOptions {
  /**
   * System instruction/prompt
   */
  systemInstruction?: string;

  /**
   * Temperature for generation (0-1)
   */
  temperature?: number;

  /**
   * Maximum tokens to generate
   */
  maxTokens?: number;

  /**
   * Model name/identifier
   */
  model?: string;
}

export type AIProviderType = 'gemini' | 'openai' | 'anthropic';

export interface AIProviderConfig {
  type: AIProviderType;
  apiKey: string;
  model?: string;
  baseURL?: string;
}


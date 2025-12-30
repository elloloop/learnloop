import { AIProvider, AIGenerateOptions } from '../types';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export class GeminiProvider implements AIProvider {
  private apiKey: string;
  private baseURL: string;
  private defaultModel: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.baseURL =
      'https://generativelanguage.googleapis.com/v1beta/models';
    this.defaultModel =
      model ||
      'gemini-2.5-flash-preview-09-2025';
  }

  private async callAPI(
    prompt: string,
    imageBase64?: string,
    options?: AIGenerateOptions
  ): Promise<string> {
    const parts: any[] = [{ text: prompt }];

    if (imageBase64) {
      const base64Data = imageBase64.includes('base64,')
        ? imageBase64.split('base64,')[1]
        : imageBase64;

      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: base64Data,
        },
      });
    }

    const model = options?.model || this.defaultModel;
    const url = `${this.baseURL}/${model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        systemInstruction: options?.systemInstruction
          ? { parts: [{ text: options.systemInstruction }] }
          : undefined,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: options?.temperature,
          maxOutputTokens: options?.maxTokens,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API Error: ${errorText}`);
    }

    const data: GeminiResponse = await response.json();
    const text = data.candidates[0]?.content?.parts[0]?.text;

    if (!text) {
      throw new Error('No response from Gemini API');
    }

    return text;
  }

  async generateText(
    prompt: string,
    options?: AIGenerateOptions
  ): Promise<string> {
    const response = await this.callAPI(prompt, undefined, {
      ...options,
      systemInstruction: options?.systemInstruction,
    });
    return response;
  }

  async generateJSON<T = any>(
    prompt: string,
    options?: AIGenerateOptions
  ): Promise<T> {
    const response = await this.callAPI(prompt, undefined, options);
    try {
      return JSON.parse(response) as T;
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error}`);
    }
  }

  async generateWithImage(
    prompt: string,
    imageBase64: string,
    options?: AIGenerateOptions
  ): Promise<string> {
    return this.callAPI(prompt, imageBase64, options);
  }

  async generateJSONWithImage<T = any>(
    prompt: string,
    imageBase64: string,
    options?: AIGenerateOptions
  ): Promise<T> {
    const response = await this.callAPI(prompt, imageBase64, options);
    try {
      return JSON.parse(response) as T;
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error}`);
    }
  }
}


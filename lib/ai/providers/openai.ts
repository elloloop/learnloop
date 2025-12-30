import { AIProvider, AIGenerateOptions } from '../types';

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class OpenAIProvider implements AIProvider {
  private apiKey: string;
  private baseURL: string;
  private defaultModel: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.openai.com/v1';
    this.defaultModel = model || 'gpt-4o';
  }

  private async callAPI(
    prompt: string,
    imageBase64?: string,
    options?: AIGenerateOptions
  ): Promise<string> {
    const model = options?.model || this.defaultModel;
    const url = `${this.baseURL}/chat/completions`;

    const messages: any[] = [];

    if (options?.systemInstruction) {
      messages.push({
        role: 'system',
        content: options.systemInstruction,
      });
    }

    const content: any[] = [{ type: 'text', text: prompt }];

    if (imageBase64) {
      const base64Data = imageBase64.includes('base64,')
        ? imageBase64.split('base64,')[1]
        : imageBase64;

      content.push({
        type: 'image_url',
        image_url: {
          url: `data:image/png;base64,${base64Data}`,
        },
      });
    }

    messages.push({
      role: 'user',
      content,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API Error: ${errorText}`);
    }

    const data: OpenAIResponse = await response.json();
    const text = data.choices[0]?.message?.content;

    if (!text) {
      throw new Error('No response from OpenAI API');
    }

    return text;
  }

  async generateText(
    prompt: string,
    options?: AIGenerateOptions
  ): Promise<string> {
    const response = await this.callAPI(prompt, undefined, options);
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


import { AIProvider, AIGenerateOptions } from '../types';

interface AnthropicResponse {
  content: Array<{
    text: string;
  }>;
}

export class AnthropicProvider implements AIProvider {
  private apiKey: string;
  private baseURL: string;
  private defaultModel: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.anthropic.com/v1';
    this.defaultModel = model || 'claude-3-5-sonnet-20241022';
  }

  private async callAPI(
    prompt: string,
    imageBase64?: string,
    options?: AIGenerateOptions
  ): Promise<string> {
    const model = options?.model || this.defaultModel;
    const url = `${this.baseURL}/messages`;

    const messages: any[] = [];

    const content: any[] = [{ type: 'text', text: prompt }];

    if (imageBase64) {
      const base64Data = imageBase64.includes('base64,')
        ? imageBase64.split('base64,')[1]
        : imageBase64;

      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: base64Data,
        },
      });
    }

    messages.push({
      role: 'user',
      content,
    });

    const body: any = {
      model,
      messages,
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature ?? 0.7,
    };

    if (options?.systemInstruction) {
      body.system = options.systemInstruction;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API Error: ${errorText}`);
    }

    const data: AnthropicResponse = await response.json();
    const text = data.content[0]?.text;

    if (!text) {
      throw new Error('No response from Anthropic API');
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
    // Anthropic doesn't have native JSON mode, so we need to request it in the prompt
    const jsonPrompt = `${prompt}\n\nPlease respond with valid JSON only, no markdown formatting.`;
    const response = await this.callAPI(jsonPrompt, undefined, options);
    
    // Try to extract JSON from response (might have markdown code blocks)
    let jsonText = response.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    try {
      return JSON.parse(jsonText) as T;
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
    const jsonPrompt = `${prompt}\n\nPlease respond with valid JSON only, no markdown formatting.`;
    const response = await this.callAPI(jsonPrompt, imageBase64, options);
    
    let jsonText = response.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    try {
      return JSON.parse(jsonText) as T;
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error}`);
    }
  }
}


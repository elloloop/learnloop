# AI Provider Abstraction

This module provides a unified interface for multiple AI providers (Gemini, OpenAI, Anthropic) with easy switching between them.

## Usage

### Basic Usage (Default Provider)

```typescript
import { getDefaultAIProvider } from '@/lib/ai';

const provider = getDefaultAIProvider();

// Generate text
const text = await provider.generateText('What is 2+2?');

// Generate JSON
const json = await provider.generateJSON<MyType>('Generate a user object');

// With image
const result = await provider.generateJSONWithImage(
  'Describe this image',
  imageBase64
);
```

### Using a Specific Provider

```typescript
import { createAIProvider } from '@/lib/ai';

const provider = createAIProvider({
  type: 'openai',
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o',
});

const result = await provider.generateJSON(prompt);
```

### Configuration

Set environment variables to configure the default provider:

```env
# Choose provider: 'gemini', 'openai', or 'anthropic'
NEXT_PUBLIC_AI_PROVIDER=gemini

# Provider-specific API keys
NEXT_PUBLIC_GEMINI_API_KEY=your_key
NEXT_PUBLIC_OPENAI_API_KEY=your_key
NEXT_PUBLIC_ANTHROPIC_API_KEY=your_key

# Optional: Override default models
NEXT_PUBLIC_GEMINI_MODEL=gemini-2.5-flash-preview-09-2025
NEXT_PUBLIC_OPENAI_MODEL=gpt-4o
NEXT_PUBLIC_ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

## Supported Providers

### Gemini (Google)
- **Default Model**: `gemini-2.5-flash-preview-09-2025`
- **Features**: Native JSON mode, vision support
- **API Key**: `NEXT_PUBLIC_GEMINI_API_KEY`

### OpenAI
- **Default Model**: `gpt-4o`
- **Features**: JSON mode, vision support
- **API Key**: `NEXT_PUBLIC_OPENAI_API_KEY`

### Anthropic (Claude)
- **Default Model**: `claude-3-5-sonnet-20241022`
- **Features**: Vision support, JSON via prompt engineering
- **API Key**: `NEXT_PUBLIC_ANTHROPIC_API_KEY`

## API Methods

All providers implement the `AIProvider` interface:

- `generateText(prompt, options?)` - Generate plain text
- `generateJSON<T>(prompt, options?)` - Generate structured JSON
- `generateWithImage(prompt, imageBase64, options?)` - Text with image
- `generateJSONWithImage<T>(prompt, imageBase64, options?)` - JSON with image

## Options

```typescript
interface AIGenerateOptions {
  systemInstruction?: string;  // System prompt/instruction
  temperature?: number;        // 0-1, randomness
  maxTokens?: number;          // Max output tokens
  model?: string;             // Override default model
}
```

## Backward Compatibility

The old `callGemini` function still works for backward compatibility:

```typescript
import { callGemini } from '@/lib/ai';
const result = await callGemini(prompt, imageBase64, systemInstruction);
```

This now uses the configured default provider automatically.


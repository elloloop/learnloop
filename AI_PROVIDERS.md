# AI Provider Configuration Guide

## Overview

LearnLoop now supports multiple AI providers through a unified abstraction layer. You can easily switch between Gemini, OpenAI, and Anthropic without changing your code.

## Quick Start

### 1. Choose Your Provider

Set the `NEXT_PUBLIC_AI_PROVIDER` environment variable to one of:
- `gemini` (default)
- `openai`
- `anthropic`

### 2. Configure API Keys

Add the appropriate API key for your chosen provider:

**For Gemini:**
```env
NEXT_PUBLIC_AI_PROVIDER=gemini
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

**For OpenAI:**
```env
NEXT_PUBLIC_AI_PROVIDER=openai
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
```

**For Anthropic:**
```env
NEXT_PUBLIC_AI_PROVIDER=anthropic
NEXT_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 3. Optional: Override Models

You can specify custom models for each provider:

```env
NEXT_PUBLIC_GEMINI_MODEL=gemini-2.5-flash-preview-09-2025
NEXT_PUBLIC_OPENAI_MODEL=gpt-4o
NEXT_PUBLIC_ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

## Default Models

- **Gemini**: `gemini-2.5-flash-preview-09-2025`
- **OpenAI**: `gpt-4o`
- **Anthropic**: `claude-3-5-sonnet-20241022`

## Usage in Code

### Using the Default Provider (Recommended)

```typescript
import { getDefaultAIProvider } from '@/lib/ai';

const provider = getDefaultAIProvider();

// Generate JSON (most common use case)
const result = await provider.generateJSON<MyType>(prompt, {
  systemInstruction: 'You are a helpful assistant',
  temperature: 0.7,
});

// With image
const result = await provider.generateJSONWithImage(
  'Analyze this image',
  imageBase64,
  { systemInstruction: '...' }
);
```

### Using a Specific Provider Programmatically

```typescript
import { createAIProvider } from '@/lib/ai';

const provider = createAIProvider({
  type: 'openai',
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o',
});

const result = await provider.generateJSON(prompt);
```

### Backward Compatibility

The old `callGemini` function still works and automatically uses your configured provider:

```typescript
import { callGemini } from '@/lib/ai';

const result = await callGemini(prompt, imageBase64, systemInstruction);
```

## Provider Comparison

| Feature | Gemini | OpenAI | Anthropic |
|---------|--------|--------|-----------|
| JSON Mode | Native | Native | Via prompt |
| Vision | ✅ | ✅ | ✅ |
| System Instructions | ✅ | ✅ | ✅ |
| Temperature Control | ✅ | ✅ | ✅ |
| Max Tokens | ✅ | ✅ | ✅ |

## Switching Providers

To switch providers, simply change the `NEXT_PUBLIC_AI_PROVIDER` environment variable and restart your dev server:

```bash
# Switch to OpenAI
NEXT_PUBLIC_AI_PROVIDER=openai npm run dev

# Switch to Anthropic
NEXT_PUBLIC_AI_PROVIDER=anthropic npm run dev
```

## Error Handling

All providers throw errors that can be caught:

```typescript
try {
  const result = await provider.generateJSON(prompt);
} catch (error) {
  console.error('AI generation failed:', error);
  // Handle error appropriately
}
```

## Best Practices

1. **Use environment variables** - Never hardcode API keys
2. **Handle errors gracefully** - AI APIs can fail or rate limit
3. **Set appropriate timeouts** - Some requests may take time
4. **Cache when possible** - Reduce API calls for repeated requests
5. **Monitor usage** - Track API costs across providers

## Troubleshooting

### "API Key is required" error
- Make sure you've set the correct environment variable for your chosen provider
- Restart your dev server after changing environment variables

### "Unsupported AI provider type" error
- Check that `NEXT_PUBLIC_AI_PROVIDER` is set to one of: `gemini`, `openai`, or `anthropic`

### JSON parsing errors
- Anthropic doesn't have native JSON mode, so responses may need extra parsing
- The abstraction handles this automatically, but check the response format if issues occur


# AI Models Configuration Guide

## Current Models in Use

Based on your `.env.local` configuration:

### Gemini (Default Provider)
- **Model**: `gemini-2.5-flash-preview-09-2025`
- **Configurable via**: `NEXT_PUBLIC_GEMINI_MODEL`

### OpenAI
- **Model**: `gpt-4o`
- **Configurable via**: `NEXT_PUBLIC_OPENAI_MODEL`

### Anthropic
- **Default Model**: `claude-3-5-sonnet-20241022` (if not specified)
- **Configurable via**: `NEXT_PUBLIC_ANTHROPIC_MODEL`

## How Models Are Configured

### 1. Environment Variables (Recommended)

Set in `.env.local`:

```env
# For Gemini
NEXT_PUBLIC_GEMINI_MODEL=gemini-2.5-flash-preview-09-2025

# For OpenAI
NEXT_PUBLIC_OPENAI_MODEL=gpt-4o

# For Anthropic
NEXT_PUBLIC_ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

### 2. Per-Request Override

You can override the model for a specific request:

```typescript
import { getDefaultAIProvider } from '@/lib/ai';

const provider = getDefaultAIProvider();

// Use a different model for this specific call
const result = await provider.generateJSON(prompt, {
  model: 'gpt-4-turbo', // Override default
  temperature: 0.7,
});
```

### 3. Programmatic Provider Creation

```typescript
import { createAIProvider } from '@/lib/ai';

const provider = createAIProvider({
  type: 'openai',
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4-turbo', // Specify model here
});
```

## Available Models by Provider

### Gemini Models
- `gemini-2.5-flash-preview-09-2025` (current default)
- `gemini-1.5-pro`
- `gemini-1.5-flash`
- `gemini-pro`
- `gemini-pro-vision`

### OpenAI Models
- `gpt-4o` (current default) - Latest, fastest, most capable
- `gpt-4-turbo` - High performance
- `gpt-4` - Original GPT-4
- `gpt-3.5-turbo` - Faster, cheaper option
- `gpt-4o-mini` - Smaller, faster, cheaper

### Anthropic Models
- `claude-3-5-sonnet-20241022` (current default) - Latest, most capable
- `claude-3-opus-20240229` - Most powerful
- `claude-3-sonnet-20240229` - Balanced
- `claude-3-haiku-20240307` - Fastest, cheapest

## Changing Your Current Model

To change the Gemini model (since that's your default), edit `.env.local`:

```env
NEXT_PUBLIC_GEMINI_MODEL=gemini-1.5-pro
```

Then restart your dev server.

## Model Selection Tips

### For Speed & Cost
- **Gemini**: `gemini-1.5-flash`
- **OpenAI**: `gpt-4o-mini` or `gpt-3.5-turbo`
- **Anthropic**: `claude-3-haiku-20240307`

### For Quality
- **Gemini**: `gemini-2.5-flash-preview-09-2025` or `gemini-1.5-pro`
- **OpenAI**: `gpt-4o` or `gpt-4-turbo`
- **Anthropic**: `claude-3-5-sonnet-20241022` or `claude-3-opus-20240229`

### For Vision/Image Analysis
- **Gemini**: `gemini-1.5-pro` or `gemini-pro-vision`
- **OpenAI**: `gpt-4o` (has vision)
- **Anthropic**: All Claude 3 models support vision

## Default Models (if not specified)

If you don't set a model in environment variables, these defaults are used:

- **Gemini**: `gemini-2.5-flash-preview-09-2025`
- **OpenAI**: `gpt-4o`
- **Anthropic**: `claude-3-5-sonnet-20241022`


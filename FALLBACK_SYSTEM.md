# AI Model Fallback System

## Overview

The LearnLoop application now includes an intelligent cost-optimization system that automatically starts with the cheapest AI model and upgrades to better models only if the output quality is unsatisfactory.

## How It Works

### 1. Model Tier System

Models are organized into tiers by cost (cheapest first):

**Tier 1 - Cheapest (Cost: 1-3)**
- `gemini-1.5-flash` (Gemini)
- `gpt-4o-mini` (OpenAI)
- `claude-3-haiku-20240307` (Anthropic)

**Tier 2 - Mid-Range (Cost: 4-6)**
- `gemini-2.5-flash-preview-09-2025` (Gemini)
- `gpt-3.5-turbo` (OpenAI)
- `gemini-1.5-pro` (Gemini)

**Tier 3 - Premium (Cost: 7-8)**
- `gpt-4o` (OpenAI)
- `claude-3-5-sonnet-20241022` (Anthropic)

**Tier 4 - Best Quality (Cost: 9-10)**
- `gpt-4-turbo` (OpenAI)
- `claude-3-opus-20240229` (Anthropic)

### 2. Automatic Fallback Process

1. **Start with cheapest model** that has an available API key
2. **Generate content** using that model
3. **Check quality** using built-in quality checks:
   - Valid JSON structure
   - Non-empty response
   - Meaningful content (not just placeholders)
   - Expected fields present
4. **If quality is acceptable** (score ≥ 6/10): Return result
5. **If quality is insufficient**: Try next cheapest model
6. **Repeat** until quality is acceptable or max attempts reached

### 3. Quality Scoring

The system evaluates:
- **Structure** (2 points): Has expected JSON structure
- **Metadata** (1 point): Includes title, concepts, etc.
- **Content** (base 5 points): Meaningful, non-empty content
- **Minimum threshold**: 6/10 to be considered acceptable

## User Experience

### Transparent Process

The UI shows:
- **During generation**: "Trying cheapest model first..."
- **After success**: "✓ Generated using gemini/gemini-1.5-flash (Quality: 8/10)"
- **Model used**: Automatically displayed after generation

### No User Action Required

- Users just click "Generate" as normal
- System automatically optimizes for cost
- Only upgrades if needed
- Seamless experience

## Configuration

### Default Settings

```typescript
{
  minQualityScore: 6,  // Minimum acceptable quality (1-10)
  maxAttempts: 3,      // Maximum models to try
}
```

### Customization

You can customize the fallback behavior:

```typescript
import { generateWithFallback } from '@/lib/ai/fallback';

const result = await generateWithFallback(prompt, {
  apiKeys: {
    gemini: process.env.GEMINI_KEY,
    openai: process.env.OPENAI_KEY,
  },
  minQualityScore: 7,  // Require higher quality
  maxAttempts: 5,      // Try more models
  qualityCheck: customQualityCheck, // Custom quality function
  onAttempt: (tier, attempt) => {
    console.log(`Trying ${tier.provider}/${tier.model} (attempt ${attempt})`);
  },
});
```

## Cost Savings

### Example Scenario

**Without Fallback:**
- Always uses `gpt-4o` (premium model)
- Cost: ~$0.03 per request

**With Fallback:**
- 80% of requests succeed with `gemini-1.5-flash` (cheapest)
- Cost: ~$0.0001 per request
- 20% need upgrade to `gpt-4o`
- **Average cost: ~$0.006 per request (80% savings!)**

## Quality Assurance

The system ensures:
- ✅ Never returns low-quality results
- ✅ Automatically upgrades when needed
- ✅ Falls back gracefully if all models fail
- ✅ Provides quality scores for transparency

## API Integration

All AI generation endpoints automatically use the fallback system:

- `/api/admin/templates/generate-structure` - Template generation
- `/api/admin/templates/[id]/generate` - Question generation
- `/api/reviewer/questions/[id]/evaluate` - Question evaluation

## Benefits

1. **Cost Optimization**: Start cheap, upgrade only when needed
2. **Quality Assurance**: Never compromise on output quality
3. **Transparency**: Users see which model was used
4. **Reliability**: Automatic fallback if a model fails
5. **Flexibility**: Easy to add new models or adjust tiers

## Future Enhancements

Potential improvements:
- Learning from past quality scores
- Per-user model preferences
- Cost tracking and reporting
- Custom quality check functions per use case
- A/B testing different model combinations


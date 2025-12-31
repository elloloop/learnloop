import { NextRequest, NextResponse } from 'next/server';
import { generateWithFallback } from '@/lib/ai/fallback';

export async function POST(request: NextRequest) {
  try {
    const { topic, imageBase64 } = await request.json();

    if (!topic && !imageBase64) {
      return NextResponse.json(
        { error: 'Topic or image required' },
        { status: 400 }
      );
    }

    let prompt = '';
    if (imageBase64) {
      prompt = `
        Analyze this image of a question. Extract the underlying concept, structure, and variables.
        Topic hint: "${topic || ''}".
      `;
    } else {
      prompt = `Create a detailed question template for the topic: "${topic}". Think of this as "Question as Code".`;
    }

    prompt += `
      Return a JSON object with:
      - title: Short title.
      - templateText: The primary question text with variables in {curly} braces.
      - variants: An array of strings (at least 2) with alternative phrasings of the same question using the same variables.
      - answerFunction: A valid JavaScript function body string (NO markdown, just code) that calculates the answer. 
           It has access to a 'values' object (e.g., 'const {a,b} = values; return a+b;').
      - variables: Array of objects [{ name, type ("number"|"text"|"choice"), min, max, precision, options }].
      - concepts: Array of strings.
      - curriculumTags: Array of objects with { subject (Mathetmatics, Science, etc), yearGroup (e.g. "Year 9", "Year 12"), topicPath (Array of strings e.g. ["Algebra", "Linear Equations"]) }.
           IMPORTANT: For yearGroup, strictly use UK format "Year X" (1-13).
    `;

    // Get API keys
    const apiKeys = {
      gemini: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
      openai: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      anthropic: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
    };

    // Use fallback system - starts with cheapest model
    const fallbackResult = await generateWithFallback(prompt, {
      imageBase64: imageBase64 || undefined,
      apiKeys,
      minQualityScore: 6,
      maxAttempts: 3,
    });

    if (!fallbackResult.result) {
      return NextResponse.json(
        { error: 'Failed to generate structure' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      structure: fallbackResult.result,
      modelUsed: fallbackResult.modelUsed,
      provider: fallbackResult.provider,
      attempts: fallbackResult.attempts,
      qualityScore: fallbackResult.qualityScore,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


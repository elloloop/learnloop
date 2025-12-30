import { NextRequest, NextResponse } from 'next/server';
import { getTemplate } from '@/lib/db-helpers-mongo';
import { generateLocalInstances } from '@/lib/question-generator';
import { createQuestion, createVariation } from '@/lib/db-helpers-mongo';
import { generateWithFallback } from '@/lib/ai/fallback';
import { GeneratedQuestion } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { count = 5, variationText } = await request.json();
    const templateId = params.id;

    const template = await getTemplate(templateId);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const variation = variationText || template.templateText;
    let variationId: string | undefined;

    // Check if this variation already exists, if not create it
    if (variationText && variationText !== template.templateText) {
      variationId = await createVariation({
        templateId,
        variationText,
        status: 'pending',
      });
    }

    let questions: Omit<GeneratedQuestion, 'id'>[] = [];
    let fallbackResult: any = null;

    // Use local generation if answerFunction exists
    if (template.answerFunction && template.answerFunction.trim().length > 0) {
      questions = generateLocalInstances(template, variation, count);
    } else {
      // Use AI generation with fallback
      const prompt = `
        I have a question template.
        Template Text: "${variation}"
        Variables Schema: ${JSON.stringify(template.variables)}
        Please generate ${count} distinct, solvable, valid instances.
        Return JSON { "instances": [{ "values": {...}, "questionText": "...", "answer": "..." }] }
      `;

      const apiKeys = {
        gemini: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
        openai: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        anthropic: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
      };

      fallbackResult = await generateWithFallback(prompt, {
        apiKeys,
        minQualityScore: 6,
        maxAttempts: 3,
      });

      const result = fallbackResult.result;
      if (result && result.instances) {
        questions = result.instances.map((inst: any) => ({
          id: crypto.randomUUID(),
          templateId,
          variationId,
          questionText: inst.questionText,
          values: inst.values,
          concepts: template.concepts,
          curriculumTags: template.curriculumTags,
          calculatedAnswer: inst.answer,
          status: 'pending' as const,
          createdAt: new Date(),
          attemptCount: 0,
        }));
      } else {
        return NextResponse.json(
          { error: 'Failed to generate questions' },
          { status: 500 }
        );
      }
    }

    // Save all questions
    const questionIds: string[] = [];
    for (const q of questions) {
      const id = await createQuestion(q);
      questionIds.push(id);
    }

    return NextResponse.json({
      questions: questions.map((q, i) => ({ ...q, id: questionIds[i] })),
      // Include fallback info if AI was used
      ...(fallbackResult && {
        modelUsed: fallbackResult.modelUsed,
        provider: fallbackResult.provider,
        attempts: fallbackResult.attempts,
        qualityScore: fallbackResult.qualityScore,
      }),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


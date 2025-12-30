import { NextRequest, NextResponse } from 'next/server';
import { getQuestions, updateQuestion } from '@/lib/db-helpers-mongo';
import { generateWithFallback } from '@/lib/ai/fallback';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const questionId = params.id;
    const questions = await getQuestions({});
    const question = questions.find((q) => q.id === questionId);

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const prompt = `Evaluate this question: "${question.questionText}". 
      Consider: clarity, solvability, educational value, age-appropriateness.
      Return JSON { "score": number (1-10), "isSolvable": boolean, "feedback": "string", "isValid": boolean }`;

    const apiKeys = {
      gemini: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
      openai: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      anthropic: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
    };

    const fallbackResult = await generateWithFallback(prompt, {
      apiKeys,
      minQualityScore: 6,
      maxAttempts: 2, // Faster for evaluation
    });

    const evaluation = fallbackResult.result;

    if (evaluation) {
      await updateQuestion(questionId, {
        status: evaluation.isValid ? 'approved' : 'rejected',
        reviewedAt: new Date(),
        rejectionReason: evaluation.isValid ? undefined : evaluation.feedback,
      });

      return NextResponse.json({ evaluation });
    }

    return NextResponse.json(
      { error: 'Failed to evaluate question' },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


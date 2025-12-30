import { NextRequest, NextResponse } from 'next/server';
import { getQuestions, updateQuestion, deleteQuestion } from '@/lib/db-helpers-mongo';
import { getVariations, deleteVariation, updateVariation } from '@/lib/db-helpers-mongo';
import { getTemplate, deleteTemplate } from '@/lib/db-helpers-mongo';
import { createReview } from '@/lib/db-helpers-mongo';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const templateId = searchParams.get('templateId') || undefined;
    const variationId = searchParams.get('variationId') || undefined;
    const status = searchParams.get('status') || 'pending';

    const questions = await getQuestions({ templateId, variationId, status });
    return NextResponse.json({ questions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { questionId, reviewerId, reviewerType, isValid, score, feedback } =
      await request.json();

    if (!questionId || reviewerId === undefined || isValid === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create review record
    await createReview({
      questionId,
      reviewerId,
      reviewerType: reviewerType || 'human',
      isValid,
      score,
      feedback: feedback || '',
    });

    // Update question status
    await updateQuestion(questionId, {
      status: isValid ? 'approved' : 'rejected',
      reviewedAt: new Date(),
      reviewerId,
      rejectionReason: isValid ? undefined : feedback,
    });

    // If invalid, check cascading deletion
    if (!isValid) {
      await handleCascadingDeletion(questionId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleCascadingDeletion(questionId: string) {
  const { getQuestions, getVariations, getTemplate } = await import(
    '@/lib/db-helpers-mongo'
  );

  // Get the question
  const questions = await getQuestions({});
  const question = questions.find((q) => q.id === questionId);
  if (!question) return;

  // Delete the question
  await deleteQuestion(questionId);

  // Check if variation should be deleted
  if (question.variationId) {
    const variationQuestions = await getQuestions({
      variationId: question.variationId,
    });
    const validQuestions = variationQuestions.filter(
      (q) => q.status === 'approved' && q.id !== questionId
    );

    // If no valid questions remain, delete variation
    if (validQuestions.length === 0) {
      await deleteVariation(question.variationId);

      // Check if template should be deleted
      const template = await getTemplate(question.templateId);
      if (template) {
        const allVariations = await getVariations(question.templateId);
        const allTemplateQuestions = await getQuestions({
          templateId: question.templateId,
        });
        const validTemplateQuestions = allTemplateQuestions.filter(
          (q) => q.status === 'approved'
        );

        // If no valid questions remain, delete template
        if (validTemplateQuestions.length === 0) {
          await deleteTemplate(question.templateId);
        }
      }
    }
  } else {
    // No variation, check template directly
    const template = await getTemplate(question.templateId);
    if (template) {
      const allTemplateQuestions = await getQuestions({
        templateId: question.templateId,
      });
      const validTemplateQuestions = allTemplateQuestions.filter(
        (q) => q.status === 'approved' && q.id !== questionId
      );

      // If no valid questions remain, delete template
      if (validTemplateQuestions.length === 0) {
        await deleteTemplate(question.templateId);
      }
    }
  }
}


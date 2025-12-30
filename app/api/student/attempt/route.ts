import { NextRequest, NextResponse } from 'next/server';
import {
  createAttempt,
  updateQuestion,
  updateSession,
  updateProgress,
} from '@/lib/db-helpers-mongo';
import { getQuestions } from '@/lib/db-helpers-mongo';

export async function POST(request: NextRequest) {
  try {
    const { studentId, questionId, sessionId, answer, timeSpent } =
      await request.json();

    if (!studentId || !questionId || answer === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get question to check answer
    const questions = await getQuestions({});
    const question = questions.find((q) => q.id === questionId);

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Check if answer is correct
    const isCorrect = Boolean(
      question.calculatedAnswer &&
      String(answer).trim().toLowerCase() ===
        String(question.calculatedAnswer).trim().toLowerCase()
    );

    // Create attempt record
    await createAttempt({
      studentId,
      questionId,
      answer: String(answer),
      isCorrect,
      timeSpent: timeSpent || 0,
    });

    // Update question attempt count
    await updateQuestion(questionId, {
      attemptCount: (question.attemptCount || 0) + 1,
      lastAttemptedAt: new Date(),
    });

    // Update progress for each curriculum tag
    for (const tag of question.curriculumTags) {
      await updateProgress(studentId, tag.id, isCorrect);
    }

    // Update session if provided
    if (sessionId) {
      // Get current session to calculate score
      // This is simplified - in production you'd want to track session state better
      // For now, we'll just mark it as in progress still
    }

    return NextResponse.json({
      success: true,
      isCorrect,
      correctAnswer: question.calculatedAnswer,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


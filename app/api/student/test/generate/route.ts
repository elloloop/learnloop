import { NextRequest, NextResponse } from 'next/server';
import {
  getQuestions,
  getStudentAttempts,
  createSession,
} from '@/lib/db-helpers-mongo';
import { getStudentProgress } from '@/lib/db-helpers-mongo';
import { CurriculumTag } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { studentId, curriculumTags, questionCount = 10 } = await request.json();

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
    }

    // Get all attempted question IDs
    const attempts = await getStudentAttempts(studentId);
    const attemptedQuestionIds = new Set(attempts.map((a) => a.questionId));

    // Get student progress to prioritize weak areas
    const progress = await getStudentProgress(studentId);
    const progressMap = new Map(
      progress.map((p) => [p.curriculumTagId, p])
    );

    // Get approved questions
    let allQuestions = await getQuestions({ status: 'approved' });

    // Filter by curriculum tags if provided
    if (curriculumTags && curriculumTags.length > 0) {
      allQuestions = allQuestions.filter((q) =>
        q.curriculumTags.some((tag) =>
          curriculumTags.some(
            (ct: CurriculumTag) =>
              ct.subject === tag.subject &&
              ct.yearGroup === tag.yearGroup &&
              ct.topicPath?.[0] === tag.topicPath?.[0]
          )
        )
      );
    }

    // Remove already attempted questions
    const unattempted = allQuestions.filter(
      (q) => !attemptedQuestionIds.has(q.id)
    );

    // Prioritize questions based on student progress
    // Focus on areas where student is not yet mastered
    const prioritized = unattempted.sort((a, b) => {
      const aTags = a.curriculumTags.map((t) => t.id);
      const bTags = b.curriculumTags.map((t) => t.id);

      const aMinMastery = Math.min(
        ...aTags.map((tagId) => {
          const p = progressMap.get(tagId);
          if (!p) return 0; // New topic, prioritize
          const masteryScore =
            p.masteryLevel === 'mastered'
              ? 4
              : p.masteryLevel === 'proficient'
              ? 3
              : p.masteryLevel === 'developing'
              ? 2
              : 1;
          return masteryScore;
        })
      );

      const bMinMastery = Math.min(
        ...bTags.map((tagId) => {
          const p = progressMap.get(tagId);
          if (!p) return 0;
          const masteryScore =
            p.masteryLevel === 'mastered'
              ? 4
              : p.masteryLevel === 'proficient'
              ? 3
              : p.masteryLevel === 'developing'
              ? 2
              : 1;
          return masteryScore;
        })
      );

      return aMinMastery - bMinMastery; // Lower mastery = higher priority
    });

    // Select questions
    const selectedQuestions = prioritized.slice(0, questionCount);

    // Create test session
    const sessionId = await createSession({
      studentId,
      curriculumTags: curriculumTags || [],
      questions: selectedQuestions.map((q) => q.id),
      status: 'in_progress',
    });

    return NextResponse.json({
      sessionId,
      questions: selectedQuestions,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


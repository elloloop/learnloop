'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { canAccessReviewer, OWNER_EMAIL } from '@/lib/auth';
import { getPrimaryRole } from '@/types';
import Link from 'next/link';
import { UserRole } from '@/types';
import {
  Shield,
  CheckCircle,
  XCircle,
  Brain,
  ArrowLeft,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { GeneratedQuestion } from '@/types';

export default function ReviewerPage() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewScore, setReviewScore] = useState(5);

  const router = useRouter();

  useEffect(() => {
    if (!auth) {
      router.push('/');
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        try {
          const idToken = await firebaseUser.getIdToken();
          const roleResponse = await fetch('/api/auth/user-role', {
            headers: {
              'Authorization': `Bearer ${idToken}`,
            },
          });
          
          if (roleResponse.ok) {
            const data = await roleResponse.json();
            const roles = data.roles || [data.primaryRole] || [];
            const primaryRole = getPrimaryRole(roles);
            setUserRole(primaryRole);
            
            // Only owner, admin, and reviewer can access this page
            if (!canAccessReviewer(roles)) {
              router.push('/');
              return;
            }
          } else {
            // Fallback: check owner email
            const fallbackRoles: UserRole[] = (OWNER_EMAIL && firebaseUser.email === OWNER_EMAIL) ? ['owner'] : ['parent'];
            const fallbackRole = getPrimaryRole(fallbackRoles);
            setUserRole(fallbackRole);
            if (!canAccessReviewer(fallbackRoles)) {
              router.push('/');
              return;
            }
          }
        } catch (error) {
          console.error('Error getting user role:', error);
          router.push('/');
        }
      } else {
        router.push('/');
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (user) {
      loadPendingQuestions();
    }
  }, [user]);

  const loadPendingQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reviewer/questions?status=pending');
      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (error) {
      console.error('Failed to load questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (isValid: boolean) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    try {
      setLoading(true);
      await fetch('/api/reviewer/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          reviewerId: user?.uid || 'reviewer',
          reviewerType: 'human',
          isValid,
          score: isValid ? reviewScore : undefined,
          feedback: reviewFeedback,
        }),
      });

      await loadPendingQuestions();
      // Move to next question or reset if no more questions
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        setCurrentQuestionIndex(0);
      }
      setReviewFeedback('');
      setReviewScore(5);
    } catch (error) {
      console.error('Review failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAIEvaluate = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/reviewer/questions/${currentQuestion.id}/evaluate`,
        {
          method: 'POST',
        }
      );
      const data = await response.json();
      if (data.evaluation) {
        await loadPendingQuestions();
      }
    } catch (error) {
      console.error('AI evaluation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setReviewFeedback('');
      setReviewScore(5);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setReviewFeedback('');
      setReviewScore(5);
    }
  };

  if (!user || !userRole || (userRole !== 'owner' && userRole !== 'admin' && userRole !== 'reviewer')) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex] || null;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2 text-amber-600 mb-1">
            <Shield size={24} />
            <span className="font-bold text-lg tracking-tight">LearnLoop</span>
          </Link>
          <p className="text-xs text-slate-500">Reviewer Portal</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold text-amber-900 mb-2">
              Review Queue
            </h3>
            <p className="text-2xl font-bold text-amber-700">
              {questions.length}
            </p>
            <p className="text-xs text-amber-600 mt-1">Pending questions</p>
          </div>

          <button
            onClick={loadPendingQuestions}
            className="w-full py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center justify-center gap-2"
          >
            <Loader2 size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-16 bg-white border-b border-slate-200 flex items-center px-6 justify-between">
          <div className="flex items-center gap-4">
            <button
              className="text-slate-500"
              onClick={() => router.push('/')}
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-lg font-semibold text-slate-800">
              Question Review
            </h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {questions.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">
                All caught up!
              </h3>
              <p className="text-slate-500">
                No pending questions to review.
              </p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              {/* Question Counter */}
              <div className="mb-6 flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNextQuestion}
                    disabled={currentQuestionIndex === questions.length - 1}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>

              {/* Current Question Review Panel */}
              {currentQuestion && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-800">
                      Review Question
                    </h3>
                    <button
                      onClick={handleAIEvaluate}
                      disabled={loading}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Brain size={16} /> AI Evaluate
                    </button>
                  </div>

                    <div className="bg-slate-50 rounded-lg p-4 mb-4">
                      <p className="text-slate-800 font-medium mb-3">
                        {currentQuestion.questionText}
                      </p>
                      <div className="text-xs text-slate-600 space-y-1">
                        <div>
                          <span className="font-semibold">Values:</span>{' '}
                          {JSON.stringify(currentQuestion.values)
                            .replace(/"/g, '')
                            .replace(/{|}/g, '')}
                        </div>
                        <div>
                          <span className="font-semibold">Answer:</span>{' '}
                          <span className="font-mono">
                            {currentQuestion.calculatedAnswer}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold">Concepts:</span>{' '}
                          {currentQuestion.concepts.join(', ')}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Quality Score (1-10)
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={reviewScore}
                          onChange={(e) =>
                            setReviewScore(parseInt(e.target.value))
                          }
                          className="w-full"
                        />
                        <div className="text-center text-sm text-slate-600 mt-1">
                          {reviewScore}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Feedback
                        </label>
                        <textarea
                          value={reviewFeedback}
                          onChange={(e) => setReviewFeedback(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-indigo-500"
                          rows={4}
                          placeholder="Add your feedback here..."
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleReview(true)}
                          disabled={loading}
                          className="flex-1 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={18} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReview(false)}
                          disabled={loading}
                          className="flex-1 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <XCircle size={18} />
                          Reject
                        </button>
                      </div>

                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle
                            size={16}
                            className="text-amber-600 mt-0.5"
                          />
                          <div className="text-xs text-amber-800">
                            <strong>Note:</strong> Rejecting a question will
                            trigger cascading deletion. If all questions from a
                            variation are rejected, the variation will be deleted.
                            If all variations are rejected, the template will be
                            deleted.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


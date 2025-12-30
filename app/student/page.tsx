'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import {
  GraduationCap,
  Play,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Loader2,
  Trophy,
  BarChart3,
} from 'lucide-react';
import { GeneratedQuestion, TestSession } from '@/types';

export default function StudentPage() {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<TestSession | null>(null);
  const [currentQuestion, setCurrentQuestion] =
    useState<GeneratedQuestion | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const router = useRouter();

  useEffect(() => {
    if (!auth) {
      // Don't auto-login, redirect to home
      router.push('/');
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        router.push('/');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const generateTest = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/student/test/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user?.uid || 'student',
          questionCount: 10,
        }),
      });

      const data = await response.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setCurrentQuestion(data.questions[0]);
        setCurrentQuestionIndex(0);
        setSession({
          id: data.sessionId,
          studentId: user?.uid || 'student',
          curriculumTags: [],
          questions: data.questions.map((q: GeneratedQuestion) => q.id),
          startedAt: new Date(),
          status: 'in_progress',
        });
        setScore({ correct: 0, total: 0 });
        setShowResult(false);
      }
    } catch (error) {
      console.error('Failed to generate test:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!currentQuestion || !userAnswer.trim()) return;

    try {
      setLoading(true);
      const response = await fetch('/api/student/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user?.uid || 'student',
          questionId: currentQuestion.id,
          sessionId: session?.id,
          answer: userAnswer,
          timeSpent: 0, // Could track actual time
        }),
      });

      const data = await response.json();
      setIsCorrect(data.isCorrect);
      setShowResult(true);
      setScore({
        correct: score.correct + (data.isCorrect ? 1 : 0),
        total: score.total + 1,
      });
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setCurrentQuestion(questions[nextIndex]);
      setUserAnswer('');
      setShowResult(false);
    } else {
      // Test complete
      setSession(null);
      setCurrentQuestion(null);
      setQuestions([]);
      setCurrentQuestionIndex(0);
    }
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <Link
            href="/"
            className="flex items-center gap-2 text-green-600 mb-1"
          >
            <GraduationCap size={24} />
            <span className="font-bold text-lg tracking-tight">LearnLoop</span>
          </Link>
          <p className="text-xs text-slate-500">Student Portal</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {session && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-semibold text-green-900 mb-2">
                Test Progress
              </h3>
              <div className="text-2xl font-bold text-green-700">
                {score.correct} / {score.total}
              </div>
              <p className="text-xs text-green-600 mt-1">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <button
              onClick={generateTest}
              disabled={loading || !!session}
              className="w-full py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Play size={18} />
              {session ? 'Test in Progress' : 'Start Practice Test'}
            </button>
          </div>
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
              Practice Questions
            </h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!session ? (
            <div className="max-w-2xl mx-auto">
              <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                <Trophy className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-1">
                  Ready to Practice?
                </h3>
                <p className="text-slate-500 mb-6">
                  Generate a practice test with questions tailored to your
                  learning level.
                </p>
                <button
                  onClick={generateTest}
                  disabled={loading}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 mx-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Play size={18} />
                      Start Test
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : currentQuestion ? (
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-slate-600 mb-2">
                    <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                    <span>
                      Score: {score.correct} / {score.total}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Question */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    {currentQuestion.questionText}
                  </h2>
                </div>

                {/* Answer Input */}
                {!showResult ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Your Answer
                      </label>
                      <input
                        type="text"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            submitAnswer();
                          }
                        }}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-lg"
                        placeholder="Enter your answer..."
                        autoFocus
                      />
                    </div>
                    <button
                      onClick={submitAnswer}
                      disabled={loading || !userAnswer.trim()}
                      className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          Checking...
                        </>
                      ) : (
                        'Submit Answer'
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div
                      className={`p-4 rounded-lg border-2 ${
                        isCorrect
                          ? 'bg-green-50 border-green-500'
                          : 'bg-red-50 border-red-500'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {isCorrect ? (
                          <>
                            <CheckCircle className="text-green-600" size={24} />
                            <span className="text-lg font-bold text-green-700">
                              Correct!
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="text-red-600" size={24} />
                            <span className="text-lg font-bold text-red-700">
                              Incorrect
                            </span>
                          </>
                        )}
                      </div>
                      {!isCorrect && (
                        <p className="text-slate-700 mt-2">
                          The correct answer is:{' '}
                          <span className="font-mono font-bold">
                            {currentQuestion.calculatedAnswer}
                          </span>
                        </p>
                      )}
                    </div>

                    <button
                      onClick={nextQuestion}
                      className="w-full py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
                    >
                      {currentQuestionIndex < questions.length - 1
                        ? 'Next Question'
                        : 'Finish Test'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto text-center py-20 bg-white rounded-xl border border-slate-200">
              <Trophy className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">
                Test Complete!
              </h3>
              <p className="text-slate-500 mb-6">
                You scored {score.correct} out of {score.total} questions.
              </p>
              <button
                onClick={generateTest}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700"
              >
                Start New Test
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


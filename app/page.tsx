'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getDefaultPortal } from '@/lib/get-default-portal';
import Link from 'next/link';
import { Brain, Shield, GraduationCap, LogOut, User, Users, BookOpen, Loader2 } from 'lucide-react';
import Auth from '@/components/Auth';
import { UserRole, getPrimaryRole } from '@/types';
import { hasRole, hasAnyRole, canAccessStudent, OWNER_EMAIL } from '@/lib/auth';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [isStudent, setIsStudent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [onboardingStudent, setOnboardingStudent] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!auth) {
      console.warn('Firebase not configured. Running in demo mode.');
      setUser(null);
      setUserRoles([]);
      setShowAuth(true);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[Auth] Auth state changed:', firebaseUser ? firebaseUser.email : 'signed out');
      
      if (firebaseUser) {
        setUser(firebaseUser);
        
        try {
          const idToken = await firebaseUser.getIdToken();
          
          // Get user roles from API
          const roleResponse = await fetch('/api/auth/user-role', {
            headers: {
              'Authorization': `Bearer ${idToken}`,
            },
          });
          
          if (roleResponse.ok) {
            const data = await roleResponse.json();
            const roles = data.roles || [data.primaryRole] || ['parent'];
            console.log('[Auth] User roles:', roles, 'for email:', firebaseUser.email);
            setUserRoles(roles);
            setIsStudent(data.isStudent || roles.includes('student'));
            
            // Update last login
            try {
              await fetch('/api/auth/update-last-login', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${idToken}`,
                },
              });
            } catch (error) {
              console.error('Failed to update last login:', error);
            }
            
            // Don't auto-redirect - let user choose their portal
          } else {
            console.error('[Auth] Failed to get user role from API');
            const fallbackRoles: UserRole[] = (OWNER_EMAIL && firebaseUser.email === OWNER_EMAIL)
              ? ['owner'] 
              : ['parent'];
            setUserRoles(fallbackRoles);
            setIsStudent(false);
          }
        } catch (error) {
          console.error('[Auth] Error getting ID token:', error);
          const fallbackRoles: UserRole[] = (OWNER_EMAIL && firebaseUser.email === OWNER_EMAIL)
            ? ['owner'] 
            : ['parent'];
            setUserRoles(fallbackRoles);
            setIsStudent(false);
        }
        
        setShowAuth(false);
      } else {
        console.log('[Auth] No user, showing auth screen');
        setUser(null);
        setUserRoles([]);
        setIsStudent(false);
        setShowAuth(true);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    if (!auth) {
      setUser(null);
      setUserRoles([]);
      setShowAuth(true);
      return;
    }

    try {
      await signOut(auth);
      setUser(null);
      setUserRoles([]);
      setShowAuth(true);
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
      setUser(null);
      setUserRoles([]);
      setShowAuth(true);
      window.location.href = '/';
    }
  };

  const handleStartPracticing = async () => {
    if (!user) return;
    
    // If already a student, just go to student portal
    if (isStudent) {
      router.push('/student');
      return;
    }
    
    // Otherwise, onboard as student
    setOnboardingStudent(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/auth/add-student-role', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserRoles(data.roles);
        setIsStudent(true);
        router.push('/student');
      } else {
        alert('Failed to enable practice mode. Please try again.');
      }
    } catch (error) {
      console.error('Failed to add student role:', error);
      alert('Failed to enable practice mode. Please try again.');
    } finally {
      setOnboardingStudent(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (showAuth || !user) {
    return <Auth onAuthSuccess={() => setShowAuth(false)} />;
  }

  const primaryRole = getPrimaryRole(userRoles);
  const canAdmin = hasAnyRole(userRoles, ['owner', 'admin']);
  const canReview = hasAnyRole(userRoles, ['owner', 'admin', 'reviewer']);
  const canParent = hasAnyRole(userRoles, ['owner', 'admin', 'parent']);
  const isChild = hasRole(userRoles, 'child');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header with user info */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Brain className="text-indigo-600" size={32} />
            <h1 className="text-3xl font-bold text-slate-900">LearnLoop</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-600">
              <User size={18} />
              <span className="text-sm">
                {user.displayName || user.email || 'User'}
              </span>
              <div className="flex gap-1">
                {userRoles.map((role) => (
                  <span
                    key={role}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      role === 'owner'
                        ? 'bg-yellow-100 text-yellow-700'
                        : role === 'admin'
                        ? 'bg-indigo-100 text-indigo-700'
                        : role === 'reviewer'
                        ? 'bg-amber-100 text-amber-700'
                        : role === 'parent'
                        ? 'bg-green-100 text-green-700'
                        : role === 'child'
                        ? 'bg-sky-100 text-sky-700'
                        : role === 'student'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
            >
              <LogOut size={18} />
              <span className="text-sm">Sign Out</span>
            </button>
          </div>
        </div>

        <div className="text-center mb-16">
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Question Generation & Practice Platform
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {/* Admin Portal - Owner and Admin only */}
          {canAdmin && (
            <Link
              href="/admin"
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-slate-200"
            >
              <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <Brain className="text-indigo-600" size={28} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Admin Portal
              </h2>
              <p className="text-sm text-slate-600">
                Manage templates, questions, users, and curriculum
              </p>
            </Link>
          )}

          {/* Reviewer Portal - Owner, Admin, and Reviewer */}
          {canReview && (
            <Link
              href="/reviewer"
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-slate-200"
            >
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="text-amber-600" size={28} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Reviewer Portal
              </h2>
              <p className="text-sm text-slate-600">
                Validate and review generated questions
              </p>
            </Link>
          )}

          {/* Parent Portal - Owner, Admin, and Parent (not for children) */}
          {canParent && !isChild && (
            <Link
              href="/parent"
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-slate-200"
            >
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Users className="text-green-600" size={28} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Parent Portal
              </h2>
              <p className="text-sm text-slate-600">
                Manage children and view their progress
              </p>
            </Link>
          )}

          {/* Practice Portal - Requires student role (onboard if not) */}
          {isStudent ? (
            <Link
              href="/student"
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-slate-200"
            >
              <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <GraduationCap className="text-purple-600" size={28} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Practice
              </h2>
              <p className="text-sm text-slate-600">
                Practice questions with adaptive learning
              </p>
            </Link>
          ) : (
            <button
              onClick={handleStartPracticing}
              disabled={onboardingStudent}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-slate-200 border-dashed border-2 text-left"
            >
              <div className="w-14 h-14 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                {onboardingStudent ? (
                  <Loader2 className="text-purple-400 animate-spin" size={28} />
                ) : (
                  <BookOpen className="text-purple-400" size={28} />
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Start Practicing
              </h2>
              <p className="text-sm text-slate-600">
                {onboardingStudent
                  ? 'Setting up your practice account...'
                  : 'Click to enable practice mode and start learning'}
              </p>
            </button>
          )}
        </div>

        {/* Role description */}
        <div className="mt-8 text-center text-sm text-slate-500">
          {primaryRole === 'owner' && 'You have full access to all portals as Owner'}
          {primaryRole === 'admin' && 'You have access to all portals except owner-only features'}
          {primaryRole === 'reviewer' && (
            <>You can review questions{isStudent ? ' and practice' : '. Enable practice mode to start learning.'}</>
          )}
          {primaryRole === 'parent' && (
            <>You can manage your children{isStudent ? ' and practice' : '. Enable practice mode to start learning.'}</>
          )}
          {primaryRole === 'child' && (
            <>Your account is managed by your parent{isStudent ? '. Happy practicing!' : '. Enable practice mode to start learning.'}</>
          )}
          {primaryRole === 'student' && 'You can practice questions and track your progress'}
        </div>

        {/* Quick tip for non-students */}
        {!isStudent && (
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              💡 Tip: Click "Start Practicing" to add practice capabilities to your account
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

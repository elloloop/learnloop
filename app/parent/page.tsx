'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { canAccessParent } from '@/lib/auth';
import Link from 'next/link';
import {
  Users,
  Plus,
  ArrowLeft,
  Loader2,
  User as UserIcon,
  BarChart3,
  Eye,
  Key,
  Trash2,
} from 'lucide-react';
import { User, UserRole, ChildAuthMethod } from '@/types';

interface Child extends User {
  authMethod?: ChildAuthMethod;
}

export default function ParentPage() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    authMethod: 'username_child' as ChildAuthMethod,
    password: '',
  });

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
              Authorization: `Bearer ${idToken}`,
            },
          });

          if (roleResponse.ok) {
            const { role } = await roleResponse.json();
            setUserRole(role);

            if (!canAccessParent(role)) {
              router.push('/');
              return;
            }

            loadChildren();
          } else {
            router.push('/');
          }
        } catch (error) {
          console.error('Error getting user role:', error);
          router.push('/');
        }
      } else {
        router.push('/');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const loadChildren = async () => {
    try {
      const response = await fetch('/api/parent/children');
      const data = await response.json();
      setChildren(data.children || []);
    } catch (error) {
      console.error('Failed to load children:', error);
    }
  };

  const handleAddChild = async () => {
    if (!user) return;

    if (!formData.name) {
      alert('Please enter a name for the child');
      return;
    }

    if (formData.authMethod === 'email' && !formData.email) {
      alert('Please enter an email for email-based login');
      return;
    }

    if (formData.authMethod !== 'email' && !formData.username) {
      alert('Please enter a username');
      return;
    }

    try {
      setLoading(true);
      const idToken = await user.getIdToken();

      const response = await fetch('/api/parent/children', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.authMethod === 'email' ? formData.email : undefined,
          username: formData.authMethod !== 'email' ? formData.username : undefined,
          authMethod: formData.authMethod,
          password: formData.authMethod === 'username_parent' ? formData.password : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to create child account');
        return;
      }

      alert(data.message || 'Child account created successfully!');
      setShowAddModal(false);
      setFormData({
        name: '',
        email: '',
        username: '',
        authMethod: 'username_child',
        password: '',
      });
      await loadChildren();
    } catch (error) {
      console.error('Failed to create child:', error);
      alert('Failed to create child account');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (childId: string) => {
    const newPassword = prompt('Enter new password for child:');
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/parent/children/${childId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ password: newPassword }),
      });

      if (response.ok) {
        alert('Password reset successfully');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Failed to reset password:', error);
      alert('Failed to reset password');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-green-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-500 hover:text-slate-700">
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-3">
              <Users className="text-green-600" size={28} />
              <h1 className="text-2xl font-bold text-slate-900">Parent Portal</h1>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus size={18} />
            Add Child
          </button>
        </div>

        {/* Children Grid */}
        {children.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
            <Users className="text-slate-300 mx-auto mb-4" size={48} />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              No Children Added Yet
            </h2>
            <p className="text-slate-500 mb-6">
              Add your children to track their learning progress
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Add Your First Child
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children.map((child) => (
              <div
                key={child.id}
                className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center">
                      <UserIcon className="text-sky-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {child.name || 'Child'}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {child.email || child.username || 'No login set'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="px-2 py-1 bg-slate-100 rounded text-xs">
                      {child.authMethod === 'email' && 'Email login'}
                      {child.authMethod === 'username_parent' && 'Username + Password'}
                      {child.authMethod === 'username_child' && 'Username (sets own password)'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-slate-100">
                  <Link
                    href={`/parent/children/${child.id}/progress`}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <BarChart3 size={16} />
                    Progress
                  </Link>
                  <Link
                    href={`/parent/children/${child.id}/activity`}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <Eye size={16} />
                    Activity
                  </Link>
                  <button
                    onClick={() => handleResetPassword(child.id)}
                    className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    title="Reset Password"
                  >
                    <Key size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Child Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Add Child</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Child's Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter child's name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Login Method
                </label>
                <select
                  value={formData.authMethod}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      authMethod: e.target.value as ChildAuthMethod,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="email">Email-based login</option>
                  <option value="username_parent">
                    Username + Password (you set password)
                  </option>
                  <option value="username_child">
                    Username only (child sets password on first login)
                  </option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  {formData.authMethod === 'email' &&
                    'Child will use their email to sign up and login'}
                  {formData.authMethod === 'username_parent' &&
                    'You set the password, child uses username to login'}
                  {formData.authMethod === 'username_child' &&
                    'Child creates their own password on first login'}
                </p>
              </div>

              {formData.authMethod === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="child@example.com"
                  />
                </div>
              )}

              {formData.authMethod !== 'email' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Choose a username"
                  />
                </div>
              )}

              {formData.authMethod === 'username_parent' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Set initial password"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    You can reset this password anytime
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({
                    name: '',
                    email: '',
                    username: '',
                    authMethod: 'username_child',
                    password: '',
                  });
                }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddChild}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="animate-spin mx-auto" size={18} />
                ) : (
                  'Add Child'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


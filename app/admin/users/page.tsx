'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { canDeleteUser, canAccessAdmin, normalizeRoles, OWNER_EMAIL } from '@/lib/auth';
import Link from 'next/link';
import {
  Users,
  Plus,
  Trash2,
  Edit,
  ArrowLeft,
  Loader2,
  Shield,
  User as UserIcon,
  Mail,
  Crown,
  GraduationCap,
} from 'lucide-react';
import { User, UserRole, getPrimaryRole } from '@/types';

export default function UsersPage() {
  const [user, setUser] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    roles: [] as UserRole[],
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
              'Authorization': `Bearer ${idToken}`,
            },
          });
          
          if (roleResponse.ok) {
            const data = await roleResponse.json();
            const roles = data.roles || [data.primaryRole] || [];
            setUserRoles(roles);
            
            // Only owner and admin can access this page
            if (!canAccessAdmin(roles)) {
              router.push('/');
              return;
            }
            
            loadUsers();
          } else {
            const fallbackRoles: UserRole[] = (OWNER_EMAIL && firebaseUser.email === OWNER_EMAIL)
              ? ['owner'] 
              : [];
            setUserRoles(fallbackRoles);
            if (!canAccessAdmin(fallbackRoles)) {
              router.push('/');
              return;
            }
            loadUsers();
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

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!user || userRoles.length === 0) return;
    
    if (!formData.email || formData.roles.length === 0) {
      alert('Please fill in email and select at least one role');
      return;
    }

    try {
      setLoading(true);
      const idToken = await user.getIdToken();
      
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name || formData.email.split('@')[0],
          roles: formData.roles,
          role: getPrimaryRole(formData.roles), // For backward compatibility
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to create user');
        return;
      }

      alert(data.message || 'User created successfully!');
      setShowAddModal(false);
      setFormData({ email: '', name: '', roles: [] });
      await loadUsers();
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId: string) => {
    if (!user || userRoles.length === 0) return;

    try {
      setLoading(true);
      await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email: formData.email,
          name: formData.name,
          roles: formData.roles,
          role: getPrimaryRole(formData.roles), // For backward compatibility
        }),
      });
      await loadUsers();
      setEditingUser(null);
      setFormData({ email: '', name: '', roles: [] });
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!user || userRoles.length === 0) return;
    
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    const targetRoles = normalizeRoles(targetUser);
    if (!canDeleteUser(userRoles, targetRoles, targetUser.email)) {
      alert('You do not have permission to delete this user');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${targetUser.email || targetUser.name || 'this user'}?`)) {
      return;
    }

    try {
      setLoading(true);
      await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE',
      });
      await loadUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = (role: UserRole) => {
    if (formData.roles.includes(role)) {
      setFormData({
        ...formData,
        roles: formData.roles.filter((r) => r !== role),
      });
    } else {
      setFormData({
        ...formData,
        roles: [...formData.roles, role],
      });
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return <Crown className="text-yellow-600" size={14} />;
      case 'admin':
        return <Shield className="text-indigo-600" size={14} />;
      case 'reviewer':
        return <Shield className="text-amber-600" size={14} />;
      case 'parent':
        return <UserIcon className="text-green-600" size={14} />;
      case 'child':
        return <UserIcon className="text-sky-600" size={14} />;
      case 'student':
        return <GraduationCap className="text-purple-600" size={14} />;
      default:
        return <UserIcon className="text-slate-600" size={14} />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'admin':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'reviewer':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'parent':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'child':
        return 'bg-sky-100 text-sky-700 border-sky-200';
      case 'student':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const allRoles: UserRole[] = ['owner', 'admin', 'reviewer', 'parent', 'child', 'student'];
  const isOwner = userRoles.includes('owner');

  if (!user || userRoles.length === 0 || !canAccessAdmin(userRoles)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-3">
              <Users className="text-indigo-600" size={28} />
              <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
            </div>
          </div>
          <button
            onClick={() => {
              setShowAddModal(true);
              setEditingUser(null);
              setFormData({ email: '', name: '', roles: ['parent'] });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={18} />
            Add User
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading && users.length === 0 ? (
            <div className="p-12 text-center">
              <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={32} />
              <p className="text-slate-500">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="text-slate-300 mx-auto mb-4" size={48} />
              <p className="text-slate-500">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Roles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {users.map((u) => {
                    const roles = normalizeRoles(u);
                    const primaryRole = getPrimaryRole(roles);
                    
                    return (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                              <UserIcon className="text-indigo-600" size={20} />
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">
                                {u.name || u.email || 'Unknown'}
                              </div>
                              {u.email && (
                                <div className="text-sm text-slate-500 flex items-center gap-1">
                                  <Mail size={12} />
                                  {u.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {roles.map((role) => (
                              <span
                                key={role}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(role)}`}
                              >
                                {getRoleIcon(role)}
                                {role}
                              </span>
                            ))}
                            {roles.length === 0 && (
                              <span className="text-xs text-slate-400">No roles</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {(u as any).status === 'pending' ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                              Pending Sign-up
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingUser(u);
                                setFormData({
                                  email: u.email || '',
                                  name: u.name || '',
                                  roles: roles,
                                });
                              }}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit user"
                            >
                              <Edit size={16} />
                            </button>
                            {canDeleteUser(userRoles, roles, u.email) && (
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete user"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingUser) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              {editingUser ? 'Edit User' : 'Add User'}
            </h2>
            
            <div className="space-y-4">
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="user@example.com"
                  disabled={!!editingUser}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="User name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Roles (select multiple)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {allRoles.map((role) => {
                    // Only owner can assign owner role
                    if (role === 'owner' && !isOwner) return null;
                    
                    const isSelected = formData.roles.includes(role);
                    const isDisabled = editingUser?.roles?.includes('owner') && role === 'owner' && !isOwner;
                    
                    return (
                      <button
                        key={role}
                        onClick={() => !isDisabled && toggleRole(role)}
                        disabled={isDisabled}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                          isSelected
                            ? getRoleColor(role) + ' border-2'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {getRoleIcon(role)}
                        <span className="capitalize">{role}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Users can have multiple roles. Student role allows practice.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingUser(null);
                  setFormData({ email: '', name: '', roles: [] });
                }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (editingUser) {
                    handleUpdateUser(editingUser.id);
                  } else {
                    handleAddUser();
                  }
                }}
                disabled={loading || formData.roles.length === 0}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="animate-spin mx-auto" size={18} />
                ) : editingUser ? (
                  'Update'
                ) : (
                  'Add'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

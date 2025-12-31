'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { canAccessAdmin, normalizeRoles, OWNER_EMAIL } from '@/lib/auth';
import { getPrimaryRole } from '@/types';
import { useUserEmail } from '@/lib/use-user-email';
import Link from 'next/link';
import { UserRole } from '@/types';
import {
  Brain,
  Database,
  Code,
  Plus,
  Trash2,
  ArrowLeft,
  Play,
  RefreshCw,
  FileText,
  Loader2,
  Copy,
  Users,
} from 'lucide-react';
import { QuestionTemplate, GeneratedQuestion } from '@/types';
import TemplateEditor from '@/components/admin/TemplateEditor';

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [view, setView] = useState<'list' | 'editor' | 'generator' | 'trash'>('list');
  const userEmail = useUserEmail();
  const [templates, setTemplates] = useState<QuestionTemplate[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<QuestionTemplate | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [generatedQuestions, setGeneratedQuestions] = useState<
    GeneratedQuestion[]
  >([]);

  // Notification State
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    action?: { label: string; onClick: () => void };
  } | null>(null);

  // Confirmation Modal State
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    templateId: string | null;
    templateTitle: string;
  }>({ isOpen: false, templateId: null, templateTitle: '' });

  const showNotification = (
    message: string,
    type: 'success' | 'error' | 'info' = 'success',
    action?: { label: string; onClick: () => void }
  ) => {
    setNotification({ message, type, action });
    if (!action) {
      setTimeout(() => setNotification(null), 3000);
    }
  };

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

            // Only owner and admin can access this page
            if (!canAccessAdmin(roles)) {
              router.push('/');
              return;
            }
          } else {
            // Fallback: check owner email
            const fallbackRoles: UserRole[] = (OWNER_EMAIL && firebaseUser.email === OWNER_EMAIL) ? ['owner'] : ['parent'];
            const fallbackRole = getPrimaryRole(fallbackRoles);
            setUserRole(fallbackRole);
            if (!canAccessAdmin(fallbackRoles)) {
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
    if (!user) return;
    loadTemplates();
  }, [user, userEmail]);

  const loadTemplates = async (showDeleted = false) => {
    try {
      const params = new URLSearchParams();
      if (userEmail) params.append('userEmail', userEmail);
      if (showDeleted) params.append('includeDeleted', 'true');

      const response = await fetch(`/api/admin/templates?${params.toString()}`);
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const handleSaveTemplate = async (data: Partial<QuestionTemplate>) => {
    try {
      setLoading(true);
      const url = activeTemplate
        ? '/api/admin/templates'
        : '/api/admin/templates';
      const method = activeTemplate ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail || '',
        },
        body: JSON.stringify({
          ...data,
          id: activeTemplate?.id,
          createdBy: user?.uid || 'system',
          status: data.status || 'draft',
          userEmail: userEmail, // Also include in body for POST requests
        }),
      });

      await loadTemplates();
      setView('list');
      setActiveTemplate(null);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (template: QuestionTemplate) => {
    setDeleteConfirmation({
      isOpen: true,
      templateId: template.id,
      templateTitle: template.title,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation.templateId) return;

    const id = deleteConfirmation.templateId;
    setDeleteConfirmation({ isOpen: false, templateId: null, templateTitle: '' }); // Close modal immediately

    // Optimistic UI update: Remove from list immediately
    setTemplates(prev => prev.filter(t => t.id !== id));

    try {
      const url = `/api/admin/templates?id=${id}${userEmail ? `&userEmail=${encodeURIComponent(userEmail)}` : ''}`;
      await fetch(url, {
        method: 'DELETE',
        headers: {
          'x-user-email': userEmail || '',
        },
      });
      // Verification fetch (in case optimistic was wrong, or to get fresh state)
      await loadTemplates(view === 'trash');

      showNotification('Template moved to trash', 'success', {
        label: 'Undo',
        onClick: () => handleRestoreTemplate(id),
      });
    } catch (error) {
      console.error('Delete failed:', error);
      showNotification('Failed to delete template', 'error');
      // Revert optimistic update on error
      loadTemplates(view === 'trash');
    }
  };

  const handleRestoreTemplate = async (id: string, silent = false) => {
    // Optimistic UI update: Remove from trash view immediately if we are in trash view
    // If not in trash view (e.g. undo from toast in library), we might want to add it back to list
    if (view === 'trash') {
      setTemplates(prev => prev.filter(t => t.id !== id));
    }

    try {
      await fetch('/api/admin/templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'restore' }),
      });
      await loadTemplates(view === 'trash');
      if (!silent) {
        setNotification(null); // Clear undo notification if any
        showNotification('Template restored successfully');
      }
    } catch (error) {
      console.error('Restore failed:', error);
      showNotification('Failed to restore template', 'error');
      loadTemplates(view === 'trash');
    }
  };

  const handleGenerateInstances = async (count: number) => {
    if (!activeTemplate) return;
    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/templates/${activeTemplate.id}/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ count }),
        }
      );

      const data = await response.json();
      if (data.questions) {
        setGeneratedQuestions(data.questions);
        if (data.modelUsed) {
          setLoadingStatus(`✓ Generated using ${data.provider}/${data.modelUsed}`);
          setTimeout(() => setLoadingStatus(''), 3000);
        }
      }
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !userRole || (userRole !== 'owner' && userRole !== 'admin')) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2 text-indigo-600 mb-1">
            <Brain size={24} />
            <span className="font-bold text-lg tracking-tight">LearnLoop</span>
          </Link>
          <p className="text-xs text-slate-500">Admin Portal</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <button
            onClick={() => {
              setView('list');
              setActiveTemplate(null);
              loadTemplates(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${view === 'list'
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-slate-600 hover:bg-slate-50'
              }`}
          >
            <Database size={18} />
            Library
          </button>
          <button
            onClick={() => {
              setActiveTemplate(null);
              setView('editor');
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${view === 'editor'
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-slate-600 hover:bg-slate-50'
              }`}
          >
            <Code size={18} />
            Template Studio
          </button>
          <button
            onClick={() => {
              setView('trash');
              setActiveTemplate(null);
              loadTemplates(true);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${view === 'trash'
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-slate-600 hover:bg-slate-50'
              }`}
          >
            <Trash2 size={18} />
            Trash
          </button>
          {(userRole === 'owner' || userRole === 'admin') && (
            <Link
              href="/admin/users"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Users size={18} />
              User Management
            </Link>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-16 bg-white border-b border-slate-200 flex items-center px-6 justify-between">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden text-slate-500"
              onClick={() => router.push('/')}
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-lg font-semibold text-slate-800">
              {view === 'list' && 'Template Library'}
              {view === 'trash' && 'Trash (Soft Deleted)'}
              {view === 'editor' && (activeTemplate ? 'Edit Template' : 'New Template')}
              {view === 'generator' && 'Question Factory'}
            </h2>
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full text-xs font-medium animate-pulse">
              <Loader2 size={14} className="animate-spin" />
              {loadingStatus || 'Trying cheapest model first...'}
            </div>
          )}
          {!loading && loadingStatus && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-full text-xs font-medium">
              {loadingStatus}
            </div>
          )}
        </div>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {/* LIST VIEW & TRASH VIEW */}
          {(view === 'list' || view === 'trash') && (
            <div className="max-w-5xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <p className="text-slate-500">
                  {view === 'trash'
                    ? 'Restore deleted templates or view archived items.'
                    : 'Select a template to generate questions or create a new one.'}
                </p>
                {view === 'list' && (
                  <button
                    onClick={() => {
                      setActiveTemplate(null);
                      setView('editor');
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                  >
                    <Plus size={16} />
                    New Template
                  </button>
                )}
              </div>

              {templates.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText size={32} />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-1">
                    No templates yet
                  </h3>
                  <p className="text-slate-500 max-w-sm mx-auto mb-6">
                    Create your first question template to start generating
                    endless practice problems.
                  </p>
                  <button
                    onClick={() => setView('editor')}
                    className="text-indigo-600 font-medium hover:underline"
                  >
                    Create one now
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.filter(t => view === 'trash' ? t.deletedAt : !t.deletedAt).map((t) => (
                    <div
                      key={t.id}
                      className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group relative ${view === 'trash' ? 'border-red-100 bg-red-50/10' : 'border-slate-200'
                        }`}
                    >
                      <div
                        onClick={() => {
                          setActiveTemplate(t);
                          setGeneratedQuestions([]);
                          setView('generator');
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-slate-800 truncate pr-8">
                            {t.title}
                          </h3>
                        </div>
                        <div className="text-xs font-mono bg-slate-100 p-2 rounded text-slate-600 mb-2 truncate">
                          {t.templateText}
                        </div>
                        {t.variants && t.variants.length > 0 && (
                          <div className="text-[10px] text-slate-400 mb-2 flex items-center gap-1">
                            <Copy size={10} /> +{t.variants.length} variations
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {t.concepts.slice(0, 3).map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded-full font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {view === 'trash' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestoreTemplate(t.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Restore"
                          >
                            <RefreshCw size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(t);
                            }}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* EDITOR VIEW */}
          {view === 'editor' && (
            <TemplateEditor
              template={activeTemplate}
              onSave={handleSaveTemplate}
              onCancel={() => {
                setView('list');
                setActiveTemplate(null);
              }}
            />
          )}

          {/* GENERATOR VIEW */}
          {view === 'generator' && activeTemplate && (
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Panel */}
              <div className="lg:col-span-4 space-y-6">
                <button
                  onClick={() => setView('list')}
                  className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-1 mb-4"
                >
                  <ArrowLeft size={14} /> Back to Library
                </button>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-800 mb-2">
                    {activeTemplate.title}
                  </h2>
                  <div className="p-3 bg-slate-50 rounded border border-slate-100 font-mono text-sm text-slate-600 mb-4 break-words">
                    {activeTemplate.templateText}
                  </div>

                  <div className="mb-6">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Variables
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {activeTemplate.variables.map((v, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded border border-purple-100"
                        >
                          <span className="font-mono font-bold">{v.name}</span>
                          <span className="text-purple-400">|</span>
                          <span>{v.type}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => handleGenerateInstances(1)}
                      disabled={loading}
                      className="w-full py-2.5 bg-white border border-indigo-200 text-indigo-700 font-medium rounded-lg hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Play size={16} />
                      Generate 1 Instance
                    </button>
                    <button
                      onClick={() => handleGenerateInstances(5)}
                      disabled={loading}
                      className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={16} />
                      Generate Batch (5)
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Panel */}
              <div className="lg:col-span-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                    Generated Questions
                    <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">
                      {generatedQuestions.length}
                    </span>
                  </h3>
                  {generatedQuestions.length > 0 && (
                    <button
                      onClick={() => setGeneratedQuestions([])}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {generatedQuestions.length === 0 && (
                    <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl">
                      <p className="text-slate-400">
                        No questions generated yet.
                      </p>
                      <p className="text-sm text-slate-300">
                        Click generate to see the magic.
                      </p>
                    </div>
                  )}

                  {generatedQuestions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-bold text-slate-300">
                          #{idx + 1}
                        </span>
                      </div>
                      <div className="text-lg text-slate-800 mb-4 font-medium leading-relaxed">
                        {q.questionText}
                      </div>
                      <div className="bg-slate-50 rounded p-3 text-sm">
                        <div className="grid grid-cols-2 gap-4 text-xs text-slate-500 mb-2">
                          <div>
                            <span className="uppercase tracking-wider font-semibold">
                              Values:
                            </span>{' '}
                            {JSON.stringify(q.values)
                              .replace(/"/g, '')
                              .replace(/{|}/g, '')}
                          </div>
                          <div>
                            <span className="uppercase tracking-wider font-semibold">
                              Answer:
                            </span>{' '}
                            <span className="font-mono font-bold text-slate-700">
                              {q.calculatedAnswer || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
            notification.type === 'success' ? 'bg-slate-800 border-slate-700 text-white' :
              'bg-white border-slate-200 text-slate-800'
            }`}>
            <span>{notification.message}</span>
            {notification.action && (
              <button
                onClick={notification.action.onClick}
                className="text-sm font-bold text-indigo-400 hover:text-indigo-300 ml-2 border-l border-slate-600 pl-3"
              >
                {notification.action.label}
              </button>
            )}
            {!notification.action && (
              <button onClick={() => setNotification(null)} className="ml-2 opacity-70 hover:opacity-100">
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-in border border-slate-100">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Template?</h3>
              <p className="text-slate-500 text-sm">
                Are you sure you want to delete <span className="font-semibold text-slate-700">"{deleteConfirmation.templateTitle}"</span>?
                The template will be moved to the trash and can be restored later.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmation({ isOpen: false, templateId: null, templateTitle: '' })}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

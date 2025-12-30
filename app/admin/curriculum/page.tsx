'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Save,
  X,
  Globe,
  BookOpen,
  Loader2,
} from 'lucide-react';
import { CurriculumTag } from '@/types';

export default function CurriculumPage() {
  const [user, setUser] = useState<any>(null);
  const [curricula, setCurricula] = useState<CurriculumTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTag, setEditingTag] = useState<CurriculumTag | null>(null);
  const [formData, setFormData] = useState<Partial<CurriculumTag>>({
    name: '',
    subject: 'math',
    year: 1,
    topic: '',
    subtopic: '',
    mappings: {
      uk: {},
      us: {},
      india: {},
    },
  });

  const router = useRouter();

  useEffect(() => {
    if (!auth) {
      setUser({ uid: 'demo-user', isAnonymous: true });
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

  useEffect(() => {
    if (user) {
      loadCurricula();
    }
  }, [user]);

  const loadCurricula = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/curriculum');
      const data = await response.json();
      setCurricula(data.curricula || []);
    } catch (error) {
      console.error('Failed to load curricula:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const url = '/api/curriculum';
      const method = 'POST';

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      await loadCurricula();
      setShowEditor(false);
      setEditingTag(null);
      setFormData({
        name: '',
        subject: 'math',
        year: 1,
        topic: '',
        subtopic: '',
        mappings: {
          uk: {},
          us: {},
          india: {},
        },
      });
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (tag: CurriculumTag) => {
    setEditingTag(tag);
    setFormData(tag);
    setShowEditor(true);
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/admin"
            className="text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            Curriculum Management
          </h1>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <p className="text-slate-600">
              Manage curriculum tags and map them to different countries'
              curricula.
            </p>
            <button
              onClick={() => {
                setEditingTag(null);
                setFormData({
                  name: '',
                  subject: 'math',
                  year: 1,
                  topic: '',
                  subtopic: '',
                  mappings: {
                    uk: {},
                    us: {},
                    india: {},
                  },
                });
                setShowEditor(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <Plus size={16} />
              Add Tag
            </button>
          </div>

          {showEditor && (
            <div className="bg-slate-50 rounded-lg p-6 mb-6 border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-4">
                {editingTag ? 'Edit' : 'New'} Curriculum Tag
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Subject
                  </label>
                  <select
                    value={formData.subject || 'math'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        subject: e.target.value as 'math' | 'english',
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-indigo-500"
                  >
                    <option value="math">Math</option>
                    <option value="english">English</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Year (1-6)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={formData.year || 1}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        year: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Topic
                  </label>
                  <input
                    type="text"
                    value={formData.topic || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, topic: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Curriculum Mappings
                </label>

                <div className="grid grid-cols-3 gap-4">
                  {/* UK Mapping */}
                  <div className="bg-white p-3 rounded border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe size={14} className="text-blue-600" />
                      <span className="text-xs font-semibold text-slate-700">
                        UK
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="Key Stage"
                      value={formData.mappings?.uk?.keyStage || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          mappings: {
                            ...formData.mappings,
                            uk: {
                              ...formData.mappings?.uk,
                              keyStage: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full text-xs px-2 py-1 border border-slate-200 rounded mb-1"
                    />
                    <input
                      type="number"
                      placeholder="Year"
                      value={formData.mappings?.uk?.year || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          mappings: {
                            ...formData.mappings,
                            uk: {
                              ...formData.mappings?.uk,
                              year: parseInt(e.target.value),
                            },
                          },
                        })
                      }
                      className="w-full text-xs px-2 py-1 border border-slate-200 rounded"
                    />
                  </div>

                  {/* US Mapping */}
                  <div className="bg-white p-3 rounded border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe size={14} className="text-red-600" />
                      <span className="text-xs font-semibold text-slate-700">
                        US
                      </span>
                    </div>
                    <input
                      type="number"
                      placeholder="Grade"
                      value={formData.mappings?.us?.grade || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          mappings: {
                            ...formData.mappings,
                            us: {
                              ...formData.mappings?.us,
                              grade: parseInt(e.target.value),
                            },
                          },
                        })
                      }
                      className="w-full text-xs px-2 py-1 border border-slate-200 rounded mb-1"
                    />
                    <input
                      type="text"
                      placeholder="Standard"
                      value={formData.mappings?.us?.standard || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          mappings: {
                            ...formData.mappings,
                            us: {
                              ...formData.mappings?.us,
                              standard: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full text-xs px-2 py-1 border border-slate-200 rounded"
                    />
                  </div>

                  {/* India Mapping */}
                  <div className="bg-white p-3 rounded border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe size={14} className="text-orange-600" />
                      <span className="text-xs font-semibold text-slate-700">
                        India
                      </span>
                    </div>
                    <input
                      type="number"
                      placeholder="Class"
                      value={formData.mappings?.india?.class || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          mappings: {
                            ...formData.mappings,
                            india: {
                              ...formData.mappings?.india,
                              class: parseInt(e.target.value),
                            },
                          },
                        })
                      }
                      className="w-full text-xs px-2 py-1 border border-slate-200 rounded mb-1"
                    />
                    <input
                      type="text"
                      placeholder="Board"
                      value={formData.mappings?.india?.board || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          mappings: {
                            ...formData.mappings,
                            india: {
                              ...formData.mappings?.india,
                              board: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full text-xs px-2 py-1 border border-slate-200 rounded"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowEditor(false);
                    setEditingTag(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading || !formData.name || !formData.topic}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  <Save size={16} />
                  Save
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {curricula.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                No curriculum tags yet. Create one to get started.
              </div>
            ) : (
              curricula.map((tag) => (
                <div
                  key={tag.id}
                  className="bg-slate-50 rounded-lg p-4 border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen size={16} className="text-indigo-600" />
                        <h3 className="font-semibold text-slate-900">
                          {tag.name}
                        </h3>
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                          {tag.subject}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-xs rounded-full">
                          Year {tag.year}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">
                        {tag.topic}
                        {tag.subtopic && ` • ${tag.subtopic}`}
                      </p>
                      <div className="flex gap-4 text-xs text-slate-500">
                        {tag.mappings?.uk && (
                          <span>
                            UK: {tag.mappings.uk.keyStage || 'N/A'} Year{' '}
                            {tag.mappings.uk.year || 'N/A'}
                          </span>
                        )}
                        {tag.mappings?.us && (
                          <span>
                            US: Grade {tag.mappings.us.grade || 'N/A'}
                          </span>
                        )}
                        {tag.mappings?.india && (
                          <span>
                            India: Class {tag.mappings.india.class || 'N/A'}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => startEditing(tag)}
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


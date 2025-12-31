'use client';

import { useState, useRef } from 'react';
import {
  Brain,
  Save,
  X,
  Plus,
  Copy,
  Tags,
  FunctionSquare,
  Type,
  Upload,
  Camera,
  StopCircle,
  Loader2,
} from 'lucide-react';
import { VariableDefinition, QuestionTemplate, CurriculumTag } from '@/types';

interface TemplateEditorProps {
  template?: QuestionTemplate | null;
  onSave: (data: Partial<QuestionTemplate>) => Promise<void>;
  onCancel: () => void;
}

export default function TemplateEditor({
  template,
  onSave,
  onCancel,
}: TemplateEditorProps) {
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [editorTopic, setEditorTopic] = useState('');
  const [editorImage, setEditorImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  const [editorData, setEditorData] = useState<Partial<QuestionTemplate>>({
    title: template?.title || '',
    templateText: template?.templateText || '',
    variants: template?.variants || [],
    answerFunction: template?.answerFunction || '',
    variables: template?.variables || [],
    concepts: template?.concepts || [],
    curriculumTags: template?.curriculumTags || [{
      id: crypto.randomUUID(),
      name: 'Default',
      subject: 'math',
      yearGroup: 'Year 9',
      topicPath: [],
      mappings: {}
    }],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditorImage(reader.result as string);
        setShowCamera(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      setShowCamera(true);
      setEditorImage(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      setShowCamera(false);
      alert('Unable to access camera. Please ensure you have granted permission.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        setEditorImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleGenerateStructure = async () => {
    if (!editorTopic && !editorImage) return;
    setLoading(true);

    try {
      const response = await fetch('/api/admin/templates/generate-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: editorTopic,
          imageBase64: editorImage,
        }),
      });

      const data = await response.json();
      if (data.structure) {
        setEditorData({
          ...data.structure,
          variants: data.structure.variants || [],
          answerFunction: data.structure.answerFunction || '',
          variables: data.structure.variables || [],
          concepts: data.structure.concepts || [],
          curriculumTags: data.structure.curriculumTags && data.structure.curriculumTags.length > 0
            ? data.structure.curriculumTags
            : [{
              id: crypto.randomUUID(),
              name: 'Generated',
              subject: 'math',
              yearGroup: 'Year 9',
              topicPath: [],
              mappings: {}
            }],
        });

        // Show which model was used
        if (data.modelUsed) {
          setLoadingStatus(`✓ Generated using ${data.provider}/${data.modelUsed} (Quality: ${data.qualityScore || 'N/A'}/10)`);
          setTimeout(() => setLoadingStatus(''), 3000);
        }
      }
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addVariable = () => {
    setEditorData({
      ...editorData,
      variables: [
        ...(editorData.variables || []),
        { name: 'x', type: 'number', min: 1, max: 10, precision: 0 },
      ],
    });
  };

  const updateVariable = (index: number, updates: Partial<VariableDefinition>) => {
    const newVars = [...(editorData.variables || [])];
    newVars[index] = { ...newVars[index], ...updates };
    setEditorData({ ...editorData, variables: newVars });
  };

  const removeVariable = (index: number) => {
    setEditorData({
      ...editorData,
      variables: editorData.variables?.filter((_, i) => i !== index) || [],
    });
  };

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full md:h-auto">
      {/* AI Prompt Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 border-b border-indigo-100">
        <label className="block text-sm font-semibold text-indigo-900 mb-2">
          Generate Template from Topic or Image
        </label>

        <div className="flex flex-col md:flex-row gap-4">
          {/* Image Capture & Upload Area */}
          <div
            className={`md:w-36 h-28 rounded-lg border-2 border-dashed relative overflow-hidden flex flex-col items-center justify-center transition-colors ${editorImage || showCamera
              ? 'border-indigo-300 bg-black'
              : 'border-indigo-200 bg-white hover:bg-indigo-50'
              }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            {showCamera ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute bottom-2 flex gap-2">
                  <button
                    onClick={captureImage}
                    className="p-1 bg-white rounded-full text-indigo-600 shadow-lg hover:scale-110 transition-transform"
                  >
                    <Camera size={16} />
                  </button>
                  <button
                    onClick={stopCamera}
                    className="p-1 bg-red-500 rounded-full text-white shadow-lg hover:scale-110 transition-transform"
                  >
                    <StopCircle size={16} />
                  </button>
                </div>
              </>
            ) : editorImage ? (
              <>
                <img
                  src={editorImage}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity p-2">
                  <button
                    onClick={() => setEditorImage(null)}
                    className="text-white text-[10px] bg-red-500/80 px-2 py-1 rounded hover:bg-red-500"
                  >
                    Remove
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2 w-full px-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 text-xs text-indigo-500 font-medium hover:bg-indigo-50 py-1 rounded transition-colors"
                >
                  <Upload size={14} /> Upload
                </button>
                <div className="h-px bg-slate-100 w-full"></div>
                <button
                  onClick={startCamera}
                  className="flex items-center justify-center gap-2 text-xs text-indigo-500 font-medium hover:bg-indigo-50 py-1 rounded transition-colors"
                >
                  <Camera size={14} /> Camera
                </button>
              </div>
            )}
          </div>

          {/* Text Input & Button */}
          <div className="flex-1 flex flex-col gap-2">
            <textarea
              value={editorTopic}
              onChange={(e) => setEditorTopic(e.target.value)}
              placeholder="Describe the question topic OR upload an image and let AI extract the structure..."
              className="flex-1 w-full px-4 py-3 rounded-lg border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none"
            />
            <div className="flex justify-end">
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleGenerateStructure}
                  disabled={loading || (!editorTopic && !editorImage)}
                  className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Brain size={16} />
                  )}
                  Generate Structure
                </button>
                {loadingStatus && (
                  <p className="text-xs text-slate-600">{loadingStatus}</p>
                )}
                {loading && !loadingStatus && (
                  <p className="text-xs text-slate-500">Starting with cheapest model, upgrading if needed...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Edit Section */}
      <div className="flex flex-col md:flex-row h-[600px]">
        {/* Left: General Info */}
        <div className="w-full md:w-2/4 p-6 border-b md:border-b-0 md:border-r border-slate-200 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={editorData.title || ''}
                onChange={(e) =>
                  setEditorData({ ...editorData, title: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-indigo-500"
                placeholder="Short descriptive title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Primary Template{' '}
                <span className="text-slate-400 font-normal">
                  (Use {'{variable}'})
                </span>
              </label>
              <textarea
                value={editorData.templateText || ''}
                onChange={(e) =>
                  setEditorData({ ...editorData, templateText: e.target.value })
                }
                className="w-full h-24 px-3 py-2 font-mono text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-indigo-500"
                placeholder="Calculate the area of a circle with radius {r}..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Copy size={16} /> Phrasing Variations
              </label>
              <div className="space-y-2">
                {editorData.variants?.map((v, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={v}
                      onChange={(e) => {
                        const newVars = [...(editorData.variants || [])];
                        newVars[i] = e.target.value;
                        setEditorData({ ...editorData, variants: newVars });
                      }}
                      className="flex-1 px-3 py-1.5 text-sm font-mono bg-slate-50 border border-slate-200 rounded focus:border-indigo-500 outline-none"
                    />
                    <button
                      onClick={() =>
                        setEditorData({
                          ...editorData,
                          variants: editorData.variants?.filter(
                            (_, idx) => idx !== i
                          ),
                        })
                      }
                      className="text-slate-400 hover:text-red-500"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() =>
                    setEditorData({
                      ...editorData,
                      variants: [...(editorData.variants || []), ''],
                    })
                  }
                  className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1"
                >
                  <Plus size={12} /> Add Variation
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Tags size={16} /> Concepts & Tags
              </label>
              <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                <div className="flex flex-wrap gap-2 mb-3">
                  {editorData.concepts?.map((c, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-600 flex items-center gap-1"
                    >
                      {c}
                      <button
                        onClick={() =>
                          setEditorData({
                            ...editorData,
                            concepts: editorData.concepts?.filter(
                              (_, idx) => idx !== i
                            ),
                          })
                        }
                        className="hover:text-red-500"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Add tag + Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = e.currentTarget.value.trim();
                      if (val && !editorData.concepts?.includes(val)) {
                        setEditorData({
                          ...editorData,
                          concepts: [...(editorData.concepts || []), val],
                        });
                        e.currentTarget.value = '';
                      }
                    }
                  }}
                  className="w-full bg-transparent text-sm border-b border-slate-200 focus:border-indigo-500 outline-none pb-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Middle: Curriculum Metadata */}
        <div className="w-full md:w-1/4 p-6 border-b md:border-b-0 md:border-r border-slate-200 overflow-y-auto bg-slate-50/50">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 block">
            Curriculum Tags
          </label>

          {editorData.curriculumTags?.map((tag, i) => (
            <div key={i} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Subject</label>
                <select
                  value={tag.subject}
                  onChange={(e) => {
                    const newTags = [...(editorData.curriculumTags || [])];
                    newTags[i] = { ...newTags[i], subject: e.target.value as any };
                    setEditorData({ ...editorData, curriculumTags: newTags });
                  }}
                  className="w-full text-sm border-slate-200 rounded-md focus:border-indigo-500 focus:ring-0"
                >
                  <option value="math">Mathematics</option>
                  <option value="english">English</option>
                  <option value="science">Science</option>
                  <option value="computing">Computing</option>
                  <option value="history">History</option>
                  <option value="geography">Geography</option>
                  <option value="languages">Languages</option>
                  <option value="art">Art & Design</option>
                  <option value="music">Music</option>
                  <option value="pe">PE</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Year Group (UK)</label>
                <select
                  value={tag.yearGroup || 'Year 1'}
                  onChange={(e) => {
                    const newTags = [...(editorData.curriculumTags || [])];
                    newTags[i] = { ...newTags[i], yearGroup: e.target.value };
                    setEditorData({ ...editorData, curriculumTags: newTags });
                  }}
                  className="w-full text-sm border-slate-200 rounded-md focus:border-indigo-500 focus:ring-0"
                >
                  {Array.from({ length: 13 }, (_, y) => `Year ${y + 1}`).map((yg) => (
                    <option key={yg} value={yg}>{yg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Topic Hierarchy</label>
                <div className="space-y-2">
                  {(tag.topicPath || []).map((level, levelIdx) => (
                    <div key={levelIdx} className="flex gap-1 ml-2 border-l-2 border-slate-100 pl-2">
                      <input
                        type="text"
                        value={level}
                        onChange={(e) => {
                          const newTags = [...(editorData.curriculumTags || [])];
                          const newPath = [...(tag.topicPath || [])];
                          newPath[levelIdx] = e.target.value;
                          newTags[i] = { ...newTags[i], topicPath: newPath };
                          setEditorData({ ...editorData, curriculumTags: newTags });
                        }}
                        className="flex-1 text-sm border-slate-200 rounded-md px-2 py-1"
                        placeholder={`Level ${levelIdx + 1}`}
                      />
                      <button
                        onClick={() => {
                          const newTags = [...(editorData.curriculumTags || [])];
                          const newPath = (tag.topicPath || []).filter((_, idx) => idx !== levelIdx);
                          newTags[i] = { ...newTags[i], topicPath: newPath };
                          setEditorData({ ...editorData, curriculumTags: newTags });
                        }}
                        className="text-slate-400 hover:text-red-500 px-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newTags = [...(editorData.curriculumTags || [])];
                      const newPath = [...(tag.topicPath || []), ''];
                      newTags[i] = { ...newTags[i], topicPath: newPath };
                      setEditorData({ ...editorData, curriculumTags: newTags });
                    }}
                    className="ml-2 text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Plus size={12} /> Add Sub-level
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Logic & Variables */}
        <div className="w-full md:w-1/4 flex flex-col h-full border-l border-slate-200">
          {/* Answer Function Editor */}
          <div className="p-6 border-b border-slate-200 bg-slate-900 text-slate-200 h-1/3 min-h-[200px] flex flex-col">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <FunctionSquare size={14} /> Answer Logic (JavaScript)
            </label>
            <p className="text-[10px] text-slate-500 mb-2 font-mono">
              Available:{' '}
              <span className="text-green-400">values</span> object (e.g.
              values.x)
            </p>
            <textarea
              value={editorData.answerFunction || ''}
              onChange={(e) =>
                setEditorData({
                  ...editorData,
                  answerFunction: e.target.value,
                })
              }
              className="flex-1 w-full bg-transparent font-mono text-sm text-green-300 focus:outline-none resize-none"
              placeholder={`const { a, b } = values;\nreturn a + b;`}
              spellCheck={false}
            />
          </div>

          {/* Variable Editor */}
          <div className="p-6 bg-slate-50/50 overflow-y-auto flex-1">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                Variable Configuration
              </label>
              <span className="text-xs text-slate-400">
                {editorData.variables?.length || 0} variables
              </span>
            </div>

            <div className="space-y-3">
              {editorData.variables?.map((v, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col gap-3 relative group"
                >
                  <button
                    onClick={() => removeVariable(idx)}
                    className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 block">
                        Variable Name
                      </label>
                      <div className="flex items-center bg-white border border-slate-200 rounded px-2">
                        <span className="text-slate-400 font-mono text-sm">
                          {'{'}
                        </span>
                        <input
                          type="text"
                          value={v.name}
                          onChange={(e) =>
                            updateVariable(idx, { name: e.target.value })
                          }
                          className="w-full py-1.5 text-sm font-bold text-slate-700 focus:outline-none font-mono"
                          placeholder="name"
                        />
                        <span className="text-slate-400 font-mono text-sm">
                          {'}'}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 block">
                        Type
                      </label>
                      <div className="relative">
                        <Type
                          size={14}
                          className="absolute left-2 top-2 text-slate-400"
                        />
                        <select
                          value={v.type}
                          onChange={(e) =>
                            updateVariable(idx, {
                              type: e.target.value as any,
                            })
                          }
                          className="w-full pl-7 pr-2 py-1.5 text-sm bg-white border border-slate-200 rounded focus:outline-none focus:border-indigo-500"
                        >
                          <option value="number">Number</option>
                          <option value="text">Text</option>
                          <option value="choice">Choice</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {v.type === 'number' && (
                    <div className="grid grid-cols-3 gap-2 bg-white p-2 rounded border border-slate-100">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">
                          Min
                        </label>
                        <input
                          type="number"
                          value={v.min ?? ''}
                          onChange={(e) =>
                            updateVariable(idx, {
                              min: parseFloat(e.target.value),
                            })
                          }
                          className="w-full text-xs border border-slate-200 rounded px-1 py-1"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">
                          Max
                        </label>
                        <input
                          type="number"
                          value={v.max ?? ''}
                          onChange={(e) =>
                            updateVariable(idx, {
                              max: parseFloat(e.target.value),
                            })
                          }
                          className="w-full text-xs border border-slate-200 rounded px-1 py-1"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">
                          Decimals
                        </label>
                        <input
                          type="number"
                          value={v.precision ?? 0}
                          onChange={(e) =>
                            updateVariable(idx, {
                              precision: parseInt(e.target.value),
                            })
                          }
                          className="w-full text-xs border border-slate-200 rounded px-1 py-1"
                        />
                      </div>
                    </div>
                  )}

                  {v.type === 'choice' && (
                    <div className="bg-white p-2 rounded border border-slate-100">
                      <label className="text-[10px] text-slate-400 block mb-0.5">
                        Options (comma separated)
                      </label>
                      <input
                        type="text"
                        value={v.options?.join(', ') || ''}
                        onChange={(e) =>
                          updateVariable(idx, {
                            options: e.target.value
                              .split(',')
                              .map((s) => s.trim()),
                          })
                        }
                        className="w-full text-xs border border-slate-200 rounded px-2 py-1"
                        placeholder="e.g. Red, Blue, Green"
                      />
                    </div>
                  )}
                </div>
              ))}

              <button
                onClick={addVariable}
                className="w-full py-2 border-2 border-dashed border-indigo-100 text-indigo-400 rounded-lg hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all text-sm font-medium flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Add Variable
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-slate-600 hover:text-slate-800 text-sm font-medium"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(editorData)}
          disabled={!editorData.title || !editorData.templateText}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
        >
          <Save size={16} />
          Save Template
        </button>
      </div>
    </div >
  );
}


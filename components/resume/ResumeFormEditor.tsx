'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Sparkles, User, Briefcase, GraduationCap, Code2, Award, ChevronDown, ChevronUp, GripVertical, ArrowLeft, ArrowRight, Layers } from 'lucide-react';
import { ResumeData, WorkExperience, Education, Project, SkillCategory, Certification, SectionKey } from '../../types/resume';
import { AIResumeService } from '../../services/aiResumeService';
import { parseMonthYear, getMonthOptions, getYearOptions } from '../../utils/formatDate';
import toast from 'react-hot-toast';

interface ResumeFormEditorProps {
  resume: ResumeData;
  onChange: (updated: ResumeData) => void;
}

export default function ResumeFormEditor({ resume, onChange }: ResumeFormEditorProps) {
  const [activeTab, setActiveTab] = useState<'contact' | 'experience' | 'education' | 'projects' | 'skills' | 'certifications'>('contact');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const sectionOrder: SectionKey[] = resume.sectionOrder || ['summary', 'experience', 'education', 'projects', 'skills', 'certifications'];

  const moveSection = (fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || fromIndex >= sectionOrder.length) return;
    if (toIndex < 0 || toIndex >= sectionOrder.length) return;
    const updated = [...sectionOrder];
    const [movedItem] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, movedItem);
    onChange({ ...resume, sectionOrder: updated });

    const labelNames: Record<SectionKey, string> = {
      summary: 'Summary',
      experience: 'Experience',
      education: 'Education',
      projects: 'Projects',
      skills: 'Skills',
      certifications: 'Certifications'
    };
    toast.success(`Section order updated: ${labelNames[movedItem]} is now #${toIndex + 1}!`);
  };

  const handleTabDrop = (targetIdx: number, e?: React.DragEvent) => {
    if (e) e.preventDefault();
    const dataStr = e?.dataTransfer.getData('text/plain');
    const sourceIdx = dataStr && dataStr !== '' ? parseInt(dataStr, 10) : draggedIndex;
    if (sourceIdx !== null && !isNaN(sourceIdx) && sourceIdx !== targetIdx) {
      moveSection(sourceIdx, targetIdx);
    }
    setDraggedIndex(null);
  };

  // Contact Field Updates
  const updateContact = (field: keyof ResumeData['contact'], value: string) => {
    onChange({
      ...resume,
      contact: { ...resume.contact, [field]: value }
    });
  };

  // Experience Helpers
  const addExperience = () => {
    const newExp: WorkExperience = {
      id: `exp-${Date.now()}`,
      company: 'New Tech Corp',
      position: 'Senior Software Engineer',
      location: 'San Francisco, CA',
      startDate: 'Jan 2022',
      endDate: 'Present',
      current: true,
      highlights: ['Designed Next.js architecture increasing traffic by 30%.']
    };
    onChange({ ...resume, experience: [...resume.experience, newExp] });
  };

  const updateExpField = (id: string, field: keyof WorkExperience, value: any) => {
    const updated = resume.experience.map((e) => (e.id === id ? { ...e, [field]: value } : e));
    onChange({ ...resume, experience: updated });
  };

  const updateExpFields = (id: string, updates: Partial<WorkExperience>) => {
    const updated = resume.experience.map((e) => (e.id === id ? { ...e, ...updates } : e));
    onChange({ ...resume, experience: updated });
  };

  const removeExp = (id: string) => {
    onChange({ ...resume, experience: resume.experience.filter((e) => e.id !== id) });
  };

  const addExpHighlight = (expId: string) => {
    const updated = resume.experience.map((e) => {
      if (e.id === expId) {
        return { ...e, highlights: [...e.highlights, 'Accelerated deployment cycle by 40% with Docker pipelines.'] };
      }
      return e;
    });
    onChange({ ...resume, experience: updated });
  };

  const updateExpHighlight = (expId: string, idx: number, val: string) => {
    const updated = resume.experience.map((e) => {
      if (e.id === expId) {
        const h = [...e.highlights];
        h[idx] = val;
        return { ...e, highlights: h };
      }
      return e;
    });
    onChange({ ...resume, experience: updated });
  };

  const removeExpHighlight = (expId: string, idx: number) => {
    const updated = resume.experience.map((e) => {
      if (e.id === expId) {
        const h = e.highlights.filter((_, i) => i !== idx);
        return { ...e, highlights: h };
      }
      return e;
    });
    onChange({ ...resume, experience: updated });
  };

  const optimizeHighlightWithAI = (expId: string, idx: number, role: string) => {
    const exp = resume.experience.find((e) => e.id === expId);
    if (!exp) return;
    const current = exp.highlights[idx];
    const enhanced = AIResumeService.generateEnhancedBullet(current, role);
    updateExpHighlight(expId, idx, enhanced);
  };

  // Education Helpers
  const addEducation = () => {
    const newEdu: Education = {
      id: `edu-${Date.now()}`,
      institution: 'University of California, Berkeley',
      degree: 'Bachelor of Science (B.S.)',
      fieldOfStudy: 'Computer Science & Engineering',
      startDate: 'Aug 2019',
      endDate: 'May 2023'
    };
    onChange({ ...resume, education: [...resume.education, newEdu] });
    toast.success('New Education entry added!');
  };

  const removeEducation = (id: string) => {
    const updated = resume.education.filter((ed) => ed.id !== id);
    onChange({ ...resume, education: updated });
    toast.success('Education entry deleted');
  };

  const updateEduField = (id: string, field: keyof Education, value: string) => {
    const updated = resume.education.map((ed) => (ed.id === id ? { ...ed, [field]: value } : ed));
    onChange({ ...resume, education: updated });
  };

  // Projects Helpers
  const addProject = () => {
    const newProj: Project = {
      id: `proj-${Date.now()}`,
      name: 'AI Analytics Platform',
      description: 'Real-time candidate telemetry dashboard.',
      technologies: ['React', 'TypeScript', 'Node.js'],
      highlights: ['Handled 10,000 requests/sec.']
    };
    onChange({ ...resume, projects: [...resume.projects, newProj] });
  };

  // Skills Helpers
  const addSkillCategory = () => {
    const newSkill: SkillCategory = {
      id: `skill-${Date.now()}`,
      category: 'Cloud & Infrastructure',
      skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform']
    };
    onChange({ ...resume, skills: [...resume.skills, newSkill] });
  };

  // Certifications Helpers
  const addCertification = () => {
    const newCert: Certification = {
      id: `cert-${Date.now()}`,
      name: 'AWS Certified Solutions Architect – Professional',
      issuer: 'Amazon Web Services',
      date: 'Jan 2024'
    };
    onChange({ ...resume, certifications: [...(resume.certifications || []), newCert] });
  };

  const applyOrderPreset = (preset: 'default' | 'projects-first' | 'skills-first' | 'experience-first') => {
    let newOrder: SectionKey[] = ['summary', 'experience', 'education', 'projects', 'skills', 'certifications'];
    if (preset === 'projects-first') {
      newOrder = ['summary', 'projects', 'experience', 'skills', 'education', 'certifications'];
    } else if (preset === 'skills-first') {
      newOrder = ['summary', 'skills', 'experience', 'projects', 'education', 'certifications'];
    } else if (preset === 'experience-first') {
      newOrder = ['summary', 'experience', 'projects', 'skills', 'education', 'certifications'];
    }
    onChange({ ...resume, sectionOrder: newOrder });
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xl shadow-slate-200/60 flex flex-col h-full">
      {/* Section Prioritizer Bar - ULTRA MODERN LIGHT MODE INDIGO STYLING */}
      <div className="bg-gradient-to-r from-indigo-50/90 via-purple-50/40 to-indigo-50/90 border border-indigo-200/90 rounded-2xl p-3.5 mb-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 pb-2 border-b border-indigo-100">
          <span className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
            ⚡ Reorder Resume Sections Live
          </span>
          {/* Preset Shortcuts */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-600 font-extrabold hidden sm:inline">Presets:</span>
            <button
              onClick={() => applyOrderPreset('projects-first')}
              className="px-3 py-1 rounded-lg bg-white hover:bg-indigo-600 hover:text-white border-2 border-indigo-600 text-indigo-700 font-black shadow-xs transition-all cursor-pointer"
            >
              Projects First
            </button>
            <button
              onClick={() => applyOrderPreset('skills-first')}
              className="px-3 py-1 rounded-lg bg-white hover:bg-purple-600 hover:text-white border-2 border-purple-600 text-purple-700 font-black shadow-xs transition-all cursor-pointer"
            >
              Skills First
            </button>
            <button
              onClick={() => applyOrderPreset('default')}
              className="px-3 py-1 rounded-lg bg-white hover:bg-slate-800 hover:text-white border-2 border-slate-400 text-slate-800 font-black shadow-xs transition-all cursor-pointer"
            >
              Default Order
            </button>
          </div>
        </div>

        {/* Reorderable Section Badges - VIBRANT HIGH CONTRAST */}
        <div className="flex flex-wrap gap-2">
          {sectionOrder.map((secKey, idx) => {
            const labels: Record<SectionKey, string> = {
              summary: 'Summary',
              experience: 'Experience',
              education: 'Education',
              projects: 'Projects',
              skills: 'Skills',
              certifications: 'Certifications'
            };
            const isDragging = draggedIndex === idx;

            return (
              <div
                key={secKey}
                draggable
                onDragStart={(e) => {
                  setDraggedIndex(idx);
                  e.dataTransfer.setData('text/plain', idx.toString());
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(e) => {
                  handleTabDrop(idx, e);
                }}
                className={`flex items-center space-x-2 px-3.5 py-2 bg-white border-2 rounded-xl text-xs font-black transition-all select-none shadow-xs cursor-grab active:cursor-grabbing ${
                  isDragging
                    ? 'border-indigo-600 bg-indigo-100 text-indigo-950 ring-2 ring-indigo-500 shadow-md scale-95'
                    : 'border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/40 text-slate-900 hover:shadow-md'
                }`}
              >
                <span
                  onClick={() => setActiveTab(secKey === 'summary' ? 'contact' : secKey)}
                  className="font-black text-slate-900 whitespace-nowrap hover:text-indigo-600 transition-colors"
                >
                  {idx + 1}. {labels[secKey]}
                </span>
                <div className="flex items-center space-x-1 border-l-2 border-slate-200 pl-2 ml-1">
                  <button
                    disabled={idx === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      moveSection(idx, idx - 1);
                    }}
                    className="p-1 hover:bg-indigo-600 hover:text-white rounded-md text-indigo-700 font-black text-xs disabled:opacity-20 transition-colors cursor-pointer"
                    title="Move Up in Template"
                  >
                    ▲
                  </button>
                  <button
                    disabled={idx === sectionOrder.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      moveSection(idx, idx + 1);
                    }}
                    className="p-1 hover:bg-indigo-600 hover:text-white rounded-md text-indigo-700 font-black text-xs disabled:opacity-20 transition-colors cursor-pointer"
                    title="Move Down in Template"
                  >
                    ▼
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Editor Tab Navigation - VIBRANT LIGHT MODE ACCENTS */}
      <div className="flex items-center space-x-2 border-b-2 border-slate-100 pb-3 overflow-x-auto no-scrollbar">
        {/* Contact Tab */}
        <button
          onClick={() => setActiveTab('contact')}
          className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all border-2 cursor-pointer ${
            activeTab === 'contact'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30'
              : 'bg-white hover:bg-indigo-50 text-slate-800 border-slate-200 hover:border-indigo-300'
          }`}
        >
          Contact & Summary
        </button>

        {/* Dynamic Draggable Section Tabs */}
        {sectionOrder.map((secKey, idx) => {
          const tabConfig: Record<SectionKey, { label: string; tabId: typeof activeTab }> = {
            summary: { label: 'Summary', tabId: 'contact' },
            experience: { label: 'Experience', tabId: 'experience' },
            education: { label: 'Education', tabId: 'education' },
            projects: { label: 'Projects', tabId: 'projects' },
            skills: { label: 'Skills', tabId: 'skills' },
            certifications: { label: 'Certifications', tabId: 'certifications' },
          };

          const config = tabConfig[secKey];
          const isDragging = draggedIndex === idx;

          return (
            <div
              key={secKey}
              draggable
              onDragStart={(e) => {
                setDraggedIndex(idx);
                e.dataTransfer.setData('text/plain', idx.toString());
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                handleTabDrop(idx, e);
              }}
              onClick={() => setActiveTab(config.tabId)}
              className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap cursor-grab active:cursor-grabbing transition-all select-none border-2 ${
                isDragging
                  ? 'bg-indigo-100 border-indigo-600 text-indigo-950 opacity-60 scale-95 shadow-inner'
                  : activeTab === config.tabId
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30'
                  : 'bg-white hover:bg-indigo-50 text-slate-800 border-slate-200 hover:border-indigo-300'
              }`}
              title="Click to edit, or drag left/right to reorder"
            >
              <span>{config.label}</span>
            </div>
          );
        })}
      </div>

      {/* Editor Body */}
      <div className="flex-1 overflow-y-auto pt-4 space-y-4 pr-1">
        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  value={resume.contact.fullName}
                  onChange={(e) => updateContact('fullName', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Job Title</label>
                <input
                  type="text"
                  value={resume.contact.jobTitle}
                  onChange={(e) => updateContact('jobTitle', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email</label>
                <input
                  type="email"
                  value={resume.contact.email}
                  onChange={(e) => updateContact('email', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phone</label>
                <input
                  type="text"
                  value={resume.contact.phone}
                  onChange={(e) => updateContact('phone', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Location</label>
                <input
                  type="text"
                  value={resume.contact.location}
                  onChange={(e) => updateContact('location', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">LinkedIn URL</label>
                <input
                  type="text"
                  value={resume.contact.linkedin}
                  onChange={(e) => updateContact('linkedin', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Professional Summary</label>
              <textarea
                rows={4}
                value={resume.contact.summary}
                onChange={(e) => updateContact('summary', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-400"
              />
            </div>
          </div>
        )}

        {/* Experience Tab */}
        {activeTab === 'experience' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-extrabold text-slate-900">Work Experience ({resume.experience.length})</h3>
              <button
                onClick={addExperience}
                className="flex items-center space-x-1 text-xs text-indigo-600 hover:text-indigo-700 font-bold bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Position</span>
              </button>
            </div>

            {resume.experience.map((exp) => {
              const isCurrentlyWorking = Boolean(exp.current || exp.endDate?.toLowerCase() === 'present');
              return (
              <div key={exp.id} className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex justify-between items-start">
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => updateExpField(exp.id, 'company', e.target.value)}
                    className="font-bold text-sm bg-transparent text-slate-900 focus:outline-none border-b border-transparent hover:border-slate-300 w-full"
                    placeholder="Company Name"
                  />
                  <button
                    onClick={() => removeExp(exp.id)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <input
                    type="text"
                    value={exp.position}
                    onChange={(e) => updateExpField(exp.id, 'position', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder-slate-400"
                    placeholder="Position Title"
                  />

                <div className="grid grid-cols-2 gap-2">
                  {/* Start Date - Month/Year Selectors */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Start Date</label>
                    <div className="flex gap-1.5">
                      <select
                        value={parseMonthYear(exp.startDate).month}
                        onChange={(e) => {
                          const parsed = parseMonthYear(exp.startDate);
                          const newDate = e.target.value && parsed.year ? `${e.target.value} ${parsed.year}` : e.target.value || parsed.year;
                          updateExpField(exp.id, 'startDate', newDate);
                        }}
                        className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                      >
                        <option value="">Month</option>
                        {getMonthOptions().map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                      <select
                        value={parseMonthYear(exp.startDate).year}
                        onChange={(e) => {
                          const parsed = parseMonthYear(exp.startDate);
                          const newDate = parsed.month && e.target.value ? `${parsed.month} ${e.target.value}` : e.target.value || parsed.month;
                          updateExpField(exp.id, 'startDate', newDate);
                        }}
                        className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                      >
                        <option value="">Year</option>
                        {getYearOptions().map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* End Date - Month/Year Selectors or Present */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">End Date</label>
                    {isCurrentlyWorking ? (
                      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2 text-xs font-bold text-indigo-700 text-center">
                        Present
                      </div>
                    ) : (
                      <div className="flex gap-1.5">
                        <select
                          value={parseMonthYear(exp.endDate).month}
                          onChange={(e) => {
                            const parsed = parseMonthYear(exp.endDate);
                            const newDate = e.target.value && parsed.year ? `${e.target.value} ${parsed.year}` : e.target.value || parsed.year;
                            updateExpField(exp.id, 'endDate', newDate);
                          }}
                          className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                        >
                          <option value="">Month</option>
                          {getMonthOptions().map((m) => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                          ))}
                        </select>
                        <select
                          value={parseMonthYear(exp.endDate).year}
                          onChange={(e) => {
                            const parsed = parseMonthYear(exp.endDate);
                            const newDate = parsed.month && e.target.value ? `${parsed.month} ${e.target.value}` : e.target.value || parsed.month;
                            updateExpField(exp.id, 'endDate', newDate);
                          }}
                          className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                        >
                          <option value="">Year</option>
                          {getYearOptions().map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Currently Working Here Checkbox */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isCurrentlyWorking}
                    onChange={(e) => {
                      const isCurrent = e.target.checked;
                      updateExpFields(exp.id, {
                        current: isCurrent,
                        endDate: isCurrent ? 'Present' : (exp.endDate?.toLowerCase() === 'present' ? '' : exp.endDate)
                      });
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-700">Currently working here</span>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <div></div>
                  <input
                    type="text"
                    value={exp.location}
                    onChange={(e) => updateExpField(exp.id, 'location', e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder-slate-400"
                    placeholder="Location (e.g. New York, NY)"
                  />
                </div>

                {/* Highlights / Bullets */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bullet Accomplishments</span>
                    <button
                      onClick={() => addExpHighlight(exp.id)}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
                    >
                      + Add Bullet
                    </button>
                  </div>
                  {exp.highlights.map((bullet, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={bullet}
                        onChange={(e) => updateExpHighlight(exp.id, idx, e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder-slate-400"
                      />
                      <button
                        onClick={() => optimizeHighlightWithAI(exp.id, idx, exp.position)}
                        className="p-2 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/40 rounded-lg text-xs"
                        title="Enhance with AI metric optimization"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeExpHighlight(exp.id, idx)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          </div>
        )}

        {/* Education Tab - COMPLETE ADD, EDIT, DELETE & UNIVERSITY / SCHOOL NAME FIELDS */}
        {activeTab === 'education' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Education & Academic Qualifications ({resume.education.length})
                </h3>
                <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                  Add or edit your Universities, Colleges, High Schools, and Degrees
                </p>
              </div>
              <button
                onClick={addEducation}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs text-white font-black bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Education</span>
              </button>
            </div>

            {resume.education.map((edu, idx) => (
              <div key={edu.id} className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs relative group">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-xs font-black text-indigo-900 uppercase tracking-wider">
                    Education #{idx + 1}
                  </span>
                  <button
                    onClick={() => removeEducation(edu.id)}
                    className="flex items-center space-x-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-md transition-colors"
                    title="Delete Education Entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>

                {/* University / College / School Name */}
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    University / College / School Name
                  </label>
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={(e) => updateEduField(edu.id, 'institution', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder-slate-400"
                    placeholder="e.g. University of California, Berkeley or St. Xavier High School"
                  />
                </div>

                {/* Degree & Field of Study */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">
                      Degree / Certification / Diploma
                    </label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => updateEduField(edu.id, 'degree', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder-slate-400"
                      placeholder="e.g. Bachelor of Science (B.S.) or 12th Grade Senior Secondary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">
                      Field of Study / Major
                    </label>
                    <input
                      type="text"
                      value={edu.fieldOfStudy}
                      onChange={(e) => updateEduField(edu.id, 'fieldOfStudy', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder-slate-400"
                      placeholder="e.g. Computer Science & Engineering"
                    />
                  </div>
                </div>

                {/* Start Date & End Date - Month/Year Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">
                      Start Date
                    </label>
                    <div className="flex gap-1.5">
                      <select
                        value={parseMonthYear(edu.startDate).month}
                        onChange={(e) => {
                          const parsed = parseMonthYear(edu.startDate);
                          const newDate = e.target.value && parsed.year ? `${e.target.value} ${parsed.year}` : e.target.value || parsed.year;
                          updateEduField(edu.id, 'startDate', newDate);
                        }}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                      >
                        <option value="">Month</option>
                        {getMonthOptions().map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                      <select
                        value={parseMonthYear(edu.startDate).year}
                        onChange={(e) => {
                          const parsed = parseMonthYear(edu.startDate);
                          const newDate = parsed.month && e.target.value ? `${parsed.month} ${e.target.value}` : e.target.value || parsed.month;
                          updateEduField(edu.id, 'startDate', newDate);
                        }}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                      >
                        <option value="">Year</option>
                        {getYearOptions().map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">
                      End Date
                    </label>
                    <div className="flex gap-1.5">
                      <select
                        value={parseMonthYear(edu.endDate).month}
                        onChange={(e) => {
                          const parsed = parseMonthYear(edu.endDate);
                          const newDate = e.target.value && parsed.year ? `${e.target.value} ${parsed.year}` : e.target.value || parsed.year;
                          updateEduField(edu.id, 'endDate', newDate);
                        }}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                      >
                        <option value="">Month</option>
                        {getMonthOptions().map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                      <select
                        value={parseMonthYear(edu.endDate).year}
                        onChange={(e) => {
                          const parsed = parseMonthYear(edu.endDate);
                          const newDate = parsed.month && e.target.value ? `${parsed.month} ${e.target.value}` : e.target.value || parsed.month;
                          updateEduField(edu.id, 'endDate', newDate);
                        }}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                      >
                        <option value="">Year</option>
                        {getYearOptions().map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-extrabold text-slate-900">Key Projects ({resume.projects.length})</h3>
              <button
                onClick={addProject}
                className="flex items-center space-x-1 text-xs text-indigo-600 hover:text-indigo-700 font-bold bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Project</span>
              </button>
            </div>

            {resume.projects.map((proj) => (
              <div key={proj.id} className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex justify-between items-start">
                  <input
                    type="text"
                    value={proj.name}
                    onChange={(e) => {
                      const updated = resume.projects.map((p) => (p.id === proj.id ? { ...p, name: e.target.value } : p));
                      onChange({ ...resume, projects: updated });
                    }}
                    className="font-bold text-sm bg-transparent text-slate-900 border-b border-slate-200 focus:border-indigo-500 pb-0.5 focus:outline-none flex-1 mr-2 transition-all"
                    placeholder="Project Name (e.g. AI Resume Architect)"
                  />
                  <button
                    onClick={() => {
                      const updated = resume.projects.filter((p) => p.id !== proj.id);
                      onChange({ ...resume, projects: updated });
                    }}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Role & Timeline */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Your Role in Project</label>
                    <input
                      type="text"
                      value={proj.role || ''}
                      onChange={(e) => {
                        const updated = resume.projects.map((p) => (p.id === proj.id ? { ...p, role: e.target.value } : p));
                        onChange({ ...resume, projects: updated });
                      }}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder-slate-400"
                      placeholder="e.g. Lead Architect"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Start Date</label>
                    <div className="flex gap-1.5">
                      <select
                        value={parseMonthYear(proj.startDate).month}
                        onChange={(e) => {
                          const parsed = parseMonthYear(proj.startDate);
                          const newDate = e.target.value && parsed.year ? `${e.target.value} ${parsed.year}` : e.target.value || parsed.year;
                          const updated = resume.projects.map((p) => (p.id === proj.id ? { ...p, startDate: newDate } : p));
                          onChange({ ...resume, projects: updated });
                        }}
                        className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                      >
                        <option value="">Month</option>
                        {getMonthOptions().map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                      <select
                        value={parseMonthYear(proj.startDate).year}
                        onChange={(e) => {
                          const parsed = parseMonthYear(proj.startDate);
                          const newDate = parsed.month && e.target.value ? `${parsed.month} ${e.target.value}` : e.target.value || parsed.month;
                          const updated = resume.projects.map((p) => (p.id === proj.id ? { ...p, startDate: newDate } : p));
                          onChange({ ...resume, projects: updated });
                        }}
                        className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                      >
                        <option value="">Year</option>
                        {getYearOptions().map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">End Date</label>
                    <div className="flex gap-1.5">
                      <select
                        value={parseMonthYear(proj.endDate).month}
                        onChange={(e) => {
                          const parsed = parseMonthYear(proj.endDate);
                          const newDate = e.target.value && parsed.year ? `${e.target.value} ${parsed.year}` : e.target.value || parsed.year;
                          const updated = resume.projects.map((p) => (p.id === proj.id ? { ...p, endDate: newDate } : p));
                          onChange({ ...resume, projects: updated });
                        }}
                        className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                      >
                        <option value="">Month</option>
                        {getMonthOptions().map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                      <select
                        value={parseMonthYear(proj.endDate).year}
                        onChange={(e) => {
                          const parsed = parseMonthYear(proj.endDate);
                          const newDate = parsed.month && e.target.value ? `${parsed.month} ${e.target.value}` : e.target.value || parsed.month;
                          const updated = resume.projects.map((p) => (p.id === proj.id ? { ...p, endDate: newDate } : p));
                          onChange({ ...resume, projects: updated });
                        }}
                        className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                      >
                        <option value="">Year</option>
                        {getYearOptions().map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Live Link & Repo Link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Live Link URL</label>
                    <input
                      type="text"
                      value={proj.link || ''}
                      onChange={(e) => {
                        const updated = resume.projects.map((p) => (p.id === proj.id ? { ...p, link: e.target.value } : p));
                        onChange({ ...resume, projects: updated });
                      }}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder-slate-400"
                      placeholder="https://myproject.com"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Repo / GitHub Link</label>
                    <input
                      type="text"
                      value={proj.repoLink || ''}
                      onChange={(e) => {
                        const updated = resume.projects.map((p) => (p.id === proj.id ? { ...p, repoLink: e.target.value } : p));
                        onChange({ ...resume, projects: updated });
                      }}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder-slate-400"
                      placeholder="https://github.com/username/repo"
                    />
                  </div>
                </div>

                {/* Tech Stack Used (comma-separated) */}
                <div>
                  <label className="block text-[10px] font-black text-slate-800 uppercase tracking-wider mb-1">
                    Tech Stack Used (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={(proj.technologies || []).join(', ')}
                    onChange={(e) => {
                      const techArr = e.target.value.split(',').map((t) => t.trim()).filter(Boolean);
                      const updated = resume.projects.map((p) => (p.id === proj.id ? { ...p, technologies: techArr } : p));
                      onChange({ ...resume, projects: updated });
                    }}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-900 focus:bg-white focus:border-indigo-600 transition-all placeholder-slate-400"
                    placeholder="React, Next.js, Node.js, TypeScript, Tailwind CSS, AWS"
                  />
                </div>

                {/* Overview Description */}
                <div>
                  <label className="block text-[10px] font-black text-slate-800 uppercase tracking-wider mb-1">
                    Overview Description
                  </label>
                  <textarea
                    rows={2}
                    value={proj.description}
                    onChange={(e) => {
                      const updated = resume.projects.map((p) => (p.id === proj.id ? { ...p, description: e.target.value } : p));
                      onChange({ ...resume, projects: updated });
                    }}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-600 transition-all placeholder-slate-400"
                    placeholder="Provide a high-level summary of the project purpose and architectural scope..."
                  />
                </div>

                {/* Project Highlights & Key Features (Bullet Points) */}
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider">
                      Project Highlights & Key Features (Bullet Points)
                    </span>
                    <button
                      onClick={() => {
                        const updated = resume.projects.map((p) => {
                          if (p.id === proj.id) {
                            return { ...p, highlights: [...(p.highlights || []), 'Delivered scalable microservices with 99.99% uptime.'] };
                          }
                          return p;
                        });
                        onChange({ ...resume, projects: updated });
                      }}
                      className="text-[10px] font-black text-indigo-700 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md transition-all cursor-pointer"
                    >
                      + Add Feature Bullet
                    </button>
                  </div>
                  {(proj.highlights || []).map((bullet, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={bullet}
                        onChange={(e) => {
                          const updated = resume.projects.map((p) => {
                            if (p.id === proj.id) {
                              const h = [...p.highlights];
                              h[idx] = e.target.value;
                              return { ...p, highlights: h };
                            }
                            return p;
                          });
                          onChange({ ...resume, projects: updated });
                        }}
                        className="flex-1 bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-600 transition-all"
                        placeholder="Bullet accomplishment..."
                      />
                      <button
                        onClick={() => optimizeHighlightWithAI(proj.id, idx, proj.name)}
                        className="p-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-lg text-xs transition-colors"
                        title="Enhance bullet with AI metrics"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          const updated = resume.projects.map((p) => {
                            if (p.id === proj.id) {
                              const h = p.highlights.filter((_, i) => i !== idx);
                              return { ...p, highlights: h };
                            }
                            return p;
                          });
                          onChange({ ...resume, projects: updated });
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Bullet"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Skills Tab - CLEAN TECH STACK INPUT (COMMA-SEPARATED) */}
        {activeTab === 'skills' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Technical Skills & Categorized Stacks ({resume.skills.length})
                </h3>
                <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                  Enter comma-separated technologies for each skill domain
                </p>
              </div>
              <button
                onClick={addSkillCategory}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs text-white font-black bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Category</span>
              </button>
            </div>

            {resume.skills.map((cat, idx) => (
              <div key={cat.id} className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <input
                    type="text"
                    value={cat.category}
                    onChange={(e) => {
                      const updated = resume.skills.map((s) => (s.id === cat.id ? { ...s, category: e.target.value } : s));
                      onChange({ ...resume, skills: updated });
                    }}
                    className="font-black text-xs bg-transparent text-indigo-900 border-b border-slate-200 focus:border-indigo-600 focus:outline-none pb-0.5 transition-all flex-1 mr-3 uppercase tracking-wider"
                    placeholder="Category Name (e.g. Frontend Stack)"
                  />
                  <button
                    onClick={() => {
                      const updated = resume.skills.filter((s) => s.id !== cat.id);
                      onChange({ ...resume, skills: updated });
                      toast.success('Skill category deleted');
                    }}
                    className="flex items-center space-x-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-md transition-colors"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-800 uppercase tracking-wider mb-1">
                    Tech Stack Used (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={cat.skills.join(', ')}
                    onChange={(e) => {
                      const skillsArr = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                      const updated = resume.skills.map((s) => (s.id === cat.id ? { ...s, skills: skillsArr } : s));
                      onChange({ ...resume, skills: updated });
                    }}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-black text-slate-900 focus:bg-white focus:border-indigo-600 transition-all placeholder-slate-400"
                    placeholder="React 19, Next.js (App Router), TypeScript, Tailwind CSS, Redux, GraphQL"
                  />
                </div>

                {/* Parsed Skill Badges Live Preview */}
                {cat.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {cat.skills.map((s, i) => (
                      <span key={i} className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-md text-[11px] font-extrabold shadow-2xs">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Certifications Tab */}
        {activeTab === 'certifications' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-extrabold text-slate-900">Certifications & Licenses ({(resume.certifications || []).length})</h3>
              <button
                onClick={addCertification}
                className="flex items-center space-x-1 text-xs text-indigo-600 hover:text-indigo-700 font-bold bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Certification</span>
              </button>
            </div>

            {(resume.certifications || []).map((cert) => (
              <div key={cert.id} className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-start">
                  <input
                    type="text"
                    value={cert.name}
                    onChange={(e) => {
                      const updated = (resume.certifications || []).map((c) => (c.id === cert.id ? { ...c, name: e.target.value } : c));
                      onChange({ ...resume, certifications: updated });
                    }}
                    className="font-bold text-xs bg-transparent text-indigo-600 border-b border-slate-200 focus:border-indigo-500 focus:outline-none pb-1 transition-all flex-1 mr-2"
                    placeholder="Certification Name (e.g. AWS Certified Solutions Architect)"
                  />
                  <button
                    onClick={() => {
                      const updated = (resume.certifications || []).filter((c) => c.id !== cert.id);
                      onChange({ ...resume, certifications: updated });
                    }}
                    className="text-slate-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={cert.issuer}
                    onChange={(e) => {
                      const updated = (resume.certifications || []).map((c) => (c.id === cert.id ? { ...c, issuer: e.target.value } : c));
                      onChange({ ...resume, certifications: updated });
                    }}
                    className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder-slate-400"
                    placeholder="Issuing Organization (e.g. Amazon Web Services)"
                  />
                  <div className="flex gap-1.5">
                    <select
                      value={parseMonthYear(cert.date).month}
                      onChange={(e) => {
                        const parsed = parseMonthYear(cert.date);
                        const newDate = e.target.value && parsed.year ? `${e.target.value} ${parsed.year}` : e.target.value || parsed.year;
                        const updated = (resume.certifications || []).map((c) => (c.id === cert.id ? { ...c, date: newDate } : c));
                        onChange({ ...resume, certifications: updated });
                      }}
                      className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    >
                      <option value="">Month</option>
                      {getMonthOptions().map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                    <select
                      value={parseMonthYear(cert.date).year}
                      onChange={(e) => {
                        const parsed = parseMonthYear(cert.date);
                        const newDate = parsed.month && e.target.value ? `${parsed.month} ${e.target.value}` : e.target.value || parsed.month;
                        const updated = (resume.certifications || []).map((c) => (c.id === cert.id ? { ...c, date: newDate } : c));
                        onChange({ ...resume, certifications: updated });
                      }}
                      className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    >
                      <option value="">Year</option>
                      {getYearOptions().map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

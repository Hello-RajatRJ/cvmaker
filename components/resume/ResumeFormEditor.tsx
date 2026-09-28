'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Trash2, Sparkles, User, Briefcase, GraduationCap, Code2, Award, ChevronDown, ChevronUp, GripVertical, ArrowLeft, ArrowRight, Layers, Globe, BookOpen, Heart, Trophy, Languages, AlertCircle, Check, Save, X } from 'lucide-react';
import { ResumeData, WorkExperience, Education, Project, SkillCategory, Certification, Language, Award as AwardType, Publication, VolunteerExperience, SectionKey } from '../../types/resume';
import { AIResumeService } from '../../services/aiResumeService';
import { parseMonthYear, getMonthOptions, getYearOptions } from '../../utils/formatDate';
import toast from 'react-hot-toast';

interface ResumeFormEditorProps {
  resume: ResumeData;
  onChange: (updated: ResumeData) => void;
}

// ─── Validation Helpers ───
function isValidEmail(email: string): boolean {
  if (!email) return true; // empty is ok (optional)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUrl(url: string): boolean {
  if (!url) return true;
  try {
    // Allow urls without protocol
    const testUrl = url.startsWith('http') ? url : `https://${url}`;
    new URL(testUrl);
    return true;
  } catch { return false; }
}

type TabId = 'contact' | 'experience' | 'education' | 'projects' | 'skills' | 'certifications' | 'languages' | 'awards' | 'publications' | 'volunteer';

// ─── Shared Styles ───
const inputClass = "w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all placeholder-slate-400 shadow-2xs";
const labelClass = "block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1";
const cardClass = "p-4 bg-white border border-slate-200/90 rounded-xl space-y-3 shadow-xs hover:border-lime-300 transition-colors";
const addBtnClass = "flex items-center space-x-1.5 px-3 py-1.5 text-xs text-slate-950 font-black bg-lime-400 hover:bg-lime-500 rounded-lg shadow-xs shadow-lime-500/20 transition-all cursor-pointer";
const deleteBtnClass = "flex items-center space-x-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-md transition-colors";
const selectClass = "flex-1 bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-900 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none transition-all";

// ─── Confirmation Dialog Component ───
function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]" onClick={onCancel}>
      <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
          <p className="text-sm font-semibold text-slate-900">{message}</p>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer">Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Validation Indicator ───
function ValidationHint({ valid, message }: { valid: boolean; message: string }) {
  if (valid) return null;
  return <p className="text-[10px] font-semibold text-rose-500 mt-0.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{message}</p>;
}

// ─── Required Field Label ───
function FieldLabel({ label, required, optional }: { label: string; required?: boolean; optional?: boolean }) {
  return (
    <label className={labelClass}>
      {label}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
      {optional && <span className="text-slate-400 ml-1 normal-case font-medium">(optional)</span>}
    </label>
  );
}

// ─── Comma-Separated List Input Component ───
interface CommaSeparatedInputProps {
  values?: string[];
  onChange: (items: string[]) => void;
  className?: string;
  placeholder?: string;
  showBadges?: boolean;
}

function CommaSeparatedInput({
  values,
  onChange,
  className,
  placeholder,
  showBadges = false,
}: CommaSeparatedInputProps) {
  const [text, setText] = useState(() => (values || []).join(', '));
  const isFocusedRef = useRef(false);
  const lastSentRef = useRef((values || []).join('|#|'));

  useEffect(() => {
    const incoming = (values || []).join('|#|');
    if (!isFocusedRef.current) {
      setText((values || []).join(', '));
      lastSentRef.current = incoming;
    } else if (incoming !== lastSentRef.current) {
      // External update (e.g. AI ATS optimization or preset load)
      setText((values || []).join(', '));
      lastSentRef.current = incoming;
    }
  }, [values]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setText(newText);
    const items = newText.split(',').map((s) => s.trim()).filter(Boolean);
    lastSentRef.current = items.join('|#|');
    onChange(items);
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    const items = text.split(',').map((s) => s.trim()).filter(Boolean);
    const formatted = items.join(', ');
    setText(formatted);
    lastSentRef.current = items.join('|#|');
    onChange(items);
  };

  const handleFocus = () => {
    isFocusedRef.current = true;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const items = text.split(',').map((s) => s.trim()).filter(Boolean);
      const formatted = items.join(', ');
      setText(formatted);
      lastSentRef.current = items.join('|#|');
      onChange(items);
    }
  };

  const handleRemoveBadge = (indexToRemove: number) => {
    const currentItems = values || [];
    const updated = currentItems.filter((_, i) => i !== indexToRemove);
    const newText = updated.join(', ');
    setText(newText);
    lastSentRef.current = updated.join('|#|');
    onChange(updated);
  };

  const activeBadges = values || [];

  return (
    <div className="space-y-1.5">
      <input
        type="text"
        value={text}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={className}
        placeholder={placeholder}
      />
      {showBadges && activeBadges.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {activeBadges.map((badge, idx) => (
            <span
              key={`${badge}-${idx}`}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-lime-50 border border-lime-200 text-slate-800 rounded-md text-[11px] font-bold shadow-2xs group"
            >
              <span>{badge}</span>
              <button
                type="button"
                onClick={() => handleRemoveBadge(idx)}
                className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer p-0.5 rounded"
                title={`Remove ${badge}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ResumeFormEditor({ resume, onChange }: ResumeFormEditorProps) {
  const [activeTab, setActiveTab] = useState<TabId>('contact');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ message: string; action: () => void } | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // ─── Autosave to localStorage ───
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('cvmaker_autosave', JSON.stringify(resume));
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (e) {
        console.warn('Autosave failed', e);
      }
    }, 1000); // debounced 1 second
    setSaveStatus('saving');
    return () => clearTimeout(timer);
  }, [resume]);

  const sectionOrder: SectionKey[] = resume.sectionOrder || ['summary', 'experience', 'education', 'projects', 'skills', 'certifications', 'languages', 'awards', 'publications', 'volunteer'];

  const visibleSections = resume.visibleSections || {
    summary: true, experience: true, education: true, projects: true, skills: true, certifications: true,
    languages: false, awards: false, publications: false, volunteer: false,
  };

  const toggleSectionVisibility = (key: SectionKey) => {
    onChange({
      ...resume,
      visibleSections: { ...visibleSections, [key]: !visibleSections[key] }
    });
  };

  const moveSection = (fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || fromIndex >= sectionOrder.length) return;
    if (toIndex < 0 || toIndex >= sectionOrder.length) return;
    const updated = [...sectionOrder];
    const [movedItem] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, movedItem);
    onChange({ ...resume, sectionOrder: updated });
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

  // ─── Confirmation helper ───
  const confirmBeforeDelete = (message: string, action: () => void) => {
    setConfirmDelete({ message, action });
  };

  // ─── Contact Field Updates ───
  const updateContact = (field: keyof ResumeData['contact'], value: any) => {
    onChange({
      ...resume,
      contact: { ...resume.contact, [field]: value }
    });
  };

  // ─── Experience Helpers ───
  const addExperience = () => {
    const newExp: WorkExperience = {
      id: `exp-${Date.now()}`,
      company: '',
      position: '',
      employmentType: 'Full-time',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      highlights: ['']
    };
    onChange({ ...resume, experience: [...resume.experience, newExp] });
    toast.success('New work experience added!');
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
    const exp = resume.experience.find(e => e.id === id);
    const hasContent = exp && (exp.company || exp.position || exp.highlights.some(h => h));
    if (hasContent) {
      confirmBeforeDelete(`Delete "${exp.position || 'this experience'}" at "${exp.company || 'unnamed company'}"? This cannot be undone.`, () => {
        onChange({ ...resume, experience: resume.experience.filter((e) => e.id !== id) });
        toast.success('Experience entry deleted');
      });
    } else {
      onChange({ ...resume, experience: resume.experience.filter((e) => e.id !== id) });
    }
  };

  const addExpHighlight = (expId: string) => {
    const updated = resume.experience.map((e) => {
      if (e.id === expId) {
        return { ...e, highlights: [...e.highlights, ''] };
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

  const moveExpEntry = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= resume.experience.length) return;
    const arr = [...resume.experience];
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    onChange({ ...resume, experience: arr });
  };

  const optimizeHighlightWithAI = (sectionType: 'experience' | 'projects', entryId: string, idx: number, role: string) => {
    if (sectionType === 'experience') {
      const exp = resume.experience.find((e) => e.id === entryId);
      if (!exp) return;
      const current = exp.highlights[idx];
      const enhanced = AIResumeService.generateEnhancedBullet(current, role);
      updateExpHighlight(entryId, idx, enhanced);
    } else {
      const proj = resume.projects.find((p) => p.id === entryId);
      if (!proj) return;
      const current = proj.highlights[idx];
      const enhanced = AIResumeService.generateEnhancedBullet(current, role);
      const updated = resume.projects.map((p) => {
        if (p.id === entryId) {
          const h = [...p.highlights];
          h[idx] = enhanced;
          return { ...p, highlights: h };
        }
        return p;
      });
      onChange({ ...resume, projects: updated });
    }
  };

  // ─── Education Helpers ───
  const addEducation = () => {
    const newEdu: Education = {
      id: `edu-${Date.now()}`,
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: ''
    };
    onChange({ ...resume, education: [...resume.education, newEdu] });
    toast.success('New education entry added!');
  };

  const removeEducation = (id: string) => {
    const edu = resume.education.find(e => e.id === id);
    const hasContent = edu && (edu.institution || edu.degree);
    if (hasContent) {
      confirmBeforeDelete(`Delete "${edu.degree || 'this education'}" at "${edu.institution || 'unnamed institution'}"?`, () => {
        onChange({ ...resume, education: resume.education.filter((ed) => ed.id !== id) });
        toast.success('Education entry deleted');
      });
    } else {
      onChange({ ...resume, education: resume.education.filter((ed) => ed.id !== id) });
    }
  };

  const updateEduField = (id: string, field: keyof Education, value: any) => {
    const updated = resume.education.map((ed) => (ed.id === id ? { ...ed, [field]: value } : ed));
    onChange({ ...resume, education: updated });
  };

  const moveEduEntry = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= resume.education.length) return;
    const arr = [...resume.education];
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    onChange({ ...resume, education: arr });
  };

  // ─── Projects Helpers ───
  const addProject = () => {
    const newProj: Project = {
      id: `proj-${Date.now()}`,
      name: '',
      description: '',
      technologies: [],
      highlights: ['']
    };
    onChange({ ...resume, projects: [...resume.projects, newProj] });
    toast.success('New project added!');
  };

  const removeProject = (id: string) => {
    const proj = resume.projects.find(p => p.id === id);
    const hasContent = proj && (proj.name || proj.description);
    if (hasContent) {
      confirmBeforeDelete(`Delete project "${proj.name || 'unnamed project'}"?`, () => {
        onChange({ ...resume, projects: resume.projects.filter((p) => p.id !== id) });
        toast.success('Project deleted');
      });
    } else {
      onChange({ ...resume, projects: resume.projects.filter((p) => p.id !== id) });
    }
  };

  const moveProjEntry = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= resume.projects.length) return;
    const arr = [...resume.projects];
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    onChange({ ...resume, projects: arr });
  };

  // ─── Skills Helpers ───
  const addSkillCategory = () => {
    const newSkill: SkillCategory = {
      id: `skill-${Date.now()}`,
      category: '',
      skills: []
    };
    onChange({ ...resume, skills: [...resume.skills, newSkill] });
    toast.success('New skill category added!');
  };

  // ─── Certifications Helpers ───
  const addCertification = () => {
    const newCert: Certification = {
      id: `cert-${Date.now()}`,
      name: '',
      issuer: '',
      date: ''
    };
    onChange({ ...resume, certifications: [...(resume.certifications || []), newCert] });
    toast.success('New certification added!');
  };

  // ─── Languages Helpers ───
  const addLanguage = () => {
    const newLang: Language = {
      id: `lang-${Date.now()}`,
      name: '',
      proficiency: 'Professional',
    };
    onChange({ ...resume, languages: [...(resume.languages || []), newLang] });
    toast.success('New language added!');
  };

  // ─── Awards Helpers ───
  const addAward = () => {
    const newAward: AwardType = {
      id: `award-${Date.now()}`,
      title: '',
      issuer: '',
      date: '',
    };
    onChange({ ...resume, awards: [...(resume.awards || []), newAward] });
    toast.success('New award added!');
  };

  // ─── Publications Helpers ───
  const addPublication = () => {
    const newPub: Publication = {
      id: `pub-${Date.now()}`,
      title: '',
      publisher: '',
      date: '',
    };
    onChange({ ...resume, publications: [...(resume.publications || []), newPub] });
    toast.success('New publication added!');
  };

  // ─── Volunteer Helpers ───
  const addVolunteer = () => {
    const newVol: VolunteerExperience = {
      id: `vol-${Date.now()}`,
      organization: '',
      role: '',
      startDate: '',
      endDate: '',
    };
    onChange({ ...resume, volunteer: [...(resume.volunteer || []), newVol] });
    toast.success('New volunteer experience added!');
  };

  const applyOrderPreset = (preset: 'default' | 'projects-first' | 'skills-first' | 'experience-first') => {
    let newOrder: SectionKey[] = ['summary', 'experience', 'education', 'projects', 'skills', 'certifications', 'languages', 'awards', 'publications', 'volunteer'];
    if (preset === 'projects-first') {
      newOrder = ['summary', 'projects', 'experience', 'skills', 'education', 'certifications', 'languages', 'awards', 'publications', 'volunteer'];
    } else if (preset === 'skills-first') {
      newOrder = ['summary', 'skills', 'experience', 'projects', 'education', 'certifications', 'languages', 'awards', 'publications', 'volunteer'];
    } else if (preset === 'experience-first') {
      newOrder = ['summary', 'experience', 'projects', 'skills', 'education', 'certifications', 'languages', 'awards', 'publications', 'volunteer'];
    }
    onChange({ ...resume, sectionOrder: newOrder });
  };

  // ─── Section completion count ───
  const getSectionProgress = (key: SectionKey): { filled: number; total: number } => {
    switch (key) {
      case 'summary': return { filled: resume.contact.summary ? 1 : 0, total: 1 };
      case 'experience': return { filled: resume.experience.filter(e => e.company && e.position).length, total: Math.max(1, resume.experience.length) };
      case 'education': return { filled: resume.education.filter(e => e.institution && e.degree).length, total: Math.max(1, resume.education.length) };
      case 'projects': return { filled: resume.projects.filter(p => p.name).length, total: Math.max(1, resume.projects.length) };
      case 'skills': return { filled: resume.skills.filter(s => s.skills.length > 0).length, total: Math.max(1, resume.skills.length) };
      case 'certifications': return { filled: (resume.certifications || []).filter(c => c.name).length, total: Math.max(1, (resume.certifications || []).length) };
      case 'languages': return { filled: (resume.languages || []).filter(l => l.name).length, total: Math.max(1, (resume.languages || []).length) };
      case 'awards': return { filled: (resume.awards || []).filter(a => a.title).length, total: Math.max(1, (resume.awards || []).length) };
      case 'publications': return { filled: (resume.publications || []).filter(p => p.title).length, total: Math.max(1, (resume.publications || []).length) };
      case 'volunteer': return { filled: (resume.volunteer || []).filter(v => v.organization).length, total: Math.max(1, (resume.volunteer || []).length) };
      default: return { filled: 0, total: 1 };
    }
  };

  // ─── Date picker helper ───
  const renderDatePicker = (label: string, dateStr: string | undefined, onChangeDate: (val: string) => void) => (
    <div>
      <FieldLabel label={label} />
      <div className="flex gap-1.5">
        <select
          value={parseMonthYear(dateStr).month}
          onChange={(e) => {
            const parsed = parseMonthYear(dateStr);
            const newDate = e.target.value && parsed.year ? `${e.target.value} ${parsed.year}` : e.target.value || parsed.year;
            onChangeDate(newDate);
          }}
          className={selectClass}
        >
          <option value="">Month</option>
          {getMonthOptions().map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <select
          value={parseMonthYear(dateStr).year}
          onChange={(e) => {
            const parsed = parseMonthYear(dateStr);
            const newDate = parsed.month && e.target.value ? `${parsed.month} ${e.target.value}` : e.target.value || parsed.month;
            onChangeDate(newDate);
          }}
          className={selectClass}
        >
          <option value="">Year</option>
          {getYearOptions().map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
    </div>
  );

  const sectionLabels: Record<SectionKey, string> = {
    summary: 'Summary',
    experience: 'Experience',
    education: 'Education',
    projects: 'Projects',
    skills: 'Skills',
    certifications: 'Certifications',
    languages: 'Languages',
    awards: 'Awards',
    publications: 'Publications',
    volunteer: 'Volunteer',
  };

  const tabIdForSection = (key: SectionKey): TabId => {
    if (key === 'summary') return 'contact';
    return key as TabId;
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xl shadow-slate-200/60 flex flex-col h-full">
      {/* Confirm Dialog */}
      {confirmDelete && (
        <ConfirmDialog
          message={confirmDelete.message}
          onConfirm={() => { confirmDelete.action(); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* Save Status Indicator */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CV Form Editor</span>
        <div className="flex items-center gap-1.5 text-[10px] font-bold">
          {saveStatus === 'saving' && <><Save className="w-3 h-3 text-amber-500 animate-pulse" /><span className="text-amber-600">Saving…</span></>}
          {saveStatus === 'saved' && <><Check className="w-3 h-3 text-emerald-500" /><span className="text-emerald-600">Auto-saved</span></>}
          {saveStatus === 'idle' && <><Save className="w-3 h-3 text-slate-400" /><span className="text-slate-400">Auto-save on</span></>}
        </div>
      </div>

      {/* Section Prioritizer Bar */}
      <div className="bg-gradient-to-r from-indigo-50/90 via-purple-50/40 to-indigo-50/90 border border-lime-200/90 rounded-2xl p-3.5 mb-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 pb-2 border-b border-lime-200">
          <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            ⚡ Reorder Resume Sections Live
          </span>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-600 font-extrabold hidden sm:inline">Presets:</span>
            <button onClick={() => applyOrderPreset('projects-first')} className="px-3 py-1 rounded-lg bg-white hover:bg-lime-500 hover:text-slate-950 border-2 border-lime-500 text-lime-800 font-black shadow-xs transition-all cursor-pointer">Projects First</button>
            <button onClick={() => applyOrderPreset('skills-first')} className="px-3 py-1 rounded-lg bg-white hover:bg-lime-500 hover:text-slate-950 border-2 border-lime-500 text-lime-800 font-black shadow-xs transition-all cursor-pointer">Skills First</button>
            <button onClick={() => applyOrderPreset('default')} className="px-3 py-1 rounded-lg bg-white hover:bg-slate-800 hover:text-white border-2 border-slate-400 text-slate-800 font-black shadow-xs transition-all cursor-pointer">Default Order</button>
          </div>
        </div>

        {/* Reorderable Section Badges */}
        <div className="flex flex-wrap gap-2">
          {sectionOrder.map((secKey, idx) => {
            const isDragging = draggedIndex === idx;
            const isVisible = visibleSections[secKey] !== false;
            const progress = getSectionProgress(secKey);

            return (
              <div
                key={secKey}
                draggable
                onDragStart={(e) => {
                  setDraggedIndex(idx);
                  e.dataTransfer.setData('text/plain', idx.toString());
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                onDrop={(e) => { handleTabDrop(idx, e); }}
                className={`flex items-center space-x-2 px-3.5 py-2 bg-white border-2 rounded-xl text-xs font-black transition-all select-none shadow-xs cursor-grab active:cursor-grabbing ${isDragging
                  ? 'border-lime-500 bg-lime-50 text-slate-950 ring-2 ring-lime-400 shadow-md scale-95'
                  : !isVisible
                    ? 'border-slate-200 bg-slate-50 text-slate-400'
                    : 'border-slate-200 hover:border-lime-500 hover:bg-lime-50/40 text-slate-900 hover:shadow-md'
                  }`}
              >
                <span
                  onClick={() => setActiveTab(tabIdForSection(secKey))}
                  className="font-black whitespace-nowrap hover:text-lime-700 transition-colors"
                >
                  {idx + 1}. {sectionLabels[secKey]}
                </span>
                {/* Visibility toggle */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSectionVisibility(secKey); }}
                  className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold transition-colors cursor-pointer ${isVisible ? 'bg-lime-100 text-lime-800' : 'bg-slate-200 text-slate-500'}`}
                  title={isVisible ? 'Click to hide section' : 'Click to show section'}
                >
                  {isVisible ? 'ON' : 'OFF'}
                </button>
                <div className="flex items-center space-x-1 border-l-2 border-slate-200 pl-2 ml-1">
                  <button
                    disabled={idx === 0}
                    onClick={(e) => { e.stopPropagation(); moveSection(idx, idx - 1); }}
                    className="p-1 hover:bg-lime-500 hover:text-slate-950 rounded-md text-lime-800 font-black text-xs disabled:opacity-20 transition-colors cursor-pointer"
                    title="Move Up"
                  >▲</button>
                  <button
                    disabled={idx === sectionOrder.length - 1}
                    onClick={(e) => { e.stopPropagation(); moveSection(idx, idx + 1); }}
                    className="p-1 hover:bg-lime-500 hover:text-slate-950 rounded-md text-lime-800 font-black text-xs disabled:opacity-20 transition-colors cursor-pointer"
                    title="Move Down"
                  >▼</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Editor Tab Navigation */}
      <div className="flex items-center space-x-2 border-b-2 border-slate-100 pb-3 overflow-x-auto no-scrollbar">
        {/* Contact Tab - always first */}
        <button
          onClick={() => setActiveTab('contact')}
          className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all border-2 cursor-pointer ${activeTab === 'contact'
            ? 'bg-lime-400 text-slate-950 border-lime-500 shadow-md shadow-lime-500/25'
            : 'bg-white hover:bg-lime-50 text-slate-800 border-slate-200 hover:border-lime-400'
            }`}
        >Contact & Summary</button>

        {/* Dynamic Section Tabs */}
        {sectionOrder.filter(k => k !== 'summary').map((secKey, idx) => {
          const tabId = secKey as TabId;
          const isVisible = visibleSections[secKey] !== false;

          return (
            <button
              key={secKey}
              onClick={() => setActiveTab(tabId)}
              className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap cursor-pointer transition-all border-2 ${
                activeTab === tabId
                  ? 'bg-lime-400 text-slate-950 border-lime-500 shadow-md shadow-lime-500/25'
                  : !isVisible
                    ? 'bg-slate-50 text-slate-400 border-slate-200'
                    : 'bg-white hover:bg-lime-50 text-slate-800 border-slate-200 hover:border-lime-400'
              }`}
            >{sectionLabels[secKey]}</button>
          );
        })}
      </div>

      {/* Editor Body */}
      <div className="flex-1 overflow-y-auto pt-4 space-y-4 pr-1">
        {/* ═══════════════ Contact & Summary Tab ═══════════════ */}
        {activeTab === 'contact' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Core Personal Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <FieldLabel label="Full Name" required />
                <input type="text" value={resume.contact.fullName} onChange={(e) => updateContact('fullName', e.target.value)} className={inputClass} placeholder="Your full name" />
                {!resume.contact.fullName && <ValidationHint valid={false} message="Full name is required" />}
              </div>
              <div>
                <FieldLabel label="Professional Title" required />
                <input type="text" value={resume.contact.jobTitle} onChange={(e) => updateContact('jobTitle', e.target.value)} className={inputClass} placeholder="e.g. Senior Software Engineer" />
              </div>
              <div>
                <FieldLabel label="Email Address" required />
                <input type="email" value={resume.contact.email} onChange={(e) => updateContact('email', e.target.value)} className={inputClass} placeholder="you@example.com" />
                <ValidationHint valid={isValidEmail(resume.contact.email)} message="Enter a valid email address" />
              </div>
              <div>
                <FieldLabel label="Phone Number" />
                <input type="tel" value={resume.contact.phone} onChange={(e) => updateContact('phone', e.target.value)} className={inputClass} placeholder="+91 98765 43210" />
              </div>
              <div>
                <FieldLabel label="City & Country" />
                <input type="text" value={resume.contact.location} onChange={(e) => updateContact('location', e.target.value)} className={inputClass} placeholder="e.g. Bangalore, India" />
              </div>
              <div>
                <FieldLabel label="Full Address" optional />
                <input type="text" value={resume.contact.address || ''} onChange={(e) => updateContact('address', e.target.value)} className={inputClass} placeholder="Street address (optional)" />
              </div>
            </div>

            {/* Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <FieldLabel label="LinkedIn URL" />
                <input type="url" value={resume.contact.linkedin} onChange={(e) => updateContact('linkedin', e.target.value)} className={inputClass} placeholder="linkedin.com/in/username" />
                <ValidationHint valid={isValidUrl(resume.contact.linkedin)} message="Enter a valid URL" />
              </div>
              <div>
                <FieldLabel label="GitHub URL" />
                <input type="url" value={resume.contact.github} onChange={(e) => updateContact('github', e.target.value)} className={inputClass} placeholder="github.com/username" />
                <ValidationHint valid={isValidUrl(resume.contact.github)} message="Enter a valid URL" />
              </div>
              <div>
                <FieldLabel label="Portfolio / Website" />
                <input type="url" value={resume.contact.website} onChange={(e) => updateContact('website', e.target.value)} className={inputClass} placeholder="https://yoursite.com" />
                <ValidationHint valid={isValidUrl(resume.contact.website)} message="Enter a valid URL" />
              </div>
            </div>

            {/* Optional Personal Details */}
            <details className="group">
              <summary className="text-xs font-black text-slate-600 cursor-pointer hover:text-lime-700 transition-colors flex items-center gap-1.5 py-2">
                <ChevronDown className="w-3.5 h-3.5 group-open:rotate-180 transition-transform" />
                Optional Personal Details (Date of Birth, Nationality, Work Authorization)
              </summary>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <FieldLabel label="Date of Birth" optional />
                  <input type="text" value={resume.contact.dateOfBirth || ''} onChange={(e) => updateContact('dateOfBirth', e.target.value)} className={inputClass} placeholder="DD/MM/YYYY" />
                </div>
                <div>
                  <FieldLabel label="Nationality" optional />
                  <input type="text" value={resume.contact.nationality || ''} onChange={(e) => updateContact('nationality', e.target.value)} className={inputClass} placeholder="e.g. Indian" />
                </div>
                <div>
                  <FieldLabel label="Work Authorization" optional />
                  <input type="text" value={resume.contact.workAuthorization || ''} onChange={(e) => updateContact('workAuthorization', e.target.value)} className={inputClass} placeholder="e.g. H1B, Work Permit" />
                </div>
              </div>
            </details>

            {/* Professional Summary */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <FieldLabel label="Professional Summary" />
                <span className={`text-[10px] font-bold ${(resume.contact.summary || '').length > 500 ? 'text-rose-500' : 'text-slate-400'}`}>
                  {(resume.contact.summary || '').length} / 500 chars
                </span>
              </div>
              <textarea
                rows={4}
                value={resume.contact.summary}
                onChange={(e) => updateContact('summary', e.target.value)}
                className={inputClass}
                placeholder="Write a concise professional summary highlighting your key skills, experience, and career goals (3-5 sentences recommended)…"
              />
            </div>

            {/* Summary Extras */}
            <details className="group">
              <summary className="text-xs font-black text-slate-600 cursor-pointer hover:text-lime-700 transition-colors flex items-center gap-1.5 py-2">
                <ChevronDown className="w-3.5 h-3.5 group-open:rotate-180 transition-transform" />
                Additional Summary Details (Years of Experience, Industry, Key Strengths)
              </summary>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <FieldLabel label="Years of Experience" optional />
                  <input type="text" value={resume.contact.yearsOfExperience || ''} onChange={(e) => updateContact('yearsOfExperience', e.target.value)} className={inputClass} placeholder="e.g. 5+" />
                </div>
                <div>
                  <FieldLabel label="Target Job Title" optional />
                  <input type="text" value={resume.contact.targetJobTitle || ''} onChange={(e) => updateContact('targetJobTitle', e.target.value)} className={inputClass} placeholder="e.g. Lead Engineer" />
                </div>
                <div>
                  <FieldLabel label="Industry" optional />
                  <input type="text" value={resume.contact.industry || ''} onChange={(e) => updateContact('industry', e.target.value)} className={inputClass} placeholder="e.g. FinTech, Healthcare" />
                </div>
              </div>
              <div className="mt-3">
                <FieldLabel label="Key Professional Strengths (comma-separated)" optional />
                <CommaSeparatedInput
                  values={resume.contact.keyStrengths}
                  onChange={(items) => updateContact('keyStrengths', items)}
                  className={inputClass}
                  placeholder="e.g. System Design, Team Leadership, Performance Optimization"
                  showBadges
                />
              </div>
            </details>
          </div>
        )}

        {/* ═══════════════ Experience Tab ═══════════════ */}
        {activeTab === 'experience' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-extrabold text-slate-900">Work Experience ({resume.experience.length})</h3>
              <button onClick={addExperience} className={addBtnClass}>
                <Plus className="w-4 h-4" /><span>Add Position</span>
              </button>
            </div>

            {resume.experience.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold">No work experience added yet.</p>
                <p className="text-[11px] mt-1">Click "Add Position" above to get started.</p>
              </div>
            )}

            {resume.experience.map((exp, idx) => {
              const isCurrentlyWorking = Boolean(exp.current || exp.endDate?.toLowerCase() === 'present');
              return (
                <div key={exp.id} className={cardClass}>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        Experience #{idx + 1}
                      </span>
                      {/* Reorder buttons */}
                      <button disabled={idx === 0} onClick={() => moveExpEntry(idx, -1)} className="p-1 hover:bg-lime-100 rounded text-lime-800 disabled:opacity-20 cursor-pointer" title="Move up"><ChevronUp className="w-3.5 h-3.5" /></button>
                      <button disabled={idx === resume.experience.length - 1} onClick={() => moveExpEntry(idx, 1)} className="p-1 hover:bg-lime-100 rounded text-lime-800 disabled:opacity-20 cursor-pointer" title="Move down"><ChevronDown className="w-3.5 h-3.5" /></button>
                    </div>
                    <button onClick={() => removeExp(exp.id)} className={deleteBtnClass} title="Delete">
                      <Trash2 className="w-3.5 h-3.5" /><span>Delete</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <FieldLabel label="Company Name" required />
                      <input type="text" value={exp.company} onChange={(e) => updateExpField(exp.id, 'company', e.target.value)} className={inputClass} placeholder="Company Name" />
                    </div>
                    <div>
                      <FieldLabel label="Position Title" required />
                      <input type="text" value={exp.position} onChange={(e) => updateExpField(exp.id, 'position', e.target.value)} className={inputClass} placeholder="Job Title" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <FieldLabel label="Employment Type" />
                      <select
                        value={exp.employmentType || ''}
                        onChange={(e) => updateExpField(exp.id, 'employmentType', e.target.value)}
                        className={inputClass}
                      >
                        <option value="">Select type</option>
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                        <option value="Freelance">Freelance</option>
                        <option value="Internship">Internship</option>
                      </select>
                    </div>
                    <div>
                      <FieldLabel label="Location" />
                      <input type="text" value={exp.location} onChange={(e) => updateExpField(exp.id, 'location', e.target.value)} className={inputClass} placeholder="City, Country or Remote" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {renderDatePicker('Start Date', exp.startDate, (val) => updateExpField(exp.id, 'startDate', val))}
                    <div>
                      <FieldLabel label="End Date" />
                      {isCurrentlyWorking ? (
                        <div className="bg-lime-50 border border-lime-200 rounded-lg p-2 text-xs font-bold text-lime-800 text-center">Present</div>
                      ) : (
                        <div className="flex gap-1.5">
                          <select value={parseMonthYear(exp.endDate).month}
                            onChange={(e) => {
                              const parsed = parseMonthYear(exp.endDate);
                              const newDate = e.target.value && parsed.year ? `${e.target.value} ${parsed.year}` : e.target.value || parsed.year;
                              updateExpField(exp.id, 'endDate', newDate);
                            }} className={selectClass}>
                            <option value="">Month</option>
                            {getMonthOptions().map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                          </select>
                          <select value={parseMonthYear(exp.endDate).year}
                            onChange={(e) => {
                              const parsed = parseMonthYear(exp.endDate);
                              const newDate = parsed.month && e.target.value ? `${parsed.month} ${e.target.value}` : e.target.value || parsed.month;
                              updateExpField(exp.id, 'endDate', newDate);
                            }} className={selectClass}>
                            <option value="">Year</option>
                            {getYearOptions().map((y) => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Currently Working Checkbox */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={isCurrentlyWorking}
                      onChange={(e) => {
                        const isCurrent = e.target.checked;
                        updateExpFields(exp.id, {
                          current: isCurrent,
                          endDate: isCurrent ? 'Present' : (exp.endDate?.toLowerCase() === 'present' ? '' : exp.endDate)
                        });
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-lime-700 focus:ring-lime-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-700">Currently working here</span>
                  </label>

                  {/* Technologies used */}
                  <div>
                    <FieldLabel label="Technologies / Tools Used (comma-separated)" optional />
                    <CommaSeparatedInput
                      values={exp.technologies}
                      onChange={(techArr) => updateExpField(exp.id, 'technologies', techArr)}
                      className={inputClass}
                      placeholder="React, TypeScript, AWS, Docker"
                      showBadges
                    />
                  </div>

                  {/* Highlights / Bullets */}
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Key Achievements & Responsibilities</span>
                      <button onClick={() => addExpHighlight(exp.id)} className="text-[10px] font-bold text-lime-700 hover:text-lime-800 hover:underline cursor-pointer">+ Add Bullet</button>
                    </div>
                    {exp.highlights.map((bullet, bidx) => (
                      <div key={bidx} className="flex items-center space-x-2">
                        <input type="text" value={bullet}
                          onChange={(e) => updateExpHighlight(exp.id, bidx, e.target.value)}
                          className={`flex-1 ${inputClass}`}
                          placeholder="Describe an achievement or responsibility…"
                        />
                        <button onClick={() => optimizeHighlightWithAI('experience', exp.id, bidx, exp.position)}
                          className="p-2 bg-lime-50 text-lime-700 hover:bg-indigo-600 hover:text-white rounded-lg text-xs transition-colors cursor-pointer"
                          title="Enhance with AI"
                        ><Sparkles className="w-3.5 h-3.5" /></button>
                        <button onClick={() => removeExpHighlight(exp.id, bidx)}
                          className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                        ><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══════════════ Education Tab ═══════════════ */}
        {activeTab === 'education' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Education & Academic Qualifications ({resume.education.length})
                </h3>
                <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                  Add Universities, Colleges, High Schools, Diplomas and more
                </p>
              </div>
              <button onClick={addEducation} className={addBtnClass}>
                <Plus className="w-4 h-4" /><span>Add Education</span>
              </button>
            </div>

            {resume.education.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold">No education added yet.</p>
                <p className="text-[11px] mt-1">Click "Add Education" to add your qualifications.</p>
              </div>
            )}

            {resume.education.map((edu, idx) => (
              <div key={edu.id} className={cardClass}>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Education #{idx + 1}</span>
                    <button disabled={idx === 0} onClick={() => moveEduEntry(idx, -1)} className="p-1 hover:bg-lime-100 rounded text-lime-800 disabled:opacity-20 cursor-pointer"><ChevronUp className="w-3.5 h-3.5" /></button>
                    <button disabled={idx === resume.education.length - 1} onClick={() => moveEduEntry(idx, 1)} className="p-1 hover:bg-lime-100 rounded text-lime-800 disabled:opacity-20 cursor-pointer"><ChevronDown className="w-3.5 h-3.5" /></button>
                  </div>
                  <button onClick={() => removeEducation(edu.id)} className={deleteBtnClass}><Trash2 className="w-3.5 h-3.5" /><span>Delete</span></button>
                </div>

                <div>
                  <FieldLabel label="Institution Name" required />
                  <input type="text" value={edu.institution} onChange={(e) => updateEduField(edu.id, 'institution', e.target.value)} className={inputClass} placeholder="e.g. University of California, Berkeley or St. Xavier High School" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <FieldLabel label="Degree / Qualification" />
                    <input type="text" value={edu.degree} onChange={(e) => updateEduField(edu.id, 'degree', e.target.value)} className={inputClass} placeholder="e.g. Bachelor of Science (B.S.) or 12th Grade" />
                  </div>
                  <div>
                    <FieldLabel label="Field of Study / Major" />
                    <input type="text" value={edu.fieldOfStudy} onChange={(e) => updateEduField(edu.id, 'fieldOfStudy', e.target.value)} className={inputClass} placeholder="e.g. Computer Science" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <FieldLabel label="Location" optional />
                    <input type="text" value={edu.location || ''} onChange={(e) => updateEduField(edu.id, 'location', e.target.value)} className={inputClass} placeholder="City, Country" />
                  </div>
                  <div>
                    <FieldLabel label="Study Mode" optional />
                    <select value={edu.studyMode || ''} onChange={(e) => updateEduField(edu.id, 'studyMode', e.target.value)} className={inputClass}>
                      <option value="">Select</option>
                      <option value="Regular">Regular</option>
                      <option value="Distance">Distance</option>
                      <option value="Online">Online</option>
                    </select>
                  </div>
                  <div>
                    <FieldLabel label="GPA / Grade" optional />
                    <input type="text" value={edu.gpa || ''} onChange={(e) => updateEduField(edu.id, 'gpa', e.target.value)} className={inputClass} placeholder="e.g. 3.8/4.0 or 85%" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {renderDatePicker('Start Date', edu.startDate, (val) => updateEduField(edu.id, 'startDate', val))}
                  <div>
                    <FieldLabel label="End Date" />
                    {edu.current ? (
                      <div className="bg-lime-50 border border-lime-200 rounded-lg p-2 text-xs font-bold text-lime-800 text-center">Studying</div>
                    ) : (
                      <div className="flex gap-1.5">
                        <select value={parseMonthYear(edu.endDate).month}
                          onChange={(e) => { const p = parseMonthYear(edu.endDate); updateEduField(edu.id, 'endDate', e.target.value && p.year ? `${e.target.value} ${p.year}` : e.target.value || p.year); }}
                          className={selectClass}>
                          <option value="">Month</option>
                          {getMonthOptions().map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                        <select value={parseMonthYear(edu.endDate).year}
                          onChange={(e) => { const p = parseMonthYear(edu.endDate); updateEduField(edu.id, 'endDate', p.month && e.target.value ? `${p.month} ${e.target.value}` : e.target.value || p.month); }}
                          className={selectClass}>
                          <option value="">Year</option>
                          {getYearOptions().map((y) => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={!!edu.current}
                    onChange={(e) => updateEduField(edu.id, 'current', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-lime-700 focus:ring-lime-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-700">Currently studying here</span>
                </label>

                <details className="group">
                  <summary className="text-[10px] font-black text-slate-600 cursor-pointer hover:text-lime-700 transition-colors flex items-center gap-1.5 py-1">
                    <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" />
                    Coursework, Achievements & Description
                  </summary>
                  <div className="space-y-3 pt-2">
                    <div>
                      <FieldLabel label="Relevant Coursework (comma-separated)" optional />
                      <CommaSeparatedInput
                        values={edu.coursework}
                        onChange={(coursework) => updateEduField(edu.id, 'coursework', coursework)}
                        className={inputClass}
                        placeholder="Data Structures, Algorithms, Machine Learning"
                        showBadges
                      />
                    </div>
                    <div>
                      <FieldLabel label="Academic Achievements (comma-separated)" optional />
                      <CommaSeparatedInput
                        values={edu.academicAchievements}
                        onChange={(achievements) => updateEduField(edu.id, 'academicAchievements', achievements)}
                        className={inputClass}
                        placeholder="Dean's List, Scholarship recipient"
                        showBadges
                      />
                    </div>
                    <div>
                      <FieldLabel label="Description" optional />
                      <textarea rows={2} value={edu.description || ''} onChange={(e) => updateEduField(edu.id, 'description', e.target.value)} className={inputClass} placeholder="Any additional notes about your education…" />
                    </div>
                  </div>
                </details>
              </div>
            ))}
          </div>
        )}

        {/* ═══════════════ Projects Tab ═══════════════ */}
        {activeTab === 'projects' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-extrabold text-slate-900">Key Projects ({resume.projects.length})</h3>
              <button onClick={addProject} className={addBtnClass}>
                <Plus className="w-4 h-4" /><span>Add Project</span>
              </button>
            </div>

            {resume.projects.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <Code2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold">No projects added yet.</p>
              </div>
            )}

            {resume.projects.map((proj, idx) => (
              <div key={proj.id} className={cardClass}>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900">Project #{idx + 1}</span>
                    <button disabled={idx === 0} onClick={() => moveProjEntry(idx, -1)} className="p-1 hover:bg-lime-100 rounded text-lime-800 disabled:opacity-20 cursor-pointer"><ChevronUp className="w-3.5 h-3.5" /></button>
                    <button disabled={idx === resume.projects.length - 1} onClick={() => moveProjEntry(idx, 1)} className="p-1 hover:bg-lime-100 rounded text-lime-800 disabled:opacity-20 cursor-pointer"><ChevronDown className="w-3.5 h-3.5" /></button>
                  </div>
                  <button onClick={() => removeProject(proj.id)} className={deleteBtnClass}><Trash2 className="w-3.5 h-3.5" /><span>Delete</span></button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <FieldLabel label="Project Name" required />
                    <input type="text" value={proj.name}
                      onChange={(e) => { const u = resume.projects.map(p => p.id === proj.id ? { ...p, name: e.target.value } : p); onChange({ ...resume, projects: u }); }}
                      className={inputClass} placeholder="Project Name" />
                  </div>
                  <div>
                    <FieldLabel label="Your Role" optional />
                    <input type="text" value={proj.role || ''}
                      onChange={(e) => { const u = resume.projects.map(p => p.id === proj.id ? { ...p, role: e.target.value } : p); onChange({ ...resume, projects: u }); }}
                      className={inputClass} placeholder="e.g. Lead Developer" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {renderDatePicker('Start Date', proj.startDate, (val) => {
                    const u = resume.projects.map(p => p.id === proj.id ? { ...p, startDate: val } : p);
                    onChange({ ...resume, projects: u });
                  })}
                  {renderDatePicker('End Date', proj.endDate, (val) => {
                    const u = resume.projects.map(p => p.id === proj.id ? { ...p, endDate: val } : p);
                    onChange({ ...resume, projects: u });
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <FieldLabel label="Live Link URL" optional />
                    <input type="url" value={proj.link || ''}
                      onChange={(e) => { const u = resume.projects.map(p => p.id === proj.id ? { ...p, link: e.target.value } : p); onChange({ ...resume, projects: u }); }}
                      className={inputClass} placeholder="https://myproject.com" />
                    <ValidationHint valid={isValidUrl(proj.link || '')} message="Enter a valid URL" />
                  </div>
                  <div>
                    <FieldLabel label="Repo / GitHub Link" optional />
                    <input type="url" value={proj.repoLink || ''}
                      onChange={(e) => { const u = resume.projects.map(p => p.id === proj.id ? { ...p, repoLink: e.target.value } : p); onChange({ ...resume, projects: u }); }}
                      className={inputClass} placeholder="https://github.com/user/repo" />
                    <ValidationHint valid={isValidUrl(proj.repoLink || '')} message="Enter a valid URL" />
                  </div>
                </div>

                <div>
                  <FieldLabel label="Tech Stack (comma-separated)" />
                  <CommaSeparatedInput
                    values={proj.technologies}
                    onChange={(techArr) => {
                      const u = resume.projects.map(p => p.id === proj.id ? { ...p, technologies: techArr } : p);
                      onChange({ ...resume, projects: u });
                    }}
                    className={inputClass}
                    placeholder="React, Next.js, TypeScript"
                    showBadges
                  />
                </div>

                <div>
                  <FieldLabel label="Description" />
                  <textarea rows={2} value={proj.description}
                    onChange={(e) => { const u = resume.projects.map(p => p.id === proj.id ? { ...p, description: e.target.value } : p); onChange({ ...resume, projects: u }); }}
                    className={inputClass} placeholder="Brief project overview…" />
                </div>

                {/* Project Highlights */}
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Highlights & Key Features</span>
                    <button
                      onClick={() => {
                        const u = resume.projects.map(p => p.id === proj.id ? { ...p, highlights: [...(p.highlights || []), ''] } : p);
                        onChange({ ...resume, projects: u });
                      }}
                      className="text-[10px] font-bold text-lime-700 hover:text-lime-800 hover:underline cursor-pointer"
                    >+ Add Bullet</button>
                  </div>
                  {(proj.highlights || []).map((bullet, bidx) => (
                    <div key={bidx} className="flex items-center space-x-2">
                      <input type="text" value={bullet}
                        onChange={(e) => {
                          const u = resume.projects.map(p => {
                            if (p.id === proj.id) { const h = [...p.highlights]; h[bidx] = e.target.value; return { ...p, highlights: h }; }
                            return p;
                          });
                          onChange({ ...resume, projects: u });
                        }}
                        className={`flex-1 ${inputClass}`} placeholder="Key achievement or feature…" />
                      <button onClick={() => optimizeHighlightWithAI('projects', proj.id, bidx, proj.name)}
                        className="p-2 bg-lime-50 text-lime-700 hover:bg-indigo-600 hover:text-white rounded-lg text-xs transition-colors cursor-pointer"
                        title="Enhance with AI"><Sparkles className="w-3.5 h-3.5" /></button>
                      <button onClick={() => {
                        const u = resume.projects.map(p => {
                          if (p.id === proj.id) { const h = p.highlights.filter((_, i) => i !== bidx); return { ...p, highlights: h }; }
                          return p;
                        });
                        onChange({ ...resume, projects: u });
                      }} className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════════════ Skills Tab ═══════════════ */}
        {activeTab === 'skills' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Skills & Competencies ({resume.skills.length} categories)
                </h3>
                <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Enter comma-separated skills for each category</p>
              </div>
              <button onClick={addSkillCategory} className={addBtnClass}><Plus className="w-4 h-4" /><span>Add Category</span></button>
            </div>

            {resume.skills.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <Layers className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold">No skill categories added.</p>
              </div>
            )}

            {resume.skills.map((cat, idx) => (
              <div key={cat.id} className={cardClass}>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <input type="text" value={cat.category}
                    onChange={(e) => {
                      const u = resume.skills.map(s => s.id === cat.id ? { ...s, category: e.target.value } : s);
                      onChange({ ...resume, skills: u });
                    }}
                    className="font-black text-xs bg-transparent text-slate-900 border-b border-slate-200 focus:border-lime-500 focus:outline-none pb-0.5 transition-all flex-1 mr-3 uppercase tracking-wider"
                    placeholder="Category Name (e.g. Frontend Stack)"
                  />
                  <button onClick={() => {
                    confirmBeforeDelete(`Delete skill category "${cat.category || 'unnamed'}"?`, () => {
                      onChange({ ...resume, skills: resume.skills.filter(s => s.id !== cat.id) });
                      toast.success('Skill category deleted');
                    });
                  }} className={deleteBtnClass}><Trash2 className="w-3.5 h-3.5" /><span>Delete</span></button>
                </div>

                <div>
                  <FieldLabel label="Skills (comma-separated)" />
                  <CommaSeparatedInput
                    values={cat.skills}
                    onChange={(skillsArr) => {
                      const u = resume.skills.map(s => s.id === cat.id ? { ...s, skills: skillsArr } : s);
                      onChange({ ...resume, skills: u });
                    }}
                    className={inputClass}
                    placeholder="React, TypeScript, Node.js, etc."
                    showBadges
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════════════ Certifications Tab ═══════════════ */}
        {activeTab === 'certifications' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-extrabold text-slate-900">Certifications & Licenses ({(resume.certifications || []).length})</h3>
              <button onClick={addCertification} className={addBtnClass}><Plus className="w-4 h-4" /><span>Add Certification</span></button>
            </div>

            {(resume.certifications || []).length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <Award className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold">No certifications added.</p>
                <p className="text-[11px] mt-1">This section is optional.</p>
              </div>
            )}

            {(resume.certifications || []).map((cert) => (
              <div key={cert.id} className={cardClass}>
                <div className="flex justify-between items-start">
                  <div className="flex-1 mr-2">
                    <FieldLabel label="Certification Name" required />
                    <input type="text" value={cert.name}
                      onChange={(e) => {
                        const u = (resume.certifications || []).map(c => c.id === cert.id ? { ...c, name: e.target.value } : c);
                        onChange({ ...resume, certifications: u });
                      }}
                      className={inputClass} placeholder="e.g. AWS Certified Solutions Architect" />
                  </div>
                  <button onClick={() => {
                    confirmBeforeDelete(`Delete certification "${cert.name || 'unnamed'}"?`, () => {
                      onChange({ ...resume, certifications: (resume.certifications || []).filter(c => c.id !== cert.id) });
                      toast.success('Certification deleted');
                    });
                  }} className="text-slate-400 hover:text-rose-500 p-1 mt-5 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <FieldLabel label="Issuing Organization" />
                    <input type="text" value={cert.issuer}
                      onChange={(e) => { const u = (resume.certifications || []).map(c => c.id === cert.id ? { ...c, issuer: e.target.value } : c); onChange({ ...resume, certifications: u }); }}
                      className={inputClass} placeholder="e.g. Amazon Web Services" />
                  </div>
                  {renderDatePicker('Issue Date', cert.date, (val) => {
                    const u = (resume.certifications || []).map(c => c.id === cert.id ? { ...c, date: val } : c);
                    onChange({ ...resume, certifications: u });
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {!cert.neverExpires && renderDatePicker('Expiry Date', cert.expiryDate, (val) => {
                    const u = (resume.certifications || []).map(c => c.id === cert.id ? { ...c, expiryDate: val } : c);
                    onChange({ ...resume, certifications: u });
                  })}
                  <div>
                    <FieldLabel label="Credential ID" optional />
                    <input type="text" value={cert.credentialId || ''}
                      onChange={(e) => { const u = (resume.certifications || []).map(c => c.id === cert.id ? { ...c, credentialId: e.target.value } : c); onChange({ ...resume, certifications: u }); }}
                      className={inputClass} placeholder="e.g. ABC-123-XYZ" />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={!!cert.neverExpires}
                      onChange={(e) => { const u = (resume.certifications || []).map(c => c.id === cert.id ? { ...c, neverExpires: e.target.checked, expiryDate: e.target.checked ? '' : c.expiryDate } : c); onChange({ ...resume, certifications: u }); }}
                      className="w-4 h-4 rounded border-slate-300 text-lime-700 focus:ring-lime-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-700">Never expires</span>
                  </label>
                </div>

                <div>
                  <FieldLabel label="Credential Verification URL" optional />
                  <input type="url" value={cert.link || ''}
                    onChange={(e) => { const u = (resume.certifications || []).map(c => c.id === cert.id ? { ...c, link: e.target.value } : c); onChange({ ...resume, certifications: u }); }}
                    className={inputClass} placeholder="https://verify.example.com/cert/..." />
                  <ValidationHint valid={isValidUrl(cert.link || '')} message="Enter a valid URL" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════════════ Languages Tab ═══════════════ */}
        {activeTab === 'languages' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-extrabold text-slate-900">Languages ({(resume.languages || []).length})</h3>
              <button onClick={addLanguage} className={addBtnClass}><Plus className="w-4 h-4" /><span>Add Language</span></button>
            </div>

            {(resume.languages || []).length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <Globe className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold">No languages added.</p>
                <p className="text-[11px] mt-1">This section is optional. Toggle ON in the section bar above to show it on your CV.</p>
              </div>
            )}

            {(resume.languages || []).map((lang) => (
              <div key={lang.id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl">
                <input type="text" value={lang.name}
                  onChange={(e) => { const u = (resume.languages || []).map(l => l.id === lang.id ? { ...l, name: e.target.value } : l); onChange({ ...resume, languages: u }); }}
                  className={`flex-1 ${inputClass}`} placeholder="Language (e.g. English)" />
                <select value={lang.proficiency}
                  onChange={(e) => { const u = (resume.languages || []).map(l => l.id === lang.id ? { ...l, proficiency: e.target.value } : l); onChange({ ...resume, languages: u }); }}
                  className={selectClass} style={{ flex: '0 0 130px' }}>
                  <option value="Native">Native</option>
                  <option value="Fluent">Fluent</option>
                  <option value="Professional">Professional</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Basic">Basic</option>
                </select>
                <input type="text" value={lang.certification || ''}
                  onChange={(e) => { const u = (resume.languages || []).map(l => l.id === lang.id ? { ...l, certification: e.target.value } : l); onChange({ ...resume, languages: u }); }}
                  className={`flex-1 ${inputClass}`} placeholder="Test score (optional)" />
                <button onClick={() => {
                  onChange({ ...resume, languages: (resume.languages || []).filter(l => l.id !== lang.id) });
                }} className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}

        {/* ═══════════════ Awards Tab ═══════════════ */}
        {activeTab === 'awards' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-extrabold text-slate-900">Awards & Achievements ({(resume.awards || []).length})</h3>
              <button onClick={addAward} className={addBtnClass}><Plus className="w-4 h-4" /><span>Add Award</span></button>
            </div>

            {(resume.awards || []).length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <Trophy className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold">No awards added.</p>
                <p className="text-[11px] mt-1">This section is optional.</p>
              </div>
            )}

            {(resume.awards || []).map((award) => (
              <div key={award.id} className={cardClass}>
                <div className="flex justify-between items-start">
                  <div className="flex-1 mr-2">
                    <FieldLabel label="Award / Recognition Title" required />
                    <input type="text" value={award.title}
                      onChange={(e) => { const u = (resume.awards || []).map(a => a.id === award.id ? { ...a, title: e.target.value } : a); onChange({ ...resume, awards: u }); }}
                      className={inputClass} placeholder="e.g. Employee of the Year" />
                  </div>
                  <button onClick={() => onChange({ ...resume, awards: (resume.awards || []).filter(a => a.id !== award.id) })} className="text-slate-400 hover:text-rose-500 p-1 mt-5 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <FieldLabel label="Issuing Organization" />
                    <input type="text" value={award.issuer}
                      onChange={(e) => { const u = (resume.awards || []).map(a => a.id === award.id ? { ...a, issuer: e.target.value } : a); onChange({ ...resume, awards: u }); }}
                      className={inputClass} placeholder="Organization name" />
                  </div>
                  {renderDatePicker('Date', award.date, (val) => {
                    const u = (resume.awards || []).map(a => a.id === award.id ? { ...a, date: val } : a);
                    onChange({ ...resume, awards: u });
                  })}
                </div>
                <div>
                  <FieldLabel label="Description" optional />
                  <textarea rows={2} value={award.description || ''}
                    onChange={(e) => { const u = (resume.awards || []).map(a => a.id === award.id ? { ...a, description: e.target.value } : a); onChange({ ...resume, awards: u }); }}
                    className={inputClass} placeholder="Brief description of the award…" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════════════ Publications Tab ═══════════════ */}
        {activeTab === 'publications' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-extrabold text-slate-900">Publications ({(resume.publications || []).length})</h3>
              <button onClick={addPublication} className={addBtnClass}><Plus className="w-4 h-4" /><span>Add Publication</span></button>
            </div>

            {(resume.publications || []).length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold">No publications added.</p>
                <p className="text-[11px] mt-1">This section is optional.</p>
              </div>
            )}

            {(resume.publications || []).map((pub) => (
              <div key={pub.id} className={cardClass}>
                <div className="flex justify-between items-start">
                  <div className="flex-1 mr-2">
                    <FieldLabel label="Publication Title" required />
                    <input type="text" value={pub.title}
                      onChange={(e) => { const u = (resume.publications || []).map(p => p.id === pub.id ? { ...p, title: e.target.value } : p); onChange({ ...resume, publications: u }); }}
                      className={inputClass} placeholder="Title of the publication" />
                  </div>
                  <button onClick={() => onChange({ ...resume, publications: (resume.publications || []).filter(p => p.id !== pub.id) })} className="text-slate-400 hover:text-rose-500 p-1 mt-5 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <FieldLabel label="Publisher / Journal" />
                    <input type="text" value={pub.publisher}
                      onChange={(e) => { const u = (resume.publications || []).map(p => p.id === pub.id ? { ...p, publisher: e.target.value } : p); onChange({ ...resume, publications: u }); }}
                      className={inputClass} placeholder="e.g. IEEE, Medium" />
                  </div>
                  {renderDatePicker('Date', pub.date, (val) => {
                    const u = (resume.publications || []).map(p => p.id === pub.id ? { ...p, date: val } : p);
                    onChange({ ...resume, publications: u });
                  })}
                </div>
                <div>
                  <FieldLabel label="URL" optional />
                  <input type="url" value={pub.url || ''}
                    onChange={(e) => { const u = (resume.publications || []).map(p => p.id === pub.id ? { ...p, url: e.target.value } : p); onChange({ ...resume, publications: u }); }}
                    className={inputClass} placeholder="https://..." />
                </div>
                <div>
                  <FieldLabel label="Description" optional />
                  <textarea rows={2} value={pub.description || ''}
                    onChange={(e) => { const u = (resume.publications || []).map(p => p.id === pub.id ? { ...p, description: e.target.value } : p); onChange({ ...resume, publications: u }); }}
                    className={inputClass} placeholder="Brief description…" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════════════ Volunteer Tab ═══════════════ */}
        {activeTab === 'volunteer' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-extrabold text-slate-900">Volunteer Experience ({(resume.volunteer || []).length})</h3>
              <button onClick={addVolunteer} className={addBtnClass}><Plus className="w-4 h-4" /><span>Add Volunteer</span></button>
            </div>

            {(resume.volunteer || []).length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <Heart className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold">No volunteer experience added.</p>
                <p className="text-[11px] mt-1">This section is optional.</p>
              </div>
            )}

            {(resume.volunteer || []).map((vol) => (
              <div key={vol.id} className={cardClass}>
                <div className="flex justify-between items-start">
                  <div className="flex-1 mr-2">
                    <FieldLabel label="Organization" required />
                    <input type="text" value={vol.organization}
                      onChange={(e) => { const u = (resume.volunteer || []).map(v => v.id === vol.id ? { ...v, organization: e.target.value } : v); onChange({ ...resume, volunteer: u }); }}
                      className={inputClass} placeholder="Organization name" />
                  </div>
                  <button onClick={() => onChange({ ...resume, volunteer: (resume.volunteer || []).filter(v => v.id !== vol.id) })} className="text-slate-400 hover:text-rose-500 p-1 mt-5 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div>
                  <FieldLabel label="Role" />
                  <input type="text" value={vol.role}
                    onChange={(e) => { const u = (resume.volunteer || []).map(v => v.id === vol.id ? { ...v, role: e.target.value } : v); onChange({ ...resume, volunteer: u }); }}
                    className={inputClass} placeholder="Your role" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {renderDatePicker('Start Date', vol.startDate, (val) => {
                    const u = (resume.volunteer || []).map(v => v.id === vol.id ? { ...v, startDate: val } : v);
                    onChange({ ...resume, volunteer: u });
                  })}
                  {renderDatePicker('End Date', vol.endDate, (val) => {
                    const u = (resume.volunteer || []).map(v => v.id === vol.id ? { ...v, endDate: val } : v);
                    onChange({ ...resume, volunteer: u });
                  })}
                </div>
                <div>
                  <FieldLabel label="Description & Achievements" optional />
                  <textarea rows={2} value={vol.description || ''}
                    onChange={(e) => { const u = (resume.volunteer || []).map(v => v.id === vol.id ? { ...v, description: e.target.value } : v); onChange({ ...resume, volunteer: u }); }}
                    className={inputClass} placeholder="Describe your contributions…" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

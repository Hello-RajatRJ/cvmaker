'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  X,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Target,
  ArrowRight,
  Loader2,
  Wand2,
  Zap,
  Check,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Edit3,
  SlidersHorizontal,
  FileText,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  Eye,
  CheckCheck,
  XCircle,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import {
  ATSScoreBreakdown,
  ResumeData,
  OptimizationDraft,
  OptimizationChange,
  KeywordAnalysisItem
} from '../../types/resume';
import { AIResumeService } from '../../services/aiResumeService';
import toast from 'react-hot-toast';

interface ATSCheckerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  atsScore: ATSScoreBreakdown;
  targetJobDescription: string;
  onUpdateJobDescription: (jd: string) => void;
  resumeData: ResumeData;
  onApplyOptimizations: (updated: ResumeData) => void;
  preOptimizationBackup?: ResumeData | null;
  onRestoreOriginal?: () => void;
}

type ActiveTab = 'analysis' | 'review' | 'reanalysis';

export default function ATSCheckerPanel({
  isOpen,
  onClose,
  atsScore,
  targetJobDescription,
  onUpdateJobDescription,
  resumeData,
  onApplyOptimizations,
  preOptimizationBackup,
  onRestoreOriginal,
}: ATSCheckerPanelProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<ActiveTab>('analysis');

  // Loading states
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  // Optimization draft & review state
  const [draft, setDraft] = useState<OptimizationDraft | null>(null);
  const [changesList, setChangesList] = useState<OptimizationChange[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [editingChangeId, setEditingChangeId] = useState<string | null>(null);
  const [editedTexts, setEditedTexts] = useState<Record<string, string>>({});

  // Side-by-side full preview toggle in review tab
  const [showFullCVCompare, setShowFullCVCompare] = useState(false);

  // Score history for re-analysis comparison
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [initialScoreBreakdown, setInitialScoreBreakdown] = useState<ATSScoreBreakdown | null>(null);
  const [latestScoreBreakdown, setLatestScoreBreakdown] = useState<ATSScoreBreakdown | null>(null);

  // Collapsible section states in Analysis tab
  const [showQuestions, setShowQuestions] = useState(true);
  const [showGaps, setShowGaps] = useState(true);
  const [showChecklist, setShowChecklist] = useState(false);

  // Handle potential match answer selection
  const handleAnswerQuestion = (keyword: string, answer: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [keyword]: answer,
    }));
  };

  // 1. Generate Optimization Draft (Apply Optimization workflow)
  const handleApplyOptimization = useCallback(async () => {
    if (!targetJobDescription || targetJobDescription.trim().length < 20) {
      toast.error('Please paste a job description (at least 20 characters) first.');
      return;
    }

    setIsOptimizing(true);
    const toastId = toast.loading('Analyzing your CV and tailoring it to the job description...');

    try {
      // Remember current score for before/after comparison
      const currentScore = atsScore.overallScore;
      setPreviousScore(currentScore);
      setInitialScoreBreakdown(atsScore);

      const generatedDraft = await AIResumeService.generateOptimizedDraft(
        resumeData,
        targetJobDescription,
        userAnswers,
        currentScore
      );

      setDraft(generatedDraft);
      // Initialize all supported changes as accepted by default for user convenience
      const initializedChanges = generatedDraft.changes.map((c) => ({
        ...c,
        status: 'accepted' as const,
      }));
      setChangesList(initializedChanges);

      // Pre-fill edited texts
      const textMap: Record<string, string> = {};
      initializedChanges.forEach((c) => {
        textMap[c.id] = c.optimizedText;
      });
      setEditedTexts(textMap);

      toast.success(
        `Draft generated with ${generatedDraft.changes.length} proposed improvements! Please review them before applying.`,
        { id: toastId }
      );

      // Automatically advance to the Review Changes tab
      setActiveTab('review');
    } catch (err) {
      console.error('Optimization error:', err);
      toast.error('Failed to generate optimizations. Please try again.', { id: toastId });
    } finally {
      setIsOptimizing(false);
    }
  }, [resumeData, targetJobDescription, userAnswers, atsScore.overallScore]);

  // 2. Change Approval Controls in Review Screen
  const handleToggleChangeStatus = (id: string, newStatus: 'accepted' | 'rejected') => {
    setChangesList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
    );
  };

  const handleAcceptAll = () => {
    setChangesList((prev) => prev.map((c) => ({ ...c, status: 'accepted' })));
    toast.success('All proposed improvements accepted.');
  };

  const handleRejectAll = () => {
    setChangesList((prev) => prev.map((c) => ({ ...c, status: 'rejected' })));
    toast('All proposed improvements marked as rejected.');
  };

  const handleSaveInlineEdit = (id: string) => {
    const updatedText = editedTexts[id];
    if (updatedText !== undefined) {
      setChangesList((prev) =>
        prev.map((c) => (c.id === id ? { ...c, optimizedText: updatedText, status: 'accepted' } : c))
      );
    }
    setEditingChangeId(null);
    toast.success('Change updated and accepted.');
  };

  // 3. Confirm & Apply Approved Changes to CV
  const handleConfirmAndApply = useCallback(() => {
    if (!draft) return;

    const acceptedChanges = changesList.filter((c) => c.status === 'accepted');
    if (acceptedChanges.length === 0) {
      toast.error('No changes are currently accepted to apply.');
      return;
    }

    // Clone resume
    let updated: ResumeData = JSON.parse(JSON.stringify(resumeData));

    acceptedChanges.forEach((change) => {
      const textToApply = editedTexts[change.id] || change.optimizedText;

      if (change.section === 'summary') {
        updated.contact.summary = textToApply;
      } else if (change.section === 'experience' && change.targetId && change.bulletIndex !== undefined) {
        const expIdx = updated.experience.findIndex((e) => e.id === change.targetId);
        if (expIdx >= 0 && updated.experience[expIdx].highlights[change.bulletIndex] !== undefined) {
          updated.experience[expIdx].highlights[change.bulletIndex] = textToApply;
        }
      } else if (change.section === 'projects' && change.targetId && change.bulletIndex !== undefined) {
        const projIdx = updated.projects.findIndex((p) => p.id === change.targetId);
        if (projIdx >= 0 && updated.projects[projIdx].highlights[change.bulletIndex] !== undefined) {
          updated.projects[projIdx].highlights[change.bulletIndex] = textToApply;
        }
      } else if (change.section === 'skills') {
        // Find or create category
        const skillsArray = textToApply.split(',').map((s) => s.trim()).filter(Boolean);
        const catName = change.sectionTitle.replace(/^Skills:\s*/, '') || 'Verified JD Skills';
        const existingCat = updated.skills.find((s) => s.category.toLowerCase() === catName.toLowerCase());

        if (existingCat) {
          existingCat.skills = Array.from(new Set([...existingCat.skills, ...skillsArray]));
        } else {
          updated.skills.push({
            id: `skills-cat-${Date.now()}`,
            category: catName,
            skills: skillsArray,
          });
        }
      }
    });

    // Apply to parent state (and autosave)
    onApplyOptimizations(updated);

    // Calculate revised score for comparison
    const newScore = AIResumeService.calculateATSScore(
      updated,
      targetJobDescription,
      previousScore || atsScore.overallScore
    );
    setLatestScoreBreakdown(newScore);

    toast.success('🎉 Approved optimizations applied to your resume and live preview!');
    // Switch to Re-analysis tab
    setActiveTab('reanalysis');
  }, [
    draft,
    changesList,
    editedTexts,
    resumeData,
    targetJobDescription,
    previousScore,
    atsScore.overallScore,
    onApplyOptimizations,
  ]);

  // 4. Rerun ATS Reanalysis on current/revised CV
  const handleRerunATSAnalysis = useCallback(() => {
    setIsReanalyzing(true);
    setTimeout(() => {
      const refreshed = AIResumeService.calculateATSScore(
        resumeData,
        targetJobDescription,
        previousScore || atsScore.overallScore
      );
      setLatestScoreBreakdown(refreshed);
      setIsReanalyzing(false);
      toast.success('ATS analysis refreshed with updated criteria!');
    }, 600);
  }, [resumeData, targetJobDescription, previousScore, atsScore.overallScore]);

  // Active score to display in Reanalysis tab
  const displayScore = latestScoreBreakdown || atsScore;
  const scoreDelta = previousScore !== null ? displayScore.overallScore - previousScore : 0;

  // Newly covered keywords
  const newlyCoveredKeywords = useMemo(() => {
    const baseConfirmed = initialScoreBreakdown?.confirmedKeywords || atsScore.confirmedKeywords || [];
    return displayScore.matchedKeywords.filter(
      (kw) => !baseConfirmed.some((b) => b.toLowerCase() === kw.toLowerCase())
    );
  }, [displayScore.matchedKeywords, initialScoreBreakdown, atsScore.confirmedKeywords]);

  if (!isOpen) return null;

  const scoreColor = (score: number) =>
    score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-rose-400';

  const scoreBgColor = (score: number) =>
    score >= 80 ? 'bg-emerald-500/10 border-emerald-500/30' : score >= 60 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-rose-500/10 border-rose-500/30';

  const acceptedCount = changesList.filter((c) => c.status === 'accepted').length;
  const rejectedCount = changesList.filter((c) => c.status === 'rejected').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-lime-500/30 to-emerald-500/30 border border-lime-500/30 flex items-center justify-center text-lime-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-white">AI ATS Match & Apply Optimization</h2>
                <span className="px-2 py-0.5 rounded-full bg-lime-500/10 border border-lime-500/30 text-[10px] font-bold text-lime-300">
                  ATS Pro
                </span>
              </div>
              <p className="text-xs text-slate-400">Transparent, verifiable resume enhancement based on your real experience</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {preOptimizationBackup && onRestoreOriginal && (
              <button
                onClick={() => {
                  onRestoreOriginal();
                  toast.success('Original CV restored to pre-optimization state.');
                }}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors"
                title="Rollback all optimizations to original CV"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Rollback to Original</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Multi-Step Tab Navigation Bar */}
        <div className="flex items-center px-6 border-b border-slate-800 bg-slate-950/60 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-bold text-xs transition-colors whitespace-nowrap ${
              activeTab === 'analysis'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>1. ATS Match Analysis</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-md bg-slate-800 text-[10px] text-slate-300">
              {atsScore.overallScore}%
            </span>
          </button>

          <button
            onClick={() => setActiveTab('review')}
            disabled={!draft}
            className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-bold text-xs transition-colors whitespace-nowrap ${
              !draft
                ? 'opacity-40 cursor-not-allowed border-transparent text-slate-500'
                : activeTab === 'review'
                ? 'border-lime-400 text-lime-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            <span>2. Review Proposed Changes</span>
            {changesList.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-md bg-lime-500/20 text-lime-300 text-[10px]">
                {acceptedCount}/{changesList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('reanalysis')}
            className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-bold text-xs transition-colors whitespace-nowrap ${
              activeTab === 'reanalysis'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>3. ATS Re-Analysis & Comparison</span>
            {scoreDelta > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px]">
                +{scoreDelta}%
              </span>
            )}
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* ========================================================= */}
          {/* TAB 1: ATS MATCH ANALYSIS & VERIFICATION QUESTIONNAIRE    */}
          {/* ========================================================= */}
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              {/* Job Description Input Area */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                    <Target className="w-4 h-4 text-blue-400" />
                    <span>Target Job Description (JD)</span>
                  </label>
                  <span className="text-[11px] text-slate-500">
                    {targetJobDescription.length} characters entered
                  </span>
                </div>
                <textarea
                  rows={4}
                  placeholder="Paste the target job description here. The ATS engine will extract technical requirements, classify matching skills, spot missing keywords, and tailor your CV..."
                  value={targetJobDescription}
                  onChange={(e) => onUpdateJobDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Match Score Display Ring & Summary */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center space-x-5">
                  <div className="relative w-24 h-24 shrink-0">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" stroke="#1e293b" strokeWidth="8" fill="none" />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        stroke={atsScore.overallScore >= 80 ? '#10b981' : atsScore.overallScore >= 60 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${(atsScore.overallScore / 100) * 264} 264`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-2xl font-black ${scoreColor(atsScore.overallScore)}`}>
                        {atsScore.overallScore}
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">ATS Score</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-white">Current Job Match Strength</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${scoreBgColor(atsScore.overallScore)} ${scoreColor(atsScore.overallScore)}`}>
                        {atsScore.overallScore >= 80 ? 'High Match' : atsScore.overallScore >= 60 ? 'Moderate Match' : 'Low Match'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 max-w-md">
                      {atsScore.scoreExplanation || 'Click Apply Optimization below to generate tailored improvements based on your real experience.'}
                    </p>
                  </div>
                </div>

                {/* Primary Apply Optimization Call to Action */}
                <div className="w-full sm:w-auto shrink-0 flex flex-col items-stretch sm:items-end space-y-1.5">
                  <button
                    onClick={handleApplyOptimization}
                    disabled={isOptimizing}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-lime-400 via-lime-500 to-lime-600 hover:from-lime-300 hover:to-lime-500 text-slate-950 font-black shadow-lime-500/25 disabled:opacity-50 text-white text-xs font-extrabold shadow-lg shadow-lime-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isOptimizing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Analyzing CV & Tailoring to JD...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        <span>Apply Optimization</span>
                      </>
                    )}
                  </button>
                  <span className="text-[10px] text-slate-500 text-center sm:text-right">
                    Generates draft for review without overwriting
                  </span>
                </div>
              </div>

              {/* Sub-Score Breakdown Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Keywords Match</span>
                  <p className={`text-xl font-black mt-1 ${scoreColor(atsScore.keywordMatchScore)}`}>
                    {atsScore.keywordMatchScore}%
                  </p>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">ATS Structure</span>
                  <p className={`text-xl font-black mt-1 ${scoreColor(atsScore.formattingScore)}`}>
                    {atsScore.formattingScore}%
                  </p>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Bullet Impact</span>
                  <p className={`text-xl font-black mt-1 ${scoreColor(atsScore.experienceRelevanceScore)}`}>
                    {atsScore.experienceRelevanceScore}%
                  </p>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Skills Coverage</span>
                  <p className={`text-xl font-black mt-1 ${scoreColor(atsScore.skillsCompletenessScore)}`}>
                    {atsScore.skillsCompletenessScore}%
                  </p>
                </div>
              </div>

              {/* Categorized Requirements: Confirmed vs Potential vs Missing */}
              <div className="space-y-4">
                {/* 1. Confirmed Matches */}
                <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5">
                      <CheckCircle className="w-4 h-4" />
                      <span>Confirmed Matches ({atsScore.confirmedKeywords?.length || atsScore.matchedKeywords.length})</span>
                    </h3>
                    <span className="text-[10px] text-slate-500">Explicitly supported by your CV</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(atsScore.confirmedKeywords || atsScore.matchedKeywords).map((kw, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium"
                      >
                        ✓ {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 2. Potential Matches - Interactive Targeted Questionnaires */}
                {atsScore.potentialKeywords && atsScore.potentialKeywords.length > 0 && (
                  <div className="bg-slate-950/40 border border-amber-500/20 rounded-xl p-4 space-y-3">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setShowQuestions(!showQuestions)}
                    >
                      <div className="flex items-center space-x-2">
                        <HelpCircle className="w-4 h-4 text-amber-400" />
                        <h3 className="text-xs font-bold text-amber-300">
                          Potential Matches ({atsScore.potentialKeywords.length}) — Verification Needed
                        </h3>
                      </div>
                      <button className="text-slate-400 hover:text-white">
                        {showQuestions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400">
                      The job posting requires the following skills. To preserve resume integrity, we do not add skills automatically. Please confirm your experience:
                    </p>

                    {showQuestions && (
                      <div className="space-y-3 pt-1">
                        {atsScore.potentialKeywords.map((item, idx) => {
                          const selectedOption = userAnswers[item.keyword];
                          return (
                            <div
                              key={idx}
                              className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-semibold text-slate-200">
                                  {item.question}
                                </p>
                                <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 shrink-0">
                                  {item.inferredFrom}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                {item.options?.map((opt, oIdx) => {
                                  const isSelected = selectedOption === opt;
                                  return (
                                    <button
                                      key={oIdx}
                                      onClick={() => handleAnswerQuestion(item.keyword, opt)}
                                      className={`text-left px-3 py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center justify-between ${
                                        isSelected
                                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                                      }`}
                                    >
                                      <span>{opt}</span>
                                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1.5" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Missing Keywords & Improvement Checklist */}
                {atsScore.missingKeywords.length > 0 && (
                  <div className="bg-slate-950/40 border border-rose-500/20 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-rose-400 flex items-center space-x-1.5">
                        <AlertCircle className="w-4 h-4" />
                        <span>Missing Requirements ({atsScore.missingKeywords.length})</span>
                      </h3>
                      <button
                        onClick={() => setShowChecklist(!showChecklist)}
                        className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-1"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{showChecklist ? 'Hide Advice' : 'View Action Checklist'}</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {atsScore.missingKeywords.map((kw, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg text-xs bg-rose-500/10 border border-rose-500/20 text-rose-300 font-medium"
                        >
                          + {kw}
                        </span>
                      ))}
                    </div>

                    {showChecklist && (
                      <div className="mt-3 p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
                        <p className="text-[11px] font-bold text-slate-300">
                          Recommended Actions for Genuine Gaps:
                        </p>
                        <ul className="space-y-1.5 text-xs text-slate-400">
                          {atsScore.missingKeywords.slice(0, 4).map((kw, i) => (
                            <li key={i} className="flex items-start space-x-2">
                              <span className="text-blue-400 font-bold">•</span>
                              <span>
                                <strong className="text-slate-200">{kw}</strong>: Document foundational knowledge by completing a quick demo feature on your GitHub, or clarifying related conceptual experience.
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Experience Gaps & Readability Warnings */}
                {(atsScore.experienceGaps?.length || atsScore.readabilityWarnings?.length) ? (
                  <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-2">
                    <button
                      onClick={() => setShowGaps(!showGaps)}
                      className="w-full flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white"
                    >
                      <div className="flex items-center space-x-2">
                        <SlidersHorizontal className="w-4 h-4 text-lime-400" />
                        <span>Experience Gaps & Readability Feedback</span>
                      </div>
                      {showGaps ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {showGaps && (
                      <div className="space-y-2 pt-2">
                        {atsScore.experienceGaps?.map((gap, i) => (
                          <div key={i} className="flex items-start space-x-2 text-xs text-amber-300 bg-amber-500/5 border border-amber-500/20 p-2.5 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <span>{gap}</span>
                          </div>
                        ))}
                        {atsScore.readabilityWarnings?.map((warn, i) => (
                          <div key={i} className="flex items-start space-x-2 text-xs text-slate-300 bg-slate-900 border border-slate-800 p-2.5 rounded-lg">
                            <ArrowRight className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
                            <span>{warn}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: REVIEW PROPOSED CHANGES BEFORE APPLYING            */}
          {/* ========================================================= */}
          {activeTab === 'review' && draft && (
            <div className="space-y-6">
              {/* Review Toolbar & Instructions */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-white">Review Proposed CV Enhancements</h3>
                    <span className="px-2 py-0.5 rounded-full bg-lime-500/20 text-lime-300 text-[10px] font-bold">
                      {acceptedCount} of {changesList.length} Selected
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Review each before-and-after improvement. You can accept, reject, or edit any proposal before applying.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleAcceptAll}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Accept All</span>
                  </button>

                  <button
                    onClick={handleRejectAll}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject All</span>
                  </button>

                  <button
                    onClick={() => setShowFullCVCompare(!showFullCVCompare)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{showFullCVCompare ? 'Card View' : 'Full CV Compare'}</span>
                  </button>
                </div>
              </div>

              {/* Full Side-by-Side CV Compare View */}
              {showFullCVCompare ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Original CV */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Original CV</span>
                      <span className="text-[10px] text-slate-500">Unmodified State</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{resumeData.contact.fullName}</h4>
                      <p className="text-[11px] text-slate-400">{resumeData.contact.jobTitle}</p>
                    </div>
                    {resumeData.contact.summary && (
                      <div className="text-xs text-slate-300 p-2.5 rounded bg-slate-900 border border-slate-800">
                        {resumeData.contact.summary}
                      </div>
                    )}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Experience</span>
                      {resumeData.experience.map((e) => (
                        <div key={e.id} className="text-xs space-y-1">
                          <p className="font-semibold text-slate-300">{e.position} @ {e.company}</p>
                          <ul className="list-disc list-inside text-slate-400 space-y-0.5 text-[11px]">
                            {e.highlights.map((h, i) => (
                              <li key={i}>{h}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Optimized CV Draft */}
                  <div className="bg-slate-950 border border-lime-500/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-lime-500/30">
                      <span className="text-xs font-bold text-lime-400 uppercase tracking-wider">Optimized CV Draft</span>
                      <span className="text-[10px] text-lime-300">With Accepted Changes</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{draft.optimizedResume.contact.fullName}</h4>
                      <p className="text-[11px] text-lime-300 font-semibold">{draft.optimizedResume.contact.jobTitle}</p>
                    </div>
                    {draft.optimizedResume.contact.summary && (
                      <div className="text-xs text-emerald-300 p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 font-medium">
                        {editedTexts['opt-summary'] || draft.optimizedResume.contact.summary}
                      </div>
                    )}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Experience</span>
                      {draft.optimizedResume.experience.map((e) => (
                        <div key={e.id} className="text-xs space-y-1">
                          <p className="font-semibold text-slate-200">{e.position} @ {e.company}</p>
                          <ul className="list-disc list-inside text-emerald-300 space-y-0.5 text-[11px]">
                            {e.highlights.map((h, i) => (
                              <li key={i}>{h}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Card List of Individual Changes */
                <div className="space-y-4">
                  {changesList.map((change) => {
                    const isAccepted = change.status === 'accepted';
                    const isEditing = editingChangeId === change.id;
                    const currentText = editedTexts[change.id] || change.optimizedText;

                    return (
                      <div
                        key={change.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isAccepted
                            ? 'bg-slate-950/80 border-lime-500/40 shadow-sm'
                            : 'bg-slate-950/40 border-slate-800 opacity-60'
                        }`}
                      >
                        {/* Change Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="px-2.5 py-0.5 rounded-md bg-lime-500/10 border border-lime-500/30 text-lime-300 text-[11px] font-bold">
                              {change.sectionTitle}
                            </span>
                            <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                              <span>🎯 Target:</span>
                              <strong className="text-slate-300">{change.relatedRequirement}</strong>
                            </span>
                          </div>

                          {/* Accept / Reject / Edit Controls */}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                if (isEditing) {
                                  handleSaveInlineEdit(change.id);
                                } else {
                                  setEditingChangeId(change.id);
                                }
                              }}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center space-x-1 transition-colors"
                            >
                              <Edit3 className="w-3 h-3 text-blue-400" />
                              <span>{isEditing ? 'Save' : 'Edit'}</span>
                            </button>

                            <button
                              onClick={() => handleToggleChangeStatus(change.id, 'accepted')}
                              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 transition-colors cursor-pointer ${
                                isAccepted
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Accept</span>
                            </button>

                            <button
                              onClick={() => handleToggleChangeStatus(change.id, 'rejected')}
                              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 transition-colors cursor-pointer ${
                                !isAccepted
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-slate-800 text-slate-400 hover:text-rose-400'
                              }`}
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        </div>

                        {/* Reason for Change Explanation */}
                        <div className="mb-3 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-center space-x-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>
                            <strong>Reason:</strong> {change.reason}
                          </span>
                        </div>

                        {/* Before and After Comparison Block */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          {/* Original Text */}
                          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                              Original Text
                            </span>
                            <p className="text-xs text-slate-400 line-through leading-relaxed">
                              {change.originalText}
                            </p>
                          </div>

                          {/* Suggested Text (or inline edit textarea) */}
                          <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                              Suggested Optimization
                            </span>
                            {isEditing ? (
                              <textarea
                                rows={3}
                                value={currentText}
                                onChange={(e) =>
                                  setEditedTexts((prev) => ({
                                    ...prev,
                                    [change.id]: e.target.value,
                                  }))
                                }
                                className="w-full bg-slate-950 border border-blue-500 rounded p-2 text-xs text-white focus:outline-none"
                              />
                            ) : (
                              <p className="text-xs text-emerald-300 font-medium leading-relaxed">
                                {currentText}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: ATS RE-ANALYSIS & BEFORE-AFTER SCORE COMPARISON    */}
          {/* ========================================================= */}
          {activeTab === 'reanalysis' && (
            <div className="space-y-6">
              {/* Score Comparison Hero Banner */}
              <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-2xl p-6 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center space-x-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>ATS Optimization Applied</span>
                      </span>
                      {scoreDelta > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-xs font-extrabold">
                          +{scoreDelta}% Match Boost!
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-black text-white mt-2">
                      Truthful ATS Score Comparison
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-lg">
                      {displayScore.scoreExplanation}
                    </p>
                  </div>

                  {/* Before vs After Score Ring */}
                  <div className="flex items-center space-x-4 bg-slate-900/90 border border-slate-800 p-4 rounded-xl shrink-0">
                    {previousScore !== null && (
                      <div className="text-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Previous</span>
                        <p className="text-2xl font-bold text-slate-400 line-through">{previousScore}%</p>
                      </div>
                    )}

                    {previousScore !== null && (
                      <ArrowRight className="w-5 h-5 text-emerald-400 shrink-0" />
                    )}

                    <div className="text-center">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase">New Score</span>
                      <p className={`text-3xl font-black ${scoreColor(displayScore.overallScore)}`}>
                        {displayScore.overallScore}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4-Dimension Before/After Comparison Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Keyword Match */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-300">Keyword Match</span>
                    <span className="text-[10px] text-slate-500 font-semibold">35% weight</span>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-sm font-semibold text-slate-400 line-through">
                      {initialScoreBreakdown?.keywordMatchScore ?? atsScore.keywordMatchScore}%
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="text-base font-black text-emerald-400">
                      {displayScore.keywordMatchScore}%
                    </span>
                  </div>
                </div>

                {/* Experience Relevance */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-300">Experience Impact</span>
                    <span className="text-[10px] text-slate-500 font-semibold">25% weight</span>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-sm font-semibold text-slate-400 line-through">
                      {initialScoreBreakdown?.experienceRelevanceScore ?? atsScore.experienceRelevanceScore}%
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="text-base font-black text-emerald-400">
                      {displayScore.experienceRelevanceScore}%
                    </span>
                  </div>
                </div>

                {/* Skills Completeness */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-300">Skills Coverage</span>
                    <span className="text-[10px] text-slate-500 font-semibold">25% weight</span>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-sm font-semibold text-slate-400 line-through">
                      {initialScoreBreakdown?.skillsCompletenessScore ?? atsScore.skillsCompletenessScore}%
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="text-base font-black text-emerald-400">
                      {displayScore.skillsCompletenessScore}%
                    </span>
                  </div>
                </div>

                {/* Formatting */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-300">Formatting & ATS</span>
                    <span className="text-[10px] text-slate-500 font-semibold">15% weight</span>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-sm font-semibold text-slate-400 line-through">
                      {initialScoreBreakdown?.formattingScore ?? atsScore.formattingScore}%
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="text-base font-black text-emerald-400">
                      {displayScore.formattingScore}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Newly Covered Keywords Banner */}
              {newlyCoveredKeywords.length > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-emerald-300 flex items-center space-x-1.5">
                    <CheckCircle className="w-4 h-4" />
                    <span>Keywords Now Covered in Your CV ({newlyCoveredKeywords.length})</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {newlyCoveredKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg text-xs bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 font-bold"
                      >
                        ✓ {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Remaining Missing Keywords & Experience Gaps */}
              {displayScore.missingKeywords.length > 0 && (
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                    <AlertCircle className="w-4 h-4 text-slate-400" />
                    <span>Remaining Unmatched JD Requirements ({displayScore.missingKeywords.length})</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    These items were kept out of your CV because you did not confirm personal or professional experience with them, preserving authentic resume credibility.
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {displayScore.missingKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-xs bg-slate-900 border border-slate-800 text-slate-400"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Official ATS Disclaimer */}
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-slate-400">
                <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-slate-300">ATS Estimation Disclaimer:</strong> The ATS score is an estimate based on industry matching algorithms and standard applicant tracking parsers, not a guarantee of passing any employer&apos;s proprietary screening process.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            {activeTab === 'review' && (
              <button
                onClick={() => setActiveTab('analysis')}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Back to Analysis
              </button>
            )}

            {activeTab === 'reanalysis' && (
              <button
                onClick={handleRerunATSAnalysis}
                disabled={isReanalyzing}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {isReanalyzing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                <span>Rerun ATS Analysis</span>
              </button>
            )}

            {preOptimizationBackup && onRestoreOriginal && (
              <button
                onClick={() => {
                  onRestoreOriginal();
                  toast.success('Original CV restored.');
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Original CV</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {activeTab === 'analysis' && (
              <button
                onClick={handleApplyOptimization}
                disabled={isOptimizing}
                className="px-5 py-2.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-black shadow-lime-500/20 disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center space-x-2 cursor-pointer"
              >
                {isOptimizing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Apply Optimization</span>
                  </>
                )}
              </button>
            )}

            {activeTab === 'review' && (
              <button
                onClick={handleConfirmAndApply}
                disabled={acceptedCount === 0}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center space-x-2 cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                <Check className="w-4 h-4" />
                <span>Apply Approved Changes ({acceptedCount})</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

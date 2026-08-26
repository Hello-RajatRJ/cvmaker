'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Clock, Flag, CheckCircle2, ChevronLeft, ChevronRight, Award,
  ShieldAlert, Maximize2, AlertTriangle, XCircle, RefreshCw,
  Camera, Lock, CheckCircle, Eye, ArrowRight, ShieldCheck
} from 'lucide-react';
import { AssessmentService } from '../../../../services/assessmentService';
import { Question, TestResult, ProctorViolationEvent, ProctoringReport } from '../../../../types/assessment';
import CertificateModal from '../../../../components/assessment/CertificateModal';
import AIProctorEngine from '../../../../components/assessment/AIProctorEngine';
import toast from 'react-hot-toast';

export default function TestArenaPage() {
  const params = useParams();
  const router = useRouter();
  const techId = (params?.stackId as string) || 'react';

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<
    Record<string, { selectedOption: string | null; markedForReview: boolean; timeSpentSeconds: number }>
  >({});
  const [timeRemaining, setTimeRemaining] = useState<number>(5400); // 90 minutes (5400s)
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);

  // Proctored Lockdown & Setup State
  const [testStarted, setTestStarted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isTerminated, setIsTerminated] = useState<boolean>(false);
  const [terminationReason, setTerminationReason] = useState<string>('');
  const [restrictedUntil, setRestrictedUntil] = useState<string | null>(null);

  // Proctoring Violations Log
  const [proctorLogs, setProctorLogs] = useState<ProctorViolationEvent[]>([]);
  const [fullscreenWarning, setFullscreenWarning] = useState<boolean>(false);

  // Check 2-day restriction from previous cancellation on mount
  useEffect(() => {
    try {
      const storedRestriction = localStorage.getItem(`test_restriction_${techId}`);
      if (storedRestriction) {
        const restrictedDate = new Date(storedRestriction);
        if (restrictedDate > new Date()) {
          setRestrictedUntil(storedRestriction);
          setIsTerminated(true);
          setTerminationReason('Active 2-day cool-off period in effect from a previously flagged session.');
        } else {
          localStorage.removeItem(`test_restriction_${techId}`);
        }
      }
    } catch (_) {}
  }, [techId]);

  // Load questions
  useEffect(() => {
    const qList = AssessmentService.getDailyShuffledQuestions(techId);
    setQuestions(qList);

    // Try restoring saved progress from localStorage
    try {
      const savedSession = localStorage.getItem(`proctored_session_${techId}`);
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed.userAnswers && parsed.timeRemaining) {
          setUserAnswers(parsed.userAnswers);
          setTimeRemaining(parsed.timeRemaining);
          toast.success('Restored previous test progress safely.', { icon: '🛡️' });
          return;
        }
      }
    } catch (_) {}

    const initialAnswers: Record<string, any> = {};
    qList.forEach((q) => {
      initialAnswers[q.id] = { selectedOption: null, markedForReview: false, timeSpentSeconds: 0 };
    });
    setUserAnswers(initialAnswers);
  }, [techId]);

  // Fullscreen event listener & Tab switch detection
  useEffect(() => {
    if (!testStarted || isCompleted || isTerminated) return;

    const handleFullscreenChange = () => {
      const isNowFullscreen = Boolean(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement
      );
      setIsFullscreen(isNowFullscreen);

      if (!isNowFullscreen) {
        setFullscreenWarning(true);
        handleProctorViolation({
          id: `viol_fs_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'FULLSCREEN_EXIT',
          message: 'Candidate exited full-screen mode.',
          severity: 'warning'
        });
      } else {
        setFullscreenWarning(false);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleProctorViolation({
          id: `viol_tab_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'TAB_SWITCH',
          message: 'Candidate switched tabs or minimized window.',
          severity: 'critical'
        });
      }
    };

    const handleWindowBlur = () => {
      handleProctorViolation({
        id: `viol_blur_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'TAB_SWITCH',
        message: 'Window unfocused / another application accessed.',
        severity: 'critical'
      });
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'You are currently in an active proctored assessment session. Exiting will cancel your test.';
      return e.returnValue;
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [testStarted, isCompleted, isTerminated]);

  // Countdown timer effect
  useEffect(() => {
    if (!testStarted || isCompleted || isTerminated || timeRemaining <= 0) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmitTest();
          return 0;
        }
        // Auto-save session progress every 5 seconds
        if (prev % 5 === 0) {
          try {
            localStorage.setItem(
              `proctored_session_${techId}`,
              JSON.stringify({ userAnswers, timeRemaining: prev - 1 })
            );
          } catch (_) {}
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [testStarted, isCompleted, isTerminated, timeRemaining, userAnswers, techId]);

  const handleProctorViolation = (event: ProctorViolationEvent) => {
    setProctorLogs((prev) => {
      const updated = [...prev, event];
      const criticalCount = updated.filter((e) => e.severity === 'critical').length;
      if (criticalCount >= 4) {
        handleTestTermination('Exceeded violation threshold (4 critical proctoring flags).');
      }
      return updated;
    });
  };

  const handleTestTermination = (reason: string) => {
    setIsTerminated(true);
    setTerminationReason(reason);
    const cooldownDate = new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString();
    setRestrictedUntil(cooldownDate);

    try {
      localStorage.setItem(`test_restriction_${techId}`, cooldownDate);
      localStorage.removeItem(`proctored_session_${techId}`);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (_) {}
  };

  const requestFullscreenAndStart = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if ((document.documentElement as any).webkitRequestFullscreen) {
        await (document.documentElement as any).webkitRequestFullscreen();
      }
      setIsFullscreen(true);
    } catch (e) {
      console.warn('Fullscreen request bypassed:', e);
    }
    setTestStarted(true);
  };

  const reEnterFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      setIsFullscreen(true);
      setFullscreenWarning(false);
    } catch (_) {}
  };

  const handleSelectOption = (option: string) => {
    if (isCompleted || isTerminated) return;
    const currentQ = questions[currentIndex];
    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        ...prev[currentQ.id],
        selectedOption: option
      }
    }));
  };

  const toggleFlagReview = () => {
    if (isCompleted || isTerminated) return;
    const currentQ = questions[currentIndex];
    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        ...prev[currentQ.id],
        markedForReview: !prev[currentQ.id]?.markedForReview
      }
    }));
  };

  const handleSubmitTest = () => {
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      localStorage.removeItem(`proctored_session_${techId}`);
    } catch (_) {}

    const result = AssessmentService.evaluateTestSession(techId, questions, userAnswers);

    const proctoringReport: ProctoringReport = {
      totalViolations: proctorLogs.length,
      warningCount: proctorLogs.filter((p) => p.severity === 'warning').length,
      criticalCount: proctorLogs.filter((p) => p.severity === 'critical').length,
      lookingAwaySeconds: proctorLogs.filter((p) => p.type === 'LOOKING_AWAY').length * 15,
      tabSwitches: proctorLogs.filter((p) => p.type === 'TAB_SWITCH').length,
      fullscreenExits: proctorLogs.filter((p) => p.type === 'FULLSCREEN_EXIT').length,
      isTerminated: false,
      events: proctorLogs
    };

    result.proctoringReport = proctoringReport;
    result.status = 'COMPLETED';

    setTestResult(result);
    setIsCompleted(true);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 1. SCREEN: Test Cancelled / Suspicious Activity Termination
  if (isTerminated) {
    const restrictionFormatted = restrictedUntil ? new Date(restrictedUntil).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'in 2 days';

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-slate-900 border border-rose-500/30 rounded-3xl p-8 shadow-2xl text-center backdrop-blur-xl animate-fadeIn">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto mb-6 text-rose-400">
            <XCircle className="w-8 h-8" />
          </div>

          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-bold mb-4">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>SESSION CANCELLED BY AI PROCTOR</span>
          </div>

          <h2 className="text-2xl font-black text-white mb-2">Assessment Terminated</h2>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-rose-500/20 text-xs text-rose-300 mb-6 text-left space-y-2">
            <p className="font-semibold text-white">Reason for Termination:</p>
            <p className="leading-relaxed">{terminationReason || 'Continuous off-screen gaze or proctoring violation threshold exceeded.'}</p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200 mb-6">
            <p className="font-bold text-white mb-1">Cool-Off Restriction Notice</p>
            <p>Your test has been cancelled due to suspicious activity. Please try again after 2 days (unlocked on <strong className="text-white">{restrictionFormatted}</strong>).</p>
          </div>

          <button
            onClick={() => router.push('/assessment')}
            className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-all"
          >
            Return to Assessment Arena
          </button>
        </div>
      </div>
    );
  }

  // 2. SCREEN: Pre-Test Setup & Fullscreen Camera Check
  if (!testStarted) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl animate-fadeIn">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">AI Proctored Assessment: {techId.toUpperCase()}</h1>
              <p className="text-xs text-slate-400">70 Questions • 90 Minutes • Fullscreen AI Monitored</p>
            </div>
          </div>

          <div className="space-y-3 mb-6 text-xs text-slate-300">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start space-x-3">
              <Camera className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
              <div>
                <strong className="text-white">Live Camera AI Tracking:</strong>
                <p className="text-slate-400 mt-0.5">Your webcam will monitor posture, head orientation, and screen focus during the entire session.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start space-x-3">
              <Maximize2 className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <strong className="text-white">Fullscreen Lock (F11):</strong>
                <p className="text-slate-400 mt-0.5">The test must run in full-screen mode. Tab switching or exiting full-screen will trigger immediate violation flags.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start space-x-3">
              <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
              <div>
                <strong className="text-white">Strict Anti-Cheat Policy:</strong>
                <p className="text-slate-400 mt-0.5">Looking away for more than 1 minute or excessive violations will automatically terminate the test with a 2-day cooldown restriction.</p>
              </div>
            </div>
          </div>

          <button
            onClick={requestFullscreenAndStart}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2 group"
          >
            <span>Enter Fullscreen & Begin Assessment</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    );
  }

  // 3. SCREEN: Completed Test Results
  if (isCompleted && testResult) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl animate-fadeIn">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400">
              <Award className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-white">Assessment Completed!</h2>
            <p className="text-xs text-slate-400 mt-1">Verified Proctored Submission</p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center mb-6">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <p className="text-2xl font-black text-white">{testResult.scorePercentage}%</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Score</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <p className="text-2xl font-black text-emerald-400">{testResult.correctAnswers}/70</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Correct</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <p className="text-xs font-black text-amber-400 mt-2">{testResult.earnedRank}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Earned Rank</p>
            </div>
          </div>

          {/* Proctoring Summary */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 mb-6 text-xs">
            <div className="flex items-center justify-between font-bold text-white mb-2">
              <span className="flex items-center space-x-1.5 text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                <span>AI Proctoring Audit Passed</span>
              </span>
              <span className="text-slate-400">{proctorLogs.length} Events Logged</span>
            </div>
            <p className="text-slate-400 text-[11px]">No severe violations detected. Integrity validation passed.</p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setShowCertificateModal(true)}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-extrabold text-xs shadow-lg shadow-amber-500/20"
            >
              Download PDF Certificate
            </button>
            <button
              onClick={() => router.push('/assessment')}
              className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
            >
              Back to Arena
            </button>
          </div>
        </div>

        {showCertificateModal && (
          <CertificateModal
            isOpen={showCertificateModal}
            onClose={() => setShowCertificateModal(false)}
            result={testResult}
            candidateName="Candidate Architect"
          />
        )}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <p>Loading 70 daily-shuffled questions for {techId}...</p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const currentAnswer = userAnswers[currentQ.id];
  const answeredCount = Object.values(userAnswers).filter((a) => a.selectedOption !== null).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none">
      {/* Fullscreen Warning Modal Overlay */}
      {fullscreenWarning && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-amber-500/40 rounded-3xl p-6 text-center shadow-2xl">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">Fullscreen Mode Required</h3>
            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              Exiting full-screen or switching tabs is flagged as a violation. Please return to full-screen to continue.
            </p>
            <button
              onClick={reEnterFullscreen}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all"
            >
              Re-Enter Fullscreen Mode
            </button>
          </div>
        </div>
      )}

      {/* AI Live Proctor Engine Hookup */}
      <AIProctorEngine
        isActive={testStarted && !isCompleted && !isTerminated}
        onViolation={handleProctorViolation}
        onTerminate={handleTestTermination}
        maxCriticalViolations={4}
      />

      {/* Proctored Top Header Toolbar */}
      <div className="bg-slate-950/95 border-b border-slate-800/80 px-5 py-3 sticky top-0 z-20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 font-extrabold text-xs">
              {techId.toUpperCase()} PROCTORED
            </span>
            <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
              Q {currentIndex + 1} of {questions.length}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Countdown Timer */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="text-sm font-mono font-bold text-white">{formatTime(timeRemaining)}</span>
            </div>

            {/* Answered Counter */}
            <div className="hidden md:flex items-center space-x-1.5 text-xs text-slate-400 font-medium">
              <span>Answered:</span>
              <strong className="text-emerald-400">{answeredCount}/{questions.length}</strong>
            </div>

            <button
              onClick={handleSubmitTest}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
            >
              Submit Test
            </button>
          </div>
        </div>
      </div>

      {/* Main Dual-Panel Test Layout */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Question Panel */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-md">
            {/* Meta Row */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs mb-4">
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-indigo-300 font-semibold text-[11px]">
                {currentQ.topic}
              </span>
              <button
                onClick={toggleFlagReview}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  currentAnswer?.markedForReview
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{currentAnswer?.markedForReview ? 'Flagged for Review' : 'Flag'}</span>
              </button>
            </div>

            {/* Question Text */}
            <h2 className="text-base sm:text-lg font-bold text-white leading-relaxed mb-4">
              {currentIndex + 1}. {currentQ.questionText}
            </h2>

            {/* Optional Code Snippet */}
            {currentQ.codeSnippet && (
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-emerald-300 overflow-x-auto mb-4">
                <pre>{currentQ.codeSnippet}</pre>
              </div>
            )}

            {/* Options List */}
            <div className="space-y-2.5">
              {currentQ.options.map((option, idx) => {
                const isSelected = currentAnswer?.selectedOption === option;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(option)}
                    className={`w-full text-left p-4 rounded-2xl border text-xs sm:text-sm font-medium transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <span>{option}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-semibold text-xs disabled:opacity-30 flex items-center space-x-1.5 hover:border-slate-700 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              disabled={currentIndex === questions.length - 1}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs disabled:opacity-30 flex items-center space-x-1.5 shadow-lg shadow-indigo-500/20 transition-all"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Question Palette Sidebar */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800/80 rounded-3xl p-5 shadow-xl backdrop-blur-md">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Question Palette (70)
          </h3>

          <div className="grid grid-cols-7 sm:grid-cols-10 lg:grid-cols-7 gap-1.5 max-h-[60vh] overflow-y-auto pr-1 no-scrollbar">
            {questions.map((q, idx) => {
              const ans = userAnswers[q.id];
              const isAnswered = ans?.selectedOption !== null;
              const isFlagged = ans?.markedForReview;
              const isCurrent = currentIndex === idx;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-8 rounded-lg text-xs font-bold transition-all border ${
                    isCurrent
                      ? 'ring-2 ring-indigo-400 border-white text-white'
                      : isFlagged
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : isAnswered
                      ? 'bg-emerald-600/25 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-white'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2 text-[11px] text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded bg-emerald-600/30 border border-emerald-500/40" />
              <span>Answered ({answeredCount})</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/40" />
              <span>Flagged for Review</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded bg-slate-950 border border-slate-800" />
              <span>Unattempted ({questions.length - answeredCount})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

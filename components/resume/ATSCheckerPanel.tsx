'use client';

import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, CheckCircle, Target, ArrowRight } from 'lucide-react';
import { ATSScoreBreakdown } from '../../types/resume';

interface ATSCheckerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  atsScore: ATSScoreBreakdown;
  targetJobDescription: string;
  onUpdateJobDescription: (jd: string) => void;
}

export default function ATSCheckerPanel({
  isOpen,
  onClose,
  atsScore,
  targetJobDescription,
  onUpdateJobDescription,
}: ATSCheckerPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">AI ATS Matcher & Keyword Gap Analyzer</h2>
              <p className="text-xs text-slate-400">Compare resume against target Job Description</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1">
          {/* Target Job Description Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <Target className="w-4 h-4 text-blue-400" />
              <span>Target Job Description (JD)</span>
            </label>
            <textarea
              rows={4}
              placeholder="Paste target job description here to analyze keyword gaps..."
              value={targetJobDescription}
              onChange={(e) => onUpdateJobDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Score Breakdown Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center">
              <p className="text-[10px] font-semibold text-slate-400">Keywords Match</p>
              <p className="text-xl font-extrabold text-blue-400 mt-1">{atsScore.keywordMatchScore}%</p>
            </div>
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center">
              <p className="text-[10px] font-semibold text-slate-400">ATS Structure</p>
              <p className="text-xl font-extrabold text-emerald-400 mt-1">{atsScore.formattingScore}%</p>
            </div>
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center">
              <p className="text-[10px] font-semibold text-slate-400">Experience Impact</p>
              <p className="text-xl font-extrabold text-amber-400 mt-1">{atsScore.experienceRelevanceScore}%</p>
            </div>
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center">
              <p className="text-[10px] font-semibold text-slate-400">Skills Coverage</p>
              <p className="text-xl font-extrabold text-indigo-400 mt-1">{atsScore.skillsCompletenessScore}%</p>
            </div>
          </div>

          {/* Missing Keywords Gap */}
          <div>
            <h4 className="text-xs font-semibold text-rose-400 mb-2 flex items-center space-x-1.5">
              <AlertCircle className="w-4 h-4" />
              <span>Missing Keywords Gap</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {atsScore.missingKeywords.length > 0 ? (
                atsScore.missingKeywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg text-xs bg-rose-500/10 border border-rose-500/20 text-rose-300 font-medium"
                  >
                    + {kw}
                  </span>
                ))
              ) : (
                <p className="text-xs text-emerald-400">No major keyword gaps detected! Great job.</p>
              )}
            </div>
          </div>

          {/* Matched Keywords */}
          <div>
            <h4 className="text-xs font-semibold text-emerald-400 mb-2 flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4" />
              <span>Matched Target Keywords ({atsScore.matchedKeywords.length})</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {atsScore.matchedKeywords.map((kw, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium"
                >
                  ✓ {kw}
                </span>
              ))}
            </div>
          </div>

          {/* AI Suggestions */}
          <div>
            <h4 className="text-xs font-semibold text-amber-300 mb-2">AI Optimization Suggestions</h4>
            <ul className="space-y-2">
              {atsScore.suggestions.map((sugg, i) => (
                <li
                  key={i}
                  className="flex items-start space-x-2 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800"
                >
                  <ArrowRight className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{sugg}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
          >
            Apply Optimization
          </button>
        </div>
      </div>
    </div>
  );
}

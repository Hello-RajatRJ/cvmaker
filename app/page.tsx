'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, Bot, Trophy, Sparkles, ArrowRight, ShieldCheck, Zap, Award } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-12 max-w-7xl mx-auto overflow-hidden">
      {/* Background Glowing Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white border border-indigo-100 text-xs font-bold text-indigo-600 shadow-sm">
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          <span>Unified Enterprise Career AI Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Craft Resumes, Master AI & Pass Proctored{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500">
            Technical Assessments
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
          The ultimate suite for developers and tech professionals: 100 ATS-optimized CV templates with real-time scoring, Gemini AI developer studio workspace, and 1,120 proctored technical questions across 16 stacks.
        </p>

        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <Link
            href="/resume-builder"
            className="flex items-center space-x-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>Open Resume Architect</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/gemini-studio"
            className="flex items-center space-x-2 px-6 py-3 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 font-bold text-sm shadow-sm transition-all"
          >
            <Bot className="w-4 h-4 text-purple-600" />
            <span>Gemini AI Workspace</span>
            <span className="px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-700 rounded border border-emerald-200">FREE</span>
          </Link>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Module 1: Resume Architect */}
        <div className="glass-card rounded-3xl p-6 flex flex-col justify-between border border-slate-200 hover:border-indigo-300 transition-all group bg-white/60">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform shadow-sm">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Resume Architect</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4 font-medium">
              Real-time ATS match scoring gauge (88/100), AI keyword gap analyzer, PDF/DOCX import, side-by-side editing, and 100 template presets.
            </p>
            <ul className="space-y-2 text-xs text-slate-700 font-semibold mb-6">
              <li className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Live Real-Time ATS Score Gauge</span>
              </li>
              <li className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>4 Free Templates + 96 Paid Presets (₹50)</span>
              </li>
            </ul>
          </div>
          <Link
            href="/resume-builder"
            className="w-full py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-all text-center block border border-indigo-100"
          >
            Launch Resume Architect →
          </Link>
        </div>

        {/* Module 2: Gemini AI Studio */}
        <div className="glass-card rounded-3xl p-6 flex flex-col justify-between border border-slate-200 hover:border-purple-300 transition-all group bg-white/60">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform shadow-sm">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Gemini AI Studio</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4 font-medium">
              Multi-model LLM engine selector, specialized AI Coach personas, slide-out conversation drawer, and split-screen developer notepad.
            </p>
            <ul className="space-y-2 text-xs text-slate-700 font-semibold mb-6">
              <li className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-purple-500" />
                <span>Gemini 1.5 Flash, 1.5 Pro & Flash 8B</span>
              </li>
              <li className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-purple-500" />
                <span>Quill-Style Developer Notepad</span>
              </li>
            </ul>
          </div>
          <Link
            href="/gemini-studio"
            className="w-full py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs transition-all text-center block border border-purple-100"
          >
            Open Gemini Workspace →
          </Link>
        </div>

        {/* Module 3: AI Mock Test Arena */}
        <div className="glass-card rounded-3xl p-6 flex flex-col justify-between border border-slate-200 hover:border-amber-300 transition-all group bg-white/60">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-4 group-hover:scale-110 transition-transform shadow-sm">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">AI Technical Mock Test</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4 font-medium">
              16 Technical Stacks, 1,120 curated questions with daily shuffling, global candidate rank titles, and PDF certificates.
            </p>
            <ul className="space-y-2 text-xs text-slate-700 font-semibold mb-6">
              <li className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>70 Daily-Shuffled Qs per Stack</span>
              </li>
              <li className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Global Rank: 🏆 Lead Architect & Senior</span>
              </li>
            </ul>
          </div>
          <Link
            href="/assessment"
            className="w-full py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs transition-all text-center block border border-amber-100"
          >
            Enter Proctored Test Arena →
          </Link>
        </div>
      </div>
    </div>
  );
}

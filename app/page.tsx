'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, Bot, Trophy, Sparkles, ArrowRight, ShieldCheck, Zap, Award } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-12 max-w-7xl mx-auto overflow-hidden">
      {/* Background Glowing Lime Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-lime-400/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-400/12 rounded-full blur-[110px] pointer-events-none" />

      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white border border-lime-300 text-xs font-bold text-lime-800 shadow-xs">
          <Sparkles className="w-4 h-4 text-lime-600 animate-pulse" />
          <span>Unified Enterprise Career AI Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Craft Resumes, Master AI & Pass Proctored{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-600 via-emerald-600 to-lime-500">
            Technical Assessments
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
          The ultimate suite for developers and tech professionals: 100 ATS-optimized CV templates with real-time scoring, Gemini AI developer studio workspace, and 1,120 proctored technical questions across 16 stacks.
        </p>

        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <Link
            href="/resume-builder"
            className="flex items-center space-x-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-lime-400 via-lime-500 to-lime-600 hover:from-lime-300 hover:to-lime-500 text-slate-950 font-black text-sm shadow-xl shadow-lime-500/25 transition-all transform hover:scale-105"
          >
            <FileText className="w-4 h-4 text-slate-950" />
            <span>Open Resume Architect</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </Link>

          <Link
            href="/gemini-studio"
            className="flex items-center space-x-2 px-6 py-3 rounded-2xl bg-white border border-slate-200 hover:border-lime-400 text-slate-800 hover:text-lime-800 font-bold text-sm shadow-xs transition-all"
          >
            <Bot className="w-4 h-4 text-lime-600" />
            <span>Gemini AI Workspace</span>
            <span className="px-1.5 py-0.5 text-[10px] bg-lime-100 text-lime-800 font-bold rounded-full border border-lime-300">FREE</span>
          </Link>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Module 1: Resume Architect */}
        <div className="glass-card rounded-3xl p-6 flex flex-col justify-between border border-slate-200 hover:border-lime-400 transition-all group bg-white/80">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-lime-50 border border-lime-200 flex items-center justify-center text-lime-700 mb-4 group-hover:scale-110 transition-transform shadow-xs">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Resume Architect</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4 font-medium">
              Real-time ATS match scoring gauge (88/100), AI keyword gap analyzer, PDF/DOCX import, side-by-side editing, and 100 template presets.
            </p>
            <ul className="space-y-2 text-xs text-slate-700 font-semibold mb-6">
              <li className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-lime-600" />
                <span>Live Real-Time ATS Score Gauge</span>
              </li>
              <li className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-lime-600" />
                <span>4 Free Templates + 96 Paid Presets (₹50)</span>
              </li>
            </ul>
          </div>
          <Link
            href="/resume-builder"
            className="w-full py-2.5 rounded-xl bg-lime-50 hover:bg-lime-100 text-lime-800 font-bold text-xs transition-all text-center block border border-lime-200"
          >
            Launch Resume Architect →
          </Link>
        </div>

        {/* Module 2: Gemini AI Studio */}
        <div className="glass-card rounded-3xl p-6 flex flex-col justify-between border border-slate-200 hover:border-lime-400 transition-all group bg-white/80">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-lime-50 border border-lime-200 flex items-center justify-center text-lime-700 mb-4 group-hover:scale-110 transition-transform shadow-xs">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Gemini AI Studio</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4 font-medium">
              Multi-model LLM engine selector, specialized AI Coach personas, slide-out conversation drawer, and split-screen developer notepad.
            </p>
            <ul className="space-y-2 text-xs text-slate-700 font-semibold mb-6">
              <li className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-lime-600" />
                <span>Gemini 1.5 Flash, 1.5 Pro & Flash 8B</span>
              </li>
              <li className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-lime-600" />
                <span>Quill-Style Developer Notepad</span>
              </li>
            </ul>
          </div>
          <Link
            href="/gemini-studio"
            className="w-full py-2.5 rounded-xl bg-lime-50 hover:bg-lime-100 text-lime-800 font-bold text-xs transition-all text-center block border border-lime-200"
          >
            Open Gemini Workspace →
          </Link>
        </div>

        {/* Module 3: AI Mock Test Arena */}
        <div className="glass-card rounded-3xl p-6 flex flex-col justify-between border border-slate-200 hover:border-lime-400 transition-all group bg-white/80">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-lime-50 border border-lime-200 flex items-center justify-center text-lime-700 mb-4 group-hover:scale-110 transition-transform shadow-xs">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">AI Technical Mock Test</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4 font-medium">
              16 Technical Stacks, 1,120 curated questions with daily shuffling, global candidate rank titles, and PDF certificates.
            </p>
            <ul className="space-y-2 text-xs text-slate-700 font-semibold mb-6">
              <li className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-lime-600" />
                <span>70 Daily-Shuffled Qs per Stack</span>
              </li>
              <li className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-lime-600" />
                <span>Global Rank: 🏆 Lead Architect & Senior</span>
              </li>
            </ul>
          </div>
          <Link
            href="/assessment"
            className="w-full py-2.5 rounded-xl bg-lime-50 hover:bg-lime-100 text-lime-800 font-bold text-xs transition-all text-center block border border-lime-200"
          >
            Enter Proctored Test Arena →
          </Link>
        </div>
      </div>
    </div>
  );
}

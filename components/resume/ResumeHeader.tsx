'use client';

import React from 'react';
import { LayoutGrid, Upload, Download, Sparkles, FileJson, CheckCircle2, ShieldAlert } from 'lucide-react';
import { ATSScoreBreakdown, TemplateConfig } from '../../types/resume';

interface ResumeHeaderProps {
  activeTemplate: TemplateConfig;
  atsScore: ATSScoreBreakdown;
  onOpenTemplates: () => void;
  onOpenImport: () => void;
  onOpenATSPanel: () => void;
  onExportJSON: () => void;
  onExportPDF: () => void;
}

export default function ResumeHeader({
  activeTemplate,
  atsScore,
  onOpenTemplates,
  onOpenImport,
  onOpenATSPanel,
  onExportJSON,
  onExportPDF,
}: ResumeHeaderProps) {
  const getGaugeColor = (score: number) => {
    if (score >= 80) return 'from-emerald-400 to-emerald-500 text-white shadow-emerald-500/20';
    if (score >= 65) return 'from-amber-400 to-amber-500 text-white shadow-amber-500/20';
    return 'from-rose-400 to-rose-500 text-white shadow-rose-500/20';
  };

  return (
    <div className="sticky top-16 z-30 w-full glass-panel border-b border-slate-200 py-3 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Left Toolbar Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenTemplates}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-500/25 transition-all transform hover:scale-105"
          >
            <LayoutGrid className="w-4 h-4 text-white" />
            <span>🎨 Browse 100 Templates Gallery</span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-mono font-bold">
              {activeTemplate.name}
            </span>
          </button>

          <button
            onClick={onOpenImport}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-600 text-xs font-bold shadow-sm transition-all"
          >
            <Upload className="w-4 h-4 text-indigo-500" />
            <span className="hidden sm:inline">Import CV (PDF/DOCX)</span>
          </button>
        </div>

        {/* Live ATS Score Gauge Displayed prominently */}
        <div className="flex items-center space-x-3 bg-white border border-slate-200 rounded-2xl px-4 py-1.5 shadow-sm">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Live ATS Match</p>
            <p className="text-xs text-slate-900 font-bold">Real-Time Keyword Gauge</p>
          </div>
          <button
            onClick={onOpenATSPanel}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border-none bg-gradient-to-r shadow-md transition-transform hover:scale-105 ${getGaugeColor(atsScore.overallScore)}`}
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-black tracking-tight">{atsScore.overallScore} / 100</span>
          </button>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onExportJSON}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 text-slate-600 hover:text-indigo-600 text-xs font-bold transition-all shadow-sm"
            title="Export Raw Resume JSON Data"
          >
            <FileJson className="w-4 h-4 text-slate-400" />
            <span className="hidden md:inline">JSON</span>
          </button>

          <button
            onClick={onExportPDF}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download High-Res PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}

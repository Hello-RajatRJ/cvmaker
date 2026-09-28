'use client';

import React from 'react';
import { LayoutGrid, Upload, Download, Sparkles, FileJson, FileText, CheckCircle2, ShieldAlert, RotateCcw } from 'lucide-react';
import { ATSScoreBreakdown, TemplateConfig } from '../../types/resume';

interface ResumeHeaderProps {
  activeTemplate: TemplateConfig;
  atsScore: ATSScoreBreakdown;
  onOpenTemplates: () => void;
  onOpenImport: () => void;
  onOpenATSPanel: () => void;
  onExportJSON: () => void;
  onExportPDF: () => void;
  onExportDOC: () => void;
  hasPreOptimizationBackup?: boolean;
  onRestoreOriginal?: () => void;
}

export default function ResumeHeader({
  activeTemplate,
  atsScore,
  onOpenTemplates,
  onOpenImport,
  onOpenATSPanel,
  onExportJSON,
  onExportPDF,
  onExportDOC,
  hasPreOptimizationBackup,
  onRestoreOriginal,
}: ResumeHeaderProps) {
  const getGaugeColor = (score: number) => {
    if (score >= 80) return 'from-lime-400 to-lime-500 text-slate-950 font-black shadow-lime-500/25';
    if (score >= 65) return 'from-lime-300 to-lime-400 text-slate-900 font-bold shadow-lime-400/20';
    return 'from-rose-400 to-rose-500 text-white shadow-rose-500/20';
  };

  return (
    <div className="sticky top-16 z-30 w-full glass-panel border-b border-lime-500/20 py-3 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Left Toolbar Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenTemplates}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-lime-400 via-lime-500 to-lime-600 hover:from-lime-300 hover:to-lime-500 text-slate-950 text-xs font-black shadow-lg shadow-lime-500/25 transition-all transform hover:scale-105 cursor-pointer"
          >
            <LayoutGrid className="w-4 h-4 text-slate-950" />
            <span>🎨 Browse 100 Templates Gallery</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-950/15 text-[10px] font-mono font-bold text-slate-900">
              {activeTemplate.name}
            </span>
          </button>

          <button
            onClick={onOpenImport}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-lime-400 text-slate-700 hover:text-lime-800 text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4 text-lime-600" />
            <span className="hidden sm:inline">Import CV (PDF/DOCX)</span>
          </button>
        </div>

        {/* Live ATS Score Gauge Displayed prominently */}
        <div className="flex items-center space-x-3 bg-white border border-lime-200/80 rounded-2xl px-4 py-1.5 shadow-xs">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Live ATS Match</p>
            <p className="text-xs text-slate-900 font-bold">Real-Time Keyword Gauge</p>
          </div>
          <button
            onClick={onOpenATSPanel}
            suppressHydrationWarning
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border-none bg-gradient-to-r shadow-md transition-transform hover:scale-105 cursor-pointer ${getGaugeColor(atsScore.overallScore)}`}
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span suppressHydrationWarning className="text-sm font-black tracking-tight">{atsScore.overallScore} / 100</span>
          </button>
          {hasPreOptimizationBackup && onRestoreOriginal && (
            <button
              onClick={onRestoreOriginal}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-lime-50 border border-lime-300 hover:bg-lime-100 text-lime-800 text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Undo ATS Optimization and restore original CV"
            >
              <RotateCcw className="w-3.5 h-3.5 text-lime-700" />
              <span className="hidden lg:inline">Undo ATS</span>
            </button>
          )}
        </div>

        {/* Export Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onExportJSON}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-lime-400 text-slate-600 hover:text-lime-800 text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Export Raw Resume JSON Data"
          >
            <FileJson className="w-4 h-4 text-slate-400" />
            <span className="hidden md:inline">JSON</span>
          </button>

          <button
            onClick={onExportDOC}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-lime-400 text-slate-700 hover:text-lime-800 text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Download editable Microsoft Word (.docx) document"
          >
            <FileText className="w-4 h-4 text-lime-600" />
            <span>Word Docs</span>
          </button>

          <button
            onClick={onExportPDF}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-400 hover:to-lime-500 text-slate-950 text-xs font-black shadow-lg shadow-lime-500/25 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-950" />
            <span>Download High-Res PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}

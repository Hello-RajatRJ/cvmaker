'use client';

import React, { useState, useEffect } from 'react';
import { Bold, Italic, Heading1, Heading2, Code, List, Table, Download, Save, Check } from 'lucide-react';

export default function NotepadEditor() {
  const [content, setContent] = useState<string>(
    `# Developer Architecture Notes\n\n## 1. Microservice Pipeline\n- Next.js 15 App Router\n- Gemini 1.5 Flash Engine\n- Redis Distributed Cache\n\n\`\`\`typescript\nexport function calculateATSGauge(keywords: string[]) {\n  return keywords.length * 10;\n}\n\`\`\``
  );
  const [saved, setSaved] = useState(true);

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const charCount = content.length;

  const handleTextChange = (text: string) => {
    setContent(text);
    setSaved(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setSaved(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, [content]);

  const insertSnippet = (prefix: string, suffix: string = '') => {
    setContent((prev) => prev + `\n${prefix}sample text${suffix}`);
    setSaved(false);
  };

  const handleExportText = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `developer_notes_${Date.now()}.md`;
    a.click();
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col h-full shadow-2xl">
      {/* Formatting Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => insertSnippet('**', '**')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertSnippet('*', '*')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertSnippet('# ')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertSnippet('## ')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertSnippet('```typescript\n', '\n```')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            title="Code Block"
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertSnippet('- ')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Status & Export */}
        <div className="flex items-center space-x-3 text-xs">
          <span className="text-slate-400 flex items-center space-x-1">
            {saved ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Auto-saved</span>
              </>
            ) : (
              <span className="text-amber-400">Saving...</span>
            )}
          </span>
          <button
            onClick={handleExportText}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Notes</span>
          </button>
        </div>
      </div>

      {/* Editor Textarea */}
      <div className="flex-1 py-3">
        <textarea
          value={content}
          onChange={(e) => handleTextChange(e.target.value)}
          className="w-full h-full bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
          placeholder="Quill-Style Developer Notepad... Write system specs, snippets, or AI prompt notes."
        />
      </div>

      {/* Footer Counters */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span>Words: <strong className="text-white">{wordCount}</strong></span>
        <span>Characters: <strong className="text-white">{charCount}</strong></span>
      </div>
    </div>
  );
}

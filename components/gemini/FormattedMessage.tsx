'use client';

import React, { useState } from 'react';
import { Copy, Check, Terminal, Code2, Sparkles, ChevronRight, CheckCircle2 } from 'lucide-react';

interface FormattedMessageProps {
  content: string;
  isAi?: boolean;
}

export default function FormattedMessage({ content, isAi = true }: FormattedMessageProps) {
  const [copiedBlockIndex, setCopiedBlockIndex] = useState<number | null>(null);

  const copyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedBlockIndex(index);
    setTimeout(() => setCopiedBlockIndex(null), 2000);
  };

  // Helper to parse inline styles like **bold**, `code`, *italic*
  const renderInline = (text: string) => {
    // Regex for inline code: `code`
    // Regex for bold: **bold** or ***bold***
    // Regex for italic: *italic* or _italic_
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    // Remove leading/trailing stray quotes if wrapping the whole string
    if (remaining.startsWith('""') && remaining.endsWith('""')) {
      remaining = remaining.slice(2, -2);
    }

    // Tokenize remaining string
    const regex = /(`[^`]+`|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*)/g;
    let match: RegExpExecArray | null;
    let lastIndex = 0;

    while ((match = regex.exec(remaining)) !== null) {
      // Add preceding plain text
      if (match.index > lastIndex) {
        parts.push(remaining.substring(lastIndex, match.index));
      }

      const matchStr = match[0];
      if (matchStr.startsWith('`') && matchStr.endsWith('`')) {
        const codeText = matchStr.slice(1, -1);
        parts.push(
          <code
            key={keyIdx++}
            className="px-1.5 py-0.5 mx-0.5 rounded-md bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 font-mono text-[11px] font-medium"
          >
            {codeText}
          </code>
        );
      } else if (matchStr.startsWith('***') && matchStr.endsWith('***')) {
        parts.push(
          <strong key={keyIdx++} className="font-bold italic text-white">
            {matchStr.slice(3, -3)}
          </strong>
        );
      } else if (matchStr.startsWith('**') && matchStr.endsWith('**')) {
        parts.push(
          <strong key={keyIdx++} className="font-bold text-white">
            {matchStr.slice(2, -2)}
          </strong>
        );
      } else if (matchStr.startsWith('*') && matchStr.endsWith('*')) {
        parts.push(
          <em key={keyIdx++} className="italic text-slate-200">
            {matchStr.slice(1, -1)}
          </em>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < remaining.length) {
      parts.push(remaining.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  // Parse markdown into blocks (code blocks vs text blocks)
  const blocks: { type: 'code' | 'text' | 'heading' | 'list' | 'quote'; content: string; lang?: string; level?: number }[] = [];
  const lines = content.split('\n');
  let currentCodeBlock: string[] | null = null;
  let currentLang = '';
  let currentList: string[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      blocks.push({ type: 'list', content: currentList.join('\n') });
      currentList = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block toggle
    if (line.trim().startsWith('```')) {
      if (currentCodeBlock !== null) {
        // End of code block
        blocks.push({
          type: 'code',
          content: currentCodeBlock.join('\n'),
          lang: currentLang || 'code'
        });
        currentCodeBlock = null;
        currentLang = '';
      } else {
        flushList();
        // Start of code block
        currentLang = line.trim().replace(/^```/, '').trim();
        currentCodeBlock = [];
      }
      continue;
    }

    if (currentCodeBlock !== null) {
      currentCodeBlock.push(line);
      continue;
    }

    // Headings (###, ####, ##, #)
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      flushList();
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        content: headingMatch[2].trim()
      });
      continue;
    }

    // List items (- or * or 1.)
    const listMatch = line.match(/^(\s*[-*]|\s*\d+\.)\s+(.+)$/);
    if (listMatch) {
      currentList.push(listMatch[2].trim());
      continue;
    } else {
      flushList();
    }

    // Blockquotes
    if (line.trim().startsWith('>')) {
      blocks.push({
        type: 'quote',
        content: line.trim().replace(/^>\s*/, '')
      });
      continue;
    }

    // Regular line
    if (line.trim().length > 0) {
      blocks.push({ type: 'text', content: line });
    }
  }

  flushList();

  if (currentCodeBlock !== null) {
    blocks.push({
      type: 'code',
      content: currentCodeBlock.join('\n'),
      lang: currentLang || 'code'
    });
  }

  return (
    <div className="space-y-3.5 leading-relaxed text-[13px]">
      {blocks.map((block, idx) => {
        if (block.type === 'heading') {
          // Clean title: remove any extra markdown asterisks if still present
          const cleanTitle = block.content.replace(/\*\*/g, '').replace(/""/g, '');
          
          if (block.level === 1 || block.level === 2) {
            return (
              <div key={idx} className="pt-2 pb-1 border-b border-indigo-500/20">
                <h3 className="text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-indigo-400 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>{cleanTitle}</span>
                </h3>
              </div>
            );
          }

          return (
            <div key={idx} className="pt-1.5 flex items-center space-x-2">
              <div className="w-1.5 h-4 rounded-full bg-gradient-to-b from-indigo-500 to-violet-500" />
              <h4 className="text-xs font-bold text-indigo-300 tracking-wide uppercase">
                {cleanTitle}
              </h4>
            </div>
          );
        }

        if (block.type === 'code') {
          return (
            <div
              key={idx}
              className="rounded-2xl border border-slate-800 bg-slate-950/90 shadow-2xl overflow-hidden my-2 group"
            >
              {/* Terminal Title Bar */}
              <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/80 border-b border-slate-800 text-[11px]">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70 inline-block" />
                  </div>
                  <span className="text-slate-400 font-mono text-[10px] uppercase font-bold tracking-wider pl-1.5 flex items-center space-x-1">
                    <Terminal className="w-3 h-3 text-indigo-400" />
                    <span>{block.lang || 'typescript'}</span>
                  </span>
                </div>

                <button
                  onClick={() => copyCode(block.content, idx)}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-indigo-600/30 text-slate-300 hover:text-white border border-slate-700/60 transition-all text-[10px] font-semibold"
                >
                  {copiedBlockIndex === idx ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-300">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-400" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code Contents */}
              <div className="p-3.5 overflow-x-auto text-[12px] font-mono leading-relaxed text-emerald-300/90 bg-slate-950/95 selection:bg-indigo-500 selection:text-white">
                <pre className="whitespace-pre">
                  <code>{block.content}</code>
                </pre>
              </div>
            </div>
          );
        }

        if (block.type === 'list') {
          const items = block.content.split('\n');
          return (
            <div key={idx} className="space-y-2 my-1 pl-1">
              {items.map((item, itemIdx) => (
                <div key={itemIdx} className="flex items-start space-x-2.5 group">
                  <div className="w-4 h-4 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5 group-hover:border-indigo-400 transition-colors">
                    <ChevronRight className="w-2.5 h-2.5" />
                  </div>
                  <div className="flex-1 text-slate-300 leading-snug">
                    {renderInline(item)}
                  </div>
                </div>
              ))}
            </div>
          );
        }

        if (block.type === 'quote') {
          return (
            <div
              key={idx}
              className="p-3 rounded-xl bg-gradient-to-r from-indigo-950/40 to-slate-900 border-l-2 border-indigo-500 text-slate-300 italic text-xs my-1.5"
            >
              {renderInline(block.content)}
            </div>
          );
        }

        // Regular Text
        return (
          <p key={idx} className="text-slate-200">
            {renderInline(block.content)}
          </p>
        );
      })}
    </div>
  );
}

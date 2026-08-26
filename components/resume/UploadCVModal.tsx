'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, FileText, AlertCircle, Loader2, FileSpreadsheet, Download, Sparkles, CheckCircle2, File } from 'lucide-react';
import { CVParserService } from '../../services/cvParserService';
import { ResumeData } from '../../types/resume';
import toast from 'react-hot-toast';

interface UploadCVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (parsedData: Partial<ResumeData>) => void;
}

const SAMPLE_CSV_CONTENT = `fullName,jobTitle,email,phone,location,website,linkedin,github,summary,skills,company,experience,education,projects,certifications
"Alex Rivera","Senior Full-Stack & Cloud Architect","alex.rivera@architect.dev","+1 (555) 234-5678","San Francisco, CA","https://alexrivera.dev","linkedin.com/in/alexrivera-architect","github.com/alexrivera-dev","High-impact Lead Software Architect with 8+ years building enterprise microservices, AI-driven automation pipelines, and high-frequency real-time web applications.","React, Next.js, Node.js, TypeScript, Python, AWS, Docker, Kubernetes, GraphQL, Tailwind CSS, PostgreSQL, Redis","Apex Cloud Innovations","Architected distributed Next.js 15 & Node.js microservices handling 4.2M daily active API requests with 99.99% uptime.; Integrated Google Gemini LLM pipelines for automated log analysis.; Pioneered zero-downtime CI/CD Kubernetes deployments using Docker.","University of California, Berkeley (B.S. in Computer Science & Engineering)","Cloud Scale AI Platform; Real-time ATS Resume Builder; High-Throughput GraphQL Gateway","AWS Certified Solutions Architect - Professional; Certified Kubernetes Administrator (CKA)"`;

export default function UploadCVModal({ isOpen, onClose, onImportSuccess }: UploadCVModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processFile = async (file: File) => {
    setFileName(file.name);
    setLoading(true);
    setError('');

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const fileTypeLabel =
      ext === 'csv' ? 'CSV' : ext === 'pdf' ? 'PDF' : ext === 'docx' ? 'DOCX' : ext.toUpperCase();

    const tid = toast.loading(`Extracting data from ${fileTypeLabel} file...`);

    try {
      // ALL file types go through the backend API for server-side extraction
      const parsed = await CVParserService.parseFile(file);

      toast.success(`Successfully extracted resume data from ${file.name}!`, { id: tid, duration: 4000 });
      onImportSuccess(parsed);
      onClose();
    } catch (err: any) {
      const msg = err.message || 'Failed to parse the uploaded file';
      setError(msg);
      toast.error(msg, { id: tid });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await processFile(file);
  };

  const handleDownloadSampleCSV = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Sample_Resume_Import.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success('Sample CSV downloaded!');
  };

  const handleLoadSampleData = () => {
    setLoading(true);
    const tid = toast.loading('Extracting fields from sample CSV...');
    setTimeout(() => {
      try {
        const parsed = CVParserService.parseCSVText(SAMPLE_CSV_CONTENT);
        toast.success('Resume fields populated from sample CSV!', { id: tid });
        onImportSuccess(parsed);
        setLoading(false);
        onClose();
      } catch {
        toast.error('Failed to parse sample data', { id: tid });
        setLoading(false);
      }
    }, 400);
  };

  const supportedFormats = [
    { ext: 'CSV', color: 'text-emerald-500', desc: 'Tabular data' },
    { ext: 'PDF', color: 'text-red-500', desc: 'Scanned / text' },
    { ext: 'DOCX', color: 'text-blue-500', desc: 'Word document' },
    { ext: 'TXT', color: 'text-slate-500', desc: 'Plain text' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl p-7 overflow-hidden">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Import Resume</h2>
            <p className="text-xs text-slate-500">Upload a file to extract and fill all form fields</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer group ${
            dragOver
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-slate-300 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/50'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.pdf,.docx,.doc,.txt"
            onChange={handleFileUpload}
            disabled={loading}
            className="hidden"
            id="cv-upload-input"
          />
          <label htmlFor="cv-upload-input" className="cursor-pointer flex flex-col items-center justify-center">
            {loading ? (
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-3" />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 mb-3 group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
            )}
            <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
              {fileName ? fileName : 'Click to upload or drag & drop'}
            </p>
            <p className="text-xs text-slate-400 mt-1.5">Up to 10MB</p>
          </label>
        </div>

        {/* Supported formats */}
        <div className="mt-3 flex items-center justify-center gap-3">
          {supportedFormats.map((f) => (
            <div key={f.ext} className="flex items-center gap-1 text-[10px]">
              <File className={`w-3 h-3 ${f.color}`} />
              <span className="font-bold text-slate-600">{f.ext}</span>
            </div>
          ))}
        </div>

        {/* Sample CSV */}
        <div className="mt-5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2 text-xs text-slate-600 font-semibold">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Try with sample data</span>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={handleDownloadSampleCSV}
              className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-[11px] font-bold text-slate-600 hover:text-slate-800 transition-all flex items-center justify-center space-x-1 shadow-sm"
            >
              <Download className="w-3 h-3" />
              <span>Download CSV</span>
            </button>
            <button
              onClick={handleLoadSampleData}
              disabled={loading}
              className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-[11px] font-bold text-white transition-all shadow-md flex items-center justify-center space-x-1"
            >
              <span>Load Sample</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

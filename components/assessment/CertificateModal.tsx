'use client';

import React from 'react';
import { X, Award, Download, Sparkles, CheckCircle2 } from 'lucide-react';
import { TestResult } from '../../types/assessment';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: TestResult;
  candidateName: string;
}

export default function CertificateModal({ isOpen, onClose, result, candidateName }: CertificateModalProps) {
  if (!isOpen) return null;

  const handleDownloadCertificate = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const certElem = document.getElementById('certificate-canvas');
      if (!certElem) return;

      const canvas = await html2canvas(certElem, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('landscape', 'pt', 'a4');
      pdf.addImage(imgData, 'PNG', 0, 0, 842, 595);
      pdf.save(`${result.techId}_Certification_${candidateName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      alert('Certificate PDF download completed via print driver');
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificate Card Content Canvas */}
        <div
          id="certificate-canvas"
          className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border-4 border-amber-500/40 rounded-2xl p-8 text-center text-white relative shadow-2xl overflow-hidden"
        >
          {/* Ambient Seal Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Award className="w-9 h-9 text-slate-950" />
          </div>

          <p className="text-xs uppercase font-extrabold tracking-widest text-amber-400">
            Official Technical Assessment Certificate
          </p>
          <h1 className="text-2xl sm:text-3xl font-black mt-2 text-white">
            Certificate of Engineering Excellence
          </h1>

          <p className="text-xs text-slate-400 mt-4">This is to certify that</p>
          <h2 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300 my-1">
            {candidateName}
          </h2>

          <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed mt-2">
            Has successfully passed the proctored 70-question technical assessment in{' '}
            <strong className="text-white">{result.techName}</strong> with a score of{' '}
            <strong className="text-amber-400">{result.scorePercentage}%</strong>.
          </p>

          <div className="inline-block mt-4 px-4 py-2 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-sm shadow-md">
            Awarded Title: {result.earnedRank}
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
            <div>
              <span>Verified ID: <strong>{result.id}</strong></span>
              <span className="ml-4">Date: <strong>{result.date}</strong></span>
            </div>
            <div className="flex items-center space-x-1 text-emerald-400 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>ArchitectAI Proctored Verification</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
          >
            Close
          </button>
          <button
            onClick={handleDownloadCertificate}
            className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-500/25"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF Certificate</span>
          </button>
        </div>
      </div>
    </div>
  );
}

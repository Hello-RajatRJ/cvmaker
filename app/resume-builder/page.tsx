'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import ResumeHeader from '../../components/resume/ResumeHeader';
import ResumeFormEditor from '../../components/resume/ResumeFormEditor';
import ConfigurableTemplate from '../../components/resume/templates/ConfigurableTemplate';
import TemplateGalleryModal from '../../components/resume/TemplateGalleryModal';
import UploadCVModal from '../../components/resume/UploadCVModal';
import ATSCheckerPanel from '../../components/resume/ATSCheckerPanel';
import { SAMPLE_RESUME_DATA } from '../../data/sampleResume';
import { TEMPLATE_CONFIGS, FREE_TEMPLATE_IDS } from '../../data/templateConfigs';
import { ResumeData, TemplateConfig } from '../../types/resume';
import { AIResumeService } from '../../services/aiResumeService';
import { exportResumeToDoc } from '../../utils/exportDoc';

function ResumeBuilderContent() {
  const searchParams = useSearchParams();

  // ─── Consistent SSR initial state; restore from localStorage in useEffect ───
  const [resumeData, setResumeData] = useState<ResumeData>(SAMPLE_RESUME_DATA);
  const [isMounted, setIsMounted] = useState(false);

  const [activeTemplate, setActiveTemplate] = useState<TemplateConfig>(TEMPLATE_CONFIGS[0]);
  const [unlockedTemplateIds, setUnlockedTemplateIds] = useState<string[]>(FREE_TEMPLATE_IDS);

  const [targetJobDescription, setTargetJobDescription] = useState<string>(
    'Looking for Senior Full-Stack Architect proficient in React, Next.js, Node.js, TypeScript, AWS, Docker, Microservices, and GraphQL APIs with proven experience in low-latency systems.'
  );

  // Modals state
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showATSModal, setShowATSModal] = useState(false);

  // ATS Optimization backup for transparent, reversible rollback
  const [preOptimizationBackup, setPreOptimizationBackup] = useState<ResumeData | null>(null);

  const handleApplyOptimizations = (updated: ResumeData) => {
    // If no backup exists, snapshot the current CV before applying changes
    if (!preOptimizationBackup) {
      setPreOptimizationBackup(resumeData);
      try {
        localStorage.setItem('pre_optimization_backup', JSON.stringify(resumeData));
      } catch (e) { }
    }
    setResumeData(updated);
  };

  const handleRestoreOriginal = () => {
    if (preOptimizationBackup) {
      setResumeData(preOptimizationBackup);
      setPreOptimizationBackup(null);
      try {
        localStorage.removeItem('pre_optimization_backup');
      } catch (e) { }
    }
  };

  // 1. Client-side hydration: restore autosaved CV, backup, and unlocked templates from localStorage
  useEffect(() => {
    setIsMounted(true);

    try {
      const saved = localStorage.getItem('cvmaker_autosave');
      if (saved) {
        const parsed = JSON.parse(saved);
        setResumeData({
          ...SAMPLE_RESUME_DATA,
          ...parsed,
          contact: { ...SAMPLE_RESUME_DATA.contact, ...(parsed.contact || {}) },
          languages: parsed.languages || [],
          awards: parsed.awards || [],
          publications: parsed.publications || [],
          volunteer: parsed.volunteer || [],
          visibleSections: {
            summary: true, experience: true, education: true, projects: true,
            skills: true, certifications: true, languages: false, awards: false,
            publications: false, volunteer: false,
            ...(parsed.visibleSections || {}),
          },
          sectionOrder: parsed.sectionOrder || SAMPLE_RESUME_DATA.sectionOrder,
        });
      }

      const backup = localStorage.getItem('pre_optimization_backup');
      if (backup) {
        setPreOptimizationBackup(JSON.parse(backup));
      }

      const stored = localStorage.getItem('unlocked_template_ids');
      if (stored) {
        const parsed: string[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setUnlockedTemplateIds((prev: any) => Array.from(new Set([...FREE_TEMPLATE_IDS, ...prev, ...parsed])));
        }
      }
    } catch (e) {
      console.warn('Could not restore from localStorage', e);
    }

    // Fetch user profile from DynamoDB/auth session
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user?.unlockedTemplates) {
          setUnlockedTemplateIds((prev: any) =>
            Array.from(new Set([...FREE_TEMPLATE_IDS, ...prev, ...data.user.unlockedTemplates]))
          );
        }
      })
      .catch(() => { });
  }, []);

  // 2. Continuous Autosave (only after initial client mount to avoid saving default state)
  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem('cvmaker_autosave', JSON.stringify(resumeData));
    } catch (e) { }
  }, [resumeData, isMounted]);

  // 2. Handle Payment Gateway return via search params (?unlockedTemplate=xyz&payment=success)
  useEffect(() => {
    const unlockedTmplId = searchParams.get('unlockedTemplate');
    const paymentStatus = searchParams.get('payment');

    if (unlockedTmplId && paymentStatus === 'success') {
      const targetConfig = TEMPLATE_CONFIGS.find((t) => t.id === unlockedTmplId);
      const tmplName = targetConfig ? targetConfig.name : unlockedTmplId;

      // Unlock and persist
      setUnlockedTemplateIds((prev) => {
        const updated = Array.from(new Set([...prev, unlockedTmplId]));
        try {
          localStorage.setItem('unlocked_template_ids', JSON.stringify(updated));
        } catch (e) { }
        return updated;
      });

      if (targetConfig) {
        setActiveTemplate(targetConfig);
      }

      toast.success(`🎉 Payment Verified! "${tmplName}" is now unlocked and active!`, {
        duration: 6000,
        icon: '💎',
      });

      try {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch (e) { }

      // Clean up URL query parameters without reloading
      if (typeof window !== 'undefined') {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);
      }
    } else if (paymentStatus === 'cancelled' || paymentStatus === 'failed') {
      toast.error('Payment was not completed. Template remains locked.');
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [searchParams]);

  const handleUnlockSuccess = (templateId: string) => {
    setUnlockedTemplateIds((prev) => {
      const updated = Array.from(new Set([...prev, templateId]));
      try {
        localStorage.setItem('unlocked_template_ids', JSON.stringify(updated));
      } catch (e) { }
      return updated;
    });
  };

  // Live ATS Score calculation
  const atsScore = AIResumeService.calculateATSScore(resumeData, targetJobDescription);

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(resumeData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Resume_${resumeData.contact.fullName.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportDOC = async () => {
    const toastId = toast.loading('Generating Word (.docx) document...');
    try {
      await exportResumeToDoc(resumeData, activeTemplate);
      toast.success('🎉 Word Docs (.docx) downloaded successfully!', { id: toastId });
    } catch (e) {
      console.error('Word DOCX export error:', e);
      toast.error('Failed to export Word document.', { id: toastId });
    }
  };

  const handleExportPDF = async () => {
    const toastId = toast.loading('Generating high-res multi-page PDF...');
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const element = document.getElementById('resume-preview-container');
      if (!element) {
        toast.error('Resume preview element not found.', { id: toastId });
        return;
      }

      // Capture full element at high resolution
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const a4WidthMm = 210;
      const a4HeightMm = 297;

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      // Equivalent pixel height for 1 A4 page at the rendered canvas width
      const a4PxHeight = Math.floor((canvasWidth * a4HeightMm) / a4WidthMm);

      // Smart page-break calculation based on DOM elements
      const containerRect = element.getBoundingClientRect();
      const scaleFactor = canvasHeight / element.offsetHeight;
      const breakCandidates = Array.from(
        element.querySelectorAll('h1, h2, h3, p, li, [data-section], .space-y-4 > div, .mb-6')
      );

      // Function to detect actual content height and ignore trailing blank whitespace/padding
      const getContentBottom = (cvs: HTMLCanvasElement): number => {
        const ctx = cvs.getContext('2d');
        if (!ctx) return cvs.height;
        try {
          const imgData = ctx.getImageData(0, 0, cvs.width, cvs.height).data;
          // Scan upwards from the bottom of the canvas
          for (let y = cvs.height - 1; y >= 0; y -= 2) {
            for (let x = 0; x < cvs.width; x += 4) {
              const idx = (y * cvs.width + x) * 4;
              const r = imgData[idx];
              const g = imgData[idx + 1];
              const b = imgData[idx + 2];
              const a = imgData[idx + 3];
              // Detect any non-white content pixel
              if (a > 30 && (r < 240 || g < 240 || b < 240)) {
                return Math.min(cvs.height, y + 25);
              }
            }
          }
        } catch (e) { }
        return cvs.height;
      };

      const effectiveHeight = getContentBottom(canvas);

      let renderedHeight = 0;
      let pageIndex = 0;

      // Only generate another page if there is substantial remaining content (avoid trailing empty page)
      while (renderedHeight < effectiveHeight - 20) {
        if (pageIndex > 0) {
          pdf.addPage('a4', 'p');
        }

        const remainingHeight = effectiveHeight - renderedHeight;
        let sliceHeight = Math.min(a4PxHeight, remainingHeight);

        // Find clean split point to avoid cutting text/headers in half
        if (renderedHeight + sliceHeight < effectiveHeight - 20) {
          const idealCutY = renderedHeight + sliceHeight;
          const minAllowedCutY = renderedHeight + (a4PxHeight * 0.72);

          let bestCutY = idealCutY;
          for (const cand of breakCandidates) {
            const rect = cand.getBoundingClientRect();
            const topY = (rect.top - containerRect.top) * scaleFactor;
            const bottomY = (rect.bottom - containerRect.top) * scaleFactor;

            if (topY < idealCutY && bottomY > idealCutY && topY > minAllowedCutY) {
              bestCutY = topY - (6 * scaleFactor);
              break;
            }
          }

          sliceHeight = Math.max(20, bestCutY - renderedHeight);
        }

        // Create canvas slice for this page
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvasWidth;
        pageCanvas.height = a4PxHeight;

        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            canvas,
            0, renderedHeight, canvasWidth, sliceHeight,
            0, 0, canvasWidth, sliceHeight
          );
        }

        const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.98);
        pdf.addImage(pageImgData, 'JPEG', 0, 0, a4WidthMm, a4HeightMm, undefined, 'FAST');

        renderedHeight += sliceHeight;
        pageIndex++;
      }

      pdf.save(`CV_${resumeData.contact.fullName.replace(/\s+/g, '_')}.pdf`);
      toast.success(`🎉 PDF downloaded successfully (${pageIndex} pages)!`, { id: toastId });
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Direct PDF export encountered an issue. Opening print dialog...', { id: toastId });
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Pinned Toolbar */}
      <ResumeHeader
        activeTemplate={activeTemplate}
        atsScore={atsScore}
        onOpenTemplates={() => setShowTemplatesModal(true)}
        onOpenImport={() => setShowImportModal(true)}
        onOpenATSPanel={() => setShowATSModal(true)}
        onExportJSON={handleExportJSON}
        onExportDOC={handleExportDOC}
        onExportPDF={handleExportPDF}
        hasPreOptimizationBackup={!!preOptimizationBackup}
        onRestoreOriginal={handleRestoreOriginal}
      />

      {/* Main Dual-Panel Workspace */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Panel: Form Editor */}
        <div className="lg:col-span-5 space-y-4">
          <ResumeFormEditor
            resume={resumeData}
            onChange={(updated) => setResumeData(updated)}
          />
        </div>

        {/* Right Panel: Live Template Preview */}
        <div className="lg:col-span-7 lg:sticky lg:top-24 max-h-[88vh] overflow-y-auto rounded-2xl border border-lime-200/80 bg-white shadow-2xl shadow-lime-950/5 p-4 sm:p-6 custom-scrollbar flex justify-center relative">
          <div className="w-full max-w-[800px]">
            <ConfigurableTemplate
              resume={resumeData}
              config={activeTemplate}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <TemplateGalleryModal
        isOpen={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        activeTemplateId={activeTemplate.id}
        unlockedTemplateIds={unlockedTemplateIds}
        onSelectTemplate={(tmpl) => setActiveTemplate(tmpl)}
        onUnlockTemplateSuccess={handleUnlockSuccess}
      />

      <UploadCVModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={(parsed) => {
          setResumeData((prev) => ({
            ...prev,
            ...parsed,
            contact: {
              ...prev.contact,
              ...(parsed.contact || {}),
            },
            experience: parsed.experience && parsed.experience.length > 0 ? parsed.experience : prev.experience,
            education: parsed.education && parsed.education.length > 0 ? parsed.education : prev.education,
            projects: parsed.projects && parsed.projects.length > 0 ? parsed.projects : prev.projects,
            skills: parsed.skills && parsed.skills.length > 0 ? parsed.skills : prev.skills,
            certifications: parsed.certifications && parsed.certifications.length > 0 ? parsed.certifications : prev.certifications,
          }));
        }}
      />

      <ATSCheckerPanel
        isOpen={showATSModal}
        onClose={() => setShowATSModal(false)}
        atsScore={atsScore}
        targetJobDescription={targetJobDescription}
        onUpdateJobDescription={(jd) => setTargetJobDescription(jd)}
        resumeData={resumeData}
        onApplyOptimizations={handleApplyOptimizations}
        preOptimizationBackup={preOptimizationBackup}
        onRestoreOriginal={handleRestoreOriginal}
      />
    </div>
  );
}

export default function ResumeBuilderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <ResumeBuilderContent />
    </Suspense>
  );
}

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

function ResumeBuilderContent() {
  const searchParams = useSearchParams();

  const [resumeData, setResumeData] = useState<ResumeData>(SAMPLE_RESUME_DATA);
  const [activeTemplate, setActiveTemplate] = useState<TemplateConfig>(TEMPLATE_CONFIGS[0]);
  const [unlockedTemplateIds, setUnlockedTemplateIds] = useState<string[]>(FREE_TEMPLATE_IDS);

  const [targetJobDescription, setTargetJobDescription] = useState<string>(
    'Looking for Senior Full-Stack Architect proficient in React, Next.js, Node.js, TypeScript, AWS, Docker, Microservices, and GraphQL APIs with proven experience in low-latency systems.'
  );

  // Modals state
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showATSModal, setShowATSModal] = useState(false);

  // 1. Load unlocked templates from localStorage and authenticated user profile on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('unlocked_template_ids');
      if (stored) {
        const parsed: string[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setUnlockedTemplateIds((prev) => Array.from(new Set([...prev, ...parsed])));
        }
      }
    } catch (e) {
      console.warn('Could not load unlocked templates from localStorage', e);
    }

    // Fetch user profile from DynamoDB/auth session
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user?.unlockedTemplates) {
          setUnlockedTemplateIds((prev) =>
            Array.from(new Set([...prev, ...data.user.unlockedTemplates]))
          );
        }
      })
      .catch(() => {});
  }, []);

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
        } catch (e) {}
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
      } catch (e) {}

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
      } catch (e) {}
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

  const handleExportPDF = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const element = document.getElementById('resume-preview-container');
      if (!element) return;

      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`CV_${resumeData.contact.fullName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
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
        onExportPDF={handleExportPDF}
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
        <div className="lg:col-span-7 lg:sticky lg:top-24 max-h-[88vh] overflow-y-auto rounded-2xl border border-indigo-100 bg-white shadow-2xl shadow-indigo-900/5 p-4 sm:p-6 custom-scrollbar flex justify-center relative">
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
